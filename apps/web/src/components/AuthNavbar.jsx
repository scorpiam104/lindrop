import { ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import LinkPayLogo from './LinkPayLogo.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import UserAvatar from './UserAvatar.jsx';
import { getToken } from '../lib/session';

export default function AuthNavbar({ active = 'login' }) {
  const [open, setOpen] = useState(false);
  const isAuthenticated = Boolean(getToken());
  return <header className="auth-navbar"><div className="auth-navbar-inner"><Link to="/" aria-label="LinkPay home"><LinkPayLogo className="linkpay-logo" eager /></Link><nav className="auth-navbar-links" aria-label="Main navigation"><Link to="/marketplace">Marketplace</Link><a href="/#features">Features</a><a href="/#how-it-works">How it works</a></nav><div className="auth-navbar-actions"><ThemeToggle compact />{isAuthenticated ? <UserAvatar compact /> : active !== 'login' ? <Link to="/login" className="auth-navbar-signin">Sign in</Link> : null}{!isAuthenticated && active !== 'signup' && <Link to="/signup" className="auth-navbar-cta">Start selling <ArrowRight size={14} /></Link>}<button type="button" className="auth-navbar-menu" onClick={() => setOpen((value) => !value)} aria-label={open ? 'Close navigation' : 'Open navigation'}>{open ? <X size={20} /> : <Menu size={20} />}</button></div></div>{open && <nav className="auth-navbar-mobile" aria-label="Mobile navigation"><Link to="/marketplace" onClick={() => setOpen(false)}>Marketplace</Link><a href="/#features" onClick={() => setOpen(false)}>Features</a><a href="/#how-it-works" onClick={() => setOpen(false)}>How it works</a>{isAuthenticated ? <Link to="/profile" onClick={() => setOpen(false)}>Profile</Link> : active !== 'login' ? <Link to="/login" onClick={() => setOpen(false)}>Sign in</Link> : null}{!isAuthenticated && active !== 'signup' && <Link to="/signup" onClick={() => setOpen(false)}>Start selling <ArrowRight size={14} /></Link>}</nav>}</header>;
}
