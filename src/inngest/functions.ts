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
    const { transcript, sessionId, systemPrompt } = event.data;

    // 1. Marca como 'processing' — só tenta se Supabase estiver acessível
    await step.run('update-status-processing', async () => {
      const isOnline = await checkSupabaseConnection();
      if (!isOnline || !supabase) return;
      const { error } = await supabase
        .from('mentorship_sessions')
        .update({ status: 'processing' })
        .eq('id', sessionId);
      if (error) console.warn('[Inngest] Falha ao marcar processing:', error.message);
    });

    // 2. Executa a análise via Serviço (já tem fallback local interno)
    const analysis = await step.run('run-ai-analysis', async () => {
      return await MentorshipService.processAnalysis(sessionId, transcript, systemPrompt);
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
