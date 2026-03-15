import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { api } from '../services/api';
import { 
    LogOut, ChevronRight, Crown, Loader2, Store, Receipt, PlusCircle, AlertCircle
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, signOut, refreshProfile, businessStatus } = useAuth();
  const { getThemeLogo } = useUI();
  const navigate = useNavigate();
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

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
      alert("SISTEMA ACTUALIZADO.");
    } catch (err: any) { alert("ERROR: " + err.message); } finally { setIsUpdatingProfile(false); }
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
      <div className="min-h-screen pb-40 bg-transparent max-w-xl ml-0 text-left font-sans animate-fade-in px-6 md:px-12 relative overflow-hidden">
      
      {/* ATMÓSFERA LUMÍNICA - PROFILE (Central: Top y Bottom) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vw] h-[40vh] opacity-[0.2]"
               style={{ background: 'radial-gradient(circle at 50% 0%, white 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[100vw] h-[40vh] opacity-[0.1]"
               style={{ background: 'radial-gradient(circle at 50% 100%, #D4AF37 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
      </div>

      <div className="relative z-10">
          <header className="pt-12 mb-12 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-white/5 border border-white/10 flex items-center justify-center rounded-none shadow-inner overflow-hidden">
                {/* LOGO EN TONO ORIGINAL SIN FILTROS */}
                <img src={masterLogo} className="h-10 w-auto object-contain" alt="Golden Logo" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-tighter leading-none">{user?.full_name || 'Socio Golden'}</h2>
                {/* LETRA DEL PLAN SIN INCLINACIÓN */}
                <p className="text-[9px] text-gold-400 font-black uppercase tracking-[0.3em] mt-1">{user?.membership_tier}</p>
              </div>
            </div>
          </header>

          <div className="space-y-4">
            <button onClick={() => navigate('/history')} className="w-full flex items-center justify-between p-6 bg-white/5 border border-white/5 text-white rounded-none transition-all group">
              <div className="flex items-start gap-5">
                <Receipt size={20} className="text-gold-400 mt-0.5" />
                <div className="text-left">
                  <span className="text-sm font-bold tracking-widest uppercase block leading-none">Historial</span>
                  <span className="text-[9px] font-light tracking-[0.2em] uppercase text-gray-500 mt-2 block">mi boveda de actividades</span>
                </div>
              </div>
              <ChevronRight size={16} className="opacity-20" />
            </button>

            <button onClick={() => navigate('/plans')} className="w-full flex items-center justify-between p-6 bg-white/5 border border-white/5 text-white rounded-none transition-all group">
              <div className="flex items-center gap-5">
                <Crown size={20} className="text-gold-400" />
                <span className="text-sm font-bold tracking-widest uppercase leading-none">Gestionar Membresía</span>
              </div>
              <ChevronRight size={16} className="opacity-20" />
            </button>

            {businessStatus === 'approved' ? (
              <button onClick={() => navigate('/business-admin')} className="w-full flex items-center justify-between p-8 bg-gold-400 text-black rounded-none shadow-2xl transition-all active:scale-[0.98]">
                <div className="flex items-start gap-6 overflow-hidden">
                  <Store size={24} className="shrink-0 mt-1" />
                  <div className="text-left">
                    <span className="font-heading text-xl font-black tracking-tighter uppercase block leading-none whitespace-nowrap">MI NEGOCIO</span>
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60 whitespace-nowrap mt-2 block">CONTROL DE OPERACIONES</span>
                  </div>
                </div>
                <ChevronRight size={20} className="opacity-40 shrink-0" />
              </button>
            ) : businessStatus === 'pending' ? (
              <button onClick={() => navigate('/espera')} className="w-full p-6 bg-white/5 border border-white/10 rounded-none flex items-start gap-5">
                <Loader2 size={20} className="text-amber-500 animate-spin mt-1" />
                <div className="text-left">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">Validación en curso</p>
                  <p className="text-[9px] text-gray-500 font-medium italic mt-2">Click para ver estatus</p>
                </div>
              </button>
            ) : (
              <button onClick={() => navigate('/role-application')} className="w-full flex items-center justify-between p-6 bg-white/5 border border-white/5 text-white rounded-none transition-all group">
                <div className="flex items-center gap-5">
                  <PlusCircle size={20} className="text-gray-500" />
                  <span className="text-sm font-bold tracking-widest uppercase leading-none">Registrar Negocio</span>
                </div>
                <ChevronRight size={16} className="opacity-20" />
              </button>
            )}

            <div className="pt-12 space-y-6">
                <h3 className="text-[9px] font-black text-gray-700 uppercase tracking-[0.5em] px-1">Configuración del Nodo</h3>
                <div className="space-y-6 bg-white/[0.02] p-8 border border-white/5 rounded-none">
                    <div className="space-y-2">
                        <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Socio Propietario</label>
                        <input type="text" value={editProfileData.full_name} onChange={e => setEditProfileData({...editProfileData, full_name: e.target.value})} className="w-full bg-transparent border-b border-white/5 py-2 text-sm text-white focus:outline-none focus:border-gold-400 transition-all uppercase" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Línea de Contacto</label>
                        <input type="tel" value={editProfileData.phone} onChange={e => setEditProfileData({...editProfileData, phone: e.target.value})} className="w-full bg-transparent border-b border-white/5 py-2 text-sm text-white focus:outline-none focus:border-gold-400 transition-all" />
                    </div>
                    <button onClick={handleUpdateProfile} disabled={isUpdatingProfile} className="w-full py-4 bg-white text-black text-[9px] font-black uppercase tracking-widest transition-all rounded-none hover:bg-gold-400">
                      {isUpdatingProfile ? <Loader2 size={12} className="animate-spin" /> : 'Sincronizar Nodo'}
                    </button>
                </div>
            </div>

            <div className="pt-12 px-1">
              <button onClick={() => setShowLogoutConfirm(true)} disabled={isLoggingOut} className="text-[9px] font-black uppercase tracking-[0.5em] text-red-500/40 hover:text-red-500 transition-all flex items-center gap-3">
                <LogOut size={14} /> {isLoggingOut ? 'SALIENDO...' : 'DESCONECTAR SESIÓN'}
              </button>
            </div>
          </div>
      </div>
    </div>

    {/* MODAL ELEGANTE DE CONFIRMACIÓN DE CIERRE DE SESIÓN - FUERA DEL CONTENEDOR ANIMADO PARA CENTRADO ABSOLUTO */}
    {showLogoutConfirm && (
      <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-fade-in">
        <div className="max-w-xs w-full bg-[#0d0d0d] border border-white/10 p-10 text-center shadow-2xl space-y-10 rounded-[2rem]">
          <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                  <AlertCircle size={32} className="text-red-500" />
              </div>
              <h3 className="text-lg font-heading font-black text-white uppercase tracking-tighter">¿Cerrar Sesión?</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-loose">Tu conexión con el Nodo Maestro será interrumpida.</p>
          </div>
          <div className="flex flex-col gap-3">
              <button 
                onClick={handleLogout} 
                className="w-full py-5 bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] active:scale-95 transition-all shadow-xl"
              >
                CONFIRMAR SALIDA
              </button>
              <button 
                onClick={() => setShowLogoutConfirm(false)} 
                className="w-full py-3 text-gray-500 hover:text-white font-black uppercase text-[8px] tracking-widest transition-all"
              >
                VOLVER ATRÁS
              </button>
          </div>
        </div>
      </div>
    )}
  </>
);
};