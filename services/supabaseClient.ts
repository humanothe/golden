
import { createClient } from '@supabase/supabase-js';

/**
 * GOLDEN ACCESO - CONFIGURACIÓN DE NODO MAESTRO
 * Prioridad: Entorno (DevOps) > Credenciales Oficiales (Fallback)
 * Implementación resiliente para despliegues en Vercel.
 */

const OFFICIAL_URL = 'https://ctnfizlhasmjcbpzrryb.supabase.co';
const OFFICIAL_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0bmZpemxoYXNtamNicHpycnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NjYwMTUsImV4cCI6MjA4MzI0MjAxNX0.s-69HlbQSBM6_uL0rwg3cI9ilA_k9JKceS2up1GM_ns';

const getEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  try {
    // @ts-ignore
    return import.meta.env[key];
  } catch (e) {
    return undefined;
  }
};

const envUrl = getEnv('VITE_SUPABASE_URL');
const envKey = getEnv('VITE_SUPABASE_ANON_KEY');

export const supabaseUrl = envUrl || OFFICIAL_URL;
export const supabaseAnonKey = envKey || OFFICIAL_KEY;

// Nodo siempre marcado como configurado para evitar bloqueos en el UI durante el handshake inicial
export const isConfigured = true;

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined
    }
  }
);
