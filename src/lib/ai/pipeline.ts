import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { SYSTEM_PROMPT, getAnalysisPrompt } from "./prompts";
import { AnalysisSchema, type Analysis } from "./schemas";
import { Logger } from "@/lib/logger";
import { getRelevantContext } from "./retrieval";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const MAX_RETRIES = 2;

export async function analyzeSession(transcript: string, customPrompt?: string): Promise<Analysis> {
  return await Logger.trace("AI_Analysis_Pipeline", async () => {
    // 1. Retrieval Stage (RAG Ativo)
    const context = await getRelevantContext(transcript);
    
    let lastError: any;
    const trimmedTranscript = transcript.length > 20000 
      ? transcript.substring(0, 20000) + "... [Truncated]" 
      : transcript;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const basePrompt = getAnalysisPrompt(trimmedTranscript);
        
        // Injeta contexto se existir
        const prompt = context 
          ? `CONHECIMENTO PRÉVIO RELEVANTE:\n${context}\n\n---\n\n${basePrompt}`
          : basePrompt;
        const activeSystemPrompt = customPrompt || SYSTEM_PROMPT;

        Logger.info(`Starting Gemini analysis attempt ${attempt}`, {
          transcript_length: transcript.length,
          trimmed_length: trimmedTranscript.length,
          model: "gemini-3.1-pro-preview"
        });

        const model = genAI.getGenerativeModel({
          model: "gemini-3.1-pro-preview",
          generationConfig: { maxOutputTokens: 8192, temperature: 0.1 },
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ],
          systemInstruction: activeSystemPrompt,
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        if (!text) throw new Error("IA retornou resposta vazia");

        Logger.info("AI raw response received", { response_length: text.length });

        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        
        if (start === -1 || end === -1) {
          throw new Error("Resposta da IA não contém um objeto JSON válido");
        }
        
        text = text.substring(start, end + 1);
        
        let json;
        try {
          json = JSON.parse(text);
        } catch (parseError: any) {
          try {
            json = JSON.parse(text + '"}]}');
            Logger.warn("JSON was truncated and manually repaired");
          } catch (e) {
            throw new Error(`JSON inválido: ${parseError.message}`);
          }
        }
    
        // Data Normalization
        if (json.dimensions) {
          Object.keys(json.dimensions).forEach(key => {
            if (typeof (json.dimensions as any)[key] === 'number') {
              (json.dimensions as any)[key] = Math.min(100, Math.max(0, (json.dimensions as any)[key]));
            }
          });
        }

        const validation = AnalysisSchema.safeParse(json);
        if (!validation.success) {
          Logger.error("Zod Validation Failed", validation.error.issues, { json_received: json });
          throw new Error(`Validation Error: ${validation.error.issues[0].message}`);
        }
        
        return validation.data;
      } catch (error: any) {
        lastError = error;
        Logger.warn(`Attempt ${attempt} failed`, { error: error.message });
        if (attempt < MAX_RETRIES) await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw new Error(`Falha persistente na análise após ${MAX_RETRIES} tentativas. Erro original: ${lastError?.message || 'Erro desconhecido'}`);
  });
}

