-- 1. Habilitar a extensão de vetores
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Criar a tabela para a base de conhecimento
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(768), -- 768 dimensões para o modelo text-embedding-004 do Google
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar a função de busca por similaridade (Cosseno)
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

-- 4. Criar um índice para buscas rápidas (Opcional, mas recomendado para muitos dados)
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx ON knowledge_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
