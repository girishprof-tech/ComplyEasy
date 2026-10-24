import { request } from './client';
import type {
  ActivityEntry,
  ChatMessage,
  ChatResponse,
  ComplianceItem,
  ComplianceItemInput,
  SchemeDiscoveryResult,
  SchemeMatch,
  SuggestionsResponse,
  SustainabilityInputs,
  SustainabilityResponse,
} from '@/types';

/**
 * Which business a view is about. An owner always acts on their own
 * business; an accountant acts on one specific client they own. The backend
 * exposes the same sub-resources under both prefixes, so everything below is
 * derived from this one value.
 */
export type BusinessScope = { kind: 'business' } | { kind: 'client'; clientId: number };

export const OWNER_SCOPE: BusinessScope = { kind: 'business' };
export const clientScope = (clientId: number): BusinessScope => ({ kind: 'client', clientId });

export function scopeBasePath(scope: BusinessScope): string {
  return scope.kind === 'business' ? '/api/business' : `/api/clients/${scope.clientId}`;
}

export function certificateUrl(scope: BusinessScope, itemId: number, download = false): string {
  const base = `${scopeBasePath(scope)}/items/${itemId}/certificate`;
  return download ? `${base}?download=1` : base;
}

export interface ScopedApi {
  listItems(): Promise<ComplianceItem[]>;
  createItem(input: ComplianceItemInput): Promise<ComplianceItem>;
  updateItem(itemId: number, input: Partial<ComplianceItemInput>): Promise<ComplianceItem>;
  deleteItem(itemId: number): Promise<{ ok: true }>;
  suggestions(): Promise<SuggestionsResponse>;
  activity(): Promise<ActivityEntry[]>;
  schemes(): Promise<{ matches: SchemeMatch[] }>;
  discoverSchemes(): Promise<SchemeDiscoveryResult>;
  sustainability(): Promise<SustainabilityResponse>;
  saveSustainability(inputs: Partial<SustainabilityInputs>): Promise<SustainabilityInputs>;
  chat(message: string, history: ChatMessage[]): Promise<ChatResponse>;
}

export function scopedApi(scope: BusinessScope): ScopedApi {
  const base = scopeBasePath(scope);
  return {
    listItems: () => request('GET', `${base}/items`),
    createItem: (input) => request('POST', `${base}/items`, input),
    updateItem: (itemId, input) => request('PUT', `${base}/items/${itemId}`, input),
    deleteItem: (itemId) => request('DELETE', `${base}/items/${itemId}`),
    suggestions: () => request('GET', `${base}/suggestions`),
    activity: () => request('GET', `${base}/activity`),
    schemes: () => request('GET', `${base}/schemes`),
    discoverSchemes: () => request('POST', `${base}/schemes/discover`),
    sustainability: () => request('GET', `${base}/sustainability`),
    saveSustainability: (inputs) => request('POST', `${base}/sustainability`, inputs),
    chat: (message, history) => request('POST', `${base}/assistant`, { message, history }),
  };
}
