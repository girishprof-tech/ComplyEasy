import { request } from './client';
import type { AccountSummary, PlanTier } from '@/types';

export const accountApi = {
  get: () => request<AccountSummary>('GET', '/api/account'),
  setPlan: (tier: PlanTier) => request<AccountSummary>('POST', '/api/account/plan', { tier }),
};
