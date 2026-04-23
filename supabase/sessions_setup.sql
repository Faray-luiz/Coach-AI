-- Tabela para rastrear as sessões de mentoria e suas análises
CREATE TABLE IF NOT EXISTS mentorship_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id TEXT,
  mentee_name TEXT,
  topic TEXT,
  transcript TEXT NOT NULL,
  analysis_result JSONB, -- Onde guardamos o JSON da Simi
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS (Row Level Security) se desejar, por enquanto deixaremos aberto para teste
ALTER TABLE mentorship_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para testes" ON mentorship_sessions FOR ALL USING (true);
