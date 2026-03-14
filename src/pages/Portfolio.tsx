import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Package, Truck, ShieldCheck, Loader2, CheckCircle2, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '../components/Layout';

export const Portfolio: React.FC = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchAssets();
      fetchOrders();
    }
  }, [user]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('golden_congelados')
        .select('*')
        .eq('socio_email', user.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (err) {
      console.error("Error fetching assets:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('entregas_maestras')
        .select('*, solicitudes_entrega(*)')
        .eq('socio_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const handleRequestDelivery = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);

    try {
      const { data: masterData, error: masterError } = await supabase
        .from('entregas_maestras')
        .insert({
          socio_id: user.id,
          socio_email: user.email,
          estado_maestro: 'pendiente',
          cantidad_productos: selectedIds.length,
          token_entrega: Math.floor(100000 + Math.random() * 900000).toString()
        })
        .select()
        .single();

      if (masterError) throw masterError;

      const id_pedido_maestro = masterData.id;

      const solicitudes = selectedIds.map(id => {
        const asset = assets.find(a => a.id === id);
        return {
          id_pedido_maestro,
          id_producto: id,
          nombre_producto: asset?.nombre_producto,
          cantidad: asset?.cantidad,
          socio_id: user.id,
          socio_email: user.email,
          estado_solicitud: 'vinculado_al_maestro'
        };
      });

      const { error: solicitudesError } = await supabase
        .from('solicitudes_entrega')
        .insert(solicitudes);

      if (solicitudesError) throw solicitudesError;

      await supabase
        .from('golden_congelados')
        .update({ estado: 'en_transito' })
        .in('id', selectedIds);

      setSelectedIds([]);
      fetchAssets();
      fetchOrders();
    } catch (err) {
      console.error("Error generating order:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-12">
        <header>
          <p className="text-gold-400 text-[10px] tracking-[0.5em] uppercase mb-2">Gestión Patrimonial</p>
          <h1 className="text-4xl font-black tracking-tighter uppercase">Mi <span className="text-gold-400">Portafolio</span></h1>
        </header>

        <div className="grid grid-cols-1 gap-12">
          <div className="space-y-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-white/40 border-b border-white/10 pb-4">Activos Congelados</h2>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-32 bg-white/5 animate-pulse rounded-2xl"></div>
                ))}
              </div>
            ) : assets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-white/20">
                <Inbox size={48} strokeWidth={1} />
                <p className="mt-4 text-[10px] uppercase tracking-widest">No hay activos disponibles</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assets.map(asset => (
                  <div 
                    key={asset.id}
                    onClick={() => {
                      if (asset.estado !== 'en_transito') {
                        setSelectedIds(prev => prev.includes(asset.id) ? prev.filter(i => i !== asset.id) : [...prev, asset.id]);
                      }
                    }}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer relative ${
                      selectedIds.includes(asset.id) ? 'border-gold-400 bg-gold-400/5' : 'border-white/10 hover:border-gold-400/30'
                    } ${asset.estado === 'en_transito' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <Package className={selectedIds.includes(asset.id) ? 'text-gold-400' : 'text-white/20'} />
                      {asset.estado === 'en_transito' && (
                        <span className="text-[8px] font-black uppercase bg-gold-400 text-black px-2 py-1 rounded-full">En Tránsito</span>
                      )}
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tighter">{asset.nombre_producto}</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">{asset.cantidad} UNIDADES</p>
                    {selectedIds.includes(asset.id) && (
                      <div className="absolute top-4 right-4">
                        <CheckCircle2 size={16} className="text-gold-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-white/40 border-b border-white/10 pb-4">Mis Pedidos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map(order => (
                <div key={order.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gold-400">Pedido #{order.id.slice(0, 8)}</p>
                    <span className="text-[8px] font-black uppercase bg-white/10 px-2 py-1 rounded-full">{order.estado_maestro}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Truck size={16} className="text-white/40" />
                    <p className="text-xs font-bold">{order.cantidad_productos} PRODUCTOS EN RUTA</p>
                  </div>
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-[8px] text-white/40 uppercase tracking-widest mb-2">Token de Seguridad</p>
                    <p className="text-2xl font-mono font-black tracking-widest text-white">{order.token_entrega}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="fixed bottom-24 left-4 right-4 bg-gold-400 text-black p-4 rounded-2xl flex items-center justify-between shadow-2xl z-50"
            >
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Seleccionados</p>
                <p className="text-sm font-black uppercase tracking-tighter">{selectedIds.length} ACTIVOS</p>
              </div>
              <button 
                onClick={handleRequestDelivery}
                disabled={isProcessing}
                className="bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={14} /> : 'GENERAR PEDIDO'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};
