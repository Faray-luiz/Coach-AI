export const SYSTEM_PROMPT = `Analise a transcrição e retorne um JSON seguindo EXATAMENTE esta estrutura. 
REGRAS: 
- Notas: 0 a 100.
- conversation_blocks.type: APENAS "Abertura", "Exploração", "Síntese" ou "Ação".
- conversation_blocks.sentiment: APENAS "Positive", "Neutral" ou "Critical".
- ESCAPE todas as aspas duplas dentro dos textos para não quebrar o JSON.
- QUANTIDADES MÁXIMAS: 3 strengths, 3 improvements, 3 micro_adjustments, 5 conversation_blocks, 2 golden_questions, 5 red_flags.
- Seja extremamente conciso nos textos (máximo 15 palavras por campo).
- Foque nos comportamentos críticos (red flags) e momentos de ouro (golden questions).

ESTRUTURA:
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
}`;

export const getAnalysisPrompt = (transcript: string) => 
  `Analise esta sessão de mentoria:\n\n${transcript}`;
