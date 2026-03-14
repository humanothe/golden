
import React, { createContext, useContext, useEffect } from 'react';

interface ThemeContextType {
  theme: 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Fix: Avoid React.FC and make children optional to resolve property 'children' missing error
export const ThemeProvider = ({ children }: { children?: React.ReactNode }) => {
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light');
    root.classList.add('dark');
    // Forzamos el color-scheme del navegador
    root.style.colorScheme = 'dark';
  }, []);

  const toggleTheme = () => {
    // Deshabilitado: Forzado a Dark Mode
    console.log("Modo oscuro forzado por arquitectura.");
  };

  return (
    <ThemeContext.Provider value={{ theme: 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
