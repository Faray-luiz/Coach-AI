import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { SYSTEM_PROMPT, getAnalysisPrompt } from "./prompts";
import { AnalysisSchema, type Analysis } from "./schemas";
import { getRelevantContext } from "./retrieval";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MAX_RETRIES = 2;

export async function analyzeSession(transcript: string, customPrompt?: string): Promise<Analysis> {
  let lastError: any;
  
      // 1. Retrieval Stage (Temporariamente desativado para isolar erro)
      // const context = await getRelevantContext(transcript);
      const context = "";
      
    // Trim transcript if it's too large (safety measure)
    const trimmedTranscript = transcript.length > 20000 
      ? transcript.substring(0, 20000) + "... [Truncated for processing]" 
      : transcript;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          if (attempt > 0) console.log(`Retry attempt ${attempt}...`);
          
          const prompt = getAnalysisPrompt(trimmedTranscript);
          
          // Enriquecendo o System Prompt (RAG desativado por enquanto)
          const activeSystemPrompt = customPrompt || SYSTEM_PROMPT;
    
          const model = genAI.getGenerativeModel({
            model: "gemini-2.5-pro",
            generationConfig: {
              maxOutputTokens: 2048,
              temperature: 0.1,
              responseMimeType: "application/json",
            },
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

          // Extrator robusto de JSON
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            text = jsonMatch[0];
          }
          
          let json;
          try {
            json = JSON.parse(text);
          } catch (parseError: any) {
            console.error("Erro no JSON. Texto recebido:", text);
            throw new Error(`JSON inválido: ${parseError.message}`);
          }
      
      // Data Normalization (Defense in Depth)
      if (json.dimensions) {
        Object.keys(json.dimensions).forEach(key => {
          if (typeof json.dimensions[key] === 'number') {
            json.dimensions[key] = Math.min(100, Math.max(0, json.dimensions[key]));
          }
        });
      }

      const validation = AnalysisSchema.safeParse(json);
      if (!validation.success) {
        console.error("Zod Validation Failed:", validation.error.issues);
        console.error("Problematic JSON:", JSON.stringify(json, null, 2));
        throw new Error(`Validation Error: ${validation.error.issues[0].message}`);
      }
      
      return validation.data;
    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error.message);
      // Wait a bit before retry (exponential backoff light)
      if (attempt < MAX_RETRIES) await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw new Error(`Falha persistente na análise após ${MAX_RETRIES} tentativas. Erro original: ${lastError.message}`);
}
