import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext'; 
import { MoveLeft, Loader2, XCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export const AuthPage: React.FC<{ mode: 'login' | 'register' }> = ({ mode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  
  const { signIn, signUp, isAuthenticated, loading: authLoading, refreshProfile } = useAuth();
  const { branding, getSafeAsset, getThemeLogo } = useUI(); 
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isActionInProgress) return;
    setError(null); 
    setIsActionInProgress(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      
      if (mode === 'login') {
        const result = await signIn(cleanEmail, password);
        if (result.error) {
          setError(result.error.includes('Invalid') ? 'CREDENCIALES INCORRECTAS' : result.error.toUpperCase());
          setIsActionInProgress(false);
        } else {
          await refreshProfile();
          navigate('/dashboard');
        }
      } else {
        const result = await signUp(cleanEmail, password);
        if (result.error) {
          setError(result.error.toUpperCase());
          setIsActionInProgress(false);
        } else {
          setSuccess("CUENTA CREADA. REDIRIGIENDO...");
          setTimeout(() => navigate('/onboarding'), 1500);
        }
      }
    } catch (err) {
      setError("ERROR DE CONEXIÓN CRÍTICO");
      setIsActionInProgress(false);
    }
  };

  const currentBgRaw = mode === 'login' ? branding.bg_login : branding.bg_register;
  const safeBg = getSafeAsset(currentBgRaw);
  const masterLogo = getThemeLogo('dark');

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0a0a0a] relative overflow-hidden text-white font-sans pt-[env(safe-area-inset-top)]">
      {/* ATMÓSFERA LUMÍNICA ESFÉRICA - AUTH */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {safeBg && <div className="absolute inset-0 bg-cover bg-center opacity-30 animate-scale-slow" style={{ backgroundImage: `url("${safeBg}")` }}></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
        
        {/* Orbes de Esquina - Layout Asimétrico */}
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] opacity-25"
             style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
        <div className="absolute -top-[15%] -right-[15%] w-[60%] h-[60%] opacity-35"
             style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.3) 0%, transparent 70%)', filter: 'blur(100px)' }}></div>
      </div>

      {/* CONTENEDOR MAESTRO: Alineación a la Izquierda en PC/Tablet */}
      <div className="relative z-50 flex-grow flex flex-col justify-center px-8 md:px-20 lg:px-32 w-full max-w-[1920px] mx-auto">
        
        <div className="max-w-xl w-full text-left animate-fade-in py-6 md:py-12">
          {/* BOTÓN RETROCEDER */}
          <button 
            onClick={() => navigate('/')} 
            className="mb-8 md:mb-12 flex items-center gap-2 text-white/40 hover:text-gold-400 transition-all active:scale-90"
          >
            <MoveLeft size={24} strokeWidth={1} />
          </button>

          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white/5 border border-white/10 mb-8 md:mb-10 flex items-center justify-center overflow-hidden shadow-2xl backdrop-blur-md">
            <img src={masterLogo} className="w-8 h-8 md:w-10 md:h-10 object-contain brightness-150 grayscale" alt="Logo" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-heading font-black text-white uppercase tracking-tighter mb-3 leading-none">
            {mode === 'login' ? 'ACCEDER' : 'CREAR CUENTA'}
          </h1>
          
          <div className="flex items-center gap-3 mb-8 md:mb-12">
             <div className="h-[1px] w-6 bg-gold-400/40"></div>
             <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gold-400/80 whitespace-nowrap">
                {mode === 'login' ? 'AHORRO • EXCLUSIVIDAD • SEGURIDAD' : 'EL ACCESO COMIENZA AQUÍ'}
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 w-full">
            <div className="space-y-2">
              <label className="text-[8px] font-bold uppercase tracking-[0.5em] text-gray-500 ml-1">correo electrónico</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full bg-transparent border-b border-white/10 py-3 text-lg outline-none focus:border-gold-400 text-white transition-all font-light placeholder:text-[9px] placeholder:tracking-[0.3em] placeholder:text-white/10 placeholder:uppercase" 
                placeholder="nombre@ejemplo.com" 
                required 
              />
            </div>
            
            <div className="space-y-2 relative">
              <label className="text-[8px] font-bold uppercase tracking-[0.5em] text-gray-500 ml-1">contraseña maestra</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full bg-transparent border-b border-white/10 py-3 text-lg outline-none focus:border-gold-400 text-white transition-all font-light tracking-widest placeholder:text-white/10" 
                  placeholder="••••••••"
                  required 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gold-400 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 font-black text-[8px] uppercase tracking-[0.2em] animate-shake">
                <XCircle size={14}/> {error}
              </div>
            )}
            
            {success && <div className="text-green-500 font-black text-[8px] uppercase flex items-center gap-3 bg-green-500/10 p-4 rounded-xl border border-green-500/20"><CheckCircle2 size={14}/> {success}</div>}

            <div className="pt-4 space-y-6">
              <button 
                type="submit" 
                disabled={isActionInProgress}
                className="w-full py-5 bg-gradient-to-r from-white to-platinum text-black font-black text-[10px] uppercase tracking-[0.5em] hover:from-gold-400 hover:to-gold-300 transition-all flex justify-center items-center gap-4 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] active:scale-95 group"
              >
                {isActionInProgress ? <Loader2 className="animate-spin" size={18}/> : (mode === 'login' ? 'INGRESAR AHORA' : 'CREAR IDENTIDAD')}
              </button>
              
              <button 
                  type="button"
                  onClick={() => navigate(mode === 'login' ? '/register' : '/login')}
                  className="w-full text-left text-[8px] font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors pl-1"
              >
                  {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya eres socio? Inicia sesión'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};