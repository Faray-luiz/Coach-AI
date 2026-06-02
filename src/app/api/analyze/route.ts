import { NextResponse } from 'next/server';
import { MentorshipService } from '@/services/mentorship';
import { inngest } from '@/inngest/client';
import { checkSupabaseConnection } from '@/lib/supabase';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { transcript, mentor_id, mentee_name, topic, systemPrompt } = await req.json();

    if (!transcript || !mentor_id) {
      return NextResponse.json({ error: 'Faltando dados obrigatórios' }, { status: 400 });
    }

    const hash = MentorshipService.hashTranscript(transcript);

    // 1. Tenta o Cache (Estado da Arte: Fast Path)
    const cached = await MentorshipService.getCachedAnalysis(hash);
    if (cached) {
      return NextResponse.json({ status: 'completed', analysis: cached, cached: true });
    }

    // 2. Inicia/Recupera Sessão (Idempotência no DB)
    const session = await MentorshipService.startSession({
      transcript,
      mentor_id,
      mentee_name,
      topic,
      hash,
      systemPrompt,
    });

    // 3. Enfileira Job ou Processa Síncronamente (Fallback para Testes/Offline)
    const isOnline = await checkSupabaseConnection();
    if (session.status !== 'completed') {
      if (isOnline && process.env.INNGEST_EVENT_KEY && process.env.INNGEST_EVENT_KEY !== 'key_not_set') {
        // Evento minimalista: só o sessionId. Transcript e systemPrompt
        // são buscados do banco pelo job, evitando o limite de 256KB do Inngest.
        await inngest.send({
          name: 'mentorship/session.received',
          data: { sessionId: session.id },
          id: `analyze-${session.id}`
        });
      } else {
        // Fallback: Processamento Síncrono (Offline ou Local)
        const analysis = await MentorshipService.processAnalysis(session.id, transcript, systemPrompt);
        return NextResponse.json({ status: 'completed', analysis });
      }
    }

    return NextResponse.json({
      status: session.status === 'completed' ? 'completed' : 'queued',
      sessionId: session.id,
    });

  } catch (error: any) {
    console.error('[API Analyze] Erro fatal:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await MentorshipService.deleteAllSessions();
    return NextResponse.json({ success: true, message: 'Histórico de análises removido com sucesso.' });
  } catch (error: any) {
    console.error('[API Analyze] Erro ao deletar:', error);
    return NextResponse.json({ error: error.message || 'Erro ao deletar histórico' }, { status: 500 });
  }
}
