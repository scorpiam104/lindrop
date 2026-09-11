import { LayoutDashboard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthNavbar from './AuthNavbar.jsx';
import { getMerchant, getToken } from '../lib/session';
import UserAvatar from './UserAvatar.jsx';

export default function GlobalAppShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isAuthenticated = Boolean(getToken());
  const [merchant, setMerchant] = useState(getMerchant);
  useEffect(() => {
    const syncMerchant = () => setMerchant(getMerchant());
    window.addEventListener('linkpay:merchant-updated', syncMerchant);
    return () => window.removeEventListener('linkpay:merchant-updated', syncMerchant);
  }, []);
  const hasStore = Boolean(merchant?.storeName || merchant?.isKycVerified || merchant?.status === 'active');
  useEffect(() => {
    function handleLogoClick(event) {
      const logoLink = event.target.closest('a.modern-logo, a[href="/dashboard"]:first-child, a:has(> .linkpay-logo)');
      if (!logoLink) return;
      event.preventDefault();
      event.stopPropagation();
      navigate('/');
    }
    document.addEventListener('click', handleLogoClick);
    return () => document.removeEventListener('click', handleLogoClick);
  }, [navigate]);
  const isPublicStore = location.pathname.startsWith('/store/');
  const appThemeClass = isAuthenticated && !isPublicStore && merchant?.storeTheme ? `app-theme-${merchant.storeTheme}` : '';
  return <div className={`global-app-shell ${appThemeClass}`}>
    <div className="global-ambient" aria-hidden="true"><span className="ambient-orb ambient-orb-one" /><span className="ambient-orb ambient-orb-two" /><span className="ambient-grid" /></div>
    {isAuthPage && <AuthNavbar active={location.pathname === '/signup' ? 'signup' : 'login'} />}
    <div key={location.pathname} className={`global-app-content ${isAuthPage ? 'auth-route-content' : ''}`}>{children}</div>
    {isAuthenticated && <div className="account-shortcuts">{hasStore && <Link to="/dashboard" className="profile-shortcut" aria-label="Open dashboard" title="Dashboard"><LayoutDashboard size={18} /><span>Dashboard</span></Link>}<UserAvatar /></div>}
  </div>;
}
