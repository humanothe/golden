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
  gross_amount: number;
  net_savings: number;
  withdrawal_method: string;
  business_name: string;
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
        .from('transactions')
        .select('gross_amount, net_savings, withdrawal_method, business_name, created_at')
        .eq('user_email', userEmail)
        .eq('status', 'completado')
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
    <div className="min-h-screen bg-black text-white p-6 md:p-12 pb-32 font-sans text-left animate-fade-in relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
      
      <header className="max-w-xl mx-auto flex items-center gap-6 mb-8 relative z-10">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="p-4 bg-white/5 border border-white/10 rounded-none text-gold-400 hover:bg-gold-400 hover:text-black transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <p className="text-[10px] text-gold-400 font-black uppercase tracking-[0.5em] mb-1">Certificación de Ahorro</p>
          <h1 className="text-3xl font-heading font-bold uppercase tracking-tighter">
            BENEFICIO <span className="text-gold-metallic">CONFIRMADO</span>
          </h1>
        </div>
      </header>

      <div className="max-w-xl mx-auto relative z-10 space-y-6">
        
        {readyProduct && !loading && (
          <div className="px-6 py-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-4 animate-pulse shadow-[0_0_40px_rgba(34,197,94,0.15)] border-l-4 border-l-green-500">
            <PackageCheck size={24} className="text-green-500 shrink-0" />
            <p className="text-[10px] font-black uppercase tracking-widest text-green-500 leading-relaxed">
              🟢 Tienes <span className="underline decoration-2 font-bold">{readyProduct}</span> listo para retiro en este local.
            </p>
          </div>
        )}

        {loading ? (
          <div className="py-24 flex flex-col items-center gap-6 bg-white/[0.02] border border-white/5 rounded-3xl">
            <div className="relative">
                <Loader2 size={40} className="text-gold-400 animate-spin" />
                <Zap size={16} className="absolute inset-0 m-auto text-gold-400 animate-pulse" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-500 animate-pulse">Esperando que el local confirme tu beneficio...</p>
          </div>
        ) : networkError ? (
          <div className="py-24 text-center border border-red-500/10 bg-red-500/[0.02] p-10 rounded-3xl">
             <WifiOff size={48} className="mx-auto mb-6 text-red-500" />
             <h3 className="text-sm font-black uppercase tracking-widest text-red-500 mb-4">Problema de conexión</h3>
             <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-loose mb-10">El Nodo Maestro no responde. Verifica tu internet y reintenta la sincronización manual.</p>
             <button onClick={handleManualRetry} className="w-full py-5 bg-white text-black font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-2xl">REINTENTAR SINCRONIZACIÓN</button>
          </div>
        ) : !summary ? (
          <div className="py-24 text-center border border-dashed border-white/10 opacity-30">
            <Receipt size={48} className="mx-auto mb-6 text-gray-600" />
            <p className="text-[10px] font-black uppercase tracking-widest px-10">Buscando ticket en Libro Mayor...</p>
            <button onClick={() => window.location.reload()} className="mt-8 text-gold-400 text-[9px] font-black underline uppercase tracking-widest flex items-center gap-2 mx-auto">
               <RefreshCw size={12} /> RE-INTENTAR LECTURA
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-enter-screen">
            {/* TICKET DE AHORRO MAESTRO */}
            <div className="bg-[#080808] border border-white/10 p-10 relative overflow-hidden shadow-2xl rounded-none">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                   <TrendingUp size={120} />
                </div>
                
                <div className="flex justify-between items-start mb-12 border-b border-white/5 pb-8">
                   <div className="p-4 bg-gold-400/10 border border-gold-400/20 rounded-none text-gold-400">
                      <Zap size={24} fill="currentColor" />
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest">ID_OPERACIÓN</p>
                      <p className="text-[11px] font-mono text-white/40 uppercase">{new Date(summary.created_at).getTime().toString(36).toUpperCase()}</p>
                   </div>
                </div>

                <div className="space-y-10">
                    <div>
                      <p className="text-[9px] text-gold-400 font-black uppercase tracking-[0.6em] mb-3">ESTABLECIMIENTO</p>
                      <h3 className="text-4xl font-heading font-black text-white uppercase tracking-tighter leading-none">{summary.business_name}</h3>
                   </div>

                   <div className="grid grid-cols-2 gap-8 py-8 border-y border-white/5">
                      <div>
                         <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest mb-2">Total Facturado</p>
                         <p className="text-xl font-mono font-bold text-white/50">RD$ {summary.gross_amount.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest mb-2">Protocolo</p>
                         <div className="flex items-center justify-end gap-2 text-white">
                            {summary.withdrawal_method === 'boveda' ? <Wallet size={14} className="text-gold-400"/> : <Banknote size={14} className="text-green-500"/>}
                            <p className="text-sm font-bold uppercase tracking-widest">{summary.withdrawal_method}</p>
                         </div>
                      </div>
                   </div>

                   <div className="bg-green-500/[0.03] border border-green-500/20 p-8 text-center relative">
                      <p className="text-[10px] text-green-500 font-black uppercase tracking-[0.8em] mb-4 relative z-10">AHORRO TOTAL</p>
                      <div className="flex items-baseline justify-center gap-2 relative z-10">
                        <span className="text-7xl font-heading font-black text-green-400 tracking-tighter">
                          {summary.net_savings.toLocaleString()}
                        </span>
                        <span className="text-2xl font-heading font-black text-green-400/40">GP</span>
                      </div>
                   </div>
                </div>
            </div>

            <div className="p-8 bg-white/[0.02] border border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-gold-400 animate-pulse"></div>
                  <div>
                    <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest mb-1">NUEVO_SALDO_DISPONIBLE</p>
                    <p className="text-2xl font-mono font-black text-white">RD$ {user?.vault_balance.toLocaleString()}</p>
                  </div>
               </div>
               <ShieldCheck size={32} className="text-white/5" />
            </div>

            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full py-7 bg-white text-black font-black uppercase text-[11px] tracking-[0.5em] hover:bg-gold-400 transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-4"
            >
              FINALIZAR CICLO <ChevronRight size={18} />
            </button>
          </div>
        )}

        <div className="pt-12 flex flex-col items-center gap-6 opacity-20">
           <div className="flex items-center gap-4">
              <div className="h-[1px] w-12 bg-gray-600"></div>
              <span className="text-[7px] font-black uppercase tracking-[0.8em] text-gray-500 italic text-center">Protocolo de Auditoría Golden Acceso v8.5<br/>Cifrado por Nodo Maestro</span>
              <div className="h-[1px] w-12 bg-gray-600"></div>
           </div>
        </div>
      </div>
    </div>
  );
};