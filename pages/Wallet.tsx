import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, QrCode, X, History, 
  Check, Keyboard, ShieldCheck,
  ChevronRight, Loader2, Camera, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { supabase } from '../services/supabaseClient';

declare const jsQR: any;

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

  const isQuerying = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isScanning = useRef(false);

  const stopMedia = useCallback(() => {
    isScanning.current = false;
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
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
    
    setAppStatus('loading');
    setErrorMsg(null);
    isQuerying.current = true;

    try {
      const { data, error } = await supabase
        .from('tarjetas_golden')
        .select('id, codigo_pin, valor_punto, estado, perfil_id')
        .eq('codigo_pin', cleanPin)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        setErrorMsg("IDENTIDAD NO ENCONTRADA EN EL LIBRO MAYOR.");
        setAppStatus('error');
        return;
      }

      const statusActual = (data.estado || '').toLowerCase();

      if (statusActual === 'usada' || statusActual === 'cobrada' || data.perfil_id) {
        setErrorMsg("OPERACIÓN DENEGADA: ESTE PIN YA FUE LIQUIDADO.");
        setAppStatus('error');
      } 
      else if (statusActual === 'activada') {
        setCardData(data);
        setAppStatus('success');
      }
      else {
        setErrorMsg(`TARJETA ${statusActual.toUpperCase()}. REQUIERE ACTIVACIÓN COMERCIAL.`);
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

      setSuccessMsg("¡Recarga Exitosa! Capital liquidado en tu bóveda.");
      
      await refreshProfile(); 
      if (user?.id) {
        const latest = await api.data.getLastRecharges(user.id);
        setRecentRecharges(latest);
      }
      
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

      setTimeout(() => {
        factoryReset();
        setTimeout(() => setSuccessMsg(null), 4000);
      }, 1500);

    } catch (err: any) {
      console.error("RPC_REJECTED_DETAILS:", err);
      setErrorMsg(err.message || "ERROR CRÍTICO EN NODO DE TESORERÍA.");
      setAppStatus('error');
    } finally {
      isQuerying.current = false;
    }
  };

  const scanFrame = useCallback(() => {
    if (!isScanning.current || !videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

      if (code && code.data) {
        const rawDetection = code.data.trim().toUpperCase();
        isScanning.current = false;
        if (navigator.vibrate) navigator.vibrate(150);
        setPinInput(rawDetection);
        stopMedia();
        verifyPin(rawDetection);
        return;
      }
    }
    if (isScanning.current) requestRef.current = requestAnimationFrame(scanFrame);
  }, [stopMedia]);

  const startCamera = async () => {
    setErrorMsg(null);
    stopMedia();
    setInputMode('camera');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" }, 
        audio: false 
      });

      streamRef.current = stream;
      isScanning.current = true;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Video play error", e));
          requestRef.current = requestAnimationFrame(scanFrame);
        };
      }
    } catch (err) {
      setErrorMsg("ERROR DE HARDWARE: Permisos de cámara denegados.");
      setInputMode('none');
    }
  };

  useEffect(() => {
    if (user?.id && user.id !== 'guest') {
      api.data.getLastRecharges(user.id).then(setRecentRecharges);
    }
    return () => stopMedia();
  }, [user, stopMedia]);

  return (
    <div className="min-h-screen bg-transparent text-white font-sans pb-40 overflow-x-hidden text-left selection:bg-gold-400 relative">
      
      {/* ATMÓSFERA LUMÍNICA - WALLET (Inversión cromática: Oro Top-Left, Blanco Bottom-Right) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[80vw] h-[50vh] opacity-[0.12]"
               style={{ background: 'radial-gradient(circle at 0% 0%, #D4AF37 0%, transparent 70%)', filter: 'blur(100px)' }}></div>
          <div className="absolute bottom-0 right-0 w-[70vw] h-[60vh] opacity-[0.25]"
               style={{ background: 'radial-gradient(circle at 100% 100%, white 0%, transparent 60%)', filter: 'blur(90px)' }}></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>
      </div>
      
      <div className="max-w-xl mx-auto px-6 relative z-10">
        <header className="pt-8 flex items-center justify-start mb-10">
            <button onClick={() => navigate('/dashboard')} className="p-4 bg-white/5 border border-white/10 text-gray-400 hover:text-white rounded-xl active:scale-90">
                <ArrowLeft size={24} />
            </button>
        </header>

        <div className="mb-10 animate-fade-in">
          <p className="text-[10px] text-gold-400 font-black uppercase tracking-[0.6em] mb-3">SISTEMA DE AUDITORÍA</p>
          <h1 className="font-heading text-4xl md:text-5xl font-black tracking-tighter text-white uppercase leading-none">
            Golden <span className="text-gold-metallic">Wallet</span>
          </h1>
          
          <div className="mt-8 p-10 bg-white/[0.02] border border-white/5 rounded-none shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 blur-[50px] -mr-16 -mt-16"></div>
            <p className="text-[8px] text-gray-600 uppercase tracking-[0.5em] mb-4 font-black">CAPITAL_GP_LIQUIDADO</p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-5xl md:text-7xl font-mono font-black tracking-tighter text-white leading-none">
                {pointsBalance.toLocaleString()}
              </h2>
              <span className="text-xl font-heading font-bold text-gold-400 opacity-30">GP</span>
            </div>
          </div>
        </div>

        {successMsg && (
          <div className="mb-8 p-6 bg-green-500/10 border border-green-500/20 flex items-center gap-4 animate-enter-screen">
            <Check size={20} className="text-green-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-green-500">{successMsg}</p>
          </div>
        )}

        {appStatus === 'idle' && inputMode === 'none' && (
          <div className="grid grid-cols-1 gap-4">
            <button onClick={startCamera} className="w-full p-10 bg-gold-400 text-black flex items-center justify-between active:scale-[0.98] transition-all shadow-2xl group">
                <div className="flex items-center gap-8">
                    <QrCode size={32} />
                    <div className="text-left">
                      <span className="text-[12px] font-black uppercase tracking-[0.5em] block mb-1">CAPTURAR QR</span>
                      <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">IDENTIFICACIÓN ÓPTICA</span>
                    </div>
                </div>
                <ChevronRight size={18} className="opacity-40" />
            </button>

            <button onClick={() => setInputMode('keyboard')} className="w-full p-10 bg-white/5 border border-white/10 text-white flex items-center justify-between active:scale-[0.98] transition-all">
                <div className="flex items-center gap-8">
                    <Keyboard size={32} className="text-gray-500" />
                    <div className="text-left">
                      <span className="text-[12px] font-black uppercase tracking-[0.5em] block mb-1">INGRESO PIN</span>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-gray-700">ENTRADA MAESTRA</span>
                    </div>
                </div>
                <ChevronRight size={18} className="opacity-20" />
            </button>
          </div>
        )}

        {appStatus === 'loading' && (
          <div className="flex flex-col items-center justify-center py-24 gap-6 animate-pulse">
             <div className="w-16 h-16 border-2 border-gold-400/20 border-t-gold-400 animate-spin"></div>
             <p className="text-[9px] text-gold-400 uppercase tracking-[0.8em] font-black">AUDITANDO NODO...</p>
          </div>
        )}

        {appStatus === 'success' && cardData && (
          <div className="animate-enter-screen border border-green-500/40 bg-green-500/[0.03] p-10 shadow-2xl relative">
             <ShieldCheck size={44} className="text-green-500 mb-8" />
             <div className="mb-10">
               <p className="text-[8px] text-gray-500 uppercase tracking-[0.6em] mb-4 font-black">VALOR_ACREDITABLE</p>
               <h2 className="text-6xl font-mono font-black text-white tracking-tighter leading-none">{cardData.valor_punto.toLocaleString()} GP</h2>
             </div>
             <div className="space-y-4">
               <button onClick={confirmRecharge} className="w-full py-6 bg-green-500 text-black font-black uppercase tracking-[0.5em] text-[11px] active:scale-95 shadow-xl">AUTORIZAR CARGA</button>
               <button onClick={factoryReset} className="w-full py-4 text-gray-700 hover:text-white text-[9px] font-black uppercase tracking-widest">CANCELAR</button>
             </div>
          </div>
        )}

        {appStatus === 'error' && (
          <div className="animate-fade-in border border-red-500/40 bg-red-500/[0.03] p-10 text-center">
             <AlertTriangle size={52} className="text-red-500 mx-auto mb-10" />
             <p className="text-[11px] font-black text-red-500 uppercase tracking-[0.1em] mb-12 leading-relaxed font-bold">{errorMsg}</p>
             <button onClick={factoryReset} className="w-full py-6 bg-white text-black text-[9px] font-black uppercase tracking-widest active:scale-[0.95]">REINTENTAR</button>
          </div>
        )}

        {inputMode === 'keyboard' && appStatus === 'idle' && (
          <div className="animate-enter-screen p-10 bg-white/[0.03] border border-white/10">
             <div className="flex justify-between items-center mb-10">
               <span className="text-[8px] text-gold-400 uppercase tracking-[0.8em] font-black">VERIFICACIÓN_PIN</span>
               <button onClick={factoryReset} className="text-gray-700 hover:text-white transition-colors"><X size={24}/></button>
             </div>
             <input 
                type="text" 
                autoFocus 
                value={pinInput} 
                onChange={(e) => setPinInput(e.target.value.toUpperCase())} 
                placeholder="CÓDIGO DE TARJETA" 
                className="w-full bg-transparent text-3xl font-mono text-center tracking-[0.1em] text-white focus:outline-none placeholder:text-white/5 uppercase leading-tight mb-12 border-b border-white/10 pb-4" 
             />
             <button onClick={() => verifyPin(pinInput)} disabled={pinInput.length < 3} className="w-full py-7 bg-white text-black font-black uppercase tracking-[0.5em] text-[11px] active:scale-95 disabled:opacity-20 shadow-2xl">VERIFICAR CÓDIGO</button>
          </div>
        )}

        {inputMode === 'camera' && appStatus === 'idle' && (
          <div className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center animate-fade-in overflow-hidden">
            <video 
              ref={videoRef} 
              className="absolute inset-0 w-full h-full object-cover z-0" 
              playsInline
              muted
              autoPlay
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute inset-0 z-10 pointer-events-none" style={{ boxShadow: '0 0 0 100vmax rgba(0,0,0,0.85)' }}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 border border-white/10">
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-gold-400"></div>
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-gold-400"></div>
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-gold-400"></div>
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-gold-400"></div>
                  <div className="absolute left-0 right-0 h-[1px] bg-gold-400/40 shadow-[0_0_15px_#D4AF37] animate-scan-cycle"></div>
                </div>
            </div>
            
            <button 
              onClick={factoryReset} 
              className="absolute bottom-20 z-30 w-16 h-16 bg-black/50 border border-white/10 text-white flex items-center justify-center backdrop-blur-xl rounded-full active:scale-90 shadow-2xl"
            >
              <X size={28} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};