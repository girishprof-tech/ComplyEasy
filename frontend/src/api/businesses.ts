import { request } from './client';
import type { Business, BusinessInput, HealthSummary, InviteResult } from '@/types';

/** Accountant: manage the businesses (clients) they own. */
export const clientsApi = {
  list: () => request<Business[]>('GET', '/api/clients'),
  create: (input: BusinessInput) => request<Business>('POST', '/api/clients', input),
  get: (id: number) => request<Business>('GET', `/api/clients/${id}`),
  update: (id: number, input: BusinessInput) => request<Business>('PUT', `/api/clients/${id}`, input),
  uploadLogo: (id: number, logoData: string) => request<Business>('POST', `/api/clients/${id}/logo`, { logoData }),
  removeLogo: (id: number) => request<Business>('DELETE', `/api/clients/${id}/logo`),
  remove: (id: number) => request<{ ok: true }>('DELETE', `/api/clients/${id}`),
  invite: (id: number) => request<InviteResult>('POST', `/api/clients/${id}/invite`),
};

/** Owner: manage the single business linked to their login. */
export const myBusinessApi = {
  get: () => request<Business>('GET', '/api/business'),
  create: (input: BusinessInput) => request<Business>('POST', '/api/business', input),
  update: (input: BusinessInput) => request<Business>('PUT', '/api/business', input),
  uploadLogo: (logoData: string) => request<Business>('POST', '/api/business/logo', { logoData }),
  removeLogo: () => request<Business>('DELETE', '/api/business/logo'),
  health: () => request<HealthSummary>('GET', '/api/business/health'),
};
