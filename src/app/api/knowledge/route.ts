import { NextRequest, NextResponse } from 'next/server';
import { supabase, checkSupabaseConnection } from '@/lib/supabase';
import { MentorshipService } from '@/services/mentorship';

/**
 * API para gerenciar a base de conhecimento (RAG).
 * Permite listar arquivos processados e removê-los.
 */

// GET: Lista todos os arquivos únicos na base de conhecimento
export async function GET() {
  try {
    const isOnline = await checkSupabaseConnection();
    let data: any[] = [];

    if (isOnline && supabase) {
      const { data: dbData, error } = await supabase
        .from('knowledge_chunks')
        .select('metadata');

      if (error) throw error;
      data = dbData || [];
    } else {
      data = await MentorshipService.getLocalKnowledge();
    }

    // Extrair nomes de arquivos únicos do JSONB metadata e consolidar info
    const filesMap = new Map();
    data.forEach((item: any) => {
      const meta = item.metadata;
      if (meta && meta.filename) {
        if (!filesMap.has(meta.filename)) {
          filesMap.set(meta.filename, {
            name: meta.filename,
            type: meta.type || 'unknown',
            size: meta.size || 0,
            processed_at: meta.processed_at || new Date().toISOString(),
            chunks_count: 0
          });
        }
        filesMap.get(meta.filename).chunks_count++;
      }
    });

    // Ordenar por data de processamento (mais recentes primeiro)
    const sortedFiles = Array.from(filesMap.values()).sort((a: any, b: any) => 
      new Date(b.processed_at).getTime() - new Date(a.processed_at).getTime()
    );

    return NextResponse.json(sortedFiles);
  } catch (error: any) {
    console.error('Error listing knowledge:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove todos os pedaços de conhecimento atrelados a um arquivo
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Nome do arquivo é obrigatório' }, { status: 400 });
  }

  try {
    const isOnline = await checkSupabaseConnection();

    if (isOnline && supabase) {
      // Usar a sintaxe do Supabase para filtrar campos dentro do JSONB
      const { error } = await supabase
        .from('knowledge_chunks')
        .delete()
        .filter('metadata->>filename', 'eq', filename);

      if (error) throw error;
    } else {
      await MentorshipService.deleteLocalKnowledge(filename);
    }

    return NextResponse.json({ success: true, message: `Arquivo ${filename} removido com sucesso.` });
  } catch (error: any) {
    console.error('Error deleting knowledge:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
