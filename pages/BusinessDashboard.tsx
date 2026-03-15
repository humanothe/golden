
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { 
  Users, Package, Settings, PlusCircle, Smartphone, 
  RefreshCw, Store, CreditCard, ChevronRight 
} from 'lucide-react';
import { Business, Order } from '../types';

export const BusinessDashboard: React.FC = () => {
  const { user } = useAuth();
  const [business, setBusiness] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBizData = async () => {
    if (!user) return;
    setLoading(true);
    const myBiz = await api.data.getMyBusiness(user.id);
    setBusiness(myBiz);
    if (myBiz) {
        const myOrders = await api.data.getBusinessOrders(myBiz.id);
        setOrders(myOrders);
    }
    setLoading(false);
  };

  useEffect(() => { loadBizData(); }, [user]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-10 h-10 border-2 border-gold-400 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 lg:p-12 pb-32 font-sans animate-fade-in">
      
      <header className="flex justify-between items-end mb-12 border-b border-white/5 pb-8">
        <div>
          <p className="text-gold-500 text-[9px] font-black uppercase tracking-[0.6em] mb-4">Golden Partner Platform</p>
          <h1 className="text-4xl md:text-6xl font-heading font-bold uppercase tracking-tighter leading-none">
            {business?.name || 'MI NEGOCIO'}
          </h1>
        </div>
        <button onClick={loadBizData} className="p-4 bg-white/5 rounded-full hover:rotate-180 transition-all text-gold-400 border border-white/5 shadow-xl">
          <RefreshCw size={24} />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* ACCION CLAVE: OPERADORES */}
        <div className="glass-panel p-10 rounded-[2.5rem] bg-gold-400 text-black shadow-2xl group cursor-pointer hover:scale-[1.02] transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-black/5 blur-[40px] rounded-full -mr-12 -mt-12"></div>
          <div className="flex justify-between items-start mb-10">
            <div className="bg-black/10 p-4 rounded-2xl"><Users size={32} /></div>
            <ChevronRight size={24} />
          </div>
          <h3 className="text-2xl font-heading font-bold uppercase mb-2">Operadores</h3>
          <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Gestionar empleados y cajas</p>
        </div>

        <div className="glass-panel p-10 rounded-[2.5rem] bg-white/5 border border-white/10 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Pedidos Recibidos</p>
            <h3 className="text-5xl font-heading font-bold text-white">{orders.length}</h3>
          </div>
          <button className="w-full py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest mt-8 hover:bg-white hover:text-black transition-all">Ver Historial</button>
        </div>

        <div className="glass-panel p-10 rounded-[2.5rem] bg-white/5 border border-white/10 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Catálogo Activo</p>
            <h3 className="text-5xl font-heading font-bold text-white">8</h3>
          </div>
          <button className="w-full py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest mt-8 flex items-center justify-center gap-2">
            <PlusCircle size={14} /> Gestionar Menú
          </button>
        </div>
      </div>

      <div className="p-10 rounded-[3rem] bg-white/5 border border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-400/5 to-transparent"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-20 h-20 bg-gold-400/10 rounded-full flex items-center justify-center text-gold-400 border border-gold-400/30">
            <Smartphone size={32} />
          </div>
          <div className="max-w-xl">
            <h4 className="text-xl font-heading font-bold uppercase mb-2">Modo Operador</h4>
            <p className="text-gray-500 text-sm font-light leading-relaxed">
              Crea cuentas de operador para que tus empleados puedan escanear el QR de los socios y validar privilegios sin acceder a tus configuraciones de dueño.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
