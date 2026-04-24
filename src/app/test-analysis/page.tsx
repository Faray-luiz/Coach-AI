'use client';

import React, { useState } from 'react';
import { AnalysisReport } from '@/components/AnalysisReport';
import { Play, Loader2, FileText, Brain, Zap, LayoutDashboard, AlertCircle } from 'lucide-react';
import { SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { useMentorshipStore } from '@/store/useMentorshipStore';

export default function TestAnalysisPage() {
  const [transcript, setTranscript] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const { 
    status, 
    analysis: result, 
    isCached,
    error, 
    startAnalysis, 
    reset 
  } = useMentorshipStore();

  const isLoading = status === 'analyzing';

  const handleTest = async () => {
    if (!transcript) return;
    
    await startAnalysis({
      transcript,
      mentor_id: 'test-mentor',
      mentee_name: 'Test Mentee',
      topic: 'Mentoria Experimental',
    });
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
              </div>
            </div>
          </section>

          <section>
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-fade-in mb-4">
                <AlertCircle className="text-red-500" size={20} />
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}
            {result ? (
              <div className="flex flex-col gap-3">
                {isCached && (
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
