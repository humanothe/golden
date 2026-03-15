import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext<{ loading: boolean }>({ loading: false });

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading] = useState(false);
  return <UIContext.Provider value={{ loading }}>{children}</UIContext.Provider>;
};

export const useUI = () => useContext(UIContext);
