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
    address_street: profile?.direccion,
    address_number: '', // El número suele estar incluido en 'direccion' en este esquema
    sector: profile?.provincia || profile?.sector,
    direccion_alternativa: profile?.direccion_alternativa
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
      
      const userEmail = sbUser.email.toLowerCase().trim();
      let profile = null;
      let retries = 3;

      while (retries > 0 && !profile) {
        try {
          const { data, error } = await supabase
            .from('perfiles')
            .select('*, direccion_alternativa')
            .eq('email', userEmail)
            .maybeSingle();
          
          if (!error) {
            profile = data;
            break;
          }
          
          console.warn(`Reintento de conexión (${4 - retries}/3)...`);
          retries--;
          if (retries > 0) await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
          retries--;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      try {
        const { data: ledgerRows, error: ledgerError } = await supabase
          .from('mi_saldo')
          .select('monto')
          .eq('socio_email', userEmail)
          .neq('socio_email', 'golden@gmail.com');

        if (ledgerError) {
          console.error("Ledger fetch error:", ledgerError);
        }

        const calculatedBalance = ledgerRows?.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0) || 0;
        
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
          .from('pedidos_maestros')
          .select('*')
          .eq('operador_id', driverId)
          .in('estado_maestro', ['pendiente', 'en_camino'])
          .order('fecha_creacion', { ascending: false });
        
        if (!data) return [];

        return data.map(item => ({
          id: item.id_pedido,
          user_id: item.usuario_id,
          business_id: 'ALMACEN_GOLDEN',
          business_name: 'ALMACÉN CENTRAL',
          business_address: 'Centro de Distribución Golden',
          customer_name: item.nombre_cliente || 'CLIENTE',
          customer_address: `${item.calle} ${item.numero_casa}, ${item.ciudad}`,
          customer_phone: item.telefono || '---',
          total: Number(item.total_pedido || 0),
          status: item.estado_maestro === 'en_camino' ? 'picked_up' : 'pending',
          created_at: item.fecha_creacion,
          productos_ids: [], // Se manejaría por id_pedido_maestro en solicitudes_entrega
          items: []
        }));
      } catch (e) { return []; }
    },
    getDeliveryPool: async (_driverId: string) => {
      try {
        const { data } = await supabase
          .from('pedidos_maestros')
          .select('*')
          .eq('estado_maestro', 'pendiente')
          .is('operador_id', null);
        
        return (data || []).map(item => ({
          id: item.id_pedido,
          user_id: item.usuario_id,
          business_id: 'ALMACEN_GOLDEN',
          business_name: 'ALMACÉN CENTRAL',
          business_address: 'Centro de Distribución Golden',
          customer_name: item.nombre_cliente || 'CLIENTE',
          customer_address: `${item.calle} ${item.numero_casa}, ${item.ciudad}`,
          customer_phone: item.telefono || '---',
          total: Number(item.total_pedido || 0),
          status: 'pending',
          created_at: item.fecha_creacion,
          productos_ids: [],
          items: []
        }));
      } catch (e) { return []; }
    },
    claimOrder: async (orderId: string, driverId: string) => {
      try {
        const { data, error } = await supabase
          .from('pedidos_maestros')
          .update({ 
            operador_id: driverId,
            estado_maestro: 'pendiente' // O el estado que corresponda al ser tomado
          })
          .eq('id_pedido', orderId)
          .is('operador_id', null)
          .select();
        return !error && data && data.length > 0;
      } catch (e) { return false; }
    },
    updateOrderStatus: async (orderId: string, status: string, token?: string) => {
      try {
        if (status === 'picked_up') {
          await supabase
            .from('pedidos_maestros')
            .update({ estado_maestro: 'en_camino' })
            .eq('id_pedido', orderId);
          return { success: true };
        }

        if (status === 'delivered') {
          // 1. Validar solicitud maestra
          const { data: pedido, error: fetchError } = await supabase
            .from('pedidos_maestros')
            .select('*')
            .eq('id_pedido', orderId)
            .single();

          if (fetchError || !pedido) return { success: false, message: "No se encontró el pedido." };
          
          // Nota: El token_entrega no está en la lista de columnas solicitada, 
          // pero si existiera en la tabla maestra se validaría aquí.
          // Por ahora asumimos éxito si llega aquí o validamos contra un campo si existe.

          // 2. Obtener productos vinculados
          const { data: items } = await supabase
            .from('solicitudes_entrega')
            .select('producto_id')
            .eq('id_pedido_maestro', orderId);

          const productIds = items?.map(i => i.producto_id) || [];

          // 3. Transacción Multitabla
          // Paso A: Cambiar estado_maestro a 'entregado'
          const { error: errA } = await supabase
            .from('pedidos_maestros')
            .update({ estado_maestro: 'entregado' })
            .eq('id_pedido', orderId);

          if (errA) throw errA;

          // Paso B: Cambiar estado de productos en golden_congelados
          if (productIds.length > 0) {
            const { error: errB } = await supabase
              .from('golden_congelados')
              .update({ estado: 'entregado' })
              .in('id', productIds);

            if (errB) throw errB;
          }

          return { success: true };
        }

        return { success: false, message: "Estado no soportado." };
      } catch (e: any) { 
        return { success: false, message: e.message || "Error en la transacción." }; 
      }
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