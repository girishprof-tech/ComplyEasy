import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { authApi } from '@/api';
import { homePathFor, useAuth } from '@/features/auth/state/AuthProvider';
import { NotificationsBell } from '@/features/notifications/NotificationsBell';

const navClass = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? ' active' : ''}`;

export function TopBar() {
  const { me, setMe } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await authApi.logout();
    setMe(null);
    navigate('/');
  }

  const displayName = me ? (me.role === 'accountant' ? me.firmName : me.businessName) || me.email : '';

  return (
    <header className="topbar">
      <Link to={homePathFor(me)} className="brand-mark">
        <img src="/logo.svg" alt="" width={26} height={26} className="brand-logo" />
        <span>
          ComplyEasy<span className="dot"></span>
        </span>
      </Link>
      <nav className="topbar-right">
        {me ? (
          <>
            {me.role === 'accountant' && (
              <>
                <NavLink to="/dashboard" className={navClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/clients" className={navClass} end>
                  Clients
                </NavLink>
              </>
            )}
            {me.role === 'owner' && (
              <NavLink to="/portal" className={navClass}>
                Dashboard
              </NavLink>
            )}
            <NavLink to="/plan" className={navClass}>
              Plan
            </NavLink>
            <NavLink to="/settings" className={navClass}>
              Settings
            </NavLink>

            <NotificationsBell />

            {/* User Profile Dropdown Menu */}
            <div className="user-menu-wrapper" ref={menuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="user-chip-btn"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 10px 4px 6px',
                  borderRadius: 999,
                  border: '1px solid var(--hairline)',
                  background: menuOpen ? 'var(--surface-tint)' : 'var(--surface)',
                  cursor: 'pointer',
                  transition: 'all 140ms ease',
                }}
              >
                <span
                  className="user-avatar"
                  aria-hidden="true"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--brand)',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </span>
                <span className="user-name" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                  {displayName}
                </span>
                <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 2 }}>▾</span>
              </button>

              {menuOpen && (
                <div
                  className="user-dropdown-popover"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 240,
                    background: 'var(--surface)',
                    border: '1px solid var(--hairline)',
                    borderRadius: 14,
                    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    animation: 'gtaFadeIn 140ms ease',
                  }}
                >
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--hairline)', background: 'var(--surface-tint)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{displayName}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2 }}>{me.email}</div>
                    <div
                      style={{
                        display: 'inline-block',
                        marginTop: 6,
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: me.role === 'accountant' ? 'rgba(31, 111, 92, 0.12)' : 'rgba(185, 113, 26, 0.12)',
                        color: me.role === 'accountant' ? 'var(--brand)' : '#b9711a',
                      }}
                    >
                      {me.role === 'accountant' ? 'Accountant' : 'Business Owner'}
                    </div>
                  </div>

                  <div style={{ padding: '6px' }}>
                    <Link
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 12px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--ink)',
                        textDecoration: 'none',
                        borderRadius: 8,
                        transition: 'background 120ms ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-tint)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      ⚙️ Profile &amp; Settings
                    </Link>

                    <Link
                      to="/plan"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 12px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--ink)',
                        textDecoration: 'none',
                        borderRadius: 8,
                        transition: 'background 120ms ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-tint)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      ⚡ Subscription Plan
                    </Link>

                    <div style={{ height: 1, background: 'var(--hairline)', margin: '4px 6px' }} />

                    {/* Toggle Ads in dropdown as well */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        fontSize: 12.5,
                      }}
                    >
                      <span style={{ color: 'var(--ink-soft)' }}>Presentation Ads</span>
                      <button
                        type="button"
                        onClick={toggleAds}
                        style={{
                          padding: '3px 8px',
                          fontSize: 10.5,
                          fontWeight: 800,
                          borderRadius: 6,
                          border: 'none',
                          background: adsVisible ? 'var(--brand)' : 'var(--hairline)',
                          color: adsVisible ? '#fff' : 'var(--ink-soft)',
                          cursor: 'pointer',
                        }}
                      >
                        {adsVisible ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    <div style={{ height: 1, background: 'var(--hairline)', margin: '4px 6px' }} />

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 12px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#dc2626',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: 8,
                        transition: 'background 120ms ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      🚪 Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">
              Log in
            </Link>
            <Link to="/register" className="btn btn-primary">
              Get started
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
