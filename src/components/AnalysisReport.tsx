import React from 'react';
import { CheckCircle2, AlertCircle, Lightbulb, Clock } from 'lucide-react';
import { ScoreCard } from './ScoreCard';

interface AnalysisReportProps {
  analysis: any; // Using any for simplicity in this task, should use the type from schemas
}

export const AnalysisReport: React.FC<AnalysisReportProps> = ({ analysis }) => {
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Overview Scores */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ScoreCard 
          title="Mentoring Effectiveness Score (MES)" 
          score={analysis.mes_score} 
          description="Score consolidado da qualidade da sessão"
        />
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <ScoreCard title="Clareza" score={analysis.clarity_score} />
          <ScoreCard title="Profundidade" score={analysis.depth_score} />
          <ScoreCard title="Conexão" score={analysis.connection_score} />
          <ScoreCard title="Eficiência" score={analysis.efficiency_score} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Strengths & Improvements */}
        <div className="space-y-6">
          <section className="glass rounded-3xl p-8">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              Pontos Fortes
            </h3>
            <ul className="mt-4 space-y-3">
              {analysis.strengths.map((item: string, i: number) => (
                <li key={i} className="text-sm text-foreground/70 flex gap-2">
                  <span className="text-primary">•</span> {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="glass rounded-3xl p-8 border-accent/20">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <AlertCircle className="h-5 w-5 text-accent" />
              Oportunidades de Melhoria
            </h3>
            <ul className="mt-4 space-y-3">
              {analysis.improvements.map((item: string, i: number) => (
                <li key={i} className="text-sm text-foreground/70 flex gap-2">
                  <span className="text-accent">•</span> {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Micro-adjustments */}
        <section className="glass rounded-3xl p-8 bg-primary/5 border-primary/20">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Lightbulb className="h-5 w-5 text-primary" />
            Micro-ajustes (Próximos Passos)
          </h3>
          <div className="mt-6 space-y-6">
            {analysis.micro_adjustments.map((adj: any, i: number) => (
              <div key={i} className="space-y-2">
                <h4 className="text-sm font-bold text-primary">{adj.topic}</h4>
                <p className="text-sm text-foreground/80 leading-relaxed italic">
                  "{adj.suggestion}"
                </p>
                {adj.context_snippet && (
                  <div className="mt-2 rounded-lg bg-black/20 p-3 text-xs text-foreground/40 font-mono">
                    Contexto: {adj.context_snippet}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Conversation Flow */}
      <section className="glass rounded-3xl p-8">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Clock className="h-5 w-5 text-foreground/60" />
          Estrutura da Conversa
        </h3>
        <div className="mt-8 relative border-l border-white/10 ml-4 space-y-8 pb-4">
          {analysis.conversation_blocks.map((block: any, i: number) => (
            <div key={i} className="relative pl-8">
              <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
              <div className="flex items-baseline justify-between gap-4">
                <h4 className="font-semibold text-foreground">{block.type}</h4>
                {block.duration_estimate && (
                  <span className="text-xs text-foreground/30 font-mono">{block.duration_estimate}</span>
                )}
              </div>
              <p className="mt-1 text-sm text-foreground/50">{block.summary}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
