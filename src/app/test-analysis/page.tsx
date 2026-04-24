'use client';

import React, { useState } from 'react';
import { AnalysisReport } from '@/components/AnalysisReport';
import { Play, Loader2, FileText, Brain, Zap, LayoutDashboard } from 'lucide-react';
import { SYSTEM_PROMPT } from '@/lib/ai/prompts';

export default function TestAnalysisPage() {
  const [transcript, setTranscript] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [fromCache, setFromCache] = useState(false);

  const handleTest = async () => {
    setIsLoading(true);
    setResult(null);
    setFromCache(false);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          systemPrompt,
          mentor_id: 'test-mentor',
          mentee_name: 'Test Mentee',
          topic: 'Mentoria Experimental',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      // ── Fluxo A: Cache Hit — resultado imediato ───────────────────────────
      if (data.status === 'completed' && data.analysis) {
        setResult(data.analysis);
        setFromCache(data.cached === true);
        setIsLoading(false);
        return;
      }

      // ── Fluxo B: Job enfileirado — polling do Inngest ────────────────────
      if (data.status === 'queued' && data.sessionId) {
        const sessionId = data.sessionId;
        let polls = 0;
        const MAX_POLLS = 120; // 120 × 3s = 6 minutos

        const poll = setInterval(async () => {
          polls++;
          if (polls > MAX_POLLS) {
            clearInterval(poll);
            alert('A análise está demorando mais que o esperado. Verifique o Inngest Dashboard.');
            setIsLoading(false);
            return;
          }

          try {
            const statusRes = await fetch(`/api/analyze/status?sessionId=${sessionId}`);
            const statusData = await statusRes.json();

            if (statusData.status === 'completed' && statusData.analysis) {
              clearInterval(poll);
              setResult(statusData.analysis);
              setFromCache(false);
              setIsLoading(false);
            } else if (statusData.status === 'failed' || statusData.error) {
              clearInterval(poll);
              alert(`Erro no processamento: ${statusData.error || 'Falha no job da IA'}`);
              setIsLoading(false);
            }
            // 'pending' ou 'processing' → continua polling
          } catch (_) {
            // ignora falhas de rede temporárias no polling
          }
        }, 3000);
        return;
      }

      throw new Error('Resposta inesperada do servidor.');
    } catch (error: any) {
      console.error(error);
      alert(`Erro na Análise: ${error.message}`);
      setIsLoading(false);
    }
  };


  return (
    <div className="bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
            <Play className="text-primary" /> Testar Simi Treinadora
          </h1>
          <p className="text-foreground/40 mt-1 text-sm sm:text-base">Cole uma transcrição abaixo para ver a Simi em ação.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 h-fit lg:sticky lg:top-24">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Brain className="text-primary" size={24} />
                Configurações da IA
              </h2>
              <p className="text-foreground/60 text-sm">
                Ajuste as instruções da Simi para melhorar a análise.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 opacity-50">System Prompt</label>
                <textarea 
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Instruções para o modelo..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[300px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium opacity-50">Transcrição da Sessão</label>
                  <button 
                    onClick={() => setTranscript(`Mentor: Olá, como você está hoje?
Mentorado: Estou um pouco sobrecarregado, para ser honesto. Sinto que minha equipe não está performando como deveria.
Mentor: Entendo. O que especificamente na performance deles está te preocupando mais?
Mentorado: Eles parecem desmotivados e perdem prazos constantemente. Eu acabo tendo que fazer o trabalho deles.
Mentor: Sei como é. E se você pudesse mudar apenas uma coisa na sua comunicação com eles hoje, o que teria o maior impacto?
Mentorado: Talvez se eu fosse mais claro nas expectativas desde o início...
Mentor: Interessante. O que te impede de marcar uma conversa de alinhamento individual com cada um ainda hoje?`)}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <FileText size={12} /> Usar Dados Sintéticos
                  </button>
                </div>
                <textarea 
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Cole aqui a transcrição da mentoria ou use o dado sintético acima..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[250px] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={handleTest}
                  disabled={isLoading || !transcript}
                  className="bg-primary py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" /> Analisando...
                    </>
                  ) : (
                    <>
                      <Zap size={18} /> Analisar Transcrição Real
                    </>
                  )}
                </button>
                
                <button 
                  onClick={() => setResult({
                    mes_score: 82,
                    dimensions: { clarity: 85, depth: 70, connection: 90, efficiency: 80, consistency: 85 },
                    strengths: ["Empatia demonstrada no início", "Alinhamento de expectativas"],
                    improvements: ["Falta de síntese final", "Poderia aprofundar no 'porquê' do estresse"],
                    micro_adjustments: [
                      { topic: "Looping for Understanding", suggestion: "Antes de sugerir a 1:1, resuma o que ouviu ('Pelo que entendi...')", context_snippet: "Ah, eu mando uma mensagem no Slack..." },
                      { topic: "Refinar o Encerramento", suggestion: "Peça ao mentorado para definir uma data para a ação.", context_snippet: "Então tá bom, até a próxima!" }
                    ],
                    talk_time: { mentor_percentage: 35, mentee_percentage: 65 },
                    detailed_stats: { open_questions: 8, closed_questions: 3, empathy_markers: 5, looping_count: 4 },
                    conversation_blocks: [
                      { type: "Abertura", summary: "Check-in emocional e alinhamento.", start_time: "00:00", end_time: "03:00", sentiment: "Positive" },
                      { type: "Exploração", summary: "Discussão profunda sobre liderança.", start_time: "03:00", end_time: "15:00", sentiment: "Neutral" },
                      { type: "Síntese", summary: "Resumo dos pontos chave.", start_time: "15:00", end_time: "18:00", sentiment: "Positive" },
                      { type: "Ação", summary: "Definição de próximos passos.", start_time: "18:00", end_time: "20:00", sentiment: "Positive" }
                    ],
                    golden_questions: [
                      { 
                        question: "Se você pudesse mudar apenas uma coisa na sua comunicação hoje, qual teria o maior impacto na equipe?", 
                        reason: "Pergunta de escala e foco.", 
                        impact: "O mentorado parou para refletir sobre a causa raiz em vez de sintomas." 
                      }
                    ],
                    red_flags: [
                      { 
                        moment: "O mentor interrompeu o relato do mentee aos 04:30.", 
                        risk: "Pode ter cortado um insight importante sobre o conflito.", 
                        alternative: "Espere 2 segundos de silêncio antes de intervir." 
                      }
                    ]
                  })}
                  className="bg-white/5 border border-white/10 py-3 rounded-2xl font-medium text-foreground/60 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <LayoutDashboard size={16} /> Ver Demo do Dashboard
                </button>
              </div>
            </div>
          </section>

          <section>
            {result ? (
              <div className="flex flex-col gap-3">
                {fromCache && (
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-2.5">
                    <span className="text-emerald-400 text-sm">⚡</span>
                    <span className="text-emerald-400 text-sm font-medium">Resultado do Cache</span>
                    <span className="text-emerald-400/60 text-xs ml-auto">Retornado instantaneamente · 0 tokens consumidos</span>
                  </div>
                )}
                <AnalysisReport analysis={result} />
              </div>
            ) : (
              <div className="glass rounded-3xl p-12 h-full flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Play className="text-primary/40" />
                </div>
                <h3 className="text-lg font-semibold text-foreground/60">Aguardando Análise</h3>
                <p className="text-sm text-foreground/30 max-w-xs mt-2">
                  O resultado da análise comportamental aparecerá aqui após o processamento.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
