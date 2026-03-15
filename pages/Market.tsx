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
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
          .gt('fecha_vencimiento', new Date().toISOString())
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

      <header className="relative z-10 pt-40 pb-24 px-10 max-w-[1400px] w-full mx-auto">
        <div className="space-y-8">
          <div className="flex items-center gap-4 opacity-20">
            <div className="w-12 h-[1px] bg-white"></div>
            <p className="text-[9px] font-black text-white uppercase tracking-[1em]">ADQUISICIÓN_DE_ACTIVOS</p>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
            <div className="flex items-center gap-8">
              {viewMode === 'products' && (
                <button onClick={() => setViewMode('categories')} className="w-16 h-16 bg-white/[0.02] border border-white/10 rounded-full flex items-center justify-center text-gold-400 hover:bg-white hover:text-black transition-all duration-500 shadow-2xl active:scale-90">
                  <ArrowLeft size={24} strokeWidth={1.5} />
                </button>
              )}
              <h1 className="text-[10rem] font-extralight text-white uppercase tracking-tighter leading-[0.75] flex flex-col">
                GOLDEN <span className="font-black text-gold-400">MARKET</span>
              </h1>
            </div>
            <div className="relative w-full lg:w-[450px] group">
              <Search size={18} strokeWidth={1.5} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold-400 transition-colors" />
              <input 
                type="text" 
                placeholder="BUSCAR_ACTIVO_EN_RED..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-16 pr-8 py-7 bg-white/[0.01] border border-white/5 rounded-none text-[11px] font-black uppercase tracking-[0.4em] focus:border-gold-400/30 outline-none text-white placeholder:text-white/10 transition-all duration-500" 
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-10 mt-12 relative z-10">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">{Array(12).fill(0).map((_, i) => (<div key={i} className="aspect-square bg-white/[0.01] border border-white/5 rounded-none animate-pulse"></div>))}</div>
          ) : viewMode === 'categories' ? (
            <div className="space-y-24">
               <div className="flex items-center gap-6 opacity-20">
                  <div className="w-16 h-[1px] bg-white"></div>
                  <span className="text-[10px] font-black uppercase tracking-[1em] text-white">EXPLORAR_SECTORES_PRODUCTIVOS</span>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 animate-fade-in">
                  {categories.map((cat) => (
                    <div 
                      key={cat.id} 
                      onClick={() => selectCategory(cat)}
                      className="group relative aspect-[4/5] overflow-hidden cursor-pointer border border-white/5 bg-black rounded-none hover:border-gold-400/40 transition-all duration-700 shadow-2xl"
                    >
                      <img src={cat.imagen_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974'} className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-[2000ms]" alt={cat.nombre_categoria} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                      <div className="absolute bottom-12 left-12 right-12">
                         <p className="text-[9px] text-gold-400 font-black uppercase tracking-[0.8em] mb-4 opacity-40">SECTOR_ESTRATÉGICO</p>
                         <h3 className="text-4xl font-light text-white uppercase tracking-tighter leading-none group-hover:text-gold-400 transition-all duration-500">{cat.nombre_categoria}</h3>
                         <div className="mt-10 flex items-center gap-4 text-white/10 group-hover:text-gold-400 transition-all duration-500">
                            <span className="text-[10px] font-black uppercase tracking-[0.5em]">INGRESAR_A_RECURSOS</span>
                            <ArrowRight size={16} strokeWidth={1.5} />
                         </div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          ) : (
            <div className="animate-fade-in space-y-20">
                <div className="flex items-end justify-between pb-12 border-b border-white/5">
                   <div className="flex items-center gap-8">
                      <div className="w-20 h-20 rounded-none bg-gold-400 text-black flex items-center justify-center shadow-2xl">
                        <Layers size={32} strokeWidth={1.5} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-gold-400 uppercase tracking-[0.6em] opacity-40">FILTRADO_POR_CATEGORÍA</p>
                        <h2 className="text-5xl font-light uppercase tracking-tighter text-white leading-none">
                          {activeCategory?.nombre_categoria || 'TODOS LOS ACTIVOS'}
                        </h2>
                      </div>
                   </div>
                   <div className="text-right">
                    <span className="text-[11px] font-black text-white/20 tracking-[0.5em] uppercase">{filteredItems.length} ACTIVOS_DISPONIBLES</span>
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10">
                    {filteredItems.map((item) => {
                        const { main, sub } = formatProductName(item.name);
                        return (
                          <div key={item.id} onClick={() => { setSelectedProduct(item); setQuantity(1); setStepIndex(1); setErrorFeedback(null); }} className="group relative cursor-pointer border border-white/5 bg-white/[0.01] transition-all duration-700 hover:border-gold-400/40 hover:bg-white/[0.03] p-12 rounded-none flex flex-col items-center overflow-hidden shadow-xl">
                              <div className="w-40 h-40 mb-10 flex items-center justify-center relative overflow-hidden rounded-none bg-white/[0.02] border border-white/5">
                                 <img 
                                   src={getProductImage(item.portada_url || item.icono_url)} 
                                   className="w-full h-full object-cover relative z-10 transition-all duration-1000 group-hover:scale-110 group-hover:brightness-110" 
                                   alt={item.name}
                                   onError={(e) => {
                                     (e.target as HTMLImageElement).src = '/icon-192.png';
                                     (e.target as HTMLImageElement).className = "w-12 h-12 opacity-10 object-contain";
                                   }}
                                 />
                              </div>
                              <div className="text-center w-full space-y-8">
                                  <div className="min-h-[60px] flex flex-col justify-center">
                                    <h3 className="text-xl font-light text-white uppercase tracking-tighter leading-tight mb-2 group-hover:text-gold-400 transition-colors">{main}</h3>
                                    {sub && <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.5em] italic">{sub}</p>}
                                  </div>
                                  <div className="flex flex-col gap-3 items-center pt-8 border-t border-white/5">
                                      <p className="text-3xl font-light text-gold-400 tracking-tighter">RD$ {(item.precio_mercado || 0).toLocaleString()}</p>
                                      <p className="text-[8px] text-white/10 uppercase font-black tracking-[0.6em]">VALOR_MERCADO_ACTUAL</p>
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
        <>
          <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl overflow-y-auto custom-scrollbar animate-fade-in pt-[env(safe-area-inset-top)]">
              {/* ATMÓSFERA LUMÍNICA ASIMÉTRICA */}
              <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[100vw] h-[50vh] opacity-30"
                     style={{ background: 'radial-gradient(circle at 100% 0%, white 0%, transparent 60%)', filter: 'blur(120px)' }}></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[100vw] h-[60vh] opacity-[0.2]"
                     style={{ background: 'radial-gradient(circle at 50% 100%, #D4AF37 0%, transparent 60%)', filter: 'blur(100px)' }}></div>
              </div>

              <div className="relative z-10 w-full h-[40vh] md:h-[50vh] overflow-hidden">
                  <img 
                    src={getProductImage(selectedProduct.portada_url || selectedProduct.icono_url)} 
                    className="w-full h-full object-cover brightness-[0.3] scale-105" 
                    alt={selectedProduct.name} 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent"></div>
                  {(!transactionSuccess && !existingFreeze && !showConfirmModal) && (
                    <button onClick={() => setSelectedProduct(null)} className="absolute top-12 left-12 p-5 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full text-white hover:bg-white hover:text-black transition-all duration-500 z-50 active:scale-90 shadow-2xl">
                      <ArrowLeft size={28} strokeWidth={1.5} />
                    </button>
                  )}
                  <div className="absolute bottom-16 left-12 right-12 max-w-[1400px] mx-auto">
                      <div className="flex items-center gap-4 mb-6">
                          <div className="px-4 py-1.5 bg-gold-400 text-black text-[9px] font-black uppercase tracking-[0.6em]">PROTECCIÓN_GP_ACTIVA</div>
                          <ShieldCheck size={20} className="text-gold-400" />
                      </div>
                      <h2 className="text-7xl md:text-9xl font-extralight text-white uppercase tracking-tighter leading-[0.8]">
                        {formatProductName(selectedProduct.name).main}
                      </h2>
                  </div>
              </div>

              <div className="relative z-10 bg-[#050505] border-t border-white/5 pb-48 min-h-[60vh]">
                  <div className="max-w-4xl mx-auto relative z-10 p-10 md:p-24">
                      {loading && (
                        <div className="flex flex-col items-center justify-center py-32 space-y-8">
                            <Loader2 className="w-16 h-16 text-gold-400 animate-spin" strokeWidth={1} />
                            <p className="text-[11px] text-gold-400 font-black uppercase tracking-[0.8em] animate-pulse">Sincronizando Nodo Maestro...</p>
                        </div>
                      )}

                      {(!loading && (transactionSuccess || existingFreeze)) && (
                        <div className="animate-enter-screen space-y-16 py-12">
                           <div className={`w-24 h-24 ${transactionSuccess ? 'bg-green-500' : 'bg-gold-400'} text-black rounded-none flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(212,175,55,0.2)] mb-16`}><BadgeCheck size={48} strokeWidth={1.5} /></div>
                           <div className="text-center mb-20 space-y-4">
                              <h2 className="text-5xl font-light uppercase text-white tracking-tighter leading-none">
                                {transactionSuccess ? 'BLINDAJE ACTIVADO' : 'ACTIVO PROTEGIDO'}
                              </h2>
                              <p className="text-[10px] font-black tracking-[0.8em] text-gold-400 uppercase italic opacity-60">
                                {transactionSuccess ? 'CERTIFICADO_TÉCNICO_GENERADO' : 'ESTADO: VIGENTE_Y_ASEGURADO'}
                              </p>
                           </div>

                           <div className="bg-white/[0.01] border border-white/5 p-12 space-y-12 shadow-2xl relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none"><ShieldCheck size={150} strokeWidth={0.5} /></div>
                              <div className="space-y-4 relative z-10">
                                  <p className="text-[8px] text-white/20 uppercase tracking-[0.8em] font-black border-b border-white/5 pb-4">ACTIVO_CONGELADO_EN_RED</p>
                                  <h3 className="text-4xl font-light text-white uppercase tracking-tighter leading-none">{selectedProduct.name}</h3>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-10 border-t border-white/5 relative z-10">
                                 <div className="space-y-2">
                                    <p className="text-[7px] text-white/20 uppercase font-black tracking-widest">CANTIDAD</p>
                                    <p className="text-lg font-black text-white">{detailData.cantidad} <span className="text-[9px] opacity-40">UNID.</span></p>
                                 </div>
                                 <div className="space-y-2">
                                    <p className="text-[7px] text-white/20 uppercase font-black tracking-widest">TAMAÑO</p>
                                    <p className="text-lg font-black text-white uppercase">{selectedProduct.escala_tamano || 'MEDIANO'}</p>
                                 </div>
                                 <div className="space-y-2">
                                    <p className="text-[7px] text-white/20 uppercase font-black tracking-widest">MEDIDA</p>
                                    <p className="text-lg font-black text-white">{selectedProduct.valor_medida} <span className="text-[9px] opacity-40">{selectedProduct.detalle_unidad}</span></p>
                                 </div>
                                 <div className="space-y-2">
                                    <p className="text-[7px] text-gold-400 uppercase font-black tracking-widest">PLAZO</p>
                                    <p className="text-lg font-black text-gold-400">{detailData.plazoDias} <span className="text-[9px] opacity-40">DÍAS</span></p>
                                 </div>
                              </div>

                              <div className="pt-10 border-t border-white/5 flex justify-between items-end relative z-10">
                                 <div className="space-y-2">
                                    <p className="text-[7px] text-white/20 uppercase font-black tracking-widest">DÉBITO TOTAL EN BÓVEDA</p>
                                    <p className="text-4xl font-light text-gold-400 tracking-tighter">{Math.round(detailData.totalOperacion).toLocaleString()} <span className="text-sm">GP</span></p>
                                 </div>
                                 <div className="text-right space-y-2">
                                    <p className="text-[7px] text-green-500 uppercase font-black tracking-widest">AHORRO_PROYECTADO_RD</p>
                                    <p className="text-3xl font-light text-green-500 tracking-tighter">RD$ {Math.round(detailData.ahorroTotalEstimated).toLocaleString()}</p>
                                 </div>
                              </div>
                           </div>

                           <div className="pt-12">
                              <button onClick={() => { setSelectedProduct(null); setTransactionSuccess(false); navigate('/dashboard'); }} className="w-full py-8 bg-white text-black font-black uppercase tracking-[0.6em] text-[11px] rounded-none shadow-2xl active:scale-95 transition-all duration-500 hover:bg-gold-400">REGRESAR_A_BÓVEDA_CENTRAL</button>
                           </div>
                        </div>
                      )}

                      {(!loading && !transactionSuccess && !existingFreeze) && (
                        <div className="space-y-16">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 opacity-20">
                                    <div className="w-8 h-[1px] bg-white"></div>
                                    <span className="text-[8px] font-black uppercase tracking-[0.6em]">ESPECIFICACIONES_DEL_ACTIVO</span>
                                </div>
                                <p className="text-lg text-white/40 font-light leading-relaxed max-w-2xl">
                                    {selectedProduct.descripcion || "Este activo cumple con los protocolos de calidad y seguridad del ecosistema Golden Socio."}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 border-y border-white/5 py-16">
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.6em]">VALOR_CONGELADO_UNITARIO</p>
                                        <div className="flex items-baseline gap-4">
                                            <span className={`text-7xl font-light tracking-tighter ${detailData.themeColor}`}>
                                                {Math.round(detailData.precioCongeladoUnitario || 0).toLocaleString()}
                                            </span>
                                            <span className="text-xl text-white/20 font-light uppercase">GP</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[7px] text-white/10 uppercase tracking-widest font-black">PRECIO_MERCADO</p>
                                            <p className="text-xl font-light text-white/10 line-through">RD$ {(detailData.precioMercadoUnitario || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="px-4 py-1.5 bg-green-500/10 border border-green-500/20 text-green-500 text-[9px] font-black uppercase tracking-widest">
                                            AHORRO_{detailData.ahorroPct}%
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.6em]">CANTIDAD_ADQUISICIÓN</span>
                                            <span className="text-xl font-light text-white tracking-tighter">{quantity} UNIDADES</span>
                                        </div>
                                        <div className="flex items-center justify-between border border-white/10 bg-white/[0.01] p-1 h-14 rounded-none">
                                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-14 h-full hover:bg-white/5 text-white/20 flex items-center justify-center transition-all active:scale-90"><Minus size={18} strokeWidth={1.5}/></button>
                                            <div className="h-6 w-[1px] bg-white/5"></div>
                                            <button onClick={() => quantity < (selectedProduct.stock_disponible || 99) && setQuantity(quantity + 1)} className="w-14 h-full hover:bg-white/5 text-white/20 flex items-center justify-center transition-all active:scale-90"><Plus size={18} strokeWidth={1.5}/></button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.6em]">PLAZO_DE_CONGELACIÓN</span>
                                            <span className="text-xl font-light text-gold-400 tracking-tighter">{waitDays} DÍAS</span>
                                        </div>
                                        <div className="h-20 flex flex-col justify-center px-6 bg-white/[0.01] border border-white/10 rounded-none">
                                            <input type="range" min="0" max="4" step="1" value={stepIndex} onChange={(e) => setStepIndex(parseInt(e.target.value))} className="w-full h-1 bg-white/10 appearance-none accent-gold-400 cursor-pointer" />
                                            <div className="flex justify-between mt-4 text-[8px] text-white/10 font-black uppercase tracking-widest">
                                                {STEPS.map(s => <span key={s} className={waitDays === s ? 'text-gold-400' : ''}>{s}D</span>)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 space-y-12">
                                <div className="p-12 bg-white/[0.01] border border-white/5 rounded-none space-y-8 shadow-2xl">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.8em]">DÉBITO_TOTAL_EN_BÓVEDA</p>
                                        <p className="text-5xl font-light text-white tracking-tighter leading-none">{Math.round(detailData.totalOperacion || 0).toLocaleString()} <span className="text-lg">GP</span></p>
                                    </div>
                                    <div className="h-[1px] bg-white/5"></div>
                                    <div className="flex justify-between items-end">
                                        <p className="text-[9px] text-green-500 font-black uppercase tracking-[0.8em]">AHORRO_CONSOLIDADO_ESTIMADO</p>
                                        <p className="text-4xl font-light text-green-500 tracking-tighter leading-none">+ RD$ {Math.round(detailData.ahorroTotalEstimated || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                                
                                {errorFeedback && (
                                  <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-none flex items-start gap-6 animate-shake">
                                     <AlertTriangle size={24} strokeWidth={1.5} className="text-red-500 shrink-0 mt-1" />
                                     <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-red-500 leading-tight">RECHAZO_DE_PROTOCOLO</p>
                                        <p className="text-[9px] text-red-500/60 uppercase mt-2 leading-relaxed tracking-widest">{errorFeedback}</p>
                                     </div>
                                  </div>
                                )}

                                <div className="space-y-6">
                                    <button 
                                      onClick={() => setShowConfirmModal(true)} 
                                      disabled={isProcessing || detailData.isOutOfStock || existingFreeze || !user?.membership_tier || (user?.points_balance || 0) < (detailData?.totalOperacion || 0)} 
                                      className={`w-full py-8 font-black uppercase tracking-[0.8em] text-[11px] transition-all duration-500 flex items-center justify-center gap-6 active:scale-95 rounded-none shadow-2xl ${
                                        isProcessing || detailData.isOutOfStock || existingFreeze || !user?.membership_tier || (user?.points_balance || 0) < (detailData?.totalOperacion || 0)
                                        ? "bg-white/5 text-white/20 border border-white/10 cursor-not-allowed"
                                        : "bg-white text-black hover:bg-gold-400"
                                      }`}
                                    >
                                       {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <><Lock size={20} /> ACTIVAR_PROTECCIÓN</>}
                                    </button>
                                    
                                    {((user?.points_balance || 0) < (detailData?.totalOperacion || 0) && !isProcessing) && (
                                        <button 
                                          onClick={() => navigate('/wallet')}
                                          className="w-full py-6 bg-white/[0.02] border border-white/10 text-white font-black uppercase text-[10px] tracking-[0.5em] transition-all duration-500 flex items-center justify-center gap-4 hover:bg-white hover:text-black active:scale-95 shadow-xl rounded-none"
                                        >
                                          RECARGAR_BÓVEDA_CENTRAL
                                        </button>
                                    )}
                                </div>
                                <p className="text-center text-[8px] text-white/10 uppercase tracking-[0.6em] font-black leading-loose px-12">Al ejecutar esta acción, el Nodo Maestro debitará el saldo y blindará el activo bajo los términos del contrato inteligente.</p>
                            </div>
                        </div>
                      )}
                    </div>
                </div>
            </div>
          </>
      )}

      {showConfirmModal && (
            <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-[#0A0A0A] border border-gold-400/30 w-full max-w-md p-6 md:p-8 space-y-6 shadow-[0_0_80px_rgba(212,175,55,0.15)] relative">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none"><ShieldCheck size={100} /></div>
                
                <div className="space-y-1 relative z-10">
                  <p className="text-[7px] text-gold-400 font-black uppercase tracking-[0.5em]">PRE_CONFIRMACIÓN</p>
                  <h3 className="text-xl md:text-2xl font-heading font-black text-white uppercase tracking-tighter leading-none">
                    {formatProductName(selectedProduct.name).main}
                  </h3>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-4">
                    <div className="space-y-0.5">
                      <p className="text-[6px] text-gray-600 uppercase font-black">MERCADO</p>
                      <p className="text-xs font-mono text-white/30 line-through">RD$ {detailData.precioMercadoUnitario.toLocaleString()}</p>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <p className="text-[6px] text-gold-400 uppercase font-black">CONGELADO</p>
                      <p className="text-base font-mono font-black text-gold-400">{Math.round(detailData.precioCongeladoUnitario).toLocaleString()} GP</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[6px] text-green-500 uppercase font-black">AHORRO</p>
                      <p className="text-base font-mono font-black text-green-500">-{detailData.ahorroPct}%</p>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <p className="text-[6px] text-gray-600 uppercase font-black">CANTIDAD</p>
                      <p className="text-base font-mono font-black text-white">{quantity} UNID.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[8px] uppercase tracking-wider">
                    <div className="space-y-1">
                      <p className="text-gray-600 font-bold">CONGELACIÓN</p>
                      <p className="text-white font-black">{new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-gold-400 font-bold">DESCONGELACIÓN</p>
                      <p className="text-gold-400 font-black">{new Date(Date.now() + waitDays * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-white/[0.02] border border-white/5">
                    <p className="text-[9px] text-gray-400 font-light leading-snug line-clamp-2">
                      {selectedProduct.descripcion || "Activo protegido bajo estándares Golden."}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button 
                      onClick={() => {
                        setShowConfirmModal(false);
                        handleFreezePrice();
                      }}
                      className="w-full py-4 bg-gold-400 text-black font-black uppercase tracking-[0.3em] text-[9px] hover:bg-white transition-all active:scale-95"
                    >
                      CONFIRMAR Y CONGELAR
                    </button>
                    <button 
                      onClick={() => setShowConfirmModal(false)}
                      className="w-full py-3 bg-transparent text-gray-500 font-black uppercase tracking-[0.2em] text-[8px] hover:text-white transition-all"
                    >
                      CANCELAR
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}
    </div>
  );
};

export default Market;
