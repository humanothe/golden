import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { 
  Snowflake, Clock, CheckCircle2, AlertCircle, 
  Search, Loader2, Package,
  Calendar, ShieldCheck, Banknote, ArrowRight,
  ChevronRight, Tag, Info, Truck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Portfolio: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [frozenAssets, setFrozenAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'en_proceso'>('en_proceso');

  const fetchFrozenAssets = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const userEmail = user.email.toLowerCase().trim();
      const { data, error } = await supabase
        .from('golden_congelados')
        .select('*')
        .eq('socio_email', userEmail)
        .eq('estado', 'en_proceso')
        .order('fecha_inicio', { ascending: false });

      if (error) throw error;
      setFrozenAssets(data || []);
    } catch (err) {
      console.error("Error fetching portfolio:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrozenAssets();
  }, [user?.email]);

  const filteredAssets = frozenAssets.filter(asset => {
    const matchesSearch = asset.nombre_producto?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = asset.estado === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_proceso': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'entregado': return 'text-green-400 bg-green-400/10 border-green-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'en_proceso': return 'CONGELADO';
      case 'entregado': return 'COMPLETADO';
      default: return status.toUpperCase();
    }
  };

  const handleRequestDelivery = async (assetId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('golden_congelados')
        .update({ 
          metodo_entrega: 'domicilio',
          estado_entrega: 'pendiente' 
        })
        .eq('id', assetId);

      if (error) throw error;
      alert("SOLICITUD DE ENTREGA ENVIADA AL NODO DE REPARTO.");
      fetchFrozenAssets();
    } catch (err) {
      console.error("Error requesting delivery:", err);
      alert("FALLO AL SOLICITAR ENTREGA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white relative font-heading text-left selection:bg-gold-400 selection:text-black flex flex-col">
      
      {/* ATMÓSFERA LUMÍNICA GLOBAL */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[80vw] h-[50vh] opacity-40"
               style={{ background: 'radial-gradient(circle at 0% 0%, white 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
          <div className="absolute bottom-0 right-0 w-[70vw] h-[60vh] opacity-[0.15]"
               style={{ background: 'radial-gradient(circle at 100% 100%, #D4AF37 0%, transparent 60%)', filter: 'blur(100px)' }}></div>
      </div>

      <header className="pt-[env(safe-area-inset-top)] px-6 lg:px-12 border-b border-white/5 z-40 backdrop-blur-3xl bg-black/60 shrink-0">
          <div className="max-w-[1400px] mx-auto pb-6 pt-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                  <div className="flex items-center gap-4">
                      <div className="space-y-1">
                          <p className="text-[8px] text-gold-400 font-normal uppercase tracking-[0.6em]">ADMINISTRACIÓN_DE_ACTIVOS</p>
                          <h1 className="font-heading text-3xl md:text-5xl text-white tracking-tighter uppercase leading-none font-normal">MI <span className="text-gold-metallic">PORTAFOLIO</span></h1>
                      </div>
                  </div>
                  <div className="relative w-full lg:w-96 group">
                      <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700" />
                      <input 
                        type="text" 
                        placeholder="BUSCAR EN PORTAFOLIO..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/5 rounded-none text-[10px] font-normal uppercase tracking-[0.3em] focus:border-gold-400 outline-none text-white placeholder:text-gray-800" 
                      />
                  </div>
              </div>
          </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col relative z-10">
          <div className="flex-1 overflow-y-auto no-scrollbar px-6 lg:px-12 pb-40 mt-8">
              <div className="max-w-[1400px] mx-auto">
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="aspect-[16/9] bg-white/[0.01] border border-white/5 animate-pulse"></div>
                      ))}
                    </div>
                  ) : filteredAssets.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10 animate-fade-in px-6">
                        <div className="w-28 h-28 bg-white/5 rounded-full flex items-center justify-center text-gray-800 border border-white/5">
                            <Snowflake size={56} strokeWidth={1} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-3xl font-heading font-normal uppercase tracking-[0.1em] text-white">Sin Activos Detectados</h3>
                            <p className="text-[11px] text-gray-600 uppercase tracking-[0.4em] max-w-xs mx-auto leading-relaxed">No tienes productos congelados activos en este momento.</p>
                        </div>
                        <button 
                          onClick={() => navigate('/market')}
                          className="px-12 py-5 bg-gold-400 text-black text-[11px] font-black uppercase tracking-[0.5em] hover:bg-white transition-all active:scale-95 shadow-md"
                        >
                          IR AL MARKET
                        </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in pb-20">
                        {filteredAssets.map((asset) => (
                          <div 
                            key={asset.id}
                            className="group bg-[#0a0a0a] border border-white/5 hover:border-gold-400/30 transition-all duration-500 relative overflow-hidden flex flex-col shadow-lg"
                          >
                            {/* CABECERA DE TARJETA */}
                            <div className="p-8 border-b border-white/5 flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-[7px] text-gold-400 font-black uppercase tracking-[0.5em] opacity-60">TICKET_ID: {asset.ticket_id || asset.id.slice(0,8)}</p>
                                    <h3 className="text-2xl font-heading font-black text-white uppercase tracking-tighter leading-none group-hover:text-gold-metallic transition-all">
                                        {asset.nombre_producto}
                                    </h3>
                                </div>
                                <div className={`px-3 py-1 border text-[7px] font-black tracking-[0.2em] ${getStatusColor(asset.estado)}`}>
                                    {getStatusLabel(asset.estado)}
                                </div>
                            </div>

                            {/* CONTENIDO TÉCNICO */}
                            <div className="p-8 space-y-8 flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[7px] text-gray-700 font-black uppercase tracking-widest">CANTIDAD_ACTIVO</p>
                                        <p className="text-lg font-mono font-black text-white">
                                            {asset.cantidad} <span className="text-[10px] text-gray-500">{asset.detalle_unidad}</span>
                                        </p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-[7px] text-gray-700 font-black uppercase tracking-widest">VALOR_CONGELADO</p>
                                        <p className="text-lg font-mono font-black text-gold-400">{Number(asset.precio_congelado).toLocaleString()} <span className="text-[10px]">GP</span></p>
                                    </div>
                                </div>

                                {asset.descripcion_producto && (
                                    <div className="p-4 bg-white/[0.02] border border-white/5 flex gap-4">
                                        <Info size={14} className="text-gold-400 shrink-0 mt-0.5" />
                                        <p className="text-[9px] text-gray-500 uppercase leading-relaxed tracking-wider font-medium">
                                            {asset.descripcion_producto}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest">
                                        <span className="text-gray-600 flex items-center gap-2"><Calendar size={12}/> Vencimiento</span>
                                        <span className="text-white">{new Date(asset.fecha_vencimiento).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest">
                                        <span className="text-gray-600 flex items-center gap-2"><ShieldCheck size={12}/> Nodo Asignado</span>
                                        <span className="text-gold-400">ID_{asset.negocio_id_asignado?.slice(0,6)}</span>
                                    </div>
                                    {asset.entregado_por && (
                                        <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest">
                                            <span className="text-gray-600 flex items-center gap-2"><Package size={12}/> Repartidor</span>
                                            <span className="text-blue-400">ID_{asset.entregado_por.slice(0,6)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="px-8 pb-8 space-y-3">
                                {asset.estado === 'en_proceso' && !asset.metodo_entrega && (
                                    <button 
                                      onClick={() => handleRequestDelivery(asset.id)}
                                      className="w-full py-4 bg-gold-400 text-black font-black uppercase tracking-[0.4em] text-[9px] hover:bg-white transition-all flex items-center justify-center gap-3"
                                    >
                                      RECIBIR EN CASA <Truck size={14} />
                                    </button>
                                )}
                                <button 
                                  className="w-full py-4 bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.4em] hover:bg-gold-400 hover:text-black transition-all flex items-center justify-center gap-3 group/btn"
                                >
                                  DETALLES OPERATIVOS <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};
