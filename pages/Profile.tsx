import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { api } from '../services/api';
import { 
    LogOut, ChevronRight, Crown, Loader2, Store, Receipt, PlusCircle, AlertCircle,
    ShieldCheck
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, signOut, refreshProfile, businessStatus } = useAuth();
  const { getThemeLogo } = useUI();
  const navigate = useNavigate();
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [editProfileData, setEditProfileData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    sector: user?.sector || ''
  });

  useEffect(() => { 
    if (user) {
      setEditProfileData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        sector: user.sector || ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      await api.auth.updateProfile(user.id, {
        full_name: editProfileData.full_name,
        telefono: editProfileData.phone,
        provincia: editProfileData.sector
      });
      await refreshProfile();
      setSuccessMsg("SISTEMA ACTUALIZADO");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) { 
      setErrorMsg("ERROR: " + err.message); 
      setTimeout(() => setErrorMsg(null), 4000);
    } finally { 
      setIsUpdatingProfile(false); 
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
    navigate('/');
  };

  const masterLogo = getThemeLogo('dark');

  useEffect(() => {
    if (showLogoutConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showLogoutConfirm]);

  return (
    <>
      <div className="min-h-screen pb-40 bg-black max-w-xl mx-auto text-left font-sans animate-fade-in px-10 relative overflow-hidden">
      
      {/* ATMÓSFERA LUMÍNICA - SUTILÍSIMA */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-full h-[30vh] opacity-[0.03]"
               style={{ background: 'radial-gradient(circle at 100% 0%, #D4AF37 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
      </div>

      <div className="relative z-10">
          <header className="pt-32 mb-24">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gold-400 uppercase tracking-[0.8em] opacity-30">SOCIO_GOLDEN</p>
              <h2 className="text-7xl font-extralight text-white uppercase tracking-tighter leading-[0.85]">
                {user?.full_name?.split(' ')[0] || 'ANTONIO'}
              </h2>
              <div className="flex items-center gap-3 pt-4">
                <div className="w-2 h-2 rounded-full bg-gold-400 shadow-[0_0_10px_rgba(212,175,55,0.5)]"></div>
                <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.5em]">{user?.membership_tier || 'ENTRY_LEVEL'}</p>
              </div>
            </div>
          </header>

          <div className="space-y-20">
            {/* LISTA DE ACCIONES - EDITORIAL STYLE */}
            <nav className="space-y-0">
              <button 
                onClick={() => navigate('/history')} 
                className="group w-full flex items-center justify-between py-8 border-b border-white/5 transition-all hover:px-4"
              >
                <div className="flex items-center gap-8">
                  <span className="text-[10px] font-mono text-white/20 group-hover:text-gold-400 transition-colors">01</span>
                  <span className="text-2xl font-light text-white/60 group-hover:text-white transition-all tracking-tight uppercase">HISTORIAL</span>
                </div>
                <ChevronRight size={16} className="text-white/5 group-hover:text-gold-400 transition-all" />
              </button>

              <button 
                onClick={() => navigate('/plans')} 
                className="group w-full flex items-center justify-between py-8 border-b border-white/5 transition-all hover:px-4"
              >
                <div className="flex items-center gap-8">
                  <span className="text-[10px] font-mono text-white/20 group-hover:text-gold-400 transition-colors">02</span>
                  <span className="text-2xl font-light text-white/60 group-hover:text-white transition-all tracking-tight uppercase">MEMBRESÍA</span>
                </div>
                <ChevronRight size={16} className="text-white/5 group-hover:text-gold-400 transition-all" />
              </button>

              {businessStatus === 'approved' ? (
                <button 
                  onClick={() => navigate('/business-admin')} 
                  className="group w-full flex items-center justify-between py-10 border-b border-gold-400/20 transition-all hover:px-4"
                >
                  <div className="flex items-center gap-8">
                    <span className="text-[10px] font-mono text-gold-400/40 group-hover:text-gold-400 transition-colors">03</span>
                    <div className="text-left">
                      <span className="text-3xl font-black text-gold-400 tracking-tighter uppercase leading-none">MI_NEGOCIO</span>
                      <span className="text-[8px] font-black text-gold-400/30 uppercase tracking-[0.4em] block mt-1">NODO_CENTRAL</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-gold-400/20 flex items-center justify-center group-hover:bg-gold-400 group-hover:text-black transition-all">
                    <ChevronRight size={16} strokeWidth={3} />
                  </div>
                </button>
              ) : businessStatus === 'pending' ? (
                <div className="w-full py-8 border-b border-white/5 flex items-center gap-8 opacity-40">
                  <span className="text-[10px] font-mono text-white/20">03</span>
                  <div className="flex items-center gap-4">
                    <Loader2 size={14} className="text-amber-500 animate-spin" />
                    <span className="text-xl font-light text-white uppercase tracking-tight">VALIDANDO...</span>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => navigate('/role-application')} 
                  className="group w-full flex items-center justify-between py-8 border-b border-white/5 transition-all hover:px-4"
                >
                  <div className="flex items-center gap-8">
                    <span className="text-[10px] font-mono text-white/20 group-hover:text-gold-400 transition-colors">03</span>
                    <span className="text-2xl font-light text-white/60 group-hover:text-white transition-all tracking-tight uppercase">REGISTRAR_NEGOCIO</span>
                  </div>
                  <PlusCircle size={16} className="text-white/5 group-hover:text-gold-400 transition-all" />
                </button>
              )}
            </nav>

            {/* CONFIGURACIÓN - ULTRA MINIMAL */}
            <div className="space-y-16">
                <div className="space-y-12">
                    <div className="group space-y-2">
                        <label className="text-[8px] font-black text-white/20 uppercase tracking-[0.6em] block group-focus-within:text-gold-400 transition-colors">IDENTIDAD</label>
                        <input 
                          type="text" 
                          value={editProfileData.full_name} 
                          onChange={e => setEditProfileData({...editProfileData, full_name: e.target.value})} 
                          className="w-full bg-transparent border-none p-0 text-2xl text-white/80 focus:text-white focus:outline-none transition-all uppercase font-light tracking-tight" 
                        />
                        <div className="w-full h-[1px] bg-white/5 group-focus-within:bg-gold-400 transition-all"></div>
                    </div>
                    
                    <div className="group space-y-2">
                        <label className="text-[8px] font-black text-white/20 uppercase tracking-[0.6em] block group-focus-within:text-gold-400 transition-colors">SINCRONIZACIÓN</label>
                        <input 
                          type="tel" 
                          value={editProfileData.phone} 
                          onChange={e => setEditProfileData({...editProfileData, phone: e.target.value})} 
                          className="w-full bg-transparent border-none p-0 text-2xl text-white/80 focus:text-white focus:outline-none transition-all font-mono font-light tracking-tight" 
                        />
                        <div className="w-full h-[1px] bg-white/5 group-focus-within:bg-gold-400 transition-all"></div>
                    </div>
                    
                    <button 
                      onClick={handleUpdateProfile} 
                      disabled={isUpdatingProfile} 
                      className="text-[10px] font-black text-white uppercase tracking-[0.8em] hover:text-gold-400 transition-colors flex items-center gap-4"
                    >
                      {isUpdatingProfile ? <Loader2 size={14} className="animate-spin" /> : (
                        <>
                          <span>ACTUALIZAR_SISTEMA</span>
                          <div className="w-12 h-[1px] bg-gold-400/30"></div>
                        </>
                      )}
                    </button>
                </div>

                <div className="pt-12">
                  <button 
                    onClick={() => setShowLogoutConfirm(true)} 
                    disabled={isLoggingOut} 
                    className="text-[10px] font-black text-red-500/40 hover:text-red-500 uppercase tracking-[0.8em] transition-all"
                  >
                    {isLoggingOut ? 'DESCONECTANDO...' : 'DESVINCULAR_CUENTA'}
                  </button>
                </div>
            </div>
          </div>
      </div>
    </div>
        {/* MODAL DE DESCONEXIÓN - REDISEÑO ULTRA PREMIUM */}
    {showLogoutConfirm && (
      <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl animate-fade-in">
        <div className="max-w-sm w-full animate-enter-screen text-center space-y-12">
          <div className="flex flex-col items-center gap-8">
              <div className="w-24 h-24 bg-red-500/[0.02] rounded-[2rem] flex items-center justify-center border border-red-500/10 relative group">
                  <div className="absolute inset-0 bg-red-500/5 blur-2xl group-hover:bg-red-500/10 transition-all duration-1000"></div>
                  <AlertCircle size={40} className="text-red-500 relative z-10 opacity-60" strokeWidth={1.5} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3 opacity-20">
                  <div className="w-4 h-[1px] bg-red-500"></div>
                  <span className="text-[9px] font-black uppercase tracking-[0.6em] text-red-500 ml-[0.6em]">SEGURIDAD</span>
                  <div className="w-4 h-[1px] bg-red-500"></div>
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">¿CONFIRMA LA <br/> DESCONEXIÓN?</h2>
              </div>
          </div>
          
          <div className="space-y-4">
              <button 
                onClick={handleLogout} 
                className="w-full py-6 bg-white text-black font-black uppercase text-[11px] tracking-[0.4em] rounded-2xl active:scale-95 transition-all shadow-2xl"
              >
                CONFIRMAR_SALIDA
              </button>
              <button 
                onClick={() => setShowLogoutConfirm(false)} 
                className="text-[9px] font-black text-white/20 hover:text-white uppercase tracking-[0.4em] transition-all py-2"
              >
                VOLVER_AL_SISTEMA
              </button>
          </div>
        </div>
      </div>
    )}

    {/* OVERLAYS DE ESTADO PREMIUM - REFINADOS */}
    {(successMsg || errorMsg) && (
      <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-fade-in">
        {successMsg && (
          <div className="max-w-sm w-full text-center space-y-12 animate-enter-screen">
             <div className="w-28 h-28 bg-green-500/[0.02] rounded-[2.5rem] flex items-center justify-center mx-auto border border-green-500/10 shadow-[0_0_60px_rgba(34,197,94,0.05)]">
               <ShieldCheck size={48} className="text-green-500 opacity-60" strokeWidth={1.5} />
             </div>
             <div className="space-y-4">
               <h2 className="text-3xl font-black text-green-500 uppercase tracking-tighter leading-none">{successMsg}</h2>
               <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-[1px] bg-green-500/10"></div>
                  <p className="text-[9px] text-white/10 uppercase tracking-[0.8em] font-black ml-[0.8em]">NODO_SINCRONIZADO</p>
               </div>
             </div>
          </div>
        )}

        {errorMsg && (
          <div className="max-w-sm w-full text-center space-y-12 animate-enter-screen">
             <div className="w-28 h-28 bg-red-500/[0.02] rounded-[2.5rem] flex items-center justify-center mx-auto border border-red-500/10 shadow-[0_0_60px_rgba(239,68,68,0.05)]">
               <AlertCircle size={48} className="text-red-500 opacity-60" strokeWidth={1.5} />
             </div>
             <div className="space-y-4">
               <p className="text-[10px] font-black text-red-500/40 uppercase tracking-[0.4em] mb-2">FALLO_DE_SISTEMA</p>
               <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-tight">{errorMsg}</h2>
             </div>
             <button 
              onClick={() => setErrorMsg(null)} 
              className="w-full py-6 bg-white text-black text-[11px] font-black uppercase tracking-[0.4em] rounded-2xl active:scale-[0.95] shadow-2xl transition-all"
             >
              REINTENTAR
             </button>
          </div>
        )}
      </div>
    )}
  </>
);
};