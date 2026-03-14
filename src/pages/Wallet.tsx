import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, QrCode, X, History, 
  Check, Keyboard, ShieldCheck,
  ChevronRight, Loader2, Camera, AlertTriangle,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { supabase } from '../services/supabaseClient';

declare const Html5Qrcode: any;

type AppStatus = 'idle' | 'loading' | 'success' | 'error';

export const Wallet: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  
  const pointsBalance = user?.vault_balance ?? 0;

  const [appStatus, setAppStatus] = useState<AppStatus>('idle');
  const [inputMode, setInputMode] = useState<'none' | 'keyboard' | 'camera'>('none');
  const [pinInput, setPinInput] = useState('');
  const [cardData, setCardData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [recentRecharges, setRecentRecharges] = useState<any[]>([]);

  const scannerRef = useRef<any>(null);
  const isQuerying = useRef(false);

  const stopMedia = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (e) {
        console.warn("Error stopping scanner", e);
        scannerRef.current = null;
      }
    }
  }, []);

  const factoryReset = useCallback(() => {
    stopMedia();
    isQuerying.current = false;
    setAppStatus('idle');
    setInputMode('none');
    setPinInput('');
    setCardData(null);
    setErrorMsg(null);
  }, [stopMedia]);

  const verifyPin = async (targetPin: string) => {
    const cleanPin = targetPin.trim().toUpperCase();
    if (!cleanPin || isQuerying.current) return;
    
    setInputMode('none');
    setAppStatus('loading');
    setErrorMsg(null);
    isQuerying.current = true;

    try {
      const { data, error } = await supabase
        .from('tarjetas_golden')
        .select('*')
        .eq('codigo_pin', cleanPin)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        setErrorMsg("IDENTIDAD NO ENCONTRADA EN EL LIBRO MAYOR.");
        setAppStatus('error');
        return;
      }

      const statusActual = (data.estado || '').toString().trim().toLowerCase();

      // REGLA DE ORO: Si el estado es 'activa', se permite el canje inmediatamente.
      if (statusActual === 'activa') {
        setCardData(data);
        setAppStatus('success');
      }
      else if (statusActual === 'usada') {
        setErrorMsg("OPERACIÓN DENEGADA: ESTE PIN YA FUE LIQUIDADO.");
        setAppStatus('error');
      } 
      else if (statusActual === 'en_calle') {
        setErrorMsg("TARJETA EN CALLE: REQUIERE ACTIVACIÓN COMERCIAL.");
        setAppStatus('error');
      }
      else {
        setErrorMsg(`ESTADO ACTUAL: ${statusActual.toUpperCase()}. REQUIERE REVISIÓN.`);
        setAppStatus('error');
      }

    } catch (e: any) {
      setErrorMsg("FALLO EN NODO MAESTRO: SINCRONIZACIÓN FALLIDA.");
      setAppStatus('error');
    } finally {
      isQuerying.current = false;
    }
  };

  const confirmRecharge = async () => {
    if (!user?.id || !cardData || isQuerying.current) return;
    
    setAppStatus('loading');
    isQuerying.current = true;
    setErrorMsg(null);

    try {
      const { error: rpcError } = await supabase.rpc('procesar_canje_tarjeta', {
          p_tarjeta_id: cardData.id,
          p_socio_id: user.id
      });

      if (rpcError) throw rpcError;

      // Cambiamos el estado a 'idle' inmediatamente para que el overlay solo muestre el successMsg
      setAppStatus('idle');
      setSuccessMsg("PROCESO EXITOSO");
      
      await refreshProfile(); 
      if (user?.id) {
        const latest = await api.data.getLastRecharges(user.id);
        setRecentRecharges(latest);
      }
      
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

      setTimeout(() => {
        factoryReset();
        setTimeout(() => setSuccessMsg(null), 3000);
      }, 2000);

    } catch (err: any) {
      console.error("RPC_REJECTED_DETAILS:", err);
      setErrorMsg(err.message || "FALLO EN NODO DE TESORERÍA");
      setAppStatus('error');
    } finally {
      isQuerying.current = false;
    }
  };

  const handleScanSuccess = async (qrResult: string) => {
    const rawDetection = qrResult.trim().toUpperCase();
    if (!rawDetection) return;
    
    if (navigator.vibrate) navigator.vibrate(150);
    setPinInput(rawDetection);
    await stopMedia();
    setInputMode('none');
    verifyPin(rawDetection);
  };

  const startCamera = async () => {
    setErrorMsg(null);
    await stopMedia();
    setInputMode('camera');
    
    requestAnimationFrame(async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;
        
        const config = { 
          fps: 15, 
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0
        };

        try {
          await html5QrCode.start(
            { facingMode: "environment" }, 
            config, 
            handleScanSuccess, 
            () => {}
          );
        } catch (e) {
          await html5QrCode.start(
            { video: true }, 
            config, 
            handleScanSuccess, 
            () => {}
          );
        }
      } catch (err) {
        console.error("Scanner init error", err);
        setErrorMsg("ERROR DE HARDWARE: No se pudo iniciar el sensor óptico.");
        setInputMode('none');
      }
    });
  };

  useEffect(() => {
    if (user?.id && user.id !== 'guest') {
      api.data.getLastRecharges(user.id).then(setRecentRecharges);
    }
    return () => {
      stopMedia();
    };
  }, [user, stopMedia]);

  return (
    <div className="min-h-screen bg-transparent text-white font-sans pb-40 overflow-x-hidden text-left selection:bg-gold-400 relative">
      
      {/* ATMÓSFERA LUMÍNICA - REFINADA (ESTILO PORTFOLIO) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[20%] -left-[20%] w-[100%] h-[100%] opacity-20"
               style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)', filter: 'blur(100px)' }}></div>
          <div className="absolute -bottom-[20%] -right-[20%] w-[100%] h-[100%] opacity-[0.1]"
               style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', filter: 'blur(120px)' }}></div>
      </div>

      <div className={`max-w-xl mx-auto px-8 relative z-10 transition-all duration-1000 ${(appStatus !== 'idle' || successMsg) ? 'blur-3xl scale-95 opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <header className="pt-10 flex items-center justify-start mb-12">
            <button onClick={() => navigate('/dashboard')} className="p-3 -ml-3 text-white/20 hover:text-white active:scale-90 transition-all hover:bg-white/5 rounded-full">
                <ArrowLeft size={24} strokeWidth={1.5} />
            </button>
        </header>

        <div className="mb-20 space-y-16">
          <div className="space-y-6">
            <div className="flex items-center gap-3 opacity-30">
              <div className="w-4 h-[1px] bg-gold-400"></div>
              <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white">RECARGA_DE_ACTIVOS</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase leading-[0.85]">
              GOLDEN <br/> <span className="text-gold-400">PUNTOS</span>
            </h1>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-gold-400/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <div className="p-10 md:p-14 bg-white/[0.01] border border-white/5 relative overflow-hidden rounded-none">
              <div className="absolute top-0 right-0 p-6 opacity-[0.01] pointer-events-none">
                <ShieldCheck size={140} strokeWidth={0.5} />
              </div>
              <p className="text-[7px] text-white/20 uppercase tracking-[0.5em] mb-10 font-black">CAPITAL_GP_DISPONIBLE</p>
              <div className="flex flex-col items-start">
                <h2 className="text-7xl md:text-9xl font-black tracking-tighter text-white leading-none font-mono">
                  {Math.round(pointsBalance).toLocaleString()}
                </h2>
                <div className="flex items-center gap-3 mt-8 opacity-40">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse"></div>
                  <span className="text-[8px] font-black text-white uppercase tracking-[0.4em]">Sincronizado con Nodo Maestro</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={startCamera} 
              className="group relative p-8 bg-gold-400 hover:bg-white text-black transition-all duration-500 active:scale-[0.98] overflow-hidden rounded-none shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <QrCode size={100} strokeWidth={0.5} />
              </div>
              <div className="relative z-10 flex items-center gap-6">
                <div className="w-14 h-14 bg-black/5 flex items-center justify-center rounded-none">
                  <QrCode size={28} strokeWidth={1.5} />
                </div>
                <div className="text-left">
                  <span className="text-sm font-black uppercase tracking-[0.2em] block leading-none">CAPTURAR_QR</span>
                  <span className="text-[7px] font-bold uppercase tracking-[0.4em] opacity-30 mt-2 block">ACTIVACIÓN POR SENSOR ÓPTICO</span>
                </div>
              </div>
            </button>
    
            <button 
              onClick={() => setInputMode('keyboard')} 
              className="group relative p-8 bg-white/[0.01] border border-white/5 hover:border-white/10 text-white transition-all duration-500 active:scale-[0.98] overflow-hidden rounded-none"
            >
              <div className="absolute top-0 right-0 p-6 opacity-[0.01] group-hover:opacity-[0.03] transition-opacity">
                <Keyboard size={100} strokeWidth={0.5} />
              </div>
              <div className="relative z-10 flex items-center gap-6">
                <div className="w-14 h-14 bg-white/5 flex items-center justify-center rounded-none group-hover:bg-white group-hover:text-black transition-all duration-500">
                  <Keyboard size={28} strokeWidth={1} />
                </div>
                <div className="text-left">
                  <span className="text-sm font-black uppercase tracking-[0.2em] block leading-none">INGRESAR_PIN</span>
                  <span className="text-[7px] font-bold uppercase tracking-[0.4em] opacity-10 mt-2 block">ENTRADA MANUAL DE IDENTIDAD</span>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-24 space-y-10">
            <div className="flex items-center justify-between opacity-20">
              <div className="flex items-center gap-3">
                <History size={12} />
                <span className="text-[8px] font-black uppercase tracking-[0.5em]">HISTORIAL_RECIENTE</span>
              </div>
            </div>

            <div className="space-y-4">
              {recentRecharges.length > 0 ? (
                recentRecharges.map((reg) => (
                  <div key={reg.id} className="group flex items-center justify-between py-4 border-b border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-white/5 flex items-center justify-center rounded-none group-hover:bg-gold-400 group-hover:text-black transition-all">
                        <Check size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">RECARGA_EXITOSA</p>
                        <p className="text-[7px] text-white/20 uppercase tracking-widest font-bold">
                          {new Date(reg.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-mono font-black text-gold-400 tracking-tighter">+{Math.round(reg.monto).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center opacity-10">
                  <p className="text-[8px] font-black uppercase tracking-[0.5em]">SIN_REGISTROS_EN_EL_NODO</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* OVERLAYS DE ESTADO - REDISEÑO PREMIUM */}
        {(appStatus !== 'idle' || successMsg || inputMode === 'keyboard') && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-black/95 backdrop-blur-3xl animate-fade-in">
            
            {inputMode === 'keyboard' && (
              <div className="max-w-md w-full animate-enter-screen text-center space-y-16">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3 opacity-40">
                    <div className="w-6 h-[1px] bg-gold-400"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white">PROTOCOLO_MANUAL</span>
                  </div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter">INGRESE_CÓDIGO_PIN</h2>
                </div>
                
                <div className="relative">
                  <textarea 
                      autoFocus 
                      rows={1}
                      value={pinInput} 
                      onChange={(e) => setPinInput(e.target.value.toUpperCase())} 
                      placeholder="•••• •••• ••••" 
                      className="w-full bg-transparent text-5xl md:text-6xl font-mono text-center tracking-[0.2em] text-white focus:outline-none placeholder:text-white/5 uppercase resize-none overflow-hidden break-all leading-tight font-black" 
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                  />
                  <div className="w-full h-[1px] bg-white/10 mt-8"></div>
                </div>

                <div className="space-y-6">
                  <button 
                      onClick={() => verifyPin(pinInput)} 
                      disabled={pinInput.length < 3} 
                      className="w-full py-8 bg-white text-black font-black uppercase tracking-[0.6em] text-[13px] active:scale-95 disabled:opacity-10 shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-all"
                  >
                    VERIFICAR_IDENTIDAD
                  </button>
                  
                  <button 
                      onClick={factoryReset} 
                      className="text-[11px] font-black text-white/20 hover:text-white uppercase tracking-[0.5em] transition-all"
                  >
                    CANCELAR_OPERACIÓN
                  </button>
                </div>
              </div>
            )}

            {appStatus === 'loading' && (
              <div className="flex flex-col items-center justify-center gap-12 text-center">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 border border-white/5 rounded-full"></div>
                  <div className="absolute inset-0 border-t-2 border-gold-400 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity size={32} className="text-gold-400 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[12px] text-gold-400 uppercase tracking-[1.5em] font-black ml-[1.5em]">AUDITANDO_NODO</p>
                  <p className="text-[9px] text-white/20 uppercase tracking-[0.8em] font-bold">SINCRONIZANDO CON EL LIBRO MAYOR</p>
                </div>
              </div>
            )}

            {appStatus === 'success' && cardData && (
              <div className="max-w-md w-full bg-[#050505] border border-white/10 p-16 shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative animate-enter-screen text-center overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                  <Check size={200} strokeWidth={1} />
                </div>
                
                <div className="w-24 h-24 bg-green-500/5 rounded-full flex items-center justify-center mx-auto mb-12 border border-green-500/20 relative z-10">
                  <ShieldCheck size={48} className="text-green-500" strokeWidth={1.5} />
                </div>
                
                <div className="mb-16 relative z-10">
                  <p className="text-[10px] text-white/30 uppercase tracking-[0.8em] mb-8 font-black">VALOR_ACREDITABLE</p>
                  <h2 className="text-8xl font-black text-white tracking-tighter leading-none font-mono">{Math.round(cardData.valor_punto).toLocaleString()}</h2>
                  <p className="text-sm font-black text-gold-400 uppercase tracking-[0.5em] mt-6">GOLDEN_PUNTOS</p>
                </div>
                
                <div className="space-y-6 relative z-10">
                  <button 
                    onClick={confirmRecharge} 
                    className="w-full py-7 bg-green-500 text-black font-black uppercase tracking-[0.4em] text-[13px] active:scale-95 shadow-[0_20px_40px_rgba(34,197,94,0.3)] transition-all"
                  >
                    AUTORIZAR_CARGA
                  </button>
                  <button 
                    onClick={factoryReset} 
                    className="w-full py-4 text-white/20 hover:text-white text-[11px] font-black uppercase tracking-[0.5em] transition-all"
                  >
                    ABORTAR_OPERACIÓN
                  </button>
                </div>
              </div>
            )}

            {appStatus === 'error' && (
              <div className="max-w-md w-full bg-[#050505] border border-white/10 p-16 text-center shadow-[0_50px_100px_rgba(0,0,0,0.8)] animate-enter-screen">
                <div className="w-24 h-24 bg-red-500/5 rounded-full flex items-center justify-center mx-auto mb-12 border border-red-500/20">
                  <AlertTriangle size={48} className="text-red-500" strokeWidth={1.5} />
                </div>
                <div className="mb-16">
                  <p className="text-[11px] font-black text-red-500 uppercase tracking-[0.5em] mb-4">ERROR_DE_SISTEMA</p>
                  <p className="text-lg font-black text-white uppercase tracking-tight leading-tight">{errorMsg}</p>
                </div>
                <button 
                  onClick={factoryReset} 
                  className="w-full py-7 bg-white text-black text-[12px] font-black uppercase tracking-[0.6em] active:scale-[0.95] shadow-2xl transition-all"
                >
                  REINTENTAR_CONEXIÓN
                </button>
              </div>
            )}

            {successMsg && (
              <div className="max-w-md w-full bg-[#050505] border border-white/10 p-20 text-center shadow-[0_80px_150px_rgba(0,0,0,0.9)] animate-enter-screen">
                <div className="w-32 h-32 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-16 border border-green-500/30 shadow-[0_0_60px_rgba(34,197,94,0.15)]">
                  <Check size={64} className="text-green-500" strokeWidth={3} />
                </div>
                <div className="space-y-6">
                  <h2 className="text-3xl font-black text-green-500 uppercase tracking-tighter leading-none">{successMsg}</h2>
                  <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-[1px] bg-green-500/20"></div>
                      <p className="text-[10px] text-white/20 uppercase tracking-[1em] font-black ml-[1em]">BÓVEDA_ACTUALIZADA</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {inputMode === 'camera' && appStatus === 'idle' && (
          <div className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center animate-fade-in overflow-hidden">
            <div className="relative w-full h-full">
                <div id="reader" className="w-full h-full grayscale brightness-[0.7] contrast-125"></div>
                
                <div className="absolute inset-0 z-10 pointer-events-none" style={{ boxShadow: '0 0 0 100vmax rgba(0,0,0,0.95)' }}>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 md:w-[450px] md:h-[450px] border border-white/5">
                      <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-gold-400"></div>
                      <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-gold-400"></div>
                      <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-gold-400"></div>
                      <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-gold-400"></div>
                      <div className="absolute left-0 right-0 h-[3px] bg-gold-400 shadow-[0_0_35px_#D4AF37] animate-scan-cycle"></div>
                    </div>
                </div>

                <div className="absolute top-20 left-0 right-0 text-center z-20 space-y-2">
                  <p className="text-[11px] text-gold-400 font-black uppercase tracking-[1em] ml-[1em]">ESCANEANDO_CÓDIGO</p>
                  <p className="text-[8px] text-white/30 uppercase tracking-[0.5em]">POSICIONE EL QR DENTRO DEL MARCO</p>
                </div>
            </div>
            
            <button 
              onClick={factoryReset} 
              className="absolute bottom-24 z-30 w-24 h-24 bg-white/5 border border-white/10 text-white flex items-center justify-center backdrop-blur-3xl rounded-full active:scale-90 shadow-2xl transition-all hover:bg-white/10"
            >
              <X size={40} strokeWidth={1.5} />
            </button>
          </div>
        )}

        <style dangerouslySetInnerHTML={{ __html: `
          #reader { background: black !important; border: none !important; }
          #reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
          @keyframes scan-cycle {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
          }
          .animate-scan-cycle {
            animation: scan-cycle 2.5s ease-in-out infinite;
            position: absolute;
          }
        `}} />
      </div>
    </div>
  );
};
