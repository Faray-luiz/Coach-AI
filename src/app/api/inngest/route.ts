import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processMentorshipAnalysis, handleAnalysisFailure } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processMentorshipAnalysis,
    handleAnalysisFailure,
  ],
});
