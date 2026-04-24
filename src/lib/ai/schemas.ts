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
  
  strengths: z.array(z.string()).catch([]),
  improvements: z.array(z.string()).catch([]),
  
  micro_adjustments: z.array(z.object({
    topic: z.string().catch('Ajuste'),
    suggestion: z.string().catch(''),
    context_snippet: z.string().optional().catch('')
  })).catch([]),

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
  
  conversation_blocks: z.array(z.object({
    type: z.enum(['Abertura', 'Exploração', 'Síntese', 'Ação']).catch('Exploração'),
    summary: z.string().catch(''),
    start_time: z.string().nullable().catch(null),
    end_time: z.string().nullable().catch(null),
    sentiment: z.enum(['Positive', 'Neutral', 'Critical']).catch('Neutral')
  })).catch([]),

  golden_questions: z.array(z.object({
    question: z.string().catch(''),
    reason: z.string().catch(''),
    impact: z.string().optional().catch('')
  })).catch([]),

  red_flags: z.array(z.object({
    moment: z.string().catch(''),
    risk: z.string().catch(''),
    alternative: z.string().optional().catch('')
  })).catch([])
});

export type Analysis = z.infer<typeof AnalysisSchema>;
