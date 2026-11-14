import { request } from './client';
import type { NotificationsResponse } from '@/types';

export const notificationsApi = {
  list: () => request<NotificationsResponse>('GET', '/api/notifications'),
  markRead: (id: number) => request<{ ok: true }>('POST', `/api/notifications/${id}/read`),
  markAllRead: () => request<{ ok: true }>('POST', '/api/notifications/read-all'),
};
