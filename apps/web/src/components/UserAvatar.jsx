import { Link } from 'react-router-dom';
import { getMerchant } from '../lib/session';

export function getUserInitials(merchant = getMerchant()) {
  const first = merchant?.firstName?.trim()?.[0] || '';
  const second = merchant?.surname?.trim()?.[0] || '';
  return `${first}${second}`.toUpperCase() || 'LP';
}

export default function UserAvatar({ compact = false }) {
  const merchant = getMerchant();
  return <Link to="/profile" className={`user-avatar ${compact ? 'user-avatar-compact' : ''}`} aria-label="Open profile" title="Profile"><span>{getUserInitials(merchant)}</span></Link>;
}
