import { request } from './client';
import type { DashboardSummary } from '@/types';

export const dashboardApi = {
  summary: () => request<DashboardSummary>('GET', '/api/dashboard/summary'),
};

export const exportCsvUrl = {
  accountant: '/api/dashboard/export.csv',
  owner: '/api/business/export.csv',
} as const;
