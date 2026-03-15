import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, ShieldCheck, 
  Zap, Loader2, ChevronRight,
  TrendingUp, Receipt, Wallet, Banknote, PackageCheck, RefreshCw, AlertTriangle, WifiOff
} from 'lucide-react';

interface TransactionSummary {
  monto_factura_bruto: number;
  ahorro_socio_neto: number;
  metodo_retiro: string;
  nombre_negocio: string;
  created_at: string;
}

export const BenefitsView: React.FC = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [readyProduct, setReadyProduct] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const networkErrorCount = useRef(0);
  const pollingInterval = useRef<number | null>(null);
  const isFinished = useRef(false);

  const checkVaultInventory = useCallback(async (bizOwnerEmail: string) => {
    if (!user?.email || !bizOwnerEmail) return;
    try {
      const { data: biz } = await supabase
        .from('solicitudes_registro')
        .select('id')
        .eq('email_contacto', bizOwnerEmail)
        .maybeSingle();

      if (biz?.id) {
        const { data: vaultItems } = await supabase
          .from('golden_congelados')
          .select('nombre_producto')
          .eq('socio_email', user.email.toLowerCase().trim())
          .eq('negocio_id_asignado', biz.id)
          .neq('estado', 'entregado') 
          .lte('fecha_vencimiento', new Date().toISOString()) 
          .limit(1)
          .maybeSingle();

        if (vaultItems) {
          setReadyProduct(vaultItems.nombre_producto?.trim() || "Producto listo para retiro");
        }
      }
    } catch (e) { /* Error silencioso en UI secundaria */ }
  }, [user?.email]);

  const fetchTransactionData = useCallback(async () => {
    if (!user?.email || !scanId || isFinished.current || isPaused) return;

    try {
      const userEmail = user.email.toLowerCase().trim();

      // Al primer intento, cerramos el ciclo visual y disparamos check de bóveda
      if (networkErrorCount.current === 0 && !summary) {
        await supabase.from('solicitudes_escaneo').update({ nueva_consulta: true }).eq('id', scanId);
        const { data: scanInfo } = await supabase
          .from('solicitudes_escaneo')
          .select('*')
          .eq('id', scanId)
          .maybeSingle();

        const ownerEmail = (scanInfo as any)?.dueño_email;
        if (ownerEmail) {
          checkVaultInventory(ownerEmail);
        }
      }

      const { data: auditData, error } = await supabase
        .from('golden_id')
        .select('monto_factura_bruto, ahorro_socio_neto, metodo_retiro, nombre_negocio, created_at')
        .eq('socio_email', userEmail)
        .eq('estado_transaccion', 'completado')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (auditData) {
        isFinished.current = true;
        setSummary(auditData as TransactionSummary);
        setLoading(false);
        setNetworkError(false);
        refreshProfile(); 
        if (pollingInterval.current) clearInterval(pollingInterval.current);
      } else {
        // Aún no ha escrito el operador, seguimos esperando sin error de red
        setNetworkError(false);
        networkErrorCount.current = 0; 
      }

    } catch (err: any) {
      // Solo capturamos errores de red reales (Failed to fetch)
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        networkErrorCount.current++;
        if (networkErrorCount.current >= 3) {
          setNetworkError(true);
          setIsPaused(true);
          setLoading(false);
          if (pollingInterval.current) clearInterval(pollingInterval.current);
        }
      }
    }
  }, [user?.email, scanId, isPaused, summary, checkVaultInventory, refreshProfile]);

  useEffect(() => {
    // Iniciamos el ciclo de polling humano: 3 segundos
    fetchTransactionData();
    pollingInterval.current = window.setInterval(fetchTransactionData, 3000);
    
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [fetchTransactionData]);

  const handleManualRetry = () => {
    setIsPaused(false);
    setNetworkError(false);
    setLoading(true);
    networkErrorCount.current = 0;
    fetchTransactionData();
    pollingInterval.current = window.setInterval(fetchTransactionData, 3000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white relative font-heading overflow-hidden flex flex-col">
      {/* ATMÓSFERA LUMÍNICA GLOBAL - REFINADA */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] -right-[10%] w-[80%] h-[80%] opacity-20"
               style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)', filter: 'blur(140px)' }}></div>
          <div className="absolute -bottom-[20%] -left-[10%] w-[90%] h-[90%] opacity-[0.05]"
               style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', filter: 'blur(150px)' }}></div>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col overflow-y-auto no-scrollbar pb-32">
        <header className="pt-[env(safe-area-inset-top)] px-6 md:px-12 border-b border-white/10 sticky top-0 z-40 bg-black mb-12">
          <div className="max-w-[1400px] w-full mx-auto pb-6 pt-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4 opacity-40">
                <div className="w-10 h-[1px] bg-gold-400"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.8em] text-white">CERTIFICACIÓN_DE_AHORRO</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.8] text-white">
                BENEFICIO <br/> <span className="text-gold-400">CONFIRMADO</span>
              </h1>
            </div>
            
            <button 
              onClick={() => navigate('/dashboard')} 
              className="group flex items-center gap-4 px-8 py-4 bg-white/[0.03] border border-white/10 rounded-full hover:bg-gold-400 hover:text-black transition-all active:scale-95 text-white"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">VOLVER_AL_PANEL</span>
            </button>
          </div>
        </header>

        <div className="max-w-[800px] w-full mx-auto px-6 md:px-12 space-y-8">
          
          {readyProduct && !loading && (
            <div className="px-8 py-6 bg-green-500/10 border border-green-500/20 rounded-[2rem] flex items-center gap-6 animate-pulse shadow-[0_0_50px_rgba(34,197,94,0.1)] border-l-4 border-l-green-500">
              <PackageCheck size={28} className="text-green-500 shrink-0" />
              <p className="text-[11px] font-black uppercase tracking-widest text-green-500 leading-relaxed">
                🟢 Tienes <span className="underline decoration-2 font-bold">{readyProduct}</span> listo para retiro en este local.
              </p>
            </div>
          )}

          {loading ? (
            <div className="py-40 flex flex-col items-center gap-10 bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-[3rem] backdrop-blur-xl">
              <div className="relative">
                  <div className="w-24 h-24 border-2 border-gold-400/10 rounded-full flex items-center justify-center">
                    <Loader2 size={48} className="text-gold-400 animate-spin" strokeWidth={1.5} />
                  </div>
                  <Zap size={20} className="absolute inset-0 m-auto text-gold-400 animate-pulse" />
              </div>
              <div className="text-center space-y-4">
                <p className="text-[11px] font-black uppercase tracking-[0.8em] text-gray-600 animate-pulse ml-[0.8em]">SINCRONIZANDO</p>
                <p className="text-[9px] text-black/20 dark:text-white/20 uppercase tracking-widest">Consultando Libro Mayor de Transacciones...</p>
              </div>
            </div>
          ) : networkError ? (
            <div className="py-32 text-center border border-red-500/10 bg-red-500/[0.02] p-12 rounded-[3rem] backdrop-blur-xl">
               <WifiOff size={56} className="mx-auto mb-8 text-red-500" strokeWidth={1.5} />
               <h3 className="text-xl font-black uppercase tracking-[0.4em] text-red-500 mb-6">Error de Enlace</h3>
               <p className="text-[11px] text-gray-500 uppercase tracking-widest leading-loose mb-12 max-w-sm mx-auto">El Servidor Central no responde. Verifica tu internet y reintenta la sincronización manual.</p>
               <button onClick={handleManualRetry} className="w-full py-8 bg-black dark:bg-white text-white dark:text-black font-black uppercase text-[12px] tracking-[0.6em] active:scale-95 transition-all shadow-2xl rounded-2xl">REINTENTAR_CONEXIÓN</button>
            </div>
          ) : !summary ? (
            <div className="py-40 text-center border border-dashed border-black/10 dark:border-white/10 rounded-[3rem] opacity-40">
              <Receipt size={64} className="mx-auto mb-8 text-gray-700" strokeWidth={1} />
              <p className="text-[11px] font-black uppercase tracking-[0.6em] px-10 text-gray-500 ml-[0.6em]">BUSCANDO_REGISTRO</p>
              <button onClick={() => window.location.reload()} className="mt-12 text-gold-400 text-[11px] font-black underline uppercase tracking-[0.6em] flex items-center gap-4 mx-auto hover:text-black dark:hover:text-white transition-colors">
                 <RefreshCw size={16} /> RE-INTENTAR_LECTURA
              </button>
            </div>
          ) : (
            <div className="space-y-10 animate-enter-screen">
              {/* TICKET DE AHORRO MAESTRO - REDISEÑADO PARA MÓVIL */}
              <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 p-8 md:p-16 relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] rounded-[2.5rem] md:rounded-[3rem] backdrop-blur-3xl">
                  <div className="absolute -top-20 -right-20 p-8 opacity-[0.02] pointer-events-none">
                     <TrendingUp size={400} />
                  </div>
                  
                  <div className="flex justify-between items-center mb-12 md:mb-20 border-b border-black/5 dark:border-white/5 pb-8 md:pb-12">
                     <div className="w-12 h-12 md:w-16 md:h-16 bg-gold-400/10 border border-gold-400/20 rounded-xl md:rounded-2xl flex items-center justify-center text-gold-400 shadow-[0_0_40px_rgba(212,175,55,0.1)]">
                        <Zap size={24} className="md:size-7" fill="currentColor" />
                     </div>
                     <div className="text-right">
                        <p className="text-[8px] md:text-[10px] text-gray-600 font-black uppercase tracking-[0.4em] md:tracking-[0.6em] mb-1 md:mb-2">ID_OPERACIÓN</p>
                        <p className="text-[11px] md:text-[14px] font-mono text-black/60 dark:text-white/60 font-bold tracking-[0.1em] md:tracking-[0.2em] uppercase">{new Date(summary.created_at).getTime().toString(36).toUpperCase()}</p>
                     </div>
                  </div>

                  <div className="space-y-12 md:space-y-16">
                     <div>
                        <p className="text-[10px] md:text-[11px] text-gold-400 font-black uppercase tracking-[0.8em] md:tracking-[1em] mb-4 md:mb-6 opacity-70 ml-[0.8em] md:ml-[1em]">ESTABLECIMIENTO</p>
                        <h3 className="text-4xl md:text-8xl font-black text-black dark:text-white uppercase tracking-tighter leading-[0.9] break-words">{summary.nombre_negocio}</h3>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 py-8 md:py-12 border-y border-black/5 dark:border-white/5">
                        <div className="space-y-2 md:space-y-4">
                           <p className="text-[9px] md:text-[10px] text-gray-600 font-black uppercase tracking-[0.4em] md:tracking-[0.6em]">TOTAL_FACTURADO</p>
                           <p className="text-2xl md:text-4xl font-mono font-black text-white/80 tracking-tighter">RD$ {summary.monto_factura_bruto.toLocaleString()}</p>
                        </div>
                        <div className="md:text-right space-y-2 md:space-y-4">
                           <p className="text-[9px] md:text-[10px] text-gray-600 font-black uppercase tracking-[0.4em] md:tracking-[0.6em]">PROTOCOLO_DE_RETIRO</p>
                           <div className="flex items-center md:justify-end gap-3 md:gap-4 text-black dark:text-white">
                              {summary.metodo_retiro === 'boveda' ? <Wallet size={20} className="md:size-6 text-gold-400"/> : <Banknote size={20} className="md:size-6 text-green-500"/>}
                              <p className="text-sm md:text-lg font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">{summary.metodo_retiro === 'boveda' ? 'BÓVEDA' : 'DESCUENTO'}</p>
                           </div>
                        </div>
                     </div>

                     <div className="bg-green-500/[0.03] border border-green-500/20 p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] text-center relative group overflow-hidden">
                        <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <p className="text-[10px] md:text-[12px] text-green-500 font-black uppercase tracking-[1em] md:tracking-[1.2em] mb-6 md:mb-8 relative z-10 ml-[1em] md:ml-[1.2em]">AHORRO_NETO_CONFIRMADO</p>
                        <div className="flex items-baseline justify-center gap-2 md:gap-4 relative z-10">
                          <span className="text-6xl md:text-9xl font-black text-green-400 tracking-tighter leading-none">
                            {summary.ahorro_socio_neto.toLocaleString()}
                          </span>
                          <span className="text-xl md:text-3xl font-black text-green-400/30">GP</span>
                        </div>
                     </div>
                  </div>
              </div>

              <div className="p-8 md:p-10 bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-[2rem] md:rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 backdrop-blur-xl">
                 <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-2 md:w-3 h-2 md:h-3 bg-gold-400 rounded-full animate-pulse shadow-[0_0_20px_rgba(212,175,55,0.5)]"></div>
                    <div>
                      <p className="text-[9px] md:text-[10px] text-gray-600 font-black uppercase tracking-[0.4em] md:tracking-[0.6em] mb-1 md:mb-2">NUEVO_SALDO_PATRIMONIAL</p>
                      <p className="text-2xl md:text-4xl font-mono font-black text-black dark:text-white tracking-tighter">RD$ {user?.vault_balance.toLocaleString()}</p>
                    </div>
                 </div>
                 <ShieldCheck size={40} className="text-white/5 hidden md:block" strokeWidth={1} />
              </div>

              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full py-8 md:py-10 bg-black dark:bg-white text-white dark:text-black font-black uppercase text-[12px] md:text-[14px] tracking-[0.6em] md:tracking-[0.8em] hover:bg-gold-400 transition-all active:scale-[0.98] shadow-[0_20px_80px_rgba(255,255,255,0.1)] flex items-center justify-center gap-4 md:gap-6 rounded-2xl md:rounded-3xl"
              >
                FINALIZAR_CICLO <ChevronRight size={20} className="md:size-6" />
              </button>
            </div>
          )}

          <div className="pt-24 pb-12 flex flex-col items-center gap-10 opacity-30">
             <div className="flex items-center gap-8 w-full">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-gray-800"></div>
                <span className="text-[9px] font-black uppercase tracking-[0.8em] text-gray-600 italic text-center leading-loose ml-[0.8em]">
                  PROTOCOLO_DE_AUDITORÍA_GOLDEN_ACCESO_V8.5<br/>
                  CIFRADO_POR_SERVIDOR_CENTRAL_GP
                </span>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-gray-800"></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};