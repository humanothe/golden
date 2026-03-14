import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Clock, LogOut, RefreshCcw, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export const WaitingScreen: React.FC = () => {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState(false);
    const [bizEmail, setBizEmail] = useState<string | null>(null);

    const syncData = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('solicitudes_registro')
                .select('estado, email_contacto')
                .eq('dueño_id', user.id)
                .maybeSingle();
            
            if (data && !error) {
                setBizEmail(data.email_contacto);
                const estado = data.estado?.toLowerCase();
                if (estado === 'aprobado' || estado === 'approved') {
                    await refreshProfile();
                    navigate('/dashboard', { replace: true });
                }
            } else if (error) {
                console.error("SYNC_ERROR:", error);
            }
        } catch (e) {
            console.error("CRITICAL_SYNC_FAIL:", e);
        }
    }, [user, navigate, refreshProfile]);

    useEffect(() => {
        syncData();

        if (user) {
            const channel = supabase
                .channel(`business-approval-${user.id}`)
                .on('postgres_changes', { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'solicitudes_registro',
                    filter: `dueño_id=eq.${user.id}`
                }, async (payload) => {
                    const nextStatus = payload.new?.estado?.toLowerCase();
                    if (nextStatus === 'aprobado' || nextStatus === 'approved') {
                        await refreshProfile();
                        navigate('/dashboard', { replace: true });
                    }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user, navigate, refreshProfile, syncData]);

    const handleManualCheck = async () => {
        setIsChecking(true);
        await syncData();
        await refreshProfile();
        setIsChecking(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/', { replace: true });
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center font-sans animate-fade-in relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
            
            <div className="glass-panel p-10 rounded-[3rem] bg-white/5 border border-gold-400/20 max-w-md shadow-2xl relative overflow-hidden z-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/10 blur-[50px] rounded-full"></div>
                
                <div className="w-20 h-20 bg-gold-400/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-gold-400/20 relative">
                    <div className="absolute inset-0 rounded-full border-2 border-gold-400/20 border-t-gold-400 animate-spin"></div>
                    <Clock size={36} className="text-gold-400" />
                </div>

                <h1 className="text-2xl font-heading font-bold uppercase mb-4 tracking-tighter leading-tight">
                    Auditoría <br/><span className="text-gold-400 text-lg tracking-[0.2em]">En Proceso</span>
                </h1>
                
                <div className="space-y-6 mb-10 text-left border-y border-white/5 py-8">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest leading-loose">
                        Solicitud para: <span className="text-gold-400">{bizEmail || user?.email || 'NODO_IDENTIFICADO'}</span>
                    </p>
                    <p className="text-gray-400 text-[9px] uppercase tracking-widest leading-relaxed italic opacity-60">
                        El Panel de Control Golden está validando la estructura comercial de tu registro.
                    </p>
                    
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center gap-3">
                        <Loader2 size={14} className="animate-spin text-gold-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gold-400 animate-pulse">Sincronizando Nodo...</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <button 
                        onClick={handleManualCheck}
                        disabled={isChecking}
                        className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95"
                    >
                        {isChecking ? <Loader2 className="animate-spin" size={16} /> : <><RefreshCcw size={16} /> Verificar Estatus</>}
                    </button>
                    
                    <button 
                        onClick={handleLogout}
                        className="w-full py-4 text-red-500/50 hover:text-red-500 text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
            
            <p className="mt-12 text-[8px] text-gray-700 uppercase tracking-[0.5em] font-black max-w-xs leading-loose">
                Una vez aprobada, el acceso al panel se habilitará automáticamente mediante este nodo seguro.
            </p>
        </div>
    );
};