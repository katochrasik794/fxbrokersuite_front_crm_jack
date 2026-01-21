import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PlusCircle } from 'lucide-react'
import authService from '../../services/auth.js'
import AuthLoader from '../../components/AuthLoader.jsx'
import Toast from '../../components/Toast.jsx'
import PageHeader from '../components/PageHeader.jsx'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function CreateAccount() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showMasterPassword, setShowMasterPassword] = useState(false)
  const [mt5Groups, setMt5Groups] = useState([])
  const [loadingGroups, setLoadingGroups] = useState(true)

  const [formData, setFormData] = useState({
    platform: 'MT5',
    mt5GroupId: '',
    leverage: 500,
    isCopyAccount: false,
    reasonForAccount: 'Different trading strategy',
    masterPassword: '',
    portalPassword: ''
  })

  const [createdAccount, setCreatedAccount] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState(null)

  const location = useLocation()
  const [mode, setMode] = useState(() => {
    const searchParams = new URLSearchParams(location.search)
    return searchParams.get('mode') === 'demo' ? 'demo' : 'live'
  }) // 'live' | 'demo'

  // Fetch active MT5 groups on component mount
  useEffect(() => {
    const fetchMt5Groups = async () => {
      try {
        const token = authService.getToken()
        if (!token) {
          navigate('/login')
          return
        }

        const response = await fetch(`${API_BASE_URL}/accounts/groups`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (data.success && data.data.length > 0) {
          setMt5Groups(data.data)
        } else {
          setToast({
            message: 'No active MT5 groups available. Please contact support.',
            type: 'error'
          })
        }
      } catch (err) {
        console.error('Error fetching MT5 groups:', err)
        setToast({
          message: 'Failed to load MT5 groups. Please try again.',
          type: 'error'
        })
      } finally {
        setLoadingGroups(false)
      }
    }

    fetchMt5Groups()
  }, [navigate])

  // Filter groups based on mode
  const filteredGroups = mt5Groups.filter(g => {
    // Filter out groups that don't match the selected mode (Live vs Demo)
    // We assume demo groups have "demo" in their name (case insensitive)
    // Check group_name specifically as it contains the full path (e.g., demo\ECN15S)
    const name = (g.group_name || '').toLowerCase()
    const isDemoGroup = name.includes('demo')

    return mode === 'demo' ? isDemoGroup : !isDemoGroup
  })

  // Auto-select first group when mode changes or groups load
  useEffect(() => {
    if (filteredGroups.length > 0) {
      // Check if current selection is still valid in this mode
      const currentValid = filteredGroups.find(g => g.id.toString() === formData.mt5GroupId)
      if (!currentValid) {
        setFormData(prev => ({ ...prev, mt5GroupId: filteredGroups[0].id.toString() }))
        setSelectedGroup(filteredGroups[0])
      }
    } else {
      // No groups for this mode
      setFormData(prev => ({ ...prev, mt5GroupId: '' }))
      setSelectedGroup(null)
    }
  }, [mode, mt5Groups]) // Intentionally not including filteredGroups to avoid loop, dependent on mode/mt5Groups

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let newFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    }

    // If MT5 group changed, update selected group
    if (name === 'mt5GroupId') {
      const group = mt5Groups.find(g => g.id.toString() === value)
      setSelectedGroup(group || null)
      // Also update formData with the group ID as string
      newFormData.mt5GroupId = value
    }

    setFormData(newFormData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = authService.getToken()
      if (!token) {
        navigate('/login')
        return
      }

      // Minimum 3 seconds loading time for beautiful animation
      const [response] = await Promise.all([
        fetch(`${API_BASE_URL}/accounts/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            platform: formData.platform,
            mt5GroupId: parseInt(formData.mt5GroupId),
            leverage: parseInt(formData.leverage),
            isCopyAccount: formData.isCopyAccount,
            reasonForAccount: formData.reasonForAccount,
            masterPassword: formData.masterPassword,
            portalPassword: formData.portalPassword,
            isDemo: mode === 'demo'
          })
        }),
        new Promise(resolve => setTimeout(resolve, 3000))
      ])

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create account')
      }

      if (data.success) {
        setCreatedAccount(data.data)
        setCurrentStep(2)
        setLoading(false)
      }
    } catch (err) {
      setLoading(false)
      setToast({
        message: err.message || 'Failed to create account. Please try again.',
        type: 'error'
      })
    }
  }

  const reasons = [
    'Different trading strategy',
    'Testing new platform',
    'Separate investment goals',
    'Risk management',
    'Other'
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {loading && <AuthLoader message="Creating account..." />}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <PageHeader
          icon={PlusCircle}
          title="Create Trading Account"
          subtitle="Create a new live or demo MT5 trading account with your preferred settings."
        />
        
        {/* Back Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => navigate('/user/platforms')}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        {/* Step 1: Create Account Form */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Roboto, sans-serif' }}>
              Create a new {mode === 'demo' ? 'demo' : 'live'} account
            </h1>

            {/* Account Type Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-lg mb-6 w-fit">
              <button
                type="button"
                onClick={() => setMode('live')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${mode === 'live'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                Live Account
              </button>
              <button
                type="button"
                onClick={() => setMode('demo')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${mode === 'demo'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                Demo Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Trading Group Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  Choose Your Trading Group
                </label>
                <p className="text-xs text-gray-600 mb-4" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  Select the trading group that best suits your trading style. Each group offers different spreads, commissions, and trading conditions.
                </p>
                {loadingGroups ? (
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-2 text-sm text-gray-600" style={{ fontFamily: 'Roboto, sans-serif' }}>Loading groups...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredGroups.length === 0 && (
                      <div className="col-span-full text-center py-4 text-gray-500">
                        No {mode} groups available currently.
                      </div>
                    )}
                    {filteredGroups.map((group) => (
                      <label key={group.id} className="cursor-pointer">
                        <input
                          type="radio"
                          name="mt5GroupId"
                          value={group.id}
                          checked={formData.mt5GroupId === group.id.toString()}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className={`border-2 rounded-lg p-4 transition-all ${formData.mt5GroupId === group.id.toString()
                          ? 'border-brand-500 bg-brand-500 bg-opacity-5'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}>
                          <div className="flex items-center gap-4">
                            {/* MT5 Image on left side */}
                            <img
                              src="/mt_5.png"
                              alt="MetaTrader 5"
                              className="w-28 h-20 object-contain flex-shrink-0"
                            />
                            {/* Group name and details */}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`w-4 h-4 rounded-full ${formData.mt5GroupId === group.id.toString() ? 'bg-brand-500' : 'bg-gray-300'
                                  }`}></div>
                                <span className="font-semibold text-gray-900" style={{ fontFamily: 'Roboto, sans-serif' }}>
                                  {group.dedicated_name || 'Unnamed Group'}
                                </span>
                              </div>
                              <ul className="space-y-1 text-sm text-gray-600 ml-7" style={{ fontFamily: 'Roboto, sans-serif' }}>
                                <li>• Currency: {group.currency}</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Leverage Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  Select Your Leverage
                </label>
                <p className="text-xs text-gray-600 mb-3" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  Leverage allows you to trade with more capital than you have in your account. Higher leverage increases both potential profits and risks.
                </p>
                <select
                  name="leverage"
                  value={formData.leverage}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}
                >
                  <option value="50">1:50</option>
                  <option value="100">1:100</option>
                  <option value="200">1:200</option>
                  <option value="500">1:500</option>
                </select>
              </div>

              {/* Solitaire Markets Copy Account */}
              {/* <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700" style={{ fontFamily: 'Roboto, sans-serif' }}>
                      Solitaire Markets Copy Account
                    </label>
                    <p className="text-xs text-gray-600 mt-1" style={{ fontFamily: 'Roboto, sans-serif' }}>
                      Enable copy trading to automatically replicate trades from successful traders.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="isCopyAccount"
                      checked={formData.isCopyAccount}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-500 peer-focus:ring-opacity-20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                  </label>
                </div>
              </div> */}

              {/* Reason for opening */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  Reason for Opening an Additional Account
                </label>
                <p className="text-xs text-gray-600 mb-3" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  Help us understand your trading needs by selecting the primary reason for opening this account.
                </p>
                <select
                  name="reasonForAccount"
                  value={formData.reasonForAccount}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}
                >
                  {reasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              {/* Master Password (for MT5) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  Master Password (MT5 Login Password)
                </label>
                <p className="text-xs text-gray-600 mb-2" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  This will be your main password to login to MT5. Keep it strong and do not share it with anyone.
                </p>
                <div className="relative">
                  <input
                    type={showMasterPassword ? 'text' : 'password'}
                    name="masterPassword"
                    value={formData.masterPassword}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent pr-10"
                    style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}
                    placeholder="Set your MT5 master password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMasterPassword(!showMasterPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showMasterPassword ? (
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

              {/* Portal Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  Portal Password
                </label>
                <p className="text-xs text-gray-600 mb-2" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  For added security we require you to confirm your Portal password.
                </p>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="portalPassword"
                    value={formData.portalPassword}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent pr-10"
                    style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}
                    placeholder="Enter your portal password"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || loadingGroups || !formData.mt5GroupId}
                className="w-full bg-brand-500 hover:bg-brand-600 text-dark-base py-3 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Account Created Success */}
        {currentStep === 2 && createdAccount && (
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 text-center">
            {/* Success Icon */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#dff8f4] rounded-full mb-4">
                <svg className="w-10 h-10 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Roboto, sans-serif' }}>
                Account Created
              </h2>
              <p className="text-gray-600" style={{ fontFamily: 'Roboto, sans-serif' }}>
                Congratulations, you've successfully created an additional trading account and can now start trading. Check below for your account details.
              </p>
            </div>

            {/* Account Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-4 text-left">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium" style={{ fontFamily: 'Roboto, sans-serif' }}>Trading account:</span>
                  <span className="text-gray-900 font-semibold" style={{ fontFamily: 'Roboto, sans-serif' }}>
                    {createdAccount.mt5Response || createdAccount.account_number}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium" style={{ fontFamily: 'Roboto, sans-serif' }}>Trading server:</span>
                  <span className="text-gray-900 font-semibold" style={{ fontFamily: 'Roboto, sans-serif' }}>{createdAccount.trading_server}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium" style={{ fontFamily: 'Roboto, sans-serif' }}>Group:</span>
                  <span className="text-gray-900 font-semibold" style={{ fontFamily: 'Roboto, sans-serif' }}>
                    {createdAccount.mt5_group_name || selectedGroup?.dedicated_name || selectedGroup?.group_name || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium" style={{ fontFamily: 'Roboto, sans-serif' }}>Leverage:</span>
                  <span className="text-gray-900 font-semibold" style={{ fontFamily: 'Roboto, sans-serif' }}>1:{createdAccount.leverage || 'N/A'}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: 'Roboto, sans-serif' }}>
              We've also sent you an email with these details.
            </p>

            <button
              onClick={() => navigate('/user/dashboard')}
              className="w-full bg-brand-500 hover:bg-brand-600 text-dark-base py-3 rounded-lg transition-colors font-semibold"
              style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}
            >
              To Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateAccount

