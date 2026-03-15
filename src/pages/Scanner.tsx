import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/Layout';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, CheckCircle2, XCircle, QrCode } from 'lucide-react';

export const Scanner: React.FC = () => {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (isScanning) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isScanning]);

  const startScanner = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }
      
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText: string) => {
          handleScan(decodedText);
        },
        (errorMessage: string) => {
          // Ignore scan errors as they happen constantly when no QR code is in view
        }
      );
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      setCameraError("No se pudo acceder a la cámara. Por favor, verifica los permisos.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  const handleScan = async (text: string) => {
    if (!text || isProcessing || !isScanning) return;
    
    setIsScanning(false);
    setIsProcessing(true);
    setResult(null);

    try {
      let cardId = text;
      try {
        const parsed = JSON.parse(text);
        if (parsed.id) cardId = parsed.id;
      } catch (e) {
        // Not JSON, use as is
      }

      const { data, error } = await supabase
        .from('golden_congelados')
        .update({ socio_id: user?.id, socio_email: user?.email, estado: 'reclamado' })
        .eq('id', cardId)
        .is('socio_id', null)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setResult({ success: true, message: 'Tarjeta reclamada exitosamente' });
      } else {
        setResult({ success: false, message: 'Tarjeta no válida o ya reclamada' });
      }

    } catch (error: any) {
      console.error('Error claiming card:', error);
      setResult({ success: false, message: error.message || 'Error al reclamar la tarjeta' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-8">
        <header>
          <p className="text-gold-400 text-[10px] tracking-[0.5em] uppercase mb-2">Escanear y Canjear</p>
          <h1 className="text-4xl font-black tracking-tighter uppercase">Reclamar <span className="text-gold-400">Tarjeta</span></h1>
        </header>

        <div className="glass-card p-6 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
          {cameraError ? (
            <div className="flex flex-col items-center space-y-4 text-center">
              <XCircle className="text-red-500" size={48} />
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">{cameraError}</p>
              <button
                onClick={() => {
                  setCameraError(null);
                  setIsScanning(false);
                  setTimeout(() => setIsScanning(true), 100);
                }}
                className="bg-gold-400 text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all"
              >
                Reintentar
              </button>
            </div>
          ) : isScanning ? (
            <div className="w-full max-w-sm aspect-square rounded-2xl overflow-hidden border-2 border-gold-400/50 relative bg-black">
              <div id="qr-reader" className="w-full h-full"></div>
              <div className="absolute inset-0 border-4 border-gold-400/20 pointer-events-none"></div>
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gold-400/50 shadow-[0_0_10px_rgba(250,204,21,0.5)] animate-scan"></div>
            </div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="animate-spin text-gold-400" size={48} />
              <p className="text-xs font-black uppercase tracking-widest text-white/60">Procesando Tarjeta...</p>
            </div>
          ) : result ? (
            <div className="flex flex-col items-center space-y-6 text-center">
              {result.success ? (
                <CheckCircle2 className="text-green-500" size={64} />
              ) : (
                <XCircle className="text-red-500" size={64} />
              )}
              <div>
                <p className="text-xl font-black uppercase tracking-tighter mb-2">
                  {result.success ? '¡Éxito!' : 'Error'}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-white/60">
                  {result.message}
                </p>
              </div>
              <button
                onClick={() => {
                  setResult(null);
                  setIsScanning(true);
                }}
                className="bg-gold-400 text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all"
              >
                Escanear Otra Tarjeta
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <QrCode className="text-white/20" size={64} />
              <button
                onClick={() => setIsScanning(true)}
                className="bg-gold-400 text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all"
              >
                Iniciar Escáner
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
