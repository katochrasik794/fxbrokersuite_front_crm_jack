import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import authService from '../services/auth.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ForgotPassword() {
  const [currentStep, setCurrentStep] = useState(1) // 1 = email, 2 = OTP, 3 = new password
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [verifying, setVerifying] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetting, setResetting] = useState(false)
  const otpInputRefs = useRef([])
  const navigate = useNavigate()

  // Handle email submit - send OTP
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const result = await authService.forgotPassword(email)
      if (result.success) {
        setCurrentStep(2)
        // Initialize OTP input refs
        otpInputRefs.current = Array(6).fill(null).map(() => null)
        // Focus first input after a short delay
        setTimeout(() => {
          if (otpInputRefs.current[0]) {
            otpInputRefs.current[0].focus()
          }
        }, 100)
      } else {
        setError(result.message || 'Failed to send OTP. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) {
      return
    }

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      if (otpInputRefs.current[index + 1]) {
        otpInputRefs.current[index + 1].focus()
      }
    }
  }

  // Handle OTP backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      if (otpInputRefs.current[index - 1]) {
        otpInputRefs.current[index - 1].focus()
      }
    }
  }

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('')
      setOtp(newOtp)
      if (otpInputRefs.current[5]) {
        otpInputRefs.current[5].focus()
      }
    }
  }

  // Verify OTP
  const handleVerifyOtp = async () => {
    const otpString = otp.join('')
    
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP')
      return
    }

    setVerifying(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-password-reset-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otpString
        })
      })

      const result = await response.json()

      if (result.success) {
        setCurrentStep(3)
      } else {
        setError(result.message || 'Invalid OTP. Please try again.')
        setOtp(['', '', '', '', '', ''])
        if (otpInputRefs.current[0]) {
          otpInputRefs.current[0].focus()
        }
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.')
      setOtp(['', '', '', '', '', ''])
      if (otpInputRefs.current[0]) {
        otpInputRefs.current[0].focus()
      }
    } finally {
      setVerifying(false)
    }
  }

  // Reset password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setResetting(true)

    try {
      const otpString = otp.join('')
      const response = await fetch(`${API_BASE_URL}/auth/reset-password-with-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otpString,
          password: password
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage('Password reset successfully! Redirecting to login...')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setError(result.message || 'Failed to reset password. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Header with Logo */}
        <div className="w-full flex flex-col items-center mb-6">
          {/* Logo - Centered */}
          <div className="mb-4">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-14 w-auto mx-auto"
              style={{ filter: 'none' }}
            />
          </div>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-lg">
          {/* Step 1: Email Input */}
          {currentStep === 1 && (
            <>
              {/* Title */}
              <h1 className="text-2xl font-bold text-dark-base text-center mb-2 font-heading">
                Forgot Password?
              </h1>

              {/* Description */}
              <p className="text-sm text-dark-base/60 text-center mb-6 font-sans">
                Enter your email address and we'll send you an OTP to reset your password.
              </p>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-sans">
                    {error}
                  </p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3 w-full">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-normal text-dark-base/70 mb-2 font-sans">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-sans text-sm transition-colors disabled:bg-gray-100"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-dark-base border border-brand-500 py-2.5 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed font-sans text-sm"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            </>
          )}

          {/* Step 2: OTP Verification */}
          {currentStep === 2 && (
            <>
              <div className="text-center mb-6">
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-dark-base mb-3 font-sans">Verify Your Email</h2>
                <p className="text-dark-base/70 text-sm mb-2 font-sans">
                  OTP has been sent on your <strong className="font-bold text-dark-base">{email}</strong>
                </p>
                <p className="text-dark-base/60 text-xs font-sans">
                  Please verify to reset your password
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-sans">
                    {error}
                  </p>
                </div>
              )}

              {/* OTP Input Boxes */}
              <div className="flex justify-center gap-3 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-sans"
                    style={{
                      fontFamily: 'Courier New, monospace',
                      fontSize: '24px',
                      letterSpacing: '0',
                    }}
                  />
                ))}
              </div>

              {/* Verify Button */}
              <button
                onClick={handleVerifyOtp}
                disabled={verifying || otp.join('').length !== 6}
                className="w-full bg-brand-500 hover:bg-brand-600 text-dark-base border border-brand-500 py-3 rounded-lg transition-colors font-semibold uppercase disabled:opacity-50 disabled:cursor-not-allowed font-sans text-sm mb-4"
              >
                {verifying ? 'Verifying...' : 'VERIFY OTP'}
              </button>

              {/* Resend OTP */}
              <div className="text-center">
                <button
                  onClick={async () => {
                    setError('')
                    setOtp(['', '', '', '', '', ''])
                    setLoading(true)
                    try {
                      const result = await authService.forgotPassword(email)
                      if (result.success) {
                        if (otpInputRefs.current[0]) {
                          otpInputRefs.current[0].focus()
                        }
                      } else {
                        setError(result.message || 'Failed to resend OTP')
                      }
                    } catch (err) {
                      setError('Failed to resend OTP. Please try again.')
                    } finally {
                      setLoading(false)
                    }
                  }}
                  disabled={loading}
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium font-sans disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>
            </>
          )}

          {/* Step 3: New Password */}
          {currentStep === 3 && (
            <>
              {/* Title */}
              <h1 className="text-2xl font-bold text-dark-base text-center mb-2 font-heading">
                Reset Password
              </h1>

              {/* Description */}
              <p className="text-sm text-dark-base/60 text-center mb-6 font-sans">
                Enter your new password below.
              </p>

              {/* Success Message */}
              {message && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-sans">
                    {message}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-sans">
                    {error}
                  </p>
                </div>
              )}

              {/* Form */}
              {!message && (
                <form onSubmit={handleResetPassword} className="space-y-3 w-full">
                  {/* New Password Field */}
                  <div>
                    <label className="block text-sm font-normal text-dark-base/70 mb-2 font-sans">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={resetting}
                        placeholder="Enter new password"
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 pr-10 disabled:bg-gray-100 font-sans text-sm transition-colors"
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

                  {/* Confirm Password Field */}
                  <div>
                    <label className="block text-sm font-normal text-dark-base/70 mb-2 font-sans">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={resetting}
                        placeholder="Confirm new password"
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 pr-10 disabled:bg-gray-100 font-sans text-sm transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
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

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={resetting}
                    className="w-full bg-brand-500 hover:bg-brand-600 text-dark-base border border-brand-500 py-2.5 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed font-sans text-sm"
                  >
                    {resetting ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              )}
            </>
          )}

          {/* Back to Login */}
          <div className="text-center mt-6">
            <Link 
              to="/login" 
              className="text-sm text-brand-700 hover:text-brand-800 font-sans"
            >
              Back to Login
            </Link>
          </div>
        </div>

        {/* Footer - Wider than form */}
        <div className="w-full max-w-4xl mt-8 px-4">
          <div className="border-t border-gray-200 pt-6">
            <div className="text-xs text-dark-base/50 space-y-2 font-sans">
              <p className="font-semibold mb-2">Risk Statement:</p>
              <p>
                A trading amount in derivatives may mean Trader may lose an amount even greater than their original trading amount. Anyone wishing to Trade in any of the products mentioned in www.solitaireprime.com should seek their own financial or professional advice. Trading of securities, forex, stock market, commodities, options and futures may not be suitable for everyone and involves the risk of losing part or all of your money. Trading in the financial markets has large potential rewards, but also large potential risk. You must be aware of the risks and be willing to accept them in order to Trade in the markets. Don't trade with money which you can't afford to lose. Forex Trading are not allowed in some countries, before trading your money, make sure whether your country is allowing this or not. You are strongly advised to obtain independent financial, legal and tax advice before proceeding with any currency or spot metals trade. Nothing in this site should be read or construed as constituting advice on the part of Solitaire Prime Limited. or any of its affiliates, directors, officers or employees.
              </p>
              <p className="font-semibold mt-3 mb-2">Restricted Regions:</p>
              <p>
                Solitaire Prime Limited. does not provide services for citizens/residents of the United States, Cuba, Iraq, Myanmar, North Korea, Sudan. The services of Solitaire Prime Limited. are not intended for distribution to, or use by, any person in any country or jurisdiction where such distribution or use would be contrary to local law or regulation.
              </p>
              <p className="mt-3">
                Solitaire Prime Limited. Registration Number: 2025-00567. Registered Address: Ground Floor, The Sotheby Building, Rodney Village, Rodney Bay, Gros-Islet, Saint Lucia. Our dedicated team of experts is always ready to assist you with any questions or concerns you may have. Whether you need support or have inquiries, we're just a message away. Email: support@solitaireprime.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
