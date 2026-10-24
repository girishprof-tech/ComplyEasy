import { useEffect, useState } from 'react';
import { accountApi } from '@/api';
import type { AccountSummary } from '@/types';

/** The caller's plan / usage summary, or null until loaded (failures are ignored). */
export function useAccount(): AccountSummary | null {
  const [account, setAccount] = useState<AccountSummary | null>(null);
  useEffect(() => {
    accountApi.get().then(setAccount).catch(() => {});
  }, []);
  return account;
}
