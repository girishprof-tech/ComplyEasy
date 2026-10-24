import { useCallback, useEffect, useMemo, useState } from 'react';
import { scopedApi, type BusinessScope } from '@/api';
import type { ComplianceItem } from '@/types';

/** Loads a business's compliance items, most urgent first. `items` is null until the first load completes. */
export function useComplianceItems(scope: BusinessScope) {
  const api = useMemo(() => scopedApi(scope), [scope]);
  const [items, setItems] = useState<ComplianceItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    api
      .listItems()
      .then((rows) => rows.slice().sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry))
      .then(setItems)
      .catch((e: Error) => setError(e.message));
  }, [api]);

  useEffect(reload, [reload]);

  return { items, error, reload };
}
