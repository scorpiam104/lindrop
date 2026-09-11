import { ArrowRight, LockKeyhole } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FaFacebookF, FaGithub, FaGoogle } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '@my-app/shared';
import { saveSession } from '../lib/session';

const inputClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100';

export default function SignInPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [canCreateAccount, setCanCreateAccount] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pendingLogin = sessionStorage.getItem('linkpay_pending_login');

    if (pendingLogin) {
      try {
        const parsed = JSON.parse(pendingLogin);
        setForm({ email: parsed.email || '', password: parsed.password || '' });
      } catch {
        setForm({ email: '', password: '' });
      }
      sessionStorage.removeItem('linkpay_pending_login');
    }

    if (params.get('oauth') === 'success' && params.get('token')) {
      try { saveSession({ token: params.get('token'), merchant: JSON.parse(decodeURIComponent(params.get('merchant') || '{}')) }); navigate('/marketplace', { replace: true }); } catch { setError('OAuth sign-in succeeded, but the session could not be restored.'); }
    } else if (params.get('oauth') === 'error') setError(decodeURIComponent(params.get('message') || 'Social login failed.'));
  }, [navigate]);

  async function submit(event) {
    event.preventDefault(); setError(''); setCanCreateAccount(false);
    if (!form.email || !form.password) return setError('Enter your email and password.');
    setLoading(true);
    try { const { data } = await apiClient.post('/auth/login', { ...form, email: form.email.trim() }); saveSession(data); navigate('/marketplace'); } catch (requestError) {
      const payload = requestError.response?.data || {};
      if (payload.code === 'EMAIL_NOT_FOUND') {
        setCanCreateAccount(true);
      }
      setError(payload.message || 'Unable to sign in.');
    } finally { setLoading(false); }
  }
  function createAccount() {
    sessionStorage.setItem('linkpay_pending_signup', JSON.stringify({ email: form.email.trim(), password: form.password, confirmPassword: form.password }));
    navigate('/signup');
  }
  function oauth(provider) { const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, ''); window.location.href = `${base}/api/auth/oauth/${provider}`; }

  return <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_transparent_34%),linear-gradient(135deg,#f8fafc_0%,#eff6ff_100%)] px-5 py-10 text-slate-900"><section className="w-full max-w-lg"><Link to="/" className="text-2xl font-black tracking-tight text-[#0F172A]">LinkPay<span className="text-[#F59E0B]">.</span></Link><div className="mt-7 rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_28px_80px_rgba(15,23,42,0.1)] sm:p-9"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2563EB]">Welcome back</p><h1 className="mt-2 text-3xl font-black tracking-tight">Open your workspace.</h1></div><LockKeyhole className="text-[#F59E0B]" size={24} /></div><div className="mt-7 grid grid-cols-3 gap-3">{[['google', <FaGoogle />], ['facebook', <FaFacebookF />], ['github', <FaGithub />]].map(([provider, icon]) => <button key={provider} type="button" onClick={() => oauth(provider)} aria-label={`Continue with ${provider}`} className="flex h-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:-translate-y-0.5 hover:border-[#2563EB] hover:text-[#2563EB]">{icon}</button>)}</div><div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-slate-200" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">or use email</span><span className="h-px flex-1 bg-slate-200" /></div><form onSubmit={submit} className="space-y-5"><label className="block text-sm font-bold text-slate-700">Email<input className={inputClass} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label><label className="block text-sm font-bold text-slate-700">Password<input className={inputClass} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Your password" /></label>{error && <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-700"><p className="inline">{error} </p>{canCreateAccount && <button type="button" onClick={createAccount} className="inline p-0 font-black text-[#2563EB] transition hover:text-[#1E3A8A]">Sign up</button>}</div>}<button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#2563EB] disabled:opacity-60">{loading ? 'Signing in...' : <>Sign in <ArrowRight size={16} /></>}</button></form></div><p className="mt-6 text-center text-sm text-slate-600">New to LinkPay? <Link to="/signup" className="font-black text-[#1E3A8A] hover:text-[#2563EB]">Create an account</Link></p></section></main>;
}