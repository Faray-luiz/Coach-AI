-- Armazena o system prompt customizado junto com a sessão,
-- permitindo que o job Inngest o busque do banco em vez de recebê-lo no evento.
ALTER TABLE mentorship_sessions
  ADD COLUMN IF NOT EXISTS system_prompt TEXT;
