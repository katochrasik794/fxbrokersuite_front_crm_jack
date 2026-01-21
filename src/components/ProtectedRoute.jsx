import { Navigate, useLocation } from 'react-router-dom'
import authService from '../services/auth.js'

function ProtectedRoute({ children }) {
  const location = useLocation()
  const isAuthenticated = authService.isAuthenticated()

  if (!isAuthenticated) {
    // Preserve the intended destination in the redirect URL
    const redirectTo = location.pathname + location.search
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectTo)}`} replace />
  }

  return children
}

export default ProtectedRoute

