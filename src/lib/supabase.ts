import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Initialize only if keys are present and look like a URL
export const supabase = (supabaseUrl && supabaseUrl.startsWith('http')) 
  ? createClient(supabaseUrl, supabaseAnonKey!)
  : (null as any); // Fallback for test mode

let isOnlineCached: boolean | null = null;
let isOnlineCachedAt = 0;
const ONLINE_CACHE_TTL_MS = 30_000;

/**
 * Verifica a conectividade com o Supabase com tempo de limite de 2 segundos.
 * O resultado é cacheado por 30s para evitar latência em cada request,
 * mas expira para detectar quedas ou recuperação do Supabase em produção.
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  if (!supabase) return false;
  if (isOnlineCached !== null && Date.now() - isOnlineCachedAt < ONLINE_CACHE_TTL_MS) {
    return isOnlineCached;
  }

  try {
    const checkPromise = supabase.from('mentorship_sessions').select('id').limit(1);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 2000)
    );

    const result = await Promise.race([checkPromise, timeoutPromise]) as any;

    if (result && result.error && (result.error.message.includes('fetch') || result.error.message.includes('getaddrinfo'))) {
      throw new Error(result.error.message);
    }

    isOnlineCached = true;
    isOnlineCachedAt = Date.now();
    return true;
  } catch (error: any) {
    console.warn("[Supabase] Modo Off-line ativado. Erro de conexão:", error.message || error);
    isOnlineCached = false;
    isOnlineCachedAt = Date.now();
    return false;
  }
}

