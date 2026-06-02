import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { SYSTEM_PROMPT, getAnalysisPrompt } from "./prompts";
import { AnalysisSchema, type Analysis } from "./schemas";
import { Logger } from "@/lib/logger";
import { getRelevantContext } from "./retrieval";
import { cleanTranscript, smartSampleTranscript } from "./utils";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const MAX_RETRIES = 3;

function isRateLimitError(err: any): boolean {
  const msg = (err?.message || '').toLowerCase();
  return msg.includes('429') || msg.includes('quota') || msg.includes('resource_exhausted') || msg.includes('rate');
}

function backoffMs(attempt: number, rateLimit: boolean): number {
  if (rateLimit) return 30_000 + Math.random() * 10_000; // 30–40 s
  return Math.min(500 * Math.pow(2, attempt) + Math.random() * 500, 10_000); // exp: 500ms→1s→2s→…→10s
}

/**
 * Pipeline principal de análise de mentoria.
 *
 * @param transcript   Texto bruto da conversa (pode ser grande).
 * @param customPrompt Prompt de sistema customizado (opcional).
 * @param options      fullCoverage: true → envia a transcrição completa sem truncagem
 *                     (usar no path Inngest onde não há limite de 60s).
 *                     false/omitido → Smart Sampling 40/20/40 para path síncrono.
 */
export async function analyzeSession(
  transcript: string,
  customPrompt?: string,
  options?: { fullCoverage?: boolean },
): Promise<Analysis> {
  return await Logger.trace("AI_Analysis_Pipeline", async () => {
    // 1. Retrieval Stage (RAG)
    // Busca contexto relevante na base de conhecimento para enriquecer a análise.
    const context = await getRelevantContext(transcript);
    
    let lastError: any;
    
    // 1b. Limpeza de formato incremental STT (ex: Google Captions)
    // Remove repetições do tipo "Oi Oi lara Oi lara tudo bem" → "Oi lara tudo bem"
    const cleanedTranscript = cleanTranscript(transcript);
    Logger.info('Transcript cleaned', {
      original_length: transcript.length,
      cleaned_length: cleanedTranscript.length,
      reduction_pct: Math.round((1 - cleanedTranscript.length / transcript.length) * 100),
    });

    // Define o limite de caracteres baseado na opção de cobertura
    const characterLimit = options?.fullCoverage ? 1_000_000 : 30_000;

    const trimmedTranscript = cleanedTranscript.length > characterLimit
      ? (options?.fullCoverage
          ? cleanedTranscript.substring(0, characterLimit) + "\n... [Transcrição truncada]"
          : smartSampleTranscript(cleanedTranscript, characterLimit))
      : cleanedTranscript;

    // Loop de Retentativa com Backoff Exponencial leve
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const basePrompt = getAnalysisPrompt(trimmedTranscript);
        
        // Injeta contexto do RAG no início do prompt se disponível
        const prompt = context 
          ? `CONHECIMENTO PRÉVIO RELEVANTE:\n${context}\n\n---\n\n${basePrompt}`
          : basePrompt;
        const activeSystemPrompt = customPrompt || SYSTEM_PROMPT;

        Logger.info(`Starting Gemini analysis attempt ${attempt}`, {
          transcript_length: transcript.length,
          trimmed_length: trimmedTranscript.length,
          model: "gemini-3.5-flash"
        });

        const model = genAI.getGenerativeModel({
          model: "gemini-3.5-flash",
          generationConfig: { maxOutputTokens: 8192, temperature: 0.1 },
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ],
          systemInstruction: activeSystemPrompt,
        });

        // 2. Geração de Conteúdo
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        if (!text) throw new Error("IA retornou resposta vazia");

        Logger.info("AI raw response received", { response_length: text.length });

        // 3. Extração e Limpeza de JSON
        // O Gemini às vezes inclui markdown (```json). Extraímos apenas o objeto.
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
          // Tentativa de reparo heurístico para JSONs truncados
          try {
            json = JSON.parse(text + '"}]}');
            Logger.warn("JSON was truncated and manually repaired");
          } catch (e) {
            throw new Error(`JSON inválido: ${parseError.message}`);
          }
        }
    
        // 4. Normalização e Validação
        // Garante que scores estejam entre 0 e 100 e segue o esquema Zod.
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
        Logger.warn(`Attempt ${attempt} failed`, { error: error.message, isRateLimit: isRateLimitError(error) });
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, backoffMs(attempt, isRateLimitError(error))));
        }
      }
    }

    throw new Error(`Falha persistente na análise após ${MAX_RETRIES} tentativas. Erro original: ${lastError?.message || 'Erro desconhecido'}`);
  });
}

