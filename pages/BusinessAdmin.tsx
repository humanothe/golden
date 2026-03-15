import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { 
    X, Monitor, BarChart3, Settings, Receipt, Loader2, Save, Camera, 
    Image as ImageIcon, Building, MapPin, AlignLeft, Activity, Command, Lock, Phone, LogOut, ChevronRight, AlertCircle, Clock,
    ShieldCheck, Copy, Check, LayoutGrid, Truck
} from 'lucide-react';

export const BusinessAdmin: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'staff' | 'finance' | 'history' | 'config' | 'logistics'>('staff');
  const [businessData, setBusinessData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [scanRequests, setScanRequests] = useState<any[]>([]);
  const [logisticsRequests, setLogisticsRequests] = useState<any[]>([]);
  
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
    { id: 'logistics', label: 'LOGÍSTICA', icon: Truck },
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

        const { data: logData } = await supabase
            .from('solicitudes_entrega')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (logData && logData.length > 0) {
            // Extraer el primer ID de cada solicitud (productos_ids es un array JSONB)
            const productIds = logData
                .map(l => Array.isArray(l.productos_ids) ? l.productos_ids[0] : l.productos_ids)
                .filter(Boolean);
            
            if (productIds.length > 0) {
                const { data: products } = await supabase
                    .from('golden_congelados')
                    .select('id, nombre_producto, descripcion_producto')
                    .in('id', productIds);
                
                const requestsWithProducts = logData.map(l => {
                    const pid = Array.isArray(l.productos_ids) ? l.productos_ids[0] : l.productos_ids;
                    const prod = products?.find(p => p.id === pid);
                    return { ...l, producto: prod };
                });
                setLogisticsRequests(requestsWithProducts);
            } else {
                setLogisticsRequests(logData);
            }
        } else {
            setLogisticsRequests([]);
        }
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
    <div className="fixed inset-0 z-[100] bg-[#F8F9FA] flex flex-col w-full h-full overflow-hidden font-sans text-left transition-all duration-700 text-gray-900">
      {/* ATMÓSFERA LUMÍNICA - LIGHT THEME POTENCIADA */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[80vw] h-[60vh] opacity-[0.05]"
             style={{ background: 'radial-gradient(circle at 0% 0%, white 0%, transparent 70%)', filter: 'blur(120px)' }}></div>
        <div className="absolute bottom-0 right-0 w-[70vw] h-[70vh] opacity-[0.08]"
             style={{ background: 'radial-gradient(circle at 100% 100%, white 0%, transparent 60%)', filter: 'blur(140px)' }}></div>
      </div>

      {/* BARRA SUPERIOR - MINIMALISTA LIGHT */}
      <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between shrink-0 z-50 pt-[env(safe-area-inset-top)] min-h-[3.5rem]">
         <div className="flex items-center gap-3 px-4 md:px-8 h-12 shrink-0">
            {configForm.logo_url ? (
              <div className="h-7 w-7 flex items-center justify-center overflow-hidden border border-gray-100 rounded-md bg-gray-50/30">
                <img src={configForm.logo_url} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-7 h-7 bg-white dark:bg-black text-black dark:text-white rounded-md flex items-center justify-center font-black text-[9px] shrink-0">G</div>
            )}
            
            <div className="h-3 w-[1px] bg-gray-200"></div>
            
            <span className="text-[9px] font-black text-gray-900 uppercase tracking-[0.1em] truncate max-w-[120px]">
              {configForm.nombre_negocio || 'ADMINISTRACIÓN'}
            </span>
         </div>

         <div className="px-4 md:px-8">
            <button 
              onClick={() => setActiveTab('config')} 
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${activeTab === 'config' ? 'bg-white dark:bg-black text-black dark:text-white' : 'bg-gray-100 text-gray-400 hover:text-gray-900'}`}
            >
              <Settings size={12} />
            </button>
         </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-8 lg:p-10 relative z-10 pb-[calc(7rem+env(safe-area-inset-bottom))]">
          <div className="w-full max-w-[1000px] mx-auto">
              <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2 opacity-30">
                    <div className="w-2 h-[1px] bg-white dark:bg-black"></div>
                    <span className="text-[7px] font-black uppercase tracking-[0.4em] text-black">NODO_COMERCIAL_ACTIVO</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black uppercase text-gray-900 tracking-tight leading-none">
                      {activeTab === 'staff' ? 'CAJAS' : 
                       activeTab === 'finance' ? 'VENTAS' : 
                       activeTab === 'history' ? 'HISTORIAL' : 
                       activeTab === 'logistics' ? 'LOGÍSTICA' : 'AJUSTES'}
                  </h2>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {activeTab === 'staff' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => {
                        const emailHijo = businessData?.[`email_operador_${num}`];
                        const entry = staff.find(s => s.gmail_operador === emailHijo);
                        return (
                          <div key={num} onClick={() => entry && handleOpenModal(num, entry)} className={`p-4 border transition-all duration-300 cursor-pointer rounded-[1.5rem] group flex flex-col justify-between min-h-[140px] relative ${entry ? 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200' : 'bg-gray-50/30 border-gray-200 border-dashed hover:border-gray-300'}`}>
                            <div className="flex justify-between items-start">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${entry ? 'bg-gray-50 text-gray-900' : 'bg-gray-100/50 text-gray-400'}`}>
                                <Monitor size={14} strokeWidth={1.5} />
                              </div>
                              <span className="text-[7px] font-black text-gray-400 tracking-[0.1em]">ID_0{num}</span>
                            </div>
                            
                            {entry ? (
                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs font-black text-gray-900 uppercase tracking-tight truncate">{entry.nombre_operador}</p>
                                  <div className="flex items-center gap-1">
                                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                                    <p className="text-[6px] font-black text-green-600 uppercase tracking-[0.2em]">ONLINE</p>
                                  </div>
                                </div>
                                
                                <div className="space-y-1 pt-2 border-t border-gray-50">
                                   <div className="flex justify-between items-center">
                                      <span className="text-[7px] text-gray-400 uppercase font-black tracking-wider truncate max-w-[80%]">{entry.gmail_operador}</span>
                                      <button onClick={(e) => { e.stopPropagation(); copyToClipboard(entry.gmail_operador, `mail-${num}`); }} className="text-gray-300 hover:text-gray-900 transition-colors">
                                         {copyFeedback === `mail-${num}` ? <Check size={8} className="text-green-500" /> : <Copy size={8} />}
                                      </button>
                                   </div>
                                   <div className="flex justify-between items-center">
                                      <span className="text-[7px] font-black text-gray-600 tracking-[0.1em]">PIN: {entry.pin_seguridad}</span>
                                      <button onClick={(e) => { e.stopPropagation(); copyToClipboard(entry.pin_seguridad, `pin-${num}`); }} className="text-gray-300 hover:text-gray-900 transition-colors">
                                         {copyFeedback === `pin-${num}` ? <Check size={8} className="text-green-500" /> : <Copy size={8} />}
                                      </button>
                                   </div>
                                </div>
                              </div>
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); handleOpenModal(num); }} className="w-full py-2 bg-white border border-dashed border-gray-200 rounded-lg text-[7px] font-black text-gray-500 uppercase tracking-[0.2em] hover:text-gray-900 hover:border-gray-400 transition-all">VINCULAR</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeTab === 'finance' && (
                    <div className="flex flex-row gap-3 w-full overflow-x-auto no-scrollbar pb-2">
                        <div className="flex-1 min-w-[180px] p-5 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm">
                            <p className="text-[7px] font-black uppercase tracking-[0.4em] text-gray-400 mb-3">RECOLECCIÓN_BRUTA</p>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-2">RD$ {financialStats.totalIn.toLocaleString()}</h3>
                            <div className="w-6 h-[1px] bg-gray-100 mb-2"></div>
                            <p className="text-[6px] text-gray-500 font-black uppercase tracking-[0.1em]">TOTAL_ACUMULADO</p>
                        </div>
                        <div className="flex-1 min-w-[180px] p-5 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm">
                            <p className="text-[7px] font-black uppercase tracking-[0.4em] text-gray-400 mb-3">AHORRO_REDEEMED</p>
                            <h3 className="text-xl font-black text-gray-400 tracking-tight leading-none mb-2">RD$ {financialStats.totalOut.toLocaleString()}</h3>
                            <div className="w-6 h-[1px] bg-gray-100 mb-2"></div>
                            <p className="text-[6px] text-gray-500 font-black uppercase tracking-[0.1em]">CAPITAL_TRANSFERIDO</p>
                        </div>
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <div className="space-y-2 w-full">
                       {scanRequests.length > 0 ? scanRequests.map((s, i) => (
                         <div key={i} className="p-4 bg-white border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-gray-50 hover:border-gray-200 transition-all group rounded-[1.5rem] shadow-sm">
                            <div className="flex items-center gap-4 min-w-[160px] w-full md:w-auto">
                               <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${s.estado === 'aprobado' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                 {s.estado === 'aprobado' ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
                               </div>
                               <div>
                                 <p className="text-[6px] font-black text-gray-400 uppercase tracking-[0.3em] mb-0.5">SOCIO_VERIFICADO</p>
                                 <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{s.socio_full_name}</p>
                               </div>
                            </div>
                            <div className="flex-1 grid grid-cols-3 gap-4 md:gap-8 text-left w-full border-t md:border-t-0 md:border-l border-gray-50 pt-3 md:pt-0 md:pl-8">
                               <div>
                                 <p className="text-[6px] text-gray-400 font-black uppercase tracking-widest mb-1">ESTATUS</p>
                                 <p className={`text-[7px] font-black uppercase tracking-[0.1em] ${s.estado === 'aprobado' ? 'text-green-600' : 'text-red-600'}`}>{s.estado}</p>
                               </div>
                               <div>
                                 <p className="text-[6px] text-gray-400 font-black uppercase tracking-widest mb-1">TIEMPO</p>
                                 <p className="text-[7px] font-black text-gray-600">{new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                               </div>
                               <div className="text-right">
                                 <p className="text-[6px] text-gray-400 font-black uppercase tracking-widest mb-1">ID_TICKET</p>
                                 <p className="text-[7px] font-black text-gray-300">#{s.id.substring(0,6).toUpperCase()}</p>
                               </div>
                            </div>
                         </div>
                       )) : <div className="py-20 text-center opacity-10 text-[7px] tracking-[1.5em] font-black text-gray-900">LOG_VACÍO</div>}
                    </div>
                  )}

                  {activeTab === 'logistics' && (
                    <div className="space-y-2 w-full">
                       {logisticsRequests.length > 0 ? logisticsRequests.map((l, i) => (
                         <div key={i} className="p-4 bg-white border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-gray-50 hover:border-gray-200 transition-all group rounded-[1.5rem] shadow-sm">
                            <div className="flex items-center gap-4 min-w-[160px] w-full md:w-auto">
                               <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center transition-all duration-300 group-hover:bg-black dark:hover:bg-white group-hover:text-black dark:group-hover:text-white">
                                 <Truck size={14} />
                               </div>
                               <div>
                                 <p className="text-[6px] font-black text-gray-400 uppercase tracking-[0.3em] mb-0.5">SOLICITUD_LOGÍSTICA</p>
                                 <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{l.producto?.nombre_producto || 'PRODUCTO DESCONOCIDO'}</p>
                               </div>
                            </div>
                            <div className="flex-1 grid grid-cols-4 gap-2 md:gap-8 text-left w-full border-t md:border-t-0 md:border-l border-gray-50 pt-3 md:pt-0 md:pl-8">
                               <div>
                                 <p className="text-[6px] text-gray-400 font-black uppercase tracking-widest mb-1">MÉTODO</p>
                                 <p className="text-[7px] font-black uppercase tracking-widest text-gray-900">{l.metodo}</p>
                               </div>
                               <div>
                                 <p className="text-[6px] text-gray-400 font-black uppercase tracking-widest mb-1">ESTADO</p>
                                 <p className={`text-[7px] font-black uppercase tracking-widest ${l.estado_solicitud === 'pendiente' ? 'text-amber-600' : 'text-green-600'}`}>{l.estado_solicitud}</p>
                               </div>
                               <div>
                                 <p className="text-[6px] text-gray-400 font-black uppercase tracking-widest mb-1">COSTO</p>
                                 <p className="text-[7px] font-black text-gray-900">{l.costo_delivery} GP</p>
                               </div>
                               <div className="text-right">
                                 <p className="text-[6px] text-gray-400 font-black uppercase tracking-widest mb-1">FECHA</p>
                                 <p className="text-[7px] font-black text-gray-300">{new Date(l.created_at).toLocaleDateString()}</p>
                               </div>
                            </div>
                         </div>
                       )) : <div className="py-20 text-center opacity-10 text-[7px] tracking-[1.5em] font-black text-gray-900">SIN_SOLICITUDES</div>}
                    </div>
                  )}

                  {activeTab === 'config' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-4 space-y-6">
                            <div className="space-y-4">
                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.5em] mb-4 block">ESTÉTICA_MAESTRA</label>
                                <label className="block w-full aspect-video bg-white border border-gray-100 rounded-[1rem] cursor-pointer relative overflow-hidden group shadow-sm">
                                    {configForm.portada_url ? <img src={configForm.portada_url} className="w-full h-full object-cover group-hover:opacity-40 transition-all duration-500" /> : <div className="flex items-center justify-center h-full text-gray-200"><ImageIcon size={24} /></div>}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-white/80 font-black text-[7px] uppercase tracking-[0.3em] gap-2 transition-all duration-300 text-gray-900"><Camera size={14}/> EDITAR_PORTADA</div>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'portada')} />
                                </label>
                                <div className="flex items-center gap-4 pt-2">
                                    <label className="block w-12 h-12 bg-white border border-gray-100 rounded-lg cursor-pointer relative overflow-hidden shrink-0 group shadow-sm">
                                        {configForm.logo_url ? <img src={configForm.logo_url} className="w-full h-full object-contain p-1" /> : <div className="flex items-center justify-center h-full text-gray-200"><ImageIcon size={16} /></div>}
                                        <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300"><Camera size={12} className="text-gray-900"/></div>
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'logo')} />
                                    </label>
                                    <div className="space-y-0.5">
                                      <p className="text-[9px] text-gray-900 font-black uppercase tracking-wider leading-none">Logo Oficial</p>
                                      <p className="text-[7px] text-gray-400 uppercase tracking-wider leading-relaxed font-black">PNG/JPG. 1:1.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-8 border-l border-gray-50 pl-0 md:pl-8 space-y-8">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.4em] flex items-center gap-2">RAZÓN_SOCIAL</label>
                                <input type="text" value={configForm.nombre_negocio} onChange={e => setConfigForm({...configForm, nombre_negocio: e.target.value})} className="w-full bg-transparent border-b border-gray-100 py-2 text-xl md:text-2xl text-gray-900 focus:outline-none focus:border-black uppercase font-black tracking-tight transition-all" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.4em] flex items-center gap-2">RUBRO_COMERCIAL</label>
                                    <input type="text" value={configForm.categoria} onChange={e => setConfigForm({...configForm, categoria: e.target.value})} className="w-full bg-transparent border-b border-gray-100 py-2 text-sm text-gray-900 focus:outline-none focus:border-black uppercase font-black tracking-tight transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.4em] flex items-center gap-2">LÍNEA_ATENCIÓN</label>
                                    <input type="text" value={configForm.telefono_comercial} onChange={e => setConfigForm({...configForm, telefono_comercial: e.target.value})} className="w-full bg-transparent border-b border-gray-100 py-2 text-sm text-gray-900 focus:outline-none focus:border-black font-black tracking-tight transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.4em] flex items-center gap-2">LOCALIZACIÓN_NODO</label>
                                    <input type="text" value={configForm.provincia} onChange={e => setConfigForm({...configForm, provincia: e.target.value})} className="w-full bg-transparent border-b border-gray-100 py-2 text-sm text-gray-900 focus:outline-none focus:border-black uppercase font-black tracking-tight transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.4em] flex items-center gap-2">PROTOCOLO_DESCUENTO</label>
                                    <div className="flex items-baseline gap-1 py-2 border-b border-gray-100">
                                        <span className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">{configForm.porcentaje_oferta}</span>
                                        <span className="text-sm font-black text-gray-300">%</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleUpdateConfig} disabled={loading} className="w-full py-4 bg-white dark:bg-black text-black dark:text-white font-black uppercase text-[9px] tracking-[0.6em] flex items-center justify-center gap-4 hover:bg-gray-900 transition-all rounded-[1rem] active:scale-95 shadow-md">
                                {loading ? <Loader2 className="animate-spin" size={16} /> : 'GUARDAR_CONFIGURACIÓN'}
                            </button>
                        </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col items-center">
                  <button onClick={() => navigate('/profile')} className="w-full max-w-xs py-4 border border-gray-100 text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all text-[8px] font-black uppercase tracking-[0.6em] flex items-center justify-center gap-3 rounded-[1rem] group">
                      <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" /> VOLVER_AL_PERFIL
                  </button>
              </div>
          </div>
      </main>

      {/* MENÚ FLOTANTE INFERIOR - REDISEÑO MINIMALISTA LIGHT */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm px-4 flex justify-center pb-[env(safe-area-inset-bottom)]">
          <div className="bg-white/90 backdrop-blur-3xl border border-gray-200 rounded-[2rem] flex items-center justify-between gap-1 p-1 w-full shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
            {BOTTOM_NAV_ITEMS.map((item) => {
              const active = activeTab === item.id;
              return (
                <button 
                  key={item.id} 
                  onClick={() => setActiveTab(item.id as any)} 
                  className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-[1.5rem] transition-all duration-300 group overflow-hidden"
                >
                  {active && (
                    <motion.div 
                      layoutId="nav-active"
                      className="absolute inset-0 bg-white dark:bg-black rounded-[1.5rem] z-0"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <div className={`relative z-10 transition-colors duration-300 ${active ? 'text-black dark:text-white' : 'text-gray-400 group-hover:text-gray-900'}`}>
                    <item.icon size={14} strokeWidth={active ? 2.5 : 1.5} />
                  </div>
                  <span className={`relative z-10 text-[6px] font-black tracking-[0.05em] uppercase transition-colors duration-300 ${active ? 'text-black dark:text-white' : 'text-gray-400 group-hover:text-gray-900'} truncate px-1`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
      </div>

      {showActivationModal && selectedTerminal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-white/60 backdrop-blur-xl animate-fade-in">
           <div className="max-w-sm w-full bg-white border border-gray-100 p-8 rounded-[2rem] shadow-2xl text-left relative overflow-hidden">
              <button onClick={() => setShowActivationModal(false)} className="absolute top-6 right-6 text-gray-300 hover:text-gray-900 transition-colors"><X size={20}/></button>
              <div className="mb-8">
                  <div className="flex items-center gap-2 opacity-30 mb-2"><Command size={12} className="text-black" /><span className="text-[8px] font-black uppercase tracking-[0.4em] text-black">VÍNCULO_TERMINAL_0{selectedTerminal.index}</span></div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">DATOS_DE<br/>ACCESO</h3>
              </div>
              
              <div className="space-y-6 mb-8">
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-center group transition-all">
                  <div className="overflow-hidden flex-1 mr-2">
                    <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1">Email del Operador</p>
                    <p className="text-[10px] font-black text-gray-900 break-all">{selectedTerminal.emailHijo}</p>
                  </div>
                  <button onClick={() => copyToClipboard(selectedTerminal.emailHijo, 'modal-mail')} className="p-1.5 text-gray-300 hover:text-gray-900 transition-colors shrink-0">
                    {copyFeedback === 'modal-mail' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.4em]">Nombre del Cajero</label>
                  <input type="text" autoFocus value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full bg-transparent border-b border-gray-200 py-2 text-base text-gray-900 focus:outline-none focus:border-black uppercase font-black transition-all" placeholder="EJ: JUAN PÉREZ" />
                </div>
                
                <div className="space-y-2 relative">
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.4em]">PIN de Seguridad</label>
                  <div className="relative">
                    <input type="password" maxLength={4} value={newStaff.pin} onChange={e => setNewStaff({...newStaff, pin: e.target.value.replace(/\D/g, '')})} className="w-full bg-transparent border-b border-gray-200 py-2 text-2xl tracking-[0.3em] text-gray-900 focus:outline-none focus:border-black font-mono leading-none" />
                    <button onClick={() => copyToClipboard(newStaff.pin, 'modal-pin')} className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-gray-300 hover:text-gray-900 transition-colors">
                       {copyFeedback === 'modal-pin' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <button onClick={handleSaveStaff} className="w-full py-4 bg-white dark:bg-black text-black dark:text-white font-black uppercase tracking-[0.4em] text-[10px] active:scale-95 transition-all rounded-2xl hover:bg-gray-900 shadow-lg">ACTIVAR_TERMINAL</button>
           </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{ __html: `
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
};