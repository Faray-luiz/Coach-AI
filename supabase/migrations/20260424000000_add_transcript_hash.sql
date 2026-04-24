-- Adiciona coluna de hash para cache de transcrições
ALTER TABLE mentorship_sessions 
  ADD COLUMN IF NOT EXISTS transcript_hash TEXT;

-- Índice único para busca rápida por hash (garante deduplicação também)
CREATE UNIQUE INDEX IF NOT EXISTS idx_mentorship_sessions_transcript_hash 
  ON mentorship_sessions(transcript_hash)
  WHERE status = 'completed';

-- Comentário explicativo
COMMENT ON COLUMN mentorship_sessions.transcript_hash IS 
  'SHA-256 hash da transcrição. Usado para cache: evita re-processar transcrições já analisadas.';
