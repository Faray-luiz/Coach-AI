import { inngest } from './client';
import { MentorshipService } from '@/services/mentorship';
import { supabase, checkSupabaseConnection } from '@/lib/supabase';

export const processMentorshipAnalysis = inngest.createFunction(
  {
    id: 'analyze-mentorship-session',
    retries: 2,
    timeouts: { finish: '10m' },
    triggers: [{ event: 'mentorship/session.received' }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    // Evento carrega apenas o sessionId — transcript e systemPrompt vêm do banco.
    const { sessionId } = event.data as { sessionId: string };

    // 1. Marca como 'processing'
    await step.run('update-status-processing', async () => {
      const isOnline = await checkSupabaseConnection();
      if (!isOnline || !supabase) return;
      const { error } = await supabase
        .from('mentorship_sessions')
        .update({ status: 'processing' })
        .eq('id', sessionId);
      if (error) console.warn('[Inngest] Falha ao marcar processing:', error.message);
    });

    // 2. Busca transcript e system_prompt do banco em um único query
    const sessionData = await step.run('fetch-session-data', async () => {
      if (!supabase) throw new Error('Supabase não configurado');
      const { data, error } = await supabase
        .from('mentorship_sessions')
        .select('transcript, system_prompt')
        .eq('id', sessionId)
        .single();
      if (error || !data?.transcript) {
        throw new Error('Dados da sessão não encontrados: ' + sessionId);
      }
      return { transcript: data.transcript as string, systemPrompt: data.system_prompt as string | null };
    });

    // 3. Executa a análise
    const analysis = await step.run('run-ai-analysis', async () => {
      return await MentorshipService.processAnalysis(
        sessionId,
        sessionData.transcript,
        sessionData.systemPrompt ?? undefined,
      );
    });

    return { success: true, sessionId, stats: { talk_time: analysis.talk_time } };
  }
);

export const handleAnalysisFailure = inngest.createFunction(
  {
    id: 'handle-analysis-failure',
    triggers: [{ event: 'inngest/function.failed' }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const failedEvent = event.data?.event;
    if (failedEvent?.name !== 'mentorship/session.received') return;

    const sessionId = failedEvent.data?.sessionId;
    if (!sessionId) return;

    await step.run('mark-failed', async () => {
      const isOnline = await checkSupabaseConnection();
      if (!isOnline || !supabase) return;
      await supabase
        .from('mentorship_sessions')
        .update({ status: 'failed' })
        .eq('id', sessionId);
    });
  }
);
