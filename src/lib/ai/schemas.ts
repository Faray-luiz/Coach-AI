import { z } from 'zod';

export const AnalysisSchema = z.object({
  mes_score: z.number().min(0).max(100).catch(0),
  dimensions: z.object({
    clarity: z.number().min(0).max(100).catch(0),
    depth: z.number().min(0).max(100).catch(0),
    connection: z.number().min(0).max(100).catch(0),
    efficiency: z.number().min(0).max(100).catch(0),
    consistency: z.number().min(0).max(100).catch(0),
  }).catch({ clarity: 0, depth: 0, connection: 0, efficiency: 0, consistency: 0 }),
  
  strengths: z.array(z.any()).transform(arr => arr.map(String)).catch([]),
  improvements: z.array(z.any()).transform(arr => arr.map(String)).catch([]),
  
  micro_adjustments: z.array(z.any()).transform(arr => 
    arr.map(item => typeof item === 'string' 
      ? { topic: 'Ajuste', suggestion: item } 
      : { topic: item?.topic || 'Ajuste', suggestion: item?.suggestion || JSON.stringify(item) }
    )
  ).catch([]),

  talk_time: z.object({
    mentor_percentage: z.number().min(0).max(100).catch(50),
    mentee_percentage: z.number().min(0).max(100).catch(50),
  }).catch({ mentor_percentage: 50, mentee_percentage: 50 }),
  
  detailed_stats: z.object({
    open_questions: z.number().catch(0),
    closed_questions: z.number().catch(0),
    empathy_markers: z.number().catch(0),
    looping_count: z.number().catch(0),
  }).catch({ open_questions: 0, closed_questions: 0, empathy_markers: 0, looping_count: 0 }),
  
  conversation_blocks: z.array(z.any()).transform(arr => 
    arr.map(item => {
      if (typeof item === 'string') return { type: 'Exploração', summary: item };
      const typeStr = item?.type;
      const isValidType = ['Abertura', 'Exploração', 'Síntese', 'Ação'].includes(typeStr);
      return { 
        type: isValidType ? typeStr : 'Exploração', 
        summary: item?.summary || JSON.stringify(item)
      };
    })
  ).catch([]),

  golden_questions: z.array(z.any()).transform(arr => 
    arr.map(item => typeof item === 'string'
      ? { question: item, reason: 'Identificada pela IA' }
      : { question: item?.question || JSON.stringify(item), reason: item?.reason || 'Identificada pela IA' }
    )
  ).catch([]),

  red_flags: z.array(z.any()).transform(arr => 
    arr.map(item => typeof item === 'string'
      ? { moment: 'Geral', risk: item, alternative: '' }
      : { moment: item?.moment || 'Geral', risk: item?.risk || JSON.stringify(item), alternative: item?.alternative || '' }
    )
  ).catch([])
});

export type Analysis = z.infer<typeof AnalysisSchema>;
