import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import UserLayout from './user/components/UserLayout'
import { renderUserRoutes } from './user/routes/UserRoutes'
import { renderIBRoutes } from './ib-portal/user/routes/routes'
import IBLayout from './ib-portal/user/components/Layout'
import { renderIBAdminRoutes } from './ib-portal/admin/routes/routes'
import IBAdminLayout from './ib-portal/admin/components/Layout'

// Admin imports
import { AuthProvider } from './admin/contexts/AuthContext'
import Shell from './admin/layouts/Shell'
import ProtectedRoute from './admin/components/ProtectedRoute'
import FeatureGuard from './admin/components/FeatureGuard'
import AdminIndexRedirect from './admin/components/AdminIndexRedirect'
import adminRoutes from './admin/routes/adminRoutes'
import AdminLogin from './admin/pages/Login'

// Auth Pages
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ActivateAccount from './pages/ActivateAccount'
import AdminLoginAs from './pages/AdminLoginAs'
import NotFound from './pages/NotFound'
import UserProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true
    }}>
      <ScrollToTop />
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/activate-account" element={<ActivateAccount />} />
        <Route path="/auth/admin-login-as" element={<AdminLoginAs />} />

        {/* Admin Login Route */}
        <Route path="/admin/login" element={
          <AuthProvider>
            <AdminLogin />
          </AuthProvider>
        } />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/user/dashboard" replace />} />

        {/* User Routes - Protected */}
        <Route path="/user" element={
          <UserProtectedRoute>
            <UserLayout />
          </UserProtectedRoute>
        }>
          {renderUserRoutes()}
        </Route>

        {/* IB Portal Routes - Protected with IB Layout */}
        <Route path="/user/ib" element={
          <UserProtectedRoute>
            <IBLayout />
          </UserProtectedRoute>
        }>
          {renderIBRoutes()}
        </Route>

        {/* Admin Routes - Protected */}
        <Route
          path="/admin"
          element={
            <AuthProvider>
              <ProtectedRoute>
                <Shell />
              </ProtectedRoute>
            </AuthProvider>
          }
        >
          {adminRoutes.map((r) => {
            const fullFeature = (r.path || '').trim();
            return (
              <Route
                key={`ad-${r.path}`}
                path={r.path}
                element={<FeatureGuard feature={fullFeature}>{r.element}</FeatureGuard>}
              />
            );
          })}
          <Route index element={<AdminIndexRedirect />} />
        </Route>

        {/* IB Admin Routes - Protected with IB Admin Layout */}
        <Route
          path="/admin/ib"
          element={
            <AuthProvider>
              <ProtectedRoute>
                <IBAdminLayout />
              </ProtectedRoute>
            </AuthProvider>
          }
        >
          {renderIBAdminRoutes()}
        </Route>

        {/* 404 - Catch all unmatched routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App

