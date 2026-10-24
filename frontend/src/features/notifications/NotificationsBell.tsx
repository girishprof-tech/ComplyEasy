import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationsApi } from '@/api';
import type { AppNotification } from '@/types';

/**
 * Bell + dropdown in the top bar. Notifications are generated lazily by the
 * backend on each list call (no scheduler), so we load once on mount and
 * again whenever the panel is opened.
 */
export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    notificationsApi
      .list()
      .then((res) => {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      })
      .catch(() => {});
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) load();
  }

  async function handleNotificationClick(n: AppNotification) {
    if (!n.isRead) {
      await notificationsApi.markRead(n.id);
      setNotifications((rows) => rows.map((r) => (r.id === n.id ? { ...r, isRead: true } : r)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
  }

  return (
    <div className="notif-bell-container" ref={containerRef}>
      <button type="button" className="btn-ghost btn notif-bell-btn" onClick={handleToggle} aria-label="Notifications">
        🔔{unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-panel-head">Notifications</div>
          {notifications.length === 0 ? (
            <div className="notif-empty">No notifications right now.</div>
          ) : (
            <div className="notif-list">
              {notifications.slice(0, 15).map((n) => (
                <button
                  type="button"
                  key={n.id}
                  className={`notif-item ${n.isRead ? '' : 'unread'}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <span className={`notif-dot notif-dot-${n.status}`} />
                  <span className="notif-message">{n.message}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
