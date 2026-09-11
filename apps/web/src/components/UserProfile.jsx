import { BarChart3, CalendarDays, Cake, LayoutDashboard, Mail, Package, Phone, Store, UserCircle2, ShoppingBag, Settings, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { apiCall, getMerchant, saveSession } from '../lib/session';
import CreateStoreModal from './CreateStoreModal.jsx';
import CustomerSpendingChart from './ProfileDetailsEditor.jsx';

const VenusAndMars = Users;

const storeThemes = [
  ['aurora', 'Aurora', 'Cyan glass and soft light'],
  ['minimal', 'Minimal', 'Clean space and sharp type'],
  ['noir', 'Noir', 'Dark luxury and contrast'],
  ['candy', 'Candy', 'Bright playful color'],
  ['editorial', 'Editorial', 'Magazine-inspired layout'],
  ['ocean', 'Ocean', 'Cool blue, calm and open'],
  ['sunset', 'Sunset', 'Warm coral and amber'],
  ['botanical', 'Botanical', 'Natural greens and cream'],
  ['mono', 'Mono', 'Black, white, and grid'],
  ['playful', 'Playful', 'Bold shapes and energy']
];

export default function UserProfile() {
  const storedMerchant = getMerchant();
  const [merchant, setMerchant] = useState(storedMerchant);
  const [open, setOpen] = useState(false);
  const [savingTheme, setSavingTheme] = useState('');
  const [themeError, setThemeError] = useState('');
  const navigation = [
    ['/marketplace', 'Marketplace', ShoppingBag],
    ['/dashboard', 'Dashboard', LayoutDashboard],
    ['/dashboard/products', 'Products', Package],
    ['/dashboard/orders', 'Orders', BarChart3],
    ['/dashboard/store', 'Store setup', Store],
    ['/dashboard/analytics', 'Analytics', BarChart3],
    ['/profile', 'Profile', UserCircle2]
  ];

  useEffect(() => {
    const sessionMerchant = getMerchant();
    apiCall('get', '/merchants/me').then(({ data }) => {
      const account = data.merchant || {};
      const mergedMerchant = {
        ...sessionMerchant,
        ...account,
        firstName: account.firstName || account.first_name || sessionMerchant?.firstName || '',
        surname: account.surname || account.lastName || account.last_name || sessionMerchant?.surname || '',
        dateOfBirth: account.dateOfBirth || account.birthDate || sessionMerchant?.dateOfBirth || '',
        gender: account.gender || sessionMerchant?.gender || '',
        phone: account.phone || account.phoneNumber || sessionMerchant?.phone || sessionMerchant?.phoneNumber || ''
      };
      setMerchant(mergedMerchant);
      saveSession({ token: localStorage.getItem('luma_token'), merchant: mergedMerchant });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const syncMerchant = () => setMerchant(getMerchant());
    window.addEventListener('linkpay:merchant-updated', syncMerchant);
    return () => window.removeEventListener('linkpay:merchant-updated', syncMerchant);
  }, []);

  function getAge(dateOfBirth) {
    if (!dateOfBirth) return 'Not provided';
    const birthDate = new Date(dateOfBirth);
    if (Number.isNaN(birthDate.getTime())) return 'Not provided';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const birthdayPassed = today.getMonth() > birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
    if (!birthdayPassed) age -= 1;
    return age >= 0 ? `${age} years` : 'Not provided';
  }

  function formatDate(dateOfBirth) {
    if (!dateOfBirth) return 'Not provided';
    const date = new Date(dateOfBirth);
    return Number.isNaN(date.getTime()) ? dateOfBirth : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  async function selectTheme(storeTheme) {
    const previousMerchant = merchant;
    setThemeError('');
    setSavingTheme(storeTheme);
    setMerchant({ ...merchant, storeTheme });
    try {
      const { data } = await apiCall('put', '/merchants/store', { storeTheme });
      setMerchant(data.merchant);
      saveSession({ token: localStorage.getItem('luma_token'), merchant: data.merchant });
    } catch (error) {
      setMerchant(previousMerchant);
      setThemeError(error.response?.data?.message || 'Unable to save your theme preference.');
    } finally {
      setSavingTheme('');
    }
  }

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.12),_transparent_30%),#f8fafc] px-5 py-8 text-slate-900 sm:px-8"><div className="mx-auto max-w-6xl"><div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start"><aside className="order-first sticky top-6 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur"><div className="flex items-center gap-3 border-b border-slate-100 px-2 pb-4"><Settings size={18} className="text-[#2563EB]" /><div><p className="text-xs font-black uppercase tracking-widest text-slate-400">Quick access</p><p className="mt-1 text-sm font-bold text-slate-900">Your workspace</p></div></div><nav className="mt-3 space-y-1" aria-label="Profile navigation">{navigation.map(([path, label, Icon]) => <NavLink key={path} to={path} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${isActive ? 'bg-[#e8efff] text-[#2457d6]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}><Icon size={17} />{label}</NavLink>)}</nav></aside><div><header className="mb-8"><p className="text-[10px] font-black uppercase tracking-widest text-[#2563EB]">Account</p><h1 className="mt-2 text-4xl font-black">Your profile</h1></header><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-8"><div className="flex items-center gap-4"><UserCircle2 className="text-[#1E3A8A]" size={52} /><div><h2 className="text-2xl font-black">{merchant?.firstName || 'Your'} {merchant?.surname || 'profile'}</h2><p className="text-sm text-slate-500">{merchant?.email || 'No email available'}</p></div></div><div className="mt-7 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Role</p><p className="mt-2 font-black">{merchant?.role || 'customer'}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Store status</p><p className="mt-2 font-black">{merchant?.status || 'No store registered'}</p></div></div><button onClick={() => setOpen(true)} className="mt-7 rounded-xl bg-[#1E3A8A] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#2563EB]">Register a Store</button></section><section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-8"><div className="flex items-center gap-3"><UserCircle2 size={20} className="text-[#2563EB]" /><div><p className="text-[10px] font-black uppercase tracking-widest text-[#2563EB]">Personal details</p><h2 className="mt-1 text-2xl font-black">About you</h2></div></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400"><UserCircle2 size={14} /> Full name</p><p className="mt-2 font-black">{`${merchant?.firstName || ''} ${merchant?.surname || ''}`.trim() || 'Not provided'}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400"><Cake size={14} /> Age</p><p className="mt-2 font-black">{getAge(merchant?.dateOfBirth)}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400"><CalendarDays size={14} /> Date of birth</p><p className="mt-2 font-black">{formatDate(merchant?.dateOfBirth)}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400"><VenusAndMars size={14} /> Gender</p><p className="mt-2 font-black capitalize">{merchant?.gender || 'Not provided'}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400"><Mail size={14} /> Email</p><p className="mt-2 break-all font-black">{merchant?.email || 'Not provided'}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400"><Phone size={14} /> Phone</p><p className="mt-2 font-black">{merchant?.phone || 'Not provided'}</p></div></div></section><section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-8"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-widest text-[#2563EB]">Storefront preference</p><h2 className="mt-2 text-2xl font-black">Choose your theme</h2><p className="mt-2 text-sm text-slate-500">Your selection is saved automatically and applied to your public store.</p></div>{savingTheme && <span className="text-xs font-bold text-slate-400">Saving...</span>}</div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{storeThemes.map(([value, label, description]) => <button type="button" key={value} onClick={() => selectTheme(value)} disabled={Boolean(savingTheme)} className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70 ${merchant?.storeTheme === value ? 'border-cyan-400 bg-cyan-50 ring-2 ring-cyan-200' : 'border-slate-200 bg-white'}`}><span className={`block h-10 rounded-xl theme-preview-${value}`} /><span className="mt-3 block text-xs font-black text-slate-900">{label}</span><span className="mt-1 block text-[10px] leading-4 text-slate-500">{description}</span></button>)}</div>{themeError && <p className="mt-4 text-sm font-bold text-red-600">{themeError}</p>}</section><CustomerSpendingChart /></div></div></div><CreateStoreModal open={open} onClose={() => setOpen(false)} /></main>;
}