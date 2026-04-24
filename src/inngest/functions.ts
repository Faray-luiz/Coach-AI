import { inngest } from './client';
import { analyzeSession } from '@/lib/ai/pipeline';
import { supabase } from '@/lib/supabase';

export const processMentorshipAnalysis = inngest.createFunction(
  {
    id: 'analyze-mentorship-session',
    retries: 2,
    // Timeout de 10 minutos — bem acima de qualquer timeout da Vercel
    timeouts: { finish: '10m' },
  },
  { event: 'mentorship/session.received' },
  async ({ event, step }) => {
    const { transcript, sessionId, systemPrompt, transcriptHash } = event.data;

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
  { id: 'handle-analysis-failure' },
  { event: 'inngest/function.failed' },
  async ({ event, step }) => {
    const failedEvent = event.data.event;
    if (failedEvent.name !== 'mentorship/session.received') return;

    const sessionId = failedEvent.data?.sessionId;
    if (!sessionId || !supabase) return;

    await step.run('mark-failed', async () => {
      await supabase
        .from('mentorship_sessions')
        .update({ status: 'failed' })
        .eq('id', sessionId);
    });
  }
);
