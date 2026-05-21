import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import NewsPage from './pages/NewsPage'
import NewsDetailPage from './pages/NewsDetailPage'
import AboutPage from './pages/AboutPage'
import CartPage from './pages/CartPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StaffDashboard from './pages/staff/StaffDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import AccountPage from './pages/AccountPage'
import EcomNavbar from './components/layout/EcomNavbar'
import EcomFooter from './components/layout/EcomFooter'
import ChatWidget from './components/chat/ChatWidget'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, RoleProtectedRoute } from './components/auth/ProtectedRoute'
import { Toaster } from 'react-hot-toast'

function AppContent() {
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/staff') || location.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {!isDashboard && <EcomNavbar />}
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:slug" element={<NewsDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Route>

          {/* Staff Routes */}
          <Route element={<RoleProtectedRoute roles={['STAFF', 'ADMIN']} />}>
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<RoleProtectedRoute roles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </main>
      {!isDashboard && <EcomFooter />}
      {!isDashboard && <ChatWidget />}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
