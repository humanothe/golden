import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Store, Zap, RefreshCcw, AlertCircle, ChevronDown, Filter } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export const Partners: React.FC = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedProvince, setSelectedProvince] = useState('Todas');
  
  // Helper para asegurar rutas válidas de Supabase Storage
  const getProductImage = (url: string | null | undefined) => {
    if (!url || url === 'null' || url === 'undefined' || url.trim() === '') return '/icon-192.png';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `https://ctnfizlhasmjcbpzrryb.supabase.co/storage/v1/object/public/assets/${url.replace(/^\/+/, '')}`;
  };

  const CATEGORIES = [
    "Todos", "Gastronomía & Restaurantes", "Tecnología & Electrónica", "Moda & Accesorios", 
    "Salud & Bienestar", "Belleza & Estética", "Automotriz & Repuestos", "Otro"
  ];

  const PROVINCES = [
    "Todas", "Distrito Nacional", "Santo Domingo", "Santiago", "La Altagracia", "La Romana", 
    "Puerto Plata", "San Cristóbal", "La Vega"
  ];

  const loadPartners = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data, error } = await supabase
        .from('solicitudes_registro')
        .select('id, nombre_negocio, logo_url, categoria, provincia, porcentaje_oferta')
        .eq('estado', 'aprobado')
        .not('nombre_negocio', 'is', null)
        .order('nombre_negocio');

      if (error) throw error;
      setPartners(data || []);
    } catch (err) {
      console.error("GOLDEN_SYNC_ERROR:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPartners(); }, [loadPartners]);

  const filtered = partners.filter(p => {
    const matchesSearch = p.nombre_negocio?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.categoria === selectedCategory;
    const matchesProvince = selectedProvince === 'Todas' || p.provincia === selectedProvince;
    return matchesSearch && matchesCategory && matchesProvince;
  });

  return (
    <div className="min-h-screen p-6 lg:p-12 pb-40 animate-fade-in max-w-6xl mx-auto font-sans text-left overflow-x-hidden selection:bg-gold-400 selection:text-black bg-transparent relative">
        
        {/* ATMÓSFERA LUMÍNICA - PARTNERS (Laterales: Center-Left y Center-Right) */}
        <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute left-0 top-[30%] w-[60vw] h-[40vh] opacity-[0.25]"
                 style={{ background: 'radial-gradient(circle at 0% 50%, white 0%, transparent 70%)', filter: 'blur(90px)' }}></div>
            <div className="absolute right-0 top-[30%] w-[60vw] h-[40vh] opacity-[0.1]"
                 style={{ background: 'radial-gradient(circle at 100% 50%, #D4AF37 0%, transparent 70%)', filter: 'blur(90px)' }}></div>
        </div>

        <div className="relative z-10">
            <header className="mb-8 border-b border-white/5 pb-6">
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <p className="text-gold-400 text-[7px] font-black uppercase tracking-[0.6em] opacity-60">ECOSISTEMA DE PRIVILEGIOS</p>
                        <h1 className="font-heading text-3xl md:text-4xl text-white uppercase tracking-tighter leading-none">
                            NEGOCIOS <span className="text-gold-metallic">ALIADOS</span>
                        </h1>
                    </div>
                    <button onClick={loadPartners} className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-gray-700 hover:text-white transition-colors pb-1">
                        <RefreshCcw size={10} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            {/* BARRA DE FILTROS UNIFICADA Y COMPACTA */}
            <div className="flex flex-col md:flex-row gap-2 mb-10">
                <div className="flex-1 relative group">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-gold-400 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="BUSCAR..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white/[0.03] border border-white/5 rounded-none text-[9px] font-black uppercase tracking-widest focus:border-gold-400/40 outline-none text-white transition-all"
                    />
                </div>

                <div className="flex gap-2">
                    <div className="relative min-w-[140px]">
                        <select 
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full pl-4 pr-8 py-3.5 bg-white/[0.03] border border-white/5 rounded-none text-[8px] font-black uppercase tracking-widest focus:border-gold-400/40 outline-none text-gray-500 appearance-none cursor-pointer hover:bg-white/[0.05] transition-all"
                        >
                            <option value="Todos">CATEGORÍA</option>
                            {CATEGORIES.filter(c => c !== "Todos").map(cat => (
                                <option key={cat} value={cat} className="bg-black text-white">{cat.toUpperCase()}</option>
                            ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 pointer-events-none" />
                    </div>

                    <div className="relative min-w-[140px]">
                        <select 
                            value={selectedProvince}
                            onChange={(e) => setSelectedProvince(e.target.value)}
                            className="w-full pl-4 pr-8 py-3.5 bg-white/[0.03] border border-white/5 rounded-none text-[8px] font-black uppercase tracking-widest focus:border-gold-400/40 outline-none text-gray-500 appearance-none cursor-pointer hover:bg-white/[0.05] transition-all"
                        >
                            <option value="Todas">UBICACIÓN</option>
                            {PROVINCES.filter(p => p !== "Todas").map(p => (
                                <option key={p} value={p} className="bg-black text-white">{p.toUpperCase()}</option>
                            ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 pointer-events-none" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array(9).fill(0).map((_, i) => (
                        <div key={i} className="p-5 bg-white/[0.01] border border-white/5 h-32 animate-pulse rounded-none flex gap-4">
                            <div className="w-20 h-20 bg-white/5 rounded-none shrink-0"></div>
                            <div className="flex-1 space-y-3 pt-2">
                                <div className="h-2 w-1/3 bg-white/5"></div>
                                <div className="h-3 w-full bg-white/5"></div>
                                <div className="h-2 w-1/2 bg-white/5"></div>
                            </div>
                        </div>
                    ))
                ) : error ? (
                    <div className="col-span-full py-20 text-center border border-red-500/10 bg-red-500/[0.02]">
                        <AlertCircle size={32} className="mx-auto mb-4 text-red-500" />
                        <p className="text-red-500 font-black uppercase text-[9px] tracking-widest mb-6">Fallo de conexión</p>
                        <button onClick={loadPartners} className="mx-auto px-8 py-3 bg-white text-black text-[8px] font-black uppercase tracking-widest hover:bg-gold-400 transition-all flex items-center gap-2">
                            <RefreshCcw size={12} /> REINTENTAR
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="col-span-full py-32 text-center border border-dashed border-white/5">
                        <Store size={32} className="mx-auto mb-4 text-gray-900" />
                        <p className="text-gray-700 font-black uppercase text-[8px] tracking-[0.5em]">Sin resultados</p>
                    </div>
                ) : (
                    filtered.map((partner: any) => (
                        <div 
                          key={partner.id} 
                          onClick={() => navigate(`/partner/${partner.id}`)}
                          className="group p-5 bg-white/[0.02] border border-white/5 hover:border-gold-400/40 transition-all cursor-pointer relative overflow-hidden shadow-xl rounded-none flex flex-col justify-between min-h-[160px]"
                        >
                            <div className="absolute inset-0 bg-gold-400/[0.01] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <div className="flex gap-5 relative z-10">
                                <div className="w-20 h-20 bg-black border border-white/10 p-1 shrink-0 overflow-hidden group-hover:border-gold-400/40 transition-colors">
                                    <img 
                                        src={getProductImage(partner.logo_url)} 
                                        className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" 
                                        alt={partner.nombre_negocio} 
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/icon-192.png';
                                            (e.target as HTMLImageElement).className = "w-8 h-8 opacity-10 object-contain mx-auto mt-5";
                                        }}
                                    />
                                </div>

                                <div className="flex-1 flex flex-col justify-start pt-1">
                                    <p className="text-[6px] font-black uppercase tracking-[0.4em] text-gold-400/60 mb-1 truncate">
                                        {partner.categoria || 'ALIADO RED'}
                                    </p>
                                    <h3 className="font-heading text-sm text-white group-hover:text-gold-metallic transition-all uppercase tracking-tight leading-tight mb-3 line-clamp-2">
                                        {partner.nombre_negocio}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-[7px] text-gray-700 font-black uppercase tracking-widest">
                                        <MapPin size={8} className="text-gray-800 group-hover:text-gold-400 transition-colors" /> 
                                        {partner.provincia}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
                                <div className="flex items-center gap-2 text-gold-400/20 group-hover:text-gold-400/40 transition-colors">
                                    <Zap size={12} />
                                    <span className="text-[7px] font-black uppercase tracking-widest italic">Benefit</span>
                                </div>
                                <div className="bg-gold-400 text-black px-3 py-1 text-[9px] font-black tracking-tight group-hover:bg-white transition-colors">
                                    -{partner.porcentaje_oferta}%
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );
};