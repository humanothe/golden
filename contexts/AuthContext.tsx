import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { User } from '../types';
import { supabase, isConfigured, checkConnection } from '../services/supabaseClient';
import { api, mapUser } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isProfileLoading: boolean;
  needsOnboarding: boolean;
  businessStatus: 'none' | 'pending' | 'approved';
  activeScan: any | null;
  signIn: (email: string, password?: string) => Promise<{ error: string | null; user?: any }>;
  signUp: (email: string, password?: string) => Promise<{ error: string | null; user?: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setActiveScan: (scan: any | null) => void;
  isAuthenticated: boolean;
  connectionError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const CACHE_KEY = 'golden_user_cache';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [businessStatus, setBusinessStatus] = useState<'none' | 'pending' | 'approved'>('none');
  const [activeScan, setActiveScan] = useState<any | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const hydrateProfile = useCallback(async (sbUser: any) => {
    if (!sbUser || !isConfigured) {
      setUser(null);
      setLoading(false);
      return;
    }

    setIsProfileLoading(true);
    setConnectionError(null);
    
    try {
      // 1. Verificación de enlace base con el servidor
      const connection = await checkConnection();
      if (!connection.ok) {
        const errMsg = connection.error || 'No se pudo establecer enlace con el servidor central.';
        setConnectionError(errMsg);
        // No limpiamos el usuario para evitar redirecciones infinitas si ya teníamos sesión
        setLoading(false);
        setIsProfileLoading(false);
        return;
      }

      const profileWithBalance = await api.auth.syncUserProfile(sbUser);
      
      // Si llegamos aquí sin error de fetch, procedemos con el resto
      const [bStatus, pendingScan] = await Promise.all([
        supabase.from('solicitudes_registro')
          .select('estado')
          .eq('email_contacto', sbUser.email)
          .maybeSingle()
          .then(r => {
            const s = r.data?.estado?.toLowerCase();
            return (s === 'aprobado' ? 'approved' : s === 'pendiente' ? 'pending' : 'none') as any;
          }, () => 'none'),
        supabase.from('solicitudes_escaneo')
          .select('*')
          .eq('socio_email', sbUser.email)
          .eq('estado', 'pendiente')
          .eq('nueva_consulta', false)
          .maybeSingle()
          .then(r => r.data, () => null)
      ]);
      
      if (isMounted.current) {
        if (!profileWithBalance && sbUser) {
          throw new Error("AUTH_SYNC_FAILED");
        }
        const mapped = mapUser(sbUser, profileWithBalance, profileWithBalance?.calculatedBalance || 0);
        
        // Solo actualizamos si los datos realmente cambiaron (evita bucles)
        setUser(prev => {
          if (JSON.stringify(prev) === JSON.stringify(mapped)) return prev;
          return mapped;
        });

        setBusinessStatus(bStatus);
        setActiveScan(pendingScan);
        localStorage.setItem(CACHE_KEY, JSON.stringify(mapped));
        const isGeneric = !profileWithBalance?.full_name || profileWithBalance.full_name === 'SOCIO GOLDEN';
        setNeedsOnboarding(isGeneric);
      }
    } catch (err: any) {
      console.error("Critical Auth Sync Fail:", err);
      
      if (err.message?.includes('CONEXION_FALLIDA')) {
        setConnectionError(err.message);
      } else {
        if (isMounted.current) {
          // Si falla la sincronización y no es por red, es probable que la sesión sea inválida
          supabase.auth.signOut().catch(() => {});
          setUser(null);
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } finally {
      setIsProfileLoading(false);
      setLoading(false); 
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!isConfigured) return;
    try {
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (sbUser) await hydrateProfile(sbUser);
    } catch (e) {
      console.warn("Refresh profile fail, likely session error.");
    }
  }, [hydrateProfile]);

  useEffect(() => {
    isMounted.current = true;
    
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (isMounted.current) {
        console.warn("Auth safety timeout reached. Forcing loading to false.");
        setLoading(false);
      }
    }, 5000);

    // Comprobación inicial de sesión con manejo de errores para Refresh Token
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      clearTimeout(safetyTimeout);
      
      if (error) {
        console.error("Session fetch error:", error);
        if (error.message?.includes('Refresh Token Not Found') || error.message?.includes('invalid_grant')) {
          supabase.auth.signOut();
          setUser(null);
          localStorage.removeItem(CACHE_KEY);
        }
        setLoading(false);
        return;
      }

      if (session?.user) {
        hydrateProfile(session.user);
      } else {
        setLoading(false);
      }
    }).catch(err => {
      clearTimeout(safetyTimeout);
      console.error("Initial session promise rejection:", err);
      if (err.message?.includes('Refresh Token Not Found')) {
        supabase.auth.signOut();
      }
      setUser(null);
      localStorage.removeItem(CACHE_KEY);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem(CACHE_KEY);
        setLoading(false);
      } else if (session?.user) {
        hydrateProfile(session.user);
      }
    });

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [hydrateProfile]);

  const signIn = async (email: string, password?: string) => api.auth.signIn(email, password);
  const signUp = async (email: string, password?: string) => api.auth.signUp(email, password);
  
  const signOut = async () => {
    try {
      if (isConfigured) await supabase.auth.signOut();
    } catch (e) {
      console.warn("SignOut failed but continuing local cleanup");
    } finally {
      setUser(null);
      localStorage.removeItem(CACHE_KEY);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, isProfileLoading, needsOnboarding, businessStatus, activeScan,
      signIn, signUp, signOut, refreshProfile, setActiveScan,
      isAuthenticated: !!user,
      connectionError
    }}>
      {children}
    </AuthContext.Provider>
  );
};