import LinkPayLogo from './LinkPayLogo.jsx';
import { useNavigate } from 'react-router-dom';

export default function Logo({ light = false }) {
  const navigate = useNavigate();
  function goHome(event) {
    event.preventDefault();
    event.stopPropagation();
    navigate('/');
  }

  return <LinkPayLogo className={`linkpay-logo ${light ? 'linkpay-logo-light' : ''}`} eager onClick={goHome} />;
}
