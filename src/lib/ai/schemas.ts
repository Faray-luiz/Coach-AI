import { z } from 'zod';

export const AnalysisSchema = z.object({
  mes_score: z.number().min(0).max(100),
  dimensions: z.object({
    clarity: z.number().min(0).max(100),
    depth: z.number().min(0).max(100),
    connection: z.number().min(0).max(100),
    efficiency: z.number().min(0).max(100),
    consistency: z.number().min(0).max(100),
  }),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  micro_adjustments: z.array(z.object({
    topic: z.string(),
    suggestion: z.string(),
    context_snippet: z.string().optional(),
  })),
  talk_time: z.object({
    mentor_percentage: z.number().min(0).max(100),
    mentee_percentage: z.number().min(0).max(100),
  }),
  detailed_stats: z.object({
    open_questions: z.number(),
    closed_questions: z.number(),
    empathy_markers: z.number(),
    looping_count: z.number(),
  }),
  conversation_blocks: z.array(z.object({
    type: z.enum(['Abertura', 'Exploração', 'Síntese', 'Ação']),
    summary: z.string(),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    sentiment: z.enum(['Positive', 'Neutral', 'Critical']).optional(),
  })),
  golden_questions: z.array(z.object({
    question: z.string(),
    reason: z.string(),
    impact: z.string(),
  })).optional(),
  red_flags: z.array(z.object({
    moment: z.string(),
    risk: z.string(),
    alternative: z.string(),
  })).optional(),
});

export type Analysis = z.infer<typeof AnalysisSchema>;
