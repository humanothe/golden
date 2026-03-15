import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext<{ isAuthenticated: boolean; loading: boolean }>({
  isAuthenticated: false,
  loading: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated] = useState(false);
  const [loading] = useState(false);

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
