import { GoogleGenerativeAI } from "@google/generative-ai";
import { Analysis } from "../../src/lib/ai/schemas";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function judgeAnalysis(transcript: string, analysis: Analysis) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Você é um Auditor de Qualidade de IA Sênior. Sua tarefa é avaliar a precisão e utilidade de uma análise de mentoria.
    
    TRANSCRIÇÃO ORIGINAL:
    """
    ${transcript}
    """

    ANÁLISE GERADA PELA IA:
    """
    ${JSON.stringify(analysis, null, 2)}
    """

    AVALIE SEGUINDO ESTES CRITÉRIOS (0-10):
    1. Groundedness (Fidelidade): As citações ("context_snippet") existem literalmente no texto?
    2. Actionability (Praticidade): Os planos de ação são concretos ou genéricos?
    3. Sentiment Accuracy: O sentimento detectado condiz com o tom da conversa?

    Responda APENAS em JSON no formato:
    {
      "scores": { "groundedness": number, "actionability": number, "sentiment": number },
      "critique": "string",
      "hallucination_detected": boolean
    }
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return JSON.parse(response.text().replace(/```json|```/g, ""));
}
