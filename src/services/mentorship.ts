import { createHash, randomUUID } from 'crypto';
import { supabase, checkSupabaseConnection } from '@/lib/supabase';
import { analyzeSession } from '@/lib/ai/pipeline';
import { Analysis } from '@/lib/ai/schemas';
import { Logger } from '@/lib/logger';
import fs from 'fs';
import path from 'path';

const LOCAL_DB_PATH = path.join(process.cwd(), 'local_database.json');

// Interface para estruturar o banco de dados JSON local
interface LocalDatabase {
  sessions: any[];
  knowledge_chunks: any[];
}

/**
 * Lê o banco de dados JSON local, criando-o com estrutura inicial caso não exista.
 */
function readLocalDb(): LocalDatabase {
  try {
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      const initial: LocalDatabase = { sessions: [], knowledge_chunks: [] };
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("[Local DB] Erro ao ler banco local:", error);
    return { sessions: [], knowledge_chunks: [] };
  }
}

/**
 * Grava dados no banco de dados JSON local.
 */
function writeLocalDb(data: LocalDatabase) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("[Local DB] Erro ao escrever no banco local:", error);
  }
}

/**
 * Calcula a similaridade de cosseno entre dois vetores numéricos.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    mA += a[i] * a[i];
    mB += b[i] * b[i];
  }
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  if (mA === 0 || mB === 0) return 0;
  return dotProduct / (mA * mB);
}

/**
 * Serviço de domínio para gestão de sessões de mentoria.
 * Centraliza a lógica de cache, persistência, orquestração de IA e fallback local.
 */
export class MentorshipService {
  /**
   * Gera um hash SHA-256 único para a transcrição.
   * Usado para identificar conteúdos idênticos e evitar re-processamento (Idempotência).
   */
  static hashTranscript(transcript: string): string {
    return createHash('sha256').update(transcript.trim()).digest('hex');
  }

  /**
   * Busca uma análise já concluída no cache do banco de dados (ou banco local).
   * @param hash O hash da transcrição.
   * @returns O resultado da análise ou null se não houver cache.
   */
  static async getCachedAnalysis(hash: string): Promise<Analysis | null> {
    return await Logger.trace("DB_Cache_Check", async () => {
      const isOnline = await checkSupabaseConnection();

      if (isOnline && supabase) {
        try {
          const { data } = await supabase
            .from('mentorship_sessions')
            .select('analysis_result')
            .eq('transcript_hash', hash)
            .eq('status', 'completed')
            .not('analysis_result', 'is', null)
            .maybeSingle();

          if (data) {
            Logger.info("Cache HIT (Supabase)", { transcript_hash: hash });
            return data.analysis_result as Analysis;
          }
        } catch (error: any) {
          console.warn("[Supabase] Falha ao consultar cache, tentando local...", error.message);
        }
      }

      // Fallback Local
      const db = readLocalDb();
      const cached = db.sessions.find(s => s.transcript_hash === hash && s.status === 'completed' && s.analysis_result);
      if (cached) {
        Logger.info("Cache HIT (Local DB)", { transcript_hash: hash });
        return cached.analysis_result as Analysis;
      }

      Logger.info("Cache MISS", { transcript_hash: hash });
      return null;
    });
  }

  /**
   * Inicializa uma sessão de mentoria no banco de dados (ou banco local).
   * Se já existir uma sessão com o mesmo hash, retorna a existente.
   */
  static async startSession(params: {
    transcript: string;
    mentor_id: string;
    mentee_name: string;
    topic: string;
    hash: string;
  }) {
    return await Logger.trace("DB_Start_Session", async () => {
      const isOnline = await checkSupabaseConnection();

      if (isOnline && supabase) {
        try {
          const { data: existing } = await supabase
            .from('mentorship_sessions')
            .select('id, status')
            .eq('transcript_hash', params.hash)
            .maybeSingle();

          if (existing) {
            Logger.info("Session already exists (Supabase)", { sessionId: existing.id });
            return existing;
          }

          const { data: session, error } = await supabase
            .from('mentorship_sessions')
            .insert({
              mentor_id: params.mentor_id,
              mentee_name: params.mentee_name,
              topic: params.topic,
              transcript: params.transcript,
              transcript_hash: params.hash,
              status: 'pending',
            })
            .select('id, status')
            .single();

          if (!error && session) return session;
          throw error;
        } catch (error: any) {
          console.warn("[Supabase] Falha ao iniciar sessão, tentando local...", error.message);
        }
      }

      // Fallback Local
      const db = readLocalDb();
      const existingLocal = db.sessions.find(s => s.transcript_hash === params.hash);
      if (existingLocal) {
        Logger.info("Session already exists (Local DB)", { sessionId: existingLocal.id });
        return { id: existingLocal.id, status: existingLocal.status };
      }

      // Criação da sessão em banco local
      const newSession = {
        id: randomUUID(),
        mentor_id: params.mentor_id,
        mentee_name: params.mentee_name,
        topic: params.topic,
        transcript: params.transcript,
        transcript_hash: params.hash,
        status: 'pending',
        created_at: new Date().toISOString(),
        processed_at: null,
        analysis_result: null
      };

      db.sessions.push(newSession);
      writeLocalDb(db);

      Logger.info("Created session in Local DB", { sessionId: newSession.id });
      return { id: newSession.id, status: newSession.status };
    });
  }

