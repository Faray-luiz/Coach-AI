import { supabase, checkSupabaseConnection } from "../supabase";
import { generateEmbeddingsBatch } from "./embeddings";
import { MentorshipService, cosineSimilarity } from "../../services/mentorship";

/**
 * Extrai 3 segmentos representativos de uma transcrição (início, meio, fim).
 * Isso garante que o RAG capture o contexto de toda a sessão, não só a abertura.
 */
function extractTranscriptSegments(transcript: string, maxCharsPerSegment = 800): string[] {
  const len = transcript.length;
  if (len <= maxCharsPerSegment) return [transcript];

  const beginning = transcript.substring(0, maxCharsPerSegment);
  const midStart = Math.floor(len / 2) - Math.floor(maxCharsPerSegment / 2);
  const middle = transcript.substring(midStart, midStart + maxCharsPerSegment);
  const end = transcript.substring(len - maxCharsPerSegment);

  // Deduplica se a transcrição for curta o suficiente para segmentos se repetirem
  const seen = new Set<string>();
  return [beginning, middle, end].filter(s => {
    if (seen.has(s)) return false;
    seen.add(s);
    return true;
  });
}

/**
 * Busca pedaços de conhecimento relevantes para uma transcrição.
 * Usa múltiplos segmentos (início, meio, fim) para cobrir toda a sessão.
 * @param transcript A transcrição da sessão.
 * @returns Uma string contendo o contexto consolidado.
 */
export async function getRelevantContext(transcript: string): Promise<string> {
  try {
    // 1. Extrair segmentos e gerar embeddings em batch
    const segments = extractTranscriptSegments(transcript);
    const embeddings = await generateEmbeddingsBatch(segments);
    const isOnline = await checkSupabaseConnection();

    let allChunks: any[] = [];

    if (isOnline && supabase) {
      // 2. Buscar no Supabase para cada segmento e acumular resultados
      for (const embedding of embeddings) {
        const { data, error } = await supabase.rpc('match_knowledge', {
          query_embedding: embedding,
          match_threshold: 0.5,
          match_count: 5
        });

        if (error) {
          console.error("Erro na busca vetorial Supabase:", error.message);
        } else if (data) {
          allChunks.push(...data);
        }
      }
    }

    // Fallback: busca por similaridade vetorial em memória local
    if (allChunks.length === 0) {
      const localChunks = await MentorshipService.getLocalKnowledge();
      allChunks = localChunks.map((chunk: any) => ({
        id: chunk.id || Math.random().toString(),
        content: chunk.content,
        metadata: chunk.metadata,
        // Usa a maior similaridade entre todos os segmentos
        similarity: Math.max(...embeddings.map(emb => cosineSimilarity(emb, chunk.embedding || [])))
      })).filter((chunk: any) => chunk.similarity > 0.5);
    }

    if (allChunks.length === 0) return "";

    // 3. Deduplicar por ID mantendo a maior similaridade, ordenar e limitar a 5
    const seen = new Map<string, any>();
    for (const chunk of allChunks) {
      const existing = seen.get(chunk.id);
      if (!existing || existing.similarity < chunk.similarity) {
        seen.set(chunk.id, chunk);
      }
    }

    const topChunks = Array.from(seen.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    // 4. Consolidar em string de contexto
    return topChunks
      .map((chunk: any) => `CONTEXTO (ID: ${chunk.id}):\n${chunk.content}`)
      .join("\n\n---\n\n");

  } catch (error) {
    console.error("Falha no processo de Retrieval:", error);
    return "";
  }
}
