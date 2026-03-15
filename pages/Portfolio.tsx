import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { 
  Snowflake, Clock, Search, Loader2, Package,
  Calendar, ShieldCheck, Banknote, ArrowRight,
  ChevronRight, Info, Truck, X, Hash, MapPin, User as UserIcon,
  CheckCircle2, History, Inbox, ShoppingBag, Map, Phone, Home, Building
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'congelados' | 'disponibles' | 'historial';

export const Portfolio: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('congelados');
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  
  // Checkout States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'method' | 'address' | 'confirm'>('method');
  const [deliveryMethod, setDeliveryMethod] = useState<'domicilio' | 'retiro' | null>(null);
  const [deliveryCost, setDeliveryCost] = useState(200);
  const [isProcessing, setIsProcessing] = useState(false);
  const [addressSource, setAddressSource] = useState<'perfil' | 'alternativa'>('perfil');
  const [notificarWhatsapp, setNotificarWhatsapp] = useState(true);
  
  // Address Form
  const [addressForm, setAddressForm] = useState({
    ciudad: '',
    sector: '',
    calle: '',
    casa_numero: '',
    telefono_contacto: '',
    horario_preferido: '',
    referencias: ''
  });

  // Pre-llenar formulario cuando se abre el checkout o cambia la fuente
  useEffect(() => {
    if (showCheckoutModal && user) {
      if (addressSource === 'perfil') {
        setAddressForm(prev => ({
          ...prev,
          ciudad: user.sector || '',
          sector: user.sector || '',
          calle: user.address_street || '',
          casa_numero: user.address_number || '',
          telefono_contacto: user.phone || ''
        }));
      } else if (addressSource === 'alternativa') {
        const alt = user.direccion_alternativa;
        if (alt) {
          setAddressForm(prev => ({
            ...prev,
            ciudad: alt.ciudad || '',
            sector: alt.sector || '',
            calle: alt.calle || '',
            casa_numero: alt.casa_numero || '',
            telefono_contacto: alt.telefono_contacto || user.phone || '',
            referencias: alt.referencias || ''
          }));
        } else {
          // Si no hay alternativa, empezamos limpio pero con el teléfono del usuario
          setAddressForm(prev => ({
            ...prev,
            ciudad: '',
            sector: '',
            calle: '',
            casa_numero: '',
            telefono_contacto: user.phone || '',
            referencias: ''
          }));
        }
      }
    }
  }, [showCheckoutModal, user, addressSource]);

  const fetchAssets = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const userEmail = user.email.toLowerCase().trim();
      const { data, error } = await supabase
        .from('golden_congelados')
        .select('*')
        .eq('socio_email', userEmail)
        .order('fecha_inicio', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
      if (data && data.length > 0) {
        console.log("CONEXIÓN EXITOSA: Datos de golden_congelados recuperados.");
      }
    } catch (err) {
      console.error("Error fetching portfolio:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogisticsConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion_marca')
        .select('monto_envio_defecto')
        .eq('app_target', 'entregas')
        .maybeSingle();
      
      if (data && !error) {
        setDeliveryCost(data.monto_envio_defecto || 0);
      }
    } catch (e) {
      console.warn("Error fetching logistics config:", e);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
    fetchLogisticsConfig();
  }, [user?.email, fetchLogisticsConfig]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const availableIds = filteredAssets
      .filter(a => !(a.solicitud_id && a.estado_entrega === 'en_camino'))
      .map(a => a.id);
    
    if (selectedIds.length === availableIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(availableIds);
    }
  };

  const selectedAssets = assets.filter(a => selectedIds.includes(a.id));
  const totalSelectedValue = selectedAssets.reduce((acc, curr) => acc + (Number(curr.precio_congelado) || 0), 0);

  // Validar metodos permitidos
  const allowedMethods = selectedAssets.length > 0 ? {
    delivery: selectedAssets.every(a => a.metodo_permitido === 'delivery' || a.metodo_permitido === 'ambos'),
    retiro: selectedAssets.every(a => a.metodo_permitido === 'retiro' || a.metodo_permitido === 'ambos')
  } : { delivery: false, retiro: false };

  const [effectiveDeliveryCost, setEffectiveDeliveryCost] = useState(200);

  const obtenerCostoEnvio = useCallback(async (solicitudId?: string) => {
    try {
      // 1. Intentar obtener el costo personalizado de la solicitud actual (si existe solicitudId)
      if (solicitudId) {
        const { data: solicitud } = await supabase
          .from('solicitudes_escaneo')
          .select('costo_envio_personalizado')
          .eq('id', solicitudId)
          .maybeSingle();

        if (solicitud?.costo_envio_personalizado > 0) {
          console.log("Usando costo personalizado definido por admin");
          return solicitud.costo_envio_personalizado;
        }
      }

      // 2. Si el anterior es nulo o 0, buscar el costo por defecto en la marca
      const { data: config } = await supabase
        .from('configuracion_marca')
        .select('monto_envio_defecto')
        .eq('app_target', 'entregas')
        .maybeSingle();

      console.log("Usando costo por defecto de configuración de marca");
      return config?.monto_envio_defecto || 200.00; // 200 como último recurso de seguridad
    } catch (e) {
      console.warn("Error calculando costo envío:", e);
      return 200.00;
    }
  }, []);

  // Recalcular costo cuando cambian los seleccionados o el método
  useEffect(() => {
    const updateCost = async () => {
      if (deliveryMethod === 'domicilio' && selectedIds.length > 0) {
        const firstAsset = assets.find(a => a.id === selectedIds[0]);
        // Intentamos obtener el ID de la solicitud de escaneo original
        const solicitudId = firstAsset?.solicitud_escaneo_id || firstAsset?.escaneo_id;
        const cost = await obtenerCostoEnvio(solicitudId);
        setEffectiveDeliveryCost(cost);
      } else {
        setEffectiveDeliveryCost(0);
      }
    };
    updateCost();
  }, [selectedIds, deliveryMethod, assets, obtenerCostoEnvio]);

  const handleCheckout = async () => {
    if (!user?.email || selectedIds.length === 0) return;
    
    // Costo de productos es 0 según requerimiento. Solo se cobra logística si es domicilio.
    const totalCost = (deliveryMethod === 'domicilio' ? effectiveDeliveryCost : 0);
    
    // Verificar saldo disponible (vault_balance)
    const availableBalance = user.vault_balance ?? 0;

    if (availableBalance < totalCost) {
      alert(`SALDO INSUFICIENTE PARA EL ENVÍO. COSTO: ${totalCost} GP | DISPONIBLE: ${availableBalance} GP`);
      return;
    }

    setIsProcessing(true);

    try {
      // 0. Si usó dirección alternativa, actualizar el perfil del usuario para guardarla
      if (deliveryMethod === 'domicilio' && addressSource === 'alternativa') {
        await supabase
          .from('perfiles')
          .update({ direccion_alternativa: addressForm })
          .eq('id', user.id);
      }

      // 1. Crear registro en solicitudes_entrega
      const { data: requestData, error: requestError } = await supabase
        .from('solicitudes_entrega')
        .insert({
          socio_email: user.email,
          metodo: deliveryMethod,
          productos_ids: selectedIds[0], // Solo enviamos el ID del producto (el primero seleccionado)
          estado_solicitud: 'pendiente',
          costo_delivery: deliveryMethod === 'domicilio' ? 200.00 : 0, // Inicia con el valor base 200.00
          calle: addressForm.calle,
          sector: addressForm.sector,
          casa_numero: addressForm.casa_numero,
          ciudad: addressForm.ciudad,
          telefono_contacto: addressForm.telefono_contacto,
          notificar_whatsapp: notificarWhatsapp
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // 3. Descontar saldo si hay costo de envío
      if (totalCost > 0) {
        // Registrar en mi_saldo
        await supabase.from('mi_saldo').insert({
          socio_email: user.email,
          monto: -totalCost,
          concepto: `LOGÍSTICA: ${deliveryMethod === 'domicilio' ? 'DELIVERY' : 'RETIRO'}`
        });

        // Actualizar perfil
        const newBalance = availableBalance - totalCost;
        await supabase.from('perfiles').update({
          vault_balance: newBalance
        }).eq('id', user.id);
      }

      alert("SOLICITUD PROCESADA CON ÉXITO.");
      setShowCheckoutModal(false);
      setSelectedIds([]);
      fetchAssets();
    } catch (err) {
      console.error("Error processing checkout:", err);
      alert("FALLO AL PROCESAR SOLICITUD.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.nombre_producto?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Normalizar fechas para comparar solo el día (sin horas)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expirationDate = new Date(asset.fecha_vencimiento);
    expirationDate.setHours(0, 0, 0, 0);
    
    // "Antes que hoy" significa que la fecha de vencimiento es estrictamente menor a hoy
    const isExpired = expirationDate < today;
    
    if (activeTab === 'congelados') {
      // Si vence hoy o en el futuro, sigue congelado
      return matchesSearch && !isExpired && asset.estado === 'en_proceso' && !asset.solicitud_id;
    }
    if (activeTab === 'disponibles') {
      // Solo si ya venció (antes de hoy) y no ha sido entregado aún
      return matchesSearch && isExpired && asset.estado === 'en_proceso';
    }
    if (activeTab === 'historial') {
      return matchesSearch && asset.estado === 'entregado';
    }
    return false;
  });

  const handleRequestDelivery = async (assetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
      fetchAssets();
    } catch (err) {
      console.error("Error requesting delivery:", err);
      alert("FALLO AL SOLICITAR ENTREGA.");
    } finally {
      setLoading(false);
    }
  };

  const AssetDetailModal = ({ asset, onClose }: { asset: any, onClose: () => void }) => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar relative shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8 md:p-12 space-y-10">
          <div className="space-y-2">
            <p className="text-[10px] text-gold-400 font-black uppercase tracking-[0.5em]">DETALLE_DE_ACTIVO</p>
            <h2 className="text-3xl md:text-5xl font-heading font-black text-white uppercase tracking-tighter leading-none">
              {asset.nombre_producto}
            </h2>
            <div className={`inline-block px-3 py-1 border text-[8px] font-black tracking-[0.2em] mt-4 ${
              asset.estado === 'en_proceso' ? 'text-amber-400 border-amber-400/20 bg-amber-400/5' : 'text-green-400 border-green-400/20 bg-green-400/5'
            }`}>
              {asset.estado === 'en_proceso' ? 'CONGELADO' : 'ENTREGADO'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10 border-y border-white/5">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Hash size={16} className="text-gold-400 shrink-0 mt-1" />
                <div>
                  <p className="text-[8px] text-gray-600 uppercase tracking-widest font-bold mb-1">Ticket ID</p>
                  <p className="text-sm font-mono text-white">{asset.ticket_id || asset.id.slice(0,12)}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Package size={16} className="text-gold-400 shrink-0 mt-1" />
                <div>
                  <p className="text-[8px] text-gray-600 uppercase tracking-widest font-bold mb-1">Cantidad y Medida</p>
                  <p className="text-sm text-white">{asset.cantidad} {asset.detalle_unidad} ({asset.valor_medida})</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Banknote size={16} className="text-gold-400 shrink-0 mt-1" />
                <div>
                  <p className="text-[8px] text-gray-600 uppercase tracking-widest font-bold mb-1">Precio Congelado</p>
                  <p className="text-sm font-mono text-white">{Number(asset.precio_congelado).toLocaleString()} GP</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Calendar size={16} className="text-gold-400 shrink-0 mt-1" />
                <div>
                  <p className="text-[8px] text-gray-600 uppercase tracking-widest font-bold mb-1">Fecha de Inicio</p>
                  <p className="text-sm text-white">{new Date(asset.fecha_inicio).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock size={16} className="text-gold-400 shrink-0 mt-1" />
                <div>
                  <p className="text-[8px] text-gray-600 uppercase tracking-widest font-bold mb-1">Vencimiento</p>
                  <p className="text-sm text-white">{new Date(asset.fecha_vencimiento).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin size={16} className="text-gold-400 shrink-0 mt-1" />
                <div>
                  <p className="text-[8px] text-gray-600 uppercase tracking-widest font-bold mb-1">Nodo Asignado</p>
                  <p className="text-sm text-white">ID_{asset.negocio_id_asignado?.slice(0,8)}</p>
                </div>
              </div>
            </div>
          </div>

          {asset.descripcion_producto && (
            <div className="space-y-4">
              <p className="text-[8px] text-gray-600 uppercase tracking-widest font-bold flex items-center gap-2">
                <Info size={12} /> Descripción Técnica
              </p>
              <p className="text-xs text-gray-400 leading-relaxed uppercase tracking-wider">
                {asset.descripcion_producto}
              </p>
            </div>
          )}

          {asset.solicitud_id && (
            <div className={`p-6 border flex items-center gap-4 ${
              asset.estado_entrega === 'en_camino' 
                ? 'bg-blue-500/5 border-blue-500/10' 
                : 'bg-gold-400/5 border-gold-400/10'
            }`}>
              <Truck size={18} className={asset.estado_entrega === 'en_camino' ? 'text-blue-400' : 'text-gold-400'} />
              <div>
                <p className={`text-[8px] uppercase tracking-widest font-bold ${
                  asset.estado_entrega === 'en_camino' ? 'text-blue-400/60' : 'text-gold-400/60'
                }`}>
                  Estado de Entrega ({asset.metodo_entrega || 'N/A'})
                </p>
                <p className={`text-xs font-mono ${
                  asset.estado_entrega === 'en_camino' ? 'text-blue-400' : 'text-gold-400'
                }`}>
                  {asset.estado_entrega === 'en_camino' 
                    ? `EN CAMINO - ${asset.entregado_por || 'REPARTIDOR ASIGNADO'}` 
                    : 'SOLICITUD PENDIENTE'}
                </p>
              </div>
            </div>
          )}

          {asset.entregado_por && asset.estado === 'entregado' && (
            <div className="p-6 bg-green-500/5 border border-green-500/10 flex items-center gap-4">
              <UserIcon size={18} className="text-green-400" />
              <div>
                <p className="text-[8px] text-green-400/60 uppercase tracking-widest font-bold">Entregado por Repartidor</p>
                <p className="text-xs text-green-400 font-mono">{asset.entregado_por}</p>
              </div>
            </div>
          )}

          <div className="pt-6">
            <button 
              onClick={onClose}
              className="w-full py-5 bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all"
            >
              CERRAR DETALLES
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-transparent text-white relative font-heading text-left selection:bg-gold-400 selection:text-black flex flex-col overflow-hidden">
      
      {/* ATMÓSFERA LUMÍNICA GLOBAL */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[80vw] h-[50vh] opacity-40"
               style={{ background: 'radial-gradient(circle at 0% 0%, white 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
          <div className="absolute bottom-0 right-0 w-[70vw] h-[60vh] opacity-[0.15]"
               style={{ background: 'radial-gradient(circle at 100% 100%, #D4AF37 0%, transparent 60%)', filter: 'blur(100px)' }}></div>
      </div>

      <header className="pt-[env(safe-area-inset-top)] px-4 md:px-12 border-b border-white/5 z-40 backdrop-blur-3xl bg-black/60 shrink-0">
          <div className="max-w-[1400px] mx-auto pb-4 md:pb-6 pt-4 md:pt-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 md:gap-8">
                  <div className="flex items-center gap-4">
                      <div className="space-y-1">
                          <p className="text-[7px] md:text-[8px] text-gold-400 font-normal uppercase tracking-[0.4em] md:tracking-[0.6em]">ADMINISTRACIÓN_DE_ACTIVOS</p>
                          <h1 className="font-heading text-2xl md:text-5xl text-white tracking-tighter uppercase leading-none font-normal">MI <span className="text-gold-metallic">PORTAFOLIO</span></h1>
                      </div>
                  </div>
                  <div className="relative w-full lg:w-96 group">
                      <Search size={14} className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-gray-700" />
                      <input 
                        type="text" 
                        placeholder="BUSCAR EN PORTAFOLIO..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 md:pl-12 pr-4 md:pr-6 py-3 md:py-4 bg-white/5 border border-white/5 rounded-none text-[9px] md:text-[10px] font-normal uppercase tracking-[0.2em] md:tracking-[0.3em] focus:border-gold-400 outline-none text-white placeholder:text-gray-800" 
                      />
                  </div>
              </div>
          </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col relative z-10">
          {/* TABS ELEGANTES */}
          <div className="px-4 md:px-12 py-4 md:py-8 shrink-0">
            <div className="max-w-[1400px] mx-auto flex items-center justify-center border-b border-white/5">
              {(['congelados', 'disponibles', 'historial'] as const).map((tab, index, array) => (
                <React.Fragment key={tab}>
                  <button
                    onClick={() => {
                      setActiveTab(tab);
                      setSelectedIds([]);
                    }}
                    className={`flex-1 max-w-[160px] py-3 md:py-4 text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] transition-all relative ${
                      activeTab === tab ? 'text-gold-400' : 'text-gray-600 hover:text-white'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold-400"
                      />
                    )}
                  </button>
                  {index < array.length - 1 && (
                    <span className="text-white/10 font-light px-1 md:px-2">|</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* BARRA DE ACCIONES MASIVAS - DISEÑO MINIMALISTA Y ELEGANTE */}
            {activeTab === 'disponibles' && filteredAssets.length > 0 && (
              <div className="max-w-[1400px] mx-auto mt-4 md:mt-8 flex flex-col md:flex-row items-start md:items-center justify-between animate-fade-in border-b border-white/5 pb-4 md:pb-6 px-2 gap-4">
                <div className="flex items-center gap-6 md:gap-10">
                  <button 
                    onClick={handleSelectAll}
                    className="group flex items-center gap-3 md:gap-4 transition-all"
                  >
                    <div className={`w-4 h-4 md:w-5 md:h-5 border flex items-center justify-center transition-all rounded-sm ${
                      selectedIds.length === filteredAssets.length ? 'bg-gold-400 border-gold-400' : 'border-white/10 group-hover:border-gold-400/30'
                    }`}>
                      {selectedIds.length === filteredAssets.length && <CheckCircle2 size={10} className="text-black" />}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-white/40 group-hover:text-white transition-colors">
                        {selectedIds.length === filteredAssets.length ? 'DESELECCIONAR' : 'SELECCIONAR TODO'}
                      </span>
                      {selectedIds.length > 0 && (
                        <span className="text-[6px] md:text-[7px] text-gold-400 font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] mt-0.5">
                          {selectedIds.length} ACTIVOS MARCADOS
                        </span>
                      )}
                    </div>
                  </button>
                </div>
                
                {selectedIds.length > 0 && (
                  <button 
                    onClick={() => {
                      setCheckoutStep('method');
                      setShowCheckoutModal(true);
                    }}
                    className="w-full md:w-auto flex items-center justify-between md:justify-start gap-4 text-gold-400 hover:text-white transition-all group bg-gold-400/5 px-4 md:px-6 py-3 border border-gold-400/20 hover:border-gold-400/40"
                  >
                    <div className="text-left md:text-right">
                      <p className="text-[6px] md:text-[7px] text-gold-400/60 font-black uppercase tracking-widest mb-0.5">TOTAL_ESTIMADO</p>
                      <p className="text-[9px] md:text-[10px] font-mono font-black uppercase tracking-widest">{totalSelectedValue.toLocaleString()} GP</p>
                    </div>
                    <div className="h-6 md:h-8 w-[1px] bg-gold-400/20 mx-1 md:mx-2"></div>
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">GESTIONAR SALIDA</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar px-6 lg:px-12 pb-40">
              <div className="max-w-[1400px] mx-auto">
                  {loading ? (
                    <div className="space-y-4">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="h-16 bg-white/[0.02] border border-white/5 animate-pulse"></div>
                      ))}
                    </div>
                  ) : filteredAssets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center space-y-10 py-16 animate-fade-in">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-gray-800 border border-white/5">
                            {activeTab === 'congelados' ? <Snowflake size={40} strokeWidth={1} /> : 
                             activeTab === 'disponibles' ? <Inbox size={40} strokeWidth={1} /> : 
                             <History size={40} strokeWidth={1} />}
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-heading font-normal uppercase tracking-[0.1em] text-white">
                              {activeTab === 'congelados' ? 'Sin Activos Congelados' : 
                               activeTab === 'disponibles' ? 'Sin Activos Disponibles' : 
                               'Historial Vacío'}
                            </h3>
                            <p className="text-[10px] text-gray-600 uppercase tracking-[0.4em] max-w-xs mx-auto leading-relaxed">
                              No se encontraron registros en esta categoría.
                            </p>
                        </div>
                        {activeTab === 'congelados' && (
                          <button 
                            onClick={() => navigate('/market')}
                            className="px-12 py-5 bg-gold-400 text-black text-[11px] font-black uppercase tracking-[0.5em] hover:bg-white transition-all active:scale-95 shadow-md"
                          >
                            IR AL MARKET
                          </button>
                        )}
                    </div>
                  ) : (
                    <div className="space-y-2 animate-fade-in">
                        {filteredAssets.map((asset) => (
                          <div 
                            key={asset.id}
                            onClick={() => {
                              if (activeTab === 'disponibles') {
                                // Bloqueo: Si ya tiene solicitud y está en camino, no se puede seleccionar
                                if (asset.solicitud_id && asset.estado_entrega === 'en_camino') return;
                                toggleSelection(asset.id);
                              } else {
                                setSelectedAsset(asset);
                              }
                            }}
                            className={`group flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 bg-white/[0.02] border transition-all cursor-pointer relative overflow-hidden gap-4 ${
                              selectedIds.includes(asset.id) ? 'border-white/30 bg-white/5' : 'border-white/5 hover:bg-white/[0.05] hover:border-gold-400/20'
                            } ${asset.solicitud_id && asset.estado_entrega === 'en_camino' ? 'cursor-not-allowed opacity-80' : ''}`}
                          >
                            <div className="flex items-start md:items-center gap-4 md:gap-6 flex-1 min-w-0">
                              <div className="text-gold-400 shrink-0 mt-1 md:mt-0">
                                {selectedIds.includes(asset.id) ? (
                                  <ShieldCheck size={18} className="text-white" />
                                ) : (
                                  asset.estado === 'en_proceso' ? <Snowflake size={18} /> : <CheckCircle2 size={18} className="text-green-400" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                  <h3 className="text-xs md:text-sm font-heading font-bold text-white uppercase tracking-wider group-hover:text-gold-metallic transition-all break-words">
                                    {asset.nombre_producto}
                                  </h3>
                                  
                                  {/* ETIQUETAS DE ESTADO DE SOLICITUD */}
                                  {asset.solicitud_id && (
                                    <div className={`px-2 py-0.5 text-[6px] md:text-[7px] font-black uppercase tracking-widest border ${
                                      asset.estado_entrega === 'en_camino' 
                                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                                        : 'bg-gold-400/10 border-gold-400/30 text-gold-400'
                                    }`}>
                                      {asset.estado_entrega === 'en_camino' 
                                        ? `EN CAMINO` 
                                        : 'SOLICITADO'}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col mt-1 md:mt-2 gap-0.5 md:gap-1">
                                  <p className="text-[7px] md:text-[8px] text-gray-600 uppercase tracking-widest font-bold">
                                    {asset.cantidad} {asset.detalle_unidad} • ID_{asset.ticket_id || asset.id.slice(0,8)}
                                  </p>
                                  <p className="text-[9px] md:text-[10px] font-mono font-black text-gold-400">
                                    {Number(asset.precio_congelado).toLocaleString()} GP
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8 shrink-0 border-t border-white/5 pt-3 md:pt-0 md:border-t-0">
                              <div className="text-left md:text-right">
                                <p className="text-[6px] md:text-[7px] text-gray-800 font-black uppercase tracking-widest mb-0.5 md:mb-1">REGISTRO</p>
                                <p className="text-[9px] md:text-[10px] font-mono text-gray-400">{new Date(asset.fecha_inicio).toLocaleDateString()}</p>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {activeTab === 'disponibles' && selectedIds.includes(asset.id) && (
                                  <motion.button 
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCheckoutStep('method');
                                      setShowCheckoutModal(true);
                                    }}
                                    className="px-4 md:px-6 py-2 md:py-3 bg-white text-black text-[8px] md:text-[9px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] hover:bg-gold-400 transition-all flex items-center gap-2"
                                  >
                                    GESTIONAR
                                    <ArrowRight size={10} />
                                  </motion.button>
                                )}
                                
                                {!selectedIds.includes(asset.id) && (
                                  <ChevronRight size={16} className="text-gray-800 group-hover:text-gold-400 transition-all" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
              </div>
          </div>
      </div>

      {/* MODALES */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAsset(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 lg:p-12 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#050505] w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-2xl border-0 md:border border-white/10 relative overflow-hidden flex flex-col"
            >
              {/* ATMÓSFERA LUMÍNICA INTERNA (Standard) */}
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                  <div className="absolute -top-[10%] -left-[10%] w-[100%] h-[100%] opacity-40"
                       style={{ background: 'radial-gradient(circle at 0% 0%, white 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
                  <div className="absolute -bottom-[10%] -right-[10%] w-[100%] h-[100%] opacity-[0.15]"
                       style={{ background: 'radial-gradient(circle at 100% 100%, #D4AF37 0%, transparent 60%)', filter: 'blur(100px)' }}></div>
              </div>

              <button 
                onClick={() => setSelectedAsset(null)}
                className="absolute top-4 md:top-6 right-4 md:right-6 text-gray-500 hover:text-white transition-colors z-50 p-2"
              >
                <X size={24} />
              </button>

              <div className="p-6 md:p-12 space-y-6 md:space-y-8 flex-1 overflow-y-auto no-scrollbar relative z-10 pb-20 md:pb-12">
                <div className="space-y-2 pt-8 md:pt-0">
                  <p className="text-[8px] md:text-[10px] text-gold-400 font-black uppercase tracking-[0.3em] md:tracking-[0.5em]">DETALLES_DEL_ACTIVO</p>
                  <h2 className="text-2xl md:text-3xl font-heading font-black text-white uppercase tracking-tighter leading-none">
                    {selectedAsset.nombre_producto}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-4">
                    <div className="aspect-square bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                      {selectedAsset.image_url ? (
                        <img src={selectedAsset.image_url} alt={selectedAsset.nombre_producto} className="w-full h-full object-cover" />
                      ) : (
                        <Snowflake size={48} className="text-gold-400/20" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 border border-white/5 text-left">
                        <p className="text-[7px] text-gray-500 uppercase font-black tracking-widest mb-1">CANTIDAD</p>
                        <p className="text-xs text-white font-black uppercase">{selectedAsset.cantidad} {selectedAsset.detalle_unidad}</p>
                      </div>
                      <div className="bg-white/5 p-4 border border-white/5 text-left">
                        <p className="text-[7px] text-gray-500 uppercase font-black tracking-widest mb-1">VALOR</p>
                        <p className="text-xs text-gold-400 font-black uppercase">{Number(selectedAsset.precio_congelado).toLocaleString()} GP</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <p className="text-[8px] text-gray-600 uppercase font-bold tracking-widest">TICKET ID</p>
                        <p className="text-[10px] font-mono text-white">#{selectedAsset.ticket_id || selectedAsset.id.slice(0,8)}</p>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <p className="text-[8px] text-gray-600 uppercase font-bold tracking-widest">FECHA REGISTRO</p>
                        <p className="text-[10px] font-mono text-white">{new Date(selectedAsset.fecha_inicio).toLocaleDateString()}</p>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <p className="text-[8px] text-gray-600 uppercase font-bold tracking-widest">ESTADO</p>
                        <p className="text-[10px] font-black uppercase text-gold-400">{selectedAsset.estado}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => setSelectedAsset(null)}
                    className="w-full py-4 bg-white/5 border border-white/10 text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all"
                  >
                    CERRAR
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {showCheckoutModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCheckoutModal(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 lg:p-12 bg-black/95 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#050505] w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-2xl border-0 md:border border-white/10 relative overflow-hidden flex flex-col"
            >
              {/* ATMÓSFERA LUMÍNICA INTERNA (Standard) */}
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                  <div className="absolute -top-[10%] -left-[10%] w-[100%] h-[100%] opacity-40"
                       style={{ background: 'radial-gradient(circle at 0% 0%, white 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
                  <div className="absolute -bottom-[10%] -right-[10%] w-[100%] h-[100%] opacity-[0.15]"
                       style={{ background: 'radial-gradient(circle at 100% 100%, #D4AF37 0%, transparent 60%)', filter: 'blur(100px)' }}></div>
              </div>

              <button 
                onClick={() => setShowCheckoutModal(false)}
                className="absolute top-4 md:top-6 right-4 md:right-6 text-gray-500 hover:text-white transition-colors z-50 p-2"
              >
                <X size={24} />
              </button>

              <div className="p-6 md:p-12 space-y-6 md:space-y-8 flex-1 overflow-y-auto no-scrollbar relative z-10 pb-32 md:pb-12">
                <div className="space-y-2 pt-8 md:pt-0">
                  <p className="text-[8px] md:text-[10px] text-gold-400 font-black uppercase tracking-[0.3em] md:tracking-[0.5em]">PROCESO_DE_SALIDA</p>
                  <h2 className="text-2xl md:text-3xl font-heading font-black text-white uppercase tracking-tighter leading-none">
                    {checkoutStep === 'method' ? 'MÉTODO DE ENTREGA' : 
                     checkoutStep === 'address' ? 'DIRECCIÓN DE ENVÍO' : 'CONFIRMACIÓN'}
                  </h2>
                </div>

                {checkoutStep === 'method' && (
                  <div className="grid grid-cols-1 gap-3 md:gap-4 py-2 md:py-4">
                    <button 
                      disabled={!allowedMethods.retiro}
                      onClick={() => {
                        setDeliveryMethod('retiro');
                        setCheckoutStep('confirm');
                      }}
                      className={`p-4 md:p-6 border flex items-center gap-4 md:gap-6 transition-all text-left ${
                        !allowedMethods.retiro ? 'opacity-30 grayscale cursor-not-allowed border-white/5' : 'border-white/10 hover:border-gold-400 bg-white/5'
                      }`}
                    >
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 flex items-center justify-center text-gold-400 shrink-0">
                        <Building size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest">RETIRO LOCAL</p>
                        <p className="text-[7px] md:text-[8px] text-gray-500 uppercase mt-1">RECOGER EN EL NODO ASIGNADO (SIN COSTO)</p>
                      </div>
                    </button>

                    <button 
                      disabled={!allowedMethods.delivery}
                      onClick={() => {
                        setDeliveryMethod('domicilio');
                        setCheckoutStep('address');
                      }}
                      className={`p-4 md:p-6 border flex items-center gap-4 md:gap-6 transition-all text-left ${
                        !allowedMethods.delivery ? 'opacity-30 grayscale cursor-not-allowed border-white/5' : 'border-white/10 hover:border-gold-400 bg-white/5'
                      }`}
                    >
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 flex items-center justify-center text-gold-400 shrink-0">
                        <Truck size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest">DELIVERY A DOMICILIO</p>
                        <p className="text-[7px] md:text-[8px] text-gray-500 uppercase mt-1">ENVÍO DIRECTO A TU UBICACIÓN (+{deliveryCost} GP)</p>
                      </div>
                    </button>
                    
                    {!allowedMethods.delivery && !allowedMethods.retiro && (
                      <p className="text-[7px] md:text-[8px] text-red-400 uppercase tracking-widest text-center">
                        LOS PRODUCTOS SELECCIONADOS TIENEN RESTRICCIONES DE ENTREGA INCOMPATIBLES.
                      </p>
                    )}
                  </div>
                )}

                {checkoutStep === 'address' && (
                  <div className="space-y-6 py-2 md:py-4">
                    {/* SELECTOR DE ORIGEN */}
                    <div className="space-y-3">
                      <p className="text-[7px] md:text-[8px] text-gold-400 font-black uppercase tracking-widest">Seleccionar Origen</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setAddressSource('perfil')}
                          className={`flex-1 py-3 text-[7px] md:text-[8px] font-black uppercase tracking-widest border transition-all ${
                            addressSource === 'perfil' ? 'bg-gold-400 text-black border-gold-400' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20'
                          }`}
                        >
                          Perfil
                        </button>
                        <button 
                          onClick={() => setAddressSource('alternativa')}
                          className={`flex-1 py-3 text-[7px] md:text-[8px] font-black uppercase tracking-widest border transition-all ${
                            addressSource === 'alternativa' ? 'bg-gold-400 text-black border-gold-400' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20'
                          }`}
                        >
                          Alternativa
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[7px] md:text-[8px] text-gray-600 uppercase font-bold tracking-widest">Provincia / Ciudad</label>
                          <input 
                            type="text"
                            disabled={addressSource === 'perfil'}
                            value={addressForm.ciudad}
                            onChange={e => setAddressForm({...addressForm, ciudad: e.target.value})}
                            className={`w-full bg-white/5 border border-white/10 p-3 text-[9px] md:text-[10px] text-white outline-none focus:border-gold-400 ${addressSource === 'perfil' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            placeholder="EJ: SANTO DOMINGO"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[7px] md:text-[8px] text-gray-600 uppercase font-bold tracking-widest">Sector</label>
                          <input 
                            type="text"
                            disabled={addressSource === 'perfil'}
                            value={addressForm.sector}
                            onChange={e => setAddressForm({...addressForm, sector: e.target.value})}
                            className={`w-full bg-white/5 border border-white/10 p-3 text-[9px] md:text-[10px] text-white outline-none focus:border-gold-400 ${addressSource === 'perfil' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            placeholder="EJ: PIANTINI"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[7px] md:text-[8px] text-gray-600 uppercase font-bold tracking-widest">Calle (REQUERIDO)</label>
                        <input 
                          type="text"
                          disabled={addressSource === 'perfil'}
                          value={addressForm.calle}
                          onChange={e => setAddressForm({...addressForm, calle: e.target.value})}
                          className={`w-full bg-white/5 border border-white/10 p-3 text-[9px] md:text-[10px] text-white outline-none focus:border-gold-400 ${addressSource === 'perfil' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          placeholder="EJ: AV. WINSTON CHURCHILL"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[7px] md:text-[8px] text-gray-600 uppercase font-bold tracking-widest">Número</label>
                          <input 
                            type="text"
                            disabled={addressSource === 'perfil'}
                            value={addressForm.casa_numero}
                            onChange={e => setAddressForm({...addressForm, casa_numero: e.target.value})}
                            className={`w-full bg-white/5 border border-white/10 p-3 text-[9px] md:text-[10px] text-white outline-none focus:border-gold-400 ${addressSource === 'perfil' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            placeholder="EJ: 12B"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[7px] md:text-[8px] text-gray-600 uppercase font-bold tracking-widest">Teléfono</label>
                          <input 
                            type="text"
                            disabled={addressSource === 'perfil'}
                            value={addressForm.telefono_contacto}
                            onChange={e => setAddressForm({...addressForm, telefono_contacto: e.target.value})}
                            className={`w-full bg-white/5 border border-white/10 p-3 text-[9px] md:text-[10px] text-white outline-none focus:border-gold-400 ${addressSource === 'perfil' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            placeholder="809-000-0000"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[7px] md:text-[8px] text-gray-600 uppercase font-bold tracking-widest">Referencias (OPCIONAL)</label>
                        <input 
                          type="text"
                          disabled={addressSource === 'perfil'}
                          value={addressForm.referencias}
                          onChange={e => setAddressForm({...addressForm, referencias: e.target.value})}
                          className={`w-full bg-white/5 border border-white/10 p-3 text-[9px] md:text-[10px] text-white outline-none focus:border-gold-400 ${addressSource === 'perfil' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          placeholder="EJ: FRENTE AL PARQUE"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[7px] md:text-[8px] text-gray-600 uppercase font-bold tracking-widest">Horario Preferido</label>
                        <select 
                          value={addressForm.horario_preferido}
                          onChange={e => setAddressForm({...addressForm, horario_preferido: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 p-3 text-[9px] md:text-[10px] text-white outline-none focus:border-gold-400 appearance-none"
                        >
                          <option value="" className="bg-black">SELECCIONAR HORARIO</option>
                          <option value="mañana" className="bg-black">MAÑANA (8AM - 12PM)</option>
                          <option value="tarde" className="bg-black">TARDE (12PM - 5PM)</option>
                          <option value="noche" className="bg-black">NOCHE (5PM - 8PM)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <button 
                        onClick={() => setCheckoutStep('confirm')}
                        className="w-full py-5 bg-gold-400 text-black text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white transition-all active:scale-95"
                      >
                        CONTINUAR A CONFIRMACIÓN
                      </button>
                    </div>
                  </div>
                )}

                {checkoutStep === 'confirm' && (
                  <div className="space-y-6 py-2 md:py-4">
                    <div className="bg-white/5 border border-white/10 p-4 md:p-6 space-y-4 md:space-y-6">
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <p className="text-[8px] md:text-[10px] text-gray-500 uppercase font-bold tracking-widest">MÉTODO</p>
                        <p className="text-[10px] md:text-xs text-gold-400 font-black uppercase tracking-widest">{deliveryMethod === 'domicilio' ? 'DELIVERY' : 'RETIRO'}</p>
                      </div>
                      
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <p className="text-[8px] md:text-[10px] text-gray-500 uppercase font-bold tracking-widest">MERCANCÍA</p>
                        <p className="text-[10px] md:text-xs text-white font-black uppercase tracking-widest">0.00 GP</p>
                      </div>

                      <div className="flex flex-col border-b border-white/5 pb-4 gap-2">
                        <div className="flex justify-between items-center">
                          <p className="text-[8px] md:text-[10px] text-gray-500 uppercase font-bold tracking-widest">ENVÍO</p>
                          <p className="text-[10px] md:text-xs text-white font-black uppercase tracking-widest">
                            {deliveryMethod === 'domicilio' ? `A partir de $200.00 GP` : '0.00 GP'}
                          </p>
                        </div>
                        {deliveryMethod === 'domicilio' && (
                          <p className="text-[7px] text-gray-500 uppercase font-bold text-right">
                            El monto final se define después por el admin.
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <p className="text-[10px] md:text-xs text-white font-black uppercase tracking-widest">TOTAL A PAGAR</p>
                        <p className="text-xl md:text-2xl text-gold-400 font-black uppercase tracking-tighter">
                          {(deliveryMethod === 'domicilio' ? effectiveDeliveryCost : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} GP
                        </p>
                      </div>
                    </div>

                    <div className="px-4 md:px-6">
                      <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                        <input 
                          type="checkbox" 
                          id="whatsapp-notify"
                          checked={notificarWhatsapp}
                          onChange={(e) => setNotificarWhatsapp(e.target.checked)}
                          className="w-4 h-4 rounded border-white/10 bg-white/5 text-gold-400 focus:ring-gold-400"
                        />
                        <label htmlFor="whatsapp-notify" className="text-[9px] text-white/60 uppercase font-bold tracking-widest cursor-pointer">
                          Recibir confirmación y monto final por WhatsApp
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={handleCheckout}
                        disabled={isProcessing}
                        className="w-full py-5 bg-gold-400 text-black text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white transition-all active:scale-95 flex items-center justify-center gap-3"
                      >
                        {isProcessing ? <Loader2 className="animate-spin" size={16} /> : 'CONFIRMAR Y PROCESAR SALIDA'}
                      </button>

                      <button 
                        onClick={() => setCheckoutStep(deliveryMethod === 'domicilio' ? 'address' : 'method')}
                        className="w-full py-4 bg-white/5 border border-white/10 text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all"
                      >
                        VOLVER ATRÁS
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
