import { MentorshipService } from '@/services/mentorship';
import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await MentorshipService.getSessionById(id);
  if (!session) return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });

  return NextResponse.json(session);
}
