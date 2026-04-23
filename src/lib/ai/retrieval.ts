import { supabase } from "../supabase";
import { generateEmbedding } from "./embeddings";

/**
 * Busca pedaços de conhecimento relevantes para uma transcrição.
 * @param transcript A transcrição da sessão.
 * @returns Uma string contendo o contexto consolidado.
 */
export async function getRelevantContext(transcript: string): Promise<string> {
  if (!supabase) return "";

  try {
    // 1. Gerar embedding para a transcrição (ou parte dela)
    // Para RAG, geralmente pegamos um resumo ou os últimos trechos,
    // mas aqui usaremos a transcrição completa (limitada) para a busca.
    const queryEmbedding = await generateEmbedding(transcript.substring(0, 2000));

    // 2. Buscar no Supabase usando a função RPC que criamos no SQL
    const { data, error } = await supabase.rpc('match_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5, // Similaridade mínima de 50%
      match_count: 5        // Trazer os 5 pedaços mais relevantes
    });

    if (error) {
      console.error("Erro na busca vetorial:", error.message);
      return "";
    }

    if (!data || data.length === 0) {
      return "";
    }

    // 3. Consolidar os resultados em uma string de contexto
    const context = data
      .map((chunk: any) => `CONTEXTO (ID: ${chunk.id}):\n${chunk.content}`)
      .join("\n\n---\n\n");

    return context;
  } catch (error) {
    console.error("Falha no processo de Retrieval:", error);
    return "";
  }
}
