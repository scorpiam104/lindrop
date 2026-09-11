import LinkPayLogo from './LinkPayLogo.jsx';

export default function Logo({ to = '/', light = false }) {
  return <LinkPayLogo className={`linkpay-logo ${light ? 'linkpay-logo-light' : ''}`} eager />;
}
