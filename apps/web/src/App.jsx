import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import MerchantAnalyticsSettings from './components/MerchantAnalyticsSettings.jsx';
import StoreFront from './components/StoreFront.jsx';
import SignupStepper from './components/SignupStepper.jsx';
import SignInPage from './components/SignInPage.jsx';
import UserProfile from './components/UserProfile.jsx';
import LandingPage from './components/LandingPage.jsx';
import AdminAnalyticsDashboard from './components/AdminAnalyticsDashboard.jsx';
import MerchantDashboard from './components/MerchantDashboard.jsx';
import { AdminMerchants, AdminOverview, AuthPage, DynamicCheckout, Landing, Orders, Overview, Products, ProfilePage, Storefront, StoreSetup } from './pages/Platform.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<SignInPage />} />
        <Route path="/signup" element={<SignupStepper />} />
        <Route path="/store/:storeSlug" element={<StoreFront />} />
        <Route path="/store/:storeSlug/checkout/:productId" element={<DynamicCheckout />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Overview />} />
          <Route path="/dashboard/store" element={<StoreSetup />} />
          <Route path="/dashboard/products" element={<Products />} />
          <Route path="/dashboard/orders" element={<Orders />} />
          <Route path="/dashboard/analytics" element={<MerchantDashboard />} />
          <Route path="/dashboard/analytics/settings" element={<MerchantAnalyticsSettings />} />
          <Route path="/profile" element={<UserProfile />} />
        </Route>
        <Route element={<ProtectedRoute admin />}>
          <Route path="/admin" element={<AdminAnalyticsDashboard />} />
          <Route path="/admin/merchants" element={<AdminMerchants />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
