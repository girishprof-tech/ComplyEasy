import { useCallback, useEffect, useState } from 'react';
import { ApiError, myBusinessApi } from '@/api';
import type { Business, HealthSummary } from '@/types';

/** The owner's own business. `notSetUp` is true when they haven't completed business setup yet. */
export function useOwnerBusiness() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [health, setHealth] = useState<HealthSummary | null>(null);
  const [notSetUp, setNotSetUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    myBusinessApi
      .get()
      .then(setBusiness)
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.message === 'not_set_up') setNotSetUp(true);
        else setError(e instanceof Error ? e.message : 'Request failed');
      });
    myBusinessApi.health().then(setHealth).catch(() => {});
  }, []);

  useEffect(reload, [reload]);

  return { business, health, notSetUp, error, reload };
}
