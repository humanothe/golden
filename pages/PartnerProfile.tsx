
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { 
  ArrowLeft, MapPin, Zap, Phone, Share2, 
  ShieldCheck, Loader2, Info, Star, Navigation
} from 'lucide-react';

export const PartnerProfile: React.FC = () => {
  const { partnerId } = useParams<{ partnerId: string }>();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Helper para asegurar rutas válidas de Supabase Storage
  const getProductImage = (url: string | null | undefined) => {
    if (!url || url === 'null' || url === 'undefined' || url.trim() === '') return '/icon-192.png';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `https://ctnfizlhasmjcbpzrryb.supabase.co/storage/v1/object/public/assets/${url.replace(/^\/+/, '')}`;
  };

  useEffect(() => {
    const fetchPartnerDetails = async () => {
      if (!partnerId) return;
      try {
        const { data, error } = await supabase
          .from('solicitudes_registro')
          .select('*')
          .eq('id', partnerId)
          .maybeSingle();

        if (data) {
          setPartner(data);
        }
      } catch (err) {
        console.error("ERROR_FETCHING_PARTNER:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPartnerDetails();
  }, [partnerId]);

  const handleStartDiscountFlow = () => {
    navigate('/dashboard', { state: { autoScan: true } });
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
        <Loader2 size={40} className="text-gold-400 animate-spin" />
        <p className="mt-4 text-[9px] font-black uppercase tracking-[0.5em] text-gold-400/60">Cargando Perfil Maestro...</p>
    </div>
  );

  if (!partner) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-10 text-center">
        <p className="text-gray-500 font-black uppercase text-xs tracking-widest">Negocio no disponible en este Nodo.</p>
        <button onClick={() => navigate('/partners')} className="mt-8 text-gold-400 font-bold uppercase text-[10px] tracking-widest border-b border-gold-400 pb-1">Volver a la Red</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans text-left overflow-x-hidden animate-fade-in pb-40">
      <div className="relative h-[30vh] md:h-[40vh] w-full">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10"></div>
        <img 
          src={getProductImage(partner.portada_url)} 
          className="w-full h-full object-cover" 
          alt="Banner"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070';
          }}
        />
        <div className="absolute top-8 left-6 right-6 z-20 flex justify-between items-center">
            <button 
              onClick={() => navigate('/partners')} 
              className="p-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-gold-400 hover:text-black transition-all"
            >
                <ArrowLeft size={20} />
            </button>
            <button className="p-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white">
                <Share2 size={20} />
            </button>
        </div>
        <div className="absolute -bottom-10 left-8 z-20">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-[5px] border-black bg-white overflow-hidden shadow-2xl">
                <img 
                  src={getProductImage(partner.logo_url)} 
                  className="w-full h-full object-cover" 
                  alt="Logo"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/icon-192.png';
                  }}
                />
            </div>
        </div>
      </div>

      <div className="px-8 pt-16 max-w-4xl mx-auto space-y-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <span className="px-3 py-1 bg-gold-400/10 border border-gold-400/20 text-gold-400 text-[8px] font-black uppercase tracking-widest">
               {partner.categoria || 'Aliado Golden'}
             </span>
             <div className="flex items-center gap-1 text-gold-400">
               <Star size={10} fill="currentColor" />
               <span className="text-[9px] font-black uppercase">Aliado Verificado</span>
             </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-heading font-black uppercase tracking-tighter text-white leading-none">
            {partner.nombre_negocio}
          </h1>
        </div>

        <div className="p-10 bg-white/[0.02] border border-white/5 rounded-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
              <Zap size={140} strokeWidth={1} />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div>
                <p className="text-[9px] text-gold-400 font-black uppercase tracking-[0.5em] mb-4">PRIVILEGIO DE SOCIO</p>
                <h2 className="text-7xl md:text-8xl font-heading font-black text-white tracking-tighter leading-none">
                  {partner.porcentaje_oferta}<span className="text-4xl md:text-5xl">%</span>
                </h2>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mt-2">DESCUENTO FIJO</p>
              </div>
              <div className="flex flex-col gap-3 w-full md:w-auto">
                 <button 
                  onClick={handleStartDiscountFlow}
                  className="px-10 py-6 bg-white text-black font-black uppercase text-[11px] tracking-[0.3em] shadow-[0_15px_40px_rgba(255,255,255,0.15)] hover:bg-gold-400 hover:scale-105 active:scale-95 transition-all animate-pulse"
                 >
                   OBTENER DESCUENTO
                 </button>
              </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pt-8 border-t border-white/5">
          <div className="md:col-span-8 space-y-8">
            <div className="space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-600 flex items-center gap-2">
                 <Info size={14} /> Descripción del Socio
               </h3>
               <p className="text-sm md:text-base text-gray-400 leading-relaxed font-light">
                 {partner.descripcion_negocio || `Bienvenido a ${partner.nombre_negocio}. Disfruta de una experiencia exclusiva diseñada para los socios del ecosistema Golden con beneficios directos en cada visita.`}
               </p>
            </div>

            <div className="space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-600 flex items-center gap-2">
                 <MapPin size={14} /> Ubicación Auditada
               </h3>
               <div className="p-6 bg-white/[0.02] border border-white/5 flex items-start gap-4">
                  <Navigation size={18} className="text-gold-400 shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-wider">{partner.direccion}</p>
                    <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mt-1">{partner.provincia}, RD</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="md:col-span-4 space-y-6">
            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-none space-y-6">
               <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest border-b border-white/5 pb-3">SOPORTE DIRECTO</p>
               <div className="space-y-1">
                 <p className="text-[9px] text-gold-400 font-black uppercase tracking-widest">Contacto</p>
                 <p className="text-lg font-mono font-bold text-white">{partner.telefono_comercial || 'N/A'}</p>
               </div>
               <a 
                href={`tel:${partner.telefono_comercial}`}
                className="w-full py-4 bg-white/5 border border-white/10 text-white font-black uppercase text-[9px] tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-gold-400 hover:text-black transition-colors"
               >
                 <Phone size={14} /> LLAMAR AHORA
               </a>
            </div>

            <div className="flex items-center gap-3 opacity-20 px-2">
              <ShieldCheck size={14} className="text-gray-500" />
              <span className="text-[7px] font-black uppercase tracking-[0.4em] text-gray-500">Nodo Verificado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
