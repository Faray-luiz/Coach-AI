-- Phase 3: Performance & Security Hardening 🚀

-- 1. Garante que o status seja sempre um valor válido (Robustez de Dados)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_status_values') THEN
    ALTER TABLE mentorship_sessions 
      ADD CONSTRAINT check_status_values 
      CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
  END IF;
END $$;

-- 2. Índices de Alta Performance (Escalabilidade)
-- Otimiza o carregamento do Dashboard (sessions filtradas por mentor e ordenadas por data)
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_mentor_date 
  ON mentorship_sessions(mentor_id, created_at DESC);

-- Índice para busca rápida de sessões falhas (para limpeza ou re-processamento)
CREATE INDEX IF NOT EXISTS idx_mentorship_sessions_failed 
  ON mentorship_sessions(status) 
  WHERE status = 'failed';

-- 3. Row Level Security (RLS) - Segurança Estado da Arte
-- Garante que um mentor só possa ver/editar as suas próprias análises
ALTER TABLE mentorship_sessions ENABLE ROW LEVEL SECURITY;

-- Política: Mentores podem ver apenas suas próprias sessões
-- (Nota: Assume que o mentor_id no banco coincide com o sub do JWT do Supabase Auth)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Mentors can see their own sessions') THEN
    CREATE POLICY "Mentors can see their own sessions" 
      ON mentorship_sessions 
      FOR SELECT 
      USING (auth.uid()::text = mentor_id::text);
  END IF;
END $$;

-- Política: Mentores podem inserir novas sessões (associadas ao seu ID)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Mentors can insert their own sessions') THEN
    CREATE POLICY "Mentors can insert their own sessions" 
      ON mentorship_sessions 
      FOR INSERT 
      WITH CHECK (auth.uid()::text = mentor_id::text);
  END IF;
END $$;

-- 4. Função para atualização automática de timestamps (Updated At)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Garante que a coluna updated_at existe
ALTER TABLE mentorship_sessions 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Trigger para updated_at
DROP TRIGGER IF EXISTS set_updated_at ON mentorship_sessions;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON mentorship_sessions
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
