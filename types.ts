

export type Role = 'user' | 'guest' | 'admin' | 'business' | 'shopper' | 'delivery'; 
export type MembershipTier = string; // Cambiado de unión estricta a string para soportar nombres como "Golden Plus"
export type UserStatus = 'active' | 'inactive' | 'blocked' | 'pending';

export interface User {
  id: string;
  email: string;
  role: Role;
  membership_tier: MembershipTier;
  status: UserStatus;
  physical_card_id?: string;
  created_at: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  vault_balance: number;
  points_balance: number; 
  projected_savings: number;
  profile_completed: boolean;
  membership_selected: boolean;
  has_seen_plans: boolean;
  address_street?: string;
  address_number?: string;
  sector?: string;
}

export interface SocioBenefit {
  id: string;
  socio_id: string;
  titulo: string;
  descripcion: string;
  valor_descuento: string;
  tipo: 'fijo' | 'temporal' | 'exclusivo';
  negocio_nombre: string;
  icono?: string;
}

export interface BusinessApplication {
  id: string;
  dueño_id: string;
  nombre_negocio: string;
  eslogan?: string;
  categoria: string;
  ciudad: string;
  modalidad: 'Física' | 'Virtual';
  direccion_oficina: string;
  telefono_comercial: string;
  pais: string;
  tiene_sucursales: boolean;
  tiene_delivery: boolean;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  email_contact: string;
  created_at: string;
}

export interface StaffCredential {
  id: string;
  business_id: string;
  nombre_operador: string;
  pin_acceso: string;
  created_at: string;
}

export interface Commodity {
  id: string;
  name: string;
  market_price: number;
  base_cost: number;
  image_url: string;
  unit: string;
  category: string;
  is_golden_original: boolean;
  description: string;
  central_stock: number;
  partner_reserve: number;
  min_freeze_days: number;
  max_freeze_days: number;
  savings_multiplier: number;
  negocio_id_asignado?: string; // Nuevo campo para logística
  p15_precio: number;
  p15_ahorro_pct: number;
  p30_precio: number;
  p30_ahorro_pct: number;
  p45_precio: number;
  p45_ahorro_pct: number;
  p60_precio: number;
  p60_ahorro_pct: number;
  p90_precio: number;
  p90_ahorro_pct: number;
}

export interface Asset {
  id: string;
  commodity_id: string;
  name: string;
  quantity: number;
  unit: string;
  average_price: number;
  image_url: string;
  redeemable: boolean;
}

export interface GoldenService {
  id: string;
  name: string;
  description: string;
  image_url: string;
  category: string;
  benefit_type: 'utility' | 'reward';
  is_active: boolean;
}

export interface Business {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  image_url: string;
  category: string;
  rating: number;
  rating_count: number;
  delivery_time?: string;
  address?: string;
  zone?: string;
  owner_id?: string;
}

export type AffiliatedPartner = Business & { isPro?: boolean; discount_desc?: string; zone: string };

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  negocio_id_asignado?: string; // Soporte para mercado
}

export interface CartItem extends Product {
  quantity: number;
}

export type OrderStatus = 'pending' | 'processing' | 'ready' | 'picked_up' | 'delivered';

export interface Order {
  id: string;
  user_id: string;
  business_id: string;
  business_name?: string;
  business_address?: string;
  customer_name?: string;
  customer_address?: string;
  customer_phone?: string;
  customer_sector?: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  delivery_method: 'standard' | 'express';
  payment_method: 'balance' | 'card';
  created_at: string;
  driver_id?: string;
}

export type ApplicationType = 'business' | 'shopper' | 'delivery';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'revision';

export interface RoleApplication {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  type: ApplicationType;
  status: ApplicationStatus;
  details?: any;
  admin_feedback?: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'order' | 'promo' | 'system';
  read: boolean;
  action_url?: string;
  created_at: string;
}

export interface LogoSlot {
  id: number;
  url: string;
  targets: string[];
}

export interface UIConfig {
  welcomeBg: string;
  welcomeBgMobile: string;
  welcomeVideo: string;
  welcomeVideoMobile: string;
  welcomeMediaType: 'image' | 'video';
  welcomeMediaTypeMobile: 'image' | 'video';
  primaryGold: string;
  accentBlack: string;
  loginBg: string;
  loginBgMobile: string;
  registerBg: string;
  registerBgMobile: string;
  marketHeroBg: string;
  walletBg: string;
  defaultCardBg: string;
  logoSlots: LogoSlot[];
}