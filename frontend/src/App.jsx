import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import NewsPage from './pages/NewsPage'
import NewsDetailPage from './pages/NewsDetailPage'
import AboutPage from './pages/AboutPage'
import CartPage from './pages/CartPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StaffDashboard from './pages/staff/StaffDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import ShipperDashboard from './pages/shipper/ShipperDashboard'
import AccountPage from './pages/AccountPage'
import CheckoutPage from './pages/CheckoutPage'
import PaymentPage from './pages/PaymentPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import OrderTrackingPage from './pages/OrderTrackingPage'
import MyOrdersPage from './pages/MyOrdersPage'
import EcomNavbar from './components/layout/EcomNavbar'
import EcomFooter from './components/layout/EcomFooter'
import ChatWidget from './components/chat/ChatWidget'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ProtectedRoute, RoleProtectedRoute } from './components/auth/ProtectedRoute'
import { Toaster } from 'react-hot-toast'
import ScrollToTop from './components/common/ScrollToTop'
import ScrollToTopButton from './components/common/ScrollToTopButton'

// Pages with a full-width hero that goes behind the transparent nav
const HERO_ROUTES = ['/', '/products', '/news', '/about'];

function AppContent() {
  const location = useLocation()
  const { user } = useAuth()
  const isDashboard = location.pathname.startsWith('/staff') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/shipper')

  // Non-hero pages need a spacer div so content isn't hidden behind fixed header
  const isHeroRoute =
    HERO_ROUTES.includes(location.pathname) ||
    location.pathname.startsWith('/products/') ||
    location.pathname.startsWith('/news/')
  const needsSpacer = !isDashboard && !isHeroRoute

  return (
    <CartProvider user={user}>
      <div className="min-h-screen bg-white flex flex-col font-sans">
        {!isDashboard && <EcomNavbar />}
        {/* Spacer compensates for fixed header on pages without a hero section */}
        {needsSpacer && <div className="h-20" aria-hidden="true" />}
        <main className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:slug" element={<ProductDetailPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/:slug" element={<NewsDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/payment/:orderCode" element={<PaymentPage />} />
              <Route path="/order-success/:orderCode" element={<OrderSuccessPage />} />
              <Route path="/my-orders" element={<MyOrdersPage />} />
              <Route path="/orders/:id" element={<OrderTrackingPage />} />
              <Route path="/account" element={<AccountPage />} />
            </Route>

            {/* Staff Routes */}
            <Route element={<RoleProtectedRoute roles={['STAFF', 'ADMIN']} />}>
              <Route path="/staff/dashboard" element={<StaffDashboard />} />
            </Route>

            {/* Shipper Routes */}
            <Route element={<RoleProtectedRoute roles={['SHIPPER', 'ADMIN']} />}>
              <Route path="/shipper/dashboard" element={<ShipperDashboard />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<RoleProtectedRoute roles={['ADMIN']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>
          </Routes>
        </main>
        {!isDashboard && <EcomFooter />}
        {!isDashboard && <ChatWidget />}
        {!isDashboard && <ScrollToTopButton />}
      </div>
    </CartProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <BrowserRouter>
        <ScrollToTop />
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
