import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { 
    X, Monitor, BarChart3, Settings, Receipt, Loader2, Save, Camera, 
    Image as ImageIcon, Building, MapPin, AlignLeft, Activity, Command, Lock, Phone, LogOut, ChevronRight, AlertCircle, Clock,
    ShieldCheck, Copy, Check, LayoutGrid
} from 'lucide-react';

export const BusinessAdmin: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'staff' | 'finance' | 'history' | 'config'>('staff');
  const [businessData, setBusinessData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [scanRequests, setScanRequests] = useState<any[]>([]);
  
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [selectedTerminal, setSelectedTerminal] = useState<any>(null);
  const [newStaff, setNewStaff] = useState({ name: '', pin: '' });
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const [configForm, setConfigForm] = useState({
    nombre_negocio: '',
    categoria: '',
    provincia: '',
    direccion: '',
    descripcion_negocio: '',
    telefono_comercial: '',
    porcentaje_oferta: '',
    logo_url: '',
    portada_url: ''
  });

  // Navegación Inferior Flotante
  const BOTTOM_NAV_ITEMS = [
    { id: 'staff', label: 'CAJA', icon: Monitor },
    { id: 'finance', label: 'VENTAS', icon: BarChart3 },
    { id: 'history', label: 'HISTORIAL', icon: Receipt },
  ];

  const financialStats = useMemo(() => {
    const totalIn = ledgerEntries
        .filter(e => Number(e.monto) > 0)
        .reduce((acc, curr) => acc + Number(curr.monto), 0);
    const totalOut = ledgerEntries
        .filter(e => Number(e.monto) < 0)
        .reduce((acc, curr) => acc + Math.abs(Number(curr.monto)), 0);
    return { totalIn, totalOut };
  }, [ledgerEntries]);

  useEffect(() => {
    fetchCoreData();
  }, [user]);

  const fetchCoreData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: biz } = await supabase
        .from('solicitudes_registro')
        .select('*')
        .eq('dueño_id', user.id)
        .maybeSingle();

      if (biz) {
        setBusinessData(biz);
        setConfigForm({
          nombre_negocio: biz.nombre_negocio || '',
          categoria: biz.categoria || '',
          provincia: biz.provincia || '',
          direccion: biz.direccion || '',
          descripcion_negocio: biz.descripcion_negocio || '',
          telefono_comercial: biz.telefono_comercial || '',
          porcentaje_oferta: String(biz.porcentaje_oferta || '10'),
          logo_url: biz.logo_url || '',
          portada_url: biz.portada_url || ''
        });

        const { data: staffData } = await supabase.from('staff_credenciales').select('*').eq('negocio_id', biz.id);
        setStaff(staffData || []);

        const { data: ledgerData } = await supabase
            .from('mi_saldo')
            .select('id, monto, concepto, created_at, socio_email')
            .eq('socio_email', biz.email_contacto)
            .order('created_at', { ascending: false });
        setLedgerEntries(ledgerData || []);

        const { data: scanData } = await supabase
            .from('solicitudes_escaneo')
            .select('*')
            .eq('dueño_email', biz.email_contacto)
            .order('created_at', { ascending: false });
        setScanRequests(scanData || []);
      }
    } catch (err) { console.error("Error sincronizando nodo comercial", err); }
    finally { setLoading(false); }
  };

  const handleUpdateConfig = async () => {
    if (!businessData?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('solicitudes_registro')
        .update({
          nombre_negocio: configForm.nombre_negocio.toUpperCase(),
          categoria: configForm.categoria,
          provincia: configForm.provincia,
          direccion: configForm.direccion,
          descripcion_negocio: configForm.descripcion_negocio,
          telefono_comercial: configForm.telefono_comercial,
          logo_url: configForm.logo_url, 
          portada_url: configForm.portada_url 
        }).eq('id', businessData.id);
      if (error) throw error;
      alert("SISTEMA SINCRONIZADO.");
      await fetchCoreData();
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'portada') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setConfigForm(prev => ({ ...prev, [type === 'logo' ? 'logo_url' : 'portada_url']: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleOpenModal = (index: number, existing?: any) => {
    const emailHijo = businessData?.[`email_operador_${index}`];
    if (!emailHijo) return alert("Terminal no disponible.");
    setSelectedTerminal({ index, emailHijo, id: existing?.id });
    setNewStaff({ name: existing?.nombre_operador || '', pin: existing?.pin_seguridad || '' });
    setShowActivationModal(true);
  };

  const handleSaveStaff = async () => {
    if (!selectedTerminal) return;
    setLoading(true);
    try {
      if (selectedTerminal.id) {
        await supabase.from('staff_credenciales').update({ nombre_operador: newStaff.name.toUpperCase(), pin_seguridad: newStaff.pin }).eq('id', selectedTerminal.id);
      } else {
        await supabase.from('staff_credenciales').insert([{
          negocio_id: businessData.id,
          nombre_operador: newStaff.name.toUpperCase(),
          gmail_operador: selectedTerminal.emailHijo,
          email_corporativo: businessData.email_contacto,
          qr_operador: businessData[`qr_${selectedTerminal.index}`],
          pin_seguridad: newStaff.pin,
          estado: 'activo'
        }]);
      }
      setShowActivationModal(false);
      fetchCoreData();
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0c0c0c] flex flex-col w-full h-full overflow-hidden font-sans text-left transition-all duration-700">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] -right-[10%] w-[80%] h-[80%] opacity-20"
               style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)', filter: 'blur(120px)' }}></div>
          <div className="absolute -bottom-[20%] -left-[10%] w-[90%] h-[90%] opacity-30"
               style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.3) 0%, transparent 70%)', filter: 'blur(150px)' }}></div>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      </div>

      {/* BARRA SUPERIOR REDISEÑADA */}
      <nav className="w-full bg-black/40 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between shrink-0 z-50 pt-[env(safe-area-inset-top)] min-h-[calc(4.5rem+env(safe-area-inset-top))]">
         <div className="flex items-center gap-5 px-6 md:px-12 h-16 shrink-0">
            {configForm.logo_url ? (
              <div className="h-10 md:h-12 w-10 md:w-12 rounded-2xl overflow-hidden border border-white/10 bg-black/20 flex items-center justify-center p-1.5">
                <img src={configForm.logo_url} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gold-400 rounded-2xl flex items-center justify-center font-heading font-black text-black text-xs shrink-0 shadow-[0_0_30px_rgba(212,175,55,0.3)]">G</div>
            )}
            
            <div className="h-6 w-[1px] bg-white/10"></div>
            
            <span className="text-[12px] md:text-[14px] font-black text-white/90 uppercase tracking-tighter truncate max-w-[180px]">
              {configForm.nombre_negocio || 'SISTEMA_MAESTRO'}
            </span>
         </div>

         {/* BOTÓN AJUSTES EN ESQUINA SUPERIOR */}
         <div className="px-6 md:px-12">
            <button 
              onClick={() => setActiveTab('config')} 
              className={`p-3 rounded-full transition-all duration-300 ${activeTab === 'config' ? 'bg-gold-400 text-black' : 'bg-white/5 text-gray-500 hover:text-white'}`}
            >
              <Settings size={22} strokeWidth={activeTab === 'config' ? 2.5 : 1.5} />
            </button>
         </div>
      </nav>

      {/* CONTENIDO PRINCIPAL CON MARGEN INFERIOR AUMENTADO */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-14 lg:p-20 relative z-10 pb-[calc(10rem+env(safe-area-inset-bottom))]">
          <div className="w-full max-w-[1500px] mx-auto animate-fade-in">
              <div className="mb-16">
                  <div className="flex items-center gap-3 mb-4 opacity-40">
                    <Activity size={12} className="text-gold-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.6em] text-white">CONEXIÓN_SEGURA_ACTIVA</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-black uppercase text-white tracking-tighter leading-none">
                      {activeTab === 'staff' ? 'CAJAS' : 
                       activeTab === 'finance' ? 'VENTAS' : 
                       activeTab === 'history' ? 'HISTORIAL' : 'AJUSTES'}
                  </h2>
              </div>

              {activeTab === 'staff' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => {
                    const emailHijo = businessData?.[`email_operador_${num}`];
                    const entry = staff.find(s => s.gmail_operador === emailHijo);
                    return (
                      <div key={num} onClick={() => entry && handleOpenModal(num, entry)} className={`p-8 border transition-all cursor-pointer rounded-none group flex flex-col justify-between min-h-[220px] relative shadow-2xl ${entry ? 'bg-gold-400/[0.05] border-gold-400/30' : 'bg-white/[0.04] border-white/10 opacity-70 hover:opacity-100'}`}>
                        <div className="flex justify-between items-start mb-6">
                          <Monitor size={24} strokeWidth={1.5} className={entry ? 'text-gold-400' : 'text-gray-700'} />
                          <span className="text-[9px] font-mono text-gray-600">ID_{num}</span>
                        </div>
                        {entry ? (
                          <div className="space-y-4">
                            <div>
                              <p className="text-[12px] font-black text-white uppercase truncate mb-1">{entry.nombre_operador}</p>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                <p className="text-[7px] font-black text-green-500 uppercase tracking-widest">ACTIVA</p>
                              </div>
                            </div>
                            
                            <div className="space-y-2 pt-2 border-t border-white/5">
                               <div className="flex justify-between items-center group/btn">
                                  <span className="text-[9px] text-gray-500 uppercase font-bold truncate max-w-[80%]">{entry.gmail_operador}</span>
                                  <button onClick={(e) => { e.stopPropagation(); copyToClipboard(entry.gmail_operador, `mail-${num}`); }} className="p-2 text-gray-600 hover:text-gold-400 transition-colors">
                                     {copyFeedback === `mail-${num}` ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                  </button>
                               </div>
                               <div className="flex justify-between items-center group/btn">
                                  <span className="text-[10px] font-mono text-gold-400 font-bold tracking-[0.2em]">PIN: {entry.pin_seguridad}</span>
                                  <button onClick={(e) => { e.stopPropagation(); copyToClipboard(entry.pin_seguridad, `pin-${num}`); }} className="p-2 text-gray-600 hover:text-gold-400 transition-colors">
                                     {copyFeedback === `pin-${num}` ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                  </button>
                               </div>
                            </div>
                          </div>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); handleOpenModal(num); }} className="w-full py-4 bg-white/5 border border-dashed border-white/20 text-[8px] font-black text-gray-500 uppercase tracking-widest hover:text-gold-400 hover:border-gold-400 transition-all">VINCULAR NUEVA TERMINAL</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'finance' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div className="p-8 md:p-12 lg:p-16 bg-white/[0.03] border border-white/5 rounded-none shadow-2xl backdrop-blur-md">
                        <p className="text-[10px] font-black uppercase tracking-[0.8em] text-gray-600 mb-8">RECOLECCIÓN_BRUTA</p>
                        <h3 className="text-4xl md:text-5xl lg:text-6xl font-mono font-black text-white tracking-tighter leading-none mb-4">RD$ {financialStats.totalIn.toLocaleString()}</h3>
                        <p className="text-[9px] text-gray-700 font-bold uppercase tracking-[0.4em]">Total acumulado en este Nodo Maestro</p>
                    </div>
                    <div className="p-8 md:p-12 lg:p-16 bg-gold-400/[0.03] border border-gold-400/20 rounded-none relative overflow-hidden group shadow-2xl backdrop-blur-md">
                        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-gold-400/5 blur-[100px] rounded-full"></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.8em] text-gold-400/60 mb-8">AHORRO_REDEEMED</p>
                        <h3 className="text-4xl md:text-5xl lg:text-6xl font-mono font-black text-gold-400 tracking-tighter leading-none mb-4">RD$ {financialStats.totalOut.toLocaleString()}</h3>
                        <p className="text-[9px] text-gold-500/40 font-bold uppercase tracking-[0.4em]">Capital transferido a la Red de Socios</p>
                    </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4 w-full animate-fade-in">
                   {scanRequests.length > 0 ? scanRequests.map((s, i) => (
                     <div key={i} className="p-6 md:p-8 bg-white/[0.015] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 hover:bg-white/[0.03] hover:border-white/10 transition-all group rounded-3xl">
                        <div className="flex items-center gap-8 min-w-[280px] w-full md:w-auto">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${s.estado === 'aprobado' ? 'bg-green-500/5 text-green-500/60 group-hover:bg-green-500/10 group-hover:text-green-500' : 'bg-red-500/5 text-red-500/60 group-hover:bg-red-500/10 group-hover:text-red-500'}`}>
                             {s.estado === 'aprobado' ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
                           </div>
                           <div>
                             <p className="text-[7px] font-black text-gold-400/40 uppercase tracking-[0.4em] mb-1.5 group-hover:text-gold-400 transition-colors">SOCIO_VERIFICADO</p>
                             <p className="text-lg font-bold text-white/90 uppercase truncate tracking-tight group-hover:text-white transition-colors">{s.socio_full_name}</p>
                           </div>
                        </div>
                        <div className="flex-1 grid grid-cols-3 gap-8 md:gap-16 text-left w-full border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-12">
                           <div>
                             <p className="text-[7px] text-gray-700 font-black uppercase tracking-widest mb-2">ESTATUS</p>
                             <p className={`text-[9px] font-black uppercase tracking-widest ${s.estado === 'aprobado' ? 'text-green-500/80' : 'text-red-500/80'}`}>{s.estado}</p>
                           </div>
                           <div>
                             <p className="text-[7px] text-gray-700 font-black uppercase tracking-widest mb-2">TIEMPO</p>
                             <p className="text-[9px] font-bold text-white/30 group-hover:text-white/60 transition-colors">{new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</p>
                           </div>
                           <div className="text-right">
                             <p className="text-[7px] text-gray-700 font-black uppercase tracking-widest mb-2">ID_TICKET</p>
                             <p className="text-[9px] font-mono text-white/10 group-hover:text-white/30 transition-colors">#{s.id.substring(0,8).toUpperCase()}</p>
                           </div>
                        </div>
                     </div>
                   )) : <div className="py-60 text-center opacity-10 font-heading tracking-[2em] font-black">LOG_VACÍO</div>}
                </div>
              )}

              {activeTab === 'config' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-32 items-start">
                    <div className="lg:col-span-4 space-y-12">
                        <div className="space-y-8">
                            <label className="text-[11px] font-black text-gold-400 uppercase tracking-[0.6em] mb-8 block">ESTÉTICA_MAESTRA</label>
                            <label className="block w-full aspect-video bg-black border border-white/10 rounded-none cursor-pointer relative overflow-hidden group shadow-2xl">
                                {configForm.portada_url ? <img src={configForm.portada_url} className="w-full h-full object-cover group-hover:opacity-40 transition-all" /> : <div className="flex items-center justify-center h-full text-gray-800"><ImageIcon size={48} /></div>}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 font-black text-[10px] uppercase tracking-[0.5em] gap-4"><Camera size={20}/> EDITAR_PORTADA</div>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'portada')} />
                            </label>
                            <div className="flex items-center gap-10 pt-6">
                                <label className="block w-28 h-28 bg-transparent border border-white/10 rounded-none cursor-pointer relative overflow-hidden shrink-0 shadow-xl group">
                                    {configForm.logo_url ? <img src={configForm.logo_url} className="w-full h-full object-contain p-0" /> : <div className="flex items-center justify-center h-full text-gray-300"><ImageIcon size={24} /></div>}
                                    <div className="absolute inset-0 bg-gold-400/20 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Camera size={18} className="text-white"/></div>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'logo')} />
                                </label>
                                <div className="space-y-1.5"><p className="text-[11px] text-white font-black uppercase tracking-widest leading-none">Logo Oficial</p><p className="text-[9px] text-gray-700 uppercase tracking-widest leading-relaxed">Formato PNG/JPG.<br/>Escala sugerida 1:1.</p></div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8 border-l border-white/5 pl-0 md:pl-24 space-y-16 md:space-y-24">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.5em] flex items-center gap-3"><Building size={14}/> Razón Social</label>
                            <input type="text" value={configForm.nombre_negocio} onChange={e => setConfigForm({...configForm, nombre_negocio: e.target.value})} className="w-full bg-transparent border-b border-white/10 py-6 text-4xl md:text-6xl text-white focus:outline-none focus:border-gold-400 uppercase font-black tracking-tighter transition-all" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-16">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.5em] flex items-center gap-3"><AlignLeft size={14}/> Rubro_Comercial</label>
                                <input type="text" value={configForm.categoria} onChange={e => setConfigForm({...configForm, categoria: e.target.value})} className="w-full bg-transparent border-b border-white/10 py-4 text-xl text-white focus:outline-none focus:border-gold-400 uppercase transition-all" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.5em] flex items-center gap-3"><Phone size={14}/> Línea_Atención</label>
                                <input type="text" value={configForm.telefono_comercial} onChange={e => setConfigForm({...configForm, telefono_comercial: e.target.value})} className="w-full bg-transparent border-b border-white/10 py-4 text-xl text-white focus:outline-none focus:border-gold-400 transition-all" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.5em] flex items-center gap-3"><MapPin size={14}/> Localización_Nodo</label>
                                <input type="text" value={configForm.provincia} onChange={e => setConfigForm({...configForm, provincia: e.target.value})} className="w-full bg-transparent border-b border-white/10 py-4 text-xl text-white focus:outline-none focus:border-gold-400 uppercase transition-all" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gold-400 uppercase tracking-[0.5em] flex items-center gap-3">Protocolo_Descuento <Lock size={12}/></label>
                                <div className="flex items-baseline gap-3 py-4 border-b border-gold-400/30 bg-gold-400/5 px-6">
                                    <span className="text-5xl md:text-7xl font-mono font-black text-gold-400">{configForm.porcentaje_oferta}</span>
                                    <span className="text-3xl font-mono text-gold-400/40">%</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleUpdateConfig} disabled={loading} className="w-full py-10 bg-white text-black font-black uppercase text-[12px] tracking-[1em] flex items-center justify-center gap-10 hover:bg-gold-400 transition-all rounded-none shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] active:scale-95">
                            {loading ? <Loader2 className="animate-spin" size={28} /> : <><Save size={24}/> GUARDAR_CONFIG</>}
                        </button>
                    </div>
                </div>
              )}

              <div className="mt-40 pt-20 border-t border-white/5 flex flex-col items-center opacity-30 hover:opacity-100 transition-opacity">
                  <button onClick={() => navigate('/profile')} className="w-full max-w-xl py-10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[11px] font-black uppercase tracking-[0.6em] flex items-center justify-center gap-6 rounded-none shadow-2xl group">
                      <LogOut size={24} className="group-hover:-translate-x-2 transition-transform" /> TERMINAR_SESIÓN_MASTER
                  </button>
              </div>
          </div>
      </main>

      {/* MENÚ FLOTANTE INFERIOR */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-lg px-4 flex justify-center pb-[env(safe-area-inset-bottom)]">
          <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] flex items-center justify-between gap-2 p-2 shadow-[0_30px_60px_rgba(0,0,0,0.8)] w-full">
            {BOTTOM_NAV_ITEMS.map((item) => {
              const active = activeTab === item.id;
              return (
                <button 
                  key={item.id} 
                  onClick={() => setActiveTab(item.id as any)} 
                  className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-4 rounded-[2rem] transition-all duration-500 ${active ? 'bg-gold-400 text-black shadow-[0_10px_30px_rgba(212,175,55,0.4)] scale-[1.02]' : 'text-gray-600 hover:text-white hover:bg-white/5'}`}
                >
                  <item.icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                  <span className="text-[7px] font-black tracking-[0.2em] uppercase">{item.label}</span>
                </button>
              );
            })}
          </div>
      </div>

      {showActivationModal && selectedTerminal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl animate-fade-in">
           <div className="max-w-md w-full bg-[#0a0a0a] border border-white/10 p-12 rounded-none shadow-[0_0_150px_rgba(212,175,55,0.15)] text-left relative overflow-hidden">
              <button onClick={() => setShowActivationModal(false)} className="absolute top-10 right-10 text-gray-700 hover:text-white transition-colors"><X size={32}/></button>
              <div className="mb-14">
                  <div className="flex items-center gap-3 opacity-50 mb-4"><Command size={14} className="text-gold-400" /><span className="text-[10px] font-black uppercase tracking-[0.6em] text-white">VÍNCULO_TERMINAL_0{selectedTerminal.index}</span></div>
                  <h3 className="text-4xl font-heading font-black text-white uppercase tracking-tighter leading-none">DATOS_DE<br/>ACCESO</h3>
              </div>
              
              <div className="space-y-10 mb-16">
                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center group transition-all">
                  <div className="overflow-hidden">
                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Email del Operador</p>
                    <p className="text-sm font-bold text-white/40 truncate">{selectedTerminal.emailHijo}</p>
                  </div>
                  <button onClick={() => copyToClipboard(selectedTerminal.emailHijo, 'modal-mail')} className="p-3 text-gray-500 hover:text-gold-400 transition-colors">
                    {copyFeedback === 'modal-mail' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.5em]">Nombre del Cajero</label>
                  <input type="text" autoFocus value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full bg-transparent border-b border-white/10 py-5 text-2xl text-white focus:outline-none focus:border-gold-400 uppercase font-black transition-all" placeholder="EJ: JUAN PÉREZ" />
                </div>
                
                <div className="space-y-4 relative">
                  <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.5em]">PIN de Seguridad</label>
                  <div className="relative">
                    <input type="password" maxLength={4} value={newStaff.pin} onChange={e => setNewStaff({...newStaff, pin: e.target.value.replace(/\D/g, '')})} className="w-full bg-transparent border-b border-white/10 py-5 text-6xl tracking-[0.6em] text-gold-400 focus:outline-none focus:border-gold-400 font-mono leading-none" />
                    <button onClick={() => copyToClipboard(newStaff.pin, 'modal-pin')} className="absolute right-0 top-1/2 -translate-y-1/2 p-3 text-gray-600 hover:text-gold-400 transition-colors">
                       {copyFeedback === 'modal-pin' ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <button onClick={handleSaveStaff} className="w-full py-8 bg-gold-400 text-black font-black uppercase tracking-[0.5em] text-[12px] active:scale-95 transition-all rounded-none hover:bg-white shadow-2xl">ACTIVAR_TERMINAL</button>
           </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{ __html: `
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          input:focus { text-shadow: 0 0 20px rgba(212,175,55,0.4); }
      `}} />
    </div>
  );
};