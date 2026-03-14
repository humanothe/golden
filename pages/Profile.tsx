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
    sector: user?.sector || '',
    address_street: user?.address_street || ''
  });

  useEffect(() => { 
    if (user) {
      setEditProfileData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        sector: user.sector || '',
        address_street: user.address_street || ''
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
        provincia: editProfileData.sector,
        direccion: editProfileData.address_street
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
      <div className="min-h-screen pb-40 bg-[#050505] max-w-xl mx-auto text-left font-sans animate-fade-in px-8 relative overflow-hidden">
      
      {/* ATMÓSFERA LUMÍNICA - HOME (Standard) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[80vw] h-[50vh] opacity-40"
             style={{ background: 'radial-gradient(circle at 0% 0%, white 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
        <div className="absolute bottom-0 right-0 w-[70vw] h-[60vh] opacity-[0.15]"
             style={{ background: 'radial-gradient(circle at 100% 100%, #D4AF37 0%, transparent 60%)', filter: 'blur(100px)' }}></div>
      </div>

      <div className="relative z-10">
          {/* HEADER - ESTILO EDITORIAL */}
          <header className="pt-24 mb-20 flex flex-col items-start gap-10">
            <div className="relative group">
              {/* Aura de la Foto de Perfil */}
              <div className="absolute inset-0 bg-gold-400/20 rounded-full blur-3xl opacity-40 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <div className="w-32 h-32 bg-white/[0.02] border border-white/10 flex items-center justify-center rounded-full shadow-2xl relative overflow-hidden backdrop-blur-md">
                <img src={masterLogo} className="h-16 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-500" alt="Golden Logo" />
                {/* Brillo de Barrido */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 opacity-40">
                <div className="w-6 h-[1px] bg-gold-400"></div>
                <span className="text-[9px] font-black uppercase tracking-[0.6em] text-white">SOCIO_IDENTIFICADO</span>
              </div>
              <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-[0.85]">{user?.full_name || 'Socio Golden'}</h2>
              <div className="inline-flex items-center px-4 py-1.5 bg-gold-400/10 border border-gold-400/20 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-gold-400 mr-3 animate-pulse"></div>
                <p className="text-[10px] text-gold-400 font-black uppercase tracking-[0.3em]">{user?.membership_tier}</p>
              </div>
            </div>
          </header>

          {/* MENÚ DE ACCIONES - BENTO GRID MINIMALISTA */}
          <div className="grid grid-cols-2 gap-4 mb-20">
              <button 
                onClick={() => navigate('/history')} 
                className="group relative col-span-2 flex flex-col items-start justify-between p-10 bg-white/[0.01] border border-white/5 hover:border-white/10 text-white transition-all duration-500 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                  <Receipt size={120} strokeWidth={0.5} />
                </div>
                <div className="w-12 h-12 bg-white/5 flex items-center justify-center rounded-none mb-10 group-hover:bg-gold-400 group-hover:text-black transition-all duration-500">
                  <Receipt size={20} />
                </div>
                <div className="text-left space-y-2">
                  <span className="text-[13px] font-black tracking-[0.2em] uppercase block">HISTORIAL_DE_ACTIVOS</span>
                  <p className="text-[8px] font-bold tracking-[0.1em] uppercase text-white/20">REGISTRO COMPLETO DE OPERACIONES</p>
                </div>
              </button>

              <button 
                onClick={() => navigate('/plans')} 
                className="group relative flex flex-col items-start justify-between p-8 bg-white/[0.01] border border-white/5 hover:border-white/10 text-white transition-all duration-500 overflow-hidden"
              >
                <div className="w-10 h-10 bg-white/5 flex items-center justify-center rounded-none mb-8 group-hover:bg-gold-400 group-hover:text-black transition-all duration-500">
                  <Crown size={18} />
                </div>
                <div className="text-left space-y-1">
                  <span className="text-[11px] font-black tracking-[0.15em] uppercase block">MEMBRESÍA</span>
                  <p className="text-[7px] font-bold uppercase text-white/20">GESTIONAR NIVEL</p>
                </div>
              </button>

              {businessStatus === 'approved' ? (
                <button 
                  onClick={() => navigate('/business-admin')} 
                  className="group relative flex flex-col items-start justify-between p-8 bg-gold-400 hover:bg-white text-black transition-all duration-500 overflow-hidden"
                >
                  <div className="w-10 h-10 bg-black/5 flex items-center justify-center rounded-none mb-8">
                    <Store size={18} />
                  </div>
                  <div className="text-left space-y-1">
                    <span className="text-[11px] font-black tracking-[0.15em] uppercase block">NEGOCIO</span>
                    <p className="text-[7px] font-black uppercase opacity-40">CENTRAL COMERCIAL</p>
                  </div>
                </button>
              ) : businessStatus === 'pending' ? (
                <button 
                  onClick={() => navigate('/espera')} 
                  className="group relative flex flex-col items-start justify-between p-8 bg-white/[0.01] border border-amber-500/20 text-amber-500 transition-all duration-500 overflow-hidden animate-pulse"
                >
                  <div className="w-10 h-10 bg-amber-500/10 flex items-center justify-center rounded-none mb-8">
                    <Loader2 size={18} className="animate-spin" />
                  </div>
                  <div className="text-left space-y-1">
                    <span className="text-[11px] font-black tracking-[0.15em] uppercase block">PENDIENTE</span>
                    <p className="text-[7px] font-bold uppercase opacity-40">EN VALIDACIÓN</p>
                  </div>
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/role-application')} 
                  className="group relative flex flex-col items-start justify-between p-8 bg-white/[0.01] border border-white/5 hover:border-white/10 text-white transition-all duration-500 overflow-hidden"
                >
                  <div className="w-10 h-10 bg-white/5 flex items-center justify-center rounded-none mb-8 group-hover:bg-white group-hover:text-black transition-all duration-500">
                    <PlusCircle size={18} />
                  </div>
                  <div className="text-left space-y-1">
                    <span className="text-[11px] font-black tracking-[0.15em] uppercase block">REGISTRAR</span>
                    <p className="text-[7px] font-bold uppercase text-white/20">EXPANDIR RED</p>
                  </div>
                </button>
              )}
          </div>

          {/* CONFIGURACIÓN DE IDENTIDAD - ESTILO HARDWARE TOOL */}
          <div className="space-y-16">
              <div className="flex items-center gap-4">
                <div className="w-8 h-[1px] bg-gold-400 opacity-40"></div>
                <h3 className="text-[10px] font-black text-gold-400 uppercase tracking-[0.6em]">DATOS PERSONALES</h3>
              </div>

              <div className="space-y-12 bg-white/[0.01] p-12 border border-white/5 relative overflow-hidden backdrop-blur-sm">
                  {/* Patrón de Rejilla de Fondo */}
                  <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
                       style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                  
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                    <ShieldCheck size={140} strokeWidth={1} />
                  </div>
                  
                  <div className="space-y-8 relative z-10">
                      <div className="space-y-4">
                          <label className="text-[8px] font-black text-white/20 uppercase tracking-[0.6em] block">NOMBRE COMPLETO</label>
                          <input 
                            type="text" 
                            value={editProfileData.full_name} 
                            onChange={e => setEditProfileData({...editProfileData, full_name: e.target.value})} 
                            className="w-full bg-transparent border-b border-white/10 py-4 text-xl text-white focus:outline-none focus:border-gold-400 transition-all uppercase font-black tracking-tight" 
                          />
                      </div>
                      
                      <div className="space-y-4">
                          <label className="text-[8px] font-black text-white/20 uppercase tracking-[0.6em] block">TELÉFONO</label>
                          <input 
                            type="tel" 
                            value={editProfileData.phone} 
                            onChange={e => setEditProfileData({...editProfileData, phone: e.target.value})} 
                            className="w-full bg-transparent border-b border-white/10 py-4 text-xl text-white focus:outline-none focus:border-gold-400 transition-all font-mono font-black" 
                          />
                      </div>

                      <div className="space-y-4">
                          <label className="text-[8px] font-black text-white/20 uppercase tracking-[0.6em] block">SECTOR / PROVINCIA</label>
                          <input 
                            type="text" 
                            value={editProfileData.sector} 
                            onChange={e => setEditProfileData({...editProfileData, sector: e.target.value})} 
                            className="w-full bg-transparent border-b border-white/10 py-4 text-xl text-white focus:outline-none focus:border-gold-400 transition-all uppercase font-black tracking-tight" 
                          />
                      </div>

                      <div className="space-y-4">
                          <label className="text-[8px] font-black text-white/20 uppercase tracking-[0.6em] block">DIRECCIÓN PRINCIPAL</label>
                          <input 
                            type="text" 
                            value={editProfileData.address_street} 
                            onChange={e => setEditProfileData({...editProfileData, address_street: e.target.value})} 
                            className="w-full bg-transparent border-b border-white/10 py-4 text-xl text-white focus:outline-none focus:border-gold-400 transition-all uppercase font-black tracking-tight" 
                          />
                      </div>
                      
                      <button 
                        onClick={handleUpdateProfile} 
                        disabled={isUpdatingProfile} 
                        className="w-full py-8 bg-white text-black text-[12px] font-black uppercase tracking-[0.6em] transition-all hover:bg-gold-400 active:scale-[0.98] shadow-2xl relative z-10"
                      >
                        {isUpdatingProfile ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'ACTUALIZAR'}
                      </button>
                  </div>
              </div>
          </div>

          {/* BOTÓN DE DESCONEXIÓN - MINIMALISTA */}
          <div className="pt-24 flex flex-col items-center gap-8">
            <div className="w-12 h-[1px] bg-white/5"></div>
            <button 
              onClick={() => setShowLogoutConfirm(true)} 
              disabled={isLoggingOut} 
              className="group flex flex-col items-center gap-4 py-6 transition-all duration-500"
            >
              <div className="w-14 h-14 rounded-full border border-red-500/20 flex items-center justify-center group-hover:bg-red-500 transition-all duration-500">
                <LogOut size={18} className="text-red-500 group-hover:text-black transition-colors" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.8em] text-red-500/40 group-hover:text-red-500 transition-colors ml-[0.8em]">
                {isLoggingOut ? 'DESCONECTANDO...' : 'CERRAR_SESIÓN_MAESTRA'}
              </span>
            </button>
          </div>
      </div>
    </div>

    {/* MODAL DE DESCONEXIÓN - REDISEÑO PREMIUM */}
    {showLogoutConfirm && (
      <div className="fixed inset-0 z-[5000] flex items-center justify-center p-8 bg-black/95 backdrop-blur-3xl animate-fade-in">
        <div className="max-w-md w-full animate-enter-screen text-center space-y-16">
          <div className="flex flex-col items-center gap-10">
              <div className="w-28 h-28 bg-red-500/5 rounded-full flex items-center justify-center border border-red-500/20 relative">
                  <div className="absolute inset-0 bg-red-500/10 blur-2xl animate-pulse"></div>
                  <AlertCircle size={56} className="text-red-500 relative z-10" strokeWidth={1.5} />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 opacity-40">
                  <div className="w-6 h-[1px] bg-red-500"></div>
                  <span className="text-[11px] font-black uppercase tracking-[0.8em] text-red-500 ml-[0.8em]">DESCONEXIÓN</span>
                </div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight">¿CONFIRMA LA INTERRUPCIÓN <br/> DE LA SESIÓN?</h2>
              </div>
          </div>
          
          <div className="space-y-6">
              <button 
                onClick={handleLogout} 
                className="w-full py-8 bg-white text-black font-black uppercase text-[13px] tracking-[0.6em] active:scale-95 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
              >
                CONFIRMAR_SALIDA
              </button>
              <button 
                onClick={() => setShowLogoutConfirm(false)} 
                className="text-[11px] font-black text-white/20 hover:text-white uppercase tracking-[0.5em] transition-all"
              >
                VOLVER_AL_SISTEMA
              </button>
          </div>
        </div>
      </div>
    )}
    {/* OVERLAYS DE ESTADO PREMIUM */}
    {(successMsg || errorMsg) && (
      <div className="fixed inset-0 z-[6000] flex items-center justify-center p-8 bg-black/95 backdrop-blur-3xl animate-fade-in">
        {successMsg && (
          <div className="max-w-md w-full text-center space-y-16 animate-enter-screen">
             <div className="w-32 h-32 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-16 border border-green-500/30 shadow-[0_0_60px_rgba(34,197,94,0.15)]">
               <ShieldCheck size={64} className="text-green-500" strokeWidth={1.5} />
             </div>
             <div className="space-y-6">
               <h2 className="text-4xl font-black text-green-500 uppercase tracking-tighter leading-none">{successMsg}</h2>
               <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-[1px] bg-green-500/20"></div>
                  <p className="text-[10px] text-white/20 uppercase tracking-[1em] font-black ml-[1em]">NODO_SINCRONIZADO</p>
               </div>
             </div>
          </div>
        )}

        {errorMsg && (
          <div className="max-w-md w-full text-center space-y-16 animate-enter-screen">
             <div className="w-32 h-32 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-16 border border-red-500/30 shadow-[0_0_60px_rgba(239,68,68,0.15)]">
               <AlertCircle size={64} className="text-red-500" strokeWidth={1.5} />
             </div>
             <div className="space-y-6">
               <p className="text-[12px] font-black text-red-500 uppercase tracking-[0.6em] mb-4">FALLO_DE_SINCRONIZACIÓN</p>
               <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">{errorMsg}</h2>
             </div>
             <button 
              onClick={() => setErrorMsg(null)} 
              className="w-full py-8 bg-white text-black text-[12px] font-black uppercase tracking-[0.6em] active:scale-[0.95] shadow-2xl transition-all"
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