import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, ShoppingBag, Snowflake, Store, User } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-black pb-32">
      <main>{children}</main>
      
      <nav className="fixed bottom-8 left-6 right-6 bg-[#0A0A0A]/90 backdrop-blur-3xl border border-white/5 px-10 py-6 z-50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] max-w-lg mx-auto">
        <div className="flex justify-between items-center">
          <NavLink to="/dashboard">
            {({ isActive }) => (
              <LayoutGrid size={28} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-gold-500 scale-110' : 'text-white/20 hover:text-white/40' + ' transition-all duration-500'} />
            )}
          </NavLink>
          <NavLink to="/market">
            {({ isActive }) => (
              <ShoppingBag size={28} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-gold-500 scale-110' : 'text-white/20 hover:text-white/40' + ' transition-all duration-500'} />
            )}
          </NavLink>
          <NavLink to="/assets">
            {({ isActive }) => (
              <Snowflake size={28} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-gold-500 scale-110' : 'text-white/20 hover:text-white/40' + ' transition-all duration-500'} />
            )}
          </NavLink>
          <NavLink to="/business">
            {({ isActive }) => (
              <Store size={28} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-gold-500 scale-110' : 'text-white/20 hover:text-white/40' + ' transition-all duration-500'} />
            )}
          </NavLink>
          <NavLink to="/profile">
            {({ isActive }) => (
              <User size={28} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-gold-500 scale-110' : 'text-white/20 hover:text-white/40' + ' transition-all duration-500'} />
            )}
          </NavLink>
        </div>
      </nav>
    </div>
  );
};
