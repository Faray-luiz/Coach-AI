import React from 'react';
import { AnalysisReport } from '@/components/AnalysisReport';
import { LayoutDashboard, Users, MessageSquare, Settings, Bell } from 'lucide-react';

const DUMMY_ANALYSIS = {
  mes_score: 82,
  clarity_score: 85,
  depth_score: 75,
  connection_score: 90,
  efficiency_score: 78,
  consistency_score: 82,
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
  conversation_blocks: [
    { type: 'Abertura', summary: 'Alinhamento de expectativas e check-in emocional.', duration_estimate: '05:00' },
    { type: 'Exploração', summary: 'Aprofundamento no desafio de gestão de conflitos da equipe.', duration_estimate: '25:00' },
    { type: 'Síntese', summary: 'Reflexão sobre os aprendizados e insights gerados.', duration_estimate: '10:00' },
    { type: 'Ação', summary: 'Definição do plano prático para a próxima semana.', duration_estimate: '05:00' }
  ]
};

export default function MentorDashboard() {
  return (
    <div className="bg-background">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Olá, Mentor</h1>
            <p className="text-foreground/40 mt-1 text-sm sm:text-base">Aqui está a análise da sua última sessão.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="glass p-2.5 rounded-xl relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-foreground">Top2You Mentor</p>
                <p className="text-[10px] text-foreground/40">Sessão #42</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Users size={20} className="text-primary" />
              </div>
            </div>
          </div>
        </header>

        <AnalysisReport analysis={DUMMY_ANALYSIS} />
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <a href="#" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-foreground/60 hover:bg-white/5 hover:text-foreground'}`}>
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </a>
  );
}
