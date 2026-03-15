
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
  businessId: string | null; // To ensure cart only has items from one business
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Fix: Avoid React.FC and make children optional to resolve property 'children' missing error
export const CartProvider = ({ children }: { children?: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Load cart from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('golden_cart');
    if (savedCart) {
        try {
            const parsed = JSON.parse(savedCart);
            setItems(parsed.items || []);
            setBusinessId(parsed.businessId || null);
        } catch (e) {
            console.error("Error loading cart", e);
        }
    }
  }, []);

  // Save cart to local storage on change
  useEffect(() => {
    localStorage.setItem('golden_cart', JSON.stringify({ items, businessId }));
  }, [items, businessId]);

  const addItem = (product: Product, quantity: number) => {
    // Check if adding from a different business
    if (businessId && businessId !== product.business_id) {
        if (!window.confirm('¿Deseas vaciar el carrito actual para agregar productos de este nuevo negocio?')) {
            return;
        }
        setItems([]);
    }

    setBusinessId(product.business_id);

    setItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeItem = (productId: string) => {
    setItems(prev => {
        const newItems = prev.filter(item => item.id !== productId);
        if (newItems.length === 0) setBusinessId(null);
        return newItems;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
        removeItem(productId);
        return;
    }
    setItems(prev => prev.map(item => item.id === productId ? { ...item, quantity } : item));
  };

  const clearCart = () => {
    setItems([]);
    setBusinessId(null);
  };

  const cartTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, cartTotal, itemCount, businessId }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
