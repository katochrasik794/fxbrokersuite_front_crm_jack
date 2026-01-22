import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import authService from '../services/auth.js'
import AuthLoader from '../components/AuthLoader.jsx'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [activationLink, setActivationLink] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const isRegisterPage = location.pathname === '/register' || location.pathname.startsWith('/register')
  
  // Get redirect parameter from URL
  const searchParams = new URLSearchParams(location.search)
  const redirectTo = searchParams.get('redirect') || '/user/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      const result = await authService.login(email, password)

      // Check if account requires activation
      if (result && result.requiresActivation) {
        setError('') // Clear any previous errors
        // Show message with activation link
        setMessage(result.message)
        setActivationLink(result.activationLink)
      } else if (result && result.success) {
        // Navigate to redirect URL or default to dashboard
        navigate(redirectTo || '/user/dashboard')
      } else {
        setError(result?.message || 'Login failed. Please check your credentials.')
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Loading Animation */}
      {loading && <AuthLoader message="Logging in..." />}
      
      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Header with Logo and Navigation Tabs */}
        <div className="w-full flex flex-col items-center mb-6">
          {/* Logo - Centered */}
          <div className="mb-4">
            <img
              src="/logo.png"
              alt="fxbrokersuite Markets"
              className="h-14 w-auto mx-auto"
              style={{ filter: 'none' }}
            />
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-6">
            <Link
              to="/login"
              className={`font-sans text-base transition-colors ${
                !isRegisterPage
                  ? 'text-dark-base font-semibold border-b-2 border-dark-base pb-1'
                  : 'text-dark-base/50 hover:text-dark-base'
              }`}
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className={`font-sans text-base transition-colors ${
                isRegisterPage
                  ? 'text-dark-base font-semibold border-b-2 border-dark-base pb-1'
                  : 'text-dark-base/50 hover:text-dark-base'
              }`}
            >
              Create an account
            </Link>
          </div>
        </div>
        {/* Form Container */}
        <div className="w-full max-w-lg">
          {/* Activation Message with Link */}
          {message && activationLink && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-lg">
              <p className="text-sm text-amber-800 mb-3 font-sans">
                {message}
              </p>
              <a
                href={activationLink}
                className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors font-sans"
              >
                Click Here to Activate
              </a>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg">
              <p className="text-sm text-red-800" style={{ fontFamily: 'Roboto, sans-serif' }}>
                {error}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 w-full">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-normal text-dark-base/70 mb-2 font-sans">
                Your email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter your email"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-sans text-sm transition-colors disabled:bg-gray-100"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-normal text-dark-base/70 mb-2 font-sans">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Enter password"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 disabled:bg-gray-100 font-sans text-sm transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-dark-base/70 font-sans">
                  Remember me
                </span>
              </label>
              <Link to="/forgot-password" className="text-sm text-blue-700 hover:text-blue-800 font-sans">
                I forgot my password
              </Link>
            </div>

            {/* Continue Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 py-2.5 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed font-sans text-sm"
            >
              {loading ? 'Logging in...' : 'Continue'}
            </button>
          </form>
        </div>

        {/* Footer - Wider than form */}
        <div className="w-full max-w-4xl mt-8 px-4">
          <div className="border-t border-gray-200 pt-6">
            <div className="text-xs text-dark-base/50 space-y-2 font-sans">
              <p className="font-semibold mb-2">Risk Statement:</p>
              <p>
                Trading in financial markets involves a high degree of risk and may not be suitable for all investors. You should carefully consider your investment objectives, level of experience, and risk appetite before deciding to trade. There is a possibility that you could sustain a loss of some or all of your initial investment and therefore you should not invest money that you cannot afford to lose. You should be aware of all the risks associated with trading and seek advice from an independent financial advisor if you have any doubts.
              </p>
              <p className="font-semibold mt-3 mb-2">Restricted Regions:</p>
              <p>
                FxBrokerSuite does not provide services for citizens/residents of the United States, Cuba, Iraq, Myanmar, North Korea, Sudan. The services of FxBrokerSuite are not intended for distribution to, or use by, any person in any country or jurisdiction where such distribution or use would be contrary to local law or regulation.
              </p>
              <p className="mt-3">
                FxBrokerSuite. Registration Number: 12345678. Registered Address: 123 Dummy Street, Dummy City, Country. Our dedicated team of experts is always ready to assist you with any questions or concerns you may have. Whether you need support or have inquiries, we're just a message away. Email: support@fxbrokersuite.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

