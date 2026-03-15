import { supabase, isConfigured } from './supabaseClient';
import { 
  User, Business, Product
} from '../types';

const handleApiError = (e: any): string => {
  // Evitamos inundar la consola con logs repetitivos en ráfaga
  const message = e.message || e.error_description || "";
  
  if (!isConfigured) {
    return "ERROR_CONFIG: Nodo sin credenciales.";
  }

  // Captura específica de pérdida de conexión
  if (message === "Failed to fetch" || e.name === 'TypeError' || message.includes('NetworkError')) {
    return "CONEXION_PERDIDA";
  }
  
  if (
    message.includes('Invalid login credentials') || 
    message.includes('invalid_credentials') ||
    message.includes('Refresh Token Not Found')
  ) {
    return "SESION_EXPIRADA";
  }
  
  return message || "ERROR_SINCRO";
};

export const mapUser = (sbUser: any, profile: any, realVaultBalance: number): User => {
  const tier = (profile?.membership_tier || 'Free').toString();
  const cleanEmail = (profile?.email || sbUser?.email || '').toString().trim().toLowerCase();

  return {
    id: sbUser?.id || '',
    email: cleanEmail,
    role: (profile?.rol || 'usuario cliente') as any,
    membership_tier: tier,
    status: profile?.status || 'active', 
    created_at: profile?.created_at || sbUser?.created_at,
    full_name: profile?.full_name || 'SOCIO GOLDEN', 
    phone: profile?.telefono || '', 
    vault_balance: realVaultBalance,
    points_balance: realVaultBalance, 
    projected_savings: 0, 
    profile_completed: !!profile?.full_name && profile.full_name !== 'SOCIO GOLDEN' && profile.full_name !== 'Socio Golden',
    membership_selected: tier.toLowerCase() !== 'free',
    has_seen_plans: profile?.has_seen_plans || false,
    address_street: profile?.address_street,
    address_number: profile?.address_number,
    sector: profile?.provincia || profile?.sector 
  };
};

