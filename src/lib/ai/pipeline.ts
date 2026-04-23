import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { SYSTEM_PROMPT, getAnalysisPrompt } from "./prompts";
import { AnalysisSchema, type Analysis } from "./schemas";
import { getRelevantContext } from "./retrieval";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MAX_RETRIES = 2;

export async function analyzeSession(transcript: string, customPrompt?: string): Promise<Analysis> {
  let lastError: any;
  
  // 1. Retrieval Stage (Buscando conhecimento relevante)
  const context = await getRelevantContext(transcript);
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) console.log(`Retry attempt ${attempt}...`);
      
      const prompt = getAnalysisPrompt(transcript);
      
      // Enriquecendo o System Prompt com o contexto do RAG
      const baseSystemPrompt = customPrompt || SYSTEM_PROMPT;
      const activeSystemPrompt = context 
        ? `${baseSystemPrompt}\n\nUSE O CONTEXTO ABAIXO COMO REFERÊNCIA PARA A ANÁLISE:\n${context}`
        : baseSystemPrompt;

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          maxOutputTokens: 8192,
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
      
      if (!text) throw new Error("Empty AI response");

      // Limpeza de Markdown (caso o modelo ignore o responseMimeType)
      text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
      
      let json;
      try {
        json = JSON.parse(text);
      } catch (parseError: any) {
        console.error("Failed to parse JSON. Position:", parseError.message);
        console.error("Raw text (first 500 chars):", text.substring(0, 500));
        console.error("Raw text (last 500 chars):", text.substring(text.length - 500));
        
        // Tentativa desesperada de fechar um JSON truncado
        if (text.length > 1000 && !text.endsWith("}")) {
            try {
                // Tenta fechar aspas e chaves caso tenha sido truncado no meio de uma string
                const repairedText = text + '"}]}'; 
                json = JSON.parse(repairedText);
                console.warn("JSON was repaired successfully.");
            } catch (e) {
                throw new Error(`JSON malformado ou truncado. Erro: ${parseError.message}`);
            }
        } else {
            throw new Error(`Erro ao processar JSON da IA: ${parseError.message}`);
        }
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
