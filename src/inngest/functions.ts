import { inngest } from './client';
import { analyzeSession } from '@/lib/ai/pipeline';
import { supabase } from '@/lib/supabase';

// Inngest v4: createFunction(config, handler)
// triggers vão dentro do config, não como segundo argumento separado

export const processMentorshipAnalysis = inngest.createFunction(
  {
    id: 'analyze-mentorship-session',
    retries: 2,
    timeouts: { finish: '10m' },
    triggers: [{ event: 'mentorship/session.received' }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { transcript, sessionId, systemPrompt } = event.data;

    // Marca como 'processing' assim que o job começa
    await step.run('mark-processing', async () => {
      if (!supabase) throw new Error('Supabase não configurado');
      await supabase
        .from('mentorship_sessions')
        .update({ status: 'processing' })
        .eq('id', sessionId);
    });

    // Roda a IA (passo durável — se falhar aqui, o Inngest retenta este passo)
    const analysisData = await step.run('ai-analysis', async () => {
      return await analyzeSession(transcript, systemPrompt);
    });

    // Persiste o resultado final
    await step.run('save-result', async () => {
      if (!supabase) throw new Error('Supabase não configurado');

      const { error } = await supabase
        .from('mentorship_sessions')
        .update({
          analysis_result: analysisData,
          status: 'completed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw new Error(`Falha ao salvar resultado: ${error.message}`);
    });

    return { success: true, sessionId };
  }
);

// Handler de falha: marca a sessão como 'failed' no Supabase
export const handleAnalysisFailure = inngest.createFunction(
  {
    id: 'handle-analysis-failure',
    triggers: [{ event: 'inngest/function.failed' }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const failedEvent = event.data?.event;
    if (failedEvent?.name !== 'mentorship/session.received') return;

    const sessionId = failedEvent.data?.sessionId;
    if (!sessionId || !supabase) return;

    await step.run('mark-failed', async () => {
      await supabase!
        .from('mentorship_sessions')
        .update({ status: 'failed' })
        .eq('id', sessionId);
    });
  }
);
