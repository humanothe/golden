
import { Commodity, GoldenService, Asset } from '../types';

export const MOCK_COMMODITIES: Commodity[] = [
    {
        id: 'c1',
        name: 'Arroz Super Selecto',
        market_price: 45.00,
        base_cost: 22.00,
        image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=2070',
        unit: 'Libras',
        category: 'Granos',
        is_golden_original: true,
        description: 'Grano entero, 99% libre de impurezas. Cosecha premium del Valle.',
        central_stock: 1000,
        partner_reserve: 200,
        min_freeze_days: 15,
        max_freeze_days: 90,
        savings_multiplier: 0.45,
        p15_precio: 42, p15_ahorro_pct: 7,
        p30_precio: 39, p30_ahorro_pct: 13,
        p45_precio: 36, p45_ahorro_pct: 20,
        p60_precio: 32, p60_ahorro_pct: 28,
        p90_precio: 25, p90_ahorro_pct: 44
    },
    {
        id: 'c2',
        name: 'Aceite de Soya Puro',
        market_price: 350.00,
        base_cost: 180.00,
        image_url: 'https://images.unsplash.com/photo-1474979266404-7cadd259c366?q=80&w=2070',
        unit: 'Galón',
        category: 'Aceites',
        is_golden_original: true,
        description: 'Aceite vegetal refinado para todo uso.',
        central_stock: 500,
        partner_reserve: 100,
        min_freeze_days: 15,
        max_freeze_days: 90,
        savings_multiplier: 0.45,
        p15_precio: 330, p15_ahorro_pct: 6,
        p30_precio: 310, p30_ahorro_pct: 11,
        p45_precio: 280, p45_ahorro_pct: 20,
        p60_precio: 240, p60_ahorro_pct: 31,
        p90_precio: 190, p90_ahorro_pct: 46
    },
    {
        id: 'c5',
        name: 'Harina de Trigo Premium',
        market_price: 38.00,
        base_cost: 20.00,
        image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2072',
        unit: 'Libras',
        category: 'Granos',
        is_golden_original: false,
        description: 'Harina de trigo de alta calidad para repostería y panadería.',
        central_stock: 2000,
        partner_reserve: 500,
        min_freeze_days: 15,
        max_freeze_days: 90,
        savings_multiplier: 0.45,
        p15_precio: 36, p15_ahorro_pct: 5,
        p30_precio: 34, p30_ahorro_pct: 10,
        p45_precio: 31, p45_ahorro_pct: 18,
        p60_precio: 28, p60_ahorro_pct: 26,
        p90_precio: 21, p90_ahorro_pct: 44
    }
];

export const MOCK_ASSETS: Asset[] = [
    {
        id: 'a1',
        commodity_id: 'c1',
        name: 'Arroz Super Selecto',
        quantity: 10,
        unit: 'Libras',
        average_price: 32.00,
        image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=2070',
        redeemable: true
    }
];

export const MOCK_SERVICES: GoldenService[] = [
    {
        id: 's1',
        name: 'Golden Prime Logistics',
        description: 'SISTEMA DE ENTREGA PRIORITARIA Y ALMACENAMIENTO SEGURO.',
        image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070',
        category: 'Logística',
        benefit_type: 'utility',
        is_active: true
    }
];

export const calculateFuturePrice = (commodity: Commodity, days: number): number => {
    if (days === 15) return commodity.p15_precio;
    if (days === 30) return commodity.p30_precio;
    if (days === 45) return commodity.p45_precio;
    if (days === 60) return commodity.p60_precio;
    if (days === 90) return commodity.p90_precio;
    return commodity.p15_precio;
};
