import { Outlet, ScrollRestoration } from 'react-router-dom';
import { TopBar } from './TopBar';

export function AppShell() {
  return (
    <div className="app-shell">
      <TopBar />
      <Outlet />
      <ScrollRestoration />
    </div>
  );
}
