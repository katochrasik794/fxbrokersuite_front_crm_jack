import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import snsWebSdk from '@sumsub/websdk'
import authService from '../../services/auth.js'
import AuthLoader from '../../components/AuthLoader.jsx'
import Toast from '../../components/Toast.jsx'
import PageHeader from '../components/PageHeader.jsx'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Verification() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1) // 1 = profile form, 2 = Sumsub ID verification
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [kycStatus, setKycStatus] = useState(null)
  const [toast, setToast] = useState(null)
  const [sumsubAccessToken, setSumsubAccessToken] = useState(null)
  const [sumsubApplicantId, setSumsubApplicantId] = useState(null)
  const sumsubInstanceRef = useRef(null)
  const containerRef = useRef(null)

  const [formData, setFormData] = useState({
    hasTradingExperience: '',
    employmentStatus: '',
    annualIncome: '',
    totalNetWorth: '',
    sourceOfWealth: ''
  })

  // Check existing KYC status on mount
  useEffect(() => {
    const checkKYCStatus = async () => {
      try {
        const token = authService.getToken()
        if (!token) {
          navigate('/login')
          return
        }

        const statusResponse = await fetch(`${API_BASE_URL}/kyc/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          if (statusData.success && statusData.data) {
            setKycStatus(statusData.data.status)

            // If already approved, redirect to dashboard
            if (statusData.data.status === 'approved') {
              window.location.href = '/user/dashboard';
              return
            }

            // If pending, show pending message
            if (statusData.data.status === 'pending') {
              // Auto-check latest status from SumSub to fix stale "pending" state
              try {
                const refreshResponse = await fetch(`${API_BASE_URL}/kyc/sumsub/status?refresh=true`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (refreshResponse.ok) {
                  const refreshData = await refreshResponse.json();
                  // If now approved, update state and redirect
                  if (refreshData.success && refreshData.data &&
                    (refreshData.data.status === 'approved' || refreshData.data.reviewResult === 'GREEN')) {
                    setKycStatus('approved');
                    window.location.href = '/user/dashboard';
                    return;
                  }
                  // If rejected, update state
                  if (refreshData.data.status === 'rejected' || refreshData.data.reviewResult === 'RED') {
                    setKycStatus('rejected');
                    // Don't return, let it flow to show rejection UI if we handle it, 
                    // or just stay here. The current UI shows "Verification Under Review" for pending.
                    // If rejected, we might want to update kycStatus to 'rejected' so it renders the rejected state (if any)
                    // The current component renders "Verification Under Review" specific message for 'pending'.
                    // For 'rejected', it probably falls through to the main form or error message.
                  }
                }
              } catch (e) {
                console.error('Auto-refresh status failed', e);
              }

              // Check if we have Sumsub applicant ID
              if (statusData.data.sumsub_applicant_id) {
                setSumsubApplicantId(statusData.data.sumsub_applicant_id)
                // Try to get access token
                try {
                  const tokenResponse = await fetch(
                    `${API_BASE_URL}/kyc/sumsub/access-token/${statusData.data.sumsub_applicant_id}`,
                    {
                      headers: {
                        'Authorization': `Bearer ${token}`
                      }
                    }
                  )
                  if (tokenResponse.ok) {
                    const tokenData = await tokenResponse.json()
                    if (tokenData.success) {
                      setSumsubAccessToken(tokenData.data.accessToken)
                      setCurrentStep(2)
                    }
                  }
                } catch (err) {
                  console.error('Error getting access token:', err)
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error checking KYC status:', err)
      }
    }

    checkKYCStatus()
  }, [navigate])

  // Initialize Sumsub WebSDK when access token is available and container is ready
  useEffect(() => {
    if (currentStep === 2 && sumsubAccessToken && containerRef.current && !sumsubInstanceRef.current) {
      launchWebSdk(sumsubAccessToken)
    }
  }, [currentStep, sumsubAccessToken])

  // Poll for status updates when pending
  useEffect(() => {
    let intervalId;
    if (kycStatus === 'pending') {
      intervalId = setInterval(() => {
        checkVerificationStatus();
      }, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [kycStatus]);

  // Get new access token when needed
  const getNewAccessToken = async () => {
    try {
      const token = authService.getToken()
      if (!token || !sumsubApplicantId) {
        throw new Error('No applicant ID available')
      }

      const response = await fetch(
        `${API_BASE_URL}/kyc/sumsub/access-token/${sumsubApplicantId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return data.data.accessToken
        }
      }
      throw new Error('Failed to get new access token')
    } catch (err) {
      console.error('Error getting new access token:', err)
      throw err
    }
  }

  // Launch Sumsub WebSDK
  /**
   * @param accessToken - access token that you generated
   * on the backend with levelName: id-only
   */
  const launchWebSdk = (accessToken) => {
    if (!containerRef.current) {
      console.warn('Sumsub container not ready')
      return
    }

    try {
      // Destroy existing instance if any
      if (sumsubInstanceRef.current) {
        try {
          sumsubInstanceRef.current.destroy()
        } catch (e) {
          console.warn('Error destroying previous Sumsub instance:', e)
        }
        sumsubInstanceRef.current = null
      }

      let snsWebSdkInstance = snsWebSdk
        .init(
          accessToken,
          // token update callback, must return Promise
          () => getNewAccessToken()
        )
        .withConf({
          //language of WebSDK texts and comments (ISO 639-1 format)
          lang: 'en',
          // Configure logo URL
          theme: 'light',
          // Add logo configuration if supported
          // Note: Logo should also be configured in Sumsub Dashboard > Settings > Branding
          uiConf: {
            // Use current logo.png - ensure this matches the logo in public/logo.png
            logoUrl: `${import.meta.env.VITE_FRONTEND_URL || 'https://portal.solitairemarkets.com'}/logo.png`
          }
        })
        .on('onError', (error) => {
          console.log('onError', error)
          setError('Verification error occurred. Please try again.')
          setToast({
            message: 'An error occurred during verification. Please try again.',
            type: 'error'
          })
        })
        .onMessage(async (type, payload) => {
          console.log('onMessage', type, payload)

          // Send callback data to backend to process and store
          try {
            const token = authService.getToken()
            if (token) {
              const callbackResponse = await fetch(`${API_BASE_URL}/kyc/sumsub/callback`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type, payload })
              })

              if (callbackResponse.ok) {
                const callbackData = await callbackResponse.json()
                console.log('Callback processed by backend:', callbackData)

                // Update local status from backend response
                if (callbackData.status) {
                  setKycStatus(callbackData.status)
                }
              } else {
                console.error('Failed to process callback:', await callbackResponse.text())
              }
            }
          } catch (err) {
            console.error('Error sending callback to backend:', err)
            // Continue with local handling even if backend call fails
          }

          // Handle applicant submitted
          if (type === 'idCheck.onApplicantSubmitted') {
            setKycStatus('pending')
            setToast({
              message: 'Verification submitted successfully! Your documents are under review.',
              type: 'success'
            })
            // Check status after a delay
            setTimeout(() => {
              checkVerificationStatus()
            }, 2000)
          }

          // Handle review completed
          if (type === 'idCheck.onReviewCompleted') {
            // Extract review result from different payload structures
            const reviewResult = payload?.reviewResult?.reviewAnswer ||
              payload?.reviewResult ||
              payload?.reviewAnswer

            if (reviewResult === 'GREEN' || reviewResult === 'approved') {
              setKycStatus('approved')
              setToast({
                message: 'Verification approved! Redirecting to dashboard...',
                type: 'success'
              })
              // Redirect after a short delay (backend has already been updated via callback)
              setTimeout(() => {
                window.location.href = '/user/dashboard';
              }, 2000)
            } else if (reviewResult === 'RED' || reviewResult === 'rejected') {
              setKycStatus('rejected')
              const comment = payload?.reviewResult?.reviewComment ||
                payload?.reviewComment ||
                'Please try again.'
              setToast({
                message: `Verification rejected: ${comment}`,
                type: 'error'
              })
            }
          }

          // Handle step completed
          if (type === 'idCheck.onStepCompleted') {
            console.log('Step completed:', payload)
          }
        })
        .build()

      // you are ready to go:
      // just launch the WebSDK by providing the container element for it
      snsWebSdkInstance.launch('#sumsub-websdk-container')
      sumsubInstanceRef.current = snsWebSdkInstance
    } catch (err) {
      console.error('Error initializing Sumsub WebSDK:', err)
      setError('Failed to load verification widget. Please try again.')
      setToast({
        message: 'Failed to load verification widget. Please try again.',
        type: 'error'
      })
    }
  }

  // Check verification status
  const checkVerificationStatus = async () => {
    try {
      const token = authService.getToken()
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/kyc/sumsub/status?refresh=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          // Check if status is approved OR reviewResult is GREEN
          if (data.data.status === 'approved' || data.data.reviewResult === 'GREEN' || data.data.reviewResult === 'approved') {
            setKycStatus('approved')

            // Show toast if not already shown
            setToast({
              message: 'Verification approved! Redirecting to dashboard...',
              type: 'success'
            })

            // Redirect to dashboard with reload to ensure layout updates
            setTimeout(() => {
              window.location.href = '/user/dashboard';
            }, 2000)
          } else if (data.data.reviewResult === 'RED' || data.data.status === 'rejected') {
            setKycStatus('rejected')
          }
        }
      }
    } catch (err) {
      console.error('Error checking verification status:', err)
    }
  }

  // Update KYC status in database
  const updateKYCStatus = async (status) => {
    try {
      const token = authService.getToken()
      if (!token) return

      await fetch(`${API_BASE_URL}/kyc/update-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })
    } catch (err) {
      console.error('Error updating KYC status:', err)
    }
  }

  // Initialize Sumsub when step 2 is reached
  const initializeSumsubForStep2 = async () => {
    try {
      setLoading(true)
      const token = authService.getToken()
      if (!token) {
        navigate('/login')
        return
      }

      // Call backend to initialize Sumsub
      const response = await fetch(`${API_BASE_URL}/kyc/sumsub/init`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok && data.success && data.data) {
        setSumsubAccessToken(data.data.accessToken)
        setSumsubApplicantId(data.data.applicantId)
      } else {
        setError(data.message || 'Failed to initialize verification. Please try again.')
        setToast({
          message: data.message || 'Failed to initialize verification. Please try again.',
          type: 'error'
        })
      }
    } catch (err) {
      console.error('Error initializing Sumsub:', err)
      setError('Failed to initialize verification. Please try again.')
      setToast({
        message: 'Failed to initialize verification. Please try again.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.hasTradingExperience || !formData.employmentStatus ||
      !formData.annualIncome || !formData.totalNetWorth || !formData.sourceOfWealth) {
      setError('Please fill in all fields')
      return
    }

    setSubmitting(true)

    try {
      const token = authService.getToken()
      if (!token) {
        navigate('/login')
        return
      }

      const response = await fetch(`${API_BASE_URL}/kyc/profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hasTradingExperience: formData.hasTradingExperience,
          employmentStatus: formData.employmentStatus,
          annualIncome: formData.annualIncome,
          totalNetWorth: formData.totalNetWorth,
          sourceOfWealth: formData.sourceOfWealth
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit profile')
      }

      if (data.success) {
        // Profile saved successfully, move to step 2
        setCurrentStep(2)
        setToast({
          message: 'Profile submitted successfully! Please verify your identity.',
          type: 'success'
        })
        // Initialize Sumsub when moving to step 2
        initializeSumsubForStep2()
      }
    } catch (err) {
      setError(err.message || 'Failed to submit profile. Please try again.')
      setToast({
        message: err.message || 'Failed to submit profile. Please try again.',
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // If already pending or approved, show status
  if (kycStatus === 'pending' && currentStep === 1) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-100 rounded-full mb-4">
                <svg className="w-10 h-10 text-brand-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Roboto, sans-serif' }}>
                Verification Under Review
              </h2>
              <p className="text-gray-600" style={{ fontFamily: 'Roboto, sans-serif' }}>
                Your verification documents are being reviewed. We'll notify you once the review is complete.
              </p>
            </div>
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
              <p className="text-sm text-brand-800" style={{ fontFamily: 'Roboto, sans-serif' }}>
                Status: <span className="font-semibold">Pending</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {loading && <AuthLoader message="Initializing verification..." />}
      {submitting && <AuthLoader message="Submitting profile..." />}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <PageHeader
          icon={ShieldCheck}
          title="KYC Verification"
          subtitle="Complete your identity verification to enable withdrawals and access all features."
        />

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-[#00A896]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-[#00A896] text-white' : 'bg-gray-200'}`}>
                {currentStep > 1 ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>1</span>
                )}
              </div>
              <span className="font-medium" style={{ fontFamily: 'Roboto, sans-serif' }}>Profile</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200">
              <div className={`h-full ${currentStep >= 2 ? 'bg-[#00A896]' : 'bg-gray-200'}`} style={{ width: currentStep >= 2 ? '100%' : '0%' }}></div>
            </div>
            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-[#00A896]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-[#00A896] text-white' : 'bg-gray-200'}`}>
                <span>2</span>
              </div>
              <span className="font-medium" style={{ fontFamily: 'Roboto, sans-serif' }}>Verify Identity</span>
            </div>
          </div>
        </div>

        {/* Instruction */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800" style={{ fontFamily: 'Roboto, sans-serif' }}>
            Complete the profile verification to remove all limitations on depositing and trading.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800" style={{ fontFamily: 'Roboto, sans-serif' }}>
              {error}
            </p>
          </div>
        )}

        {/* Step 1: Profile Form */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Roboto, sans-serif' }}>
              Profile Verification
            </h1>

            <form onSubmit={handleProfileSubmit} className="space-y-8">
              {/* Trading Experience */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  Trading Experience
                </h2>
                <div>
                  <p className="text-sm text-gray-700 mb-3" style={{ fontFamily: 'Roboto, sans-serif' }}>
                    Have you traded CFDs or Forex before?
                  </p>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="hasTradingExperience"
                        value="yes"
                        checked={formData.hasTradingExperience === 'yes'}
                        onChange={handleFormChange}
                        className="w-4 h-4 text-[#00A896] border-gray-300 focus:ring-[#00A896]"
                      />
                      <span className="ml-2 text-gray-700" style={{ fontFamily: 'Roboto, sans-serif' }}>Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="hasTradingExperience"
                        value="no"
                        checked={formData.hasTradingExperience === 'no'}
                        onChange={handleFormChange}
                        className="w-4 h-4 text-[#00A896] border-gray-300 focus:ring-[#00A896]"
                      />
                      <span className="ml-2 text-gray-700" style={{ fontFamily: 'Roboto, sans-serif' }}>No</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Employment and Financial Background */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  Employment and financial background
                </h2>

                <div className="space-y-6">
                  {/* Employment Status */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Roboto, sans-serif' }}>
                      Employment Status
                    </h3>
                    <div className="space-y-2">
                      {['Employed', 'Self employed', 'Retired', 'Unemployed', 'Student'].map((status) => (
                        <label key={status} className="flex items-center">
                          <input
                            type="radio"
                            name="employmentStatus"
                            value={status.toLowerCase().replace(' ', '_')}
                            checked={formData.employmentStatus === status.toLowerCase().replace(' ', '_')}
                            onChange={handleFormChange}
                            className="w-4 h-4 text-[#00A896] border-gray-300 focus:ring-[#00A896]"
                          />
                          <span className="ml-2 text-gray-700" style={{ fontFamily: 'Roboto, sans-serif' }}>{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Annual Income */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Roboto, sans-serif' }}>
                      Annual Income
                    </h3>
                    <div className="space-y-2">
                      {[
                        'Below $10,000',
                        '$10,000 - $50,000',
                        '$50,000 - $250,000',
                        '$250,000 - $500,000',
                        '$500,000 - $1,000,000',
                        'Above $1,000,000'
                      ].map((income) => (
                        <label key={income} className="flex items-center">
                          <input
                            type="radio"
                            name="annualIncome"
                            value={income}
                            checked={formData.annualIncome === income}
                            onChange={handleFormChange}
                            className="w-4 h-4 text-[#00A896] border-gray-300 focus:ring-[#00A896]"
                          />
                          <span className="ml-2 text-gray-700" style={{ fontFamily: 'Roboto, sans-serif' }}>{income}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Total Net Worth */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Roboto, sans-serif' }}>
                      Your Total Net Worth (USD)
                    </h3>
                    <div className="space-y-2">
                      {[
                        'Below $500',
                        '$500 - $5,000',
                        '$5,000 - $50,000',
                        '$50,000 - $250,000',
                        '$250,000 - $500,000',
                        '$500,000 - $1,000,000',
                        'Above $1,000,000'
                      ].map((worth) => (
                        <label key={worth} className="flex items-center">
                          <input
                            type="radio"
                            name="totalNetWorth"
                            value={worth}
                            checked={formData.totalNetWorth === worth}
                            onChange={handleFormChange}
                            className="w-4 h-4 text-[#00A896] border-gray-300 focus:ring-[#00A896]"
                          />
                          <span className="ml-2 text-gray-700" style={{ fontFamily: 'Roboto, sans-serif' }}>{worth}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Source of Wealth */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Roboto, sans-serif' }}>
                      Source of wealth
                    </h3>
                    <div className="space-y-2">
                      {[
                        'Employment income',
                        'Savings, investments, or pension',
                        'Inheritance',
                        'Third party',
                        'Grant, gift or loan or other'
                      ].map((source) => (
                        <label key={source} className="flex items-center">
                          <input
                            type="radio"
                            name="sourceOfWealth"
                            value={source}
                            checked={formData.sourceOfWealth === source}
                            onChange={handleFormChange}
                            className="w-4 h-4 text-[#00A896] border-gray-300 focus:ring-[#00A896]"
                          />
                          <span className="ml-2 text-gray-700" style={{ fontFamily: 'Roboto, sans-serif' }}>{source}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-500 hover:bg-brand-600 text-dark-base py-3 rounded-lg transition-colors font-semibold uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}
              >
                {submitting ? 'SUBMITTING...' : 'CONTINUE'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Sumsub ID Verification */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Logo at the top */}
            <div className="flex justify-center mb-6">
              <img
                src={`${import.meta.env.VITE_FRONTEND_URL || 'https://portal.solitairemarkets.com'}/logo.png`}
                alt="Solitaire Markets"
                className="h-16 w-auto"
                style={{ background: 'transparent' }}
                onError={(e) => {
                  // Fallback to local logo if external fails
                  e.target.src = '/logo.png';
                }}
              />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Roboto, sans-serif' }}>
              We need to verify your identity.
            </h1>
            <p className="text-gray-600 mb-6" style={{ fontFamily: 'Roboto, sans-serif' }}>
              To confirm your identity, you will need to take picture, scan or upload one of the following documents:
            </p>

            {/* Sumsub WebSDK Container */}
            <div
              ref={containerRef}
              id="sumsub-websdk-container"
              className="min-h-[600px]"
            ></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Verification
