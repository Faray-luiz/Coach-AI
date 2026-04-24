-- Migration para habilitar RAG (Busca Vetorial) 🧠

-- 1. Habilitar a extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Criar a tabela de pedaços de conhecimento (chunks)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  embedding VECTOR(768), -- text-embedding-004 do Gemini usa 768 dimensões
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS (segurança)
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Política simples: permitir leitura para todos (ou ajustar conforme necessidade)
CREATE POLICY "Allow public read access to knowledge" 
  ON knowledge_chunks FOR SELECT 
  USING (true);

-- 4. Criar índice de busca vetorial (HNSW para performance)
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding 
  ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);

-- 5. Função RPC para busca por similaridade de cosseno
CREATE OR REPLACE FUNCTION match_knowledge (
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_chunks.id,
    knowledge_chunks.content,
    knowledge_chunks.metadata,
    1 - (knowledge_chunks.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks
  WHERE 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
