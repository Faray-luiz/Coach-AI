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
        .from('analyses')
        .insert({
          session_id: sessionId,
          mes_score: analysisData.mes_score,
          clarity_score: analysisData.dimensions.clarity,
          depth_score: analysisData.dimensions.depth,
          connection_score: analysisData.dimensions.connection,
          efficiency_score: analysisData.dimensions.efficiency,
          consistency_score: analysisData.dimensions.consistency,
          strengths: analysisData.strengths,
          improvements: analysisData.improvements,
          micro_adjustments: analysisData.micro_adjustments,
          conversation_blocks: analysisData.conversation_blocks,
          // golden_questions and red_flags aren't in initial schema, but keep them if added later
        });
        
      if (error) {
        console.error("Error inserting into analyses:", error);
        throw new Error(`Failed to save analysis: ${error.message}`);
      }
    });

    return { success: true, sessionId };
  }
);
