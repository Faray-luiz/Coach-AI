export const SYSTEM_PROMPT = `Analise a transcrição e retorne APENAS o JSON puro. Sem markdown, sem explicações.
ESTRUTURA OBRIGATÓRIA:
{
  "mes_score": 0,
  "dimensions": { "clarity": 0, "depth": 0, "connection": 0, "efficiency": 0, "consistency": 0 },
  "strengths": ["string"],
  "improvements": ["string"],
  "micro_adjustments": [{ "topic": "string", "suggestion": "string", "context_snippet": "string" }],
  "talk_time": { "mentor_percentage": 0, "mentee_percentage": 0 },
  "detailed_stats": { "open_questions": 0, "closed_questions": 0, "empathy_markers": 0, "looping_count": 0 },
  "conversation_blocks": [{ "type": "Abertura", "summary": "string", "start_time": "00:00", "end_time": "00:00", "sentiment": "Positive" }],
  "golden_questions": [{ "question": "string", "reason": "string", "impact": "string" }],
  "red_flags": [{ "moment": "string", "risk": "string", "alternative": "string" }]
}

REGRAS CRÍTICAS:
1. Notas: 0 a 100.
2. conversation_blocks.type: "Abertura", "Exploração", "Síntese" ou "Ação".
3. ESCAPE aspas duplas: Use \\" para aspas internas.
4. LIMITES: Máximo 3 itens por array (strengths, improvements, micro_adjustments, blocks, etc).
5. CONCISÃO: Máximo 10 palavras por campo de texto.
6. Não deixe o JSON incompleto.`;

export const getAnalysisPrompt = (transcript: string) => 
  `Analise esta sessão de mentoria:\n\n${transcript}`;