  /**
   * Orquestra o processamento da análise via IA e atualiza o status final.
   * @param sessionId ID da sessão no banco.
   * @param transcript Texto da transcrição.
   * @param systemPrompt Prompt opcional para customizar a IA.
   */
  static async processAnalysis(sessionId: string, transcript: string, systemPrompt?: string): Promise<Analysis> {
    return await Logger.trace("Domain_Process_Analysis", async () => {
      Logger.info(`Processing analysis`, { sessionId });
      
      try {
        const analysis = await analyzeSession(transcript, systemPrompt);
        const isOnline = await checkSupabaseConnection();

        if (isOnline && supabase) {
          try {
            const { error } = await supabase
              .from('mentorship_sessions')
              .update({
                analysis_result: analysis,
                status: 'completed',
                processed_at: new Date().toISOString(),
              })
              .eq('id', sessionId);
              
            if (!error) return analysis;
            throw error;
          } catch (dbError: any) {
            console.warn("[Supabase] Falha ao atualizar análise no banco online, salvando no local...", dbError.message);
          }
        }

        // Salvar localmente
        const db = readLocalDb();
        const index = db.sessions.findIndex(s => s.id === sessionId);
        if (index !== -1) {
          db.sessions[index].analysis_result = analysis;
          db.sessions[index].status = 'completed';
          db.sessions[index].processed_at = new Date().toISOString();
          writeLocalDb(db);
          Logger.info("Saved analysis to Local DB", { sessionId });
        } else {
          // Se por algum motivo a sessão pendente não foi salva antes, criamos agora
          const hash = this.hashTranscript(transcript);
          db.sessions.push({
            id: sessionId,
            mentor_id: 'test-mentor',
            mentee_name: 'Mentorado',
            topic: 'Sessão de Mentoria',
            transcript,
            transcript_hash: hash,
            status: 'completed',
            created_at: new Date().toISOString(),
            processed_at: new Date().toISOString(),
            analysis_result: analysis
          });
          writeLocalDb(db);
        }

        return analysis;
      } catch (error) {
        const isOnline = await checkSupabaseConnection();
        if (isOnline && supabase) {
          try {
            await supabase
              .from('mentorship_sessions')
              .update({ status: 'failed' })
              .eq('id', sessionId);
          } catch (e) {}
        }

        // Atualizar status local para falhado
        const db = readLocalDb();
        const index = db.sessions.findIndex(s => s.id === sessionId);
        if (index !== -1) {
          db.sessions[index].status = 'failed';
          writeLocalDb(db);
        }
        
        throw error;
      }
    }, { sessionId });
  }

  /**
   * Retorna todas as sessões de mentoria gravadas (do Supabase ou banco local).
   */
  static async getAllSessions(): Promise<any[]> {
    const isOnline = await checkSupabaseConnection();

    if (isOnline && supabase) {
      try {
        const { data, error } = await supabase
          .from('mentorship_sessions')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) return data;
      } catch (error: any) {
        console.warn("[Supabase] Falha ao listar sessões, listando locais...", error.message);
      }
    }

    // Fallback Local
    const db = readLocalDb();
    return [...db.sessions].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Deleta todas as sessões cadastradas no banco ou fallback local.
   */
  static async deleteAllSessions(): Promise<void> {
    const isOnline = await checkSupabaseConnection();
    
    if (isOnline && supabase) {
      try {
        const { error } = await supabase
          .from('mentorship_sessions')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (!error) return;
      } catch (error: any) {
        console.warn("[Supabase] Falha ao deletar sessões no banco online...", error.message);
      }
    }

    // Limpar Local
    const db = readLocalDb();
    db.sessions = [];
    writeLocalDb(db);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Métodos Auxiliares para a Base de Conhecimento (RAG) em modo Local
  // ─────────────────────────────────────────────────────────────────────────────

  static async getLocalKnowledge(): Promise<any[]> {
    const db = readLocalDb();
    return db.knowledge_chunks;
  }

  static async insertLocalKnowledge(chunks: any[]): Promise<void> {
    const db = readLocalDb();
    db.knowledge_chunks.push(...chunks);
    writeLocalDb(db);
  }

  static async deleteLocalKnowledge(filename: string): Promise<void> {
    const db = readLocalDb();
    db.knowledge_chunks = db.knowledge_chunks.filter(c => c.metadata?.filename !== filename);
    writeLocalDb(db);
  }
}
