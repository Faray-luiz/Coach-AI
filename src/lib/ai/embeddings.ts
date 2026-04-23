import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Gera um vetor (embedding) para um texto usando o modelo oficial do Google.
 * @param text Texto para transformar em vetor.
 * @returns Array de números (768 dimensões).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error: any) {
    console.error("Erro ao gerar embedding:", error.message);
    throw new Error(`Falha no embedding: ${error.message}`);
  }
}

/**
 * Utilitário para gerar embeddings em lote (opcional para uploads grandes).
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.batchEmbedContents({
      requests: texts.map(t => ({ content: { role: 'user', parts: [{ text: t }] } }))
    });
    return result.embeddings.map(e => e.values);
  } catch (error: any) {
    console.error("Erro no batch embedding:", error);
    throw error;
  }
}
