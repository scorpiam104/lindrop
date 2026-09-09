import { ArrowRight, BarChart3, Check, ExternalLink, Facebook, Gauge, Github, LayoutDashboard, LogOut, Package, Plus, Settings, Share2, ShieldCheck, Sparkles, Store, TrendingUp, UserCircle2, Users, X } from 'lucide-react';
import { FaFacebookF, FaGithub, FaGoogle } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiClient, formatGHS, validateGhanaPhone } from '@my-app/shared';
import { apiCall, clearSession, getMerchant, saveSession } from '../lib/session';
import { getOfflineQueueCount, queueOfflineSale, syncOfflineSalesToServer } from '../lib/offlinePos';
import ProductShareModal from '../components/ProductShareModal';

const productImage = 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=85';

function Field({ label, ...props }) { return <label className="block text-sm font-semibold text-slate-700">{label}<input {...props} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100" /></label>; }
function Stat({ label, value }) { return <div className="rounded-2xl bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] ring-1 ring-slate-100"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p><p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{value}</p></div>; }

function SocialButton({ provider, icon, onClick, loading }) {
  const palette = {
    google: 'bg-gradient-to-br from-[#EA4335] via-[#FBBC05] to-[#4285F4] text-white',
    github: 'bg-slate-950 text-white',
    facebook: 'bg-[#1877F2] text-white'
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg shadow-slate-200/70 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl ${palette[provider]} disabled:opacity-60`}
      aria-label={provider}
    >
      {loading ? '…' : icon}
    </button>
  );
}

export function Landing() {
  return <main className="min-h-screen bg-[#f6f7f3] text-slate-900"><nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6"><Link to="/" className="text-2xl font-black tracking-tight text-slate-900">LinkPay<span className="text-emerald-500">.</span></Link><div className="flex items-center gap-3"><Link to="/login" className="rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">Sign in</Link><Link to="/signup" className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-500 hover:text-slate-900">Start selling</Link></div></nav><section className="mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:pt-20"><div><p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700"><Sparkles size={14} /> Commerce, in one minute</p><h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.9] tracking-[-0.07em] text-slate-900 sm:text-7xl xl:text-[6rem]">Your social store, built to sell.</h1><p className="mt-8 max-w-xl text-lg leading-8 text-slate-600">Turn conversations into orders with a storefront that feels premium, quick, and built for mobile-first commerce.</p><div className="mt-10 flex flex-wrap gap-3"><Link to="/signup" className="flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-4 text-sm font-black text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5">Create your store <ArrowRight size={18} /></Link><a href="#plans" className="rounded-full border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">See plans</a></div><div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-slate-600"><div className="flex items-center gap-2"><TrendingUp size={16} className="text-emerald-600" /> 2.4x faster selling</div><div className="flex items-center gap-2"><Gauge size={16} className="text-emerald-600" /> 24/7 conversations</div></div></div><div className="relative"><div className="absolute inset-4 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.22),transparent_62%)] blur-2xl" /><div className="animate-float relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-500 p-6 text-white shadow-[0_35px_90px_rgba(15,23,42,0.25)]"><div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%)]" /><div className="relative z-10"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">LinkPay dashboard</p><div className="mt-14 rounded-[1.5rem] bg-white/8 p-5 ring-1 ring-white/10 backdrop-blur-sm"><div className="flex items-center justify-between"><span className="text-sm text-white/70">This month</span><span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-bold text-emerald-200">+24.8%</span></div><p className="mt-3 text-4xl font-black tracking-tight">GH₵ 18,420</p><div className="mt-8 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-white/60"><span>Orders</span><span>Revenue</span></div><div className="mt-4 h-20 rounded-2xl bg-gradient-to-r from-emerald-300 via-emerald-400 to-white/90 opacity-90" /></div></div><div className="relative z-10 mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"><div className="flex items-center gap-2"><span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400" /><span className="text-sm font-bold">Inventory synced</span></div><button className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-900">Live</button></div></div></div></section><section className="bg-white px-6 py-20 text-slate-900"><div className="mx-auto max-w-7xl"><p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Built for the whole loop</p><div className="mt-8 grid gap-5 md:grid-cols-3"><Feature icon={<Store />} title="A store that travels" text="Share one branded link across Instagram, WhatsApp, and every conversation." /><Feature icon={<ShieldCheck />} title="Payments that fit" text="Let customers pay with Ghanaian Mobile Money or cards through a seamless checkout flow." /><Feature icon={<BarChart3 />} title="Signals, not noise" text="See what sells, what needs attention, and where your revenue is moving." /></div></div></section><section id="plans" className="bg-[#f3f6f4] px-6 pb-24 text-slate-900"><div className="mx-auto max-w-7xl"><h2 className="text-4xl font-black tracking-tight">Start light. Grow clearly.</h2><div className="mt-8 grid gap-5 md:grid-cols-3"><Plan name="Starter" price="Free" text="For trying the loop" /><Plan name="Scale" price="GH₵ 99/mo" text="For a growing social store" featured /><Plan name="Studio" price="GH₵ 249/mo" text="For teams and multiple brands" /></div></div></section></main>;
}

function Feature({ icon, title, text }) {
  return <article className="rounded-[1.75rem] bg-slate-50 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.04)] ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(16,185,129,0.12)]"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">{icon}</div><h3 className="mt-8 text-xl font-black text-slate-900">{title}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p></article>;
}

function Plan({ name, price, text, featured }) {
  return <article className={`rounded-[1.75rem] p-6 transition duration-300 hover:-translate-y-1 ${featured ? 'bg-slate-900 text-white shadow-[0_25px_60px_rgba(15,23,42,0.2)]' : 'bg-white text-slate-900 shadow-[0_20px_40px_rgba(15,23,42,0.04)] ring-1 ring-slate-200'}`}><p className="font-bold">{name}</p><p className="mt-8 text-3xl font-black tracking-tight">{price}</p><p className="mt-2 text-sm opacity-70">{text}</p><div className="mt-8 flex items-center gap-2 text-sm font-bold"><Check size={16} className="text-emerald-500" /> Checkout included</div></article>;
}

function SalesAssistantCard() {
  const merchant = getMerchant();
  const suggestion = `Hi there! ${merchant?.businessName || 'Your store'} has fresh stock and offers free delivery this week. Want me to share the latest drop?`;

  return <section className="rounded-2xl bg-emerald-50 p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">AI WhatsApp assistant</p><span className="rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white">Live</span></div><p className="mt-5 text-sm leading-7 text-black/65">{suggestion}</p><div className="mt-5 flex gap-2"><button className="rounded-xl bg-black px-4 py-2 text-xs font-bold text-white">Send promo</button><button className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-bold text-emerald-700">Check stock</button></div></section>;
}

function OfflinePOSPanel({ onSync }) {
  const [queueCount, setQueueCount] = useState(getOfflineQueueCount());
  const [form, setForm] = useState({ customerName: 'Walk-in customer', itemName: 'Classic Tee', quantity: 1, totalAmount: 120 });

  async function handleQueue(event) {
    event.preventDefault();
    queueOfflineSale({
      customerName: form.customerName,
      customerPhone: 'offline',
      deliveryAddress: 'In-person pickup',
      totalAmount: Number(form.totalAmount),
      items: [{ title: form.itemName, quantity: Number(form.quantity), unitPrice: Number(form.totalAmount) / Number(form.quantity || 1) }]
    });
    setQueueCount(getOfflineQueueCount());
    onSync?.();
  }

  async function handleSync() {
    try {
      await syncOfflineSalesToServer((url, payload) => apiCall('post', url, payload));
      setQueueCount(getOfflineQueueCount());
      onSync?.();
    } catch (error) {
      console.error('Offline POS sync failed:', error);
    }
  }

  return <section className="rounded-2xl bg-black p-5 text-white shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">Offline POS</p><p className="mt-3 text-4xl font-black">{queueCount}</p><p className="mt-1 text-sm text-white/60">Queued walk-in sales</p><form onSubmit={handleQueue} className="mt-5 space-y-3 text-sm"><input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none" placeholder="Customer name" /><div className="grid grid-cols-2 gap-3"><input value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none" placeholder="Item" /><input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none" /></div><input type="number" min="0" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none" placeholder="Amount in GHS" /><div className="flex gap-2"><button type="submit" className="flex-1 rounded-xl bg-emerald-400 px-4 py-2.5 font-black text-black">Queue sale</button><button type="button" onClick={handleSync} className="flex-1 rounded-xl border border-white/20 px-4 py-2.5 font-bold text-white">Sync</button></div></form></section>;
}

export function AuthPage({ mode }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', surname: '', dateOfBirth: '', gender: 'female', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);
  const isSignup = mode === 'signup';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthState = params.get('oauth');
    const token = params.get('token');
    const merchant = params.get('merchant');
    const message = params.get('message');

    if (oauthState === 'success' && token) {
      try {
        const parsedMerchant = JSON.parse(decodeURIComponent(merchant || '{}'));
        saveSession({ token, merchant: parsedMerchant });
        window.history.replaceState({}, '', '/login');
        navigate('/dashboard', { replace: true });
      } catch (oauthError) {
        setError('OAuth sign-in was successful, but the session could not be restored.');
      }
      return;
    }

    if (oauthState === 'error') {
      setError(decodeURIComponent(message || 'Social login failed. Please try again.'));
      window.history.replaceState({}, '', '/login');
    }
  }, [navigate]);

  async function submit(event) {
    event.preventDefault();
    setError('');

    if (isSignup) {
      if (!form.firstName || !form.surname || !form.dateOfBirth || !form.gender) {
        return setError('Please complete your first name, surname, date of birth, and gender.');
      }
      if (form.password.length < 8) return setError('Password must be at least 8 characters.');
      if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      const payload = isSignup ? { ...form } : { email: form.email, password: form.password };
      const { data } = await apiClient.post(`/auth/${isSignup ? 'register' : 'login'}`, payload);
      saveSession(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to authenticate.');
    } finally {
      setLoading(false);
    }
  }

  function handleOAuth(provider) {
    setError('');
    setOauthLoading(provider);
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
    window.location.href = `${apiBase}/api/auth/oauth/${provider}`;
  }

  return <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.1),_transparent_32%),linear-gradient(135deg,#f7faf8_0%,#eef5f2_100%)] px-6 py-12"><section className="w-full max-w-md"><Link to="/" className="inline-flex items-center text-2xl font-black tracking-tight text-slate-900">LinkPay<span className="text-emerald-500">.</span></Link><div className="mt-8 rounded-[2rem] border border-slate-200 bg-white/90 p-7 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">{isSignup ? 'Create your account' : 'Welcome back'}</p><h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">{isSignup ? 'Start your journey.' : 'Open your workspace.'}</h1><div className="mt-6 flex justify-center gap-3">{[
      { provider: 'google', icon: <FaGoogle size={17} /> },
      { provider: 'github', icon: <FaGithub size={17} /> },
      { provider: 'facebook', icon: <FaFacebookF size={17} /> }
    ].map(({ provider, icon }) => <SocialButton key={provider} provider={provider} icon={icon} loading={oauthLoading === provider} onClick={() => handleOAuth(provider)} />)}</div><div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-slate-200" /><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">or continue with email</span><span className="h-px flex-1 bg-slate-200" /></div><form onSubmit={submit} className="space-y-4">{isSignup && <><div className="grid gap-4 sm:grid-cols-2"><Field label="First name" name="firstName" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Ama" /><Field label="Surname" name="surname" required value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} placeholder="Boateng" /></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Date of birth" type="date" name="dateOfBirth" required value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /><label className="block text-sm font-semibold text-slate-700">Gender<select name="gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"><option value="female">Female</option><option value="male">Male</option><option value="nonbinary">Non-binary</option><option value="prefer-not-to-say">Prefer not to say</option></select></label></div></>}{!isSignup && <Field label="Email" type="email" name="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />}{isSignup && <Field label="Email" type="email" name="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />}<Field label="Password" type="password" name="password" required minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />{isSignup && <Field label="Confirm password" type="password" name="confirmPassword" required minLength="8" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Re-enter password" />}{error && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-600 ring-1 ring-red-100">{error}</p>}<button disabled={loading || !!oauthLoading} className="w-full rounded-2xl bg-slate-900 px-4 py-4 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-emerald-500 hover:text-slate-900 disabled:opacity-60">{loading ? 'Connecting...' : isSignup ? 'Create account' : 'Sign in'}</button></form><p className="mt-6 text-center text-sm text-slate-500">{isSignup ? 'Already selling?' : 'New to LinkPay?'} <Link className="font-bold text-emerald-600" to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Sign in' : 'Create an account'}</Link></p></div></section></main>;
}

const navItems = [['/dashboard', 'Overview', LayoutDashboard], ['/dashboard/products', 'Products', Package], ['/dashboard/orders', 'Orders', BarChart3], ['/dashboard/store', 'Store setup', Settings], ['/profile', 'Profile', UserCircle2]];

export function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const merchant = getMerchant();
  return <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(229,107,79,0.14),_transparent_30%),linear-gradient(180deg,#f3f1eb_0%,#e8efeb_100%)] text-slate-900"><aside className="fixed inset-y-0 hidden w-72 border-r border-[#dfe4dc] bg-[#fffdf8]/85 p-6 backdrop-blur-xl lg:block"><div className="flex h-full flex-col"><Link to="/dashboard" className="text-2xl font-black tracking-tight text-slate-900">LinkPay<span className="text-[#e56b4f]">.</span></Link><p className="mt-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Workspace</p><nav className="mt-4 space-y-2">{navItems.map(([path, label, Icon]) => <Link key={path} to={path} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-600 transition hover:bg-[#e4f0eb] hover:text-slate-900"><Icon size={18} />{label}</Link>)}</nav><div className="mt-auto rounded-[1.5rem] border border-[#31574f] bg-gradient-to-br from-[#17221f] via-[#1f746b] to-[#e56b4f] p-4 text-white shadow-xl shadow-[#b9d9d2]"><p className="truncate text-sm font-black">{merchant?.businessName || 'Merchant'}</p><p className="mt-1 text-xs text-white/70">{merchant?.email || 'profile@linkpay.app'}</p><button onClick={() => { clearSession(); navigate('/login'); }} className="mt-4 flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20"><LogOut size={14} /> Sign out</button></div></div></aside><main className="lg:pl-72"><div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-10">{children}</div></main></div>;
}

export function Overview() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const merchant = getMerchant();

  const featuredProducts = [
    { title: 'Signature Candle', price: 'GH₵ 120', tag: 'Best seller' },
    { title: 'Daily Wellness Kit', price: 'GH₵ 180', tag: 'Popular' },
    { title: 'Mobile Studio Pack', price: 'GH₵ 260', tag: 'New' }
  ];

  const services = [
    { title: 'Brand strategy', meta: 'Growth' },
    { title: 'Photo styling', meta: 'Creative' },
    { title: 'Delivery support', meta: 'Operations' }
  ];

  const stores = [
    { name: 'Glow Atelier', detail: 'Beauty & wellness' },
    { name: 'Stream Cart', detail: 'Electronics' },
    { name: 'Mile Market', detail: 'Daily essentials' }
  ];

  useEffect(() => { Promise.all([apiCall('get', '/orders/merchant'), apiCall('get', '/merchants/dashboard-stats')]).then(([orderResponse, statsResponse]) => { setOrders(orderResponse.data); setStats(statsResponse.data); }).catch(() => {}); }, []);

  return <DashboardLayout><Header title={`Welcome back, ${merchant?.firstName || 'there'}`} action={<Link to="/dashboard/products" className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-emerald-500 hover:text-slate-900"><Plus size={16} /> Add product</Link>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Total sales" value={formatGHS(stats.sales)} /><Stat label="Active orders" value={stats.activeOrders || 0} /><Stat label="Total views" value={stats.totalViews || 0} /><Stat label="Conversion" value={`${Number(stats.conversionRate || 0).toFixed(1)}%`} /></div><div className="mt-8 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
    <section className="rounded-[1.75rem] bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.05)] ring-1 ring-slate-200"><div className="flex items-center justify-between"><h2 className="text-xl font-black text-slate-900">Products</h2><Link to="/dashboard/products" className="text-sm font-bold text-emerald-700">View all</Link></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{featuredProducts.map((item) => <div key={item.title} className="rounded-[1.4rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-emerald-50 p-3"><div className="h-24 rounded-2xl bg-gradient-to-br from-emerald-100 via-white to-emerald-50" /><p className="mt-3 text-sm font-black text-slate-900">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.tag}</p><p className="mt-2 text-sm font-black text-emerald-700">{item.price}</p></div>)}</div></section>
    <section className="rounded-[1.75rem] bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.05)] ring-1 ring-slate-200"><div className="flex items-center justify-between"><h2 className="text-xl font-black text-slate-900">Services</h2><button className="text-sm font-bold text-emerald-700">Explore</button></div><div className="mt-5 space-y-3">{services.map((service) => <div key={service.title} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3"><div><p className="font-black text-slate-900">{service.title}</p><p className="text-xs text-slate-500">{service.meta}</p></div><ArrowRight size={16} className="text-emerald-600" /></div>)}</div></section>
  </div><div className="mt-8 grid gap-5 xl:grid-cols-[1fr_1.2fr]">
    <section className="rounded-[1.75rem] bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.05)] ring-1 ring-slate-200"><h2 className="text-xl font-black text-slate-900">Stores</h2><div className="mt-5 space-y-3">{stores.map((store) => <div key={store.name} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3"><div><p className="font-black text-slate-900">{store.name}</p><p className="text-xs text-slate-500">{store.detail}</p></div><button className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Open</button></div>)}</div></section>
    <section className="space-y-5"><SalesAssistantCard /><OfflinePOSPanel onSync={() => {}} /></section>
  </div><section className="mt-8 rounded-[1.75rem] bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.05)] ring-1 ring-slate-200"><h2 className="text-xl font-black text-slate-900">Recent transactions</h2><TransactionTable orders={orders.slice(0, 6)} /></section></DashboardLayout>;
}

function Header({ title, action }) {
  return <header className="mb-8 flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Merchant workspace</p><h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">{title}</h1></div>{action}</header>;
}

function TransactionTable({ orders }) {
  return <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b border-slate-200 text-[10px] uppercase tracking-[0.2em] text-slate-400"><tr><th className="pb-3 font-black">Customer</th><th className="pb-3 font-black">Items</th><th className="pb-3 font-black">Status</th><th className="pb-3 text-right font-black">Total</th></tr></thead><tbody>{orders.length ? orders.map((o) => <tr key={o._id} className="border-b border-slate-100"><td className="py-4 font-black text-slate-900">{o.customerName}<span className="mt-1 block text-xs font-medium text-slate-500">{o.customerPhone}</span></td><td className="py-4 text-slate-600">{o.items?.map((i) => `${i.title} x${i.quantity}`).join(', ')}</td><td className="py-4"><Status status={o.paymentStatus} /></td><td className="py-4 text-right font-black text-slate-900">{formatGHS(o.totalAmount)}</td></tr>) : <tr><td colSpan="4" className="py-10 text-center text-slate-400">Orders will appear here after your first sale.</td></tr>}</tbody></table></div>;
}

function Status({ status }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{status}</span>;
}

export function Orders() { const [orders, setOrders] = useState([]); useEffect(() => { apiCall('get', '/orders/merchant').then(({ data }) => setOrders(data)).catch(() => {}); }, []); return <DashboardLayout><Header title="Orders" /><section className="rounded-[1.8rem] bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.05)] ring-1 ring-slate-200"><TransactionTable orders={orders} />{orders.map((order) => <a key={order._id} className="hidden" href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${order.customerName}, your LinkPay order is ${order.paymentStatus}.`)}`}>WhatsApp</a>)}</section></DashboardLayout>; }

export function AdminOverview() { const [stats, setStats] = useState({}); useEffect(() => { apiCall('get', '/admin/stats').then(({ data }) => setStats(data)).catch(() => {}); }, []); return <DashboardLayout><Header title="System overview" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Stat label="Registered merchants" value={stats.merchants || 0} /><Stat label="Pending approvals" value={stats.pendingApprovals || 0} /><Stat label="Platform volume" value={formatGHS(stats.platformVolume)} /><Stat label="Commission" value={formatGHS(stats.commission)} /><Stat label="Platform health" value={stats.status || '...'} /></div><div className="mt-8 rounded-[1.8rem] bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-700 p-7 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Admin control plane</p><h2 className="mt-3 text-3xl font-black tracking-tight">Approve stores before they go live.</h2><p className="mt-3 max-w-xl text-white/75">Review merchant accounts, verify stores, and suspend users from the merchant control table.</p></div></DashboardLayout>; }

export function AdminMerchants() { const [merchants, setMerchants] = useState([]); function load() { apiCall('get', '/admin/merchants').then(({ data }) => setMerchants(data)).catch(() => {}); } useEffect(load, []); async function toggle(item, key) { await apiCall('patch', `/admin/merchants/${item._id}`, { [key]: !item[key] }); load(); } return <DashboardLayout><Header title="Merchants" /><section className="overflow-x-auto rounded-[1.8rem] bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.05)] ring-1 ring-slate-200"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-slate-200 text-[10px] uppercase tracking-[0.2em] text-slate-400"><tr><th className="pb-3 font-black">Business</th><th className="pb-3 font-black">Email</th><th className="pb-3 font-black">Status</th><th className="pb-3 font-black">Actions</th></tr></thead><tbody>{merchants.map((item) => <tr key={item._id} className="border-b border-slate-100"><td className="py-4 font-black text-slate-900">{item.businessName}<span className="mt-1 block text-xs font-medium text-slate-500">/{item.slug}</span></td><td className="py-4 text-slate-600">{item.email}</td><td className="py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${item.isSuspended ? 'bg-red-100 text-red-700' : item.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{item.isSuspended ? 'Suspended' : item.isVerified ? 'Verified' : 'Review'}</span></td><td className="flex gap-2 py-4"><button onClick={() => toggle(item, 'isVerified')} className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100">{item.isVerified ? 'Unverify' : 'Verify'}</button><button onClick={() => toggle(item, 'isSuspended')} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-100">{item.isSuspended ? 'Restore' : 'Suspend'}</button></td></tr>)}</tbody></table></section></DashboardLayout>; }

export function Storefront() { const { storeSlug } = useParams(); const [merchant, setMerchant] = useState(null); const [products, setProducts] = useState([]); useEffect(() => { Promise.all([apiClient.get(`/merchants/public/${storeSlug}`), apiClient.get(`/products/store/${storeSlug}`)]).then(([m, p]) => { setMerchant(m.data.merchant); setProducts(p.data); }).catch(() => {}); }, [storeSlug]); return <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_30%),#f7faf8] px-5 py-8 text-slate-900 sm:px-8"><div className="mx-auto max-w-6xl"><header className="flex items-center justify-between border-b border-slate-200 pb-6"><div className="flex items-center gap-3">{merchant?.logoUrl ? <img src={merchant.logoUrl} alt="" className="h-11 w-11 rounded-2xl object-cover" /> : <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 font-black text-white">{merchant?.businessName?.[0] || 'L'}</div>}<div><p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Shop direct</p><h1 className="text-xl font-black text-slate-900">{merchant?.businessName || 'Store'}</h1></div></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">{merchant?.isVerified ? 'Verified merchant' : 'Independent store'}</span></header><div className="py-16"><div className="rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-600 p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Curated collections</p><h2 className="mt-3 max-w-xl text-5xl font-black tracking-[-0.06em]">Made to be shared.</h2><p className="mt-4 max-w-lg text-white/75">Beautiful products, fast checkout, and a storefront that feels built for conversations.</p></div><div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.map((item) => <Link to={`/store/${storeSlug}/checkout/${item._id}`} key={item._id} className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)] ring-1 ring-slate-200 transition hover:-translate-y-1"><img src={item.imageUrl || productImage} alt={item.title} className="h-64 w-full object-cover" /><div className="p-5"><h3 className="font-black text-slate-900">{item.title}</h3><div className="mt-3 flex justify-between text-sm"><span className="text-slate-500">{item.inventoryCount} available</span><span className="font-black text-emerald-700">{formatGHS(item.price)}</span></div></div></Link>)}</div></div></div></main>; }

export function DynamicCheckout() { const { productId } = useParams(); const [item, setItem] = useState(null); const [form, setForm] = useState({ customerName: '', customerPhone: '', deliveryAddress: '' }); const [quantity, setQuantity] = useState(1); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); useEffect(() => { apiClient.get(`/products/${productId}`).then(({ data }) => setItem(data)).catch(() => setError('Product unavailable.')); }, [productId]); async function submit(e) { e.preventDefault(); if (!validateGhanaPhone(form.customerPhone)) return setError('Enter a valid Ghana phone number.'); setLoading(true); try { const { data } = await apiClient.post('/checkout/initialize', { ...form, productId, quantity }); window.location.assign(data.authorizationUrl); } catch (err) { setError(err.response?.data?.message || 'Payment could not start.'); } finally { setLoading(false); } } return <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_32%),#f7faf8] px-5 py-8"><div className="mx-auto max-w-5xl"><Link to="/" className="inline-flex items-center text-2xl font-black tracking-tight text-slate-900">LinkPay<span className="text-emerald-500">.</span></Link>{item && <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_0.9fr]"><div className="rounded-[2rem] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] ring-1 ring-slate-200"><img src={item.imageUrl || productImage} alt={item.title} className="h-[30rem] w-full rounded-[1.5rem] object-cover" /><div className="mt-6 px-2"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Featured item</p><h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">{item.title}</h1><p className="mt-3 text-slate-600">{item.description}</p><p className="mt-5 text-2xl font-black text-emerald-700">{formatGHS(item.price * quantity)}</p></div></div><form onSubmit={submit} className="self-start rounded-[2rem] bg-slate-900 p-7 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]"><h2 className="text-3xl font-black tracking-tight">One-minute checkout</h2><div className="mt-7 space-y-4"><Field label="Full name" required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /><Field label="WhatsApp / phone" required value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} /><Field label="Delivery address" required value={form.deliveryAddress} onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })} /><Field label="Quantity" type="number" min="1" max={item.inventoryCount} required value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /></div>{error && <p className="mt-5 text-sm text-red-300">{error}</p>}<button disabled={loading} className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 py-4 font-black text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 disabled:opacity-60">{loading ? 'Connecting...' : 'Pay with Mobile Money / Card'} <ArrowRight size={17} /></button></form></div>}</div></main>; }

export function StoreSetup() {
  const [merchant, setMerchant] = useState(getMerchant());
  const [saved, setSaved] = useState(false);
  async function submit(e) {
    e.preventDefault();
    const { data } = await apiCall('put', '/merchants/store', merchant);
    setMerchant(data.merchant);
    saveSession({ token: localStorage.getItem('luma_token'), merchant: data.merchant });
    setSaved(true);
  }
  return <DashboardLayout><Header title="Store setup" /><form onSubmit={submit} className="max-w-2xl rounded-[1.8rem] bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] ring-1 ring-slate-200 sm:p-8"><div className="grid gap-5 sm:grid-cols-2"><Field label="Business name" value={merchant?.businessName || ''} onChange={(e) => setMerchant({ ...merchant, businessName: e.target.value })} /><Field label="Custom URL slug" value={merchant?.slug || ''} onChange={(e) => setMerchant({ ...merchant, slug: e.target.value })} /><Field label="Store logo URL" value={merchant?.logoUrl || ''} onChange={(e) => setMerchant({ ...merchant, logoUrl: e.target.value })} /><Field label="Paystack public key" value={merchant?.paystackPublicKey || ''} onChange={(e) => setMerchant({ ...merchant, paystackPublicKey: e.target.value })} /></div><p className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-100">Your storefront: /store/{merchant?.slug}</p><button className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-emerald-500 hover:text-slate-900">{saved ? 'Saved' : 'Save store settings'}</button></form></DashboardLayout>;
}

export function Products() {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', price: '', inventoryCount: '', imageUrl: productImage });
  const merchant = getMerchant();
  function load() { apiCall('get', '/products').then(({ data }) => setProducts(data)).catch(() => {}); }
  useEffect(load, []);
  async function submit(e) { e.preventDefault(); await apiCall('post', '/products', form); setForm({ title: '', description: '', price: '', inventoryCount: '', imageUrl: productImage }); setOpen(false); load(); }
  return <DashboardLayout><Header title="Products" action={<button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-emerald-500 hover:text-slate-900"><Plus size={16} /> Add product</button>} /><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{products.map((item) => <article key={item._id} className="overflow-hidden rounded-[1.75rem] bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.06)] ring-1 ring-slate-200"><img src={item.imageUrl || productImage} alt={item.title} className="h-52 w-full object-cover" /><div className="p-5"><div className="flex justify-between gap-3"><h2 className="font-black text-slate-900">{item.title}</h2><span className="font-black text-emerald-700">{formatGHS(item.price)}</span></div><p className="mt-2 text-sm text-slate-500">{item.inventoryCount} in stock</p><button onClick={() => { setSelectedProduct(item); setShareModalOpen(true); }} className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-100 px-3 py-2.5 text-sm font-black text-emerald-700 transition hover:bg-emerald-200"><Share2 size={16} /> Share as Ad</button></div></article>)}</div>{open && <Modal title="Add new product" onClose={() => setOpen(false)}><form onSubmit={submit} className="space-y-4"><Field label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><Field label="Price (GHS)" type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /><Field label="Stock" type="number" required value={form.inventoryCount} onChange={(e) => setForm({ ...form, inventoryCount: e.target.value })} /><Field label="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /><button className="w-full rounded-2xl bg-slate-900 py-3 font-black text-white shadow-lg shadow-slate-200 transition hover:bg-emerald-500 hover:text-slate-900">Save product</button></form></Modal>}{selectedProduct && <ProductShareModal product={selectedProduct} merchant={merchant} isOpen={shareModalOpen} onClose={() => { setShareModalOpen(false); setSelectedProduct(null); }} />}</DashboardLayout>;
}

export function ProfilePage() {
  const merchant = getMerchant();
  const [storeName, setStoreName] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  async function createStore(event) {
    event.preventDefault();
    if (!storeName.trim()) return setMessage('Enter a store name first.');
    setCreating(true);
    try {
      const payload = { businessName: storeName.trim(), slug: storeName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-store' };
      const { data } = await apiCall('put', '/merchants/store', { ...merchant, ...payload });
      saveSession({ token: localStorage.getItem('luma_token'), merchant: data.merchant });
      setMessage('Store created successfully.');
      setStoreName('');
      window.location.href = '/dashboard/store';
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to create store.');
    } finally {
      setCreating(false);
    }
  }

  return <DashboardLayout><Header title="Profile" /><div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]"><section className="rounded-[1.8rem] bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] ring-1 ring-slate-200"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-300 text-xl font-black text-slate-900 shadow-lg shadow-emerald-100">{(merchant?.firstName || 'U').slice(0, 1)}{(merchant?.surname || 'S').slice(0, 1)}</div><div><h2 className="text-2xl font-black text-slate-900">{merchant?.businessName || 'Your profile'}</h2><p className="text-sm text-slate-500">{merchant?.email || 'No email'}</p></div></div><div className="mt-6 space-y-3 text-sm"><div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span className="text-slate-500">Name</span><span className="font-black text-slate-900">{merchant?.firstName || ''} {merchant?.surname || ''}</span></div><div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span className="text-slate-500">Date of birth</span><span className="font-black text-slate-900">{merchant?.dateOfBirth || 'Not set'}</span></div><div className="flex justify-between rounded-2xl bg-slate-50 p-3"><span className="text-slate-500">Gender</span><span className="font-black text-slate-900">{merchant?.gender || 'Not set'}</span></div></div></section><section className="rounded-[1.8rem] bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-700 p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.15)]"><h2 className="text-xl font-black">Create a store</h2><p className="mt-2 text-sm text-white/75">Build your own storefront and start selling products or services.</p><form onSubmit={createStore} className="mt-5 space-y-4"><Field label="Store name" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="My boutique" /><button disabled={creating} className="w-full rounded-2xl bg-white px-4 py-3 font-black text-slate-900 shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 disabled:opacity-60">{creating ? 'Creating...' : 'Create store'}</button>{message && <p className="rounded-2xl bg-emerald-100/15 p-3 text-sm text-emerald-100 ring-1 ring-white/10">{message}</p>}</form></section></div></DashboardLayout>;
}
