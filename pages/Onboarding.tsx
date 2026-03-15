import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { ArrowRight, MapPin, Smartphone, ShieldCheck, Loader2, AlertCircle, Search, ChevronRight, Check } from 'lucide-react';
import { DR_LOCATIONS } from '../constants/locations';

const SearchableSelect = ({ 
  label, 
  options, 
  value, 
  onChange, 
  placeholder = "Buscar..." 
}: { 
  label: string, 
  options: string[], 
  value: string, 
  onChange: (val: string) => void,
  placeholder?: string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-2 relative" ref={wrapperRef}>
      <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="input-line text-white py-4 flex justify-between items-center cursor-pointer hover:border-gold-400/50 transition-colors"
      >
        <span className={value ? "text-white" : "text-gray-500"}>
          {value || "Seleccionar..."}
        </span>
        <ChevronRight size={16} className={`text-gray-600 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[110] left-0 right-0 mt-1 bg-[#0f0f0f] border border-white/10 shadow-2xl rounded-2xl overflow-hidden animate-fade-in max-h-60 flex flex-col">
          <div className="p-3 border-b border-white/5 sticky top-0 bg-[#0f0f0f] z-20">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                autoFocus
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-gold-400/50"
              />
            </div>
          </div>
          <div className="overflow-y-auto">
            {filteredOptions.length > 0 ? filteredOptions.map((opt) => (
              <div 
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:bg-gold-400 hover:text-black cursor-pointer flex justify-between items-center transition-colors"
              >
                {opt}
                {value === opt && <Check size={12} />}
              </div>
            )) : (
              <div className="px-5 py-8 text-center text-[9px] text-gray-600 uppercase tracking-widest">
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const Onboarding: React.FC = () => {
  const { user, refreshProfile, needsOnboarding } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    province: '',
  });

  const provinces = Object.keys(DR_LOCATIONS).sort();

  useEffect(() => {
    if (user && !needsOnboarding) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, needsOnboarding, navigate]);

  const handleFinish = async () => {
    if (!user) return;
    
    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.province) {
        setDbError("Todos los campos maestros son obligatorios para activar tu identidad.");
        return;
    }
    
    setLoading(true);
    setDbError(null);
    
    try {
      // Actualización limpia sin campos calculados o eliminados
      const { error } = await api.auth.updateProfile(user.id, {
        full_name: formData.fullName.trim(),
        telefono: formData.phone.trim(),
        provincia: formData.province
      });

      if (error) throw error;

      await refreshProfile();
      navigate('/dashboard', { replace: true });
      
    } catch (e: any) {
      console.error("Critical Onboarding Error:", e);
      setDbError(e.message || "Error al sincronizar con el Nodo Maestro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center relative overflow-hidden font-sans text-left">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold-400/5 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-md w-full z-10 animate-enter-screen">
          <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gold-400/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-gold-400/20 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
                  <ShieldCheck size={36} className="text-gold-400" strokeWidth={1.5} />
              </div>
              <h1 className="text-4xl font-heading font-bold tracking-tighter uppercase leading-none mb-3">
                IDENTIDAD <span className="text-gold-400">GOLDEN</span>
              </h1>
              <p className="text-gray-500 uppercase tracking-[0.4em] text-[10px] font-black">Activa tu Acceso Maestro</p>
          </div>
          
          <div className="space-y-10 mb-10">
              <div className="group space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500 group-focus-within:text-gold-400 transition-colors">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={formData.fullName} 
                    onChange={e => setFormData({...formData, fullName: e.target.value})} 
                    placeholder="CARLOS ESTÉVEZ" 
                    className="input-line text-2xl font-light placeholder:text-white/5 uppercase"
                    required
                  />
              </div>

              <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500 flex items-center gap-2">
                    <Smartphone size={12} className="text-gold-400"/> WhatsApp de Contacto
                  </label>
                  <input 
                    type="tel" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    placeholder="8090000000" 
                    className="input-line text-xl font-light"
                    required
                  />
              </div>

              <SearchableSelect 
                label="Ubicación Principal"
                options={provinces}
                value={formData.province}
                onChange={(val) => setFormData({...formData, province: val})}
                placeholder="Buscar ciudad..."
              />
          </div>

          {dbError && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-shake text-left">
              <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest leading-relaxed">
                {dbError}
              </p>
            </div>
          )}

          <button 
            onClick={handleFinish}
            disabled={loading}
            className="w-full py-6 bg-white text-black font-black uppercase tracking-[0.5em] text-[11px] hover:bg-gold-400 transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 group disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                CONFIRMAR Y ENTRAR
                <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
              </>
            )}
          </button>
      </div>
    </div>
  );
};