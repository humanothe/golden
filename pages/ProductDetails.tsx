
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, Business } from '../types';
import { api } from '../services/api';
import { ArrowLeft, Minus, Plus, ShoppingBag, ChevronDown, Share2, ShieldCheck, Truck, Star, Clock, MapPin, Heart, Check } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

export const ProductDetails: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  
  // Accordion States for Golden Layout
  const [openSection, setOpenSection] = useState<string | null>('desc');

  useEffect(() => {
    const fetch = async () => {
      if (!productId) return;
      const p = await api.data.getProductById(productId);
      if (p) {
        setProduct(p);
        const b = await api.data.getBusinessById(p.business_id);
        setBusiness(b || null);
      }
      setLoading(false);
    };
    fetch();
  }, [productId]);

  const handleAddToCart = () => {
      if (!product) return;
      addItem(product, quantity);
      
      // Show Notification
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      
      // Optional: Reset quantity
      setQuantity(1);
  };

  const toggleSection = (section: string) => {
      setOpenSection(openSection === section ? null : section);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-light-50 dark:bg-dark-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-400"></div>
    </div>
  );
  
  if (!product || !business) return <div className="text-center p-10">Producto no encontrado</div>;

  const isGoldenExclusive = product.business_id === 'golden-official';

  // Notification Toast Component
  const NotificationToast = () => (
      <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${showNotification ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-gold-400/30">
            <div className="bg-green-500 rounded-full p-1 text-white">
                <Check size={12} strokeWidth={3} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Agregado al carrito</span>
        </div>
      </div>
  );

  // ==========================================
  // LAYOUT 1: GOLDEN EXCLUSIVE (Editorial/Luxury)
  // ==========================================
  if (isGoldenExclusive) {
    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans flex flex-col md:flex-row animate-fade-in">
           <NotificationToast />

           {/* LEFT: IMMERSIVE IMAGE */}
           <div className="w-full md:w-1/2 h-[50vh] md:h-screen relative overflow-hidden bg-gray-100 dark:bg-gray-900 group">
               <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
               />
               <div className="absolute inset-0 bg-black/10 dark:bg-black/20"></div>
               
               <button 
                    onClick={() => navigate(-1)} 
                    className="absolute top-6 left-6 z-20 p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full transition-colors text-white"
               >
                    <ArrowLeft size={20} />
               </button>
           </div>
    
           {/* RIGHT: EDITORIAL DETAILS */}
           <div className="w-full md:w-1/2 min-h-screen flex flex-col pt-10 px-8 pb-32 md:pb-10 relative bg-white dark:bg-black">
               
               {/* Header Info */}
               <div className="mb-10">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400 mb-3 block">
                            {product.category}
                        </span>
                        <Share2 size={18} className="text-gray-400 hover:text-gold-400 transition-colors cursor-pointer" />
                    </div>
                    
                    <h1 className="text-3xl md:text-5xl font-heading font-light uppercase tracking-tighter leading-none mb-6">
                        {product.name}
                    </h1>
                    <div className="h-px w-20 bg-black dark:bg-white mb-6"></div>
                    <p className="text-2xl font-mono font-medium">${product.price.toLocaleString()}</p>
               </div>
    
               {/* Accordion Details */}
               <div className="flex-1 space-y-0 border-t border-gray-200 dark:border-white/10">
                   
                   {/* Description */}
                   <div className="border-b border-gray-200 dark:border-white/10">
                       <button 
                        onClick={() => toggleSection('desc')}
                        className="w-full py-6 flex justify-between items-center text-xs font-bold uppercase tracking-widest hover:text-gold-500 transition-colors"
                       >
                           <span>Detalles del Producto</span>
                           <ChevronDown size={14} className={`transition-transform duration-300 ${openSection === 'desc' ? 'rotate-180' : ''}`} />
                       </button>
                       <div className={`overflow-hidden transition-all duration-500 ${openSection === 'desc' ? 'max-h-96 opacity-100 pb-6' : 'max-h-0 opacity-0'}`}>
                           <p className="text-sm font-light leading-relaxed text-gray-600 dark:text-gray-400">
                               {product.description || 'Diseñado con los más altos estándares de calidad. Este artículo exclusivo de la colección Golden representa la fusión perfecta entre funcionalidad y estética de lujo.'}
                           </p>
                       </div>
                   </div>
    
                   {/* Shipping */}
                   <div className="border-b border-gray-200 dark:border-white/10">
                       <button 
                        onClick={() => toggleSection('ship')}
                        className="w-full py-6 flex justify-between items-center text-xs font-bold uppercase tracking-widest hover:text-gold-500 transition-colors"
                       >
                           <span>Envío & Garantía</span>
                           <ChevronDown size={14} className={`transition-transform duration-300 ${openSection === 'ship' ? 'rotate-180' : ''}`} />
                       </button>
                       <div className={`overflow-hidden transition-all duration-500 ${openSection === 'ship' ? 'max-h-96 opacity-100 pb-6' : 'max-h-0 opacity-0'}`}>
                           <div className="space-y-4 pt-2">
                               <div className="flex items-center gap-4 p-4 border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5">
                                   <Truck size={20} className="text-gold-500" />
                                   <div>
                                       <p className="text-xs font-bold uppercase">Golden Express</p>
                                       <p className="text-[10px] text-gray-500 uppercase tracking-wider">Envío Prioritario 24h</p>
                                   </div>
                               </div>
                               <div className="flex items-center gap-4 p-4 border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5">
                                   <ShieldCheck size={20} className="text-gold-500" />
                                   <div>
                                       <p className="text-xs font-bold uppercase">Autenticidad</p>
                                       <p className="text-[10px] text-gray-500 uppercase tracking-wider">Certificado Incluido</p>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
    
               {/* Sticky Bottom Actions (Sharp, Square, Minimal) */}
               <div className="fixed bottom-0 left-0 right-0 md:relative md:bg-transparent bg-white dark:bg-black border-t md:border-t-0 border-gray-200 dark:border-white/10 p-6 md:p-0 md:mt-12 z-30">
                    <div className="flex flex-col gap-4">
                        {/* Quantity */}
                        <div className="flex justify-between items-center mb-2 md:mb-0">
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Cantidad</span>
                            <div className="flex items-center border border-black dark:border-white rounded-none">
                                 <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"><Minus size={14} /></button>
                                 <span className="w-10 text-center text-sm font-mono">{quantity}</span>
                                 <button onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-black hover:text-white dark:hover:text-white dark:hover:text-black transition-colors"><Plus size={14} /></button>
                            </div>
                        </div>
    
                        <button 
                            onClick={handleAddToCart}
                            className="w-full bg-black dark:bg-white text-white dark:text-black py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gold-400 dark:hover:bg-gold-400 hover:text-black transition-all duration-300 flex justify-center items-center gap-4"
                        >
                            <span>Agregar a la Bolsa</span>
                            <span className="opacity-50">|</span>
                            <span>${(product.price * quantity).toLocaleString()}</span>
                        </button>
                    </div>
               </div>
    
           </div>
        </div>
      );
  }

  // ==========================================
  // LAYOUT 2: PARTNER STANDARD (App Delivery Style)
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 pb-32 animate-fade-in relative">
        <NotificationToast />

        {/* Header Image with Overlay */}
        <div className="relative h-72 w-full">
            <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            
            {/* Top Nav */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors shadow-lg"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex gap-3">
                     <button className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors shadow-lg">
                        <Heart size={20} />
                    </button>
                    <button className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors shadow-lg">
                        <Share2 size={20} />
                    </button>
                </div>
            </div>
            
            {/* Business Mini Badge */}
            <div className="absolute bottom-6 left-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white p-0.5 shadow-lg overflow-hidden">
                    <img src={business.logo_url || business.image_url} alt={business.name} className="w-full h-full object-cover rounded-full" />
                </div>
                <div>
                    <p className="text-white text-xs font-bold shadow-black drop-shadow-md">{business.name}</p>
                    <div className="flex items-center text-gold-400 text-[10px] gap-1">
                        <Star size={10} fill="currentColor" /> {business.rating}
                    </div>
                </div>
            </div>
        </div>

        {/* Content Container - Overlapping */}
        <div className="relative -mt-6 rounded-t-[2.5rem] bg-white dark:bg-dark-900 px-6 pt-10 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            
            {/* Drag Handle (Visual Only) */}
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mb-8"></div>

            <div className="flex justify-between items-start mb-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight w-3/4">
                    {product.name}
                </h1>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    ${product.price.toLocaleString()}
                </p>
            </div>

            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
                {product.description || 'Disfruta de la mejor calidad seleccionada por nuestros socios exclusivos.'}
            </p>

            {/* Additional Info Tags */}
            <div className="flex gap-4 mb-8 overflow-x-auto no-scrollbar py-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 shrink-0">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{business.delivery_time || '30-45 min'}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 shrink-0">
                    <MapPin size={16} className="text-gray-400" />
                    {/* Fix: Business type doesn't have zone, casting to any or using a safe fallback */}
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{(business as any).zone || 'Zona VIP'}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gold-400/10 border border-gold-400/20 shrink-0">
                    <Star size={16} className="text-gold-500" />
                    <span className="text-xs font-bold text-gold-600 dark:text-gold-400">Popular</span>
                </div>
            </div>

            {/* Notes Section */}
            <div className="mb-24">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Notas para el pedido</h3>
                <textarea 
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm focus:ring-2 focus:ring-gold-400 focus:outline-none transition-all placeholder-gray-400"
                    placeholder="Ej. Sin cebolla, término medio, envolver para regalo..."
                    rows={3}
                ></textarea>
            </div>

        </div>

        {/* Floating Bottom Bar (Rounded, Friendly) */}
        <div className="fixed bottom-0 left-0 right-0 p-4 z-40 bg-white/80 dark:bg-dark-900/90 backdrop-blur-md border-t border-gray-200 dark:border-white/5">
            <div className="max-w-lg mx-auto flex items-center gap-4">
                
                {/* Quantity - Pill Shape */}
                <div className="flex items-center gap-4 bg-gray-100 dark:bg-white/10 rounded-full px-4 py-3 h-14">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-gray-500 hover:text-black dark:hover:text-white"><Minus size={18} /></button>
                    <span className="font-bold text-lg min-w-[20px] text-center">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="text-gray-500 hover:text-black dark:hover:text-white"><Plus size={18} /></button>
                </div>

                {/* Add Button - Colorful/Friendly */}
                <button 
                    onClick={handleAddToCart}
                    className="flex-1 bg-black dark:bg-white text-white dark:text-black rounded-full h-14 font-bold text-sm uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex justify-between items-center px-6"
                >
                    <span>Agregar</span>
                    <span className="bg-white/20 dark:bg-black/10 px-3 py-1 rounded-full text-xs">
                        ${(product.price * quantity).toLocaleString()}
                    </span>
                </button>
            </div>
        </div>

    </div>
  );
};