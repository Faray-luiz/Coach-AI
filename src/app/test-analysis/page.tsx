'use client';

import React, { useState } from 'react';
import { AnalysisReport } from '@/components/AnalysisReport';
import { Play, Loader2, FileText, Brain, Zap, AlertCircle, Trash2 } from 'lucide-react';
import { SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { useMentorshipStore } from '@/store/useMentorshipStore';

const SYNTHETIC_TRANSCRIPT = `Mentor: Olá, como você está hoje?
Mentorado: Estou um pouco sobrecarregado, para ser honesto. Sinto que minha equipe não está performando como deveria.
Mentor: Entendo. O que especificamente na performance deles está te preocupando mais?
Mentorado: Eles parecem desmotivados e perdem prazos constantemente. Eu acabo tendo que fazer o trabalho deles.
Mentor: Sei como é. E se você pudesse mudar apenas uma coisa na sua comunicação com eles hoje, o que teria o maior impacto?
Mentorado: Talvez se eu fosse mais claro nas expectativas desde o início...
Mentor: Interessante. O que te impede de marcar uma conversa de alinhamento individual com cada um ainda hoje?`;

export default function TestAnalysisPage() {
  const [transcript, setTranscript] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [isClearing, setIsClearing] = useState(false);
  const { status, analysis: result, isCached, error, startAnalysis, reset } = useMentorshipStore();

  const isLoading = status === 'analyzing';

  const handleTest = async () => {
    if (!transcript) return;
    await startAnalysis({ transcript, mentor_id: 'test-mentor', mentee_name: 'Test Mentee', topic: 'Mentoria Experimental' });
  };

  const handleClearHistory = async () => {
    if (!confirm('Apagar TODAS as análises? Esta ação não pode ser desfeita.')) return;
    setIsClearing(true);
    try {
      const res = await fetch('/api/analyze', { method: 'DELETE' });
      if (res.ok) { reset(); alert('Histórico removido.'); }
      else alert('Erro ao remover histórico.');
    } catch (e) {
      console.error(e);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="bg-background min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary-light flex items-center justify-center">
              <Play size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Testar Simi Treinadora</h1>
              <p className="text-sm text-muted">Cole uma transcrição para ver a análise em ação.</p>
            </div>
          </div>
          <button
            onClick={handleClearHistory}
            disabled={isClearing}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:border-error hover:text-error hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {isClearing ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
            Limpar Histórico
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Config panel */}
          <aside className="card rounded-xl p-6 flex flex-col gap-5 h-fit lg:sticky lg:top-24">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Brain size={16} className="text-primary" /> Configurações da IA
              </h2>
              <p className="text-xs text-muted mt-1">Ajuste as instruções da Simi.</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">System Prompt</label>
              <textarea
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                className="w-full rounded-lg border border-border bg-gray-50 p-3 text-xs font-mono min-h-[200px] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-y"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted">Transcrição da Sessão</label>
                <button
                  onClick={() => setTranscript(SYNTHETIC_TRANSCRIPT)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <FileText size={11} /> Usar dado sintético
                </button>
              </div>
              <textarea
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                placeholder="Cole a transcrição da mentoria aqui..."
                className="w-full rounded-lg border border-border bg-gray-50 p-3 text-sm min-h-[200px] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-y leading-relaxed"
              />
            </div>

            <button
              onClick={handleTest}
              disabled={isLoading || !transcript}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading
                ? <><Loader2 className="animate-spin" size={16} /> Analisando...</>
                : <><Zap size={16} /> Analisar Transcrição</>}
            </button>
          </aside>

          {/* Results */}
          <section className="flex flex-col gap-4">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3 animate-fade-in-up">
                <AlertCircle size={18} className="text-error shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {result ? (
              <>
                {isCached && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 flex items-center gap-2">
                    <span className="text-success text-sm">⚡</span>
                    <span className="text-sm font-medium text-green-700">Resultado do Cache</span>
                    <span className="text-xs text-green-600 ml-auto">0 tokens consumidos</span>
                  </div>
                )}
                <AnalysisReport analysis={result} />
              </>
            ) : (
              <div className="card rounded-xl p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
                <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center mb-4">
                  <Play size={20} className="text-primary opacity-60" />
                </div>
                <p className="text-sm font-medium text-muted">Aguardando análise</p>
                <p className="text-xs text-muted/70 max-w-xs mt-1">
                  O resultado aparecerá aqui após o processamento.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
