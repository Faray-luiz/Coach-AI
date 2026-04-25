import { startAnalysis } from '../src/lib/ai/retrieval';

async function test() {
  console.log('Iniciando teste da IA...');
  
  const transcript = `
Mentor: Olá, como você está hoje?
Mentorado: Estou um pouco sobrecarregado, para ser honesto. Sinto que minha equipe não está performando como deveria.
Mentor: Entendo. O que especificamente na performance deles está te preocupando mais?
Mentorado: Eles parecem desmotivados e perdem prazos constantemente. Eu acabo tendo que fazer o trabalho deles.
Mentor: Sei como é. E se você pudesse mudar apenas uma coisa na sua comunicação com eles hoje, o que teria o maior impacto?
Mentorado: Talvez se eu fosse mais claro nas expectativas desde o início...
Mentor: Interessante. O que te impede de marcar uma conversa de alinhamento individual com cada um ainda hoje?
  `;

  try {
    const result = await startAnalysis({
      transcript,
      mentor_id: 'test-mentor',
      mentee_name: 'Test Mentee',
      topic: 'Mentoria Experimental',
    });
    
    console.log('Análise concluída com sucesso!');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

test();
