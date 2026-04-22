import React from 'react';
import { ScoreCard } from '@/components/ScoreCard';
import { Users, BookOpen, Star, TrendingUp, Filter, Download } from 'lucide-react';

const PROGRAM_STATS = [
  { title: 'Total de Mentores', value: '42', icon: <Users size={20} /> },
  { title: 'Sessões Analisadas', value: '1,284', icon: <BookOpen size={20} /> },
  { title: 'MES Médio', value: '78.5', icon: <Star size={20} /> },
  { title: 'Engajamento', value: '89%', icon: <TrendingUp size={20} /> },
];

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Reuse NavItem from Mentor Dashboard or abstract it */}
      <aside className="w-64 border-r border-white/5 p-6 hidden lg:block">
        <div className="flex items-center gap-2 mb-12">
          <div className="h-8 w-8 rounded-lg bg-primary" />
          <span className="font-bold text-xl">Simi</span>
        </div>
        
        <nav className="space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
            <TrendingUp size={20} />
            <span className="font-medium text-sm">Overview</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/60 hover:bg-white/5 hover:text-foreground">
            <Users size={20} />
            <span className="font-medium text-sm">Mentores</span>
          </a>
        </nav>
      </aside>

      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Visão Organizacional</h1>
            <p className="text-foreground/40 mt-1">Status global do programa de mentoria.</p>
          </div>
          <div className="flex gap-3">
            <button className="glass px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
              <Filter size={16} /> Filtrar
            </button>
            <button className="bg-primary px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 text-white">
              <Download size={16} /> Exportar
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {PROGRAM_STATS.map((stat, i) => (
            <div key={i} className="glass rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  {stat.icon}
                </div>
              </div>
              <p className="text-sm font-medium text-foreground/40">{stat.title}</p>
              <h2 className="text-3xl font-bold text-foreground mt-1">{stat.value}</h2>
            </div>
          ))}
        </div>

        {/* Health by Dimension */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section className="glass rounded-3xl p-8">
            <h3 className="text-lg font-semibold text-foreground mb-6">Saúde por Dimensão</h3>
            <div className="space-y-6">
              <DimensionRow label="Clareza" score={84} />
              <DimensionRow label="Profundidade" score={72} />
              <DimensionRow label="Conexão" score={91} />
              <DimensionRow label="Eficiência" score={68} />
              <DimensionRow label="Consistência" score={79} />
            </div>
          </section>

          <section className="glass rounded-3xl p-8">
            <h3 className="text-lg font-semibold text-foreground mb-6">Padrões de Comportamento</h3>
            <div className="space-y-4">
              <InsightItem type="positive" text="Mentores estão dedicando mais tempo à 'Exploração' (média de 32 min)." />
              <InsightItem type="negative" text="O índice de 'Interrupções' subiu 12% no último mês." />
              <InsightItem type="positive" text="Adoção de 'Looping for Understanding' aumentou em 40%." />
              <InsightItem type="warning" text="Cerca de 15% das sessões terminam sem definição de 'Ação'." />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function DimensionRow({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-foreground/60">{label}</span>
        <span className="font-bold text-foreground">{score}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function InsightItem({ type, text }: { type: 'positive' | 'negative' | 'warning'; text: string }) {
  const colors = {
    positive: 'bg-green-400',
    negative: 'bg-red-400',
    warning: 'bg-accent'
  };
  return (
    <div className="flex items-start gap-3 text-sm text-foreground/70">
      <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${colors[type]}`} />
      <p>{text}</p>
    </div>
  );
}
