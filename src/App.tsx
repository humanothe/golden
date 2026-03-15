import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Portfolio } from './pages/Portfolio';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Scanner } from './pages/Scanner';
import { ErrorBoundary } from './components/ErrorBoundary';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center bg-black text-gold-400 font-black tracking-[0.5em]">CARGANDO...</div>;
  if (!user) return <Navigate to="/auth" />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/market" element={<ProtectedRoute><div className="p-20 text-center uppercase font-black tracking-widest">Mercado Próximamente</div></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><div className="p-20 text-center uppercase font-black tracking-widest">Wallet Próximamente</div></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/scanner" element={<ProtectedRoute><ErrorBoundary><Scanner /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
