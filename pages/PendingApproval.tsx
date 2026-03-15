
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Clock, LogOut, CheckCircle, RefreshCcw } from 'lucide-react';

export const PendingApproval: React.FC = () => {
    const { user, signOut, refreshProfile } = useAuth();
    const navigate = useNavigate();

    // Polling inteligente: Revisa el estatus cada 10 segundos
    useEffect(() => {
        const interval = setInterval(async () => {
            if (user) {
                await refreshProfile();
                if (user.status === 'active' && user.role === 'business') {
                    navigate('/panel-negocio');
                }
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [user, navigate, refreshProfile]);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center font-sans">
            <div className="glass-panel p-12 rounded-[3.5rem] bg-white/5 border border-gold-400/20 max-w-md shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/10 blur-[50px] rounded-full"></div>
                
                <div className="w-20 h-20 bg-gold-400/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse border border-gold-400/20">
                    <Clock size={40} className="text-gold-400" />
                </div>

                <h1 className="text-3xl font-heading font-bold uppercase mb-4 tracking-tighter">Solicitud en <br/><span className="text-gold-400">Revisión</span></h1>
                <p className="text-gray-500 text-xs uppercase tracking-[0.2em] leading-loose mb-10">
                    Tu solicitud ha sido enviada al Panel de Control. Un administrador verificará tu local en breve. 
                    <br/><br/>
                    Recibirás una notificación cuando tu acceso esté habilitado.
                </p>

                <div className="space-y-4">
                    <button onClick={() => refreshProfile()} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
                        <RefreshCcw size={14} /> Verificar ahora
                    </button>
                    <button onClick={() => { signOut(); navigate('/'); }} className="w-full py-4 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3">
                        <LogOut size={14} /> Salir del sistema
                    </button>
                </div>
            </div>
        </div>
    );
};
