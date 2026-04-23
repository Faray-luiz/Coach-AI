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

    // 1. Save session (Optional in Test Mode)
    let sessionId = null;
    try {
      if (supabase) {
        const { data: session, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            mentor_id,
            mentee_name,
            topic,
            transcript,
          })
          .select()
          .single();
        
        if (!sessionError) sessionId = session.id;
      }
    } catch (e) {
      console.warn('Supabase not configured or error saving session. Continuing in Test Mode.');
    }

    // 2. Dispatch Inngest Event for Background Processing
    if (sessionId) {
      // Usando require para evitar problemas se o Inngest não estiver configurado perfeitamente no ambiente
      const { inngest } = require('@/inngest/client');
      await inngest.send({
        name: 'mentorship/session.received',
        data: { transcript, sessionId, systemPrompt }
      });
    } else {
      throw new Error("Supabase is required for background processing to track the session.");
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
