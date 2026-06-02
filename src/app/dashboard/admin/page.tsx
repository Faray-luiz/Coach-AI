'use client';

import React, { useEffect } from 'react';
import { ScoreCard } from '@/components/ScoreCard';
import { Users, BookOpen, Star, TrendingUp, Filter, Download, Info, BarChart2 } from 'lucide-react';
import { useMentorshipStore } from '@/store/useMentorshipStore';

export default function AdminDashboard() {
  const { sessions, fetchSessions } = useMentorshipStore();

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const completed = sessions.filter(s => s.status === 'completed' && s.analysis_result);
  const total = completed.length;
  const uniqueMentors = new Set(sessions.map(s => s.mentor_id).filter(Boolean));

  let mesAvg = 78.5;
  if (total > 0) {
    mesAvg = completed.reduce((acc, s) => acc + (s.analysis_result?.mes_score || 0), 0) / total;
  }

  const STATS = [
    { label: 'Total de Mentores',  value: total > 0 ? uniqueMentors.size.toString() : '42',      icon: Users },
    { label: 'Sessões Analisadas', value: total > 0 ? total.toString() : '1.284',                 icon: BookOpen },
    { label: 'MES Médio',          value: total > 0 ? mesAvg.toFixed(1) : '78.5',                 icon: Star },
    { label: 'Engajamento',        value: total > 0 ? '92%' : '89%',                              icon: TrendingUp },
  ];

  const dims = { clarity: 84, depth: 72, connection: 91, efficiency: 68, consistency: 79 };
  if (total > 0) {
    const sums = { clarity: 0, depth: 0, connection: 0, efficiency: 0, consistency: 0 };
    completed.forEach(s => {
      const d = s.analysis_result?.dimensions;
      if (d) { sums.clarity += d.clarity || 0; sums.depth += d.depth || 0; sums.connection += d.connection || 0; sums.efficiency += d.efficiency || 0; sums.consistency += d.consistency || 0; }
    });
    dims.clarity = Math.round(sums.clarity / total);
    dims.depth = Math.round(sums.depth / total);
    dims.connection = Math.round(sums.connection / total);
    dims.efficiency = Math.round(sums.efficiency / total);
    dims.consistency = Math.round(sums.consistency / total);
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-surface border-r border-border hidden lg:flex flex-col p-5">
        <div className="flex items-center gap-2.5 mb-8 px-1">
          <div className="h-7 w-7 rounded-md bg-primary" />
          <span className="font-bold text-base text-foreground">Simi Admin</span>
        </div>
        <nav className="space-y-1">
          <SidebarItem icon={BarChart2} label="Overview" active />
          <SidebarItem icon={Users} label="Mentores" />
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Visão Organizacional</h1>
            <p className="text-sm text-muted mt-0.5">Status global do programa de mentoria.</p>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-muted hover:bg-gray-50 transition-colors">
              <Filter size={15} /> Filtrar
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors">
              <Download size={15} /> Exportar
            </button>
          </div>
        </header>

        {/* Demo warning */}
        {total === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3 mb-8">
            <Info size={16} className="text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700 font-medium">
              Sem sessões reais no banco. Os indicadores abaixo são dados fictícios de demonstração.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STATS.map((s, i) => (
            <div key={i} className="card rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-lg bg-primary-light flex items-center justify-center">
                  <s.icon size={16} className="text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Dimension health + Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-5">Saúde por Dimensão</h3>
            <div className="space-y-4">
              <DimRow label="Clareza"      score={dims.clarity} />
              <DimRow label="Profundidade" score={dims.depth} />
              <DimRow label="Conexão"      score={dims.connection} />
              <DimRow label="Eficiência"   score={dims.efficiency} />
              <DimRow label="Consistência" score={dims.consistency} />
            </div>
          </div>

          <div className="card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-5">Padrões de Comportamento</h3>
            <div className="space-y-3">
              <Insight type="positive" text="Mentores dedicam mais tempo à 'Exploração' (média 32 min)." />
              <Insight type="negative" text="Índice de interrupções subiu 12% no último mês." />
              <Insight type="positive" text="Adoção de Looping for Understanding aumentou 40%." />
              <Insight type="warning"  text="15% das sessões terminam sem definição de ação." />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active }: { icon: React.ElementType; label: string; active?: boolean }) {
  return (
    <a
      href="#"
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-primary-light text-primary'
          : 'text-muted hover:bg-gray-100 hover:text-foreground'
      }`}
    >
      <Icon size={17} /> {label}
    </a>
  );
}

function DimRow({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-semibold text-foreground">{score}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function Insight({ type, text }: { type: 'positive' | 'negative' | 'warning'; text: string }) {
  const dot = { positive: 'bg-success', negative: 'bg-error', warning: 'bg-warning' }[type];
  return (
    <div className="flex items-start gap-3 text-sm text-muted">
      <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${dot}`} />
      <p>{text}</p>
    </div>
  );
}
