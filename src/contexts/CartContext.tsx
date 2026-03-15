import React, { createContext, useContext } from 'react';

const CartContext = createContext({});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <CartContext.Provider value={{}}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
