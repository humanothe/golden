import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Shield, Lock, Mail, Loader2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-400/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-400/5 blur-[120px] rounded-full"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-gold-400/30 mb-6">
            <Shield className="text-gold-400" size={32} />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">
            Golden <span className="text-gold-400">Acceso</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/40">Sistema de Gestión Patrimonial</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-8 backdrop-blur-xl">
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Email Institucional</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 py-4 pl-12 pr-4 text-white focus:border-gold-400 outline-none transition-all"
                  placeholder="socio@goldenacceso.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 py-4 pl-12 pr-4 text-white focus:border-gold-400 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-[10px] uppercase font-bold tracking-widest text-center bg-red-500/10 py-2 border border-red-500/20">
                {error}
              </p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gold-400 text-black py-4 font-black uppercase tracking-[0.2em] text-xs hover:bg-white transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  {isSignUp ? 'Crear Cuenta Patrimonial' : 'Acceder al Sistema'}
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[10px] uppercase tracking-widest text-white/40 hover:text-gold-400 transition-colors"
            >
              {isSignUp ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Solicita Acceso'}
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-[8px] uppercase tracking-[0.3em] text-white/20">
          Acceso Restringido a Socios Autorizados
        </p>
      </motion.div>
    </div>
  );
};
