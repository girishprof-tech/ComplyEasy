import { Navigate, Outlet } from 'react-router-dom';
import { homePathFor, useAuth } from '@/features/auth/state/AuthProvider';
import type { Role } from '@/types';
import { PageLoading } from '@/shared/components/PageStates';

/** Any signed-in user; everyone else goes to /login. */
export function RequireAuth() {
  const { me, loading } = useAuth();
  if (loading) return <PageLoading />;
  if (!me) return <Navigate to="/login" />;
  return <Outlet />;
}

/** Signed in *and* holding the given role; other roles are sent to their own home. */
export function RequireRole({ role }: { role: Role }) {
  const { me, loading } = useAuth();
  if (loading) return <PageLoading />;
  if (!me) return <Navigate to="/login" />;
  if (me.role !== role) return <Navigate to={homePathFor(me)} />;
  return <Outlet />;
}
