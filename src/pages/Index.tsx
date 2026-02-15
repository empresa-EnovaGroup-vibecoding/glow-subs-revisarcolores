import { useState, lazy, Suspense } from 'react';
import { PageView } from '@/types';
import { DataProvider } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import Dashboard from '@/pages/Dashboard';

const CalendarioPage = lazy(() => import('@/pages/CalendarioPage'));
const PanelesPage = lazy(() => import('@/pages/PanelesPage'));
const ClientesPage = lazy(() => import('@/pages/ClientesPage'));
const FinanzasPage = lazy(() => import('@/pages/FinanzasPage'));
const ServiciosPage = lazy(() => import('@/pages/ServiciosPage'));
const ConfiguracionPage = lazy(() => import('@/pages/ConfiguracionPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));

function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageView>('dashboard');
  const [pendingSearch, setPendingSearch] = useState('');

  const navigateWithSearch = (page: PageView, search: string) => {
    setPendingSearch(search);
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentPage} onNavigateToPanel={(search) => navigateWithSearch('paneles', search)} />;
      case 'calendario': return <CalendarioPage />;
      case 'paneles': return <PanelesPage initialSearch={pendingSearch} onSearchConsumed={() => setPendingSearch('')} />;
      case 'clientes': return <ClientesPage />;
      case 'finanzas': return <FinanzasPage />;
      case 'servicios': return <ServiciosPage />;
      case 'configuracion': return <ConfiguracionPage />;
    }
  };

  return (
    <DataProvider>
      <AppLayout currentPage={currentPage} onNavigate={setCurrentPage}>
        <Suspense fallback={<div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Cargando...</div>}>
          {renderPage()}
        </Suspense>
      </AppLayout>
    </DataProvider>
  );
}

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return <AppContent />;
};

export default Index;
