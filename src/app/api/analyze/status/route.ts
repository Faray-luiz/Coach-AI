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
    // Check if the session exists and its status
    const { data: session, error } = await supabase
      .from('mentorship_sessions')
      .select('status, analysis_result')
      .eq('id', sessionId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching session:', error);
      return NextResponse.json({ error: 'Error fetching session' }, { status: 500 });
    }

    if (session) {
      if (session.status === 'completed' && session.analysis_result) {
        return NextResponse.json({ status: 'completed', analysis: session.analysis_result });
      } else if (session.status === 'failed') {
        return NextResponse.json({ error: 'Falha no processamento da IA' }, { status: 500 });
      } else {
        return NextResponse.json({ status: 'processing' });
      }
    } else {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
