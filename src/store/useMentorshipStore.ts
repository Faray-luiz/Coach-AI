import { create } from 'zustand';
import { Analysis } from '@/lib/ai/schemas';

interface MentorshipState {
  sessionId: string | null;
  status: 'idle' | 'analyzing' | 'completed' | 'failed';
  analysis: Analysis | null;
  isCached: boolean;
  error: string | null;
  sessions: any[]; // List of all recordings
  
  // Actions
  startAnalysis: (params: { 
    transcript: string; 
    mentor_id: string; 
    mentee_name: string; 
    topic: string;
  }) => Promise<void>;
  
  pollStatus: (sessionId: string) => Promise<void>;
  reset: () => void;
  fetchSessions: () => Promise<void>;
  selectSession: (sessionId: string) => void;
}

export const useMentorshipStore = create<MentorshipState>((set, get) => ({
  sessionId: null,
  status: 'idle',
  analysis: null,
  isCached: false,
  error: null,
  sessions: [],

  reset: () => set({ sessionId: null, status: 'idle', analysis: null, isCached: false, error: null, sessions: [] }),

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

      // Se já veio completo (cache hit ou processamento síncrono offline), não precisa fazer polling
      if (data.status === 'completed' && data.analysis) {
        set({ status: 'completed', analysis: data.analysis, isCached: !!data.cached });
        // Recarrega a lista
        await get().fetchSessions();
      } else {
        // Inicia o polling
        get().pollStatus(data.sessionId);
      }
    } catch (err: any) {
      set({ status: 'failed', error: err.message });
    }
  },

  pollStatus: async (sessionId: string) => {
    const MAX_ATTEMPTS = 40;              // 40 × 3s ≈ 2 min
    const DEADLINE = Date.now() + 5 * 60 * 1000; // 5 min absolutos
    let attempts = 0;

    const check = async () => {
      if (get().sessionId !== sessionId) return;

      if (attempts >= MAX_ATTEMPTS || Date.now() > DEADLINE) {
        set({ status: 'failed', error: 'Tempo limite de análise excedido. Tente novamente.' });
        return;
      }

      attempts++;

      try {
        const response = await fetch(`/api/sessions/${sessionId}`);
        const data = await response.json();

        if (data.status === 'completed') {
          set({ status: 'completed', analysis: data.analysis_result });
          await get().fetchSessions();
        } else if (data.status === 'failed') {
          set({ status: 'failed', error: 'O processamento da IA falhou.' });
        } else {
          setTimeout(check, 3000);
        }
      } catch (err) {
        console.error('Polling error:', err);
        setTimeout(check, 5000);
      }
    };

    check();
  },

  fetchSessions: async () => {
    try {
      const response = await fetch('/api/sessions');
      if (response.ok) {
        const data = await response.json();
        set({ sessions: data });
        
        // Se não houver uma análise selecionada ativa, seleciona a primeira mais recente
        if (data.length > 0 && !get().analysis) {
          const latest = data[0];
          if (latest.status === 'completed' && latest.analysis_result) {
            set({ 
              analysis: latest.analysis_result,
              sessionId: latest.id,
              status: 'completed'
            });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  },

  selectSession: (sessionId: string) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (session) {
      set({ 
        analysis: session.analysis_result,
        sessionId: session.id,
        status: session.status === 'completed' ? 'completed' : 'failed'
      });
    }
  }
}));

