import { inngest } from "./client";
import { analyzeSession } from "@/lib/ai/pipeline";
import { supabase } from "@/lib/supabase";

export const processMentorshipAnalysis = inngest.createFunction(
  { 
    id: "analyze-mentorship-session", 
    retries: 3,
    triggers: [{ event: "mentorship/session.received" }]
  },
  async ({ event, step }) => {
    const { transcript, sessionId, mentorId } = event.data;

    // 1. Marcar como "Processando" no Banco (Opcional, se tiver tabela)
    await step.run("update-status-processing", async () => {
      if (!supabase) return;
      await supabase
        .from('mentorship_sessions')
        .update({ status: 'processing' })
        .eq('id', sessionId);
    });

    // 2. Rodar a Análise Pesada (Pipeline de IA)
    const analysis = await step.run("ai-analysis-pipeline", async () => {
      return await analyzeSession(transcript);
    });

    // 3. Salvar o Resultado Final
    await step.run("save-final-result", async () => {
      if (!supabase) return;
      await supabase
        .from('mentorship_sessions')
        .update({ 
          analysis_result: analysis,
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', sessionId);
    });

    return { success: true, sessionId };
  }
);
