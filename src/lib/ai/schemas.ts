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
  conversation_blocks: z.array(z.object({
    type: z.enum(['Abertura', 'Exploração', 'Síntese', 'Ação']),
    summary: z.string(),
    duration_estimate: z.string().optional(),
  })),
});

export type Analysis = z.infer<typeof AnalysisSchema>;
