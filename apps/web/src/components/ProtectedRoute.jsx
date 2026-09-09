import { Navigate, Outlet } from 'react-router-dom';
import { getMerchant, getToken } from '../lib/session';

export default function ProtectedRoute({ admin = false }) {
  const merchant = getMerchant();
  if (!getToken() || !merchant) return <Navigate to="/login" replace />;
  if (admin && merchant.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
