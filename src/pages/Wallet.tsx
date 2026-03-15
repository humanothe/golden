import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { 
  Wallet as WalletIcon, 
  Plus, 
  History, 
  QrCode, 
  Keyboard, 
  ArrowUpRight, 
  ArrowDownLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Scan
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Transaction {
  id: string;
  tipo: 'recarga' | 'gasto';
  monto: number;
  descripcion: string;
  created_at: string;
}

export const Wallet: React.FC = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecargaModal, setShowRecargaModal] = useState(false);
  const [recargaMode, setRecargaMode] = useState<'scan' | 'manual' | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      // Fetch Balance
      const { data: profile, error: profileError } = await supabase
        .from('perfiles')
        .select('saldo')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error fetching balance:", profileError);
      } else if (profile) {
        setBalance(profile.saldo || 0);
      }

      // Fetch Transactions
      const { data: txs, error: txsError } = await supabase
        .from('transacciones')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (txsError) throw txsError;
      setTransactions(txs || []);
    } catch (err) {
      console.error("Error fetching wallet data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecarga = async (code: string) => {
    if (!code) return;
    setIsProcessing(true);
    setStatus(null);

    try {
      // 1. Validar cupón
      const { data: cupon, error: cuponError } = await supabase
        .from('cupones')
        .select('*')
        .eq('codigo', code.toUpperCase())
        .eq('activo', true)
        .single();

      if (cuponError || !cupon) {
        throw new Error("Código inválido o ya utilizado");
      }

      // 2. Actualizar saldo del usuario
      const newBalance = balance + cupon.valor;
      const { error: updateError } = await supabase
        .from('perfiles')
        .update({ saldo: newBalance })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 3. Desactivar cupón
      await supabase
        .from('cupones')
        .update({ activo: false, usado_por: user.id })
        .eq('id', cupon.id);

      // 4. Registrar transacción
      await supabase
        .from('transacciones')
        .insert({
          user_id: user.id,
          tipo: 'recarga',
          monto: cupon.valor,
          descripcion: `Recarga mediante código: ${code.toUpperCase()}`
        });

      setStatus({ type: 'success', message: `¡Recarga exitosa! +$${cupon.valor.toFixed(2)}` });
      setBalance(newBalance);
      setManualCode('');
      fetchWalletData();
      
      setTimeout(() => {
        setShowRecargaModal(false);
        setRecargaMode(null);
        setStatus(null);
      }, 2000);

    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || "Error al procesar la recarga" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <p className="text-gold-400 text-[10px] tracking-[0.5em] uppercase mb-2">Mi Billetera</p>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Golden <span className="text-white/40">Wallet</span></h1>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
            <WalletIcon className="text-gold-400" size={24} />
          </div>
        </header>

        {/* Balance Card */}
        <div className="glass-card p-8 rounded-[2rem] bg-gradient-to-br from-gold-400/10 to-transparent border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <WalletIcon size={120} />
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold mb-2">Saldo Disponible</p>
          <h2 className="text-5xl font-black tracking-tighter mb-8">
            <span className="text-gold-400">$</span>{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h2>
          
          <button 
            onClick={() => setShowRecargaModal(true)}
            className="w-full bg-gold-400 text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> Recargar Saldo
          </button>
        </div>

        {/* History Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
              <History size={14} /> Historial de Sesión
            </h3>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl"></div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-white/20">
              <p className="text-[10px] uppercase tracking-widest">No hay transacciones recientes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.tipo === 'recarga' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {tx.tipo === 'recarga' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-tight">{tx.descripcion}</p>
                      <p className="text-[10px] text-white/40 uppercase">{new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-black ${tx.tipo === 'recarga' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {tx.tipo === 'recarga' ? '+' : '-'}${tx.monto.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recarga Modal */}
        <AnimatePresence>
          {showRecargaModal && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowRecargaModal(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black uppercase tracking-tighter">Recargar <span className="text-gold-400">Fondos</span></h3>
                  <button onClick={() => setShowRecargaModal(false)} className="text-white/40 hover:text-white">
                    <XCircle size={24} />
                  </button>
                </div>

                {!recargaMode ? (
                  <div className="grid grid-cols-1 gap-4">
                    <button 
                      onClick={() => setRecargaMode('scan')}
                      className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-gold-400 hover:text-black transition-all group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-black/10">
                        <QrCode size={24} />
                      </div>
                      <div className="text-left">
                        <p className="font-black uppercase tracking-widest text-xs">Escanear QR</p>
                        <p className="text-[10px] opacity-60 uppercase">Usa tu cámara para recargar</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => setRecargaMode('manual')}
                      className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-gold-400 hover:text-black transition-all group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-black/10">
                        <Keyboard size={24} />
                      </div>
                      <div className="text-left">
                        <p className="font-black uppercase tracking-widest text-xs">Código Manual</p>
                        <p className="text-[10px] opacity-60 uppercase">Ingresa el código de 12 dígitos</p>
                      </div>
                    </button>
                  </div>
                ) : recargaMode === 'scan' ? (
                  <div className="space-y-6 text-center">
                    <div className="aspect-square bg-black rounded-3xl border-2 border-dashed border-gold-400/50 flex flex-col items-center justify-center relative overflow-hidden">
                      <Scan size={48} className="text-gold-400 animate-pulse" />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold-400/10 to-transparent animate-scan" />
                      <p className="mt-4 text-[10px] uppercase tracking-widest text-white/40">Buscando código...</p>
                    </div>
                    <p className="text-xs text-white/40 uppercase">Apunta tu cámara al código QR de recuperación</p>
                    <button 
                      onClick={() => setRecargaMode(null)}
                      className="text-[10px] font-black uppercase tracking-widest text-gold-400"
                    >
                      Volver a opciones
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Código de Recuperación</label>
                      <input 
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                        placeholder="XXXX-XXXX-XXXX"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-center text-xl font-mono tracking-[0.2em] focus:border-gold-400 outline-none transition-all"
                      />
                    </div>

                    {status && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-2xl flex items-center gap-3 ${
                          status.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}
                      >
                        {status.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                        <p className="text-xs font-bold uppercase">{status.message}</p>
                      </motion.div>
                    )}

                    <button 
                      onClick={() => handleRecarga(manualCode)}
                      disabled={isProcessing || manualCode.length < 4}
                      className="w-full bg-gold-400 text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 className="animate-spin" size={18} /> : 'Validar Código'}
                    </button>

                    <button 
                      onClick={() => setRecargaMode(null)}
                      className="w-full text-[10px] font-black uppercase tracking-widest text-white/40"
                    >
                      Volver a opciones
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </Layout>
  );
};
