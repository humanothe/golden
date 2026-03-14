import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useNavigate } from 'react-router-dom';
import { 
  X, Loader2, Camera,
  Store, History, ArrowUpRight, Plus, 
  Lock, Zap, CreditCard, User
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

declare const Html5Qrcode: any;

export const Dashboard: React.FC = () => {
  const { user, setActiveScan, refreshProfile } = useAuth();
  const { branding, getSafeAsset, getThemeLogo } = useUI();
  const navigate = useNavigate();
  
  const [showScanner, setShowScanner] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  const scannerInstance = useRef<any>(null);

  const fetchTotalActivity = async () => {
    if (!user?.email) return;
    setLoadingHistory(true);
    try {
      const userEmail = user.email.toLowerCase().trim();
      const [resLedger, resRed, resMarket] = await Promise.all([
        supabase.from('mi_saldo')
          .select('id, concepto, monto, created_at')
          .eq('socio_email', userEmail)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('golden_id')
          .select('id, nombre_negocio, ahorro_socio_neto, created_at')
          .eq('socio_email', userEmail)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('golden_congelados')
          .select('id, cantidad, precio_congelado, created_at, market_products(name)')
          .eq('socio_email', userEmail)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const itemsLedger = (resLedger.data || []).map(i => ({
        id: i.id,
        title: i.concepto || 'OPERACIÓN BÓVEDA',
        value: i.monto,
        date: i.created_at,
        icon: <CreditCard size={14} />,
        type: 'ledger',
        isNegative: Number(i.monto) < 0
      }));

      const itemsRed = (resRed.data || []).map(i => ({
        id: i.id,
        title: `CONSUMO: ${i.nombre_negocio}`,
        value: i.ahorro_socio_neto,
        date: i.created_at,
        icon: <Zap size={14} />,
        type: 'red',
        isNegative: false
      }));

      const itemsMarket = (resMarket.data || []).map(i => {
        const prod = i.market_products as any;
        const prodName = Array.isArray(prod) ? prod[0]?.name : prod?.name;
        
        return {
          id: i.id,
          title: `G_MARKET: ${prodName || 'ACTIVO'}`,
          value: -(i.precio_congelado * i.cantidad),
          date: i.created_at,
          icon: <Lock size={14} />,
          type: 'market',
          isNegative: true
        };
      });

      const combined = [...itemsLedger, ...itemsRed, ...itemsMarket]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6);

      setHistory(combined);
    } catch (e) {
      console.error("Error auditoría", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchTotalActivity();
    const channel = supabase.channel(`dashboard-live-${user?.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mi_saldo' }, () => {
        fetchTotalActivity();
        refreshProfile();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.email]);

  const stopScannerAction = async () => {
    if (scannerInstance.current) {
      try { 
        await scannerInstance.current.stop(); 
        scannerInstance.current = null; 
      } catch (e) {
        scannerInstance.current = null;
      }
    }
  };

  const handleScanSuccess = async (qrResult: string) => {
    const rawValue = qrResult.trim();
    if (!rawValue) return;
    await stopScannerAction();
    setIsProcessing(true);
    setShowScanner(false);
    try {
      const rootId = "0" + rawValue.slice(1);
      const { data: biz } = await supabase
        .from('solicitudes_registro')
        .select('nombre_negocio, email_contacto, porcentaje_oferta')
        .eq('id_raiz_operador', rootId)
        .maybeSingle();

      if (!biz) throw new Error("ID_NO_IDENTIFICADO");

      const tier = (user?.membership_tier || 'ENTRY').toUpperCase();
      let limitValue = tier.includes('ELITE') ? 999 : tier.includes('PLUS') ? 2 : 1;

      if (!user?.email) throw new Error("USUARIO_NO_AUTENTICADO");

      const { data: scanData, error } = await supabase.from('solicitudes_escaneo').insert([{
          socio_email: user.email.toLowerCase().trim(),
          socio_full_name: user.full_name || 'SOCIO GOLDEN',
          socio_plan: tier,
          negocio_nombre: biz.nombre_negocio,
          operador_email: `${rawValue}@operador.com`,
          dueño_email: biz.email_contacto,
          porcentaje_oferta: Number(biz.porcentaje_oferta || 0),
          estado: 'pendiente', 
          limite_plan_negocio: limitValue,
          nueva_consulta: false
        }]).select('id, negocio_nombre, estado').single();

      if (error) throw error;
      setActiveScan(scanData);
      navigate('/waiting-approval', { replace: true });
    } catch (err: any) {
      setIsProcessing(false);
      alert(err.message);
    }
  };

  const startScanner = () => {
    setShowScanner(true);
    requestAnimationFrame(async () => {
      try {
        await stopScannerAction();
        const html5QrCode = new Html5Qrcode("reader");
        scannerInstance.current = html5QrCode;
        
        const config = { fps: 15, qrbox: { width: 250, height: 250 } };

        try {
          await html5QrCode.start({ facingMode: "environment" }, config, handleScanSuccess, () => {});
        } catch (e) {
          await html5QrCode.start({ video: true }, config, handleScanSuccess, () => {});
        }
      } catch (e) { 
        alert("No se pudo acceder al sensor óptico.");
        setShowScanner(false);
      }
    });
  };

  const masterLogo = getThemeLogo('dark');
  const pointsAvailable = user?.vault_balance ?? 0;

  return (
    <div className="min-h-screen p-4 md:p-10 pb-40 bg-transparent text-white relative font-heading text-left overflow-x-hidden selection:bg-gold-400 selection:text-black">
      
      {/* ATMÓSFERA LUMÍNICA - HOME (Standard) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[80vw] h-[50vh] opacity-40"
             style={{ background: 'radial-gradient(circle at 0% 0%, white 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
        <div className="absolute bottom-0 right-0 w-[70vw] h-[60vh] opacity-[0.15]"
             style={{ background: 'radial-gradient(circle at 100% 100%, #D4AF37 0%, transparent 60%)', filter: 'blur(100px)' }}></div>
      </div>

      <header className="flex justify-start items-center mb-16 pt-8 px-2 max-w-[500px] mx-auto animate-fade-in relative z-10">
        <div className="flex items-center gap-6">
          <img src={masterLogo} className="h-14 md:h-16 w-auto object-contain" alt="Golden Logo" />
          <div className="h-8 w-[1px] bg-white/10"></div>
          <span className="text-[10px] font-normal text-white uppercase tracking-[0.6em]">Golden acceso</span>
        </div>
      </header>

      <div className="max-w-[500px] mx-auto space-y-8 relative z-10">
        
        <div className="w-full animate-fade-in relative z-0 -mt-10">
          <div className="relative aspect-[1.6/1] w-full bg-[#0a0a0a] rounded-[3rem] border border-white/10 overflow-hidden flex flex-col justify-between p-10 shadow-[0_0_50px_-10px_rgba(255,255,255,0.03)]">
            <div className="absolute inset-0 z-0">
               <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-white/[0.06]"></div>
               <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/[0.03] blur-[60px] rounded-full"></div>
            </div>
            <div className="relative z-20 flex justify-end items-start">
              <button onClick={startScanner} className="w-14 h-14 bg-white text-black rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all shadow-none">
                  {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Camera size={18} />}
                  <span className="text-[6px] font-bold uppercase mt-1.5 tracking-[0.2em]">ESC</span>
              </button>
            </div>
            <div className="relative z-20 flex items-end justify-between w-full">
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-2">
                  <h2 className="text-5xl md:text-6xl font-heading font-normal text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    {Math.round(pointsAvailable).toLocaleString()}
                  </h2>
                  <span className="text-xl font-heading font-normal text-gold-400">GP</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-white/50 font-normal uppercase tracking-[0.4em]">Golden puntos</p>
                  <p className="text-[6px] text-gray-700 font-bold uppercase tracking-[0.5em]">Saldo disponible</p>
                </div>
              </div>
              <button onClick={() => navigate('/profile')} className="w-14 h-14 bg-white text-black rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all shadow-none shrink-0">
                  <User size={18} />
                  <span className="text-[6px] font-bold uppercase mt-1.5 tracking-[0.2em]">VIP</span>
              </button>
            </div>
          </div>
        </div>

        <div className="w-full bg-black/40 rounded-[3rem] p-10 -mt-5">
            <div className="grid grid-cols-2 gap-3 h-[200px]">
                <button onClick={() => navigate('/market')} className="row-span-2 bg-gold-400 text-black rounded-[2.2rem] p-6 flex flex-col justify-between text-left group relative overflow-hidden active:scale-[0.98] transition-all shadow-md">
                    <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
                        <ArrowUpRight size={20} strokeWidth={2} />
                    </div>
                    <div>
                        <p className="text-[6px] font-bold uppercase tracking-[0.6em] text-black/40 mb-2">Protección Activa</p>
                        <h3 className="text-2xl font-heading uppercase tracking-tighter leading-tight">
                          <span className="font-medium">GOLDEN</span><br/>
                          <span className="text-lg font-normal opacity-60">MARKET</span>
                        </h3>
                    </div>
                </button>

                <button onClick={() => navigate('/partners')} className="bg-[#0e0e0e] border border-white/5 rounded-[2rem] p-6 flex flex-col justify-between text-left group active:scale-[0.96] transition-all hover:border-white/10">
                    <Store size={18} className="text-white/60 group-hover:text-gold-400 transition-colors" />
                    <div>
                        <p className="text-[6px] font-bold uppercase tracking-[0.5em] text-gray-500 mb-1.5">Red_Global</p>
                        <h4 className="text-[10px] font-heading font-black uppercase text-white tracking-[0.2em]">NEGOCIOS</h4>
                    </div>
                </button>

                <button onClick={() => navigate('/wallet')} className="bg-[#0e0e0e] border border-white/5 rounded-[2rem] p-6 flex flex-col justify-between text-left group active:scale-[0.96] transition-all hover:border-white/10">
                    <Plus size={20} className="text-white/60 group-hover:text-gold-400 transition-colors" />
                    <div>
                        <p className="text-[6px] font-bold uppercase tracking-[0.5em] text-gray-500 mb-1.5">Recuperación</p>
                        <h4 className="text-[10px] font-heading font-black uppercase text-white tracking-[0.2em]">RECARGAR</h4>
                    </div>
                </button>
            </div>
        </div>

        <div className="mt-16 pt-12 border-t border-white/5 animate-fade-in relative">
           <div className="flex items-center justify-between mb-10 px-1">
              <div className="flex items-center gap-3">
                <History size={14} className="text-gold-400/40" />
                <span className="text-[10px] font-normal uppercase tracking-[0.6em] text-white/40">Actividad reciente</span>
              </div>
              <button onClick={() => navigate('/history')} className="text-[8px] font-bold uppercase tracking-widest text-gold-400/60 hover:text-white transition-colors">Ver todo</button>
           </div>
           
           {loadingHistory ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-20 w-full bg-white/[0.02] border border-white/5 animate-pulse"></div>)}
              </div>
           ) : (
              <div className="space-y-4">
                 {history.map((item) => (
                   <div key={item.id} className="p-7 bg-white/[0.02] border border-white/5 flex items-center justify-between hover:bg-white/[0.05] transition-all cursor-default">
                      <div className="flex items-center gap-6">
                         <div className="text-white/20">{item.icon}</div>
                         <div>
                            <p className="text-[11px] font-heading font-normal text-white uppercase tracking-widest leading-none mb-2">{item.title}</p>
                            <p className="text-[7px] text-gray-600 font-bold uppercase tracking-[0.4em]">
                              {new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                            </p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-xl font-heading font-normal tracking-tight ${item.isNegative ? 'text-white/30' : 'text-green-500'}`}>
                           {item.type !== 'market' && !item.isNegative ? '+' : ''}{item.value.toLocaleString()}
                         </p>
                      </div>
                   </div>
                 ))}
              </div>
           )}
        </div>
      </div>

      {showScanner && (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-6 animate-fade-in overflow-hidden">
          <button onClick={() => stopScannerAction().then(() => setShowScanner(false))} className="absolute top-[calc(1rem+env(safe-area-inset-top))] right-8 p-3 bg-white/5 border border-white/10 rounded-full text-gold-400 z-[1010]"><X size={24} /></button>
          <div className="relative w-full max-w-[400px] aspect-square mb-16 overflow-hidden border border-white/5 rounded-[3rem]">
              <div id="reader" className="w-full h-full grayscale brightness-[0.7]"></div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        #reader { background: black !important; border: none !important; }
        #reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
        * { font-style: normal !important; font-weight: inherit; }
      `}} />
    </div>
  );
};