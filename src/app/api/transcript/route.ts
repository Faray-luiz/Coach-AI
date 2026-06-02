import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';

    if (file.name.endsWith('.pdf')) {
      const pdf = require('pdf-parse-fork');
      const data = await pdf(buffer);
      text = data.text;
    } else if (file.name.endsWith('.docx')) {
      const { value } = await mammoth.extractRawText({ buffer });
      text = value;
    } else if (file.name.endsWith('.txt')) {
      text = buffer.toString('utf-8');
    } else {
      return NextResponse.json({ error: 'Formato não suportado. Use .pdf, .docx ou .txt' }, { status: 400 });
    }

    const trimmed = text.trim();
    if (trimmed.length < 10) {
      return NextResponse.json({ error: 'Arquivo sem conteúdo textual legível' }, { status: 400 });
    }

    return NextResponse.json({ text: trimmed, filename: file.name, size: file.size });
  } catch (error: any) {
    console.error('[API Transcript] Erro ao extrair texto:', error);
    return NextResponse.json({ error: 'Falha ao processar arquivo', details: error.message }, { status: 500 });
  }
}
