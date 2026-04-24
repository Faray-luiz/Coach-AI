import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!supabase) return NextResponse.json({ error: 'DB disconnect' }, { status: 500 });

  const { data, error } = await supabase
    .from('mentorship_sessions')
    .select('status, analysis_result')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  return NextResponse.json(data);
}
