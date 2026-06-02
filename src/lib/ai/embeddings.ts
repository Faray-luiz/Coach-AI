import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const EMBEDDING_MODEL = "models/gemini-embedding-001";
const OUTPUT_DIM = 3072;

/**
 * Gera um vetor (embedding) para um texto.
 * @returns Array de números (3072 dimensões).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent({
      content: { role: 'user', parts: [{ text }] },
      outputDimensionality: OUTPUT_DIM,
    } as any);
    return result.embedding.values;
  } catch (error: any) {
    console.error("Erro ao gerar embedding:", error.message);
    throw new Error(`Falha no embedding: ${error.message}`);
  }
}

/**
 * Gera embeddings em lote.
 * Se o batch completo falhar, faz fallback para chamadas individuais
 * para não descartar todos os itens por causa de um único problemático.
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  try {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.batchEmbedContents({
      requests: texts.map(t => ({
        content: { role: 'user', parts: [{ text: t }] },
        outputDimensionality: OUTPUT_DIM,
      } as any)),
    });
    return result.embeddings.map(e => e.values);
  } catch (batchError: any) {
    console.warn("[Embeddings] Batch falhou, tentando item-a-item:", batchError.message);

    // Fallback: gera um por um, substituindo falhas por vetor zero para não travar o fluxo
    const results: number[][] = [];
    for (let i = 0; i < texts.length; i++) {
      try {
        results.push(await generateEmbedding(texts[i]));
      } catch (itemError: any) {
        console.error(`[Embeddings] Item ${i} também falhou:`, itemError.message);
        results.push(new Array(OUTPUT_DIM).fill(0)); // vetor zero — será filtrado pelo threshold
      }
    }
    return results;
  }
}
