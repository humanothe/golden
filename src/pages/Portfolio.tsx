import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Package, Truck, ShieldCheck, Loader2, CheckCircle2, Inbox, Snowflake, ChevronRight } from 'lucide-react';
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  return (
    <Layout>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="p-8 space-y-12 max-w-lg mx-auto"
      >
        <motion.header variants={itemVariants} className="flex items-center gap-6 py-4">
          <div className="w-16 h-16 bg-[#0F0F0F] border border-white/5 rounded-2xl flex items-center justify-center shadow-xl">
            <Snowflake size={32} className="text-gold-500" />
          </div>
          <div>
            <p className="text-gold-500 text-[10px] tracking-[0.5em] uppercase font-black opacity-80">Patrimonio</p>
            <h1 className="text-3xl font-black tracking-tighter uppercase text-white">CONGELADOS</h1>
          </div>
        </motion.header>

        <div className="space-y-12">
          {/* Activos Section */}
          <section className="space-y-6">
            <motion.h2 variants={itemVariants} className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 border-b border-white/5 pb-4">Activos Disponibles</motion.h2>
            
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-28 bg-[#0A0A0A] animate-pulse rounded-[2rem] border border-white/5"></div>
                ))}
              </div>
            ) : assets.length === 0 ? (
              <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-20 text-white/5">
                <Inbox size={64} strokeWidth={1} />
                <p className="mt-4 text-[10px] uppercase tracking-[0.3em] font-black">Bóveda vacía</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {assets.map(asset => (
                  <motion.div 
                    key={asset.id}
                    variants={itemVariants}
                    whileHover={asset.estado !== 'en_transito' ? { scale: 1.02 } : {}}
                    whileTap={asset.estado !== 'en_transito' ? { scale: 0.98 } : {}}
                    onClick={() => {
                      if (asset.estado !== 'en_transito') {
                        setSelectedIds(prev => prev.includes(asset.id) ? prev.filter(i => i !== asset.id) : [...prev, asset.id]);
                      }
                    }}
                    className={`p-6 rounded-[2.5rem] border transition-all cursor-pointer relative flex items-center gap-6 ${
                      selectedIds.includes(asset.id) 
                        ? 'border-gold-500 bg-gold-500/5 shadow-[0_0_30px_rgba(217,165,18,0.1)]' 
                        : 'border-white/5 bg-[#0A0A0A] hover:bg-[#0F0F0F]'
                    } ${asset.estado === 'en_transito' ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                      selectedIds.includes(asset.id) ? 'border-gold-500/30 bg-gold-500/10' : 'border-white/5 bg-[#121212]'
                    }`}>
                      <Package size={24} className={selectedIds.includes(asset.id) ? 'text-gold-500' : 'text-white/20'} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-black uppercase tracking-widest text-white">{asset.nombre_producto}</h3>
                      <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-1 font-bold">{asset.cantidad} UNIDADES</p>
                    </div>
                    {asset.estado === 'en_transito' ? (
                      <div className="bg-gold-500/10 border border-gold-500/20 px-3 py-1.5 rounded-full">
                        <p className="text-[8px] font-black uppercase tracking-widest text-gold-500">En Ruta</p>
                      </div>
                    ) : selectedIds.includes(asset.id) && (
                      <CheckCircle2 size={20} className="text-gold-500" />
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Pedidos Section */}
          {orders.length > 0 && (
            <section className="space-y-6">
              <motion.h2 variants={itemVariants} className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 border-b border-white/5 pb-4">Entregas Maestras</motion.h2>
              <div className="space-y-6">
                {orders.map(order => (
                  <motion.div 
                    key={order.id} 
                    variants={itemVariants}
                    className="p-8 bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] space-y-8 shadow-2xl"
                  >
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20">Referencia</p>
                        <p className="text-xs font-black uppercase tracking-widest text-gold-500">#{order.id.slice(0, 8)}</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/60">{order.estado_maestro}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center border border-white/5">
                        <Truck size={22} className="text-gold-500" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-white">{order.cantidad_productos} ACTIVOS</p>
                        <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">En proceso de despacho</p>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex items-end justify-between">
                      <div className="space-y-2">
                        <p className="text-[9px] text-white/20 uppercase tracking-[0.3em] font-black">Token de Seguridad</p>
                        <p className="text-3xl font-mono font-black tracking-[0.4em] text-white leading-none">{order.token_entrega}</p>
                      </div>
                      <ShieldCheck size={32} className="text-gold-500/10" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>

        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-32 left-8 right-8 bg-gold-500 p-2 rounded-[2rem] flex items-center shadow-[0_20px_50px_rgba(217,165,18,0.3)] z-50 max-w-md mx-auto"
            >
              <div className="flex-1 px-6">
                <p className="text-[8px] font-black uppercase tracking-widest text-black/40">Selección</p>
                <p className="text-sm font-black uppercase tracking-widest text-black">{selectedIds.length} ACTIVOS</p>
              </div>
              <button 
                onClick={handleRequestDelivery}
                disabled={isProcessing}
                className="bg-black text-white h-16 px-8 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-900 transition-all flex items-center gap-3 shadow-xl disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : (
                  <>
                    <span>GENERAR PEDIDO</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
};
