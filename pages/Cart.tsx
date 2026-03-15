
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { ArrowLeft, Trash2, Minus, Plus, CreditCard, MapPin, Truck, ChevronRight, Wallet, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, updateQuantity, removeItem, cartTotal, clearCart, businessId } = useCart();
  
  // Checkout State
  const [address, setAddress] = useState(user?.address_street ? `${user.address_street} #${user.address_number}, ${user.sector}` : 'Dirección no configurada');
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express'>('express');
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'card'>('balance');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deliveryFee = deliveryMethod === 'express' ? 250 : 150;
  const serviceFee = cartTotal * 0.05;
  const total = cartTotal + deliveryFee + serviceFee;
  
  // Real Balance Check
  const balance = user?.vault_balance || 0; // Using vault_balance for purchases

  const handleCheckout = async () => {
      if (!user) return;
      if (!businessId) { setError("Error de carrito. Intenta recargar."); return; }
      
      // Payment Validation
      if (paymentMethod === 'balance' && balance < total) {
          setError(`Saldo insuficiente. Tienes $${balance.toLocaleString()}`);
          return;
      }

      setIsProcessing(true);
      setError(null);

      try {
          // CREATE REAL ORDER
          const result = await api.data.createOrder({
              user_id: user.id,
              business_id: businessId,
              items: items,
              total: total,
              delivery_method: deliveryMethod,
              payment_method: paymentMethod
          });

          if (result.success) {
              clearCart();
              navigate('/order-tracking');
          } else {
              setError("Error al procesar el pedido. " + (result.message || ''));
          }
      } catch (e) {
          setError("Error de conexión");
      } finally {
          setIsProcessing(false);
      }
  };

  if (items.length === 0) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-white dark:bg-black">
              <h2 className="text-4xl font-heading font-light mb-4 text-black dark:text-white">BOLSA VACÍA</h2>
              <p className="text-gray-500 mb-8 font-light max-w-xs mx-auto">Tu colección personal espera ser completada.</p>
              <button 
                onClick={() => navigate('/market')}
                className="px-10 py-4 border border-black dark:border-white text-black dark:text-white font-bold uppercase tracking-[0.2em] hover:bg-black dark:hover:bg-white hover:text-black dark:hover:text-white hover:bg-black dark:hover:bg-white transition-all"
              >
                  Explorar Market
              </button>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-light-50 dark:bg-white dark:bg-black text-black dark:text-white pb-32">
      
      {/* Header */}
      <div className="pt-[env(safe-area-inset-top)] sticky top-0 z-40 bg-black border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 text-white">
                <button onClick={() => navigate(-1)} className="hover:text-gold-500 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-heading text-lg font-bold tracking-widest uppercase">Checkout</h1>
            </div>
            <span className="font-mono text-sm font-bold text-gold-400">{items.reduce((acc, i) => acc + i.quantity, 0)} ITEMS</span>
      </div>

      <div className="max-w-4xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* LEFT COLUMN: DETAILS */}
        <div className="lg:col-span-2 space-y-12">
            
            {/* 1. Items */}
            <section>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 border-b border-gray-200 dark:border-black/10 dark:border-white/10 pb-2">1. Tu Selección</h2>
                <div className="space-y-6">
                    {items.map(item => (
                        <div key={item.id} className="flex gap-4 group">
                            <div className="w-24 h-32 bg-gray-100 dark:bg-gray-900 overflow-hidden shrink-0 relative">
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-heading font-bold uppercase text-sm tracking-wide">{item.name}</h3>
                                        <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                                </div>
                                
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-4 border border-gray-200 dark:border-black/10 dark:border-white/10 px-2 py-1">
                                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="hover:text-gold-500"><Minus size={12} /></button>
                                        <span className="text-xs font-mono w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="hover:text-gold-500"><Plus size={12} /></button>
                                    </div>
                                    <p className="font-mono text-sm">${(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 2. Delivery */}
            <section>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 border-b border-gray-200 dark:border-black/10 dark:border-white/10 pb-2">2. Entrega</h2>
                
                <div className="bg-white dark:bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-black/10 dark:border-white/10 p-4 mb-4 flex items-center gap-4">
                    <div className="bg-gray-100 dark:bg-black/10 dark:bg-white/10 p-2 rounded-full">
                        <MapPin size={20} />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase text-gray-500">Dirección de Envío</p>
                        <input 
                            type="text" 
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-black dark:text-white"
                        />
                    </div>
                    <button onClick={() => navigate('/profile')} className="text-[10px] font-bold uppercase text-gold-500 underline">Editar</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div 
                        onClick={() => setDeliveryMethod('express')}
                        className={`p-4 border cursor-pointer transition-all flex items-start gap-3 ${deliveryMethod === 'express' ? 'border-gold-400 bg-gold-400/5' : 'border-gray-200 dark:border-black/10 dark:border-white/10'}`}
                    >
                        <Truck className={deliveryMethod === 'express' ? 'text-gold-500' : 'text-gray-400'} size={20} />
                        <div>
                            <p className="font-bold text-sm uppercase">Golden Express</p>
                            <p className="text-xs text-gray-500 mt-1">Entrega Inmediata (24h)</p>
                            <p className="text-xs font-mono font-bold mt-2">$250.00</p>
                        </div>
                    </div>

                    <div 
                        onClick={() => setDeliveryMethod('standard')}
                        className={`p-4 border cursor-pointer transition-all flex items-start gap-3 ${deliveryMethod === 'standard' ? 'border-gold-400 bg-gold-400/5' : 'border-gray-200 dark:border-black/10 dark:border-white/10'}`}
                    >
                        <Truck className={deliveryMethod === 'standard' ? 'text-gold-500' : 'text-gray-400'} size={20} />
                        <div>
                            <p className="font-bold text-sm uppercase">Estándar</p>
                            <p className="text-xs text-gray-500 mt-1">2-3 Días Laborables</p>
                            <p className="text-xs font-mono font-bold mt-2">$150.00</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Payment */}
            <section>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 border-b border-gray-200 dark:border-black/10 dark:border-white/10 pb-2">3. Pago</h2>
                
                <div className="space-y-3">
                    <div 
                        onClick={() => setPaymentMethod('balance')}
                        className={`p-4 border flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'balance' ? 'border-gold-400 bg-gold-400/5' : 'border-gray-200 dark:border-black/10 dark:border-white/10'}`}
                    >
                        <div className="flex items-center gap-3">
                            <Wallet size={20} className={paymentMethod === 'balance' ? 'text-gold-500' : 'text-gray-400'} />
                            <div>
                                <p className="font-bold text-sm uppercase">Bóveda (Saldo)</p>
                                <p className="text-xs text-gray-500">Disponible: ${balance.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'balance' ? 'border-gold-400' : 'border-gray-400'}`}>
                            {paymentMethod === 'balance' && <div className="w-2 h-2 rounded-full bg-gold-400"></div>}
                        </div>
                    </div>

                    <div 
                        onClick={() => setPaymentMethod('card')}
                        className={`p-4 border flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-gold-400 bg-gold-400/5' : 'border-gray-200 dark:border-black/10 dark:border-white/10'}`}
                    >
                        <div className="flex items-center gap-3">
                            <CreditCard size={20} className={paymentMethod === 'card' ? 'text-gold-500' : 'text-gray-400'} />
                            <div>
                                <p className="font-bold text-sm uppercase">Tarjeta Crédito/Débito</p>
                                <p className="text-xs text-gray-500">Procesado por Stripe</p>
                            </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'card' ? 'border-gold-400' : 'border-gray-400'}`}>
                            {paymentMethod === 'card' && <div className="w-2 h-2 rounded-full bg-gold-400"></div>}
                        </div>
                    </div>
                </div>
            </section>

        </div>

        {/* RIGHT COLUMN: SUMMARY */}
        <div className="lg:col-span-1">
            <div className="sticky top-24 bg-gray-50 dark:bg-black/5 dark:bg-white/5 p-6 md:p-8 space-y-6">
                <h3 className="font-heading font-bold uppercase tracking-widest text-lg">Resumen</h3>
                
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-500">
                        <span>Subtotal</span>
                        <span>${cartTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                        <span>Envío</span>
                        <span>${deliveryFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                        <span>Servicio (5%)</span>
                        <span>${serviceFee.toLocaleString()}</span>
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-black/10 dark:border-white/10 pt-4 flex justify-between items-center">
                    <span className="font-bold uppercase tracking-widest">Total</span>
                    <span className="font-mono font-bold text-xl text-gold-600 dark:text-gold-400">${total.toLocaleString()}</span>
                </div>

                {error && (
                    <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <button 
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full py-4 bg-white dark:bg-black dark:bg-black dark:bg-white text-white dark:text-black dark:text-white dark:text-black font-bold uppercase tracking-[0.2em] hover:bg-gold-400 dark:hover:bg-gold-400 hover:text-black transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 group"
                >
                    {isProcessing ? (
                        <span className="animate-pulse">Procesando...</span>
                    ) : (
                        <>
                            Confirmar <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                        </>
                    )}
                </button>
                
                <p className="text-[10px] text-center text-gray-400 leading-tight">
                    Al confirmar, aceptas los Términos de Servicio de Golden Acceso. Las compras Premium no son reembolsables.
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};
