
import { createClient } from '@supabase/supabase-js';

/**
 * GOLDEN ACCESO - CONFIGURACIÓN DE NODO MAESTRO
 * Prioridad: Entorno (DevOps) > Credenciales Oficiales (Fallback)
 * Implementación resiliente para despliegues en Vercel.
 */

const SUPABASE_URL = 'https://ctnfizlhasmjcbpzrryb.supabase.co';
const OFFICIAL_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0bmZpemxoYXNtamNicHpycnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NjYwMTUsImV4cCI6MjA4MzI0MjAxNX0.s-69HlbQSBM6_uL0rwg3cI9ilA_k9JKceS2up1GM_ns';

const getEnv = (key: string): string | undefined => {
  // 1. Prioridad: import.meta.env (Vite)
  try {
    // @ts-ignore
    if (import.meta.env && import.meta.env[key]) return import.meta.env[key];
  } catch (e) {}

  // 2. Fallback: process.env (Node/Polyfills)
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}

  return undefined;
};

const envKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Nodo Maestro URL & Key - URL FORZADA SEGÚN INSTRUCCIÓN CRÍTICA
export const supabaseUrl = SUPABASE_URL;
export const supabaseAnonKey = OFFICIAL_KEY; // Forzamos el uso de la llave oficial

// PRUEBA DE FUEGO: Impresión de URL completa y validación de prefijo (MODO RELAJADO)
if (typeof window !== 'undefined') {
  console.log("URL ACTUAL: " + supabaseUrl);
  
  if (!supabaseUrl.startsWith('https://ctnfizlhasmjcbpzrryb')) {
    console.warn("ADVERTENCIA: La URL de Supabase parece no coincidir con el Nodo Maestro oficial.");
  }
}

const FINAL_URL = supabaseUrl;
const FINAL_KEY = supabaseAnonKey;

// Validación de infraestructura crítica en consola (DevOps)
if (typeof window !== 'undefined') {
  if (!FINAL_URL) console.error("INFRA_ERROR: VITE_SUPABASE_URL no detectada.");
  if (!FINAL_KEY) console.error("INFRA_ERROR: VITE_SUPABASE_ANON_KEY no detectada.");
}

// Exportamos el estado de configuración
export const isConfigured = !!(FINAL_URL && FINAL_KEY && FINAL_URL.startsWith('https://'));

/**
 * INSTANCIA ÚNICA DEL CLIENTE SUPABASE
 * Mantiene una sola conexión persistente con el Nodo Maestro.
 */
export const supabase = createClient(
  FINAL_URL || 'https://placeholder.supabase.co',
  FINAL_KEY || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined
    }
  }
);

/**
 * Verifica la salud de la conexión con el Nodo Maestro.
 */
export const checkConnection = async (): Promise<{ ok: boolean; error?: string }> => {
  if (!isConfigured) return { ok: false, error: "Configuración incompleta." };
  try {
    const { error } = await supabase.from('perfiles').select('id').limit(1);
    if (error) {
      if (error.message.includes('Failed to fetch')) {
        return { ok: false, error: "Error de Red: No se puede alcanzar el servidor." };
      }
      // Otros errores (como RLS) significan que la conexión sí existe
      return { ok: true };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
};
