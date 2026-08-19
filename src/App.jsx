import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SuperAdminLayout from "./layouts/SuperAdminLayout";
import BrandOwnerLayout from "./layouts/BrandOwnerLayout";
import Dashboard from "./pages/admin/Dashboard";
import Categories from "./pages/admin/Categories";
import Companies from "./pages/admin/Companies";
import Catalogue from "./pages/merchant/Catalogue";
import Locations from "./pages/admin/Locations";
import Users from "./pages/admin/Users";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import CategoriesPage from "./pages/CategoriesPage";
import Careers from "./pages/Careers";
import Investors from "./pages/Investors";
import Settings from "./pages/admin/Settings";
import Products from "./pages/admin/Products";
import AddProduct from "./pages/admin/AddProduct";
import Services from "./pages/admin/Services";
import AddService from "./pages/admin/AddService";
import ClaimRequests from "./pages/admin/ClaimRequests";
import Plans from "./pages/admin/Plans";
import Coupons from "./pages/admin/Coupons";
import BrandDashboard from "./pages/brand/BrandDashboard";
import BrandLocations from "./pages/brand/BrandLocations";
import BusinessDetail from "./pages/BusinessDetail";
import ProductDetail from "./pages/ProductDetail";
import OnboardingWizard from "./pages/OnboardingWizard";
import Leads from "./pages/admin/Leads";
import MerchantLeads from "./pages/merchant/Leads";
import MerchantReviews from "./pages/merchant/Reviews";
import MerchantFAQs from "./pages/merchant/FAQs";
import MerchantQuestions from "./pages/merchant/Questions";
import BrandSettings from "./pages/merchant/BrandSettings";
import OnboardingLanding from "./pages/merchant/OnboardingLanding";
import LeadDetail from "./pages/merchant/LeadDetail";
import ProfileEditor from "./pages/merchant/ProfileEditor";
import Pricing from "./pages/merchant/Pricing";
import Billing from "./pages/merchant/Billing";
import Analytics from "./pages/merchant/Analytics";
import Promotions from "./pages/merchant/Promotions";
import Offers from "./pages/merchant/Offers";
import SupportTickets from "./pages/merchant/SupportTickets";
import MyReviews from "./pages/user/MyReviews";
import MyEnquiries from "./pages/user/MyEnquiries";
import ProfileLayout from './pages/user/ProfileLayout';
import ProfilePage from './pages/user/ProfilePage';
import SavedListings from './pages/user/SavedListings';
import AddressBook from './pages/user/AddressBook';
import AccountSettings from './pages/user/AccountSettings';
import SecurityPage from './pages/user/SecurityPage';
import NotificationsPage from './pages/user/NotificationsPage';
import MerchantNotificationSettings from './pages/merchant/NotificationSettings';
import Sessions from './pages/user/Sessions';

// Essential Admin Modules
import Listings from "./pages/admin/Listings";
import ReviewModeration from "./pages/admin/ReviewModeration";
import QuestionModeration from "./pages/admin/QuestionModeration";
import RoleManager from "./pages/admin/RoleManager";
import FraudDashboard from "./pages/admin/FraudDashboard";
import AuditLogs from "./pages/admin/AuditLogs";
import BroadcastManager from "./pages/admin/BroadcastManager";
import OSMDiscovery from "./pages/admin/OSMDiscovery";
import PhotoModeration from "./pages/admin/PhotoModeration";

import SubscriptionsAdmin from "./pages/admin/SubscriptionsAdmin";
import CreateListing from "./pages/admin/CreateListing";
import CMSDashboard from "./pages/admin/CMSDashboard";
import ArticleList from "./pages/admin/ArticleList";
import ArticleEditor from "./pages/admin/ArticleEditor";
import PageList from "./pages/admin/PageList";
import PageEditor from "./pages/admin/PageEditor";
import FAQManager from "./pages/admin/FAQManager";
import BannerManager from "./pages/admin/BannerManager";
import SEOContentManager from "./pages/admin/SEOContentManager";
import MediaLibrary from "./pages/admin/MediaLibrary";
import AdminUserManager from "./pages/admin/AdminUserManager";
import EditCompany from "./pages/admin/EditCompany";
import Reports from "./pages/admin/Reports";
import ComponentGallery from "./pages/ComponentGallery";

