'use client';

import React, { useEffect } from 'react';
import { AnalysisReport } from '@/components/AnalysisReport';
import { Users, Bell, Play, LayoutDashboard, Brain, AlertCircle, ArrowRight } from 'lucide-react';
import { useMentorshipStore } from '@/store/useMentorshipStore';
import Link from 'next/link';

// Usado apenas como demonstração (demo) se não houver dados reais no banco
const DUMMY_ANALYSIS = {
  mes_score: 82,
  dimensions: {
    clarity: 85,
    depth: 75,
    connection: 90,
    efficiency: 78,
    consistency: 82,
  },
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
    {
      topic: 'Síntese e Ação',
      suggestion: 'Ao final da sessão, peça ao mentorado para resumir os 3 principais aprendizados antes de você dar o seu fechamento.',
      context_snippet: 'Final da sessão aos 45 minutos.'
    },
    {
      topic: 'Equilíbrio de Diálogo',
      suggestion: 'Tente usar a técnica de "Looping for Understanding" após explicar um conceito complexo.',
      context_snippet: 'Explicação sobre liderança situacional.'
    }
  ],
  talk_time: {
    mentor_percentage: 45,
    mentee_percentage: 55
  },
  detailed_stats: {
    open_questions: 12,
    closed_questions: 4,
    empathy_markers: 8,
    looping_count: 5
  },
  conversation_blocks: [
    { type: 'Abertura', summary: 'Alinhamento de expectativas e check-in emocional.', start_time: '00:00', end_time: '05:00', sentiment: 'Positive' },
    { type: 'Exploração', summary: 'Aprofundamento no desafio de gestão de conflitos da equipe.', start_time: '05:00', end_time: '30:00', sentiment: 'Neutral' },
    { type: 'Síntese', summary: 'Reflexão sobre os aprendizados e insights gerados.', start_time: '30:00', end_time: '40:00', sentiment: 'Positive' },
    { type: 'Ação', summary: 'Definição do plano prático para a próxima semana.', start_time: '40:00', end_time: '45:00', sentiment: 'Positive' }
  ],
  golden_questions: [
    {
      question: 'O que te impede hoje de ter uma conversa transparente com ele?',
      reason: 'Pergunta limpa baseada em pressuposição que força a auto-reflexão profunda.',
      impact: 'O mentorado parou e admitiu que o medo do conflito era o maior impedimento.'
    }
  ],
  red_flags: [
    {
      moment: 'Aos 25 minutos o mentor deu a solução pronta sobre a contratação.',
      risk: 'Retira o protagonismo do mentorado e encerra a exploração do problema.',
      alternative: 'Perguntar: De quais competências você sente falta hoje no time para suprir essa demanda?'
    }
  ]
};

export default function MentorDashboard() {
  const { 
    sessions, 
    sessionId, 
    analysis, 
    status, 
    fetchSessions, 
    selectSession 
  } = useMentorshipStore();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const hasRealSessions = sessions.length > 0;
  const activeSession = sessions.find(s => s.id === sessionId);

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Olá, Mentor</h1>
            <p className="text-foreground/40 mt-1 text-sm sm:text-base">
              {hasRealSessions 
                ? 'Navegue e explore a análise detalhada de suas mentorias.' 
                : 'Esta é uma visualização de exemplo. Nenhuma sessão foi gravada ainda.'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Seletor de Sessões Dinâmico */}
            {hasRealSessions && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground/40 font-medium hidden md:inline">Sessão:</span>
                <select 
                  value={sessionId || ''} 
                  onChange={(e) => selectSession(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id} className="bg-background text-foreground">
                      {s.mentee_name} - {s.topic || 'Mentoria'} ({new Date(s.created_at).toLocaleDateString('pt-BR')})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-4 ml-auto">
              <button className="glass p-2.5 rounded-xl relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-foreground">Top2You Mentor</p>
                  <p className="text-[10px] text-foreground/40">
                    {activeSession ? `Sessão #${activeSession.id.substring(0, 5)}` : 'Sessão Demo'}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Users size={20} className="text-primary" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Demo Alert Box */}
        {!hasRealSessions && (
          <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Brain className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Gostaria de ver sua própria mentoria aqui?</h3>
                <p className="text-sm text-foreground/60 mt-1">
                  Submeta uma gravação ou cole uma transcrição real na área de testes para ativar a análise inteligente.
                </p>
              </div>
            </div>
            <Link 
              href="/test-analysis" 
              className="bg-primary text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/80 transition-all whitespace-nowrap shadow-lg shadow-primary/10"
            >
              Testar Análise Real <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* Status Handling */}
        {hasRealSessions && activeSession && activeSession.status === 'processing' && (
          <div className="glass rounded-3xl p-12 text-center flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mb-4" />
            <h3 className="text-lg font-semibold">Análise em andamento...</h3>
            <p className="text-sm text-foreground/40 mt-1">Aguarde, a Simi está processando os insights comportamentais desta sessão.</p>
          </div>
        )}

        {hasRealSessions && activeSession && activeSession.status === 'failed' && (
          <div className="glass rounded-3xl p-12 text-center flex flex-col items-center justify-center border-red-500/20 bg-red-500/5">
            <AlertCircle className="text-red-500 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-red-500">Erro na Análise</h3>
            <p className="text-sm text-foreground/60 mt-1">Houve uma falha ao tentar analisar essa mentoria. Tente novamente mais tarde.</p>
          </div>
        )}

        {/* Analysis Result */}
        {(!hasRealSessions || (activeSession && activeSession.status === 'completed')) && (
          <AnalysisReport analysis={analysis || DUMMY_ANALYSIS} />
        )}
      </main>
    </div>
  );
}
