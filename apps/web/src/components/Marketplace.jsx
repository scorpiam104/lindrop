import { Search, ShoppingBag, Store } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, formatGHS } from '@my-app/shared';

const fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85';

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/products/marketplace')
      .then(({ data }) => setProducts(data.products || []))
      .catch(() => setError('The marketplace is taking a moment to load. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => [product.title, product.description, product.storeName].some((value) => value?.toLowerCase().includes(query)));
  }, [products, search]);

  return <main className="min-h-screen bg-[#f7f8f5] text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-5 sm:px-8"><Link to="/marketplace" className="text-2xl font-black tracking-tight">LinkPay<span className="text-emerald-500">.</span></Link><div className="hidden items-center gap-6 text-sm font-bold text-slate-500 sm:flex"><span className="text-slate-900">Discover</span><Link to="/profile" className="transition hover:text-emerald-600">My account</Link></div><Link to="/profile" aria-label="Open account" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-emerald-500 hover:text-slate-900"><ShoppingBag size={17} /></Link></div></header>
    <section className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.2),_transparent_38%),linear-gradient(120deg,#eef8f2,#fffdf8)]"><div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-700">The LinkPay marketplace</p><h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.06em] sm:text-7xl">Find your next favourite thing.</h1><p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">Shop fresh products from independent stores, all in one place.</p><label className="mt-9 flex max-w-2xl items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.08)]"><Search size={20} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400" placeholder="Search products or stores" /></label></div></section>
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-bold text-slate-500">Curated for you</p><h2 className="mt-1 text-2xl font-black tracking-tight">Trending products</h2></div><span className="text-sm font-bold text-slate-400">{visibleProducts.length} items</span></div>
      {loading && <p className="py-20 text-center text-sm font-bold text-slate-500">Loading the marketplace...</p>}
      {!loading && error && <div className="py-20 text-center"><p className="font-bold text-slate-600">{error}</p><button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white">Try again</button></div>}
      {!loading && !error && visibleProducts.length === 0 && <div className="py-20 text-center"><Store className="mx-auto text-slate-300" size={40} /><p className="mt-4 font-bold text-slate-600">No products match that search yet.</p></div>}
      {!loading && !error && visibleProducts.length > 0 && <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visibleProducts.map((product) => <article key={product._id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,23,42,0.1)]"><Link to={`/store/${product.storeSlug}/checkout/${product._id}`}><div className="aspect-square overflow-hidden bg-slate-100"><img src={product.imageUrl || fallbackImage} alt={product.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div><div className="p-4"><p className="truncate text-xs font-bold text-emerald-700">{product.storeName}</p><h3 className="mt-2 truncate text-base font-black">{product.title}</h3><p className="mt-3 text-lg font-black text-slate-900">{formatGHS(product.price)}</p><p className="mt-1 text-xs font-semibold text-slate-400">{product.inventoryCount} available</p></div></Link></article>)}</div>}
    </section>
  </main>;
}