import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT, getAnalysisPrompt } from "./prompts";
import { AnalysisSchema, type Analysis } from "./schemas";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function analyzeSession(transcript: string): Promise<Analysis> {
  const prompt = getAnalysisPrompt(transcript);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      systemInstruction: SYSTEM_PROMPT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    const parsed = JSON.parse(text);
    
    // Validate with Zod
    return AnalysisSchema.parse(parsed);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw new Error("Falha ao analisar a sessão de mentoria.");
  }
}
