import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: false,
  user: null,
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated] = useState(false);
  const [loading] = useState(false);
  const [user] = useState<User | null>(null);

  const refreshProfile = useCallback(async () => {
    // Implementation for refreshing profile
    console.log('Refreshing profile...');
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, user, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
