import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, Camera, Loader2, MapPin, Building, Phone, AlignLeft, Image as ImageIcon, Check, Globe, Laptop } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';

export const RoleApplication: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nombre_negocio: '',
    categoria: '',
    modalidad: 'Física', 
    provincia: '',
    direccion: '',
    descripcion_negocio: '',
    email_contacto: '',
    telefono_comercial: '',
    porcentaje_oferta: '10',
    logo_base64: '',
    portada_base64: ''
  });

  const [previews, setPreviews] = useState({
    logo: '',
    portada: ''
  });

  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email_contacto: user.email }));
    }
  }, [user]);

  const CATEGORIAS_NEGOCIO = [
    "Gastronomía & Restaurantes", "Tecnología & Electrónica", "Moda & Accesorios", 
    "Salud & Bienestar", "Belleza & Estética", "Automotriz & Repuestos", 
    "Educación & Cursos", "Servicios Profesionales", "Hogar & Decoración",
    "Entretenimiento & Eventos", "Supermercados & Minimercados", "Otro"
  ];

  const PROVINCIAS_RD = [
    "Distrito Nacional", "Santo Domingo", "Santiago", "La Altagracia", "La Romana", 
    "San Pedro de Macorís", "Puerto Plata", "San Cristóbal", "La Vega", "Duarte",
    "Espaillat", "Peravia", "Monseñor Nouel", "Sánchez Ramírez", "Barahona",
    "Azua", "San Juan", "Monte Plata", "Hato Mayor", "El Seibo", "Samaná",
    "María Trinidad Sánchez", "Hermanas Mirabal", "Valverde", "Santiago Rodríguez",
    "Monte Cristi", "Dajabón", "Elías Piña", "Independencia", "Bahoruco", "Pedernales", "San José de Ocoa"
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'portada') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData(prev => ({ ...prev, [type === 'logo' ? 'logo_base64' : 'portada_base64']: base64 }));
        setPreviews(prev => ({ ...prev, [type]: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
        const { error } = await supabase.from('solicitudes_registro').insert([{
            dueño_id: user.id,
            nombre_negocio: formData.nombre_negocio.trim().toUpperCase(),
            categoria: formData.categoria,
            modalidad: formData.modalidad,
            provincia: formData.provincia,
            direccion: formData.direccion.trim(),
            descripcion_negocio: formData.descripcion_negocio.trim(),
            email_contacto: user.email?.toLowerCase().trim(),
            telefono_comercial: formData.telefono_comercial.trim(),
            porcentaje_oferta: Number(formData.porcentaje_oferta),
            pais: 'República Dominicana',
            logo_url: formData.logo_base64,
            portada_url: formData.portada_base64,
            estado: 'pendiente'
        }]);

        if (error) {
            if (error.code === '23505') {
                navigate('/espera', { replace: true });
                return;
            }
            throw error;
        }
        
        await refreshProfile();
        navigate('/espera', { replace: true });
    } catch (error: any) {
        alert('NOTIFICACIÓN DEL NODO: ' + error.message);
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 relative overflow-hidden font-sans text-left animate-fade-in pb-32">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-gold-400/5 rounded-full blur-[150px] pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl mx-auto pt-10">
            <header className="mb-12">
                <button onClick={() => navigate('/profile')} className="mb-8 p-3 bg-white/5 rounded-full text-gray-500 hover:text-gold-400 transition-all active:scale-90">
                    <ArrowLeft size={24} />
                </button>
                <p className="text-gold-400 text-[10px] font-black uppercase tracking-[0.5em] mb-2">Architectural Onboarding</p>
                <h1 className="text-4xl md:text-5xl font-heading font-bold text-white uppercase tracking-tighter leading-none">
                  REGISTRAR <br/><span className="text-gold-metallic text-3xl md:text-5xl">SOLICITUD SOCIO</span>
                </h1>
            </header>

            <form onSubmit={handleSubmit} className="space-y-12">
                <div className="bg-white/[0.02] border border-white/5 p-8 md:p-10 rounded-[3rem] space-y-10 shadow-2xl">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-400 border-b border-white/5 pb-4">1. Identidad Visual</h3>
                    <div className="flex flex-col md:flex-row gap-10 items-center">
                        <div className="relative group text-center">
                            <label className="block w-28 h-28 rounded-[2rem] bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-gold-400 transition-all overflow-hidden shadow-inner">
                                {previews.logo ? (
                                    <img src={previews.logo} className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <Camera size={28} className="text-gray-600 mb-2" />
                                        <span className="text-[8px] font-black uppercase text-gray-700 tracking-tighter">LOGO_URL</span>
                                    </>
                                )}
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'logo')} />
                            </label>
                            {previews.logo && <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 shadow-lg animate-fade-in"><Check size={12} className="text-white"/></div>}
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block w-full h-32 rounded-[2rem] bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-gold-400 transition-all overflow-hidden relative shadow-inner">
                                {previews.portada ? (
                                    <img src={previews.portada} className="w-full h-full object-cover opacity-60" />
                                ) : (
                                    <>
                                        <ImageIcon size={32} className="text-gray-600 mb-2" />
                                        <span className="text-[8px] font-black uppercase text-gray-700 tracking-tighter">PORTADA_URL</span>
                                    </>
                                )}
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'portada')} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-8 md:p-10 rounded-[3rem] space-y-8 shadow-2xl">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-400 border-b border-white/5 pb-4">2. Estructura Comercial</h3>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500 flex items-center gap-2"><Building size={12}/> Nombre del Negocio</label>
                        <input type="text" required value={formData.nombre_negocio} onChange={e => setFormData({...formData, nombre_negocio: e.target.value})} className="w-full bg-transparent border-b border-white/10 py-4 text-xl text-white focus:outline-none focus:border-gold-400 transition-all uppercase placeholder:text-white/5" placeholder="EJ: RESTAURANTE EL DORADO" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500">Categoría</label>
                            <select required value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="w-full bg-transparent border-b border-white/10 py-4 text-sm text-white focus:outline-none focus:border-gold-400 transition-all appearance-none cursor-pointer">
                                <option value="" className="bg-black text-gray-500">Seleccionar...</option>
                                {CATEGORIAS_NEGOCIO.map(cat => <option key={cat} value={cat} className="bg-black text-white">{cat}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500 flex items-center gap-2"><Laptop size={12}/> Modalidad</label>
                            <select required value={formData.modalidad} onChange={e => setFormData({...formData, modalidad: e.target.value})} className="w-full bg-transparent border-b border-white/10 py-4 text-sm text-white focus:outline-none focus:border-gold-400 transition-all appearance-none cursor-pointer">
                                <option value="Física" className="bg-black text-white">Física</option>
                                <option value="Virtual" className="bg-black text-white">Virtual</option>
                                <option value="Ambos" className="bg-black text-white">Ambos</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500 flex items-center gap-2"><AlignLeft size={12}/> Descripción Comercial</label>
                        <textarea required value={formData.descripcion_negocio} onChange={e => setFormData({...formData, descripcion_negocio: e.target.value})} className="w-full bg-transparent border-b border-white/10 py-4 text-sm text-white focus:outline-none focus:border-gold-400 transition-all min-h-[80px] resize-none" placeholder="Breve descripción del local y servicios..." />
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-8 md:p-10 rounded-[3rem] space-y-8 shadow-2xl">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-400 border-b border-white/5 pb-4">3. Localización y Auditoría</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500 flex items-center gap-2"><MapPin size={12}/> Provincia</label>
                            <select required value={formData.provincia} onChange={e => setFormData({...formData, provincia: e.target.value})} className="w-full bg-transparent border-b border-white/10 py-4 text-sm text-white focus:outline-none focus:border-gold-400 transition-all appearance-none cursor-pointer">
                                <option value="" className="bg-black text-gray-500">Seleccionar...</option>
                                {PROVINCIAS_RD.map(prov => <option key={prov} value={prov} className="bg-black text-white">{prov}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500 flex items-center gap-2"><Phone size={12}/> Teléfono Comercial</label>
                            <input type="tel" required value={formData.telefono_comercial} onChange={e => setFormData({...formData, telefono_comercial: e.target.value})} className="w-full bg-transparent border-b border-white/10 py-4 text-sm text-white focus:outline-none focus:border-gold-400 transition-all" placeholder="809-XXX-XXXX" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500">Dirección Exacta</label>
                        <input type="text" required value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} className="w-full bg-transparent border-b border-white/10 py-4 text-sm text-white focus:outline-none focus:border-gold-400 transition-all uppercase" placeholder="CALLE, NÚMERO, SECTOR..." />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500 flex items-center gap-2"><Globe size={12}/> Email Oficial</label>
                          <input type="email" required readOnly value={formData.email_contacto} className="w-full bg-transparent border-b border-white/10 py-4 text-sm text-gray-500 cursor-not-allowed" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500">Porcentaje de Oferta (%)</label>
                          <input type="number" required min="1" max="100" value={formData.porcentaje_oferta} onChange={e => setFormData({...formData, porcentaje_oferta: e.target.value})} className="w-full bg-transparent border-b border-white/10 py-4 text-sm text-white focus:outline-none focus:border-gold-400 transition-all font-mono" />
                      </div>
                    </div>
                </div>

                <div className="pt-6">
                    <button type="submit" disabled={isSubmitting} className="w-full py-7 bg-gold-400 text-black rounded-[2rem] font-black uppercase tracking-[0.4em] text-[11px] hover:bg-white transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50">
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Store size={20} /> ENVIAR SOLICITUD MAESTRA</>}
                    </button>
                    <p className="mt-8 text-center text-[8px] text-gray-700 uppercase tracking-[0.5em] px-10 leading-loose italic font-bold">Los datos ingresados están sujetos a verificación legal. Cualquier discrepancia con los registros oficiales anulará la solicitud de partner.</p>
                </div>
            </form>
        </div>
    </div>
  );
};