
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CartProvider } from './contexts/CartContext';
import { UIProvider, useUI } from './contexts/UIContext'; 
import { Layout } from './components/Layout';
import { Welcome } from './pages/Welcome';
import { AuthPage } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Market } from './pages/Market';
import { Wallet } from './pages/Wallet';
import { Profile } from './pages/Profile';
import { BusinessAdmin } from './pages/BusinessAdmin';
import { Onboarding } from './pages/Onboarding'; 
import { MembershipSelection } from './pages/MembershipSelection';
import { PartnerProfile } from './pages/PartnerProfile';
import { Partners } from './pages/Partners';
import { HistoryPage } from './pages/History';
import { WaitingScreen } from './pages/ApplicationStatus';
import { RoleApplication } from './pages/RoleApplication';
import { WaitingApprovalScreen } from './pages/WaitingApprovalScreen';
import { BenefitsView } from './pages/BenefitsView';
import { Portfolio } from './pages/Portfolio';
import { Loader2 } from 'lucide-react';
import { supabase } from './services/supabaseClient';

const SplashScreen = () => (
  <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center text-white p-6">
    <div className="relative w-16 h-16 mb-12 flex items-center justify-center">
      <div className="absolute inset-0 bg-gold-400/20 blur-xl rounded-full animate-pulse"></div>
      <Loader2 className="w-10 h-10 text-gold-400 animate-spin relative z-10" />
    </div>
    <div className="space-y-2 text-center">
      <h2 className="text-xl text-white font-heading font-normal uppercase tracking-[0.4em] animate-fade-in">
        Golden Acceso
      </h2>
      <p className="text-[10px] text-gold-400/60 font-sans font-light uppercase tracking-[0.6em] animate-pulse">
        conectando
      </p>
    </div>
  </div>
);

function GlobalTransactionMonitor({ children }: { children?: React.ReactNode }) {
  const { user, activeScan, setActiveScan, loading, connectionError } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // SUSPENSIÓN DE REALTIME: Si no hay usuario, está cargando o hay error de conexión, no iniciamos canales.
    if (!user?.email || loading || connectionError) return;
    
    try {
      const userEmailClean = user.email.toLowerCase().trim();
      const scanChannel = supabase
        .channel(`scan-monitor-global-${user.id}`)
        .on('postgres_changes', {
          event: '*', 
          schema: 'public',
          table: 'solicitudes_escaneo',
          filter: `socio_email=eq."${userEmailClean}"`
        }, (payload) => {
          const scan = payload.new as any;
          if (scan && !scan.nueva_consulta) {
            setActiveScan(scan);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(scanChannel);
      };
    } catch (e) {
      console.warn("Error en monitor de transacciones:", e);
    }
    // Usamos user.id para evitar re-suscripciones innecesarias si el objeto user cambia pero es el mismo socio
  }, [user?.id, setActiveScan, loading, connectionError]);

  const isBenefitsPage = location.pathname.includes('/benefits');
  const isWaitingPage = location.pathname.includes('/waiting-approval');
  
  const shouldBlock = activeScan && 
                     activeScan.estado === 'pendiente' && 
                     !activeScan.nueva_consulta && 
                     !isBenefitsPage &&
                     !isWaitingPage;

  if (shouldBlock) {
    return <Navigate to="/waiting-approval" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, loading: authLoading, needsOnboarding, businessStatus, connectionError } = useAuth();
  const { loading: uiLoading } = useUI();

  if (authLoading || uiLoading) {
    return <SplashScreen />;
  }

  return (
    <>
      {connectionError && (
        <div className="fixed top-0 left-0 right-0 z-[10000] bg-red-600 text-white text-[10px] py-2 px-4 text-center font-bold uppercase tracking-widest animate-pulse">
          {connectionError}
        </div>
      )}
      <Routes>
      <Route path="/" element={
        isAuthenticated 
          ? (needsOnboarding ? <Navigate to="/onboarding" replace /> : <Navigate to="/dashboard" replace />)
          : <Welcome />
      } />
      
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage mode="login" />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage mode="register" />} />
      
      <Route path="/onboarding" element={isAuthenticated ? <Onboarding /> : <Navigate to="/login" replace />} />
      
      <Route path="/dashboard" element={!isAuthenticated ? <Navigate to="/login" replace /> : needsOnboarding ? <Navigate to="/onboarding" replace /> : <Layout><Dashboard /></Layout>} />
      <Route path="/profile" element={!isAuthenticated ? <Navigate to="/login" replace /> : <Layout><Profile /></Layout>} />
      <Route path="/business-admin" element={!isAuthenticated ? <Navigate to="/login" replace /> : businessStatus === 'approved' ? <BusinessAdmin /> : <Navigate to="/dashboard" replace />} />
      <Route path="/market" element={!isAuthenticated ? <Navigate to="/login" replace /> : <Layout><Market /></Layout>} />
      <Route path="/wallet" element={!isAuthenticated ? <Navigate to="/login" replace /> : <Layout><Wallet /></Layout>} />
      <Route path="/portfolio" element={!isAuthenticated ? <Navigate to="/login" replace /> : <Layout><Portfolio /></Layout>} />
      <Route path="/partners" element={!isAuthenticated ? <Navigate to="/login" replace /> : <Layout><Partners /></Layout>} />
      <Route path="/history" element={!isAuthenticated ? <Navigate to="/login" replace /> : <Layout><HistoryPage /></Layout>} />
      <Route path="/partner/:partnerId" element={!isAuthenticated ? <Navigate to="/login" replace /> : <Layout><PartnerProfile /></Layout>} />
      <Route path="/plans" element={!isAuthenticated ? <Navigate to="/login" replace /> : <Layout><MembershipSelection /></Layout>} />
      
      <Route path="/waiting-approval" element={!isAuthenticated ? <Navigate to="/login" replace /> : <WaitingApprovalScreen />} />
      <Route path="/benefits/:scanId" element={!isAuthenticated ? <Navigate to="/login" replace /> : <Layout><BenefitsView /></Layout>} />

      <Route path="/role-application" element={
        !isAuthenticated ? <Navigate to="/login" replace /> :
        businessStatus === 'pending' ? <Navigate to="/espera" replace /> :
        businessStatus === 'approved' ? <Navigate to="/profile" replace /> : <RoleApplication />
      } />
      
      <Route path="/espera" element={
        !isAuthenticated ? <Navigate to="/login" replace /> : 
        businessStatus === 'approved' ? <Navigate to="/profile" replace /> : 
        businessStatus === 'pending' ? <WaitingScreen /> : <Navigate to="/dashboard" replace />
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
);
}

function App() {
  return (
    <ThemeProvider>
      <UIProvider> 
        <AuthProvider>
          <CartProvider>
            <Router>
              <GlobalTransactionMonitor>
                <AppRoutes />
              </GlobalTransactionMonitor>
            </Router>
          </CartProvider>
        </AuthProvider>
      </UIProvider>
    </ThemeProvider>
  );
}

export default App;
