
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Wallet, ArrowDownLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Savings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Real Data
  const savedAmount = user?.projected_savings || 0;

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-500">
       {/* Background */}
       <div className="absolute inset-0 bg-cover bg-center z-0 opacity-10 dark:opacity-20"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2070&auto=format&fit=crop")' }}>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-green-50 dark:from-dark-950 dark:via-dark-900/95 dark:to-black z-0"></div>

      <div className="relative z-10 pb-32">
        <header className="pt-[env(safe-area-inset-top)] px-6 md:px-12 border-b border-white/10 sticky top-0 z-40 bg-black mb-8">
            <div className="max-w-lg mx-auto pb-6 pt-6 flex items-center gap-4">
                <button onClick={() => navigate('/dashboard')} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="font-heading text-2xl font-light text-white">Mis Ahorros</h1>
            </div>
        </header>

        <div className="max-w-lg mx-auto px-6">
          <div className="glass-panel p-8 rounded-[2.5rem] bg-gradient-to-br from-green-500/90 to-emerald-700/90 text-black dark:text-white shadow-xl mb-8 relative overflow-hidden">
             <div className="relative z-10">
                 <p className="text-green-100 text-xs font-bold uppercase tracking-widest mb-1">Total Ahorrado</p>
                 <h2 className="text-5xl font-heading font-bold mb-4">${savedAmount.toFixed(2)}</h2>
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/20 dark:bg-white/20 backdrop-blur-md rounded-full text-xs font-medium">
                     <TrendingUp size={14} /> Histórico Acumulado
                 </div>
             </div>
             <Wallet className="absolute -right-6 -bottom-6 w-40 h-40 text-white/10 rotate-12" />
        </div>

        <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest pl-2 mb-4">Actividad Reciente</h3>
        
        {/* Placeholder for future detailed savings history */}
        <div className="space-y-3">
             <div className="glass-panel p-4 rounded-2xl bg-white/60 dark:bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-black/5 dark:border-white/5 flex items-center justify-between opacity-70">
                 <p className="text-sm text-gray-500">El historial detallado de ahorros estará disponible próximamente.</p>
             </div>
        </div>
      </div>
      </div>
    </div>
  );
};
