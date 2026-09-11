import { LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import AuthNavbar from './AuthNavbar.jsx';
import { getMerchant, getToken } from '../lib/session';
import UserAvatar from './UserAvatar.jsx';

export default function GlobalAppShell({ children }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isAuthenticated = Boolean(getToken());
  const merchant = getMerchant();
  const hasStore = Boolean(merchant?.storeName || merchant?.isKycVerified || merchant?.status === 'active');
  return <div className="global-app-shell">
    <div className="global-ambient" aria-hidden="true"><span className="ambient-orb ambient-orb-one" /><span className="ambient-orb ambient-orb-two" /><span className="ambient-grid" /></div>
    {isAuthPage && <AuthNavbar active={location.pathname === '/signup' ? 'signup' : 'login'} />}
    <div key={location.pathname} className={`global-app-content ${isAuthPage ? 'auth-route-content' : ''}`}>{children}</div>
    {isAuthenticated && <div className="account-shortcuts">{hasStore && <Link to="/dashboard" className="profile-shortcut" aria-label="Open dashboard" title="Dashboard"><LayoutDashboard size={18} /><span>Dashboard</span></Link>}<UserAvatar /></div>}
  </div>;
}
