import type { ItemStatus } from './compliance';
import type { HealthSummary } from './insights';

export interface UrgentItem {
  id: number;
  clientId: number;
  clientName: string;
  name: string;
  expiryDate: string;
  status: ItemStatus;
  daysUntilExpiry: number;
}

export interface DashboardSummary {
  totalClients: number;
  totalItems: number;
  active: number;
  expiringSoon: number;
  expired: number;
  reviewSuggestionsCount: number;
  urgentItems: UrgentItem[];
  portfolioHealth: HealthSummary;
}
