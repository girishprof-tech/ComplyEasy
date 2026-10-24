import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '@/api';
import type { Me } from '@/types';

interface AuthContextValue {
  me: Me | null;
  /** True until the first /me request has settled. */
  loading: boolean;
  refresh: () => Promise<void>;
  setMe: (me: Me | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setMe(await authApi.me());
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(() => ({ me, loading, refresh, setMe }), [me, loading, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Where a signed-in user lands: accountants on the portfolio, owners on their business. */
export function homePathFor(me: Pick<Me, 'role'> | null): string {
  if (!me) return '/';
  return me.role === 'accountant' ? '/dashboard' : '/portal';
}
