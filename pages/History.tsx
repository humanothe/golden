import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle, XCircle,
  TrendingUp, ShieldCheck, RefreshCcw, 
  Loader2, ArrowUpRight, ArrowDownLeft, Wallet
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { api } from '../services/api';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'vault' | 'transactions'>('vault');
  const [vaultHistory, setVaultHistory] = useState<any[]>([]);
  const [bizHistory, setBizHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const vData = await api.data.getVaultHistory(user.email);
      const { data: bizData } = await supabase
        .from('golden_id')
        .select('*')
        .eq('socio_email', user.email)
        .order('created_at', { ascending: false });

      const sum = vData?.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0) || 0;

      setVaultHistory(vData || []);
      setBizHistory(bizData || []);
      setTotalBalance(sum);
    } catch (err) {
      console.error("Error sync history:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusInfo = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'aprobado' || s === 'approved') {
      return { icon: <CheckCircle size={14} className="text-green-500" />, label: 'CONFIRMADO', color: 'text-green-500' };
    }
    return { icon: <XCircle size={14} className="text-red-500" />, label: 'DENEGADO', color: 'text-red-500' };
  };

  return (
    <div className="min-h-screen bg-transparent text-white p-6 md:p-12 pb-40 font-sans text-left overflow-x-hidden selection:bg-gold-400 selection:text-black relative">
      
      {/* ATMÓSFERA LUMÍNICA - ESTILO PORTAFOLIO IMPONENTE */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-full h-[60vh] opacity-[0.25]"
               style={{ background: 'radial-gradient(circle at 100% 0%, rgba(212,175,55,0.2) 0%, transparent 70%)', filter: 'blur(120px)' }}></div>
          <div className="absolute top-0 right-0 w-[80vw] h-[50vh] opacity-[0.15]"
               style={{ background: 'radial-gradient(circle at 100% 0%, white 0%, transparent 60%)', filter: 'blur(100px)' }}></div>
      </div>

      <div className="relative z-10">
          <header className="max-w-xl mx-auto flex items-center justify-between mb-8">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => navigate('/profile')} 
                  className="p-2 text-gray-500 hover:text-white active:scale-90 transition-all"
                >
                  <ArrowLeft size={24} />
                </button>
                <div>
                  <p className="text-[8px] text-gold-400 font-black uppercase tracking-[0.5em] mb-2 opacity-60">Libro Mayor</p>
                  <h1 className="text-2xl font-heading font-black uppercase tracking-tighter text-white leading-none">
                    MI <span className="text-gold-metallic">BÓVEDA</span>
                  </h1>
                </div>
              </div>
              <button onClick={fetchData} className="text-gray-700 hover:text-gold-400 transition-colors">
                <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
          </header>

          <div className="max-w-xl mx-auto space-y-8">
            <div className="p-8 bg-white/[0.01] border border-white/5 rounded-none shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 blur-[50px] -mr-16 -mt-16"></div>
              <p className="text-[8px] text-gray-700 font-black uppercase tracking-[0.6em] mb-4">SALDO_TOTAL_LIQUIDADO</p>
              <div className="flex flex-col items-start gap-1">
                <h2 className="text-4xl md:text-5xl font-mono font-black tracking-tighter text-white leading-none">
                  {totalBalance.toLocaleString()}
                </h2>
                <span className="text-[10px] font-heading font-bold text-gold-400 uppercase tracking-[0.3em] mt-2">Golden Puntos</span>
              </div>
            </div>

            <div className="flex border-b border-white/5">
                <button 
                  onClick={() => setActiveTab('vault')}
                  className={`flex-1 py-4 text-[9px] font-black uppercase tracking-[0.3em] transition-all border-b-2 ${activeTab === 'vault' ? 'border-gold-400 text-white' : 'border-transparent text-gray-600'}`}
                >
                  Movimientos Ledger
                </button>
                <button 
                  onClick={() => setActiveTab('transactions')}
                  className={`flex-1 py-4 text-[9px] font-black uppercase tracking-[0.3em] transition-all border-b-2 ${activeTab === 'transactions' ? 'border-gold-400 text-white' : 'border-transparent text-gray-600'}`}
                >
                  Auditoría Comercial
                </button>
            </div>

            <section className="space-y-4">
              {loading ? (
                <div className="py-24 flex flex-col items-center gap-6">
                  <Loader2 size={32} className="animate-spin text-gold-400" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-700">Consultando Servidor...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'vault' ? (
                    <div className="space-y-2">
                      {vaultHistory.length === 0 ? (
                        <p className="py-20 text-center text-[10px] text-gray-700 uppercase tracking-widest">Sin movimientos en Ledger</p>
                      ) : vaultHistory.map((move, idx) => {
                        const isPositive = Number(move.monto) > 0;
                        return (
                          <div key={idx} className="p-5 bg-white/[0.02] border border-white/5 flex items-center justify-between hover:border-white/10 transition-all active:scale-[0.99]">
                            <div className="flex items-start gap-4">
                               <div className={`p-2.5 rounded-none ${isPositive ? 'bg-green-500/5 text-green-500' : 'bg-red-500/5 text-red-500'} mt-0.5 border border-white/5`}>
                                 {isPositive ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                               </div>
                               <div>
                                 <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-2">{move.concepto || 'Transferencia de Capital'}</p>
                                 <p className="text-[7px] text-gray-600 font-bold uppercase tracking-widest">{new Date(move.created_at).toLocaleDateString()}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className={`text-lg font-mono font-black ${isPositive ? 'text-green-500' : 'text-white'} leading-none mb-1`}>
                                 {isPositive ? '+' : ''}{move.monto.toLocaleString()}
                               </p>
                               <p className="text-[6px] text-gold-400 font-black uppercase tracking-[0.2em]">Golden Puntos</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bizHistory.length === 0 ? (
                        <p className="py-20 text-center text-[10px] text-gray-700 uppercase tracking-widest">Sin actividad comercial</p>
                      ) : bizHistory.map((item) => {
                        const status = getStatusInfo(item.estado_transaccion);
                        return (
                          <div key={item.id} className="p-6 bg-white/[0.01] border border-white/5 hover:bg-white/[0.02] transition-all">
                            <div className="flex justify-between items-start mb-4">
                               <div className="flex items-start gap-4">
                                  <div className="mt-1">{status.icon}</div>
                                  <div>
                                     <p className="text-[7px] font-black text-gold-400 uppercase tracking-widest mb-1">TICKET_NEGOCIO</p>
                                     <h4 className="text-sm font-heading font-black text-white uppercase leading-none mb-2">{item.nombre_negocio || 'ESTABLECIMIENTO'}</h4>
                                     <p className="text-[8px] text-gray-600 font-bold uppercase">{new Date(item.created_at).toLocaleDateString()}</p>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <span className="text-[9px] font-mono text-white/5">#{item.id.substring(0,8).toUpperCase()}</span>
                               </div>
                            </div>
                            <div className="flex justify-between items-end pt-4 border-t border-white/5">
                                <div>
                                    <p className="text-[7px] text-gray-600 font-black uppercase mb-1">Costo Factura</p>
                                    <p className="text-[10px] font-mono text-white/40">RD$ {Number(item.monto_factura_bruto || 0).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] text-gold-400 font-black uppercase mb-1">Ahorro Aplicado</p>
                                    <p className="text-xl font-mono font-black text-white leading-none">RD$ {Math.abs(Number(item.ahorro_socio_neto || 0)).toLocaleString()}</p>
                                </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </section>

            <div className="mt-20 flex flex-col items-center gap-6 opacity-20">
              <ShieldCheck size={16} />
              <span className="text-[7px] font-black uppercase tracking-[0.8em] text-gray-500">Cifrado por Golden Ledger v5.1</span>
            </div>
          </div>
      </div>
    </div>
  );
};