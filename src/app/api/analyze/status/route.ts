import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  try {
    // Check if the analysis exists
    const { data: analysis, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching analysis:', error);
      return NextResponse.json({ error: 'Error fetching analysis' }, { status: 500 });
    }

    if (analysis) {
      // Formata os dados de volta para o formato que o frontend espera (como se fosse a resposta da IA direta)
      const formattedAnalysis = {
        mes_score: analysis.mes_score,
        dimensions: {
          clarity: analysis.clarity_score,
          depth: analysis.depth_score,
          connection: analysis.connection_score,
          efficiency: analysis.efficiency_score,
          consistency: analysis.consistency_score,
        },
        strengths: analysis.strengths || [],
        improvements: analysis.improvements || [],
        micro_adjustments: analysis.micro_adjustments || [],
        conversation_blocks: analysis.conversation_blocks || [],
      };

      return NextResponse.json({ status: 'completed', analysis: formattedAnalysis });
    } else {
      return NextResponse.json({ status: 'processing' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
