import { MentorshipService } from '@/services/mentorship';
import { inngest } from '@/inngest/client';
import { supabase } from '@/lib/supabase';

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

    // 3. Enfileira Job ou Processa Síncronamente (Fallback para Testes)
    if (session.status !== 'completed') {
      if (process.env.INNGEST_EVENT_KEY && process.env.INNGEST_EVENT_KEY !== 'key_not_set') {
        await inngest.send({
          name: 'mentorship/session.received',
          data: { sessionId: session.id, transcript, systemPrompt },
          id: `analyze-${session.id}`
        });
      } else {
        // Fallback: Processamento Síncrono
        // Útil para testes rápidos sem Inngest Cloud configurado
        const analysis = await MentorshipService.processAnalysis(session.id, transcript, systemPrompt);
        return Response.json({ status: 'completed', analysis });
      }
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

export async function DELETE() {
  try {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { error } = await supabase
      .from('mentorship_sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;
    
    return Response.json({ success: true, message: 'Histórico de análises removido com sucesso.' });
  } catch (error: any) {
    console.error('[API Analyze] Erro ao deletar:', error);
    return Response.json({ error: error.message || 'Erro ao deletar histórico' }, { status: 500 });
  }
}
