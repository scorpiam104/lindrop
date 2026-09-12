import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { ThemeProvider } from './components/ThemeProvider.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import PremiumLanding from './components/PremiumLanding.jsx';
import GlobalAppShell from './components/GlobalAppShell.jsx';
const SignupStepper = lazy(() => import('./components/SignupStepper.jsx'));
const SignInPage = lazy(() => import('./components/SignInPage.jsx'));
const UserProfile = lazy(() => import('./components/UserProfile.jsx'));
const SuggestionsMarketplace = lazy(() => import('./components/SuggestionsMarketplace.jsx'));
const ThemedStoreFront = lazy(() => import('./components/ThemedStoreFront.jsx'));
const lazyPlatform = (name) => lazy(() => import('./pages/Platform.jsx').then((module) => ({ default: module[name] })));
const AdminMerchants = lazyPlatform('AdminMerchants');
const DynamicCheckout = lazyPlatform('DynamicCheckout');
const Orders = lazyPlatform('Orders');
const Overview = lazyPlatform('Overview');
const Products = lazyPlatform('Products');
const StoreSetup = lazyPlatform('StoreSetup');
const AdminAnalyticsDashboard = lazy(() => import('./components/AdminAnalyticsDashboard.jsx'));
const MerchantDashboard = lazy(() => import('./components/MerchantDashboard.jsx'));
const MerchantAnalyticsSettings = lazy(() => import('./components/MerchantAnalyticsSettings.jsx'));

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <GlobalAppShell>
          <Suspense fallback={<div className="route-loading" role="status">Loading...</div>}>
          <Routes>
        <Route path="/" element={<PremiumLanding />} />
        <Route path="/login" element={<SignInPage />} />
        <Route path="/signup" element={<SignupStepper />} />
        <Route path="/marketplace" element={<SuggestionsMarketplace />} />
        <Route path="/store/:storeSlug" element={<ThemedStoreFront />} />
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
          </Suspense>
        </GlobalAppShell>
        <div className="fixed bottom-5 right-5 z-50"><ThemeToggle /></div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
