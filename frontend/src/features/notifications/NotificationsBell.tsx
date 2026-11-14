import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '@/api';
import type { AppNotification } from '@/types';
import { useAuth } from '@/features/auth/state/AuthProvider';

function formatTimeAgo(isoString: string): string {
  if (!isoString) return '';
  const now = Date.now();
  const date = new Date(isoString).getTime();
  const diffSec = Math.floor((now - date) / 1000);

  if (isNaN(diffSec) || diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function NotificationsBell() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tab, setTab] = useState<'all' | 'unread' | 'urgent'>('all');
  const [markingAll, setMarkingAll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    notificationsApi
      .list()
      .then((res) => {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      })
      .catch(() => { });
  }, []);

  useEffect(load, [load]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) load();
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead();
      setNotifications((rows) => rows.map((r) => ({ ...r, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleNotificationClick(n: AppNotification) {
    if (!n.isRead) {
      void notificationsApi.markRead(n.id);
      setNotifications((rows) => rows.map((r) => (r.id === n.id ? { ...r, isRead: true } : r)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);

    // Deep link directly to the client's page and compliance item
    if (me?.role === 'accountant') {
      navigate(`/clients/${n.clientId}?item=${n.itemId}`);
    } else {
      navigate(`/portal?item=${n.itemId}`);
    }
  }

  const urgentCount = useMemo(() => {
    return notifications.filter((n) => n.status === 'expired' || n.type === 'expiring_7' || n.type === 'expired_today').length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (tab === 'unread') return notifications.filter((n) => !n.isRead);
    if (tab === 'urgent') {
      return notifications.filter((n) => n.status === 'expired' || n.type === 'expiring_7' || n.type === 'expired_today');
    }
    return notifications;
  }, [notifications, tab]);

  return (
    <div className="notif-bell-container" ref={containerRef}>
        <button
          type="button"
          className={`notif-bell-btn${open ? ' active' : ''}`}
          onClick={handleToggle}
          aria-label="Notifications"
          title="Notifications"
        >
          <svg className="notif-icon-svg" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <div className="notif-badge-wrapper">
              <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              <span className="notif-badge-ping" />
            </div>
          )}
        </button>

        {open && (
                <div className="notif-panel" role="dialog" aria-label="Notifications Panel">
                  <div className="notif-panel-header">
                    <div className="notif-title-group">
                      <span className="notif-panel-title">Notifications</span>
                      {unreadCount > 0 && <span className="notif-count-pill">{unreadCount} new</span>}
                    </div>
                    <button
                      type="button"
                      className="notif-mark-all-btn"
                      onClick={handleMarkAllRead}
                      disabled={unreadCount === 0 || markingAll}
                    >
                      {markingAll ? 'Marking…' : 'Mark all read'}
                    </button>
                  </div>

                  <div className="notif-tabs">
                    <button
                      type="button"
                      className={`notif-tab${tab === 'all' ? ' active' : ''}`}
                      onClick={() => setTab('all')}
                    >
                      All <span className="notif-tab-badge">{notifications.length}</span>
                    </button>
                    <button
                      type="button"
                      className={`notif-tab${tab === 'unread' ? ' active' : ''}`}
                      onClick={() => setTab('unread')}
                    >
                      Unread <span className="notif-tab-badge">{unreadCount}</span>
                    </button>
                    <button
                      type="button"
                      className={`notif-tab${tab === 'urgent' ? ' active' : ''}`}
                      onClick={() => setTab('urgent')}
                    >
                      Urgent <span className="notif-tab-badge">{urgentCount}</span>
                    </button>
                  </div>

                  <div className="notif-list">
                    {filteredNotifications.length === 0 ? (
                      <div className="notif-empty-state">
                        <div className="notif-empty-icon">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="notif-empty-title">All caught up!</div>
                        <div className="notif-empty-desc">
                          {tab === 'unread'
                            ? 'You have read all your notifications.'
                            : tab === 'urgent'
                              ? 'No urgent compliance deadlines right now.'
                              : 'No notifications right now.'}
                        </div>
                      </div>
                    ) : (
                      filteredNotifications.map((n) => {
                        const isOverdue = n.status === 'expired' || n.type === 'overdue' || n.type === 'expired_today';
                        const isCritical = n.type === 'expiring_7';
                        const urgencyClass = isOverdue ? 'expired' : isCritical ? 'expiring_soon' : 'active';
                        const iconClass = isOverdue ? 'notif-icon-expired' : isCritical ? 'notif-icon-soon' : 'notif-icon-active';

                        return (
                          <button
                            type="button"
                            key={n.id}
                            className={`notif-item${n.isRead ? '' : ' unread'}`}
                            onClick={() => handleNotificationClick(n)}
                          >
                            <div className={`notif-item-icon-box ${iconClass}`}>
                              {isOverdue ? (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="12" y1="8" x2="12" y2="12" />
                                  <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                              ) : isCritical ? (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                  <line x1="12" y1="9" x2="12" y2="13" />
                                  <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                              ) : (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                              )}
                            </div>

                            <div className="notif-item-body">
                              <div className="notif-item-top">
                                {n.businessName ? (
                                  <span className="notif-client-name">{n.businessName}</span>
                                ) : (
                                  <span className="notif-client-name">Compliance Item</span>
                                )}
                                <span className="notif-time-ago">{formatTimeAgo(n.createdAt)}</span>
                              </div>

                              <div className="notif-message-text">{n.message}</div>

                              <div className="notif-item-footer">
                                <span className={`notif-urgency-tag ${urgencyClass}`}>
                                  {isOverdue ? 'Overdue' : isCritical ? 'Expires soon' : 'Upcoming'}
                                </span>
                                <span className="notif-action-hint">
                                  View item
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="9 18 15 12 9 6" />
                                  </svg>
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
      )}
              </div>
            );
}
