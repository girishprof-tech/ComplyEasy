import { Outlet, ScrollRestoration } from 'react-router-dom';
import { TopBar } from './TopBar';
import { AdBanner } from '@/shared/components/AdBanner';

export function AppShell() {
  return (
    <div className="app-shell">
      <AdBanner variant="ticker" />
      <TopBar />
      <Outlet />
      <ScrollRestoration />
    </div>
  );
}
