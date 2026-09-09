export default function LinkPayLogo({ className = 'h-10 w-auto', eager = false }) {
  return <img src="/linkpay-logo.svg" alt="LinkPay" className={className} loading={eager ? 'eager' : 'lazy'} />;
}
