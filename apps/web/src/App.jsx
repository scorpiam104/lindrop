import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import MerchantAnalyticsSettings from './components/MerchantAnalyticsSettings.jsx';
import SignupStepper from './components/SignupStepper.jsx';
import SignInPage from './components/SignInPage.jsx';
import UserProfile from './components/UserProfile.jsx';
import ModernLanding from './components/ModernLanding.jsx';
import { ThemeProvider } from './components/ThemeProvider.jsx';
import SuggestionsMarketplace from './components/SuggestionsMarketplace.jsx';
import ThemedStoreFront from './components/ThemedStoreFront.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import PremiumLanding from './components/PremiumLanding.jsx';
import GlobalAppShell from './components/GlobalAppShell.jsx';
import AdminAnalyticsDashboard from './components/AdminAnalyticsDashboard.jsx';
import MerchantDashboard from './components/MerchantDashboard.jsx';
import { AdminMerchants, AdminOverview, AuthPage, DynamicCheckout, Landing, Orders, Overview, Products, ProfilePage, Storefront, StoreSetup } from './pages/Platform.jsx';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <GlobalAppShell>
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
        </GlobalAppShell>
        <div className="fixed bottom-5 right-5 z-50"><ThemeToggle /></div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
