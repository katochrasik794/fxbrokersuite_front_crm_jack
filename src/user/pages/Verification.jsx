import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import snsWebSdk from '@sumsub/websdk'
import authService from '../../services/auth.js'
import AuthLoader from '../../components/AuthLoader.jsx'
import Toast from '../../components/Toast.jsx'
import PageHeader from '../components/PageHeader.jsx'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fxbrokersuite-back-crm-jack.onrender.com/api';

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
            logoUrl: `${import.meta.env.VITE_FRONTEND_URL || 'https://portal.fxbrokersuite.com'}/logo.png`
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
      <div className="space-y-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-2xl mb-4">
                <svg className="w-10 h-10 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Under Review
              </h2>
              <p className="text-gray-500">
                Your verification documents are being reviewed. We'll notify you once the review is complete.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 inline-block">
              <p className="text-sm text-blue-800 font-medium">
                Status: Pending Review
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {loading && <AuthLoader message="Initializing verification..." />}
      {submitting && <AuthLoader message="Submitting profile..." />}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          icon={ShieldCheck}
          title="KYC Verification"
          subtitle="Complete your identity verification to enable withdrawals and access all features."
        />

        {/* Progress Indicator */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center w-full max-w-lg">
              {/* Step 1 */}
              <div className="flex flex-col items-center relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  currentStep >= 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-gray-100 text-gray-400'
                }`}>
                  {currentStep > 1 ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="font-bold">1</span>
                  )}
                </div>
                <span className={`mt-2 text-sm font-medium ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>Profile</span>
              </div>

              {/* Connector */}
              <div className="flex-1 h-1 mx-4 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500 ease-out" 
                  style={{ width: currentStep >= 2 ? '100%' : '0%' }}
                ></div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  currentStep >= 2 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-gray-100 text-gray-400'
                }`}>
                  <span className="font-bold">2</span>
                </div>
                <span className={`mt-2 text-sm font-medium ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>Identity</span>
              </div>
            </div>
          </div>
        </div>

        {/* Instruction */}
        <div className="bg-blue-50/50 backdrop-blur-sm border border-blue-100 rounded-2xl p-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 mt-1">
              <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-blue-800 font-medium leading-relaxed">
                Complete the profile verification to remove all limitations on depositing and trading.
                Please ensure all information provided is accurate and matches your identification documents.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm text-red-600 p-4 rounded-2xl text-sm border border-red-100 shadow-sm flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Content Area */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          {/* Step 1: Profile Form */}
          {currentStep === 1 && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">Personal Profile</h3>
              <form onSubmit={handleProfileSubmit} className="space-y-8">
                
                {/* Trading Experience */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Trading Experience
                  </h2>
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <p className="text-sm text-gray-600 mb-4 font-medium">
                      Have you traded CFDs or Forex before?
                    </p>
                    <div className="flex gap-6">
                      <label className="flex items-center cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="radio"
                            name="hasTradingExperience"
                            value="yes"
                            checked={formData.hasTradingExperience === 'yes'}
                            onChange={handleFormChange}
                            className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-full checked:border-blue-600 checked:border-[5px] transition-all"
                          />
                        </div>
                        <span className="ml-3 text-gray-700 group-hover:text-gray-900 font-medium">Yes</span>
                      </label>
                      <label className="flex items-center cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="radio"
                            name="hasTradingExperience"
                            value="no"
                            checked={formData.hasTradingExperience === 'no'}
                            onChange={handleFormChange}
                            className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-full checked:border-blue-600 checked:border-[5px] transition-all"
                          />
                        </div>
                        <span className="ml-3 text-gray-700 group-hover:text-gray-900 font-medium">No</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Employment and Financial Background */}
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Employment and Financial Background
                  </h2>

                  {/* Employment Status */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Employment Status
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {['Employed', 'Self employed', 'Retired', 'Unemployed', 'Student'].map((status) => (
                        <label key={status} className={`
                          flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-200
                          ${formData.employmentStatus === status.toLowerCase().replace(' ', '_') 
                            ? 'bg-blue-50 border-blue-200 shadow-sm' 
                            : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                          }
                        `}>
                          <input
                            type="radio"
                            name="employmentStatus"
                            value={status.toLowerCase().replace(' ', '_')}
                            checked={formData.employmentStatus === status.toLowerCase().replace(' ', '_')}
                            onChange={handleFormChange}
                            className="hidden"
                          />
                          <span className={`text-sm font-medium ${
                            formData.employmentStatus === status.toLowerCase().replace(' ', '_') ? 'text-blue-700' : 'text-gray-700'
                          }`}>{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Annual Income */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Annual Income
                    </label>
                    <div className="relative">
                      <select
                        name="annualIncome"
                        value={formData.annualIncome}
                        onChange={handleFormChange}
                        className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
                      >
                        <option value="">Select annual income</option>
                        <option value="<25k">Less than $25,000</option>
                        <option value="25k-50k">$25,000 - $50,000</option>
                        <option value="50k-100k">$50,000 - $100,000</option>
                        <option value="100k-500k">$100,000 - $500,000</option>
                        <option value=">500k">More than $500,000</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Total Net Worth */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Total Net Worth (approx.)
                    </label>
                    <div className="relative">
                      <select
                        name="totalNetWorth"
                        value={formData.totalNetWorth}
                        onChange={handleFormChange}
                        className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
                      >
                        <option value="">Select net worth</option>
                        <option value="<25k">Less than $25,000</option>
                        <option value="25k-50k">$25,000 - $50,000</option>
                        <option value="50k-100k">$50,000 - $100,000</option>
                        <option value="100k-500k">$100,000 - $500,000</option>
                        <option value=">500k">More than $500,000</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Source of Wealth */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Source of Wealth
                    </label>
                    <div className="relative">
                      <select
                        name="sourceOfWealth"
                        value={formData.sourceOfWealth}
                        onChange={handleFormChange}
                        className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
                      >
                        <option value="">Select source of wealth</option>
                        <option value="employment">Employment / Salary</option>
                        <option value="business">Business / Self-employment</option>
                        <option value="investments">Investments / Dividends</option>
                        <option value="inheritance">Inheritance</option>
                        <option value="savings">Savings</option>
                        <option value="other">Other</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/30 transition-all active:transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Continue to Identity Verification'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 2: Sumsub Verification */}
          {currentStep === 2 && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Identity Verification</h3>
                <p className="text-gray-500 text-sm">
                  Please follow the on-screen instructions to verify your identity documents.
                </p>
              </div>
              
              <div 
                ref={containerRef}
                id="sumsub-websdk-container" 
                className="min-h-[600px] w-full bg-gray-50 rounded-xl border border-gray-200"
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Verification
