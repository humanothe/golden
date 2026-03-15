
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Check, Package, Truck, Home, ShoppingBag, ArrowRight, Share2, Copy, Loader2, Clock } from 'lucide-react';
import { api } from '../services/api';
import { Order, OrderStatus } from '../types';

export const OrderTracking: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
      if (!user) return;
      // Get all orders, pick first (latest)
      const orders = await api.data.getOrders(user.id);
      if (orders.length > 0) {
          setLatestOrder(orders[0]);
      }
      setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
    // Poll for status updates every 5 seconds
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Status mapping to steps
  const getStep = (status: OrderStatus) => {
      switch(status) {
          case 'pending': return 1;
          case 'processing': return 2;
          case 'ready': return 2; // Still preparing technically or waiting for driver
          case 'picked_up': return 3;
          case 'delivered': return 4;
          default: return 1;
      }
  };

  const steps = [
    { id: 1, label: 'Confirmado', icon: <Check size={16} />, desc: 'Orden recibida' },
    { id: 2, label: 'Preparando', icon: <Package size={16} />, desc: 'Empacando tu pedido' },
    { id: 3, label: 'En Camino', icon: <Truck size={16} />, desc: 'Repartidor en ruta' },
    { id: 4, label: 'Entregado', icon: <Home size={16} />, desc: 'Disfruta tu compra' },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-gold-400" /></div>;

  if (!latestOrder) return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
          <Package size={48} className="text-gray-600 mb-4" />
          <p>No tienes pedidos activos.</p>
          <button onClick={() => navigate('/market')} className="mt-4 text-gold-400 font-bold underline">Ir a comprar</button>
      </div>
  );

  const currentStep = getStep(latestOrder.status);

  return (
    <div className="min-h-screen bg-light-50 dark:bg-black text-black dark:text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        {/* Background Atmosphere */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-gold-400/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Main Card Container */}
        <div className="relative z-10 w-full max-w-md animate-fade-in">
            
            <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-white/20 dark:border-white/10 shadow-2xl relative">
                
                {/* Decorative Top Bar */}
                <div className="h-2 w-full bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300"></div>

                <div className="p-8 md:p-10">
                    
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="relative inline-block mb-4">
                            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"></div>
                            <div className="relative w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg mx-auto transform transition-transform hover:scale-110 duration-500">
                                {currentStep === 4 ? <Check size={32} className="text-white" strokeWidth={4} /> : <Clock size={32} className="text-white animate-pulse" />}
                            </div>
                        </div>
                        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
                            {latestOrder.status === 'delivered' ? '¡Pedido Entregado!' : 'Seguimiento'}
                        </h1>
                        <div className="flex items-center justify-center gap-2 text-gold-600 dark:text-gold-400 font-mono text-sm bg-gold-400/10 rounded-full py-1 px-4 w-fit mx-auto mt-2 border border-gold-400/20">
                            <span className="font-bold">#{latestOrder.id.substring(0,8)}</span>
                            <Copy size={12} className="cursor-pointer hover:text-white transition-colors" />
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="relative pl-4 space-y-0 mb-10">
                        {/* Continuous Vertical Line */}
                        <div className="absolute left-[27px] top-4 bottom-8 w-[2px] bg-gray-100 dark:bg-white/5 rounded-full"></div>
                        
                        {/* Active Progress Fill Line */}
                        <div 
                            className="absolute left-[27px] top-4 w-[2px] bg-gold-400 shadow-[0_0_10px_#D4AF37] z-0 transition-all duration-1000 ease-out rounded-full"
                            style={{ height: `${Math.min((currentStep - 1) * 33, 100)}%` }}
                        ></div>

                        {steps.map((s, index) => {
                            const isActive = currentStep === s.id;
                            const isCompleted = currentStep > s.id;
                            const isPending = currentStep < s.id;

                            return (
                                <div key={s.id} className="relative z-10 flex items-start gap-5 mb-8 last:mb-0 group min-h-[48px]">
                                    
                                    {/* Icon Indicator */}
                                    <div className={`
                                        w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0 border
                                        ${isActive 
                                            ? 'bg-black dark:bg-white text-white dark:text-black border-gold-400 shadow-[0_0_20px_rgba(212,175,55,0.3)] scale-110' 
                                            : isCompleted 
                                                ? 'bg-gold-400 text-black border-gold-400'
                                                : 'bg-gray-50 dark:bg-white/5 text-gray-300 dark:text-gray-600 border-gray-100 dark:border-white/5'
                                        }
                                    `}>
                                        {isCompleted ? <Check size={20} strokeWidth={3} /> : s.icon}
                                    </div>

                                    {/* Text Content */}
                                    <div className={`pt-2 transition-all duration-500 ${isPending ? 'opacity-30' : 'opacity-100'}`}>
                                        <h3 className={`font-bold uppercase tracking-widest text-xs mb-0.5 ${isActive ? 'text-gold-600 dark:text-gold-400' : 'text-gray-900 dark:text-white'}`}>
                                            {s.label}
                                        </h3>
                                        <p className="text-xs text-gray-500 font-medium">{s.desc}</p>
                                    </div>

                                </div>
                            );
                        })}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-dashed border-gray-300 dark:border-white/10 my-8 w-full relative">
                         <div className="absolute -left-12 -top-3 w-6 h-6 bg-light-50 dark:bg-black rounded-full"></div>
                         <div className="absolute -right-12 -top-3 w-6 h-6 bg-light-50 dark:bg-black rounded-full"></div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-4">
                        <button 
                            onClick={() => navigate('/market')}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-gold-300 to-gold-500 hover:from-gold-400 hover:to-gold-600 text-black font-bold uppercase tracking-[0.2em] text-xs shadow-lg hover:shadow-[0_5px_20px_rgba(212,175,55,0.4)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <ShoppingBag size={16} /> Seguir Comprando
                        </button>
                        
                        <div className="flex gap-4">
                            <button 
                                onClick={() => navigate('/dashboard')}
                                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 hover:text-black dark:hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors"
                            >
                                Inicio
                            </button>
                             <button className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 hover:text-black dark:hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                                <Share2 size={14} /> Compartir
                            </button>
                        </div>
                    </div>

                </div>
            </div>
            
            {/* Footer Text */}
            <p className="text-center text-[10px] text-gray-400 mt-6 uppercase tracking-widest opacity-60">
                {latestOrder.status === 'picked_up' ? 'Tu pedido está muy cerca' : 'Actualización en tiempo real'}
            </p>

        </div>
    </div>
  );
};
