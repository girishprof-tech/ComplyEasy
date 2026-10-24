import { createBrowserRouter } from 'react-router-dom';
import { ActivatePage } from '@/features/auth/pages/ActivatePage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { PlanPage } from '@/features/account/PlanPage';
import { BusinessSetupPage } from '@/features/business/pages/BusinessSetupPage';
import { PortalPage } from '@/features/business/pages/PortalPage';
import { ClientDetailPage } from '@/features/clients/pages/ClientDetailPage';
import { ClientsPage } from '@/features/clients/pages/ClientsPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { LandingPage } from '@/features/landing/LandingPage';
import { AppShell } from './layout/AppShell';
import { RequireAuth, RequireRole } from './guards/RouteGuards';

function NotFound() {
  return (
    <div className="container">
      <div className="empty-state">
        <h3>Page not found</h3>
        <p>The page you're looking for doesn't exist.</p>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/activate', element: <ActivatePage /> },
      {
        element: <RequireRole role="accountant" />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/clients', element: <ClientsPage /> },
          { path: '/clients/:id', element: <ClientDetailPage /> },
        ],
      },
      {
        element: <RequireRole role="owner" />,
        children: [
          { path: '/business-setup', element: <BusinessSetupPage /> },
          { path: '/portal', element: <PortalPage /> },
        ],
      },
      { element: <RequireAuth />, children: [{ path: '/plan', element: <PlanPage /> }] },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
