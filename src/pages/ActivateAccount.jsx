import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import authService from '../services/auth.js'
import AuthLoader from '../components/AuthLoader.jsx'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ActivateAccount() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [currentStep, setCurrentStep] = useState(1) // 1 = loading/sending OTP, 2 = OTP verification
  const [loading, setLoading] = useState(true)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [verifying, setVerifying] = useState(false)
  const otpInputRefs = useRef([])

  useEffect(() => {
    if (!token) {
      setError('Invalid activation link. Please try logging in again to get a new activation link.')
      setLoading(false)
      return
    }

    // Send OTP when page loads
    sendActivationOTP()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const sendActivationOTP = async () => {
    if (!token) return

    setSendingOtp(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/auth/activate-account/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (result.success) {
        setEmail(result.email)
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
      setSendingOtp(false)
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

  // Verify OTP and activate account
  const handleVerifyOtp = async () => {
    const otpString = otp.join('')
    
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP')
      return
    }

    if (!token) {
      setError('Invalid activation token')
      return
    }

    setVerifying(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-activation-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otpString,
          token: token
        })
      })

      const result = await response.json()

      if (result.success) {
        // Store token and user data
        if (result.data.token) {
          authService.setToken(result.data.token)
        }
        if (result.data.user) {
          authService.setUserData(result.data.user)
        }
        // Redirect to dashboard
        navigate('/user/dashboard')
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

  if (loading || sendingOtp) {
    const loaderMessage = sendingOtp ? "Sending OTP..." : "Loading..."
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <AuthLoader message={loaderMessage} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
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
          {/* Step 1: Loading/Sending OTP */}
          {currentStep === 1 && !loading && !sendingOtp && (
            <>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-sans mb-3">
                    {error}
                  </p>
                  <Link
                    to="/login"
                    className="text-sm text-blue-700 hover:text-brand-700 font-medium font-sans"
                  >
                    Go to Login
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Step 2: OTP Verification */}
          {currentStep === 2 && (
            <>
              <div className="text-center mb-6">
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-dark-base mb-3 font-sans">Activate Your Account</h2>
                <p className="text-dark-base/70 text-sm mb-2 font-sans">
                  OTP has been sent on your <strong className="font-bold text-dark-base">{email}</strong>
                </p>
                <p className="text-dark-base/60 text-xs font-sans">
                  Please verify to activate your account
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
                    className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all font-sans"
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-dark-base border border-blue-600 py-3 rounded-lg transition-colors font-semibold uppercase disabled:opacity-50 disabled:cursor-not-allowed font-sans text-sm mb-4"
              >
                {verifying ? 'Verifying...' : 'VERIFY & ACTIVATE'}
              </button>

              {/* Resend OTP */}
              <div className="text-center">
                <button
                  onClick={sendActivationOTP}
                  disabled={sendingOtp}
                  className="text-sm text-blue-700 hover:text-brand-700 font-medium font-sans disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>
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
      </div>
    </div>
  )
}

export default ActivateAccount

