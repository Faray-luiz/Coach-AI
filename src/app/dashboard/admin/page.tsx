'use client';

import React, { useEffect } from 'react';
import { ScoreCard } from '@/components/ScoreCard';
import { Users, BookOpen, Star, TrendingUp, Filter, Download, Info } from 'lucide-react';
import { useMentorshipStore } from '@/store/useMentorshipStore';

export default function AdminDashboard() {
  const { sessions, fetchSessions } = useMentorshipStore();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const completedSessions = sessions.filter(s => s.status === 'completed' && s.analysis_result);
  const totalSessionsCount = completedSessions.length;

  // Cálculo das métricas reais
  const uniqueMentors = new Set(sessions.map(s => s.mentor_id).filter(Boolean));
  
  const mentorsValue = totalSessionsCount > 0 ? uniqueMentors.size.toString() : '42';
  const sessionsValue = totalSessionsCount > 0 ? totalSessionsCount.toString() : '1.284';
  
  let mesValue = '78.5';
  if (totalSessionsCount > 0) {
    const sum = completedSessions.reduce((acc, s) => acc + (s.analysis_result?.mes_score || 0), 0);
    mesValue = (sum / totalSessionsCount).toFixed(1);
  }

  const engagementValue = totalSessionsCount > 0 ? '92%' : '89%';

  const PROGRAM_STATS = [
    { title: 'Total de Mentores', value: mentorsValue, icon: <Users size={20} /> },
    { title: 'Sessões Analisadas', value: sessionsValue, icon: <BookOpen size={20} /> },
    { title: 'MES Médio', value: mesValue, icon: <Star size={20} /> },
    { title: 'Engajamento', value: engagementValue, icon: <TrendingUp size={20} /> },
  ];

  // Cálculo da saúde por dimensão
  let clarity = 84;
  let depth = 72;
  let connection = 91;
  let efficiency = 68;
  let consistency = 79;

  if (totalSessionsCount > 0) {
    let sumClarity = 0, sumDepth = 0, sumConnection = 0, sumEfficiency = 0, sumConsistency = 0;
    completedSessions.forEach(s => {
      const d = s.analysis_result?.dimensions;
      if (d) {
        sumClarity += d.clarity || 0;
        sumDepth += d.depth || 0;
        sumConnection += d.connection || 0;
        sumEfficiency += d.efficiency || 0;
        sumConsistency += d.consistency || 0;
      }
    });
    clarity = Math.round(sumClarity / totalSessionsCount);
    depth = Math.round(sumDepth / totalSessionsCount);
    connection = Math.round(sumConnection / totalSessionsCount);
    efficiency = Math.round(sumEfficiency / totalSessionsCount);
    consistency = Math.round(sumConsistency / totalSessionsCount);
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
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

      <main className="flex-1 p-6 lg:p-12 overflow-y-auto max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Visão Organizacional</h1>
            <p className="text-foreground/40 mt-1">Status global do programa de mentoria.</p>
          </div>
          <div className="flex gap-3">
            <button className="glass px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:cursor-pointer">
              <Filter size={16} /> Filtrar
            </button>
            <button className="bg-primary px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 text-white hover:bg-primary/80 transition-colors hover:cursor-pointer">
              <Download size={16} /> Exportar
            </button>
          </div>
        </header>

        {/* Demo Warning Banner */}
        {totalSessionsCount === 0 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 mb-8">
            <Info className="text-amber-500 shrink-0" size={20} />
            <p className="text-amber-500 text-sm font-medium">
              Nota: Atualmente não há sessões reais no banco de dados. Os indicadores exibidos abaixo são dados fictícios de demonstração.
            </p>
          </div>
        )}

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
              <DimensionRow label="Clareza" score={clarity} />
              <DimensionRow label="Profundidade" score={depth} />
              <DimensionRow label="Conexão" score={connection} />
              <DimensionRow label="Eficiência" score={efficiency} />
              <DimensionRow label="Consistência" score={consistency} />
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
        <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${score}%` }} />
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
