import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { 
  Snowflake, Clock, Search, Loader2, Package,
  Calendar, ShieldCheck, Banknote, ArrowRight, AlertCircle,
  ChevronRight, Info, Truck, X, Hash, MapPin, User as UserIcon, Settings, MessageSquare, MessageCircle,
  CheckCircle2, History, Inbox, ShoppingBag, Phone, Home, Building, Lock, Star, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'congelados' | 'disponibles' | 'historial';
type SubTabType = 'todos' | 'en_proceso' | 'aprobado' | 'en_ruta';

// --- SUB-COMPONENTS (EXTRACTED TO PREVENT REMOUNTING) ---

const RatingModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isSubmitting 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSubmit: (rating: number, comment: string) => void,
  isSubmitting: boolean
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl"
    >
      <div className="max-w-md w-full bg-[#050505] border border-white/10 p-10 md:p-12 space-y-10 relative overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
        <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none"><Star size={120} /></div>
        
        <div className="space-y-3 relative z-10">
          <p className="text-[8px] text-gold-400 font-black uppercase tracking-[0.4em]">CALIFICACIÓN_OBLIGATORIA</p>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight">VALORA TU EXPERIENCIA</h2>
          <p className="text-[10px] text-white/30 uppercase tracking-widest leading-relaxed">Su opinión es fundamental para mantener el estándar de calidad Golden.</p>
        </div>

        <div className="flex justify-center gap-4 relative z-10">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`transition-all duration-300 transform hover:scale-125 ${rating >= star ? 'text-gold-400 scale-110' : 'text-white/10'}`}
            >
              <Star size={32} fill={rating >= star ? 'currentColor' : 'none'} strokeWidth={1.5} />
            </button>
          ))}
        </div>

        <div className="space-y-3 relative z-10">
          <label className="text-[7px] text-gray-600 uppercase font-black tracking-widest">COMENTARIOS_ADICIONALES (OPCIONAL)</label>
          <textarea 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/5 p-4 text-[10px] text-white outline-none focus:border-gold-400/40 transition-all min-h-[100px] resize-none uppercase"
            placeholder="ESCRIBA AQUÍ SU RESEÑA..."
          />
        </div>

        <div className="flex flex-col gap-3 relative z-10">
          <button 
            onClick={() => rating > 0 && onSubmit(rating, comment)}
            disabled={rating === 0 || isSubmitting}
            className={`w-full py-6 text-[11px] font-black uppercase tracking-[0.5em] transition-all duration-500 active:scale-95 flex items-center justify-center gap-4 shadow-2xl ${
              rating === 0 || isSubmitting ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gold-400 text-black hover:bg-white'
            }`}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'CONFIRMAR_Y_DESBLOQUEAR_PIN'}
          </button>
          <button 
            onClick={onClose}
            className="w-full py-3 bg-transparent text-white/20 text-[9px] font-black uppercase tracking-[0.3em] hover:text-white transition-all"
          >
            CANCELAR
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const FloatingDeliveryBar = ({ request, onClick }: { request: any, onClick: () => void }) => {
  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      onClick={onClick}
      className="bg-blue-600 text-white p-3 rounded-2xl shadow-[0_20px_40px_rgba(37,99,235,0.4)] border border-white/20 flex items-center justify-between cursor-pointer group backdrop-blur-md pointer-events-auto"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
          <motion.div
            animate={{ x: [0, 3, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <Truck size={22} className="text-white" />
          </motion.div>
        </div>
        <div className="flex flex-col">
          <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white/50 mb-0.5">LOGÍSTICA_EN_MOVIMIENTO</span>
          <h4 className="text-[10px] font-black uppercase tracking-tight leading-tight">
            PEDIDO EN CAMINO <span className="text-white/40 mx-1">•</span> {request.nombre_repartidor || 'REPARTIDOR'}
          </h4>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="h-8 w-[1px] bg-white/10"></div>
        <button className="px-5 py-2.5 bg-white text-blue-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg shadow-lg group-hover:bg-gold-400 group-hover:text-black transition-all active:scale-95">
          VER
        </button>
      </div>
    </motion.div>
  );
};

const SemaforoStatus = ({ 
  request, 
  isCompletionNotice = false, 
  setCompletedRequest,
  onReceiveOrder,
  pinRevealed,
  onRefresh
}: { 
  request: any, 
  isCompletionNotice?: boolean, 
  setCompletedRequest: (val: any) => void,
  onReceiveOrder?: () => void,
  pinRevealed?: boolean,
  onRefresh?: () => void
}) => {
  const [showPreferences, setShowPreferences] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const togglePreference = async (field: string, currentVal: boolean) => {
    if (!request.id_pedido_maestro) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('entregas_maestras')
        .update({ [field]: !currentVal })
        .eq('id_pedido', request.id_pedido_maestro);
      
      if (error) throw error;
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error updating preferences:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const statusConfig = {
    pendiente: { color: 'bg-red-500', textColor: 'text-red-300', icon: <Loader2 className="animate-spin" />, title: 'PENDIENTE' },
    preparando: { color: 'bg-gold-400', textColor: 'text-gold-900', icon: <Package />, title: 'APROBADO' },
    listo: { color: 'bg-yellow-500', textColor: 'text-yellow-900', icon: <CheckCircle2 />, title: 'LISTO' },
    en_camino: { 
      color: 'bg-blue-600', 
      textColor: 'text-blue-100', 
      icon: (
        <motion.div
          animate={{ x: [0, 5, 0], y: [0, -2, 0] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          <Truck size={32} />
        </motion.div>
      ), 
      title: 'EN CAMINO' 
    },
    entregado: { color: 'bg-green-500', textColor: 'text-green-300', icon: <ShieldCheck />, title: 'ENTREGADO' }
  };

  const state = isCompletionNotice ? 'entregado' : request.estado_solicitud;
  const current = statusConfig[state as keyof typeof statusConfig] || statusConfig.pendiente;

  const whatsappLink = `https://wa.me/${request.telefono_repartidor?.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, soy tu socio de Golden Acceso, te escribo por mi pedido...')}`;

  return (
    <div className="max-w-[1400px] mx-auto mt-8 p-8 md:p-12 bg-white/[0.02] border border-white/5 backdrop-blur-3xl relative overflow-hidden group">
      {/* Background Glow for Status */}
      <div className={`absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-5 blur-[100px] transition-all duration-1000 ${current.color}`}></div>

      <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 relative z-10">
        <div className={`w-20 h-20 md:w-28 md:h-28 rounded-3xl flex items-center justify-center ${current.color} text-black shadow-[0_20px_50px_rgba(0,0,0,0.3)] shrink-0 transition-all duration-500`}>
          {typeof current.icon === 'object' && 'type' in (current.icon as any) ? React.cloneElement(current.icon as React.ReactElement, { size: 36, strokeWidth: 2 }) : current.icon}
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-3">
          <div className="space-y-1">
            <p className="text-[9px] font-black tracking-[0.5em] text-gold-400 uppercase opacity-60">{current.title}_SISTEMA</p>
            <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white leading-none">
              {isCompletionNotice ? 'ACTIVO ENTREGADO' : 
               state === 'en_camino' ? 'LOGÍSTICA EN MOVIMIENTO' : 
               state === 'listo' ? 'LISTO PARA DESPACHO' : 
               state === 'preparando' ? 'ORDEN CONFIRMADA' : 'VERIFICANDO SOLICITUD'}
            </h3>
          </div>

          {state === 'preparando' && !isCompletionNotice && (
            <p className="text-gold-400/40 text-[9px] font-black uppercase tracking-[0.2em] animate-pulse">
              PROTOCOLO DE SEGURIDAD APROBADO. PREPARANDO UNIDADES.
            </p>
          )}

          {['preparando', 'listo', 'en_camino'].includes(state) && (
            <div className="mt-6 space-y-4">
              <div className="p-6 bg-blue-500/[0.08] border border-blue-500/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-5">
                  <div className="relative group/photo">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg overflow-hidden border border-white/10">
                      {request.foto_repartidor ? (
                        <img src={request.foto_repartidor} alt="Repartidor" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={28} />
                      )}
                    </div>
                    <button 
                      onClick={() => setShowPreferences(!showPreferences)}
                      className="absolute -bottom-2 -right-2 w-8 h-8 bg-black border border-white/10 rounded-full flex items-center justify-center text-gold-400 hover:text-white transition-colors shadow-xl z-20"
                      title="Preferencias de Contacto"
                    >
                      <Settings size={14} className={showPreferences ? 'animate-spin-slow' : ''} />
                    </button>
                  </div>
                  <div>
                    <p className="text-[8px] text-blue-400 font-black uppercase tracking-widest mb-1">OPERADOR_ASIGNADO</p>
                    <p className="text-base font-black text-white uppercase tracking-tight">{request.nombre_repartidor || 'REPARTIDOR_GOLDEN'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {request.llamada_directa_activa && (
                    <a 
                      href={`tel:${request.telefono_repartidor}`}
                      className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-blue-600 hover:border-blue-500 transition-all active:scale-95"
                      title="Llamada Directa"
                    >
                      <Phone size={20} />
                    </a>
                  )}
                  {request.whatsapp_activo && (
                    <a 
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-[#25D366] hover:border-[#25D366] transition-all active:scale-95"
                      title="WhatsApp"
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </a>
                  )}
                  {request.chat_interno_activo && (
                    <button 
                      className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-gold-400 hover:text-black hover:border-gold-400 transition-all active:scale-95"
                      title="Chat Interno"
                    >
                      <MessageSquare size={20} />
                    </button>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {showPreferences && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 bg-black/40 border border-white/5 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                        <div className="flex items-center gap-3">
                          <MessageSquare size={14} className="text-gold-400" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Chat Interno</span>
                        </div>
                        <button 
                          disabled={isUpdating}
                          onClick={() => togglePreference('chat_interno_activo', request.chat_interno_activo)}
                          className={`w-10 h-5 rounded-full transition-all relative ${request.chat_interno_activo ? 'bg-gold-400' : 'bg-white/10'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${request.chat_interno_activo ? 'left-6' : 'left-1'}`}></div>
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Phone size={14} className="text-gold-400" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Llamada</span>
                        </div>
                        <button 
                          disabled={isUpdating}
                          onClick={() => togglePreference('llamada_directa_activa', request.llamada_directa_activa)}
                          className={`w-10 h-5 rounded-full transition-all relative ${request.llamada_directa_activa ? 'bg-gold-400' : 'bg-white/10'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${request.llamada_directa_activa ? 'left-6' : 'left-1'}`}></div>
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                        <div className="flex items-center gap-3">
                          <MessageCircle size={14} className="text-gold-400" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-white/60">WhatsApp</span>
                        </div>
                        <button 
                          disabled={isUpdating}
                          onClick={() => togglePreference('whatsapp_activo', request.whatsapp_activo)}
                          className={`w-10 h-5 rounded-full transition-all relative ${request.whatsapp_activo ? 'bg-gold-400' : 'bg-white/10'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${request.whatsapp_activo ? 'left-6' : 'left-1'}`}></div>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {request.token_entrega && state !== 'entregado' && (
            <div className="mt-8 flex flex-col md:flex-row items-center gap-8">
              {pinRevealed ? (
                <div className="inline-flex flex-col md:flex-row items-center gap-8 bg-white/[0.03] border border-white/10 p-6 md:p-8">
                  <div className="space-y-1">
                    <p className="text-[9px] text-gold-400 font-black uppercase tracking-[0.4em]">TOKEN_VALIDACIÓN</p>
                    <p className="text-4xl md:text-6xl font-mono font-black text-white tracking-[0.2em] leading-none">{request.token_entrega}</p>
                  </div>
                  <div className="h-12 w-[1px] bg-white/10 hidden md:block"></div>
                  <p className="text-[8px] text-white/30 uppercase font-black tracking-widest max-w-[200px] leading-relaxed text-center md:text-left">
                    MUESTRE ESTE CÓDIGO AL REPARTIDOR PARA FINALIZAR LA ENTREGA.
                  </p>
                </div>
              ) : (
                <div className="w-full flex flex-col md:flex-row items-center gap-6">
                  <button 
                    onClick={onReceiveOrder}
                    className="w-full md:w-auto px-12 py-6 bg-gold-400 text-black font-black text-[11px] uppercase tracking-[0.5em] hover:bg-white transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-4"
                  >
                    <CheckCircle2 size={18} /> RECIBIR PEDIDO
                  </button>
                  <div className="flex items-center gap-3 opacity-30">
                    <Lock size={14} className="text-gold-400" />
                    <p className="text-[8px] font-black uppercase tracking-widest">PIN BLOQUEADO HASTA CALIFICAR</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {isCompletionNotice && (
          <button 
            onClick={() => setCompletedRequest(null)} 
            className="w-full md:w-auto px-12 py-6 bg-white text-black font-black text-[11px] uppercase tracking-[0.5em] hover:bg-gold-400 transition-all active:scale-95 shadow-2xl"
          >
            CONFIRMAR_LECTURA
          </button>
        )}
      </div>
    </div>
  );
};

const AssetDetailModal = ({ asset, onClose, allRequests }: { asset: any, onClose: () => void, allRequests: any[] }) => {
  const request = allRequests.find(r => r.productos_ids?.some((p: any) => String(p.id || p) === String(asset.id)));
  const isEnCamino = request?.estado_solicitud === 'en_camino';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 lg:p-12 bg-black/98 backdrop-blur-3xl"
    >
      <motion.div 
        initial={{ scale: 0.98, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0, y: 30 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#050505] w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-3xl border-0 md:border border-white/10 relative overflow-hidden flex flex-col shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
      >
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-[20%] -left-[20%] w-[100%] h-[100%] opacity-20"
                 style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)', filter: 'blur(100px)' }}></div>
            <div className="absolute -bottom-[20%] -right-[20%] w-[100%] h-[100%] opacity-[0.1]"
                 style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', filter: 'blur(120px)' }}></div>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-white/20 hover:text-gold-400 transition-all z-50 p-2 hover:scale-110 active:scale-90"
        >
          <X size={28} strokeWidth={1.5} />
        </button>

        <div className="p-6 md:p-12 space-y-8 md:space-y-10 flex-1 overflow-y-auto custom-scrollbar relative z-10 pb-24 md:pb-16">
          <div className="space-y-2 pt-6 md:pt-0">
            <div className="flex items-center gap-3 opacity-30">
              <div className="w-4 h-[1px] bg-gold-400"></div>
              <span className="text-[7px] font-black uppercase tracking-[0.4em] text-white">
                {isEnCamino ? 'LOGÍSTICA_ACTIVA' : 'ESPECIFICACIONES_TÉCNICAS'}
              </span>
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter leading-tight">
              {asset.nombre_producto}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div className="space-y-6">
              <div className="aspect-square bg-white/[0.02] border border-white/5 flex items-center justify-center overflow-hidden relative group rounded-sm">
                <div className="absolute inset-0 bg-gold-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                {asset.image_url ? (
                  <img src={asset.image_url} alt={asset.nombre_producto} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" referrerPolicy="no-referrer" />
                ) : (
                  <Package size={60} strokeWidth={0.5} className="text-gold-400/10" />
                )}
              </div>
              
              <div className="p-4 bg-white/[0.01] border border-white/5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Activity size={10} className="text-gold-400/50" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">ESTADO_DEL_ACTIVO</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${new Date(asset.fecha_vencimiento) <= new Date() ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-gold-400 shadow-[0_0_8px_rgba(212,175,55,0.3)]'}`}></div>
                  <p className="text-sm font-black uppercase tracking-tight text-white">
                    {isEnCamino ? 'EN TRÁNSITO' : new Date(asset.fecha_vencimiento) <= new Date() ? 'LIBERADO' : 'CONGELADO'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[7px] text-gray-600 uppercase font-black tracking-[0.4em]">CANTIDAD</p>
                  <p className="text-lg text-white font-black uppercase tracking-tight">{asset.cantidad} <span className="text-[9px] text-white/30">{asset.detalle_unidad}</span></p>
                </div>
                <div className="space-y-1">
                  <p className="text-[7px] text-gray-600 uppercase font-black tracking-[0.4em]">VALORACIÓN</p>
                  <p className="text-lg text-gold-400 font-black font-mono tracking-tight">{Math.round(Number(asset.precio_congelado)).toLocaleString()} <span className="text-[9px] opacity-40">GP</span></p>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-white/5">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[7px] text-gray-700 uppercase font-black tracking-widest">TICKET_ID</p>
                    <p className="text-[10px] font-mono text-white/60">#{asset.ticket_id || asset.id.slice(0,12).toUpperCase()}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[7px] text-gray-700 uppercase font-black tracking-widest">REGISTRO</p>
                    <p className="text-[10px] font-mono text-white/60">{new Date(asset.fecha_inicio).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</p>
                  </div>
                </div>

                <div className="p-5 bg-gold-400/[0.03] border border-gold-400/10 flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[7px] text-gold-400 font-black uppercase tracking-widest">LIBERACIÓN_PROGRAMADA</p>
                    <p className="text-lg font-mono font-black text-white tracking-widest">
                      {new Date(asset.fecha_vencimiento).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                    </p>
                  </div>
                  <Calendar size={20} className="text-gold-400/20" />
                </div>
              </div>

              {isEnCamino && request && (
                <div className="p-6 bg-blue-600 text-white space-y-4 shadow-[0_15px_30px_rgba(37,99,235,0.2)]">
                  <div className="flex justify-between items-center border-b border-white/20 pb-3">
                    <div className="flex items-center gap-2">
                      <Lock size={14} />
                      <p className="text-[9px] font-black uppercase tracking-[0.3em]">TOKEN_DE_ENTREGA</p>
                    </div>
                    <p className="text-2xl font-mono font-black tracking-[0.2em]">{request.token_entrega}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/10 flex items-center justify-center rounded-lg">
                      <Truck size={16} />
                    </div>
                    <div>
                      <p className="text-[7px] opacity-60 font-black uppercase tracking-widest">ESTADO_LOGÍSTICO</p>
                      <p className="text-[10px] font-black uppercase tracking-tight">{request.driver_id ? 'OPERADOR EN RUTA' : 'ASIGNANDO TRANSPORTE...'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-white/5">
            <button 
              onClick={onClose}
              className="w-full py-5 bg-white text-black font-black text-[10px] uppercase tracking-[0.4em] hover:bg-gold-400 transition-all active:scale-95 shadow-2xl"
            >
              CERRAR_EXPEDIENTE
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface CheckoutModalProps {
  showCheckoutModal: boolean;
  setShowCheckoutModal: (val: boolean) => void;
  checkoutStep: 'method' | 'address' | 'details' | 'confirm';
  setCheckoutStep: (val: any) => void;
  deliveryMethod: 'domicilio' | 'retiro' | null;
  setDeliveryMethod: (val: any) => void;
  deliveryCost: number;
  addressSource: 'perfil' | 'alternativa';
  setAddressSource: (val: any) => void;
  addressForm: any;
  setAddressForm: (val: any) => void;
  isProcessing: boolean;
  handleCheckout: () => void;
}

const CheckoutModal = ({
  showCheckoutModal,
  setShowCheckoutModal,
  checkoutStep,
  setCheckoutStep,
  deliveryMethod,
  setDeliveryMethod,
  deliveryCost,
  addressSource,
  setAddressSource,
  addressForm,
  setAddressForm,
  isProcessing,
  handleCheckout
}: CheckoutModalProps) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={() => setShowCheckoutModal(false)}
    className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 lg:p-12 bg-black/98 backdrop-blur-3xl"
  >
    <motion.div 
      initial={{ scale: 0.98, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.98, opacity: 0, y: 30 }}
      onClick={e => e.stopPropagation()}
      className="bg-[#050505] w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-3xl border-0 md:border border-white/10 relative overflow-hidden flex flex-col shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[100%] h-[100%] opacity-30"
               style={{ background: 'radial-gradient(circle at 0% 0%, white 0%, transparent 70%)', filter: 'blur(100px)' }}></div>
          <div className="absolute -bottom-[10%] -right-[10%] w-[100%] h-[100%] opacity-[0.1]"
               style={{ background: 'radial-gradient(circle at 100% 100%, #D4AF37 0%, transparent 60%)', filter: 'blur(120px)' }}></div>
      </div>

      <button 
        onClick={() => setShowCheckoutModal(false)}
        className="absolute top-6 right-6 text-white/20 hover:text-gold-400 transition-all z-50 p-2 hover:scale-110 active:scale-90"
      >
        <X size={28} strokeWidth={1.5} />
      </button>

      <div className="p-6 md:p-12 space-y-8 md:space-y-10 flex-1 overflow-y-auto custom-scrollbar relative z-10 pb-32 md:pb-16">
        <div className="space-y-3 pt-6 md:pt-0">
          <div className="flex items-center gap-3 opacity-40">
            <div className="w-4 h-[1px] bg-gold-400"></div>
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white">PROTOCOLO_DE_DESPACHO</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight leading-tight">
            {checkoutStep === 'method' ? 'MÉTODO_ENTREGA' : 
             checkoutStep === 'address' ? 'DIRECCIÓN_ENVÍO' : 
             checkoutStep === 'details' ? 'DETALLES_LOGÍSTICOS' : 'CONFIRMACIÓN_FINAL'}
          </h2>
        </div>

        {checkoutStep === 'method' && (
          <div className="grid grid-cols-1 gap-4 py-2">
            <button 
              onClick={() => {
                setDeliveryMethod('retiro');
                setCheckoutStep('details');
              }}
              className="group p-6 border border-white/5 hover:border-gold-400/50 bg-white/[0.02] hover:bg-white/[0.04] flex items-center gap-6 transition-all duration-500 text-left relative overflow-hidden rounded-sm"
            >
              <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                <Building size={80} strokeWidth={1} />
              </div>
              <div className="w-14 h-14 bg-white/5 group-hover:bg-gold-400 group-hover:text-black flex items-center justify-center text-gold-400 shrink-0 transition-all duration-500 rounded-xl">
                <Building size={24} strokeWidth={1.5} />
              </div>
              <div className="relative z-10">
                <p className="text-[12px] font-black text-white uppercase tracking-[0.2em] group-hover:text-gold-400 transition-colors">RETIRO EN NODO</p>
                <p className="text-[8px] text-white/30 uppercase mt-1 tracking-widest font-bold">RECOGER EN EL CENTRO DE DISTRIBUCIÓN ASIGNADO (RD$ 0.00)</p>
              </div>
            </button>

            <button 
              onClick={() => {
                setDeliveryMethod('domicilio');
                setCheckoutStep('address');
              }}
              className="group p-6 border border-white/5 hover:border-gold-400/50 bg-white/[0.02] hover:bg-white/[0.04] flex items-center gap-6 transition-all duration-500 text-left relative overflow-hidden rounded-sm"
            >
              <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                <Truck size={80} strokeWidth={1} />
              </div>
              <div className="w-14 h-14 bg-white/5 group-hover:bg-gold-400 group-hover:text-black flex items-center justify-center text-gold-400 shrink-0 transition-all duration-500 rounded-xl">
                <Truck size={24} strokeWidth={1.5} />
              </div>
              <div className="relative z-10">
                <p className="text-[12px] font-black text-white uppercase tracking-[0.2em] group-hover:text-gold-400 transition-colors">DELIVERY PREMIUM</p>
                <p className="text-[8px] text-white/30 uppercase mt-1 tracking-widest font-bold">ENVÍO DIRECTO A SU UBICACIÓN REGISTRADA (+{deliveryCost} GP)</p>
              </div>
            </button>
          </div>
        )}

        {checkoutStep === 'address' && (
          <div className="space-y-8 py-2">
            <div className="space-y-3">
              <p className="text-[8px] text-gold-400 font-black uppercase tracking-[0.4em]">ORIGEN_DE_DATOS</p>
              <div className="flex gap-3">
                {(['perfil', 'alternativa'] as const).map(source => (
                  <button 
                    key={source}
                    onClick={() => setAddressSource(source)}
                    className={`flex-1 py-4 text-[9px] font-black uppercase tracking-[0.3em] border transition-all duration-500 rounded-sm ${
                      addressSource === source ? 'bg-gold-400 text-black border-gold-400 shadow-[0_8px_16px_rgba(212,175,55,0.2)]' : 'bg-white/[0.02] text-white/20 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {source === 'perfil' ? 'DATOS_REGISTRADOS' : 'DIRECCIÓN_NUEVA'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[7px] text-gray-600 uppercase font-black tracking-widest">PROVINCIA / CIUDAD</label>
                  <input 
                    type="text"
                    disabled={addressSource === 'perfil'}
                    value={addressForm.ciudad}
                    onChange={e => setAddressForm({...addressForm, ciudad: e.target.value})}
                    className={`w-full bg-white/[0.02] border border-white/5 p-3.5 text-[10px] text-white outline-none focus:border-gold-400/40 transition-all rounded-none ${addressSource === 'perfil' ? 'opacity-40 cursor-not-allowed' : ''}`}
                    placeholder="EJ: SANTO DOMINGO"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[7px] text-gray-600 uppercase font-black tracking-widest">SECTOR</label>
                  <input 
                    type="text"
                    disabled={addressSource === 'perfil'}
                    value={addressForm.sector}
                    onChange={e => setAddressForm({...addressForm, sector: e.target.value})}
                    className={`w-full bg-white/[0.02] border border-white/5 p-3.5 text-[10px] text-white outline-none focus:border-gold-400/40 transition-all rounded-none ${addressSource === 'perfil' ? 'opacity-40 cursor-not-allowed' : ''}`}
                    placeholder="EJ: PIANTINI"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[7px] text-gray-600 uppercase font-black tracking-widest">CALLE_Y_REFERENCIAS</label>
                <input 
                  type="text"
                  disabled={addressSource === 'perfil'}
                  value={addressForm.calle}
                  onChange={e => setAddressForm({...addressForm, calle: e.target.value})}
                  className={`w-full bg-white/[0.02] border border-white/5 p-3.5 text-[10px] text-white outline-none focus:border-gold-400/40 transition-all rounded-none ${addressSource === 'perfil' ? 'opacity-40 cursor-not-allowed' : ''}`}
                  placeholder="EJ: AV. WINSTON CHURCHILL, TORRE GOLDEN"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[7px] text-gray-600 uppercase font-black tracking-widest">NÚMERO_CASA/APTO</label>
                  <input 
                    type="text"
                    disabled={addressSource === 'perfil'}
                    value={addressForm.casa_numero}
                    onChange={e => setAddressForm({...addressForm, casa_numero: e.target.value})}
                    className={`w-full bg-white/[0.02] border border-white/5 p-3.5 text-[10px] text-white outline-none focus:border-gold-400/40 transition-all rounded-none ${addressSource === 'perfil' ? 'opacity-40 cursor-not-allowed' : ''}`}
                    placeholder="EJ: 12B"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[7px] text-gray-600 uppercase font-black tracking-widest">TELÉFONO_CONTACTO</label>
                  <input 
                    type="text"
                    disabled={addressSource === 'perfil'}
                    value={addressForm.telefono_contacto}
                    onChange={e => setAddressForm({...addressForm, telefono_contacto: e.target.value})}
                    className={`w-full bg-white/[0.02] border border-white/5 p-3.5 text-[10px] text-white outline-none focus:border-gold-400/40 transition-all rounded-none ${addressSource === 'perfil' ? 'opacity-40 cursor-not-allowed' : ''}`}
                    placeholder="809-000-0000"
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-white/5">
              <button 
                onClick={() => setCheckoutStep('details')}
                className="w-full py-5 bg-white text-black text-[10px] font-black uppercase tracking-[0.4em] hover:bg-gold-400 transition-all active:scale-95 shadow-2xl rounded-sm"
              >
                CONTINUAR_A_DETALLES
              </button>
            </div>
          </div>
        )}

        {checkoutStep === 'details' && (
          <div className="space-y-8 py-2">
          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[7px] text-gray-600 uppercase font-black tracking-widest">RESPONSABLE_RECEPCIÓN</label>
              <input 
                type="text"
                value={addressForm.quien_recibe}
                onChange={e => setAddressForm({...addressForm, quien_recibe: e.target.value})}
                className="w-full bg-white/[0.02] border border-white/5 p-3.5 text-[10px] text-white outline-none focus:border-gold-400/40 transition-all uppercase rounded-none"
                placeholder="EJ: JUAN PEREZ"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[7px] text-gray-600 uppercase font-black tracking-widest">FECHA_ENTREGA</label>
                <input 
                  type="date"
                  value={addressForm.dia_entrega}
                  onChange={e => setAddressForm({...addressForm, dia_entrega: e.target.value})}
                  className="w-full bg-white/[0.02] border border-white/5 p-3.5 text-[10px] text-white outline-none focus:border-gold-400/40 transition-all rounded-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[7px] text-gray-600 uppercase font-black tracking-widest">VENTANA_HORARIA</label>
                <select 
                  value={addressForm.hora_entrega}
                  onChange={e => setAddressForm({...addressForm, hora_entrega: e.target.value})}
                  className="w-full bg-white/[0.02] border border-white/5 p-3.5 text-[10px] text-white outline-none focus:border-gold-400/40 transition-all rounded-none"
                >
                  <option value="" className="bg-black">SELECCIONAR_HORARIO</option>
                  <option value="08:00 - 10:00" className="bg-black">08:00 AM - 10:00 AM</option>
                  <option value="10:00 - 12:00" className="bg-black">10:00 AM - 12:00 PM</option>
                  <option value="12:00 - 14:00" className="bg-black">12:00 PM - 02:00 PM</option>
                  <option value="14:00 - 16:00" className="bg-black">02:00 PM - 04:00 PM</option>
                  <option value="16:00 - 18:00" className="bg-black">04:00 PM - 06:00 PM</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[7px] text-gray-600 uppercase font-black tracking-widest">MÉTODO_DE_PAGO_LOGÍSTICA</label>
              <div className="grid grid-cols-3 gap-2">
                {['GP', 'EFECTIVO', 'TARJETA'].map(m => (
                  <button 
                    key={m}
                    onClick={() => setAddressForm({...addressForm, metodo_pago: m})}
                    className={`py-3.5 text-[8px] font-black uppercase tracking-[0.3em] border transition-all duration-500 rounded-none ${
                      addressForm.metodo_pago === m ? 'bg-gold-400 text-black border-gold-400 shadow-[0_8px_16px_rgba(212,175,55,0.2)]' : 'bg-white/[0.02] text-white/20 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

            <div className="flex flex-col gap-3 pt-6 border-t border-white/5">
              <button 
                onClick={() => setCheckoutStep('confirm')}
                className="w-full py-5 bg-white text-black text-[10px] font-black uppercase tracking-[0.4em] hover:bg-gold-400 transition-all active:scale-95 shadow-2xl rounded-sm"
              >
                CONTINUAR_A_CONFIRMACIÓN
              </button>
              <button 
                onClick={() => setCheckoutStep(deliveryMethod === 'domicilio' ? 'address' : 'method')}
                className="w-full py-3 bg-transparent text-white/20 text-[9px] font-black uppercase tracking-[0.3em] hover:text-white transition-all"
              >
                VOLVER_ATRÁS
              </button>
            </div>
          </div>
        )}

        {checkoutStep === 'confirm' && (
          <div className="space-y-6 py-2">
            <div className="bg-white/[0.01] border border-white/5 p-6 md:p-8 space-y-6 relative overflow-hidden rounded-none">
              <div className="absolute top-0 right-0 p-4 opacity-[0.01] pointer-events-none"><ShieldCheck size={80} /></div>
              
              <div className="grid grid-cols-2 gap-6 border-b border-white/5 pb-6 relative z-10">
                <div className="space-y-1">
                  <p className="text-[7px] text-gray-700 uppercase font-black tracking-[0.4em]">MODALIDAD</p>
                  <p className="text-[11px] text-gold-400 font-black uppercase tracking-widest">{deliveryMethod === 'domicilio' ? 'DELIVERY_PREMIUM' : 'RETIRO_LOCAL'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[7px] text-gray-700 uppercase font-black tracking-[0.4em]">PAGO_LOGÍSTICA</p>
                  <p className="text-[11px] text-white font-black uppercase tracking-widest">{addressForm.metodo_pago}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 border-b border-white/5 pb-6 relative z-10">
                <div className="space-y-1">
                  <p className="text-[7px] text-gray-700 uppercase font-black tracking-[0.4em]">RECEPTOR</p>
                  <p className="text-[11px] text-white font-black uppercase tracking-widest">{addressForm.quien_recibe}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[7px] text-gray-700 uppercase font-black tracking-[0.4em]">PROGRAMACIÓN</p>
                  <p className="text-[11px] text-white font-black uppercase tracking-widest leading-tight">{addressForm.dia_entrega} <br/> <span className="text-white/30">|</span> {addressForm.hora_entrega}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center border-b border-white/5 pb-6 relative z-10">
                <p className="text-[7px] text-gray-700 uppercase font-black tracking-[0.4em]">CARGO_LOGÍSTICO</p>
                <p className="text-sm text-white font-black font-mono">
                  {deliveryMethod === 'domicilio' ? `${deliveryCost} GP` : '0.00 GP'}
                </p>
              </div>

              <div className="flex justify-between items-end pt-2 relative z-10">
                <div className="space-y-1">
                  <p className="text-[7px] text-gold-400 font-black uppercase tracking-[0.4em]">TOTAL_A_LIQUIDAR</p>
                  <p className="text-[6px] text-white/20 uppercase font-bold tracking-widest">COBRO POR OPERADOR EN DESTINO</p>
                </div>
                <p className="text-3xl md:text-4xl text-gold-400 font-black font-mono tracking-tighter leading-none">
                  {(deliveryMethod === 'domicilio' ? deliveryCost : 0).toLocaleString()} <span className="text-[10px] opacity-40">GP</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button 
                onClick={() => {
                  const commonFields = addressForm.quien_recibe && addressForm.dia_entrega && addressForm.hora_entrega && addressForm.telefono_contacto;
                  const isAddressValid = deliveryMethod === 'domicilio' ? (addressForm.calle && addressForm.ciudad && addressForm.sector) : true;
                  
                  if (!commonFields || !isAddressValid) {
                    alert("POR FAVOR COMPLETE TODOS LOS CAMPOS OBLIGATORIOS (DIRECCIÓN, TELÉFONO, QUIÉN RECIBE, DÍA Y HORA)");
                    return;
                  }
                  handleCheckout();
                }}
                disabled={isProcessing}
                className={`w-full py-6 text-black text-[11px] font-black uppercase tracking-[0.5em] transition-all duration-500 active:scale-95 flex items-center justify-center gap-4 shadow-2xl rounded-sm ${
                  isProcessing ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gold-400 hover:bg-white'
                }`}
              >
                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : 'CONFIRMAR_Y_DESPACHAR'}
              </button>

              <button 
                onClick={() => setCheckoutStep('details')}
                className="w-full py-3 bg-transparent text-white/20 text-[9px] font-black uppercase tracking-[0.3em] hover:text-white transition-all"
              >
                VOLVER_ATRÁS
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  </motion.div>
);

export const Portfolio: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('disponibles');
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('todos');
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [activeDeliveryRequests, setActiveDeliveryRequests] = useState<any[]>([]);
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [completedRequest, setCompletedRequest] = useState<any | null>(null);
  const [isUserApproved, setIsUserApproved] = useState(false);
  const [lockedProductIds, setLockedProductIds] = useState<string[]>([]);
  const [deliveredProductIds, setDeliveredProductIds] = useState<string[]>([]);
  
  const subTabCounts = useMemo(() => {
    const counts = { todos: 0, en_proceso: 0, aprobado: 0, en_ruta: 0 };
    if (activeTab !== 'disponibles') return counts;

    assets.forEach(asset => {
      const matchesSearch = asset.nombre_producto?.toLowerCase().includes(searchTerm.toLowerCase());
      const request = allRequests.find(r => r.productos_ids?.some((p: any) => String(p.id || p) === String(asset.id)));
      const estadoSolicitud = request?.estado_solicitud;
      const isDelivered = estadoSolicitud === 'entregado' || asset.estado === 'entregado';
      const isExpired = asset.fecha_vencimiento && new Date(asset.fecha_vencimiento) <= new Date();
      const isProcessing = ['pendiente', 'preparando', 'listo', 'en_camino', 'aprobado'].includes(estadoSolicitud || '');

      const isAvailableOrActive = (isExpired || isProcessing) && !isDelivered;
      if (matchesSearch && isAvailableOrActive) {
        counts.todos++;
        if (estadoSolicitud === 'pendiente') counts.en_proceso++;
        if (['preparando', 'listo', 'aprobado'].includes(estadoSolicitud || '')) counts.aprobado++;
        if (estadoSolicitud === 'en_camino') counts.en_ruta++;
      }
    });
    return counts;
  }, [assets, allRequests, activeTab, searchTerm]);

  // Checkout States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'method' | 'address' | 'details' | 'confirm'>('method');
  const [deliveryMethod, setDeliveryMethod] = useState<'domicilio' | 'retiro' | null>(null);
  const [deliveryCost, setDeliveryCost] = useState(200);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
    referencias: '',
    quien_recibe: '',
    dia_entrega: '',
    hora_entrega: '',
    metodo_pago: 'GP'
  });

  const [lastInitializedSource, setLastInitializedSource] = useState<string | null>(null);

  // Rating & PIN Reveal States
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [pinRevealed, setPinRevealed] = useState(false);

  const [requestToRate, setRequestToRate] = useState<any | null>(null);

  useEffect(() => {
    if (activeDeliveryRequests.length > 0) {
      setPinRevealed(false);
    }
  }, [activeDeliveryRequests.map(r => r.id_pedido_maestro).join(',')]);

  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!requestToRate) return;
    
    setIsSubmittingRating(true);
    try {
      const { error } = await supabase
        .from('resenas_entregas')
        .insert({
          pedido_id: requestToRate.id_pedido_maestro,
          repartidor_id: requestToRate.operador_id,
          socio_id: user?.id,
          calificacion: rating,
          comentario: comment
        });

      if (error) throw error;

      setPinRevealed(true);
      setShowRatingModal(false);
      setRequestToRate(null);
    } catch (err) {
      console.error("Error submitting rating:", err);
      alert("Error al enviar la calificación. Por favor, intente de nuevo.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  useEffect(() => {
    if (!showCheckoutModal) {
      setLastInitializedSource(null);
      return;
    }

    if (showCheckoutModal && user && lastInitializedSource !== addressSource) {
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
        }
      }
      setLastInitializedSource(addressSource);
    }
  }, [showCheckoutModal, user, addressSource, lastInitializedSource]);

  const fetchAssets = async (force = false, silent = false) => {
    if (!user?.email) return;
    // REGLA: No actualizar si estamos en modo captura de datos (modal abierto) o procesando
    if (!force && (showCheckoutModal || isProcessing)) return;

    if (!silent && assets.length === 0) setLoading(true);
    try {
      const userEmail = user.email.toLowerCase().trim();
      const { data, error } = await supabase
        .from('golden_congelados')
        .select('*, market_products(name, descripcion, portada_url)')
        .eq('socio_email', userEmail)
        .order('fecha_inicio', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
      
      const { data: requestsData } = await supabase
        .from('solicitudes_entrega')
        .select('*')
        .ilike('socio_email', userEmail);
      
      const { data: maestrasData } = await supabase
        .from('entregas_maestras')
        .select(`
          id_pedido, 
          estado_maestro, 
          operador_id, 
          token_entrega, 
          chat_interno_activo, 
          llamada_directa_activa, 
          whatsapp_activo,
          staff_credenciales (
            nombre_operador,
            foto_url,
            telefono_contacto
          )
        `)
        .eq('usuario_id', user.id);

      const requestsWithMaestro = requestsData?.map(req => {
        const maestro = (maestrasData as any[])?.find(m => m.id_pedido === req.id_pedido_maestro);
        const staff = maestro?.staff_credenciales;
        return {
          ...req,
          estado_solicitud: maestro ? maestro.estado_maestro : req.estado_solicitud,
          operador_id: maestro ? maestro.operador_id : req.operador_id,
          token_entrega: maestro ? maestro.token_entrega : req.token_entrega,
          chat_interno_activo: maestro ? maestro.chat_interno_activo : false,
          llamada_directa_activa: maestro ? maestro.llamada_directa_activa : false,
          whatsapp_activo: maestro ? maestro.whatsapp_activo : false,
          nombre_repartidor: staff?.nombre_operador || req.nombre_repartidor,
          foto_repartidor: staff?.foto_url || req.foto_repartidor,
          telefono_repartidor: staff?.telefono_contacto || req.telefono_repartidor
        };
      }) || [];

      setAllRequests(requestsWithMaestro);

      const activeRequests = requestsWithMaestro
        .filter(r => ['pendiente', 'preparando', 'listo', 'en_camino'].includes(r.estado_solicitud))
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      // Agrupar por id_pedido_maestro para mostrar una notificación por entrega maestra
      const uniqueActiveRequests = Array.from(
        activeRequests.reduce((map, item) => {
          if (!map.has(item.id_pedido_maestro)) {
            map.set(item.id_pedido_maestro, item);
          }
          return map;
        }, new Map()).values()
      );

      setActiveDeliveryRequests(uniqueActiveRequests);

      if (requestsWithMaestro) {
        const lockedIds = requestsWithMaestro
          .filter((r: any) => ['pendiente', 'preparando', 'listo', 'en_camino'].includes(r.estado_solicitud))
          .flatMap((req: any) => (req.productos_ids || []).map((p: any) => p.id || p));
        setLockedProductIds(lockedIds);

        const deliveredIds = requestsWithMaestro
          .filter((r: any) => r.estado_solicitud === 'entregado')
          .flatMap((req: any) => (req.productos_ids || []).map((p: any) => p.id || p));
        setDeliveredProductIds(deliveredIds);
        // Cleanup selectedIds if any were delivered
        setSelectedIds(prev => prev.filter(id => !deliveredIds.includes(id)));
      }

      const { data: profileData } = await supabase
        .from('perfiles')
        .select('estado_aprobacion')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setIsUserApproved(profileData.estado_aprobacion === 'aprobado');
      }
    } catch (err) {
      console.error("Error fetching portfolio:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogisticsConfig = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('configuracion_marca')
        .select('monto_envio_defecto')
        .eq('app_target', 'entregas')
        .maybeSingle();
      if (data) setDeliveryCost(data.monto_envio_defecto || 200);
    } catch (e) { console.warn(e); }
  }, []);

  useEffect(() => {
    fetchAssets();
    fetchLogisticsConfig();
    const channel = supabase
      .channel('solicitudes_entrega_portfolio')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes_entrega' }, (payload: any) => {
        const userEmail = user?.email?.toLowerCase().trim();
        if (payload.new?.socio_email === userEmail) {
          if (payload.new.estado_solicitud === 'entregado') {
            setCompletedRequest(payload.new);
          }
        }
        // Solo refrescar si no estamos en medio de una solicitud
        if (!showCheckoutModal && !isProcessing) {
          fetchAssets(false, true);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entregas_maestras' }, async (payload: any) => {
        if (payload.new?.usuario_id === user?.id) {
          // Refrescar todo para asegurar consistencia con múltiples pedidos
          fetchAssets(false, true);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.email, user?.id, fetchLogisticsConfig]);

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.nombre_producto?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Buscar si el producto está en alguna solicitud
    const request = allRequests.find(r => r.productos_ids?.some((p: any) => String(p.id || p) === String(asset.id)));
    const estadoSolicitud = request?.estado_solicitud;

    const isDelivered = estadoSolicitud === 'entregado' || asset.estado === 'entregado';
    const isEnCamino = estadoSolicitud === 'en_camino';
    const isProcessing = ['pendiente', 'preparando', 'listo', 'en_camino', 'aprobado'].includes(estadoSolicitud || '');

    const isExpired = asset.fecha_vencimiento && new Date(asset.fecha_vencimiento) <= new Date();

    // LÓGICA DE PESTAÑAS (EL VIAJE DEL ACTIVO)
    if (activeTab === 'congelados') {
      // Se muestra si NO está vencido, NO ha sido entregado y NO está en proceso
      return matchesSearch && !isExpired && !isDelivered && !isProcessing;
    }
    if (activeTab === 'disponibles') {
      // Se muestra si:
      // 1. Está vencido y no entregado (disponible para solicitar)
      // 2. O está en proceso de entrega (independientemente de si venció o no, ya es un activo "activo")
      const isAvailableOrActive = (isExpired || isProcessing) && !isDelivered;
      const baseMatch = matchesSearch && isAvailableOrActive;
      if (!baseMatch) return false;

      // Filtro de sub-pestaña específico y excluyente
      switch (activeSubTab) {
        case 'en_proceso':
          return estadoSolicitud === 'pendiente';
        case 'aprobado':
          return ['preparando', 'listo', 'aprobado'].includes(estadoSolicitud || '');
        case 'en_ruta':
          return estadoSolicitud === 'en_camino';
        case 'todos':
        default:
          return true;
      }
    }
    if (activeTab === 'historial') {
      // Aquí solo vive lo que ya tiene el sello de 'entregado'
      return matchesSearch && isDelivered;
    }
    return false;
  });

  const handleCheckout = async () => {
    if (!isUserApproved) { alert('Cuenta no aprobada.'); return; }

    // VALIDACIÓN DE CAMPOS OBLIGATORIOS
    if (!addressForm.quien_recibe || !addressForm.hora_entrega) {
      alert('POR FAVOR COMPLETE LOS CAMPOS OBLIGATORIOS: QUIÉN RECIBE Y HORA DE ENTREGA.');
      return;
    }

    // VALIDACIÓN CRÍTICA: ¿Ya existe este id_producto en una solicitud no finalizada?
    const alreadyProcessing = selectedIds.some(id => lockedProductIds.includes(id));
    if (alreadyProcessing) {
      alert('Uno o más productos seleccionados ya están en camino a su dirección o procesándose.');
      return;
    }

    const availableBalance = user?.vault_balance ?? (user as any)?.balance ?? 0;
    const totalCost = (deliveryMethod === 'domicilio' ? deliveryCost : 0);

    if (availableBalance < totalCost) {
      alert(`SALDO INSUFICIENTE: ${totalCost} GP`);
      return;
    }

    setIsProcessing(true);
    try {
      // Calcular totales
      const totalProductos = selectedIds.length;
      const valorProductos = selectedIds.reduce((acc, id) => {
        const asset = assets.find(a => a.id === id);
        return acc + (Number(asset?.precio_congelado) || 0);
      }, 0);
      const totalPago = valorProductos + totalCost;

      // Usar UUID estándar para evitar error 22P02 (invalid input syntax for type uuid)
      const idPedidoMaestro = crypto.randomUUID();

      const { error: maestroError } = await supabase
        .from('entregas_maestras')
        .insert({
          id_pedido: idPedidoMaestro,
          socio_id: user?.id,
          usuario_id: user?.id,
          estado_maestro: 'pendiente',
          metodo: deliveryMethod,
          monto_envio_cobrar: totalCost,
          calle: addressForm.calle,
          numero_casa: addressForm.casa_numero,
          referencia: addressForm.referencias,
          ciudad: addressForm.ciudad,
          nombre_cliente: (user as any)?.nombre_completo || user?.full_name || user?.email,
          telefono: addressForm.telefono_contacto,
          // Nuevos campos obligatorios
          quien_recibe: addressForm.quien_recibe,
          dia_entrega: addressForm.dia_entrega,
          hora_entrega: addressForm.hora_entrega,
          metodo_pago: addressForm.metodo_pago,
          total_pago: totalPago,
          total_productos: totalProductos
        });

      if (maestroError) throw maestroError;

      const solicitudes = selectedIds.map(id => {
        const asset = assets.find(a => a.id === id);
        const rawProduct = asset?.market_products;
        const product = Array.isArray(rawProduct) ? rawProduct[0] : rawProduct;
        
        const productName = product?.name || asset?.nombre_producto || 'Producto';
        const productDesc = product?.descripcion || asset?.descripcion || asset?.detalle_unidad || 'Sin descripción';
        const productImg = product?.portada_url || asset?.image_url || 'https://picsum.photos/seed/package/400/400';

        return {
          id_pedido_maestro: idPedidoMaestro,
          socio_email: user?.email,
          socio_id: user?.id,
          metodo: deliveryMethod,
          // Paquete de Datos Descriptivo para el Repartidor
          productos_ids: [{
            id: id,
            nombre_producto: productName,
            cantidad: asset?.cantidad,
            descripcion: productDesc,
            url_imagen: productImg
          }],
          // Campos individuales por orden del Director
          nombre_producto: productName,
          descripcion_producto: productDesc,
          url_imagen_producto: productImg,
          cantidad: asset?.cantidad || 1,
          estado_solicitud: 'pendiente',
          costo_delivery: totalCost, // Monto 'A cobrar' por el repartidor
          calle: addressForm.calle,
          sector: addressForm.sector,
          casa_numero: addressForm.casa_numero,
          ciudad: addressForm.ciudad,
          telefono_contacto: addressForm.telefono_contacto
        };
      });

      const { error: requestError } = await supabase
        .from('solicitudes_entrega')
        .insert(solicitudes);

      if (requestError) throw requestError;

      if (totalCost > 0) {
        await supabase.from('mi_saldo').insert({
          socio_email: user?.email,
          monto: -totalCost,
          concepto: `LOGÍSTICA: ${deliveryMethod?.toUpperCase()}`
        });
        // No direct update to perfiles balance as per RLS guidelines
      }

      setSuccessMsg("SOLICITUD ENVIADA CORRECTAMENTE");
      setShowCheckoutModal(false);
      setSelectedIds([]);
      
      await refreshProfile();
      fetchAssets(true);

      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);

    } catch (err: any) { 
      console.error("Error en checkout:", err);
      setErrorMsg(`ERROR DE ENVÍO: ${err.message || 'Error desconocido'}`);
      setTimeout(() => setErrorMsg(null), 4000);
    } finally { 
      setIsProcessing(false); 
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative font-heading overflow-hidden flex flex-col">
      {/* ATMÓSFERA LUMÍNICA GLOBAL - REFINADA */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Luz Blanca Limpia en la esquina superior izquierda */}
          <div className="absolute -top-[10%] -left-[10%] w-[70vw] h-[60vh] opacity-30"
               style={{ background: 'radial-gradient(circle at 0% 0%, white 0%, transparent 70%)', filter: 'blur(100px)' }}></div>
          
          {/* Luz Dorada Sutil en la esquina inferior derecha */}
          <div className="absolute bottom-0 right-0 w-[60vw] h-[50vh] opacity-[0.1]"
               style={{ background: 'radial-gradient(circle at 100% 100%, #D4AF37 0%, transparent 70%)', filter: 'blur(120px)' }}></div>
          
          {/* Capa de profundidad */}
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"></div>
      </div>

      <div className={`relative z-10 flex-1 flex flex-col transition-all duration-1000 ${successMsg || errorMsg ? 'blur-3xl scale-95 opacity-0' : 'opacity-100'}`}>
        <header className="max-w-[1400px] w-full mx-auto px-8 md:px-12 pt-12 md:pt-20 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-1">
            <p className="text-gold-400 text-[8px] font-black uppercase tracking-[0.6em] opacity-50">GESTIÓN_PATRIMONIAL</p>
            <h1 className="font-heading text-2xl md:text-3xl text-white uppercase tracking-tighter leading-none font-light">
              MI <span className="text-gold-metallic font-black">PORTAFOLIO</span>
            </h1>
          </div>
          <div className="relative w-full md:w-72 group">
            <Search size={12} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-gold-400 transition-colors" />
            <input 
              type="text" placeholder="BUSCAR ACTIVOS..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/5 py-3.5 pl-14 text-[8px] uppercase tracking-[0.3em] outline-none focus:border-gold-400/30 transition-all backdrop-blur-xl font-black text-white"
            />
          </div>
        </header>

        <div className="max-w-[1400px] w-full mx-auto px-6 md:px-12 flex justify-center gap-6 md:gap-12 border-b border-white/5 mb-10">
          {(['congelados', 'disponibles', 'historial'] as const).map(tab => (
            <button 
              key={tab} onClick={() => { setActiveTab(tab); setSelectedIds([]); setActiveSubTab('todos'); }}
              className={`pb-5 text-[8px] font-black uppercase tracking-[0.4em] transition-all whitespace-nowrap relative ${activeTab === tab ? 'text-gold-400' : 'text-white/20 hover:text-white/40'}`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[1px] bg-gold-400 shadow-[0_0_15px_rgba(212,175,55,0.6)]" />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'disponibles' && (
          <div className="flex justify-center gap-2 mb-10 -mt-4 px-4 items-center">
            {(['todos', 'en_proceso', 'aprobado', 'en_ruta'] as const).map(sub => {
              const count = subTabCounts[sub];
              const hasActivity = count > 0 && sub !== 'todos';
              
              return (
                <button 
                  key={sub} onClick={() => setActiveSubTab(sub)}
                  className={`px-2 py-3 text-[6.5px] font-black uppercase tracking-[0.1em] transition-all border relative flex items-center justify-center min-w-[75px] md:min-w-[100px] whitespace-nowrap ${
                    activeSubTab === sub 
                      ? 'bg-gold-400/10 border-gold-400/30 text-gold-400' 
                      : 'bg-white/[0.01] border-white/5 text-white/20 hover:text-white/40'
                  } ${hasActivity ? 'animate-pulse shadow-[0_0_20px_rgba(212,175,55,0.1)] border-gold-400/40' : ''}`}
                >
                  {sub.replace('_', ' ')}
                  {count > 0 && (
                    <motion.div 
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gold-400 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.5)] border border-black z-20"
                    >
                      <span className="text-black text-[7px] font-black">{count}</span>
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto no-scrollbar px-6 md:px-12 pb-40">
          <div className="max-w-[1400px] mx-auto">
            {/* Notificación Principal (Semaforo) */}
            {(activeTab === 'disponibles' || activeTab === 'congelados') && (
              <div className="mb-8 space-y-6">
                {completedRequest && (
                  <SemaforoStatus request={completedRequest} isCompletionNotice setCompletedRequest={setCompletedRequest} />
                )}
                {activeDeliveryRequests.length > 0 && (activeSubTab === 'en_ruta' || activeTab === 'congelados') && (
                  activeDeliveryRequests.map((req, idx) => (
                    <SemaforoStatus 
                      key={req.id_pedido_maestro || idx}
                      request={req} 
                      setCompletedRequest={setCompletedRequest} 
                      onReceiveOrder={() => {
                        setRequestToRate(req);
                        setShowRatingModal(true);
                      }}
                      pinRevealed={pinRevealed}
                      onRefresh={() => fetchAssets(true, true)}
                    />
                  ))
                )}
              </div>
            )}

            {/* Vista de Resumen "Todos" */}
            {activeTab === 'disponibles' && activeSubTab === 'todos' && !loading && (
              <div className="space-y-6 mb-12">
                <div className="flex items-center gap-3 opacity-30 mb-8">
                  <div className="w-8 h-[1px] bg-gold-400"></div>
                  <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white">RESUMEN_DE_OPERACIONES</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { id: 'en_proceso', label: 'EN PROCESO', icon: <Clock />, color: 'text-red-400', bg: 'bg-red-400/5', border: 'border-red-400/20' },
                    { id: 'aprobado', label: 'APROBADOS', icon: <CheckCircle2 />, color: 'text-green-400', bg: 'bg-green-400/5', border: 'border-green-400/20' },
                    { id: 'en_ruta', label: 'EN RUTA', icon: <Truck />, color: 'text-blue-400', bg: 'bg-blue-400/5', border: 'border-blue-400/20' }
                  ].map(cat => {
                    const count = subTabCounts[cat.id as keyof typeof subTabCounts];
                    return (
                      <div key={cat.id} className={`p-8 ${cat.bg} border ${cat.border} rounded-2xl flex flex-col justify-between group hover:bg-white/[0.02] transition-all`}>
                        <div className="space-y-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.color} bg-white/5 border border-white/5`}>
                            {cat.icon}
                          </div>
                          <div>
                            <p className="text-[7px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">{cat.label}_SISTEMA</p>
                            <h4 className="text-2xl font-black text-white tracking-tighter">{count} ACTIVOS</h4>
                          </div>
                        </div>
                        <button 
                          onClick={() => setActiveSubTab(cat.id as any)}
                          className="mt-8 w-full py-4 bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.3em] text-white hover:bg-gold-400 hover:text-black hover:border-gold-400 transition-all flex items-center justify-center gap-3"
                        >
                          VER CATEGORÍA <ArrowRight size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="h-48 bg-white/5 border border-white/10 animate-pulse rounded-none"></div>
                ))}
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white/10 border border-white/5">
                  <Inbox size={40} strokeWidth={1} />
                </div>
                <p className="text-[10px] text-white/40 uppercase tracking-[0.4em]">No se encontraron activos en esta categoría</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssets.map(asset => (
                  <motion.div 
                    key={asset.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => {
                      const request = allRequests.find(r => r.productos_ids?.some((p: any) => String(p.id || p) === String(asset.id)));
                      const isLocked = lockedProductIds.includes(asset.id);

                      if (activeTab === 'disponibles' && !request && !isLocked) {
                        setSelectedIds(prev => prev.includes(asset.id) ? prev.filter(i => i !== asset.id) : [...prev, asset.id]);
                      } else {
                        setSelectedAsset(asset);
                      }
                    }}
                    className={`p-8 border transition-all duration-500 group relative cursor-pointer overflow-hidden ${
                      selectedIds.includes(asset.id) 
                        ? 'bg-gold-400/[0.08] border-gold-400 shadow-[0_20px_40px_rgba(212,175,55,0.1)]' 
                        : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]'
                    } ${lockedProductIds.includes(asset.id) && activeTab !== 'historial' ? 'border-gold-400/20 opacity-80' : ''}`}
                  >
                    {/* Subtle background pattern */}
                    <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                      <Package size={80} strokeWidth={1} />
                    </div>

                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-500 ${
                        selectedIds.includes(asset.id) ? 'bg-gold-400 text-black' : 'bg-white/5 text-gold-400 border border-white/5'
                      }`}>
                        <Package size={24} strokeWidth={1.5} />
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        {activeTab === 'disponibles' && !allRequests.find(r => r.productos_ids?.some((p: any) => String(p.id || p) === String(asset.id))) && (
                          <div className={`w-6 h-6 border flex items-center justify-center transition-all duration-500 ${
                            selectedIds.includes(asset.id) ? 'bg-gold-400 border-gold-400 scale-110' : 
                            lockedProductIds.includes(asset.id) ? 'bg-gray-500/20 border-white/10 cursor-not-allowed' : 'border-white/20 group-hover:border-white/40'
                          }`}>
                            {selectedIds.includes(asset.id) && <CheckCircle2 size={14} className="text-black" />}
                          </div>
                        )}
                        
                        {(() => {
                          const request = allRequests.find(r => r.productos_ids?.some((p: any) => String(p.id || p) === String(asset.id)));
                          if (!request || activeTab === 'historial') return null;

                          return (
                            <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 border backdrop-blur-md ${
                              request.estado_solicitud === 'pendiente' 
                                ? 'text-red-400 bg-red-400/10 border-red-400/20' 
                                : request.estado_solicitud === 'en_camino'
                                ? 'text-blue-400 bg-blue-400/10 border-blue-500/20'
                                : 'text-green-400 bg-green-400/10 border-green-400/20'
                            }`}>
                              {request.estado_solicitud === 'pendiente' ? 'EN_PROCESO' : 
                               request.estado_solicitud === 'en_camino' ? 'EN RUTA' : 'APROBADO'}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="relative z-10">
                      <h3 className="text-xl md:text-2xl font-black uppercase mb-1 tracking-tighter leading-none text-white group-hover:text-gold-400 transition-colors">
                        {asset.nombre_producto}
                      </h3>
                      <p className="text-[9px] text-white/20 uppercase tracking-[0.3em] font-bold mb-6">
                        {asset.cantidad} {asset.detalle_unidad}
                      </p>
                      
                      {activeTab === 'congelados' && (
                        <div className="mb-6 p-4 bg-white/[0.01] border border-white/5 flex flex-col gap-1.5">
                          <p className="text-[7px] text-gray-700 uppercase font-black tracking-[0.4em]">LIBERACIÓN_ESTIMADA</p>
                          <div className="flex items-center gap-2.5">
                            <Calendar size={10} className="text-gold-400/30" />
                            <p className="text-[10px] text-white/60 font-black font-mono tracking-widest">
                              {new Date(asset.fecha_vencimiento).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                            </p>
                          </div>
                        </div>
                      )}

                      {(() => {
                        const request = allRequests.find(r => r.productos_ids?.some((p: any) => String(p.id || p) === String(asset.id)));
                        if (!request || activeTab === 'historial' || request.estado_solicitud === 'pendiente') return null;

                        return (
                          <div className={`mb-8 p-4 border flex items-center justify-between group/token transition-all ${
                            pinRevealed ? 'bg-gold-400 text-black border-black/10' : 'bg-white/5 text-white/40 border-white/10'
                          }`}>
                            <div className="flex items-center gap-3">
                              {pinRevealed ? <Lock size={14} /> : <Lock size={14} className="opacity-40" />}
                              <span className="text-[10px] font-black uppercase tracking-[0.2em]">TOKEN_ACCESO</span>
                            </div>
                            <span className={`text-sm font-black font-mono tracking-[0.2em] ${!pinRevealed ? 'blur-[4px] select-none' : ''}`}>
                              {pinRevealed ? (request.token_entrega || '---') : '••••••'}
                            </span>
                          </div>
                        );
                      })()}

                      <div className="pt-6 border-t border-white/5 flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[8px] text-gray-700 font-black uppercase tracking-widest">VALOR_ACTIVO</p>
                          <p className="text-2xl font-mono font-black text-gold-400 tracking-tighter">
                            {Math.round(Number(asset.precio_congelado)).toLocaleString()} <span className="text-[10px] opacity-40">GP</span>
                          </p>
                        </div>

                        {activeTab === 'historial' ? (
                          <div className="flex items-center gap-2 text-green-400/60">
                            <ShieldCheck size={14} />
                            <span className="text-[9px] font-black uppercase tracking-widest">ENTREGADO</span>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAsset(asset);
                            }}
                            className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-gold-400 transition-all border-b border-transparent hover:border-gold-400 pb-1"
                          >
                            DETALLES
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeDeliveryRequests.length > 0 && activeTab === 'disponibles' && activeSubTab !== 'en_ruta' && (
          <div className="fixed bottom-24 left-6 right-6 z-[60] flex flex-col gap-3 pointer-events-none">
            {activeDeliveryRequests.map((req, idx) => (
              <FloatingDeliveryBar 
                key={req.id_pedido_maestro || idx}
                request={req} 
                onClick={() => setActiveSubTab('en_ruta')} 
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{ y: 100, x: '-50%', opacity: 0 }}
            className="fixed bottom-28 md:bottom-12 left-1/2 z-[100] w-[90%] max-w-lg"
          >
            <div className="bg-black/60 backdrop-blur-3xl border border-gold-400/30 p-1 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="bg-gradient-to-r from-gold-400/10 via-transparent to-gold-400/10 p-4 flex items-center justify-between gap-4">
                <div className="pl-4">
                  <p className="text-[7px] font-black uppercase tracking-[0.3em] text-gold-400/60 mb-0.5">PATRIMONIO_SELECCIONADO</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-white tracking-tighter">{selectedIds.length}</span>
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">ACTIVOS</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    const alreadyProcessing = selectedIds.some(id => lockedProductIds.includes(id));
                    if (alreadyProcessing) {
                      alert('Uno o más productos seleccionados ya están en camino a su dirección o procesándose.');
                      return;
                    }
                    setShowCheckoutModal(true);
                  }} 
                  disabled={selectedIds.some(id => lockedProductIds.includes(id))}
                  className={`group relative overflow-hidden px-10 py-5 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-4 min-w-[240px] ${
                    selectedIds.some(id => lockedProductIds.includes(id)) 
                    ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                    : 'bg-gold-400 text-black hover:bg-white shadow-[0_10px_30px_rgba(212,175,55,0.2)]'
                  }`}
                >
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] relative z-10 text-center leading-none">
                    {selectedIds.some(id => lockedProductIds.includes(id)) ? 'PROCESANDO...' : 'SOLICITAR ENTREGA'}
                  </span>
                  <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-6"
          >
            <div className="relative mb-12">
              <div className="w-24 h-24 border-2 border-gold-400/20 rounded-full"></div>
              <div className="absolute inset-0 w-24 h-24 border-t-2 border-gold-400 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Truck className="text-gold-400 animate-pulse" size={32} />
              </div>
            </div>
            
            <div className="space-y-4 max-w-sm">
              <p className="text-gold-400 text-[10px] font-black uppercase tracking-[0.6em] animate-pulse">PROCESANDO_SOLICITUD</p>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                ESTAMOS ASEGURANDO TU LOGÍSTICA
              </h2>
              <p className="text-white/40 text-[10px] uppercase tracking-widest leading-relaxed">
                Por favor, no cierres la aplicación. Estamos vinculando tus activos a la red de transporte.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] flex items-center justify-center p-8 bg-black/95 backdrop-blur-3xl"
          >
            <div className="max-w-md w-full text-center space-y-10">
               <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.1)]">
                 <ShieldCheck size={48} className="text-green-500" strokeWidth={1.5} />
               </div>
               <div className="space-y-4">
                 <h2 className="text-2xl md:text-3xl font-black text-green-500 uppercase tracking-tight leading-none">{successMsg}</h2>
                 <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-[1px] bg-green-500/20"></div>
                    <p className="text-[9px] text-white/20 uppercase tracking-[0.8em] font-black ml-[0.8em]">SISTEMA_SINCRONIZADO</p>
                 </div>
               </div>
            </div>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] flex items-center justify-center p-8 bg-black/95 backdrop-blur-3xl"
          >
            <div className="max-w-md w-full text-center space-y-16">
               <div className="w-32 h-32 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-16 border border-red-500/30 shadow-[0_0_60px_rgba(239,68,68,0.15)]">
                 <AlertCircle size={64} className="text-red-500" strokeWidth={1.5} />
               </div>
               <div className="space-y-6">
                 <p className="text-[12px] font-black text-red-500 uppercase tracking-[0.6em] mb-4">FALLO_DE_PROTOCOLO</p>
                 <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">{errorMsg}</h2>
               </div>
               <button 
                onClick={() => setErrorMsg(null)} 
                className="w-full py-8 bg-white text-black text-[12px] font-black uppercase tracking-[0.6em] active:scale-[0.95] shadow-2xl transition-all"
               >
                VOLVER_AL_SISTEMA
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {selectedAsset && (
          <AssetDetailModal 
            key="asset-detail"
            asset={selectedAsset} 
            onClose={() => setSelectedAsset(null)} 
            allRequests={allRequests}
          />
        )}
        {showCheckoutModal && (
          <CheckoutModal 
            key="checkout-modal"
            showCheckoutModal={showCheckoutModal}
            setShowCheckoutModal={setShowCheckoutModal}
            checkoutStep={checkoutStep}
            setCheckoutStep={setCheckoutStep}
            deliveryMethod={deliveryMethod}
            setDeliveryMethod={setDeliveryMethod}
            deliveryCost={deliveryCost}
            addressSource={addressSource}
            setAddressSource={setAddressSource}
            addressForm={addressForm}
            setAddressForm={setAddressForm}
            isProcessing={isProcessing}
            handleCheckout={handleCheckout}
          />
        )}
        {showRatingModal && (
          <RatingModal
            key="rating-modal"
            isOpen={showRatingModal}
            onClose={() => setShowRatingModal(false)}
            onSubmit={handleRatingSubmit}
            isSubmitting={isSubmittingRating}
          />
        )}
      </AnimatePresence>
    </div>
  );
};