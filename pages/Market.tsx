import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, Lock, ArrowLeft, ShieldCheck, 
  Minus, Plus, Loader2, 
  CheckCircle2, TrendingUp, 
  FileText, AlertTriangle, ChevronRight, Truck,
  ArrowRight, Clock, LayoutGrid, Layers, Maximize2, Tag,
  Box, Scale, Ruler, Banknote, BadgeCheck
} from 'lucide-react';

export const Market: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  
  const [viewMode, setViewMode] = useState<'categories' | 'products'>('categories');
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCalibre, setFilterCalibre] = useState<string | null>(null);
  
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [stepIndex, setStepIndex] = useState(1); 
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionSuccess, setTransactionSuccess] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  // Helper para asegurar rutas válidas de Supabase Storage
  const getProductImage = (url: string | null | undefined) => {
    if (!url || url === 'null' || url === 'undefined' || url.trim() === '') return '/icon-192.png';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    // Si es solo un nombre de archivo, construimos la ruta al bucket 'assets' de Supabase
    return `https://ctnfizlhasmjcbpzrryb.supabase.co/storage/v1/object/public/assets/${url.replace(/^\/+/, '')}`;
  };

  const [existingFreeze, setExistingFreeze] = useState<any | null>(null);
  const [checkingFreeze, setCheckingFreeze] = useState(false);

  const STEPS = [15, 30, 45, 60, 90];
  const waitDays = STEPS[stepIndex];

  // Lógica avanzada para separar nombre de texto en paréntesis
  const formatProductName = (name: string) => {
    if (!name) return { main: "", sub: "" };
    const match = name.match(/\(([^)]+)\)/);
    if (match) {
        const main = name.replace(/\s*\([^)]+\).*/, "").trim();
        const sub = `(${match[1]})`; 
        return { main, sub };
    }
    return { main: name, sub: "" };
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          supabase.from('market_categorias')
            .select('*')
            .eq('activo', true)
            .order('posicion', { ascending: true })
            .order('nombre_categoria', { ascending: true }),
          supabase.from('market_products').select('*').order('name')
        ]);
        
        setCategories(catRes.data || []);
        setProducts(prodRes.data || []);
      } catch (e) { 
        console.error("MARKET_SYNC_ERROR", e); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      if (!selectedProduct || !user?.email) return;
      setCheckingFreeze(true);
      setExistingFreeze(null);
      setErrorFeedback(null);
      setDescExpanded(false);
      try {
        const { data } = await supabase.from('golden_congelados').select('*')
          .eq('socio_email', user.email.toLowerCase().trim())
          .eq('producto_id', selectedProduct.id)
          .in('estado', ['activo', 'en_proceso'])
          .maybeSingle();
        if (data) setExistingFreeze(data);
      } catch (e) { console.warn("ERROR_CHECKING_FREEZE", e); } finally { setCheckingFreeze(false); }
    };
    checkStatus();
  }, [selectedProduct, user?.email]);

  const detailData = useMemo(() => {
    if (!selectedProduct) return null;
    
    if (existingFreeze) {
        const precioCongeladoBase = Number(existingFreeze.precio_congelado || 0);
        const ahorroEstimadoBase = Number(existingFreeze.ahorro_estimado || 0);
        const cantidadBase = Number(existingFreeze.cantidad || 1);
        const precioMercadoUnitario = Number(existingFreeze.precio_mercado || selectedProduct.precio_mercado || 0);

        return {
            precioCongeladoUnitario: precioCongeladoBase,
            ahorroPct: precioMercadoUnitario > 0 ? Math.round(((precioMercadoUnitario - precioCongeladoBase) / precioMercadoUnitario) * 100) : 0,
            precioMercadoUnitario,
            ahorroTotalEstimated: ahorroEstimadoBase,
            totalOperacion: precioCongeladoBase * cantidadBase,
            isOutOfStock: false,
            status: existingFreeze.estado,
            themeColor: existingFreeze.estado === 'en_proceso' ? 'text-amber-400' : 'text-green-400',
            btnStyle: 'bg-gold-400/20 text-gold-400 border border-gold-400/30',
            glowStyle: existingFreeze.estado === 'en_proceso' ? 'bg-amber-400/10' : 'bg-green-400/10',
            plazoDias: existingFreeze.plazo_dias || waitDays,
            cantidad: cantidadBase
        };
    }

    const ahorroKey = `p${waitDays}_ahorro_pct`;
    const ahorroPct = Number(selectedProduct[ahorroKey] || 0);
    const precioMercadoUnitario = Number(selectedProduct.precio_mercado || 0);
    const precioCongeladoUnitario = precioMercadoUnitario * (1 - (ahorroPct / 100));
    const totalOperacion = Math.round(precioCongeladoUnitario * quantity);
    const ahorroTotalEstimated = (precioMercadoUnitario - precioCongeladoUnitario) * quantity;
    const isOutOfStock = (selectedProduct.stock_disponible || 0) <= 0;

    let themeColor = 'text-platinum';
    let btnStyle = 'bg-white text-black';
    let glowStyle = 'bg-white/5';
    
    if (waitDays >= 45) { themeColor = 'text-green-500'; btnStyle = 'bg-green-500 text-black'; glowStyle = 'bg-green-500/10'; }
    if (waitDays === 90) { themeColor = 'text-gold-400'; btnStyle = 'bg-gold-400 text-black'; glowStyle = 'bg-gold-400/15'; }
    if (isOutOfStock) btnStyle = 'bg-gray-800 text-gray-500 cursor-not-allowed';

    return { precioCongeladoUnitario, ahorroPct, precioMercadoUnitario, ahorroTotalEstimated, totalOperacion, isOutOfStock, themeColor, btnStyle, glowStyle, plazoDias: waitDays, cantidad: quantity };
  }, [selectedProduct, waitDays, quantity, existingFreeze]);

  const handleFreezePrice = async () => {
    if (!user?.id || !user?.email || !selectedProduct || !detailData || isProcessing || detailData.isOutOfStock || existingFreeze) return;
    
    // VALIDACIÓN DE SEGURIDAD CRÍTICA (FRONTEND)
    const hasMembership = user.membership_tier && user.membership_tier.toLowerCase() !== 'free';
    const hasBalance = (user.points_balance || 0) >= detailData.totalOperacion;

    if (!hasMembership) {
        setErrorFeedback("ERROR_SEGURIDAD: REQUIERE UNA MEMBRESÍA ACTIVA PARA OPERAR.");
        return;
    }

    if (!hasBalance) {
        setErrorFeedback("ERROR_TESORERÍA: SALDO INSUFICIENTE EN BÓVEDA.");
        return;
    }

    if (!selectedProduct.negocio_id_asignado) {
        setErrorFeedback("ERROR TÉCNICO: ACTIVO SIN NODO DE DESPACHO ASIGNADO.");
        return;
    }

    setIsProcessing(true);
    setErrorFeedback(null);

    try {
      // CALCULO DE VENCIMIENTO CRONOMÉTRICO
      const fechaVencimiento = new Date(Date.now() + waitDays * 24 * 60 * 60 * 1000).toISOString();

      // MAPEO TÉCNICO COMPLETO: Sincronizado con la firma final del Nodo Maestro
      const { error: rpcError } = await supabase.rpc('procesar_compra_market', {
          p_cantidad: quantity,
          p_descripcion: selectedProduct.descripcion || "",
          p_detalle_unidad: selectedProduct.detalle_unidad || "",
          p_dimension_calibre: selectedProduct.dimension_calibre || "",
          p_escala_tamano: selectedProduct.escala_tamano || "",
          p_estado: 'en_proceso',
          p_negocio_id: selectedProduct.negocio_id_asignado,
          p_nombre_producto: selectedProduct.name,
          p_plazo_dias: waitDays,
          p_precio_mercado: Number(selectedProduct.precio_mercado),
          p_precio_congelado: Number(detailData.precioCongeladoUnitario),
          p_ahorro_estimado: Number(detailData.ahorroTotalEstimated),
          p_fecha_vencimiento: fechaVencimiento,
          p_producto_id: selectedProduct.id,
          p_socio_email: user.email.toLowerCase().trim(),
          p_valor_medida: Number(selectedProduct.valor_medida || 0)
      });

      if (rpcError) throw rpcError;

      await refreshProfile();
      setTransactionSuccess(true);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

    } catch (err: any) {
      console.error("RPC_TRANSACTION_REJECTED:", err);
      let msg = err.message || "FALLO DE SINCRONIZACIÓN";
      if (msg.toLowerCase().includes('insufficient') || msg.toLowerCase().includes('saldo')) {
        msg = "SALDO INSUFICIENTE EN BÓVEDA";
      }
      setErrorFeedback(msg.toUpperCase());
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredItems = useMemo(() => {
    return products.filter(item => {
      const matchesCategory = !activeCategory || item.categoria === activeCategory.nombre_categoria;
      const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCalibre = !filterCalibre || item.dimension_calibre === filterCalibre;
      return matchesCategory && matchesSearch && matchesCalibre;
    });
  }, [products, activeCategory, searchTerm, filterCalibre]);

  const selectCategory = (cat: any) => {
    setActiveCategory(cat);
    setFilterCalibre(null);
    setViewMode('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-transparent text-white pb-48 overflow-x-hidden relative font-heading text-left selection:bg-gold-400 selection:text-black">
      
      {/* ATMÓSFERA LUMÍNICA GLOBAL */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[80vw] h-[50vh] opacity-40"
               style={{ background: 'radial-gradient(circle at 0% 0%, white 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
          <div className="absolute bottom-0 right-0 w-[70vw] h-[60vh] opacity-[0.15]"
               style={{ background: 'radial-gradient(circle at 100% 100%, #D4AF37 0%, transparent 60%)', filter: 'blur(100px)' }}></div>
      </div>

      <header className="pt-[env(safe-area-inset-top)] px-6 lg:px-12 border-b border-white/5 sticky top-0 z-40 backdrop-blur-3xl bg-black/60">
          <div className="max-w-[1400px] mx-auto pb-6 pt-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                  <div className="flex items-center gap-4">
                      {viewMode === 'products' && (
                        <button onClick={() => setViewMode('categories')} className="p-3 bg-white/5 border border-white/10 rounded-full text-gold-400 hover:bg-gold-400 hover:text-black transition-all">
                          <ArrowLeft size={20} />
                        </button>
                      )}
                      <div className="space-y-1">
                          <p className="text-[8px] text-gold-400 font-normal uppercase tracking-[0.6em]">ADQUISICIÓN_DE_ACTIVOS</p>
                          <h1 className="font-heading text-3xl md:text-5xl text-white tracking-tighter uppercase leading-none font-normal">GOLDEN <span className="text-gold-metallic">MARKET</span></h1>
                      </div>
                  </div>
                  <div className="relative w-full lg:w-96 group">
                      <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700" />
                      <input type="text" placeholder="BUSCAR ACTIVO..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/5 rounded-none text-[10px] font-normal uppercase tracking-[0.3em] focus:border-gold-400 outline-none text-white placeholder:text-gray-800" />
                  </div>
              </div>
          </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 mt-12 relative z-10">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">{Array(12).fill(0).map((_, i) => (<div key={i} className="aspect-square bg-white/[0.01] border border-white/5 animate-pulse"></div>))}</div>
          ) : viewMode === 'categories' ? (
            <div className="space-y-12">
               <div className="flex items-center gap-3 opacity-30">
                  <LayoutGrid size={14} />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">Explorar por Sector</span>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
                  {categories.map((cat) => (
                    <div 
                      key={cat.id} 
                      onClick={() => selectCategory(cat)}
                      className="group relative aspect-[4/3] overflow-hidden cursor-pointer border border-white/5 bg-black hover:border-gold-400/40 transition-all shadow-2xl"
                    >
                      <img src={cat.imagen_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974'} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700" alt={cat.nombre_categoria} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                      <div className="absolute bottom-8 left-8 right-8">
                         <p className="text-[8px] text-gold-400 font-black uppercase tracking-[0.5em] mb-2 opacity-60">SECTOR_MARKET</p>
                         <h3 className="text-3xl font-heading font-black text-white uppercase tracking-tighter leading-none group-hover:text-gold-metallic transition-all">{cat.nombre_categoria}</h3>
                         <div className="mt-6 flex items-center gap-2 text-white/20 group-hover:text-gold-400 transition-colors">
                            <span className="text-[9px] font-bold uppercase tracking-widest">INGRESAR</span>
                            <ArrowRight size={12} />
                         </div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          ) : (
            <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-12">
                   <div className="flex items-center gap-3">
                      <Layers size={16} className="text-gold-400" />
                      <h2 className="text-xl md:text-2xl font-heading font-black uppercase tracking-widest text-white">
                        {activeCategory?.nombre_categoria || 'TODOS LOS ACTIVOS'}
                      </h2>
                   </div>
                   <span className="text-[10px] font-mono text-gray-700">{filteredItems.length} RESULTADOS</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {filteredItems.map((item) => {
                        const { main, sub } = formatProductName(item.name);
                        return (
                          <div key={item.id} onClick={() => { setSelectedProduct(item); setQuantity(1); setStepIndex(1); setErrorFeedback(null); }} className="relative group cursor-pointer border border-white/5 bg-white/[0.02] transition-all hover:border-gold-400/40 hover:bg-white/[0.08] p-8 flex flex-col items-center backdrop-blur-md overflow-hidden">
                              <div className="w-24 h-24 mb-6 flex items-center justify-center relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/5 shadow-inner">
                                 <img 
                                   src={getProductImage(item.portada_url || item.icono_url)} 
                                   className="w-full h-full object-cover relative z-10 transition-all duration-500 group-hover:scale-110" 
                                   alt={item.name}
                                   onError={(e) => {
                                     (e.target as HTMLImageElement).src = '/icon-192.png';
                                     (e.target as HTMLImageElement).className = "w-10 h-10 opacity-10 object-contain";
                                   }}
                                 />
                              </div>
                              <div className="text-center w-full space-y-4">
                                  <div className="min-h-[40px] flex flex-col justify-center">
                                    <h3 className="text-[10px] font-normal text-white uppercase tracking-widest leading-tight mb-1 line-clamp-1 px-2">{main}</h3>
                                    {sub && <p className="text-[7px] text-gray-600 font-bold uppercase tracking-widest mb-2 italic">{sub}</p>}
                                  </div>
                                  <div className="flex flex-col gap-1 items-center border-t border-white/5 pt-3">
                                      <p className="text-[12px] font-heading font-normal text-gold-400 tracking-tight">RD$ {(item.precio_mercado || 0).toLocaleString()}</p>
                                      <p className="text-[7px] text-gray-700 uppercase font-bold tracking-widest">VALOR_MERCADO</p>
                                  </div>
                              </div>
                          </div>
                        );
                    })}
                </div>
            </div>
          )}
      </div>

      {selectedProduct && detailData && (
          <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl overflow-y-auto no-scrollbar animate-fade-in pt-[env(safe-area-inset-top)]">
              {/* ATMÓSFERA LUMÍNICA ASIMÉTRICA */}
              <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[100vw] h-[50vh] opacity-30"
                     style={{ background: 'radial-gradient(circle at 100% 0%, white 0%, transparent 60%)', filter: 'blur(120px)' }}></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[100vw] h-[60vh] opacity-[0.2]"
                     style={{ background: 'radial-gradient(circle at 50% 100%, #D4AF37 0%, transparent 60%)', filter: 'blur(100px)' }}></div>
              </div>

              <div className="relative z-10 w-full h-[35vh] md:h-[40vh] overflow-hidden bg-black/20">
                  <img 
                    src={getProductImage(selectedProduct.portada_url || selectedProduct.icono_url)} 
                    className="w-full h-full object-cover brightness-[0.4]" 
                    alt={selectedProduct.name} 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black to-transparent opacity-90"></div>
                  <div className="absolute inset-0 bg-black/40"></div>
                  {(!transactionSuccess && !existingFreeze) && (
                    <button onClick={() => setSelectedProduct(null)} className="absolute top-8 left-8 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white hover:bg-gold-400 hover:text-black transition-all z-50 active:scale-90 shadow-2xl">
                      <ArrowLeft size={24} />
                    </button>
                  )}
                  <div className="absolute bottom-10 left-8 right-8">
                      <div className="flex items-center gap-2 mb-4">
                          <div className="px-3 py-1 bg-gold-400 text-black text-[8px] font-bold uppercase tracking-[0.4em]">PROTECCIÓN_GP</div>
                          <ShieldCheck size={16} className="text-gold-400" />
                      </div>
                  </div>
              </div>

              <div className="relative z-10 -mt-20 bg-[#050505] border-t border-white/10 pb-40 min-h-[80vh]">
                  {/* ATMÓSFERA LUMÍNICA INTERNA */}
                  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                      <div className="absolute top-0 left-0 w-[100%] h-[40%] opacity-20"
                           style={{ background: 'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.4) 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
                      <div className="absolute bottom-0 right-0 w-[100%] h-[40%] opacity-10"
                           style={{ background: 'radial-gradient(circle at 100% 100%, rgba(212,175,55,0.2) 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
                  </div>

                  <div className="max-w-2xl mx-auto relative z-10 p-8 md:p-16">
                      {checkingFreeze ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-6">
                            <Loader2 className="w-12 h-12 text-gold-400 animate-spin" />
                            <p className="text-[10px] text-gold-400 font-black uppercase tracking-[0.5em]">Sincronizando Estatus...</p>
                        </div>
                      ) : (transactionSuccess || existingFreeze) ? (
                        <div className="animate-enter-screen space-y-12 py-10">
                           <div className={`w-20 h-20 ${transactionSuccess ? 'bg-green-500' : 'bg-gold-400'} text-black rounded-none flex items-center justify-center mx-auto shadow-2xl mb-12`}><BadgeCheck size={40} strokeWidth={2.5} /></div>
                           <div className="text-center mb-16">
                              <h2 className="text-3xl font-heading font-normal uppercase text-white tracking-tighter mb-2">
                                {transactionSuccess ? 'BLINDAJE ACTIVADO' : 'ACTIVO PROTEGIDO'}
                              </h2>
                              <p className="text-[8px] font-mono tracking-[0.5em] text-gold-400 uppercase font-black italic">
                                {transactionSuccess ? 'CERTIFICADO TÉCNICO GENERADO' : 'ESTADO: VIGENTE Y ASEGURADO'}
                              </p>
                           </div>

                           {/* RESUMEN DETALLADO DEL BLINDAJE (CERTIFICADO DIGITAL) */}
                           <div className="bg-white/[0.02] border border-white/5 p-8 space-y-10 shadow-inner relative">
                              <div className="absolute top-0 right-0 p-4 opacity-[0.03]"><ShieldCheck size={100} /></div>
                              <div className="space-y-3 relative z-10">
                                  <p className="text-[7px] text-gray-600 uppercase tracking-[0.5em] font-black border-b border-white/5 pb-3">ACTIVO_CONGELADO</p>
                                  <h3 className="text-2xl font-heading font-normal text-white uppercase tracking-tighter">{selectedProduct.name}</h3>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/5 relative z-10">
                                 <div className="space-y-1">
                                    <p className="text-[6px] text-gray-700 uppercase font-black">CANTIDAD</p>
                                    <div className="flex items-center gap-2 text-white">
                                       <span className="text-[9px] font-bold">{detailData.cantidad} UNID.</span>
                                    </div>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[6px] text-gray-700 uppercase font-black">TAMAÑO</p>
                                    <div className="flex items-center gap-2 text-white">
                                       <span className="text-[9px] font-bold">{selectedProduct.escala_tamano || 'MEDIANO'}</span>
                                    </div>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[6px] text-gray-700 uppercase font-black">MEDIDA</p>
                                    <div className="flex items-center gap-2 text-white">
                                       <span className="text-[9px] font-bold">{selectedProduct.valor_medida} {selectedProduct.detalle_unidad}</span>
                                    </div>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[6px] text-gray-700 uppercase font-black">PLAZO</p>
                                    <div className="flex items-center gap-2 text-gold-400">
                                       <span className="text-[9px] font-black">{detailData.plazoDias} DÍAS</span>
                                    </div>
                                 </div>
                              </div>

                              <div className="pt-6 border-t border-white/5 flex justify-between items-center relative z-10">
                                 <div className="space-y-1">
                                    <p className="text-[6px] text-gray-700 uppercase font-black">DÉBITO TOTAL</p>
                                    <p className="text-xl font-mono font-black text-gold-400">{Math.round(detailData.totalOperacion).toLocaleString()} GP</p>
                                 </div>
                                 <div className="text-right space-y-1">
                                    <p className="text-[6px] text-green-500 uppercase font-black">AHORRO_PROYECTADO</p>
                                    <p className="text-lg font-mono font-bold text-green-500">RD$ {Math.round(detailData.ahorroTotalEstimated).toLocaleString()}</p>
                                 </div>
                              </div>
                           </div>

                           <div className="pt-10">
                              <button onClick={() => { setSelectedProduct(null); setTransactionSuccess(false); navigate('/dashboard'); }} className="w-full py-6 bg-white text-black font-black uppercase tracking-[0.4em] text-[10px] rounded-none shadow-2xl active:scale-95 transition-all">REGRESAR A BÓVEDA</button>
                           </div>
                        </div>
                      ) : (
                        <div className="space-y-10">
                            {/* CABECERA: NOMBRE Y TEXTO SECUNDARIO SEPARADOS */}
                            <div className="space-y-1">
                                {(() => {
                                    const { main, sub } = formatProductName(selectedProduct.name);
                                    return (
                                        <>
                                            <h2 className="font-heading text-3xl md:text-5xl text-white uppercase tracking-tighter leading-none font-normal">
                                                {main}
                                            </h2>
                                            {sub && <p className="text-sm md:text-base font-bold text-gray-600 uppercase tracking-widest italic">{sub}</p>}
                                        </>
                                    );
                                })()}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 opacity-30">
                                    <span className="text-[7px] font-black uppercase tracking-[0.4em]">Descripción del Producto</span>
                                </div>
                                <div className="relative">
                                    <p className={`text-[12px] text-gray-400 font-light leading-relaxed transition-all ${!descExpanded ? 'line-clamp-2' : ''}`}>
                                        {selectedProduct.descripcion || "Este producto cumple con los estándares de calidad del ecosistema Golden."}
                                    </p>
                                    {(selectedProduct.descripcion?.length > 100) && (
                                        <button 
                                            onClick={() => setDescExpanded(!descExpanded)}
                                            className="mt-2 text-gold-400 text-[8px] font-bold uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors"
                                        >
                                            {descExpanded ? 'Cerrar' : 'Ver más'}
                                            <ChevronRight size={10} className={`transition-transform ${descExpanded ? '-rotate-90' : 'rotate-90'}`} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-center border-y border-white/5 py-8">
                                <div className="flex items-center gap-6">
                                   <div>
                                      <p className="text-[7px] text-gray-600 font-normal uppercase tracking-[0.4em] mb-1">DÉBITO_UNITARIO</p>
                                      <div className="flex items-baseline gap-2">
                                         <span className={`text-4xl md:text-5xl font-heading font-normal tracking-tighter ${detailData.themeColor}`}>
                                            {Math.round(detailData.precioCongeladoUnitario || 0).toLocaleString()}
                                         </span>
                                         <span className="text-sm text-gray-700 font-bold uppercase">GP</span>
                                      </div>
                                   </div>
                                   <div className="h-10 w-[1px] bg-white/5"></div>
                                   <div>
                                      <p className="text-[7px] text-gray-700 uppercase mb-1 tracking-widest font-normal italic">PRECIO_LIBRE</p>
                                      <p className="text-lg font-mono text-white/10 line-through font-normal">RD$ {(detailData.precioMercadoUnitario || 0).toLocaleString()}</p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className="text-[8px] text-green-500 font-bold uppercase bg-green-500/10 px-3 py-1 rounded-none border border-green-500/20">AHORRO_{detailData.ahorroPct}%</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex items-center justify-between gap-4">
                                   <span className="text-[8px] font-normal text-gray-600 uppercase tracking-[0.4em] shrink-0">CANTIDAD</span>
                                   <div className="flex items-center justify-between border border-white/10 bg-white/[0.02] p-1 h-12 rounded-none flex-1">
                                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-full hover:bg-white/5 text-white/20 flex items-center justify-center transition-colors active:scale-90"><Minus size={14}/></button>
                                      <span className="text-lg font-mono font-bold text-white">{quantity}</span>
                                      <button onClick={() => quantity < (selectedProduct.stock_disponible || 99) && setQuantity(quantity + 1)} className="w-10 h-full hover:bg-white/5 text-white/20 flex items-center justify-center transition-colors active:scale-90"><Plus size={14}/></button>
                                   </div>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                   <span className="text-[8px] font-normal text-gray-600 uppercase tracking-[0.4em] shrink-0">PLAZO</span>
                                   <div className="h-20 flex flex-col justify-center px-4 bg-white/[0.02] border border-white/10 rounded-none flex-1">
                                      <input type="range" min="0" max="4" step="1" value={stepIndex} onChange={(e) => setStepIndex(parseInt(e.target.value))} className="w-full h-1 bg-white/10 appearance-none accent-gold-400 cursor-pointer" />
                                      <div className="flex justify-between mt-3 text-[7px] text-gray-500 font-bold uppercase tracking-widest">
                                         {STEPS.map(s => <span key={s} className={waitDays === s ? 'text-gold-400 scale-110' : ''}>{s}D</span>)}
                                      </div>
                                   </div>
                                </div>
                            </div>

                            <div className="pt-6 space-y-8">
                                <div className="p-8 bg-white/[0.01] border border-white/5 rounded-none space-y-6 shadow-inner">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[8px] text-gray-600 font-normal uppercase tracking-[0.4em]">DÉBITO_TOTAL_GP</p>
                                        <p className="text-3xl font-mono font-bold text-white">{Math.round(detailData.totalOperacion || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="h-[1px] bg-white/5"></div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-[8px] text-green-500 font-normal uppercase tracking-[0.4em]">AHORRO_CONSOLIDADO</p>
                                        <p className="text-2xl font-mono font-bold text-green-500">+ {Math.round(detailData.ahorroTotalEstimated || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                                
                                {errorFeedback && (
                                  <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-none flex items-start gap-4 animate-shake text-left">
                                     <AlertTriangle size={20} className="text-red-500 shrink-0 mt-1" />
                                     <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-red-500 leading-tight">RECHAZO_DE_SISTEMA</p>
                                        <p className="text-[8px] text-red-500/70 uppercase mt-1 leading-relaxed">{errorFeedback}</p>
                                     </div>
                                  </div>
                                )}

                                {(() => {
                                    const hasMembership = user?.membership_tier && user.membership_tier.toLowerCase() !== 'free';
                                    const hasBalance = (user?.points_balance || 0) >= (detailData?.totalOperacion || 0);
                                    const isOutOfStock = detailData?.isOutOfStock;
                                    
                                    let btnLabel = <><Lock size={18} /> ACTIVAR PROTECCIÓN</>;
                                    let isDisabled = isProcessing || isOutOfStock || existingFreeze;
                                    let finalBtnStyle = detailData?.btnStyle;

                                    if (isProcessing) {
                                        btnLabel = <Loader2 size={20} className="animate-spin" />;
                                    } else if (isOutOfStock) {
                                        btnLabel = <>SIN STOCK</>;
                                    } else if (!hasMembership) {
                                        isDisabled = true;
                                        btnLabel = <>REQUIERE MEMBRESÍA</>;
                                        finalBtnStyle = "bg-red-500/10 border border-red-500/40 text-red-500";
                                    } else if (!hasBalance) {
                                        isDisabled = true;
                                        btnLabel = <>SALDO INSUFICIENTE</>;
                                        finalBtnStyle = "bg-gray-800 text-gray-500 cursor-not-allowed opacity-50";
                                    }

                                    return (
                                        <div className="space-y-4">
                                            <button 
                                              onClick={handleFreezePrice} 
                                              disabled={isDisabled} 
                                              className={`w-full py-6 font-normal uppercase tracking-[0.6em] text-[11px] transition-all duration-500 flex items-center justify-center gap-4 active:scale-95 rounded-none shadow-md ${finalBtnStyle}`}
                                            >
                                               {btnLabel}
                                            </button>
                                            
                                            {(!hasBalance && hasMembership && !isProcessing) && (
                                                <button 
                                                  onClick={() => navigate('/wallet')}
                                                  className="w-full py-5 bg-white text-black font-black uppercase text-[10px] tracking-[0.3em] transition-all flex items-center justify-center gap-4 active:scale-95 shadow-md rounded-none"
                                                >
                                                  RECARGAR SALDO
                                                </button>
                                            )}
                                        </div>
                                    );
                                })()}
                                <p className="text-center text-[7px] text-gray-800 uppercase tracking-[0.4em] font-bold leading-loose px-8">Al confirmar, el Nodo Maestro debitará el saldo necesario y blindará el activo automáticamente.</p>
                            </div>
                        </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};