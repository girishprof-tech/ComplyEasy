import { useCallback, useEffect, useMemo, useState } from 'react';
import { scopedApi, type BusinessScope } from '@/api';
import type {
  ActivityEntry,
  SchemeMatch,
  SuggestionsResponse,
  SustainabilityInputs,
  SustainabilityResponse,
} from '@/types';

/**
 * Loads the supporting panels for a business: areas to review, scheme
 * matches, sustainability ideas and the activity log. Each loads
 * independently and silently — a failing panel simply doesn't render.
 */
export function useBusinessInsights(scope: BusinessScope) {
  const api = useMemo(() => scopedApi(scope), [scope]);
  const [suggestions, setSuggestions] = useState<SuggestionsResponse | null>(null);
  const [schemes, setSchemes] = useState<SchemeMatch[] | null>(null);
  const [sustainability, setSustainability] = useState<SustainabilityResponse | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[] | null>(null);

  const reload = useCallback(() => {
    api.suggestions().then(setSuggestions).catch(() => {});
    api.schemes().then((r) => setSchemes(r.matches)).catch(() => {});
    api.sustainability().then(setSustainability).catch(() => {});
    api.activity().then(setActivity).catch(() => {});
  }, [api]);

  useEffect(reload, [reload]);

  const saveSustainability = useCallback(
    async (inputs: Partial<SustainabilityInputs>) => {
      const updated = await api.saveSustainability(inputs);
      setSustainability((s) => (s ? { ...s, userProvidedContext: updated } : s));
    },
    [api]
  );

  return { suggestions, schemes, sustainability, activity, saveSustainability, reload };
}

export type BusinessInsights = ReturnType<typeof useBusinessInsights>;
