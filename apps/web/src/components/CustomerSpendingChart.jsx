import { useEffect, useState } from 'react';
import { formatGHS } from '@my-app/shared';
import { apiCall } from '../lib/session';
import { MerchantTrendChart } from './AnalyticsCharts.jsx';

export default function CustomerSpendingChart() {
  const [history, setHistory] = useState([]);
  useEffect(() => { apiCall('get', '/analytics/customer').then(({ data }) => setHistory(data.history || [])).catch(() => {}); }, []);
  return <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"><div className="flex items-end justify-between"><div><p className="text-[10px] font-black uppercase tracking-widest text-[#2563EB]">Customer analytics</p><h2 className="mt-2 text-xl font-black">Spending history</h2></div><p className="text-sm font-black text-[#1E3A8A]">{formatGHS(history.reduce((sum, item) => sum + Number(item.spending || 0), 0))}</p></div><div className="mt-4"><MerchantTrendChart data={history.map((item) => ({ ...item, revenue: item.spending }))} /></div></section>;
}
