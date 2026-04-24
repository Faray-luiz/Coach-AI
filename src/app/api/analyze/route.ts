import { analyzeSession } from '@/lib/ai/pipeline';
import { supabase } from '@/lib/supabase';

// Vercel Pro allows up to 300s, free tier 60s. Set to max for this plan.
export const maxDuration = 300;

export async function POST(req: Request) {
  const { transcript, mentor_id, mentee_name, topic, systemPrompt } = await req.json();

  if (!transcript || !mentor_id) {
    return new Response(JSON.stringify({ error: 'Faltando dados obrigatórios' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Use a TransformStream to keep the connection alive while the AI thinks
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const sendChunk = (data: object) => {
    writer.write(encoder.encode(JSON.stringify(data) + '\n'));
  };

  // Run the heavy AI work in the background, streaming progress back
  (async () => {
    try {
      // Send keep-alive pings every 15 seconds so the connection stays open
      const keepAlive = setInterval(() => {
        sendChunk({ status: 'processing' });
      }, 15000);

      // Save session to Supabase if available (non-blocking, best-effort)
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
              status: 'processing',
            })
            .select('id')
            .single();
          if (!error) sessionId = data.id;
        } catch (_) {
          // non-fatal — continue without tracking
        }
      }

      // Run the actual AI analysis
      const analysis = await analyzeSession(transcript, systemPrompt);

      // Persist result back to Supabase (best-effort)
      if (supabase && sessionId) {
        await supabase
          .from('mentorship_sessions')
          .update({ analysis_result: analysis, status: 'completed', processed_at: new Date().toISOString() })
          .eq('id', sessionId);
      }

      clearInterval(keepAlive);

      // Send the final result as the last chunk
      sendChunk({ status: 'completed', analysis });
    } catch (err: any) {
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
