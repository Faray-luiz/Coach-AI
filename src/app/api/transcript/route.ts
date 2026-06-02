import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { cleanTranscript } from '@/lib/ai/utils';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';

    if (file.name.endsWith('.pdf')) {
      const pdf = require('pdf-parse-fork');
      text = (await pdf(buffer)).text;
    } else if (file.name.endsWith('.docx')) {
      const { value } = await mammoth.extractRawText({ buffer });
      text = value;
    } else if (file.name.endsWith('.txt')) {
      text = buffer.toString('utf-8');
    } else {
      return NextResponse.json({ error: 'Formato não suportado. Use .pdf, .docx ou .txt' }, { status: 400 });
    }

    const rawText = text.trim();
    if (rawText.length < 10) {
      return NextResponse.json({ error: 'Arquivo sem conteúdo textual legível' }, { status: 400 });
    }

    // Limpa formato incremental de STT antes de retornar
    const cleaned = cleanTranscript(rawText);
    const wasCompressed = cleaned.length < rawText.length * 0.9;

    return NextResponse.json({
      text: cleaned,
      filename: file.name,
      size: file.size,
      ...(wasCompressed && {
        compressionInfo: {
          originalLength: rawText.length,
          cleanedLength: cleaned.length,
          reductionPct: Math.round((1 - cleaned.length / rawText.length) * 100),
        },
      }),
    });
  } catch (error: any) {
    console.error('[API Transcript] Erro ao extrair texto:', error);
    return NextResponse.json({ error: 'Falha ao processar arquivo', details: error.message }, { status: 500 });
  }
}
