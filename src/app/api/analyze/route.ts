import { MentorshipService } from '@/services/mentorship';
import { inngest } from '@/inngest/client';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { transcript, mentor_id, mentee_name, topic, systemPrompt } = await req.json();

    if (!transcript || !mentor_id) {
      return Response.json({ error: 'Faltando dados obrigatórios' }, { status: 400 });
    }

    const hash = MentorshipService.hashTranscript(transcript);

    // 1. Tenta o Cache (Estado da Arte: Fast Path)
    const cached = await MentorshipService.getCachedAnalysis(hash);
    if (cached) {
      return Response.json({ status: 'completed', analysis: cached, cached: true });
    }

    // 2. Inicia/Recupera Sessão (Idempotência no DB)
    const session = await MentorshipService.startSession({
      transcript,
      mentor_id,
      mentee_name,
      topic,
      hash
    });

    // 3. Enfileira Job (se não estiver pronto)
    if (session.status !== 'completed') {
      await inngest.send({
        name: 'mentorship/session.received',
        data: { sessionId: session.id, transcript, systemPrompt },
        // Idempotency: Se houver outro evento com o mesmo ID em 24h, o Inngest ignora
        id: `analyze-${session.id}`
      });
    }

    return Response.json({
      status: session.status === 'completed' ? 'completed' : 'queued',
      sessionId: session.id,
    });

  } catch (error: any) {
    console.error('[API Analyze] Erro fatal:', error);
    return Response.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
