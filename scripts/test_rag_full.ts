import { analyzeSession } from '../src/lib/ai/pipeline';

async function test() {
  console.log('Iniciando Teste de RAG Full...');
  
  const transcript = `
Mentor: Olá, como você está hoje?
Mentorado: Estou um pouco sobrecarregado, para ser honesto. Sinto que minha equipe não está performando como deveria.
Mentor: Entendo. O que especificamente na performance deles está te preocupando mais?
Mentorado: Eles parecem desmotivados e perdem prazos constantemente. Eu acabo tendo que fazer o trabalho deles.
Mentor: Sei como é. Tente ser mais claro nas expectativas desde o início. Bom, nosso tempo acabou. Até a próxima!
Mentorado: Ah, ok... Até mais.
  `;

  try {
    const result = await analyzeSession(transcript);
    
    console.log('\n--- RESULTADO DA ANÁLISE ---');
    console.log(`MES Score: ${result.mes_score}`);
    
    console.log('\nMelhorias Identificadas:');
    result.improvements.forEach(imp => console.log(`- ${imp}`));

    console.log('\nMicro-Ajustes:');
    result.micro_adjustments.forEach(adj => {
        console.log(`[${adj.topic}] ${adj.suggestion}`);
    });

    // Verificar se a palavra "Âncora" ou "Anchor" aparece (o que prova que o RAG funcionou)
    const hasRagContent = JSON.stringify(result).toLowerCase().includes('âncora') || 
                         JSON.stringify(result).toLowerCase().includes('anchor');
    
    if (hasRagContent) {
      console.log('\n✅ SUCESSO: O RAG funcionou! A IA utilizou o conhecimento sobre a "Técnica das 3 Âncoras".');
    } else {
      console.log('\n❌ FALHA: O RAG parece não ter sido utilizado ou a IA não julgou relevante.');
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

test();
