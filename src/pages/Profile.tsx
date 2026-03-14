import React from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { LogOut, User, Shield, CreditCard, Settings } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Layout>
      <div className="p-6 space-y-8">
        <header className="text-center py-8">
          <div className="w-24 h-24 rounded-full bg-gold-400 mx-auto mb-4 flex items-center justify-center text-black font-black text-3xl">
            {user?.email?.substring(0, 2).toUpperCase()}
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">{user?.email}</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold-400 font-bold mt-2">Socio Verificado</p>
        </header>

        <div className="space-y-4">
          <button className="w-full glass-card p-6 rounded-2xl flex items-center justify-between group hover:border-gold-400/50 transition-all">
            <div className="flex items-center gap-4">
              <User size={20} className="text-gold-400" />
              <p className="text-xs font-black uppercase tracking-widest">Datos Personales</p>
            </div>
          </button>
          
          <button className="w-full glass-card p-6 rounded-2xl flex items-center justify-between group hover:border-gold-400/50 transition-all">
            <div className="flex items-center gap-4">
              <Shield size={20} className="text-gold-400" />
              <p className="text-xs font-black uppercase tracking-widest">Seguridad Patrimonial</p>
            </div>
          </button>

          <button className="w-full glass-card p-6 rounded-2xl flex items-center justify-between group hover:border-gold-400/50 transition-all">
            <div className="flex items-center gap-4">
              <CreditCard size={20} className="text-gold-400" />
              <p className="text-xs font-black uppercase tracking-widest">Métodos de Pago</p>
            </div>
          </button>

          <button className="w-full glass-card p-6 rounded-2xl flex items-center justify-between group hover:border-gold-400/50 transition-all">
            <div className="flex items-center gap-4">
              <Settings size={20} className="text-gold-400" />
              <p className="text-xs font-black uppercase tracking-widest">Configuración</p>
            </div>
          </button>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-2xl flex items-center justify-center gap-4 font-black uppercase tracking-widest text-xs hover:bg-red-500 hover:text-white transition-all"
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </Layout>
  );
};
