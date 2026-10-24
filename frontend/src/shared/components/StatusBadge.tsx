import type { ItemStatus, LoginStatus } from '@/types';

const STATUS_LABEL: Record<ItemStatus, string> = {
  active: 'Active',
  expiring_soon: 'Expiring soon',
  expired: 'Expired',
};

export function StatusBadge({ status }: { status: ItemStatus }) {
  return <span className={`status-badge status-${status}`}>{STATUS_LABEL[status]}</span>;
}

const LOGIN_LABEL: Record<LoginStatus, string> = {
  not_invited: 'Not invited',
  invited: 'Invite pending',
  active: 'Active login',
};

export function LoginStatusBadge({ status }: { status: LoginStatus }) {
  const modifier = status === 'active' ? 'active' : status === 'invited' ? 'invited' : '';
  return <span className={`login-status-badge ${modifier}`}>{LOGIN_LABEL[status]}</span>;
}
