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
    const { transcript, sessionId, systemPrompt } = event.data;

    // 1. Rodar a Análise Pesada (Pipeline de IA)
    const analysisData = await step.run("ai-analysis-pipeline", async () => {
      // Pass the custom prompt if it exists
      return await analyzeSession(transcript, systemPrompt);
    });

    // 2. Salvar o Resultado Final na tabela correta
    await step.run("save-final-result", async () => {
      if (!supabase) throw new Error("Supabase is required to save results");
      
      const { error } = await supabase
        .from('mentorship_sessions')
        .update({
          analysis_result: analysisData,
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', sessionId);
        
      if (error) {
        console.error("Error inserting into mentorship_sessions:", error);
        throw new Error(`Failed to save analysis: ${error.message}`);
      }
    });

    return { success: true, sessionId };
  }
);
