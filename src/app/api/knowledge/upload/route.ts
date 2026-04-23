import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { chunkText } from '@/lib/ai/utils';
import mammoth from 'mammoth';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';

    // 1. Extração de Texto baseada no tipo de arquivo
    if (file.name.endsWith('.pdf')) {
      // Importação dinâmica para evitar erros de build
      const pdf = require('pdf-parse');
      const data = await pdf(buffer);
      text = data.text;
    } else if (file.name.endsWith('.docx')) {
      const { value } = await mammoth.extractRawText({ buffer });
      text = value;
    } else if (file.name.endsWith('.txt')) {
      text = buffer.toString('utf-8');
    } else {
      return NextResponse.json({ error: 'Formato de arquivo não suportado (.pdf, .docx, .txt apenas)' }, { status: 400 });
    }

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ error: 'Arquivo sem conteúdo textual legível' }, { status: 400 });
    }

    // 2. Chunking (Dividindo em pedaços de 1000 caracteres)
    const chunks = chunkText(text);
    console.log(`Processando ${chunks.length} pedaços para o arquivo: ${file.name}`);

    // 3. Gerar Embeddings e Salvar no Banco
    // Para simplificar, faremos um por um, mas em produção o ideal é batch
    const insertions = [];
    
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk);
      insertions.push({
        content: chunk,
        embedding: embedding,
        metadata: {
          filename: file.name,
          type: file.type,
          size: file.size,
          processed_at: new Date().toISOString()
        }
      });
    }

    const { error: dbError } = await supabase
      .from('knowledge_chunks')
      .insert(insertions);

    if (dbError) throw dbError;

    return NextResponse.json({ 
      success: true, 
      chunks_count: chunks.length,
      filename: file.name 
    });

  } catch (error: any) {
    console.error('Erro no upload de conhecimento:', error);
    return NextResponse.json({ 
      error: 'Falha ao processar arquivo', 
      details: error.message 
    }, { status: 500 });
  }
}