// Revenue & Finance Modules
import RevenueDashboard from "./pages/admin/RevenueDashboard";
import TransactionHistory from "./pages/admin/TransactionHistory";
import RefundQueue from "./pages/admin/RefundQueue";
import InvoiceManager from "./pages/admin/InvoiceManager";
import GSTReport from "./pages/admin/GSTReport";
import FailedPayments from "./pages/admin/FailedPayments";
import PayoutTracker from "./pages/admin/PayoutTracker";

// Advertisement Manager
import AdSlotConfig from "./pages/admin/AdSlotConfig";
import AdManager from "./pages/admin/AdManager";
import AdAnalytics from "./pages/admin/AdAnalytics";

// Auth
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ConfigProvider } from './context/ConfigContext';
import { Toaster } from 'react-hot-toast';
import FcmTokenHandler from './components/auth/FcmTokenHandler';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import OTPScreen from './pages/auth/OTPScreen';
import ForgotPassword from './pages/auth/ForgotPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';

export default function App() {
  return (
    <ConfigProvider>
      <ThemeProvider>
      <AuthProvider>
        <Toaster 
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#334155', // slate-700
              borderRadius: '16px',
              border: '1px solid #e2e8f0', // slate-200
              fontSize: '14px',
              fontWeight: '600',
              padding: '12px 16px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#10b981', // emerald-500
                secondary: '#fff',
              },
              style: {
                background: '#ecfdf5', // emerald-50
                border: '1px solid #d1fae5', // emerald-100
                color: '#064e3b', // emerald-900
              }
            },
            error: {
              iconTheme: {
                primary: '#ef4444', // rose-500
                secondary: '#fff',
              },
              style: {
                background: '#fff1f2', // rose-50
                border: '1px solid #ffe4e6', // rose-100
                color: '#4c0519', // rose-900
              }
            }
          }}
        />
        <FcmTokenHandler />
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-otp" element={<OTPScreen />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/investors" element={<Investors />} />
            <Route path="/business/:slug" element={<BusinessDetail />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/add-business" element={<OnboardingLanding />} />
            <Route path="/free-listing" element={<OnboardingWizard />} />

            {/* Super Admin / RBAC Admin Routes */}
            <Route
              path="/admin"
              element={
                // blockPublicRoles lets through Super Admin + any custom RBAC role.
                // Public-tier roles (User, Brand Owner, etc.) are blocked.
                // The backend's checkPermission middleware enforces per-page permissions.
                <ProtectedRoute blockPublicRoles>
                  <SuperAdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="categories" element={<Categories />} />
              <Route path="companies" element={<Companies />} />
              <Route path="products" element={<Products />} />
              <Route path="products/add" element={<AddProduct />} />
              <Route path="products/edit/:id" element={<AddProduct />} />
              <Route path="services" element={<Services />} />
              <Route path="services/add" element={<AddService />} />
              <Route path="services/edit/:id" element={<AddService />} />
              <Route path="locations/*" element={<Locations />} />
              <Route path="companies/:id/edit" element={<EditCompany />} />
              <Route path="listings/:slug/edit" element={<EditCompany />} />
              <Route path="users" element={<Users />} />
              <Route path="admins" element={<AdminUserManager />} />
              <Route path="claims" element={<ClaimRequests />} />
              <Route path="plans" element={<Plans />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="settings" element={<Settings />} />
              <Route path="leads" element={<Leads />} />
              <Route path="listings" element={<Listings />} />
              <Route path="listings/create" element={<CreateListing />} />
              <Route path="reviews" element={<ReviewModeration />} />
              <Route path="qa" element={<QuestionModeration />} />
              <Route path="photos" element={<PhotoModeration />} />
              <Route path="roles" element={<RoleManager />} />
              <Route path="fraud" element={<FraudDashboard />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="broadcasts" element={<BroadcastManager />} />
              <Route path="discovery" element={<OSMDiscovery />} />
              <Route path="subscriptions" element={<SubscriptionsAdmin />} />
              <Route path="faqs" element={<FAQManager />} />
              
              {/* CMS & Content Manager */}
              <Route path="cms" element={<CMSDashboard />} />
              <Route path="cms/articles" element={<ArticleList />} />
              <Route path="cms/articles/new" element={<ArticleEditor />} />
              <Route path="cms/articles/edit/:id" element={<ArticleEditor />} />
              <Route path="cms/pages" element={<PageList />} />
              <Route path="cms/pages/new" element={<PageEditor />} />
              <Route path="cms/pages/edit/:id" element={<PageEditor />} />
              <Route path="cms/faqs" element={<FAQManager />} />
              <Route path="cms/banners" element={<BannerManager />} />
              <Route path="cms/seo" element={<SEOContentManager />} />
              <Route path="cms/media" element={<MediaLibrary />} />

              <Route path="reports" element={<Reports />} />
              <Route path="ui-gallery" element={<ComponentGallery />} />

              {/* Revenue & Finance */}
              <Route path="revenue" element={<RevenueDashboard />} />
              <Route path="revenue/transactions" element={<TransactionHistory />} />
              <Route path="revenue/refunds" element={<RefundQueue />} />
              <Route path="revenue/invoices" element={<InvoiceManager />} />
              <Route path="revenue/gst-report" element={<GSTReport />} />
              <Route path="revenue/failed-payments" element={<FailedPayments />} />
              <Route path="revenue/payouts" element={<PayoutTracker />} />

              {/* Advertisements */}
              <Route path="ads" element={<AdManager />} />
              <Route path="ads/slots" element={<AdSlotConfig />} />
              <Route path="ads/analytics" element={<AdAnalytics />} />
            </Route>

            {/* Brand/Merchant Owner Routes */}
            <Route
              path="/brand"
              element={
                <ProtectedRoute allowedRoles={['Brand Owner', 'Company Owner', 'Merchant', 'owner', 'Owner', 'OWNER']}>
                  <BrandOwnerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<BrandDashboard />} />
              <Route path="settings" element={<BrandSettings />} />
              <Route path="listings" element={<Companies />} />
              <Route path="profile/:id" element={<ProfileEditor />} />
              <Route path="categories" element={<Categories />} />
              <Route path="products" element={<Products />} />
              <Route path="products/add" element={<AddProduct />} />
              <Route path="products/edit/:id" element={<AddProduct />} />
              <Route path="catalogue" element={<Catalogue />} />
              <Route path="locations" element={<BrandLocations />} />
              <Route path="leads" element={<MerchantLeads />} />
              <Route path="lead/:leadId" element={<LeadDetail />} />
              <Route path="reviews" element={<MerchantReviews />} />
              <Route path="qa" element={<MerchantQuestions />} />
              <Route path="faqs" element={<MerchantFAQs />} />
              <Route path="pricing" element={<Pricing />} />
              <Route path="billing" element={<Billing />} />
              <Route path="promotions" element={<Promotions />} />
              <Route path="offers" element={<Offers />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="notifications/settings" element={<MerchantNotificationSettings />} />
              <Route path="support" element={<SupportTickets />} />
              <Route path="audit-logs" element={<AuditLogs />} />
            </Route>

            {/* User Profile Routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfileLayout />
              </ProtectedRoute>
            }>
              <Route index element={<ProfilePage />} />
              <Route path="saved" element={<SavedListings />} />
              <Route path="enquiries" element={<MyEnquiries />} />
              <Route path="reviews" element={<MyReviews />} />
              <Route path="addresses" element={<AddressBook />} />
              <Route path="settings" element={<AccountSettings />} />
              <Route path="security" element={<SecurityPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="sessions" element={<Sessions />} />
            </Route>

            {/* Catch-all route: intercepts unknown paths like root /dashboard and redirects to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
        </AuthProvider>
      </ThemeProvider>
    </ConfigProvider>
  );
}
