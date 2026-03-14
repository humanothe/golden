import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Briefcase, Wallet, User } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-black pb-24">
      <main>{children}</main>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 px-6 py-4 z-50">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'text-gold-400' : 'text-white/40'}>
            <LayoutDashboard size={24} />
          </NavLink>
          <NavLink to="/market" className={({ isActive }) => isActive ? 'text-gold-400' : 'text-white/40'}>
            <ShoppingBag size={24} />
          </NavLink>
          <NavLink to="/" className={({ isActive }) => isActive ? 'text-gold-400' : 'text-white/40'}>
            <Briefcase size={24} />
          </NavLink>
          <NavLink to="/wallet" className={({ isActive }) => isActive ? 'text-gold-400' : 'text-white/40'}>
            <Wallet size={24} />
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'text-gold-400' : 'text-white/40'}>
            <User size={24} />
          </NavLink>
        </div>
      </nav>
    </div>
  );
};
