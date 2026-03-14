import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Download, X, Apple, Chrome, Share } from 'lucide-react';
import { useUI } from '../contexts/UIContext';

export const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { branding, getSafeAsset, getThemeLogo } = useUI();
  const [showInstallDrawer, setShowInstallDrawer] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // DETECCIÓN DE MODO STANDALONE (PWA INSTALADA)
    const checkInstallation = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // @ts-ignore - Soporte para iOS antiguo
      const isIOSStandalone = window.navigator.standalone === true;
      
      if (isStandalone || isIOSStandalone) {
        setIsInstalled(true);
      }
    };

    checkInstallation();
    
    // Listener por si cambia el modo dinámicamente
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handler = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const safeBg = getSafeAsset(branding.bg_welcome);
  const masterLogo = getThemeLogo('dark');

  const titleText = branding.welcome_title || "GOLDEN ACCESO";
  const titleParts = titleText.split(" ");
  const firstPart = titleParts[0];
  const secondPart = titleParts.slice(1).join(" ");

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black font-sans selection:bg-gold-400 selection:text-black text-left">
      {/* BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0 bg-black">
        {branding.is_video_welcome && safeBg ? (
          <video autoPlay muted loop playsInline className="w-full h-full object-cover opacity-60">
            <source src={safeBg} type="video/mp4" />
          </video>
        ) : safeBg ? (
          <div className="w-full h-full bg-cover bg-center animate-scale-slow opacity-70" style={{ backgroundImage: `url("${safeBg}")` }} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-black via-[#0a0a0a] to-[#1a1300] opacity-80" />
        )}
        <div className="absolute inset-0 vignette-overlay z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-20"></div>
      </div>

      <div className="relative z-30 h-screen flex flex-col justify-end pb-16 px-8 md:px-16 w-full max-w-[1920px] mx-auto text-white">
        <div className="w-full animate-fade-in md:max-w-xl flex flex-col items-start">
          <div className="mb-10">
            <div className="w-16 h-16 rounded-[2rem] flex items-center justify-center backdrop-blur-xl bg-white/5 border border-white/10 overflow-hidden shadow-2xl">
              <img 
                src={masterLogo} 
                key={masterLogo}
                className="w-full h-full object-contain p-2" 
                alt="Logo" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/icon-192.png';
                }}
              />
            </div>
          </div>
          
          <h1 className="font-heading text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-[0.85] mb-6 uppercase block w-full whitespace-normal">
            {firstPart} <br/>
            <span className="text-gold-metallic">{secondPart}</span>
          </h1>
          
          <div className="w-full mb-6">
            <div className="text-gold-400 font-sans font-bold text-[8px] md:text-[9px] tracking-[0.3em] uppercase opacity-80 flex items-center gap-2">
              <span>AHORRO</span>
              <span className="opacity-20">•</span>
              <span>EXCLUSIVIDAD</span>
              <span className="opacity-20">•</span>
              <span>SEGURIDAD</span>
            </div>
          </div>

          <p className="text-gray-400 font-sans font-normal text-[9px] leading-relaxed mb-14 uppercase tracking-[0.2em] opacity-60 max-w-[280px]">
            {branding.welcome_description}
          </p>
          
          <div className="flex flex-col gap-10 w-full">
            {/* BOTÓN INGRESAR MAESTRO */}
            <button onClick={() => navigate('/login')} className="group w-full max-w-sm py-5 bg-white text-black font-sans font-black text-[11px] uppercase tracking-[0.4em] hover:bg-gold-400 transition-all duration-500 flex items-center justify-center gap-4 active:scale-[0.98] shadow-2xl">
              {branding.btn_to_login_text} <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
            </button>
            
            {/* SECCIÓN INFERIOR HORIZONTAL */}
            <div className={`flex items-center justify-between w-full max-w-sm border-t border-white/10 pt-10 transition-all duration-700 ${isInstalled ? 'justify-center' : ''}`}>
              <button onClick={() => navigate('/register')} className="flex items-center gap-3 group transition-all shrink-0">
                <span className="text-gray-600 font-black text-[7px] tracking-[0.2em] uppercase group-hover:text-gray-400 transition-colors">¿NUEVO?</span>
                <span className="text-white font-black text-[10px] tracking-[0.1em] uppercase border-b border-white/20 group-hover:border-gold-400 group-hover:text-gold-400 transition-all pb-0.5">CREAR CUENTA</span>
              </button>

              {/* BOTÓN INSTALAR: SÓLO APARECE SI NO ESTÁ INSTALADA */}
              {!isInstalled && (
                <button 
                  onClick={() => setShowInstallDrawer(true)} 
                  className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-gold-400 text-black hover:bg-white transition-all duration-300 group active:scale-95 shadow-[0_10px_25px_rgba(212,175,55,0.2)] shrink-0 animate-fade-in"
                >
                  <Download size={14} strokeWidth={3} className="text-black" />
                  <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">INSTALAR APP</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SIDEBAR DE INSTALACIÓN PREMIUM */}
      <div className={`fixed inset-0 z-[1000] transition-opacity duration-500 ${showInstallDrawer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowInstallDrawer(false)}></div>
        
        <aside className={`absolute top-0 right-0 h-full w-full max-w-[400px] bg-[#050505] shadow-2xl transition-transform duration-500 ease-out p-10 flex flex-col overflow-hidden border-l border-white/5 ${showInstallDrawer ? 'translate-x-0' : 'translate-x-full'}`}>
          
          {/* ILUMINACIÓN SIDEBAR TIPO DASHBOARD */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute -top-20 -left-20 w-[100%] h-[50%] opacity-[0.1]"
                 style={{ background: 'radial-gradient(circle at 20% 20%, white 0%, transparent 70%)', filter: 'blur(60px)' }}></div>
            <div className="absolute -bottom-40 -right-40 w-[100%] h-[60%] opacity-[0.2]"
                 style={{ background: 'radial-gradient(circle at 80% 80%, #D4AF37 0%, transparent 60%)', filter: 'blur(80px)' }}></div>
          </div>

          <div className="relative z-10 flex flex-col h-full">
            <header className="flex justify-between items-center mb-16">
              <div className="flex items-center gap-4">
                <img src={masterLogo} className="h-8 w-auto grayscale brightness-200" alt="G" />
                <div className="h-4 w-[1px] bg-white/20"></div>
                <span className="text-[10px] font-heading font-normal uppercase tracking-[0.4em] text-white/50">Guía de acceso</span>
              </div>
              <button onClick={() => setShowInstallDrawer(false)} className="p-2 text-white/40 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </header>

            <h2 className="text-4xl font-heading font-normal uppercase tracking-tighter text-white mb-12 leading-none">
              Instala tu <br/><span className="text-gold-metallic">Terminal</span>
            </h2>

            <div className="space-y-12 overflow-y-auto no-scrollbar pb-20">
              {/* SECCIÓN APPLE */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg text-white/80">
                    <Apple size={20} />
                  </div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Instalar en Apple</h3>
                </div>
                <div className="pl-2 space-y-6">
                   <div className="flex gap-4">
                     <span className="text-[10px] font-mono text-gold-400 font-bold opacity-40">01</span>
                     <p className="text-[11px] text-gray-500 uppercase tracking-widest leading-relaxed">Abre el sitio oficial en <span className="text-white">Safari</span>.</p>
                   </div>
                   <div className="flex gap-4">
                     <span className="text-[10px] font-mono text-gold-400 font-bold opacity-40">02</span>
                     <p className="text-[11px] text-gray-500 uppercase tracking-widest leading-relaxed flex flex-wrap items-center gap-2">
                       Toca el icono compartir <Share size={14} className="text-gold-400" /> (cuadrado con flecha).
                     </p>
                   </div>
                   <div className="flex gap-4">
                     <span className="text-[10px] font-mono text-gold-400 font-bold opacity-40">03</span>
                     <p className="text-[11px] text-gray-500 uppercase tracking-widest leading-relaxed">Selecciona la opción <span className="text-white">"Añadir a pantalla de inicio"</span>.</p>
                   </div>
                </div>
              </div>

              <div className="h-[1px] w-full bg-white/5"></div>

              {/* SECCIÓN ANDROID */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg text-white/80">
                    <Chrome size={20} />
                  </div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Instalar en Android</h3>
                </div>
                <div className="pl-2 space-y-6">
                   <div className="flex gap-4">
                     <span className="text-[10px] font-mono text-gold-400 font-bold opacity-40">01</span>
                     <p className="text-[11px] text-gray-500 uppercase tracking-widest leading-relaxed">Abre el sitio oficial en <span className="text-white">Chrome</span>.</p>
                   </div>
                   <div className="flex gap-4">
                     <span className="text-[10px] font-mono text-gold-400 font-bold opacity-40">02</span>
                     <p className="text-[11px] text-gray-500 uppercase tracking-widest leading-relaxed">Toca los <span className="text-white">tres puntos</span> en la esquina superior.</p>
                   </div>
                   <div className="flex gap-4">
                     <span className="text-[10px] font-mono text-gold-400 font-bold opacity-40">03</span>
                     <p className="text-[11px] text-gray-500 uppercase tracking-widest leading-relaxed">Selecciona <span className="text-white">"Instalar aplicación"</span>.</p>
                   </div>
                </div>
              </div>
            </div>

            <footer className="mt-auto pt-10 border-t border-white/5 opacity-30">
               <p className="text-[8px] font-black uppercase tracking-[0.5em] text-center">Golden Acceso Protocol v3.0</p>
            </footer>
          </div>
        </aside>
      </div>

    </div>
  );
};