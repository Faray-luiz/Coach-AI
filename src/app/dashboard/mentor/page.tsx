'use client';

import React, { useEffect } from 'react';
import { AnalysisReport } from '@/components/AnalysisReport';
import { Users, Bell, Brain, AlertCircle, ArrowRight, ChevronDown } from 'lucide-react';
import { useMentorshipStore } from '@/store/useMentorshipStore';
import Link from 'next/link';
import type { Analysis } from '@/lib/ai/schemas';

const DUMMY_ANALYSIS: Analysis = {
  mes_score: 82,
  dimensions: { clarity: 85, depth: 75, connection: 90, efficiency: 78, consistency: 82 },
  strengths: [
    'Excepcional escuta ativa e validação dos pontos do mentorado.',
    'Construção rápida de um ambiente de confiança e segurança psicológica.',
    'Uso eficaz de perguntas abertas para exploração do tema.'
  ],
  improvements: [
    'A síntese final foi um pouco apressada, dificultando a clareza dos próximos passos.',
    'Alguns momentos de monólogo longo (acima de 2 minutos) que poderiam ser quebrados.'
  ],
  micro_adjustments: [
    { topic: 'Síntese e Ação', suggestion: 'Peça ao mentorado para resumir os 3 principais aprendizados antes do fechamento.', context_snippet: 'Final da sessão aos 45 minutos.' },
    { topic: 'Equilíbrio de Diálogo', suggestion: 'Use "Looping for Understanding" após explicar um conceito complexo.', context_snippet: 'Explicação sobre liderança situacional.' }
  ],
  talk_time: { mentor_percentage: 45, mentee_percentage: 55 },
  detailed_stats: { open_questions: 12, closed_questions: 4, empathy_markers: 8, looping_count: 5 },
  conversation_blocks: [
    { type: 'Abertura' as const, summary: 'Alinhamento de expectativas e check-in emocional.', start_time: '00:00', end_time: '05:00', sentiment: 'Positive' as const },
    { type: 'Exploração' as const, summary: 'Aprofundamento no desafio de gestão de conflitos da equipe.', start_time: '05:00', end_time: '30:00', sentiment: 'Neutral' as const },
    { type: 'Síntese' as const, summary: 'Reflexão sobre os aprendizados e insights gerados.', start_time: '30:00', end_time: '40:00', sentiment: 'Positive' as const },
    { type: 'Ação' as const, summary: 'Definição do plano prático para a próxima semana.', start_time: '40:00', end_time: '45:00', sentiment: 'Positive' as const }
  ],
  golden_questions: [{ question: 'O que te impede hoje de ter uma conversa transparente com ele?', reason: 'Pergunta limpa que força a auto-reflexão profunda.', impact: 'O mentorado admitiu que o medo do conflito era o maior impedimento.' }],
  red_flags: [{ moment: 'Aos 25 minutos o mentor deu a solução pronta sobre a contratação.', risk: 'Retira o protagonismo do mentorado.', alternative: 'De quais competências você sente falta hoje no time?' }]
};

export default function MentorDashboard() {
  const { sessions, sessionId, analysis, fetchSessions, selectSession } = useMentorshipStore();

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const hasRealSessions = sessions.length > 0;
  const activeSession = sessions.find(s => s.id === sessionId);

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Olá, Mentor</h1>
            <p className="text-sm text-muted mt-0.5">
              {hasRealSessions
                ? 'Explore a análise detalhada de suas mentorias.'
                : 'Visualização de exemplo — nenhuma sessão gravada ainda.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {hasRealSessions && (
              <div className="relative">
                <select
                  value={sessionId || ''}
                  onChange={e => selectSession(e.target.value)}
                  className="appearance-none rounded-lg border border-border bg-surface pl-4 pr-10 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary cursor-pointer"
                >
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.mentee_name} · {s.topic || 'Mentoria'} · {new Date(s.created_at).toLocaleDateString('pt-BR')}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
              </div>
            )}

            <button className="relative rounded-lg border border-border p-2 hover:bg-gray-100 transition-colors">
              <Bell size={18} className="text-muted" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
            </button>

            <div className="h-9 w-9 rounded-full bg-primary-light border border-primary/20 flex items-center justify-center">
              <Users size={16} className="text-primary" />
            </div>
          </div>
        </header>

        {/* CTA banner for no sessions */}
        {!hasRealSessions && (
          <div className="card rounded-xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-primary-light border-primary/20">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Brain size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Gostaria de ver sua própria mentoria aqui?</p>
                <p className="text-xs text-muted mt-0.5">Submeta uma transcrição real na área de testes para ativar a análise inteligente.</p>
              </div>
            </div>
            <Link
              href="/test-analysis"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors whitespace-nowrap shrink-0"
            >
              Testar Análise <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Processing state */}
        {hasRealSessions && activeSession?.status === 'processing' && (
          <div className="card rounded-xl p-10 mb-6 flex flex-col items-center text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mb-4" />
            <p className="text-sm font-semibold text-foreground">Análise em andamento...</p>
            <p className="text-xs text-muted mt-1">A Simi está processando os insights desta sessão.</p>
          </div>
        )}

        {/* Failed state */}
        {hasRealSessions && activeSession?.status === 'failed' && (
          <div className="card rounded-xl p-8 mb-6 flex flex-col items-center text-center bg-red-50 border-red-200">
            <AlertCircle size={36} className="text-error mb-3" />
            <p className="text-sm font-semibold text-red-700">Erro na Análise</p>
            <p className="text-xs text-muted mt-1">Houve uma falha ao analisar essa mentoria. Tente novamente mais tarde.</p>
          </div>
        )}

        {/* Analysis report */}
        {(!hasRealSessions || activeSession?.status === 'completed') && (
          <AnalysisReport analysis={analysis || DUMMY_ANALYSIS} />
        )}
      </div>
    </div>
  );
}
