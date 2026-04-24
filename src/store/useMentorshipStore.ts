import { create } from 'zustand';
import { Analysis } from '@/lib/ai/schemas';

interface MentorshipState {
  sessionId: string | null;
  status: 'idle' | 'analyzing' | 'completed' | 'failed';
  analysis: Analysis | null;
  isCached: boolean;
  error: string | null;
  
  // Actions
  startAnalysis: (params: { 
    transcript: string; 
    mentor_id: string; 
    mentee_name: string; 
    topic: string;
  }) => Promise<void>;
  
  pollStatus: (sessionId: string) => Promise<void>;
  reset: () => void;
}

export const useMentorshipStore = create<MentorshipState>((set, get) => ({
  sessionId: null,
  status: 'idle',
  analysis: null,
  isCached: false,
  error: null,

  reset: () => set({ sessionId: null, status: 'idle', analysis: null, isCached: false, error: null }),

  startAnalysis: async (params) => {
    set({ status: 'analyzing', error: null, analysis: null, isCached: false });

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Erro ao iniciar análise');

      set({ sessionId: data.sessionId });

      // Se já veio completo (cache hit), não precisa fazer polling
      if (data.status === 'completed' && data.analysis) {
        set({ status: 'completed', analysis: data.analysis, isCached: !!data.cached });
      } else {
        // Inicia o polling
        get().pollStatus(data.sessionId);
      }
    } catch (err: any) {
      set({ status: 'failed', error: err.message });
    }
  },

  pollStatus: async (sessionId: string) => {
    const check = async () => {
      // Evita continuar se o usuário resetou o store
      if (get().sessionId !== sessionId) return;

      try {
        const response = await fetch(`/api/sessions/${sessionId}`);
        const data = await response.json();

        if (data.status === 'completed') {
          set({ status: 'completed', analysis: data.analysis_result });
        } else if (data.status === 'failed') {
          set({ status: 'failed', error: 'O processamento da IA falhou.' });
        } else {
          // Tenta novamente em 3 segundos
          setTimeout(check, 3000);
        }
      } catch (err) {
        console.error('Polling error:', err);
        setTimeout(check, 5000);
      }
    };

    check();
  }
}));
