import { analyzeSession } from '@/lib/ai/pipeline';
import { supabase } from '@/lib/supabase';
import { createHash } from 'crypto';

// Apenas para o cache check síncrono — curto o suficiente
export const maxDuration = 30;

function hashTranscript(transcript: string): string {
  return createHash('sha256').update(transcript.trim()).digest('hex');
}

export async function POST(req: Request) {
  const { transcript, mentor_id, mentee_name, topic, systemPrompt } = await req.json();

  if (!transcript || !mentor_id) {
    return Response.json({ error: 'Faltando dados obrigatórios' }, { status: 400 });
  }

  const transcriptHash = hashTranscript(transcript);

  // ── 1. Cache Check (instantâneo) ─────────────────────────────────────────
  if (supabase) {
    const { data: cached } = await supabase
      .from('mentorship_sessions')
      .select('analysis_result')
      .eq('transcript_hash', transcriptHash)
      .eq('status', 'completed')
      .not('analysis_result', 'is', null)
      .maybeSingle();

    if (cached?.analysis_result) {
      console.log(`[Cache HIT] ${transcriptHash.substring(0, 12)}…`);
      return Response.json({
        status: 'completed',
        analysis: cached.analysis_result,
        cached: true,
      });
    }
    console.log(`[Cache MISS] ${transcriptHash.substring(0, 12)}… — enfileirando no Inngest`);
  }

  // ── 2. Salvar sessão no Supabase ─────────────────────────────────────────
  if (!supabase) {
    return Response.json({ error: 'Supabase não configurado. Necessário para o modo async.' }, { status: 500 });
  }

  const { data: session, error: dbError } = await supabase
    .from('mentorship_sessions')
    .insert({
      mentor_id: mentor_id === 'test-mentor' ? 'test-mentor' : mentor_id,
      mentee_name,
      topic,
      transcript,
      transcript_hash: transcriptHash,
      status: 'pending',
    })
    .select('id')
    .single();

  if (dbError || !session) {
    console.error('Erro ao salvar sessão:', dbError);
    return Response.json({ error: `Erro de banco de dados: ${dbError?.message}` }, { status: 500 });
  }

  // ── 3. Disparar Inngest ───────────────────────────────────────────────────
  try {
    const { inngest } = await import('@/inngest/client');
    await inngest.send({
      name: 'mentorship/session.received',
      data: {
        transcript,
        sessionId: session.id,
        systemPrompt,
        transcriptHash,
      },
    });
  } catch (err: any) {
    console.error('Erro ao disparar Inngest:', err);
    // Marca como failed para não deixar em pending para sempre
    await supabase
      .from('mentorship_sessions')
      .update({ status: 'failed' })
      .eq('id', session.id);
    return Response.json({ error: `Erro ao enfileirar job: ${err.message}` }, { status: 500 });
  }

  // ── 4. Retornar sessionId para o frontend fazer polling ─────────────────
  return Response.json({
    status: 'queued',
    sessionId: session.id,
  });
}
