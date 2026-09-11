import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiClient, formatGHS } from '@my-app/shared';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const themes = { aurora: 'store-theme-aurora', minimal: 'store-theme-minimal', noir: 'store-theme-noir', candy: 'store-theme-candy', editorial: 'store-theme-editorial', ocean: 'store-theme-ocean', sunset: 'store-theme-sunset', botanical: 'store-theme-botanical', mono: 'store-theme-mono', playful: 'store-theme-playful' };
const fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85';

export default function ThemedStoreFront() {
  const { storeSlug } = useParams(); const [merchant, setMerchant] = useState(null); const [products, setProducts] = useState([]);
  useEffect(() => { Promise.all([apiClient.get(`/merchants/public/${storeSlug}`), apiClient.get(`/products/store/${storeSlug}`)]).then(([merchantResponse, productsResponse]) => { setMerchant(merchantResponse.data.merchant); setProducts(productsResponse.data); }).catch(() => {}); }, [storeSlug]);
  const themeClass = themes[merchant?.storeTheme] || themes.aurora;
  return <main className={`store-theme ${themeClass} min-h-screen px-5 py-6 text-slate-900 sm:px-8`}><div className="mx-auto max-w-6xl"><header className="flex items-center justify-between border-b border-black/10 pb-5"><Link to="/marketplace"><Logo /></Link><div className="flex items-center gap-3"><ThemeToggle compact /><span className="rounded-full bg-black/10 px-3 py-1 text-xs font-black">{merchant?.isVerified ? 'Verified store' : 'Independent store'}</span></div></header><section className="py-14"><p className="text-xs font-black uppercase tracking-[.22em] opacity-60">{merchant?.storeName || merchant?.businessName || 'Store'}</p><h1 className="mt-4 max-w-3xl text-5xl font-black tracking-[-.06em] sm:text-7xl">{merchant?.description || 'Products worth passing along.'}</h1><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <article key={product._id} className="store-product overflow-hidden"><img src={product.imageUrl || fallbackImage} alt={product.title} className="h-60 w-full object-cover" /><div className="p-5"><h2 className="font-black">{product.title}</h2><p className="mt-2 text-sm opacity-70">{product.description}</p><div className="mt-5 flex items-center justify-between"><span className="font-black">{formatGHS(product.price)}</span><Link to={`/store/${storeSlug}/checkout/${product._id}`} className="rounded-xl bg-black px-3 py-2 text-xs font-black text-white">Buy now</Link></div></div></article>)}</div></section></div></main>;
}
