import { analyzeSession } from '@/lib/ai/pipeline';
import { supabase } from '@/lib/supabase';
import { createHash } from 'crypto';

// Vercel Pro: até 300s. Free tier: 60s.
export const maxDuration = 300;

function hashTranscript(transcript: string): string {
  return createHash('sha256').update(transcript.trim()).digest('hex');
}

export async function POST(req: Request) {
  const { transcript, mentor_id, mentee_name, topic, systemPrompt } = await req.json();

  if (!transcript || !mentor_id) {
    return new Response(JSON.stringify({ error: 'Faltando dados obrigatórios' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const transcriptHash = hashTranscript(transcript);

  // ── Cache Check ─────────────────────────────────────────────────────────────
  if (supabase) {
    const { data: cached } = await supabase
      .from('mentorship_sessions')
      .select('analysis_result')
      .eq('transcript_hash', transcriptHash)
      .eq('status', 'completed')
      .not('analysis_result', 'is', null)
      .maybeSingle();

    if (cached?.analysis_result) {
      console.log(`[Cache HIT] hash=${transcriptHash.substring(0, 12)}…`);
      return new Response(
        JSON.stringify({ status: 'completed', analysis: cached.analysis_result, cached: true }) + '\n',
        {
          headers: {
            'Content-Type': 'application/x-ndjson',
            'Cache-Control': 'no-cache',
          },
        }
      );
    }
    console.log(`[Cache MISS] hash=${transcriptHash.substring(0, 12)}… — chamando IA`);
  }

  // ── Streaming AI Processing ─────────────────────────────────────────────────
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const sendChunk = (data: object) => {
    try {
      writer.write(encoder.encode(JSON.stringify(data) + '\n'));
    } catch (_) {
      // writer pode estar fechado se o cliente desconectou
    }
  };

  (async () => {
    try {
      // Keep-alive a cada 15s para manter a conexão aberta
      const keepAlive = setInterval(() => sendChunk({ status: 'processing' }), 15000);

      // Cria registro no Supabase com o hash (melhor esforço)
      let sessionId: string | null = null;
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('mentorship_sessions')
            .insert({
              mentor_id: mentor_id === 'test-mentor' ? 'test-mentor' : mentor_id,
              mentee_name,
              topic,
              transcript,
              transcript_hash: transcriptHash,
              status: 'processing',
            })
            .select('id')
            .single();

          if (!error) sessionId = data.id;
        } catch (_) {
          // não-fatal
        }
      }

      // ── Chamada à IA ────────────────────────────────────────────────────────
      const analysis = await analyzeSession(transcript, systemPrompt);

      // Persiste o resultado + marca como completed (best-effort)
      if (supabase && sessionId) {
        await supabase
          .from('mentorship_sessions')
          .update({
            analysis_result: analysis,
            status: 'completed',
            processed_at: new Date().toISOString(),
          })
          .eq('id', sessionId);
      }

      clearInterval(keepAlive);
      sendChunk({ status: 'completed', analysis, cached: false });

    } catch (err: any) {
      // Marca como failed no Supabase para não poluir o cache
      if (supabase) {
        await supabase
          .from('mentorship_sessions')
          .update({ status: 'failed' })
          .eq('transcript_hash', transcriptHash)
          .eq('status', 'processing');
      }
      sendChunk({ status: 'error', error: err.message || 'Erro desconhecido' });
    } finally {
      writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}
