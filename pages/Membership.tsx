
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Check, ArrowLeft, Crown, Sparkles, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Membership: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Helper to get visual colors based on current membership tiers
  const getTierColor = (tier: string) => {
      switch(tier) {
          case 'elite': return 'from-gold-300 via-gold-500 to-gold-600';
          case 'plus': return 'from-gray-300 via-gray-400 to-gray-500';
          case 'entry': return 'from-orange-400 via-orange-500 to-orange-600';
          default: return 'from-gray-800 to-black';
      }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-obsidian text-gray-900 dark:text-platinum pb-32 animate-fade-in">
       <header className="pt-[env(safe-area-inset-top)] px-6 md:px-12 border-b border-white/10 sticky top-0 z-40 bg-black mb-8">
          <div className="max-w-5xl mx-auto pb-6 pt-6 flex items-center gap-4">
              <button onClick={() => navigate('/profile')} className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
                  <ArrowLeft size={20} />
              </button>
              <div>
                  <p className="text-[10px] text-gold-400 font-bold uppercase tracking-widest mb-0.5">Identidad Golden</p>
                  <h1 className="font-heading text-xl text-white">Mi Credencial de Socio</h1>
              </div>
          </div>
      </header>

      <div className="p-6 max-w-2xl mx-auto">
          {/* THE CARD */}
          <div className="relative group mx-auto w-full max-w-[420px]">
              <div className={`absolute -inset-1 bg-gradient-to-r ${getTierColor(user?.membership_tier || 'free')} rounded-[2rem] blur opacity-25`}></div>
              <div className="relative aspect-[1.586] w-full bg-gradient-to-br from-[#1a1a1a] via-black to-[#050505] rounded-[1.5rem] border border-black/10 dark:border-white/10 overflow-hidden shadow-2xl flex flex-col justify-between p-6">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start relative z-10">
                      <div className="flex flex-col">
                          <Shield size={32} className="text-gold-400 mb-1" strokeWidth={1} />
                          <span className="text-[7px] text-gold-400/50 uppercase tracking-[0.4em]">Club Privado</span>
                      </div>
                      <div className="text-right">
                          <span className={`text-[9px] uppercase tracking-[0.2em] font-bold bg-clip-text text-transparent bg-gradient-to-r ${getTierColor(user?.membership_tier || 'free')}`}>
                              Tier {user?.membership_tier}
                          </span>
                          <div className="flex items-center gap-1 justify-end mt-1">
                              <Star size={10} className="text-gold-400" />
                              <span className="text-[8px] text-black/50 dark:text-white/50 uppercase font-bold tracking-widest">Active Member</span>
                          </div>
                      </div>
                  </div>

                  <div className="relative z-10">
                      <p className="font-mono text-white/80 text-lg tracking-[0.2em] mb-3 truncate">
                          0000 1234 5678 {user?.id?.substring(0,4) || '9000'}
                      </p>
                      <div className="flex justify-between items-end">
                          <div>
                              <p className="text-[10px] text-gold-400 uppercase tracking-widest font-bold">{user?.full_name || 'MIEMBRO SOCIO'}</p>
                              <p className="text-[7px] text-black/30 dark:text-white/30 uppercase tracking-[0.2em] mt-0.5">EST. OCT 2024</p>
                          </div>
                          <div className="w-10 h-10 border border-gold-400/30 rounded-lg flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-sm">
                              <span className="font-heading text-xs text-gold-400 font-bold">G</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* Benefits Grid based on Logic */}
          <div className="mt-12 space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pl-2 mb-4">Privilegios del Nivel</h3>
              <div className="grid grid-cols-1 gap-3">
                  {/* Corrected: Comparison for 'entry' level (formerly bronze) */}
                  {user?.membership_tier === 'entry' && (
                    <div className="p-5 rounded-2xl bg-white dark:bg-black/5 dark:bg-white/5 border border-gray-100 dark:border-black/5 dark:border-white/5 flex items-center gap-4">
                        <Check className="text-gold-500" size={16} />
                        <span className="text-xs font-semibold uppercase tracking-wide">3 Descuentos Fijos al Mes</span>
                    </div>
                  )}
                  {/* Corrected: Comparison for 'plus' level (formerly silver) */}
                  {user?.membership_tier === 'plus' && (
                    <div className="p-5 rounded-2xl bg-white dark:bg-black/5 dark:bg-white/5 border border-gray-100 dark:border-black/5 dark:border-white/5 flex items-center gap-4">
                        <Check className="text-gold-500" size={16} />
                        <span className="text-xs font-semibold uppercase tracking-wide">1 Descuento en cada Negocio Afiliado al mes</span>
                    </div>
                  )}
                  {/* Corrected: Comparison for 'elite' level (formerly gold) */}
                  {user?.membership_tier === 'elite' && (
                    <>
                        <div className="p-5 rounded-2xl bg-gold-400/10 border border-gold-400/30 flex items-center gap-4">
                            <Crown className="text-gold-500" size={16} />
                            <span className="text-xs font-bold uppercase tracking-wide">Descuentos Ilimitados en toda la Red</span>
                        </div>
                        <div className="p-5 rounded-2xl bg-white dark:bg-black/5 dark:bg-white/5 border border-gray-100 dark:border-black/5 dark:border-white/5 flex items-center gap-4">
                            <Sparkles className="text-gold-500" size={16} />
                            <span className="text-xs font-semibold uppercase tracking-wide">3 Productos Básicos Congelados Incluidos</span>
                        </div>
                    </>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};
