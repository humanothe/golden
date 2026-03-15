import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isConfigured } from '../services/supabaseClient';
import { 
    LayoutGrid, TrendingUp, User, LogOut, Store, LucideProps, ShieldCheck, ShoppingBag, Snowflake
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated && (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register')) {
    return <div className="min-h-screen flex flex-col bg-[#050505]">{children}</div>;
  }

  const navItems = [
    { label: 'Bóveda', path: '/dashboard', icon: <LayoutGrid size={20} /> },
    { label: 'Market', path: '/market', icon: <ShoppingBag size={20} /> },
    { label: 'Portafolio', path: '/portfolio', icon: <Snowflake size={20} /> },
    { label: 'Aliados', path: '/partners', icon: <Store size={20} /> },
    { label: 'Perfil', path: '/profile', icon: <User size={20} /> },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isSetupPage = location.pathname === '/onboarding' || location.pathname === '/espera';
  const showNav = isAuthenticated && !isSetupPage;

  return (
    <div className="min-h-screen bg-[#050505] flex text-platinum font-heading transition-colors duration-500 overflow-hidden relative">
      
      {/* ATMÓSFERA DE LUZ ESTÁTICA DESDE ESQUINA */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {/* LUZ BLANCA: Sale exactamente desde la esquina superior izquierda */}
          <div className="absolute top-0 left-0 w-[80vw] h-[50vh] opacity-50"
               style={{ background: 'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.05) 50%, transparent 80%)', filter: 'blur(60px)' }}></div>
          
          {/* LUZ DORADA: Esquina inferior derecha */}
          <div className="absolute bottom-0 right-0 w-[60vw] h-[40vh] opacity-20"
               style={{ background: 'radial-gradient(circle at 100% 100%, rgba(212,175,55,0.2) 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
          
          {/* Fondo base sólido */}
          <div className="absolute inset-0 bg-[#050505]"></div>
      </div>

      {/* SIDEBAR DESKTOP */}
      {showNav && (
        <aside className="hidden lg:flex w-64 flex-col fixed h-full z-40 border-r border-white/5 bg-black/40 backdrop-blur-3xl pt-[env(safe-area-inset-top)]">
            <div className="p-8 flex items-center gap-3">
                <div className="w-12 h-12 border border-gold-400/20 rounded-xl flex items-center justify-center overflow-hidden">
                    <img src="/icon-192.png" className="w-full h-full object-contain p-1" alt="G" />
                </div>
                <div>
                    <h1 className="font-heading text-lg font-bold tracking-widest text-white leading-none">GOLDEN</h1>
                    <p className="text-[8px] text-gray-500 uppercase tracking-[0.4em] mt-1 font-normal">Acceso</p>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2 py-2">
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
                                active 
                                ? 'bg-white/5 text-white' 
                                : 'text-gray-500 hover:text-white'
                            }`}
                        >
                            {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold-400"></div>}
                            <span className={`transition-colors ${active ? 'text-gold-400' : 'group-hover:text-gold-500'}`}>
                                {React.cloneElement(item.icon as React.ReactElement<LucideProps>, { size: 20 })}
                            </span>
                            <span className="text-[10px] font-normal tracking-[0.2em] uppercase">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 m-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md mb-[calc(2rem+env(safe-area-inset-bottom))]">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gold-400/10 flex items-center justify-center text-gold-400 font-bold border border-gold-400/20">
                        <span className="text-[10px]">G</span>
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-[10px] font-bold text-white truncate uppercase tracking-tight">{user?.full_name || 'Usuario'}</p>
                        <div className="flex items-center gap-1">
                             <ShieldCheck size={8} className="text-gold-500" />
                             <p className="text-[8px] text-gold-500 uppercase tracking-wider font-bold truncate">{(user?.membership_tier || 'Free').toUpperCase()}</p>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => { signOut(); navigate('/login'); }}
                    className="w-full py-2 flex items-center justify-center gap-2 text-[8px] font-bold uppercase tracking-[0.3em] text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                    <LogOut size={14} /> Salir
                </button>
            </div>
        </aside>
      )}

      <main className={`flex-grow relative z-10 w-full min-h-screen transition-all duration-300 ${showNav ? 'lg:pl-64 pb-24 lg:pb-0' : ''}`}>
        <div className="relative z-10 w-full h-full max-w-[1920px] mx-auto pt-[env(safe-area-inset-top)]">
            {children}
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      {showNav && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
            <nav className="pointer-events-auto bg-black/60 backdrop-blur-3xl border-t border-white/5 rounded-t-[2.5rem] px-8 py-4 flex items-center justify-between gap-4 w-full pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <Link key={item.path} to={item.path} className="group relative flex flex-col items-center justify-center w-12 h-12">
                            <div className={`relative z-10 transition-all duration-300 ${active ? 'text-gold-400' : 'text-gray-600 group-hover:text-white'}`}>
                                {React.cloneElement(item.icon as React.ReactElement<LucideProps>, { size: 24 })}
                            </div>
                        </Link>
                    )
                })}
            </nav>
        </div>
      )}
    </div>
  );
};