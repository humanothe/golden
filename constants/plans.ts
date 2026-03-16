
export interface PlanDefinition {
  id: string;
  name: string;
  price_monthly: number;
  benefits: string[];
  limit: number;
  description: string;
  possibilities: string[];
}

export const MEMBERSHIP_PLANS: PlanDefinition[] = [
  {
    id: 'plan_bronce',
    name: 'Bronce',
    price_monthly: 500,
    description: 'Ideal para iniciarse en la protección de capital con activos reales.',
    benefits: [
      'Acceso al mercado Golden',
      'Soporte estándar',
      'Congelado Básico (Hasta 5 activos)',
      '1% Cashback en recargas'
    ],
    limit: 5,
    possibilities: [
      'Retiro físico en puntos autorizados',
      'Acceso a la red de beneficios básica'
    ]
  },
  {
    id: 'plan_plata',
    name: 'Plata',
    price_monthly: 1500,
    description: 'Optimiza tus ahorros con límites extendidos y beneficios exclusivos.',
    benefits: [
      'Soporte prioritario 24/7',
      'Congelado Avanzado (Hasta 20 activos)',
      '3% Cashback en recargas',
      'Acceso a ofertas relámpago'
    ],
    limit: 20,
    possibilities: [
      '15% de descuento en tarifas de envío',
      'Acceso a preventas de lotes exclusivos',
      'Participación en sorteos mensuales'
    ]
  },
  {
    id: 'plan_oro',
    name: 'Oro',
    price_monthly: 3500,
    description: 'La experiencia definitiva para el inversionista serio con libertad total.',
    benefits: [
      'Gestor de cuenta dedicado',
      'Congelado Ilimitado',
      '5% Cashback en recargas',
      'Cero comisiones en transferencias'
    ],
    limit: 1000, // Representing unlimited for practical purposes
    possibilities: [
      'Envíos gratis en pedidos > 2000 GP',
      'Invitaciones a eventos exclusivos',
      'Acceso a productos premium antes que nadie'
    ]
  }
];
