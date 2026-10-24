import { Link, NavLink, useNavigate } from 'react-router-dom';
import { authApi } from '@/api';
import { homePathFor, useAuth } from '@/features/auth/state/AuthProvider';
import { NotificationsBell } from '@/features/notifications/NotificationsBell';

const navClass = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? ' active' : ''}`;

export function TopBar() {
  const { me, setMe } = useAuth();
  const navigate = useNavigate();

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
            <NotificationsBell />
            <span className="user-chip" title={displayName}>
              <span className="user-avatar" aria-hidden="true">
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span className="user-name">{displayName}</span>
            </span>
            <button className="btn-ghost btn" onClick={handleLogout}>
              Log out
            </button>
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
