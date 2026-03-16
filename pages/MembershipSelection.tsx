import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { 
  Loader2, AlertCircle, Crown, ShieldCheck, 
  RefreshCw, ArrowLeft, Shield, Check, Wallet, Zap, Star, ShieldAlert
} from 'lucide-react';
import { MEMBERSHIP_PLANS } from '../constants/plans';

export const MembershipSelection: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [realVaultBalance, setRealVaultBalance] = useState(0);

  const [activeStep, setActiveStep] = useState<'selection' | 'confirm'>('selection');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'insufficient', msg: string } | null>(null);

  useEffect(() => {
    if (activeStep === 'confirm') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [activeStep]);

  const syncData = useCallback(async () => {
    if (!user?.email) return;
    try {
      setFetching(true);
      const userEmail = user.email.toLowerCase().trim();
      
      const [plansRes, profRes, balanceRes] = await Promise.all([
        supabase.from('membership_plans').select('id, name, price_monthly, benefits, limite').order('price_monthly', { ascending: true }),
        supabase.from('perfiles')
          .select('id, membership_tier, membership_start_date, membership_expiry_date')
          .eq('id', user?.id)
          .single(),
        supabase.from('mi_saldo')
          .select('monto')
          .eq('socio_email', userEmail)
          .neq('socio_email', 'golden@gmail.com')
      ]);

      const mergedPlans = (plansRes.data || []).map(dbPlan => {
        const def = MEMBERSHIP_PLANS.find(p => p.name.toLowerCase() === dbPlan.name.toLowerCase());
        return {
          ...dbPlan,
          description: def?.description || '',
          benefits: def?.benefits || dbPlan.benefits,
          possibilities: def?.possibilities || [],
          limit: def?.limit || dbPlan.limite
        };
      });

      setPlans(mergedPlans);
      setProfileData(profRes.data);
      
      const total = balanceRes.data?.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0) || 0;
      setRealVaultBalance(total);

    } catch (err: any) {
      setFeedback({ type: 'error', msg: "CONEXIÓN PERDIDA" });
    } finally {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id && user.id !== 'guest') syncData();
  }, [syncData, user]);

  const currentTierLimit = useMemo(() => {
    if (!profileData?.membership_tier) return '---';
    const planMatch = MEMBERSHIP_PLANS.find(p => p.name.toLowerCase() === profileData.membership_tier.toLowerCase());
    return planMatch?.limit || '1';
  }, [profileData]);

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    setFeedback(null);
    setActiveStep('confirm'); 
  };

  const processPaymentGP = async () => {
    if (!user || !selectedPlan || !user.email) return;
    
    // VALIDACIÓN DE SEGURIDAD CRÍTICA (FRONTEND)
    if (realVaultBalance < selectedPlan.price_monthly) {
      setFeedback({ type: 'error', msg: "SALDO INSUFICIENTE EN BÓVEDA" });
      return;
    }

    setLoading(true);
    setFeedback(null);
    
    try {
      const { error: rpcError } = await supabase.rpc('procesar_pago_membresia', {
          p_plan_id: selectedPlan.id,
          p_socio_id: user.id
      });

      if (rpcError) throw rpcError;

      setFeedback({ type: 'success', msg: `NIVEL ${selectedPlan.name.toUpperCase()} ACTIVADO` });
      await refreshProfile();
      
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      setTimeout(() => navigate('/dashboard'), 2000);
      
    } catch (err: any) {
      console.error("RPC_MEMBERSHIP_REJECTED:", err);
      let msg = err.message || "PROTOCOL_SYNC_REJECTED";
      if (msg.toLowerCase().includes('insufficient') || msg.toLowerCase().includes('saldo')) {
        msg = "SALDO INSUFICIENTE EN BÓVEDA";
      }
      setFeedback({ type: 'error', msg: msg.toUpperCase() });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  };

  if (fetching) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.6em] text-gold-400">SINCRONIZANDO...</p>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-obsidian text-white p-6 md:p-12 pb-40 animate-fade-in font-sans text-left overflow-x-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none z-0"></div>
        
        <header className="max-w-4xl mx-auto flex items-center justify-between mb-12 border-b border-white/5 pb-8 relative z-10">
            <div className="flex items-center gap-5">
              <button onClick={() => navigate('/profile')} className="p-3 bg-white/5 border border-white/10 hover:bg-white hover:text-black transition-all active:scale-90 rounded-xl">
                  <ArrowLeft size={20} />
              </button>
              <div>
                <p className="text-[8px] text-gold-400 font-black uppercase tracking-[0.4em] mb-1">MI ESTADO</p>
                <h1 className="text-xl md:text-2xl font-heading font-bold text-white uppercase tracking-tighter">Mi <span className="text-gold-metallic">Membresía</span></h1>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest mb-1">SALDO DISPONIBLE</p>
              <p className="text-lg font-mono font-black text-gold-400">{realVaultBalance.toLocaleString()} <span className="text-[10px]">GP</span></p>
            </div>
        </header>

        <div className="max-w-4xl mx-auto relative z-10">
          {(profileData?.membership_tier || 'free').toLowerCase() !== 'free' ? (
            <div className="space-y-8 animate-enter-screen">
              <div className="bg-[#0A0A0A] border border-white/10 p-8 md:p-12 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-[0.03]"><Crown size={120} strokeWidth={1} /></div>
                 <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
                    <div className="space-y-6">
                        <div>
                          <p className="text-[9px] text-gold-400 font-black uppercase tracking-[0.5em] mb-3">PLAN ACTIVO</p>
                          <h2 className="text-4xl md:text-6xl font-heading font-black text-white uppercase tracking-tighter leading-none">NIVEL <br/><span className="text-gold-metallic">{profileData.membership_tier.toUpperCase()}</span></h2>
                        </div>
                        <div className="text-[10px] font-mono text-white/30 uppercase flex items-center gap-2"><div className="w-1 h-1 bg-gold-400"></div> Límite Diario: {currentTierLimit} Usos</div>
                    </div>
                    <div className="px-4 py-1.5 bg-green-500/10 border border-green-500/20 text-[8px] text-green-500 font-black uppercase tracking-[0.3em] h-fit">SUSCRIPCIÓN ACTIVA</div>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-white/[0.02] border border-white/5">
                  <p className="text-[8px] font-black uppercase text-gray-700 mb-3 italic">ADQUIRIDO</p>
                  <p className="text-sm font-bold text-white font-mono">{formatDate(profileData.membership_start_date)}</p>
                </div>
                <div className="p-6 bg-white/[0.02] border border-white/5">
                  <p className="text-[8px] font-black uppercase text-gray-700 mb-3 italic">PRÓXIMO COBRO</p>
                  <p className="text-sm font-bold text-gold-400 font-mono">{formatDate(profileData.membership_expiry_date)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-enter-screen">
              {plans.map((plan) => (
                <div key={plan.id} className="group relative flex flex-col bg-[#0A0A0A] border border-white/5 hover:border-gold-400/40 transition-all duration-500 overflow-hidden">
                  {/* Background Accents */}
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                    {plan.name === 'Bronce' && <Shield size={120} />}
                    {plan.name === 'Plata' && <Zap size={120} />}
                    {plan.name === 'Oro' && <Crown size={120} />}
                  </div>

                  <div className="p-8 md:p-10 flex-1 flex flex-col">
                    <div className="mb-8">
                      <p className="text-[8px] text-gold-400 font-black uppercase tracking-[0.5em] mb-3">NIVEL_SISTEMA</p>
                      <h3 className="text-3xl font-heading font-black uppercase text-white tracking-tighter mb-2">{plan.name}</h3>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed min-h-[40px]">
                        {plan.description}
                      </p>
                    </div>

                    <div className="flex items-baseline gap-2 mb-10 border-y border-white/5 py-6">
                      <span className="text-5xl font-heading font-black text-white tracking-tighter">{plan.price_monthly}</span>
                      <span className="text-[10px] text-gray-600 font-black tracking-widest uppercase">GP / MES</span>
                    </div>

                    <div className="space-y-8 mb-12 flex-1">
                      <div className="space-y-4">
                        <p className="text-[7px] text-gold-400 font-black uppercase tracking-widest">BENEFICIOS_EXCLUSIVOS</p>
                        {plan.benefits.map((b, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <Check size={12} className="text-gold-400 mt-0.5 shrink-0" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/70 leading-tight">{b}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <p className="text-[7px] text-blue-400 font-black uppercase tracking-widest">POSIBILIDADES_ADICIONALES</p>
                        {plan.possibilities.map((p, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <Star size={10} className="text-blue-400 mt-0.5 shrink-0" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/50 leading-tight italic">{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => handleSelectPlan(plan)} 
                      className="w-full py-6 bg-white text-black font-black uppercase text-[11px] tracking-[0.4em] hover:bg-gold-400 transition-all active:scale-[0.98] shadow-2xl"
                    >
                      ADQUIRIR_MEMBRESÍA
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeStep === 'confirm' && selectedPlan && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in overflow-hidden">
           {/* ATMÓSFERA LUMÍNICA DENTRO DEL MODAL */}
           <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 left-0 w-[100%] h-[100%] opacity-30"
                   style={{ background: 'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.4) 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
              <div className="absolute bottom-0 right-0 w-[100%] h-[100%] opacity-20"
                   style={{ background: 'radial-gradient(circle at 100% 100%, rgba(212,175,55,0.3) 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
           </div>

           <div className="max-w-xs w-full bg-black/60 backdrop-blur-3xl border border-white/10 p-6 shadow-[0_0_100px_rgba(0,0,0,0.8)] text-left relative flex flex-col max-h-[90vh] rounded-none">
              <div className="relative z-10">
                  <div className="mb-6">
                    <p className="text-[7px] font-black text-gold-400 uppercase tracking-[0.5em] mb-1">ORDEN DE PAGO</p>
                    <h3 className="text-xl font-heading font-black uppercase tracking-tighter text-white leading-none">Confirmar Compra</h3>
                  </div>

                  <div className="space-y-2 mb-8">
                    <div className="p-4 bg-white/[0.03] border border-white/5 space-y-3 rounded-none">
                        <div className="flex justify-between items-center">
                            <p className="text-[7px] text-gray-600 font-black uppercase tracking-[0.2em]">Nivel Elegido</p>
                            <p className="text-[9px] font-black text-white uppercase">{selectedPlan.name}</p>
                        </div>
                        <div className="h-[1px] bg-white/5 w-full"></div>
                        <div className="flex justify-between items-center">
                            <p className="text-[7px] text-gray-600 font-black uppercase tracking-[0.2em]">Costo Mensual</p>
                            <p className="text-2xl font-mono font-black text-gold-400 tracking-tighter">-{selectedPlan.price_monthly} <span className="text-[8px]">GP</span></p>
                        </div>
                        <div className="h-[1px] bg-white/5 w-full"></div>
                        <div className="flex justify-between items-center">
                            <p className="text-[7px] text-gray-600 font-black uppercase tracking-[0.2em]">Saldo Final</p>
                            <p className="text-[9px] font-mono font-bold text-white/40">{(realVaultBalance - selectedPlan.price_monthly).toLocaleString()} GP</p>
                        </div>
                    </div>
                    <p className="text-[6px] text-gray-700 uppercase font-black tracking-widest text-center">Validado por Protocolo Golden Ledger v8.5</p>
                  </div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-3 shrink-0 relative z-10">
                {feedback ? (
                  <>
                    <div className={`p-4 border animate-shake text-center rounded-none ${feedback.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                      <p className="text-[8px] font-black uppercase tracking-widest leading-tight">{feedback.msg}</p>
                    </div>
                    {feedback.type !== 'success' && (
                       <button 
                         onClick={() => navigate('/wallet')} 
                         className="w-full py-4 bg-white text-black font-black uppercase text-[10px] tracking-[0.3em] transition-all flex items-center justify-center gap-4 active:scale-95 shadow-2xl rounded-none"
                       >
                         RECARGAR SALDO
                       </button>
                    )}
                  </>
                ) : (
                  <button 
                    onClick={processPaymentGP} 
                    disabled={loading}
                    className="w-full py-5 bg-gold-400 text-black font-black uppercase text-[10px] tracking-[0.3em] transition-all flex items-center justify-center gap-4 active:scale-95 shadow-2xl rounded-none hover:bg-white"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <><ShieldCheck size={16}/> PAGAR Y ACTIVAR</>}
                  </button>
                )}
                
                <button onClick={() => { setActiveStep('selection'); setFeedback(null); }} disabled={loading} className="w-full py-2 text-gray-700 uppercase text-[7px] font-black tracking-[0.3em] hover:text-white transition-colors">
                  CANCELAR OPERACIÓN
                </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};