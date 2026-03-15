
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Points: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Real Math
  const currentPoints = user?.points_balance || 0;
  const nextTier = 2500;
  const percentage = Math.min((currentPoints / nextTier) * 100, 100);

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-500">
       {/* Background */}
       <div className="absolute inset-0 bg-cover bg-center z-0 opacity-10 dark:opacity-20"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop")' }}>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-purple-50 dark:from-dark-950 dark:via-dark-900/95 dark:to-black z-0"></div>

      <div className="relative z-10 pb-32">
        <header className="pt-[env(safe-area-inset-top)] px-6 md:px-12 border-b border-white/10 sticky top-0 z-40 bg-black mb-8">
            <div className="max-w-2xl mx-auto pb-6 pt-6 flex items-center gap-4">
                <button onClick={() => navigate('/dashboard')} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="font-heading text-2xl font-light text-white">Golden Puntos</h1>
            </div>
        </header>

        <div className="max-w-2xl mx-auto px-6">
          {/* Circular Progress */}
        <div className="flex justify-center mb-10">
            <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Background Circle */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200 dark:text-white/5" />
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={552} strokeDashoffset={552 - (552 * percentage) / 100} className="text-purple-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
                </svg>
                <div className="text-center">
                    <span className="block text-4xl font-heading font-bold text-gray-900 dark:text-black dark:text-white">{Math.round(currentPoints)}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-widest">Puntos</span>
                </div>
            </div>
        </div>

        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-12">
            Te faltan <span className="font-bold text-purple-500">{Math.max(0, nextTier - currentPoints)} puntos</span> para el Nivel Platino.
        </p>

        <h2 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest pl-2 mb-4">Recompensas Disponibles</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`glass-panel p-5 rounded-3xl bg-white/60 dark:bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-black/5 dark:border-white/5 flex gap-4 items-center ${currentPoints < 1000 ? 'opacity-60 grayscale' : ''}`}>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <Gift size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-black dark:text-white text-sm">Cupón $10 OFF</h4>
                    <p className="text-xs text-gold-500 font-bold mt-1">1000 Puntos</p>
                </div>
                {currentPoints >= 1000 ? (
                    <button className="ml-auto px-4 py-2 bg-gray-900 dark:bg-black dark:bg-white text-white dark:text-black dark:text-white dark:text-black text-[10px] font-bold uppercase rounded-full tracking-wider">Canjear</button>
                ) : (
                    <div className="ml-auto"><Lock size={16} className="text-gray-400" /></div>
                )}
            </div>

            {/* Locked Reward */}
            <div className={`glass-panel p-5 rounded-3xl bg-white/40 dark:bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-black/5 dark:border-white/5 flex gap-4 items-center ${currentPoints < 5000 ? 'opacity-60 grayscale' : ''}`}>
                <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-black/10 dark:bg-white/10 flex items-center justify-center text-gray-400">
                    <Lock size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-black dark:text-white text-sm">Cena VIP (2 pers)</h4>
                    <p className="text-xs text-gray-500 font-bold mt-1">5000 Puntos</p>
                </div>
            </div>
        </div>
      </div>
      </div>
    </div>
  );
};
