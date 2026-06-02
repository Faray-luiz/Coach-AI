import React from 'react';
import { CheckCircle2, AlertCircle, Lightbulb, Clock, MessageSquare, Heart, Quote, TrendingUp, Star, ShieldAlert } from 'lucide-react';
import { ScoreCard } from './ScoreCard';
import type { Analysis } from '@/lib/ai/schemas';

interface AnalysisReportProps {
  analysis: Analysis;
}

export const AnalysisReport: React.FC<AnalysisReportProps> = ({ analysis }) => {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Score grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ScoreCard
          title="Mentoring Effectiveness Score (MES)"
          score={analysis.mes_score}
          description="Score consolidado da qualidade da sessão"
        />
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <ScoreCard title="Clareza"       score={analysis.dimensions?.clarity} />
          <ScoreCard title="Profundidade"  score={analysis.dimensions?.depth} />
          <ScoreCard title="Conexão"       score={analysis.dimensions?.connection} />
          <ScoreCard title="Eficiência"    score={analysis.dimensions?.efficiency} />
          <ScoreCard title="Consistência"  score={analysis.dimensions?.consistency} />
        </div>
      </div>

      {/* Talk time + Stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Talk time */}
        <div className="card rounded-xl p-6">
          <h3 className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider mb-5">
            <MessageSquare size={14} /> Equilíbrio de Fala
          </h3>
          <div className="h-3 w-full rounded-full overflow-hidden flex bg-gray-100">
            <div
              className="h-full bg-primary transition-all duration-700 rounded-l-full"
              style={{ width: `${analysis.talk_time?.mentor_percentage ?? 50}%` }}
            />
            <div
              className="h-full bg-gray-300 transition-all duration-700 rounded-r-full"
              style={{ width: `${analysis.talk_time?.mentee_percentage ?? 50}%` }}
            />
          </div>
          <div className="flex justify-between mt-4 text-sm">
            <div>
              <p className="text-xs text-muted font-medium">Mentor</p>
              <p className="text-2xl font-bold text-primary">{analysis.talk_time?.mentor_percentage}%</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted font-medium">Mentorado</p>
              <p className="text-2xl font-bold text-foreground">{analysis.talk_time?.mentee_percentage}%</p>
            </div>
          </div>
        </div>

        {/* Stat counters */}
        <div className="card rounded-xl p-6 lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <StatCounter label="Perguntas Abertas"  value={analysis.detailed_stats?.open_questions ?? 0}  color="text-primary"      Icon={TrendingUp} />
          <StatCounter label="Perguntas Fechadas" value={analysis.detailed_stats?.closed_questions ?? 0} color="text-muted"        />
          <StatCounter label="Marcadores Empatia" value={analysis.detailed_stats?.empathy_markers ?? 0}  color="text-pink-600"     Icon={Heart} />
          <StatCounter label="Looping/Síntese"    value={analysis.detailed_stats?.looping_count ?? 0}    color="text-blue-600"     Icon={Quote} />
        </div>
      </div>

      {/* Strengths + Improvements */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card rounded-xl p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
            <CheckCircle2 className="h-4 w-4 text-success" /> Pontos Fortes
          </h3>
          <ul className="space-y-3">
            {analysis.strengths.map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="card rounded-xl p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
            <AlertCircle className="h-4 w-4 text-warning" /> Oportunidades de Melhoria
          </h3>
          <ul className="space-y-3">
            {analysis.improvements.map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Micro-adjustments */}
      <div className="card rounded-xl p-6 bg-primary-light border-primary/20">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-primary mb-5">
          <Lightbulb className="h-4 w-4" /> Micro-ajustes · Próximos Passos
        </h3>
        <div className="space-y-5">
          {analysis.micro_adjustments.map((adj, i) => (
            <div key={i} className="space-y-1.5">
              <p className="text-sm font-semibold text-primary">{adj.topic}</p>
              <p className="text-sm text-foreground leading-relaxed">"{adj.suggestion}"</p>
              {adj.context_snippet && (
                <p className="text-xs text-muted bg-white/60 rounded-lg px-3 py-2 font-mono border border-primary/10">
                  Contexto: {adj.context_snippet}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Golden questions + Red flags */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {analysis.golden_questions?.length > 0 && (
          <div className="card rounded-xl p-6 bg-amber-50 border-amber-200">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-700 mb-5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Perguntas de Ouro
            </h3>
            <div className="space-y-5">
              {analysis.golden_questions.map((gq, i) => (
                <div key={i} className="pl-4 border-l-2 border-amber-300 space-y-1">
                  <p className="text-sm font-medium text-foreground">"{gq.question}"</p>
                  <p className="text-xs text-muted"><span className="font-semibold text-amber-600 uppercase mr-1">Por que:</span>{gq.reason}</p>
                  {gq.impact && <p className="text-xs text-muted"><span className="font-semibold text-amber-600 uppercase mr-1">Impacto:</span>{gq.impact}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.red_flags?.length > 0 && (
          <div className="card rounded-xl p-6 bg-red-50 border-red-200">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-red-600 mb-5">
              <ShieldAlert className="h-4 w-4" /> Pontos de Atenção
            </h3>
            <div className="space-y-5">
              {analysis.red_flags.map((rf, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-error shrink-0" />
                    <p className="text-sm font-semibold text-foreground">{rf.moment}</p>
                  </div>
                  <p className="pl-3.5 text-xs text-muted"><span className="font-semibold text-red-600 uppercase mr-1">Risco:</span>{rf.risk}</p>
                  {rf.alternative && (
                    <div className="pl-3.5">
                      <p className="text-xs bg-white rounded-lg px-3 py-2 border border-red-200">
                        <span className="font-semibold text-success mr-1">Alternativa:</span>{rf.alternative}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Conversation flow */}
      <div className="card rounded-xl p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-6">
          <Clock className="h-4 w-4 text-muted" /> Estrutura da Conversa
        </h3>
        <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 pb-2">
          {analysis.conversation_blocks.map((block, i) => (
            <div key={i} className="relative pl-7">
              <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary ring-2 ring-white" />
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{block.type}</span>
                  {block.sentiment === 'Positive' && <span className="h-2 w-2 rounded-full bg-success" title="Positivo" />}
                  {block.sentiment === 'Critical' && <span className="h-2 w-2 rounded-full bg-error" title="Crítico" />}
                </div>
                <span className="text-xs text-muted font-mono">
                  {block.start_time ?? '00:00'}{block.end_time ? ` – ${block.end_time}` : ''}
                </span>
              </div>
              <p className="text-sm text-muted">{block.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function StatCounter({ label, value, color, Icon }: { label: string; value: number; color: string; Icon?: React.ElementType }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted font-medium">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {Icon && <Icon size={14} className={`${color} opacity-60`} />}
    </div>
  );
}
