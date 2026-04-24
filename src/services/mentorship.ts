import { createHash } from 'crypto';
import { supabase } from '@/lib/supabase';
import { analyzeSession } from '@/lib/ai/pipeline';
import { Analysis } from '@/lib/ai/schemas';

export class MentorshipService {
  /**
   * Gera um hash único para a transcrição para fins de cache e idempotência.
   */
  static hashTranscript(transcript: string): string {
    return createHash('sha256').update(transcript.trim()).digest('hex');
  }

  /**
   * Busca uma análise já processada no banco de dados (Cache Layer).
   */
  static async getCachedAnalysis(hash: string): Promise<Analysis | null> {
    if (!supabase) return null;
    
    const { data } = await supabase
      .from('mentorship_sessions')
      .select('analysis_result')
      .eq('transcript_hash', hash)
      .eq('status', 'completed')
      .not('analysis_result', 'is', null)
      .maybeSingle();

    return data?.analysis_result as Analysis | null;
  }

  /**
   * Cria ou recupera uma sessão de mentoria.
   */
  static async startSession(params: {
    transcript: string;
    mentor_id: string;
    mentee_name: string;
    topic: string;
    hash: string;
  }) {
    if (!supabase) throw new Error('Supabase client missing');

    // Tenta encontrar uma sessão existente com esse hash
    const { data: existing } = await supabase
      .from('mentorship_sessions')
      .select('id, status')
      .eq('transcript_hash', params.hash)
      .maybeSingle();

    if (existing) return existing;

    // Se não existe, cria uma nova
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
  }

  /**
   * Orquestra a execução da análise via IA e atualiza o banco.
   */
  static async processAnalysis(sessionId: string, transcript: string, systemPrompt?: string): Promise<Analysis> {
    console.log(`[MentorshipService] Iniciando análise para sessão ${sessionId}`);
    
    try {
      const analysis = await analyzeSession(transcript, systemPrompt);

      if (supabase) {
        const { error } = await supabase
          .from('mentorship_sessions')
          .update({
            analysis_result: analysis,
            status: 'completed',
            processed_at: new Date().toISOString(),
          })
          .eq('id', sessionId);
          
        if (error) console.error(`[MentorshipService] Erro ao salvar resultado: ${error.message}`);
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
  }
}
