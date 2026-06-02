import { NextRequest, NextResponse } from 'next/server';
import { supabase, checkSupabaseConnection } from '@/lib/supabase';
import { generateEmbeddingsBatch } from '@/lib/ai/embeddings';
import { chunkText } from '@/lib/ai/utils';
import { Logger } from '@/lib/logger';
import { MentorshipService } from '@/services/mentorship';
import mammoth from 'mammoth';

const BATCH_SIZE = 50;
const BATCH_MAX_RETRIES = 3;

export async function POST(req: NextRequest) {
  Logger.info("Receiving knowledge upload request");
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
      return NextResponse.json({ error: 'Formato não suportado (.pdf, .docx, .txt apenas)' }, { status: 400 });
    }

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ error: 'Arquivo sem conteúdo textual legível' }, { status: 400 });
    }

    const chunks = chunkText(text);
    Logger.info('Processing knowledge file', { filename: file.name, chunks_count: chunks.length });

    const isOnline = await checkSupabaseConnection();
    let savedCount = 0;

    // Processa e salva cada batch imediatamente — falha parcial não perde batches já salvos
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;

      // Retry com backoff para cada batch
      let embeddings: number[][] | null = null;
      for (let attempt = 1; attempt <= BATCH_MAX_RETRIES; attempt++) {
        try {
          embeddings = await generateEmbeddingsBatch(batchChunks);
          break;
        } catch (err: any) {
          Logger.warn(`Batch ${batchNum} embedding attempt ${attempt} failed`, { error: err.message });
          if (attempt < BATCH_MAX_RETRIES) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
          } else {
            throw new Error(`Batch ${batchNum} falhou após ${BATCH_MAX_RETRIES} tentativas: ${err.message}`);
          }
        }
      }

      const insertions = batchChunks.map((chunk, idx) => ({
        content: chunk,
        embedding: embeddings![idx],
        metadata: {
          filename: file.name,
          type: file.type,
          size: file.size,
          processed_at: new Date().toISOString(),
        },
      }));

      if (isOnline && supabase) {
        const { error: dbError } = await supabase.from('knowledge_chunks').insert(insertions);
        if (dbError) throw dbError;
      } else {
        await MentorshipService.insertLocalKnowledge(insertions);
      }

      savedCount += insertions.length;
      Logger.info(`Batch ${batchNum} saved`, { saved: savedCount, total: chunks.length });
    }

    return NextResponse.json({ success: true, chunks_count: savedCount, filename: file.name });
  } catch (error: any) {
    console.error('Erro no upload de conhecimento:', error);
    return NextResponse.json({ error: 'Falha ao processar arquivo', details: error.message }, { status: 500 });
  }
}
