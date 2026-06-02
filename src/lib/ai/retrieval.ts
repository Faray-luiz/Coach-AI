import { supabase, checkSupabaseConnection } from "../supabase";
import { generateEmbedding } from "./embeddings";
import { MentorshipService, cosineSimilarity } from "../../services/mentorship";

/**
 * Busca pedaços de conhecimento relevantes para uma transcrição.
 * @param transcript A transcrição da sessão.
 * @returns Uma string contendo o contexto consolidado.
 */
export async function getRelevantContext(transcript: string): Promise<string> {
  try {
    // 1. Gerar embedding para a transcrição (ou parte dela)
    const queryEmbedding = await generateEmbedding(transcript.substring(0, 2000));
    const isOnline = await checkSupabaseConnection();

    let data: any[] = [];

    if (isOnline && supabase) {
      // 2. Buscar no Supabase usando a função RPC que criamos no SQL
      const { data: rpcData, error } = await supabase.rpc('match_knowledge', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5, // Similaridade mínima de 50%
        match_count: 5        // Trazer os 5 pedaços mais relevantes
      });

      if (error) {
        console.error("Erro na busca vetorial Supabase:", error.message);
      } else {
        data = rpcData || [];
      }
    }

    // Fallback: busca por similaridade vetorial em memória local
    if (data.length === 0) {
      const localChunks = await MentorshipService.getLocalKnowledge();
      data = localChunks
        .map((chunk: any) => ({
          id: chunk.id || Math.random().toString(),
          content: chunk.content,
          metadata: chunk.metadata,
          similarity: cosineSimilarity(queryEmbedding, chunk.embedding || [])
        }))
        .filter((chunk: any) => chunk.similarity > 0.5)
        .sort((a: any, b: any) => b.similarity - a.similarity)
        .slice(0, 5);
    }

    if (data.length === 0) {
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

