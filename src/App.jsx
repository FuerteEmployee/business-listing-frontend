import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SuperAdminLayout from "./layouts/SuperAdminLayout";
const BrandOwnerLayout = lazy(() => import("./layouts/BrandOwnerLayout"));
import Dashboard from "./pages/admin/Dashboard";
import Categories from "./pages/admin/Categories";
import Companies from "./pages/admin/Companies";
const Catalogue = lazy(() => import("./pages/merchant/Catalogue"));
import Locations from "./pages/admin/Locations";
import Users from "./pages/admin/Users";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import CategoriesPage from "./pages/CategoriesPage";
import Careers from "./pages/Careers";
import Investors from "./pages/Investors";
import Advertise from "./pages/Advertise";
import Settings from "./pages/admin/Settings";
import Products from "./pages/admin/Products";
import AddProduct from "./pages/admin/AddProduct";
import Services from "./pages/admin/Services";
import AddService from "./pages/admin/AddService";
import ClaimRequests from "./pages/admin/ClaimRequests";
const Plans = lazy(() => import("./pages/admin/Plans"));
const Coupons = lazy(() => import("./pages/admin/Coupons"));
const BrandDashboard = lazy(() => import("./pages/brand/BrandDashboard"));
const BrandLocations = lazy(() => import("./pages/brand/BrandLocations"));
import BusinessDetail from "./pages/BusinessDetail";
import ProductDetail from "./pages/ProductDetail";
const OnboardingWizard = lazy(() => import("./pages/OnboardingWizard"));
import Leads from "./pages/admin/Leads";
const MerchantLeads = lazy(() => import("./pages/merchant/Leads"));
const MerchantReviews = lazy(() => import("./pages/merchant/Reviews"));
const MerchantFAQs = lazy(() => import("./pages/merchant/FAQs"));
const MerchantQuestions = lazy(() => import("./pages/merchant/Questions"));
const BrandSettings = lazy(() => import("./pages/merchant/BrandSettings"));
const OnboardingLanding = lazy(() => import("./pages/merchant/OnboardingLanding"));
const LeadDetail = lazy(() => import("./pages/merchant/LeadDetail"));
const ProfileEditor = lazy(() => import("./pages/merchant/ProfileEditor"));
const Pricing = lazy(() => import("./pages/merchant/Pricing"));
const Billing = lazy(() => import("./pages/merchant/Billing"));
const Analytics = lazy(() => import("./pages/merchant/Analytics"));
const Promotions = lazy(() => import("./pages/merchant/Promotions"));
const Offers = lazy(() => import("./pages/merchant/Offers"));
const SupportTickets = lazy(() => import("./pages/merchant/SupportTickets"));
const MyReviews = lazy(() => import("./pages/user/MyReviews"));
const MyEnquiries = lazy(() => import("./pages/user/MyEnquiries"));
const ProfileLayout = lazy(() => import("./pages/user/ProfileLayout"));
const ProfilePage = lazy(() => import("./pages/user/ProfilePage"));
const SavedListings = lazy(() => import("./pages/user/SavedListings"));
const AddressBook = lazy(() => import("./pages/user/AddressBook"));
const AccountSettings = lazy(() => import("./pages/user/AccountSettings"));
const SecurityPage = lazy(() => import("./pages/user/SecurityPage"));
const NotificationsPage = lazy(() => import("./pages/user/NotificationsPage"));
const MerchantNotificationSettings = lazy(() => import("./pages/merchant/NotificationSettings"));
const Sessions = lazy(() => import("./pages/user/Sessions"));

// Essential Admin Modules
import Listings from "./pages/admin/Listings";
import ReviewModeration from "./pages/admin/ReviewModeration";
import QuestionModeration from "./pages/admin/QuestionModeration";
const RoleManager = lazy(() => import("./pages/admin/RoleManager"));
const FraudDashboard = lazy(() => import("./pages/admin/FraudDashboard"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const BroadcastManager = lazy(() => import("./pages/admin/BroadcastManager"));
const OSMDiscovery = lazy(() => import("./pages/admin/OSMDiscovery"));
const PhotoModeration = lazy(() => import("./pages/admin/PhotoModeration"));

const SubscriptionsAdmin = lazy(() => import("./pages/admin/SubscriptionsAdmin"));
const CreateListing = lazy(() => import("./pages/admin/CreateListing"));
const CMSDashboard = lazy(() => import("./pages/admin/CMSDashboard"));
const ArticleList = lazy(() => import("./pages/admin/ArticleList"));
const ArticleEditor = lazy(() => import("./pages/admin/ArticleEditor"));
const PageList = lazy(() => import("./pages/admin/PageList"));
const PageEditor = lazy(() => import("./pages/admin/PageEditor"));
const FAQManager = lazy(() => import("./pages/admin/FAQManager"));
const BannerManager = lazy(() => import("./pages/admin/BannerManager"));
const SEOContentManager = lazy(() => import("./pages/admin/SEOContentManager"));
const MediaLibrary = lazy(() => import("./pages/admin/MediaLibrary"));
const AdminUserManager = lazy(() => import("./pages/admin/AdminUserManager"));
const EditCompany = lazy(() => import("./pages/admin/EditCompany"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const ComponentGallery = lazy(() => import("./pages/ComponentGallery"));

// Revenue & Finance Modules
const RevenueDashboard = lazy(() => import("./pages/admin/RevenueDashboard"));
const TransactionHistory = lazy(() => import("./pages/admin/TransactionHistory"));
const RefundQueue = lazy(() => import("./pages/admin/RefundQueue"));
const InvoiceManager = lazy(() => import("./pages/admin/InvoiceManager"));
const GSTReport = lazy(() => import("./pages/admin/GSTReport"));
const FailedPayments = lazy(() => import("./pages/admin/FailedPayments"));
const PayoutTracker = lazy(() => import("./pages/admin/PayoutTracker"));

// Advertisement Manager
const AdSlotConfig = lazy(() => import("./pages/admin/AdSlotConfig"));
const AdManager = lazy(() => import("./pages/admin/AdManager"));
const AdAnalytics = lazy(() => import("./pages/admin/AdAnalytics"));

// Auth
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ConfigProvider } from './context/ConfigContext';
import { Toaster } from 'react-hot-toast';
import FcmTokenHandler from './components/auth/FcmTokenHandler';
const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const OTPScreen = lazy(() => import("./pages/auth/OTPScreen"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
import ProtectedRoute from './components/auth/ProtectedRoute';

// Shown while a lazy route chunk is in flight.
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading…</p>
      </div>
    </div>
  );
}

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
          {/* Admin, merchant, brand, profile and auth routes are lazy so a public
              visitor never downloads them. Suspense catches the load gap. */}
          <Suspense fallback={<RouteLoading />}>
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
            <Route path="/advertise" element={<Advertise />} />
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
          </Suspense>
        </Router>
        </AuthProvider>
      </ThemeProvider>
    </ConfigProvider>
  );
}
