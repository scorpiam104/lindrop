import { useTheme } from './ThemeProvider.jsx';

export default function LinkPayLogo({ className = 'h-10 w-auto', eager = false }) {
  const { theme } = useTheme();
  return <img src={theme === 'dark' ? '/linkpay-logo-dark.svg' : '/linkpay-logo.svg'} alt="LinkPay" className={className} loading={eager ? 'eager' : 'lazy'} />;
}
