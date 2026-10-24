import type { ItemStatus } from './compliance';

export type NotificationType = 'expiring_30' | 'expiring_15' | 'expiring_7' | 'expired_today' | 'overdue';

export interface AppNotification {
  id: number;
  type: NotificationType;
  clientId: number;
  businessName: string;
  itemName: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  status: ItemStatus;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}
