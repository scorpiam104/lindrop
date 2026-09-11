import { useLocation } from 'react-router-dom';
import AuthNavbar from './AuthNavbar.jsx';

export default function GlobalAppShell({ children }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  return <div className="global-app-shell">
    <div className="global-ambient" aria-hidden="true"><span className="ambient-orb ambient-orb-one" /><span className="ambient-orb ambient-orb-two" /><span className="ambient-grid" /></div>
    {isAuthPage && <AuthNavbar active={location.pathname === '/signup' ? 'signup' : 'login'} />}
    <div key={location.pathname} className={`global-app-content ${isAuthPage ? 'auth-route-content' : ''}`}>{children}</div>
  </div>;
}
