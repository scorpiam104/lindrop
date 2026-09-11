import { Pencil, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { apiCall, getMerchant, saveSession } from '../lib/session';
import CustomerSpendingChart from './CustomerSpendingChart.jsx';

export default function ProfileDetailsEditor() {
  const [merchant, setMerchant] = useState(getMerchant());
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [triggerTarget, setTriggerTarget] = useState(null);

  useEffect(() => {
    const heading = [...document.querySelectorAll('p')].find((element) => element.textContent.trim() === 'Personal details');
    const target = heading?.parentElement?.querySelector('h2') || null;
    setTriggerTarget(target);
    return undefined;
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    apiCall('get', '/merchants/me').then(({ data }) => setMerchant(data.merchant)).catch(() => {});
    return undefined;
  }, [open]);

  function update(field, value) {
    setMerchant((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        firstName: merchant?.firstName || '',
        surname: merchant?.surname || '',
        dateOfBirth: merchant?.dateOfBirth || '',
        gender: merchant?.gender || '',
        phone: merchant?.phone || ''
      };
      const { data } = await apiCall('put', '/merchants/store', payload);
      setMerchant(data.merchant);
      saveSession({ token: localStorage.getItem('luma_token'), merchant: data.merchant });
      setOpen(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save your profile details.');
    } finally {
      setSaving(false);
    }
  }

  const trigger = <button type="button" onClick={() => setOpen(true)} className="ml-2 inline-flex h-7 w-7 translate-y-[-2px] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 align-middle transition hover:border-[#2563EB] hover:text-[#2563EB]" aria-label="Edit personal details" title="Edit personal details"><Pencil size={13} /></button>;

  return <>
    {triggerTarget && createPortal(trigger, triggerTarget)}
    {open && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 px-5 py-8 backdrop-blur-sm"><form onSubmit={submit} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-widest text-[#2563EB]">Personal details</p><h2 className="mt-2 text-2xl font-black text-slate-900">Edit your information</h2></div><button type="button" onClick={() => setOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Close editor"><X size={18} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-slate-700">First name<input value={merchant?.firstName || ''} onChange={(event) => update('firstName', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none focus:border-[#2563EB]" /></label><label className="text-sm font-bold text-slate-700">Surname<input value={merchant?.surname || ''} onChange={(event) => update('surname', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none focus:border-[#2563EB]" /></label><label className="text-sm font-bold text-slate-700">Date of birth<input type="date" value={merchant?.dateOfBirth || ''} onChange={(event) => update('dateOfBirth', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none focus:border-[#2563EB]" /></label><label className="text-sm font-bold text-slate-700">Gender<select value={merchant?.gender || ''} onChange={(event) => update('gender', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none focus:border-[#2563EB]"><option value="">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="nonbinary">Non-binary</option></select></label><label className="text-sm font-bold text-slate-700 sm:col-span-2">Phone<input value={merchant?.phone || ''} onChange={(event) => update('phone', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none focus:border-[#2563EB]" /></label><label className="text-sm font-bold text-slate-700 sm:col-span-2">Email<input value={merchant?.email || ''} readOnly className="mt-2 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 py-3 text-sm text-slate-500 outline-none" /><span className="mt-1 block text-xs font-medium text-slate-400">Email cannot be changed here.</span></label></div>{error && <p className="mt-4 text-sm font-bold text-red-600">{error}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600">Cancel</button><button disabled={saving} className="rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-black text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save details'}</button></div></form></div>}
    <CustomerSpendingChart />
  </>;
}
