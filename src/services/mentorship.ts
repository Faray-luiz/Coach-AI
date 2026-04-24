import { createHash } from 'crypto';
import { supabase } from '@/lib/supabase';
import { analyzeSession } from '@/lib/ai/pipeline';
import { Analysis } from '@/lib/ai/schemas';
import { Logger } from '@/lib/logger';

/**
 * Serviço de domínio para gestão de sessões de mentoria.
 * Centraliza a lógica de cache, persistência e orquestração de IA.
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
   * Busca uma análise já concluída no cache do banco de dados.
   * @param hash O hash da transcrição.
   * @returns O resultado da análise ou null se não houver cache.
   */
  static async getCachedAnalysis(hash: string): Promise<Analysis | null> {
    return await Logger.trace("DB_Cache_Check", async () => {
      if (!supabase) return null;
      
      const { data } = await supabase
        .from('mentorship_sessions')
        .select('analysis_result')
        .eq('transcript_hash', hash)
        .eq('status', 'completed')
        .not('analysis_result', 'is', null)
        .maybeSingle();

      if (data) {
        Logger.info("Cache HIT", { transcript_hash: hash });
      } else {
        Logger.info("Cache MISS", { transcript_hash: hash });
      }

      return data?.analysis_result as Analysis | null;
    });
  }

  /**
   * Inicializa uma sessão de mentoria no banco de dados.
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
      if (!supabase) throw new Error('Supabase client missing');

      const { data: existing } = await supabase
        .from('mentorship_sessions')
        .select('id, status')
        .eq('transcript_hash', params.hash)
        .maybeSingle();

      if (existing) {
        Logger.info("Session already exists", { sessionId: existing.id });
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

      if (error) throw error;
      return session;
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

        if (supabase) {
          await Logger.trace("DB_Save_Result", async () => {
            const { error } = await supabase
              .from('mentorship_sessions')
              .update({
                analysis_result: analysis,
                status: 'completed',
                processed_at: new Date().toISOString(),
              })
              .eq('id', sessionId);
              
            if (error) throw error;
          });
        }

        return analysis;
      } catch (error) {
        if (supabase) {
          await supabase
            .from('mentorship_sessions')
            .update({ status: 'failed' })
            .eq('id', sessionId);
        }
        throw error;
      }
    }, { sessionId });
  }
}

