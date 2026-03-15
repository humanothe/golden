
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isConfigured } from '../services/supabaseClient';

interface BrandingConfig {
  logo_light: string | null;
  logo_dark: string | null;
  pwa_icon_url: string | null;
  bg_welcome: string | null;
  bg_login: string | null;
  bg_register: string | null;
  is_video_welcome: boolean;
  welcome_title: string; 
  welcome_subtitle: string;
  welcome_description: string;
  login_title: string;
  login_subtitle: string;
  login_description: string;
  login_footer: string;
  register_title: string;
  register_subtitle: string;
  register_description: string;
  btn_to_login_text: string;
  btn_to_register_text: string;
}

const FALLBACK_GOLD_LOGO = '/icon-192.png';

const DEFAULT_BRANDING: BrandingConfig = {
  logo_light: null,
  logo_dark: null,
  pwa_icon_url: '/icon-192.png',
  bg_welcome: null,
  bg_login: null,
  bg_register: null,
  is_video_welcome: false,
  welcome_title: "Golden Acceso", 
  welcome_subtitle: "SERVICIOS DE ORO",
  welcome_description: "Tu puerta de entrada exclusiva al ecosistema de beneficios y servicios premium.",
  login_title: "ACCESO",
  login_subtitle: "Identidad Maestra",
  login_description: "Ingresa tus credenciales para operar en la bóveda.",
  login_footer: "INGRESA TUS CREDENCIALES MAESTRAS",
  register_title: "UNIRSE",
  register_subtitle: "Solicita tu membresía",
  register_description: "Comienza tu camino en el ecosistema de beneficios Golden.",
  btn_to_login_text: "INGRESAR",
  btn_to_register_text: "CREAR CUENTA"
};

interface UIContextType {
  branding: BrandingConfig;
  loading: boolean;
  masterIcon: string | null;
  getSafeAsset: (url: string | null | undefined) => string | null;
  getThemeLogo: (mode: 'light' | 'dark') => string;
  refreshBranding: () => Promise<void>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children?: ReactNode }) => {
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [masterIcon, setMasterIcon] = useState<string | null>('/icon-192.png');
  const [loading, setLoading] = useState(true);

  const getSafeAsset = (url: string | null | undefined): string | null => {
    if (!url || typeof url !== 'string' || url.trim() === '' || url === 'null') return null;
    return url.trim();
  };

  const fetchBranding = async () => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('configuracion_marca')
        .select('*')
        .eq('app_target', 'socio')
        .maybeSingle();

      if (data && !error) {
        setBranding({ ...DEFAULT_BRANDING, ...data });
        if (data.pwa_icon_url) setMasterIcon(data.pwa_icon_url);
      }
    } catch (err) {
      console.debug("DevMode: Usando branding por defecto.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  const getThemeLogo = (mode: 'light' | 'dark'): string => {
    const dbLogo = mode === 'dark' ? branding.logo_dark : branding.logo_light;
    return getSafeAsset(dbLogo) || getSafeAsset(branding.pwa_icon_url) || FALLBACK_GOLD_LOGO;
  };

  return (
    <UIContext.Provider value={{ branding, loading, masterIcon, getSafeAsset, getThemeLogo, refreshBranding: fetchBranding }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
};
