import React from 'react';
import { CheckCircle2, AlertCircle, Lightbulb, Clock, MessageSquare, Heart, Quote, TrendingUp, Star, ShieldAlert } from 'lucide-react';
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
          <ScoreCard title="Clareza" score={analysis.dimensions?.clarity} />
          <ScoreCard title="Profundidade" score={analysis.dimensions?.depth} />
          <ScoreCard title="Conexão" score={analysis.dimensions?.connection} />
          <ScoreCard title="Eficiência" score={analysis.dimensions?.efficiency} />
          <ScoreCard title="Consistência" score={analysis.dimensions?.consistency} />
        </div>
      </div>

      {/* Talk Time & Detailed Stats */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Talk Time Bar */}
        <div className="glass rounded-3xl p-8 lg:col-span-1">
          <h3 className="text-sm font-semibold text-foreground/40 uppercase tracking-wider flex items-center gap-2 mb-6">
            <MessageSquare size={16} /> Equilíbrio de Fala
          </h3>
          <div className="space-y-6">
            <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-primary transition-all duration-1000" 
                style={{ width: `${analysis.talk_time?.mentor_percentage || 50}%` }}
              />
              <div 
                className="h-full bg-white/10 transition-all duration-1000" 
                style={{ width: `${analysis.talk_time?.mentee_percentage || 50}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-medium">
              <div className="flex flex-col gap-1">
                <span className="text-primary">Mentor</span>
                <span className="text-xl font-bold">{analysis.talk_time?.mentor_percentage}%</span>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <span className="text-foreground/40">Mentorado</span>
                <span className="text-xl font-bold">{analysis.talk_time?.mentee_percentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Question & Empathy Stats */}
        <div className="glass rounded-3xl p-8 lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-foreground/40 font-medium">Perguntas Abertas</span>
            <div className="text-3xl font-bold text-primary">{analysis.detailed_stats?.open_questions || 0}</div>
            <TrendingUp size={16} className="text-green-500/50" />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-foreground/40 font-medium">Perguntas Fechadas</span>
            <div className="text-3xl font-bold text-foreground/60">{analysis.detailed_stats?.closed_questions || 0}</div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-foreground/40 font-medium">Marcadores Empatia</span>
            <div className="text-3xl font-bold text-pink-500/80">{analysis.detailed_stats?.empathy_markers || 0}</div>
            <Heart size={16} className="text-pink-500/30" />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-foreground/40 font-medium">Looping/Síntese</span>
            <div className="text-3xl font-bold text-blue-500/80">{analysis.detailed_stats?.looping_count || 0}</div>
            <Quote size={16} className="text-blue-500/30" />
          </div>
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

      {/* Phase 2: Golden Questions & Red Flags */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Golden Questions */}
        {analysis.golden_questions && analysis.golden_questions.length > 0 && (
          <section className="glass rounded-3xl p-8 bg-amber-500/5 border-amber-500/20">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-500">
              <Star className="h-5 w-5 fill-amber-500/20" />
              Perguntas de Ouro
            </h3>
            <div className="mt-6 space-y-6">
              {analysis.golden_questions.map((gq: any, i: number) => (
                <div key={i} className="relative pl-6 border-l-2 border-amber-500/20">
                  <p className="text-base font-medium text-foreground italic">"{gq.question}"</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-foreground/40"><span className="text-amber-500/60 font-bold uppercase mr-1">Por que:</span> {gq.reason}</p>
                    <p className="text-xs text-foreground/40"><span className="text-amber-500/60 font-bold uppercase mr-1">Impacto:</span> {gq.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Red Flags */}
        {analysis.red_flags && analysis.red_flags.length > 0 && (
          <section className="glass rounded-3xl p-8 bg-red-500/5 border-red-500/20">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-red-500">
              <ShieldAlert className="h-5 w-5" />
              Pontos de Atenção (Red Flags)
            </h3>
            <div className="mt-6 space-y-6">
              {analysis.red_flags.map((rf: any, i: number) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                    <p className="text-sm font-semibold text-foreground/80">{rf.moment}</p>
                  </div>
                  <p className="pl-4 text-xs text-foreground/40 leading-relaxed">
                    <span className="text-red-500/60 font-bold uppercase mr-1">Risco:</span> {rf.risk}
                  </p>
                  <div className="pl-4 mt-2">
                    <div className="rounded-xl bg-white/5 p-3 text-xs text-foreground/60 border border-white/5">
                      <span className="text-green-500 font-bold mr-2">Alternativa:</span> {rf.alternative}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
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
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-foreground">{block.type}</h4>
                  {block.sentiment === 'Positive' && <span className="h-2 w-2 rounded-full bg-green-500 shadow-lg shadow-green-500/20" title="Sentimento Positivo" />}
                  {block.sentiment === 'Critical' && <span className="h-2 w-2 rounded-full bg-accent shadow-lg shadow-accent/20" title="Momento Crítico" />}
                </div>
                <div className="flex gap-2 text-xs text-foreground/30 font-mono">
                  <span>{block.start_time || '00:00'}</span>
                  {block.end_time && <span>- {block.end_time}</span>}
                </div>
              </div>
              <p className="mt-1 text-sm text-foreground/50">{block.summary}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
