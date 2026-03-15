import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { TrendingUp, Shield, Zap, ArrowUpRight } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="p-6 space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-400 font-bold">Bienvenido, Socio</p>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Golden <span className="text-white/40">Acceso</span></h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-gold-400 flex items-center justify-center text-black font-black text-xs">
            JD
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-4 rounded-2xl space-y-2">
            <TrendingUp size={20} className="text-gold-400" />
            <p className="text-[10px] uppercase text-white/40 font-bold">Rendimiento</p>
            <p className="text-xl font-black">+12.4%</p>
          </div>
          <div className="glass-card p-4 rounded-2xl space-y-2">
            <Shield size={20} className="text-gold-400" />
            <p className="text-[10px] uppercase text-white/40 font-bold">Seguridad</p>
            <p className="text-xl font-black">NIVEL 4</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap size={120} />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-gold-400 mb-2">Membresía Elite</h3>
          <p className="text-2xl font-black tracking-tighter mb-4">ACCESO A ACTIVOS<br/>EXCLUSIVOS</p>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white text-black px-4 py-2 rounded-full">
              Ver Beneficios <ArrowUpRight size={14} />
            </button>
            <button 
              onClick={() => navigate('/scanner')}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-gold-400 text-black px-4 py-2 rounded-full"
            >
              Escanear Tarjeta
            </button>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-white/40">Actividad Reciente</h2>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                  <Zap size={14} className="text-gold-400" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-tight">Dividendo Recibido</p>
                  <p className="text-[10px] text-white/40 uppercase">Activo #4429</p>
                </div>
              </div>
              <p className="text-sm font-black text-gold-400">+$420.00</p>
            </div>
          ))}
        </section>
      </div>
    </Layout>
  );
};
