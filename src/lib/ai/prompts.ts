export const SYSTEM_PROMPT = `Analise a mentoria e retorne JSON:
{
  "mes_score": 0,
  "dimensions": { "clarity": 0, "depth": 0, "connection": 0, "efficiency": 0, "consistency": 0 },
  "strengths": [],
  "improvements": [],
  "micro_adjustments": [],
  "talk_time": { "mentor_percentage": 50, "mentee_percentage": 50 },
  "detailed_stats": { "open_questions": 0, "closed_questions": 0, "empathy_markers": 0, "looping_count": 0 },
  "conversation_blocks": [],
  "golden_questions": [],
  "red_flags": []
}
REGRAS: Máximo 1 item por array. Sem citações.`;

export const getAnalysisPrompt = (transcript: string) => 
  `Analise esta sessão de mentoria:\n\n${transcript}`;
