import { MentorshipService } from '@/services/mentorship';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sessions = await MentorshipService.getAllSessions();
    return NextResponse.json(sessions);
  } catch (error: any) {
    console.error('[API Sessions] Erro ao listar:', error);
    return NextResponse.json({ error: error.message || 'Erro ao listar sessões' }, { status: 500 });
  }
}
