import { Download, QrCode } from 'lucide-react';

export default function PaymentQRCode({ paymentUrl, amount, reference }) {
  const value = paymentUrl || `${window.location.origin}/checkout?amount=${encodeURIComponent(amount || '')}&reference=${encodeURIComponent(reference || '')}`;
  const imageUrl = `https://quickchart.io/qr?size=360&text=${encodeURIComponent(value)}`;
  function download() { const link = document.createElement('a'); link.href = imageUrl; link.download = `payment-${reference || 'qr'}.png`; link.click(); }
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm"><div className="flex items-center justify-center gap-2 text-sm font-black text-[#1E3A8A]"><QrCode size={18} /> Payment QR</div><img src={imageUrl} alt="Payment QR code" className="mx-auto mt-4 h-56 w-56 rounded-xl" /><p className="mt-3 break-all text-xs text-slate-500">{value}</p><button type="button" onClick={download} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2 text-sm font-black text-white hover:bg-[#2563EB]"><Download size={15} /> Download QR</button></section>;
}