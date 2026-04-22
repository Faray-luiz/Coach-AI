import { NextResponse } from 'next/server';
import { analyzeSession } from '@/lib/ai/pipeline';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { transcript, mentor_id, mentee_name, topic } = await req.json();

    if (!transcript || !mentor_id) {
      return NextResponse.json({ error: 'Faltando dados obrigatórios' }, { status: 400 });
    }

    // 1. Save session first
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

    if (sessionError) throw sessionError;

    // 2. Run AI Analysis
    const analysisData = await analyzeSession(transcript);

    // 3. Save analysis results
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        session_id: session.id,
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
      })
      .select()
      .single();

    if (analysisError) throw analysisError;

    // 4. Update mentor average score (simplified for now)
    // In a real app, this would be a database trigger or a more complex query
    await supabase.rpc('update_mentor_scores', { mentor_id_param: mentor_id });

    return NextResponse.json({ session, analysis });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Erro ao processar análise' }, { status: 500 });
  }
}