export const api = {
  auth: {
    signIn: async (email: string, password?: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email: email.trim().toLowerCase(), 
          password: password || '' 
        });
        if (error) return { user: null, error: handleApiError(error) };
        return { user: data.user, error: null };
      } catch (e: any) {
        return { user: null, error: handleApiError(e) };
      }
    },
    signUp: async (email: string, password?: string) => {
      try {
        const { data, error } = await supabase.auth.signUp({ 
            email: email.trim().toLowerCase(), 
            password: password || '',
            options: { 
              data: { 
                full_name: 'Socio Golden',
                rol: 'usuario cliente',
                tipo_usuario: 'socio'
              } 
            }
          });
          return { user: data.user, error: error ? handleApiError(error) : null };
      } catch (e: any) {
          return { user: null, error: handleApiError(e) };
      }
    },
    syncUserProfile: async (sbUser: any) => {
      if (!sbUser) return null;
      try {
        const userEmail = sbUser.email.toLowerCase().trim();
        const { data: profile, error } = await supabase
          .from('perfiles')
          .select('id, full_name, membership_tier, status, created_at, telefono, provincia, has_seen_plans')
          .eq('id', sbUser.id)
          .maybeSingle();
        
        if (error) console.error("Profile fetch error:", error);

        const { data: ledgerRows, error: ledgerError } = await supabase
          .from('mi_saldo')
          .select('monto')
          .eq('socio_email', userEmail)
          .neq('socio_email', 'golden@gmail.com');

        if (ledgerError) console.error("Ledger fetch error:", ledgerError);

        const calculatedBalance = ledgerRows?.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0) || 0;
        
        // Retornamos un objeto base si el perfil no existe para evitar el crash AUTH_SYNC_FAILED
        return { 
          ...(profile || { id: sbUser.id, full_name: 'SOCIO GOLDEN', membership_tier: 'Free' }), 
          calculatedBalance 
        };
      } catch (e) {
        console.error("syncUserProfile critical error:", e);
        return null; 
      }
    },
    updateProfile: async (userId: string, updates: any) => {
      try {
        const { data, error } = await supabase.from('perfiles').update(updates).eq('id', userId);
        if (error) throw error;
        return { data, error: null };
      } catch (e) {
        return { data: null, error: handleApiError(e) };
      }
    }
  },
  data: {
    getVaultHistory: async (email: string) => {
      try {
        const { data, error } = await supabase
          .from('mi_saldo')
          .select('id, monto, concepto, created_at, socio_email')
          .eq('socio_email', email.toLowerCase().trim())
          .neq('socio_email', 'golden@gmail.com')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (e) { return []; }
    },
    getLastRecharges: async (userId: string) => {
      try {
        const { data } = await supabase
          .from('tarjetas_golden')
          .select('id, codigo_pin, valor_punto, fecha_uso, estado')
          .eq('perfil_id', userId)
          .order('fecha_uso', { ascending: false });
        return data || [];
      } catch (e) { return []; }
    },
    getMyBusiness: async (userId: string) => {
      try {
        const { data } = await supabase
          .from('solicitudes_registro')
          .select('id, nombre_negocio, categoria, provincia, email_contacto, logo_url')
          .eq('dueño_id', userId)
          .maybeSingle();
        return data;
      } catch (e) { return null; }
    },
    getBusinessById: async (id: string) => {
      try {
        const { data } = await supabase
          .from('solicitudes_registro')
          .select('id, nombre_negocio, categoria, provincia, email_contacto, logo_url, descripcion_negocio, direccion, portada_url')
          .eq('id', id)
          .maybeSingle();
        if (!data) return null;
        return {
          id: data.id,
          name: data.nombre_negocio,
          description: data.descripcion_negocio || '',
          logo_url: data.logo_url,
          image_url: data.portada_url || '',
          category: data.categoria,
          rating: 4.8,
          rating_count: 120,
          delivery_time: '20-35 min',
          address: data.direccion,
          zone: data.provincia
        } as Business;
      } catch (e) { return null; }
    },
    getProductsByBusiness: async (businessId: string) => {
      try {
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('business_id', businessId);
        return data || [];
      } catch (e) { return []; }
    },
    getProductById: async (id: string) => {
      try {
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        return data as Product;
      } catch (e) { return null; }
    },
    createOrder: async (orderData: any) => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single();
        if (error) throw error;
        return { success: true, data };
      } catch (e: any) {
        return { success: false, message: e.message };
      }
    },
    getOrders: async (userId: string) => {
      try {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        return data || [];
      } catch (e) { return []; }
    },
    getDriverActiveOrders: async (driverId: string) => {
      try {
        const { data } = await supabase
          .from('golden_congelados')
          .select('*')
          .eq('entregado_por', driverId)
          .in('estado_entrega', ['recogido', 'en_camino'])
          .order('fecha_inicio', { ascending: false });
        
        return (data || []).map(item => ({
          id: item.id,
          user_id: item.socio_email,
          business_id: item.negocio_id_asignado,
          business_name: `NODO_${item.negocio_id_asignado?.slice(0,6)}`,
          business_address: 'Almacén Golden',
          customer_name: item.socio_email.split('@')[0].toUpperCase(),
          customer_address: 'Dirección Registrada',
          customer_phone: '---',
          total: Number(item.precio_congelado),
          status: item.estado_entrega === 'recogido' ? 'picked_up' : 'ready',
          created_at: item.fecha_inicio,
          items: []
        }));
      } catch (e) { return []; }
    },
    getDeliveryPool: async (_driverId: string) => {
      try {
        const { data } = await supabase
          .from('golden_congelados')
          .select('*')
          .eq('metodo_entrega', 'domicilio')
          .eq('estado_entrega', 'pendiente')
          .is('entregado_por', null);
        
        return (data || []).map(item => ({
          id: item.id,
          user_id: item.socio_email,
          business_id: item.negocio_id_asignado,
          business_name: `NODO_${item.negocio_id_asignado?.slice(0,6)}`,
          business_address: 'Almacén Golden',
          customer_name: item.socio_email.split('@')[0].toUpperCase(),
          customer_address: 'Dirección Registrada',
          customer_phone: '---',
          total: Number(item.precio_congelado),
          status: 'ready',
          created_at: item.fecha_inicio,
          items: []
        }));
      } catch (e) { return []; }
    },
    claimOrder: async (orderId: string, driverId: string) => {
      try {
        const { data, error } = await supabase
          .from('golden_congelados')
          .update({ 
            entregado_por: driverId,
            estado_entrega: 'recogido' 
          })
          .eq('id', orderId)
          .is('entregado_por', null)
          .select();
        return !error && data && data.length > 0;
      } catch (e) { return false; }
    },
    updateOrderStatus: async (orderId: string, status: string) => {
      try {
        const dbStatus = status === 'delivered' ? 'entregado' : 'recogido';
        const updates: any = { estado_entrega: dbStatus };
        if (dbStatus === 'entregado') {
          updates.estado = 'entregado';
        }
        await supabase
          .from('golden_congelados')
          .update(updates)
          .eq('id', orderId);
        return true;
      } catch (e) { return false; }
    },
    getBusinessOrders: async (businessId: string) => {
      try {
        const { data } = await supabase.from('orders')
          .select('id, total, status, created_at')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });
        return data || [];
      } catch (e) { return []; }
    },
    getNotifications: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        const { data } = await supabase.from('notifications')
          .select('id, title, message, type, read, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        return data || [];
      } catch (e) { return []; }
    },
    markNotificationRead: async (id: string) => {
      try {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
        return true;
      } catch (e) { return false; }
    }
  }
};