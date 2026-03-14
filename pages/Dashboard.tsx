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

      const { data: scanData, error } = await supabase.from('solicitudes_escaneo').insert([{
          socio_email: user?.email.toLowerCase().trim(),
          socio_full_name: user?.full_name || 'SOCIO GOLDEN',
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
        <div className="absolute top-0 left-0 w-[100vw] h-[60vh] opacity-40"
             style={{ background: 'radial-gradient(circle at 0% 0%, white 0%, transparent 70%)', filter: 'blur(100px)' }}></div>
        <div className="absolute bottom-0 right-0 w-[80vw] h-[70vh] opacity-[0.1]"
             style={{ background: 'radial-gradient(circle at 100% 100%, #D4AF37 0%, transparent 60%)', filter: 'blur(120px)' }}></div>
      </div>

      <header className="relative z-10 pt-32 pb-20 px-10 max-w-[1400px] w-full mx-auto">
        <div className="flex items-end justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-3 opacity-20">
              <div className="w-8 h-[1px] bg-white"></div>
              <p className="text-[8px] font-black text-white uppercase tracking-[0.8em]">CENTRAL_DE_MANDO</p>
            </div>
            <h1 className="text-8xl font-extralight text-white uppercase tracking-tighter leading-[0.8] flex flex-col">
              GOLDEN <span className="font-black text-gold-400">SOCIO</span>
            </h1>
          </div>
          <button onClick={() => navigate('/profile')} className="group flex flex-col items-end gap-3">
            <div className="w-16 h-16 bg-white/[0.02] border border-white/10 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-500 shadow-2xl">
              <User size={24} strokeWidth={1.5} />
            </div>
            <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.4em] group-hover:text-gold-400 transition-colors">ACCESO_PERFIL</span>
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-10 relative z-10 space-y-32">
        
        {/* BALANCE SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-end">
          <div className="lg:col-span-7 space-y-12">
            <div className="space-y-2">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.6em]">SALDO_DISPONIBLE_BÓVEDA</p>
              <div className="flex items-baseline gap-6">
                <h2 className="text-[12rem] font-extralight text-white tracking-tighter leading-none">
                  {Math.round(pointsAvailable).toLocaleString()}
                </h2>
                <div className="flex flex-col">
                  <span className="text-3xl font-light text-gold-400 tracking-tight">GP</span>
                  <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">GOLDEN_POINTS</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-6 max-w-md">
              <button 
                onClick={startScanner}
                className="flex-1 bg-white text-black py-7 rounded-none flex items-center justify-center gap-5 group hover:bg-gold-400 transition-all duration-500 active:scale-95 shadow-2xl"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} strokeWidth={1.5} />}
                <span className="text-[10px] font-black uppercase tracking-[0.5em]">ESCANEAR_ID</span>
              </button>
              <button 
                onClick={() => navigate('/wallet')}
                className="w-24 bg-white/[0.02] border border-white/10 rounded-none flex items-center justify-center hover:bg-white hover:text-black transition-all duration-500 active:scale-95 shadow-xl"
              >
                <Plus size={28} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-8">
            <button 
              onClick={() => navigate('/market')}
              className="group p-12 bg-white/[0.01] border border-white/5 rounded-none flex flex-col justify-between aspect-square hover:bg-white/[0.03] hover:border-gold-400/40 transition-all duration-700 text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                <Store size={120} strokeWidth={1} />
              </div>
              <div className="w-14 h-14 rounded-none bg-gold-400 text-black flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-xl">
                <ArrowUpRight size={28} strokeWidth={1.5} />
              </div>
              <div className="relative z-10">
                <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">ADQUISICIÓN</p>
                <h3 className="text-3xl font-light text-white uppercase tracking-tighter leading-none">
                  GOLDEN<br/><span className="font-black text-gold-400">MARKET</span>
                </h3>
              </div>
            </button>

            <button 
              onClick={() => navigate('/partners')}
              className="group p-12 bg-white/[0.01] border border-white/5 rounded-none flex flex-col justify-between aspect-square hover:bg-white/[0.03] transition-all duration-700 text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                <Zap size={120} strokeWidth={1} />
              </div>
              <div className="w-14 h-14 rounded-none bg-white/5 border border-white/10 text-white/40 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-500 shadow-xl">
                <Store size={28} strokeWidth={1.5} />
              </div>
              <div className="relative z-10">
                <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">RED_GLOBAL</p>
                <h3 className="text-3xl font-light text-white uppercase tracking-tighter leading-none">
                  NEGOCIOS<br/><span className="font-black opacity-20">ALIADOS</span>
                </h3>
              </div>
            </button>
          </div>
        </section>

        {/* ACTIVITY SECTION */}
        <section className="pb-32">
          <div className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-6">
              <div className="w-12 h-[1px] bg-white/20"></div>
              <span className="text-[10px] font-black uppercase tracking-[1em] text-white/40">ACTIVIDAD_RECIENTE</span>
            </div>
            <button onClick={() => navigate('/history')} className="text-[9px] font-black text-gold-400 uppercase tracking-widest hover:text-white transition-all duration-500 border-b border-gold-400/20 pb-1">VER_HISTORIAL_COMPLETO</button>
          </div>
          
          {loadingHistory ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="h-32 w-full bg-white/[0.01] border border-white/5 rounded-none animate-pulse"></div>)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {history.map((item) => (
                 <div key={item.id} className="p-10 bg-white/[0.01] border border-white/5 rounded-none flex items-center justify-between hover:bg-white/[0.03] transition-all duration-500 group cursor-pointer">
                    <div className="flex items-center gap-8">
                       <div className="w-16 h-16 rounded-none bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/20 group-hover:text-gold-400 group-hover:border-gold-400/30 transition-all duration-500">
                        {React.cloneElement(item.icon as React.ReactElement, { size: 24, strokeWidth: 1.5 })}
                       </div>
                       <div>
                          <p className="text-[12px] font-black text-white uppercase tracking-[0.15em] mb-2 group-hover:text-gold-400 transition-colors">{item.title}</p>
                          <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.5em]">
                            {new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                          </p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className={`text-3xl font-light tracking-tighter ${item.isNegative ? 'text-white/20' : 'text-emerald-500'}`}>
                         {item.type !== 'market' && !item.isNegative ? '+' : ''}{item.value.toLocaleString()}
                       </p>
                       <p className="text-[7px] font-black text-white/10 uppercase tracking-widest mt-1">GP_UNITS</p>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </section>
      </div>

      {showScanner && (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-6 animate-fade-in overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vh] opacity-20"
                 style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', filter: 'blur(100px)' }}></div>
          </div>
          <button onClick={() => stopScannerAction().then(() => setShowScanner(false))} className="absolute top-12 right-12 p-5 bg-white/5 border border-white/10 rounded-full text-gold-400 z-[1010] hover:bg-white hover:text-black transition-all duration-500 shadow-2xl"><X size={32} strokeWidth={1.5} /></button>
          <div className="relative w-full max-w-[500px] aspect-square mb-20 overflow-hidden border border-white/10 rounded-none shadow-[0_0_100px_rgba(212,175,55,0.1)]">
              <div id="reader" className="w-full h-full grayscale brightness-[0.6] contrast-[1.2]"></div>
              <div className="absolute inset-0 border-[40px] border-black/60 pointer-events-none"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-gold-400/30"></div>
          </div>
          <p className="text-[10px] font-black text-gold-400 uppercase tracking-[1em] animate-pulse">Sincronizando Sensor Óptico</p>
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