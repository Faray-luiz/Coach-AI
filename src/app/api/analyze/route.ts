import { NextResponse } from 'next/server';
import { analyzeSession } from '@/lib/ai/pipeline';
import { supabase } from '@/lib/supabase';

export const maxDuration = 60; // Aumenta o timeout para 60 segundos

export async function POST(req: Request) {
  try {
    const { transcript, mentor_id, mentee_name, topic, systemPrompt } = await req.json();

    if (!transcript || !mentor_id) {
      return NextResponse.json({ error: 'Faltando dados obrigatórios' }, { status: 400 });
    }

    // 1. Save session (Required for async background processing)
    let sessionId = null;
    try {
      if (!supabase) {
        throw new Error("Supabase is required for background processing to track the session.");
      }

      const { data: session, error: sessionError } = await supabase
        .from('mentorship_sessions')
        .insert({
          mentor_id: mentor_id === 'test-mentor' ? 'test-mentor' : mentor_id,
          mentee_name,
          topic,
          transcript,
          status: 'processing'
        })
        .select()
        .single();
      
      if (sessionError) {
        console.error("Erro ao salvar sessão no Supabase:", sessionError);
        throw new Error(`Erro de Banco de Dados: ${sessionError.message || JSON.stringify(sessionError)}`);
      } else {
        sessionId = session.id;
      }
    } catch (e: any) {
      console.warn('Erro fatal ao preparar tracking assíncrono:', e);
      throw e; // Lança o erro real para o frontend
    }

    // 2. Dispatch Inngest Event for Background Processing
    if (sessionId) {
      // Usando require para evitar problemas se o Inngest não estiver configurado perfeitamente no ambiente
      const { inngest } = require('@/inngest/client');
      await inngest.send({
        name: 'mentorship/session.received',
        data: { transcript, sessionId, systemPrompt }
      });
    }

    // 3. Return immediately
    return NextResponse.json({ 
      status: 'processing',
      session: { id: sessionId, mentor_id, mentee_name, topic }
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: 'Erro ao processar análise', 
      details: error.message || error 
    }, { status: 500 });
  }
}
