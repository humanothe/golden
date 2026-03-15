import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { 
  Loader2, X, 
  ShieldCheck, 
  Store, RefreshCcw, Trash2, PackageCheck
} from 'lucide-react';

export const WaitingApprovalScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, activeScan, setActiveScan, refreshProfile } = useAuth();
  
  const [status, setStatus] = useState<'waiting_operator' | 'rejected'>('waiting_operator');
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Estado para productos listos para retirar (Nota Verde)
  const [readyProduct, setReadyProduct] = useState<string | null>(null);
  
  const isFinished = useRef(false);
  const scanId = activeScan?.id;
  const businessName = activeScan?.negocio_nombre || "ESTABLECIMIENTO GOLDEN";
  const dueñoEmail = activeScan?.dueño_email;

  useEffect(() => {
    if (!scanId || isFinished.current) return;

    // LÓGICA DE NOTA VERDE: El calendario es el único juez
    const checkReadyProducts = async () => {
      if (!user?.email || !dueñoEmail) return;
      
      try {
        // 1. Identificar el negocio_id_asignado mediante el email del dueño actual
        const { data: biz } = await supabase
          .from('solicitudes_registro')
          .select('id')
          .eq('email_contacto', dueñoEmail)
          .maybeSingle();

        if (biz?.id) {
          // 2. Filtro flexible: Vencido + No Entregado (Ignora otros estados)
          const { data: products } = await supabase
            .from('golden_congelados')
            .select('nombre_producto')
            .eq('socio_email', user.email.toLowerCase().trim())
            .eq('negocio_id_asignado', biz.id)
            .neq('estado', 'entregado') 
            .lte('fecha_vencimiento', new Date().toISOString()) 
            .limit(1)
            .maybeSingle();

          if (products) {
            // Fallback si el nombre_producto está vacío
            setReadyProduct(products.nombre_producto?.trim() || "Producto listo para retiro");
          }
        }
      } catch (e) {
        console.warn("VAULT_FAST_CHECK_ERROR", e);
      }
    };

    checkReadyProducts();

    // MONITOR DE ESTADO REAL-TIME
    const channel = supabase
      .channel(`scan-gate-${scanId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'solicitudes_escaneo',
        filter: `id=eq.${scanId}`
      }, (payload) => {
        const nextState = payload.new.estado?.toLowerCase();
        
        if (nextState === 'aprobado' || nextState === 'approved') {
          isFinished.current = true;
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          navigate(`/benefits/${scanId}`, { replace: true });
        } 
        else if (nextState === 'rechazado' || nextState === 'rejected') {
          setRejectionMessage(payload.new.mensaje_sistema || "SOLICITUD DENEGADA POR EL ESTABLECIMIENTO.");
          setStatus('rejected');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [scanId, navigate, user?.email, dueñoEmail]);

  const handleReturn = async () => {
    await refreshProfile();
    setActiveScan(null);
    navigate('/dashboard', { replace: true });
  };

  const handleCancelRequest = async () => {
    if (!scanId || isCancelling) return;
    setIsCancelling(true);

    try {
      await supabase.from('solicitudes_escaneo').delete().eq('id', scanId);
      isFinished.current = true;
      setActiveScan(null);
      await refreshProfile();
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black text-white flex flex-col items-center justify-center p-6 text-center font-sans animate-fade-in overflow-hidden text-left">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
      
      {status === 'waiting_operator' ? (
        <div className="max-w-md w-full animate-fade-in flex flex-col items-center">
            <div className="w-24 h-24 border border-gold-400/20 flex items-center justify-center relative bg-black mb-12 shadow-[0_0_80px_rgba(212,175,55,0.15)] rounded-[2.5rem]">
                 <div className="absolute inset-0 border-t-2 border-gold-400 animate-spin rounded-[2.5rem]"></div>
                 <Store size={40} className="text-gold-400/40" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-gold-400 mb-3">CONEXIÓN ACTIVA</p>
            <h2 className="text-3xl font-heading font-black uppercase tracking-tighter mb-4 leading-none text-white">Esperando <br/>Confirmación</h2>
            <p className="text-[12px] text-gray-500 uppercase tracking-widest font-bold mb-8">{businessName}</p>
            
            {/* NOTA VERDE: ALERTA DE PRODUCTO LISTO */}
            {readyProduct && (
              <div className="mb-10 px-6 py-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-4 animate-pulse shadow-[0_0_30px_rgba(34,197,94,0.1)] border-l-4 border-l-green-500">
                <PackageCheck size={20} className="text-green-500 shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-widest text-green-500 text-left leading-relaxed">
                  🟢 Tienes <span className="underline">{readyProduct}</span> listo para retiro en este local.
                </p>
              </div>
            )}

            <div className="w-full space-y-10">
                <div className="flex flex-col items-center gap-6 p-8 bg-white/[0.02] border border-white/5 rounded-3xl w-full">
                    <Loader2 size={24} className="animate-spin text-gray-700" />
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-600">Sincronizando con el Operador...</p>
                </div>

                <button 
                  onClick={handleCancelRequest}
                  disabled={isCancelling}
                  className="flex items-center justify-center gap-3 w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-700 hover:text-red-500 transition-all active:scale-95"
                >
                  CANCELAR SOLICITUD
                </button>
            </div>
        </div>
      ) : (
        <div className="max-w-md w-full animate-fade-in flex flex-col items-center">
          <div className="w-20 h-20 rounded-full border border-red-500/20 flex items-center justify-center bg-red-500/5 mb-10">
             <X size={40} className="text-red-500" strokeWidth={3} />
          </div>
          <h2 className="text-3xl font-heading font-black uppercase text-white tracking-tighter leading-none mb-10">Acceso <br/><span className="text-red-500">Denegado</span></h2>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold mb-16 italic text-center max-w-[280px]">"{rejectionMessage}"</p>
          <button onClick={handleReturn} className="w-full py-6 bg-white text-black font-black uppercase text-[10px] tracking-[0.4em] active:scale-95 transition-all">REGRESAR AL INICIO</button>
        </div>
      )}

      <div className="fixed bottom-12 flex items-center gap-4 opacity-20">
        <ShieldCheck size={16} className="text-gray-500" />
        <span className="text-[8px] font-black uppercase tracking-[0.8em] text-gray-500 italic">Auditado por Golden Ledger v6.0</span>
      </div>
    </div>
  );
};