import { supabase } from '../src/lib/supabase';
import { generateEmbedding } from '../src/lib/ai/embeddings';
import fs from 'fs';
import path from 'path';

async function upload() {
  console.log('Lendo arquivo de conhecimento...');
  const content = fs.readFileSync(path.join(__dirname, 'seed_knowledge.txt'), 'utf-8');
  
  console.log('Gerando embedding...');
  const embedding = await generateEmbedding(content);
  
  console.log('Enviando para o Supabase...');
  const { error } = await supabase
    .from('knowledge_chunks')
    .insert({
      content,
      embedding,
      metadata: {
        filename: 'seed_knowledge.txt',
        test: true
      }
    });

  if (error) {
    console.error('Erro ao salvar no Supabase:', error);
  } else {
    console.log('Conhecimento carregado com sucesso!');
  }
}

upload();
