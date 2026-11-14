import { Navigate, Outlet } from 'react-router-dom';
import { homePathFor, useAuth } from '@/features/auth/state/AuthProvider';
import type { Role } from '@/types';
import { PageLoading } from '@/shared/components/PageStates';
import type { ReactNode } from 'react';

/** Any signed-in user; everyone else goes to /login. */
export function RequireAuth() {
  const { me, loading } = useAuth();
  if (loading) return <PageLoading />;
  if (!me) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/** Signed in *and* holding the given role; other roles are sent to their own home. */
export function RequireRole({ role }: { role: Role }) {
  const { me, loading } = useAuth();
  if (loading) return <PageLoading />;
  if (!me) return <Navigate to="/login" replace />;
  if (me.role !== role) return <Navigate to={homePathFor(me)} replace />;
  return <Outlet />;
}

/** Public-only route (Landing, login, register): if user is already signed in, redirects to their dashboard. */
export function RedirectIfAuthenticated({ children }: { children?: ReactNode }) {
  const { me, loading } = useAuth();
  if (loading) return <PageLoading />;
  if (me) return <Navigate to={homePathFor(me)} replace />;
  return children ? <>{children}</> : <Outlet />;
}
