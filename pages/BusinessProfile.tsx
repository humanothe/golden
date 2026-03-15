import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Business, Product } from '../types';
import { api } from '../services/api';
import { ArrowLeft, Star, Clock, MapPin, Plus, Info } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

export const BusinessProfile: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'menu' | 'info'>('menu');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    const fetch = async () => {
      if (!businessId) return;
      const biz = await api.data.getBusinessById(businessId);
      const prods = await api.data.getProductsByBusiness(businessId);
      setBusiness(biz || null);
      setProducts(prods);
      setLoading(false);
    };
    fetch();
  }, [businessId]);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  
  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  if (loading) return null; // Parent layout handles loading spinner via Route

  if (!business) return (
    <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Negocio no encontrado</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-light-50 dark:bg-dark-950 pb-28">
      
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <img src={business.image_url} alt={business.name} className="w-full h-full object-cover" />
        
        {/* Top Nav - Redirects to /partners */}
        <div className="absolute top-6 left-6 z-20">
            <button onClick={() => navigate('/partners')} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors">
                <ArrowLeft size={20} />
            </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="relative z-20 -mt-10 px-4 max-w-5xl mx-auto">
        <div className="glass-panel p-6 rounded-[2rem] bg-white/90 dark:bg-dark-900/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-xl flex flex-col md:flex-row gap-6 items-start">
            
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-md -mt-12 md:-mt-0 md:mb-0 shrink-0">
                <img src={business.logo_url || business.image_url} alt="Logo" className="w-full h-full object-cover rounded-xl" />
            </div>

            <div className="flex-1">
                <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">{business.name}</h1>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <span className="flex items-center gap-1"><Star size={14} className="text-gold-400 fill-current" /> {business.rating} ({business.rating_count}+)</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {business.delivery_time || '30-45 min'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 uppercase tracking-wider text-[10px] font-bold">{business.category}</span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 font-light">{business.description}</p>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="flex gap-8 border-b border-gray-200 dark:border-white/10 mb-6">
            <button 
                onClick={() => setActiveTab('menu')}
                className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'menu' ? 'text-gold-600 dark:text-gold-400' : 'text-gray-400'}`}
            >
                Menú
                {activeTab === 'menu' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gold-400"></span>}
            </button>
            <button 
                onClick={() => setActiveTab('info')}
                className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'info' ? 'text-gold-600 dark:text-gold-400' : 'text-gray-400'}`}
            >
                Información
                {activeTab === 'info' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gold-400"></span>}
            </button>
        </div>

        {activeTab === 'menu' ? (
            <>
                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-4">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap transition-all ${
                                activeCategory === cat 
                                ? 'bg-black dark:bg-white text-white dark:text-black' 
                                : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
                            }`}
                        >
                            {cat === 'all' ? 'Todos' : cat}
                        </button>
                    ))}
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProducts.map(product => (
                        <div 
                            key={product.id}
                            onClick={() => navigate(`/product/${product.id}`)} 
                            className="glass-panel p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-gold-400/30 flex gap-4 cursor-pointer group transition-all"
                        >
                            <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="flex flex-col flex-1 justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{product.name}</h3>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 font-light">{product.description}</p>
                                </div>
                                <div className="flex justify-between items-end mt-2">
                                    <span className="font-mono text-gold-600 dark:text-gold-400 font-bold">${product.price.toLocaleString()}</span>
                                    <div className="p-2 bg-black dark:bg-white rounded-full text-white dark:text-black">
                                        <Plus size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </>
        ) : (
            /* Info Tab */
            <div className="glass-panel p-6 rounded-2xl bg-white/60 dark:bg-white/5 space-y-6">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><MapPin size={16} /> Ubicación</h3>
                    <p className="text-sm text-gray-500 font-light">{business.address || 'Ubicación no disponible'}</p>
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><Clock size={16} /> Horarios</h3>
                    <p className="text-sm text-gray-500 font-light">Lunes - Domingo: 10:00 AM - 10:00 PM</p>
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><Info size={16} /> Detalles</h3>
                    <p className="text-sm text-gray-500 font-light">{business.description}</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};