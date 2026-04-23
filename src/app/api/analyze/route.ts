import { NextResponse } from 'next/server';
import { analyzeSession } from '@/lib/ai/pipeline';
import { supabase } from '@/lib/supabase';

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

    // 2. Run AI Analysis (This is the core)
    const analysisData = await analyzeSession(transcript, systemPrompt);

    // 3. Save analysis results (Optional in Test Mode)
    if (sessionId && supabase) {
      try {
        await supabase
          .from('analyses')
          .insert({
            session_id: sessionId,
            mes_score: analysisData.mes_score,
            clarity_score: analysisData.dimensions.clarity,
            depth_score: analysisData.dimensions.depth,
            connection_score: analysisData.dimensions.connection,
            efficiency_score: analysisData.dimensions.efficiency,
            consistency_score: analysisData.dimensions.consistency,
            strengths: analysisData.strengths,
            improvements: analysisData.improvements,
            micro_adjustments: analysisData.micro_adjustments,
            conversation_blocks: analysisData.conversation_blocks,
          });
      } catch (e) {
        console.warn('Error saving analysis to Supabase.');
      }
    }

    return NextResponse.json({ 
      session: { id: sessionId, mentor_id, mentee_name, topic, transcript },
      analysis: analysisData 
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: 'Erro ao processar análise', 
      details: error.message || error 
    }, { status: 500 });
  }
}
