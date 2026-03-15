
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Truck, MapPin, Navigation, Phone, CheckSquare, Power, Clock, RefreshCw, Loader2, Package } from 'lucide-react';
import { api } from '../services/api';
import { Order } from '../types';

export const DeliveryDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'pool' | 'active'>('active');

  const fetchDeliveryData = async () => {
      if (!user) return;
      setLoading(true);
      
      // 1. Check if I have an active order
      const myOrders = await api.data.getDriverActiveOrders(user.id);
      if (myOrders.length > 0) {
          setActiveOrder(myOrders[0]); // Focus on the first active one
          setTab('active');
      } else {
          setActiveOrder(null);
          // 2. If no active order, check pool
          if (isOnline) {
             // Fix: Pass the current user.id as required by the api.data.getDeliveryPool definition
             const pool = await api.data.getDeliveryPool(user.id);
             setAvailableOrders(pool);
          }
      }
      setLoading(false);
  };

  useEffect(() => {
      fetchDeliveryData();
      const interval = setInterval(fetchDeliveryData, 10000); // Poll every 10s
      return () => clearInterval(interval);
  }, [user, isOnline]);

  const handleClaimOrder = async (orderId: string) => {
      if (!user) return;
      setLoading(true);
      const success = await api.data.claimOrder(orderId, user.id);
      if (success) {
          fetchDeliveryData();
      } else {
          alert("Este pedido ya fue tomado por otro conductor.");
          fetchDeliveryData();
      }
  };

  const handleUpdateStatus = async (orderId: string, status: 'picked_up' | 'delivered') => {
      let token = '';
      if (status === 'delivered') {
          token = prompt("INGRESE EL CÓDIGO DE SEGURIDAD DE 6 DÍGITOS:") || '';
          if (!token) return;
      }

      setLoading(true);
      const result = await api.data.updateOrderStatus(orderId, status, token);
      
      if (result.success) {
          fetchDeliveryData();
      } else {
          alert(result.message || "Error al actualizar el estado.");
          setLoading(false);
      }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-12 py-6 pb-28 space-y-6 relative min-h-screen">
        
        {/* HEADER */}
        <div className="flex justify-between items-center py-4 border-b border-gray-200 dark:border-white/10">
            <div>
                <h1 className="text-2xl font-heading font-bold dark:text-white flex items-center gap-2">
                    <Truck className="text-gold-500" /> Panel Repartidor
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">
                        {isOnline ? 'En Línea' : 'Desconectado'}
                    </p>
                </div>
            </div>
            <div className="flex gap-4">
                <button onClick={fetchDeliveryData} className="p-3 bg-gray-100 dark:bg-white/10 rounded-full text-gray-500 hover:rotate-180 transition-transform">
                    <RefreshCw size={20} />
                </button>
                <button 
                    onClick={() => setIsOnline(!isOnline)}
                    className={`p-3 rounded-full border transition-all ${isOnline ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/30' : 'bg-transparent text-gray-400 border-gray-300 dark:border-white/20'}`}
                >
                    <Power size={20} />
                </button>
            </div>
        </div>

        {/* EARNINGS SUMMARY (Static for MVP) */}
        <div className="grid grid-cols-3 gap-4">
            <div className="glass-panel p-4 rounded-xl bg-black dark:bg-white text-white dark:text-black col-span-1">
                <p className="text-[10px] font-bold uppercase opacity-70">Hoy</p>
                <h2 className="text-xl font-heading font-bold">$1,200</h2>
            </div>
            <div className="glass-panel p-4 rounded-xl bg-white dark:bg-white/5 col-span-2">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Estado Actual</p>
                <p className="text-sm font-bold dark:text-white flex items-center gap-2">
                    {activeOrder ? <span className="text-gold-500">● En Ruta</span> : isOnline ? <span className="text-green-500">● Buscando Pedidos</span> : <span className="text-gray-400">● Inactivo</span>}
                </p>
            </div>
        </div>

        {/* ACTIVE ORDER CARD */}
        {activeOrder ? (
            <div className="mt-4 animate-fade-in">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Entrega en Curso</h2>
                
                <div className="glass-panel p-6 rounded-[2rem] bg-gradient-to-br from-gold-400/10 to-transparent border-gold-400/30 border shadow-xl relative overflow-hidden">
                    {/* Status Badge */}
                    <div className="absolute top-6 right-6 px-3 py-1 bg-gold-400 text-black text-[10px] font-bold uppercase rounded-full animate-pulse">
                        {activeOrder.status === 'ready' ? 'Ir a Recoger' : 'En Camino'}
                    </div>

                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                            <Clock className="text-gold-500" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Pedido #{activeOrder.id.substring(0,6)}</p>
                            <h3 className="text-lg font-bold dark:text-white">Pago: ${activeOrder.total.toLocaleString()}</h3>
                        </div>
                    </div>

                    {/* Timeline / Steps */}
                    <div className="relative pl-4 space-y-6 mb-8">
                        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-white/10"></div>
                        
                        {/* Pickup Point */}
                        <div className={`relative flex items-start gap-4 ${activeOrder.status === 'picked_up' ? 'opacity-50' : 'opacity-100'}`}>
                            <div className="w-4 h-4 rounded-full bg-gold-400 border-2 border-white dark:border-black z-10 shrink-0"></div>
                            <div>
                                <p className="text-xs font-bold uppercase text-gold-500">Recoger</p>
                                <p className="font-bold dark:text-white">{activeOrder.business_name}</p>
                                <p className="text-xs text-gray-500">{activeOrder.business_address || 'Dirección no disp.'}</p>
                            </div>
                        </div>

                        {/* Dropoff Point */}
                        <div className={`relative flex items-start gap-4 ${activeOrder.status === 'picked_up' ? 'opacity-100' : 'opacity-50'}`}>
                            <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-700 border-2 border-white dark:border-black z-10 shrink-0"></div>
                            <div>
                                <p className="text-xs font-bold uppercase">Entregar</p>
                                <p className="font-bold dark:text-white">{activeOrder.customer_name}</p>
                                <p className="text-xs text-gray-500">{activeOrder.customer_address}</p>
                                <a href={`tel:${activeOrder.customer_phone}`} className="text-xs text-gold-500 underline">{activeOrder.customer_phone}</a>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                         <button className="py-3 bg-gray-100 dark:bg-white/10 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-white/20">
                             <Phone size={16} /> Llamar
                         </button>
                         <button className="py-3 bg-gray-100 dark:bg-white/10 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-white/20">
                             <Navigation size={16} /> Mapa
                         </button>
                         
                         {activeOrder.status === 'ready' && (
                             <button 
                                onClick={() => handleUpdateStatus(activeOrder.id, 'picked_up')}
                                className="col-span-2 py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                             >
                                 <Package size={16} /> Confirmar Recogida
                             </button>
                         )}

                         {activeOrder.status === 'picked_up' && (
                             <button 
                                onClick={() => handleUpdateStatus(activeOrder.id, 'delivered')}
                                className="col-span-2 py-4 bg-green-600 text-white rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-green-500/20"
                             >
                                 <CheckSquare size={16} /> Confirmar Entrega
                             </button>
                         )}
                    </div>

                </div>
            </div>
        ) : (
            /* POOL VIEW */
            <div className="mt-8">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Pedidos Disponibles</h2>
                
                {!isOnline ? (
                    <div className="p-10 text-center glass-panel rounded-2xl border-dashed border-2 border-gray-200 dark:border-white/10 opacity-60">
                        <Truck size={48} className="mx-auto mb-4 text-gray-400" />
                        <h3 className="font-bold text-lg dark:text-white">Estás desconectado</h3>
                        <p className="text-sm text-gray-500">Conéctate para ver el radar de pedidos.</p>
                    </div>
                ) : availableOrders.length === 0 ? (
                    <div className="p-10 text-center glass-panel rounded-2xl border border-gray-200 dark:border-white/10">
                        <Loader2 size={32} className="mx-auto mb-4 text-gold-400 animate-spin" />
                        <h3 className="font-bold text-sm dark:text-white">Buscando pedidos cercanos...</h3>
                        <p className="text-xs text-gray-500 mt-2">Mantente atento, aparecerán aquí.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {availableOrders.map(order => (
                            <div key={order.id} className="glass-panel p-5 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-gold-400 transition-all group">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase rounded mb-1 inline-block">Listo para recoger</span>
                                        <h3 className="font-bold dark:text-white">{order.business_name}</h3>
                                        <p className="text-xs text-gray-500">{order.business_address}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg dark:text-white">${(order.total * 0.15).toFixed(0)}</p>
                                        <p className="text-[10px] text-gray-400 uppercase">Ganancia Est.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 border-t border-gray-100 dark:border-white/5 pt-2">
                                    <MapPin size={12} /> Destino: {order.customer_sector || 'Zona Centro'}
                                </div>
                                <button 
                                    onClick={() => handleClaimOrder(order.id)}
                                    className="w-full py-3 bg-gold-400 text-black font-bold uppercase text-xs rounded-xl hover:bg-gold-500 transition-colors"
                                >
                                    Aceptar Pedido
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
    </div>
  );
};
