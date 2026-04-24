import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateEmbedding, generateEmbeddingsBatch } from '@/lib/ai/embeddings';
import { chunkText } from '@/lib/ai/utils';
import { Logger } from '@/lib/logger';
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
    Logger.info(`Processing knowledge file`, { filename: file.name, chunks_count: chunks.length });

    // 3. Gerar Embeddings em BATCH e Salvar no Banco
    const analysisData = await Logger.trace('Knowledge_Batch_Processing', async () => {
      // O Gemini suporta até 100 itens por batch, vamos garantir isso
      const batchSize = 50;
      const allInsertions = [];

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batchChunks = chunks.slice(i, i + batchSize);
        const embeddings = await generateEmbeddingsBatch(batchChunks);
        
        const insertions = batchChunks.map((chunk, index) => ({
          content: chunk,
          embedding: embeddings[index],
          metadata: {
            filename: file.name,
            type: file.type,
            size: file.size,
            processed_at: new Date().toISOString()
          }
        }));
        
        allInsertions.push(...insertions);
      }

      const { error: dbError } = await supabase
        .from('knowledge_chunks')
        .insert(allInsertions);

      if (dbError) throw dbError;
      return { count: allInsertions.length };
    });

    return NextResponse.json({ 
      success: true, 
      chunks_count: analysisData.count,
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
