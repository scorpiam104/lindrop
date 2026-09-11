import { ArrowLeft, ArrowRight, Check, Facebook, Github, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FaFacebookF, FaGithub, FaGoogle } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '@my-app/shared';
import { saveSession } from '../lib/session';

const initialForm = { firstName: '', surname: '', dateOfBirth: '', gender: '', phoneNumber: '', email: '', password: '', confirmPassword: '' };
const steps = ['Basic info', 'Personal info', 'Account & auth'];
const inputClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100';

function Field({ label, ...props }) { return <label className="block text-sm font-bold text-slate-700">{label}<input {...props} className={inputClass} /></label>; }

export default function SignupStepper() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);
  function normalizeName(value) {
    const lettersOnly = value.replace(/[^a-zA-Z'-]/g, '');
    return lettersOnly ? `${lettersOnly.charAt(0).toUpperCase()}${lettersOnly.slice(1)}` : '';
  }
  useEffect(() => {
    const pendingSignup = sessionStorage.getItem('linkpay_pending_signup');
    if (!pendingSignup) return;
    try {
      const credentials = JSON.parse(pendingSignup);
      setForm((current) => ({ ...current, email: credentials.email || '', password: credentials.password || '', confirmPassword: credentials.confirmPassword || credentials.password || '' }));
    } catch {
      sessionStorage.removeItem('linkpay_pending_signup');
    }
    sessionStorage.removeItem('linkpay_pending_signup');
  }, []);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: key === 'firstName' || key === 'surname' ? normalizeName(value) : value }));

  function validateStep() {
    if (step === 0 && (!form.firstName.trim() || !form.surname.trim())) return 'Enter your first and last name.';
    if (step === 1 && (!form.dateOfBirth || !form.gender)) return 'Date of birth and gender are required.';
    if (step === 2) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email address.';
      if (form.password.length < 8) return 'Password must be at least 8 characters.';
      if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    }
    return '';
  }

  function next(event) { event.preventDefault(); const message = validateStep(); if (message) return setError(message); setError(''); setStep((current) => Math.min(current + 1, steps.length - 1)); }
  function back() { setError(''); setStep((current) => Math.max(current - 1, 0)); }
  async function submit(event) {
    event.preventDefault(); const message = validateStep(); if (message) return setError(message);
    setLoading(true); setError('');
    try { const { data } = await apiClient.post('/auth/register', form); saveSession(data); navigate('/marketplace'); } catch (requestError) {
      const payload = requestError.response?.data || {};
      if (payload.redirectToLogin) {
        const email = payload.existingAccount?.email || form.email;
        const shouldLogin = window.confirm(`An account already exists for ${email}. Do you want to sign in instead?`);
        if (shouldLogin) {
          sessionStorage.setItem('linkpay_pending_login', JSON.stringify({ email, password: form.password }));
          navigate('/login');
          return;
        }
      }
      setError(payload.message || 'Unable to create your account.');
    } finally { setLoading(false); }
  }
  function handleOAuth(provider) {
    setOauthLoading(provider);
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
    window.location.href = `${apiBase}/api/auth/oauth/${provider}`;
  }

  return <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_transparent_34%),linear-gradient(135deg,#f8fafc_0%,#eff6ff_100%)] px-5 py-10 text-slate-900"><section className="w-full max-w-lg"><Link to="/" className="text-2xl font-black tracking-tight text-[#0F172A]">LinkPay<span className="text-[#F59E0B]">.</span></Link><div className="mt-7 rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_28px_80px_rgba(15,23,42,0.1)] sm:p-9"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2563EB]">Create your account</p><h1 className="mt-2 text-3xl font-black tracking-tight">A few steps to get started.</h1></div><span className="text-sm font-black text-slate-500">{step + 1} of {steps.length}</span></div><div className="mt-7 flex gap-2" aria-label={`Step ${step + 1} of ${steps.length}`}>{steps.map((label, index) => <div key={label} className="flex-1"><div className={`h-1.5 rounded-full transition-colors duration-300 ${index <= step ? 'bg-[#2563EB]' : 'bg-slate-200'}`} /><p className={`mt-2 text-[10px] font-black uppercase tracking-wider ${index === step ? 'text-[#1E3A8A]' : 'text-slate-400'}`}>{label}</p></div>)}</div><form onSubmit={step === steps.length - 1 ? submit : next} className="mt-8"><div key={step} className="animate-step-in space-y-5">{step === 0 && <><div><h2 className="text-xl font-black">What should we call you?</h2><p className="mt-1 text-sm text-slate-500">Use the name you want on your profile.</p></div><div className="grid gap-4 sm:grid-cols-2"><Field label="First name" required value={form.firstName} onChange={(event) => update('firstName', event.target.value)} placeholder="Ama" /><Field label="Last name" required value={form.surname} onChange={(event) => update('surname', event.target.value)} placeholder="Boateng" /></div></>}{step === 1 && <><div><h2 className="text-xl font-black">Tell us a little more.</h2><p className="mt-1 text-sm text-slate-500">These details help personalize your experience.</p></div><Field label="Date of birth" type="date" required value={form.dateOfBirth} onChange={(event) => update('dateOfBirth', event.target.value)} /><label className="block text-sm font-bold text-slate-700">Gender<select value={form.gender} onChange={(event) => update('gender', event.target.value)} className={inputClass}><option value="">Select an option</option><option value="female">Female</option><option value="male">Male</option><option value="nonbinary">Non-binary</option><option value="prefer-not-to-say">Prefer not to say</option></select></label><Field label="Phone number (optional)" type="tel" value={form.phoneNumber} onChange={(event) => update('phoneNumber', event.target.value)} placeholder="024 000 0000" /></>}{step === 2 && <><div><h2 className="text-xl font-black">Secure your account.</h2><p className="mt-1 text-sm text-slate-500">Your credentials are only submitted on this final step.</p></div><Field label="Email" type="email" required value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="you@example.com" /><div className="grid gap-4 sm:grid-cols-2"><Field label="Password" type="password" required value={form.password} onChange={(event) => update('password', event.target.value)} placeholder="8+ characters" /><Field label="Confirm password" type="password" required value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} placeholder="Repeat password" /></div><div className="border-t border-slate-100 pt-5"><p className="text-xs font-black uppercase tracking-widest text-slate-400">Or continue with</p><div className="mt-3 flex gap-3">{[['google', <FaGoogle />], ['facebook', <FaFacebookF />], ['github', <FaGithub />]].map(([provider, icon]) => <button key={provider} type="button" onClick={() => handleOAuth(provider)} disabled={oauthLoading === provider} aria-label={`Continue with ${provider}`} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:-translate-y-0.5 hover:border-[#2563EB] hover:text-[#2563EB] disabled:opacity-50">{oauthLoading === provider ? <Mail size={16} /> : icon}</button>)}</div></div></>}</div>{error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}<div className="mt-8 flex items-center justify-between gap-3"><button type="button" onClick={back} disabled={step === 0 || loading} className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100 disabled:invisible"><ArrowLeft size={16} /> Back</button><button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Creating...' : step === steps.length - 1 ? <><Check size={16} /> Create account</> : <>Next <ArrowRight size={16} /></>}</button></div></form></div><p className="mt-6 text-center text-sm text-slate-600">Already have an account? <Link to="/login" className="font-black text-[#1E3A8A] hover:text-[#2563EB]">Sign in</Link></p></section></main>;
}