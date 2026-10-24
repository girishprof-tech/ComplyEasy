import { useCallback, useMemo, useState } from 'react';
import { scopedApi, type BusinessScope } from '@/api';
import type { ComplianceItem } from '@/types';
import type { ItemPrefill } from '../lib/itemForm';

export interface ItemEditorState {
  item?: ComplianceItem;
  prefill?: ItemPrefill;
}

/**
 * Add / edit / delete flow for compliance items: which dialog is open and
 * what to do afterwards. `onChanged` is called after any successful change so
 * the page can reload its data.
 */
export function useItemEditor(scope: BusinessScope, onChanged: () => void) {
  const api = useMemo(() => scopedApi(scope), [scope]);
  const [state, setState] = useState<ItemEditorState | null>(null);

  const openCreate = useCallback((prefill?: ItemPrefill) => setState({ prefill }), []);
  const openEdit = useCallback((item: ComplianceItem) => setState({ item }), []);
  const close = useCallback(() => setState(null), []);

  const saved = useCallback(() => {
    setState(null);
    onChanged();
  }, [onChanged]);

  const remove = useCallback(
    async (itemId: number) => {
      if (!confirm('Delete this compliance item?')) return;
      await api.deleteItem(itemId);
      onChanged();
    },
    [api, onChanged]
  );

  return { state, openCreate, openEdit, close, saved, remove };
}
