import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PlusCircle, ArrowLeft, CheckCircle2, Shield, Info, CreditCard } from 'lucide-react'
import authService from '../../services/auth.js'
import AuthLoader from '../../components/AuthLoader.jsx'
import Toast from '../../components/Toast.jsx'
import PageHeader from '../components/PageHeader.jsx'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fxbrokersuite-back-crm-jack.onrender.com/api';

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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 transition-colors duration-300">
      {loading && <AuthLoader message="Creating account..." />}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          icon={PlusCircle}
          title="Create Trading Account"
          subtitle="Create a new live or demo MT5 trading account with your preferred settings."
        />
        
        {/* Back Button */}
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/user/platforms')}
            className="group flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Platforms
          </button>
        </div>

        {/* Step 1: Create Account Form */}
        {currentStep === 1 && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 p-6 sm:p-8">
            <h1 className="text-xl font-semibold text-slate-900 mb-6">
              Create a new <span className={mode === 'live' ? 'text-blue-600' : 'text-emerald-600'}>{mode === 'demo' ? 'Demo' : 'Live'}</span> account
            </h1>

            {/* Account Type Tabs */}
            <div className="flex p-1.5 bg-slate-100/80 rounded-xl mb-8 w-fit">
              <button
                type="button"
                onClick={() => setMode('live')}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${mode === 'live'
                  ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                Live Account
              </button>
              <button
                type="button"
                onClick={() => setMode('demo')}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${mode === 'demo'
                  ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                Demo Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Trading Group Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Choose Your Trading Group
                  </label>
                  <p className="text-sm text-slate-500">
                    Select the trading group that best suits your trading style.
                  </p>
                </div>

                {loadingGroups ? (
                  <div className="w-full px-4 py-8 border border-slate-200 border-dashed rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="text-sm text-slate-500 font-medium">Loading available groups...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredGroups.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <Info className="w-10 h-10 text-slate-300 mb-3" />
                        <p className="text-slate-900 font-medium">No {mode} groups available</p>
                        <p className="text-slate-500 text-sm mt-1">Please try switching account types or contact support.</p>
                      </div>
                    )}
                    {filteredGroups.map((group) => (
                      <label key={group.id} className="group cursor-pointer relative">
                        <input
                          type="radio"
                          name="mt5GroupId"
                          value={group.id}
                          checked={formData.mt5GroupId === group.id.toString()}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className={`relative h-full border rounded-2xl p-4 transition-all duration-200 ${
                          formData.mt5GroupId === group.id.toString()
                            ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                          }`}>
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm shrink-0">
                              <img
                                src="/mt_5.png"
                                alt="MetaTrader 5"
                                className="w-12 h-12 object-contain"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-slate-900 truncate">
                                  {group.dedicated_name || 'Unnamed Group'}
                                </span>
                                {formData.mt5GroupId === group.id.toString() && (
                                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs">
                                <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-medium border border-slate-200">
                                  {group.currency}
                                </span>
                                <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-medium border border-slate-200">
                                  MT5
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Leverage Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Select Leverage
                  </label>
                  <div className="relative">
                    <select
                      name="leverage"
                      value={formData.leverage}
                      onChange={handleChange}
                      required
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none text-slate-900 text-sm"
                    >
                      <option value="50">1:50</option>
                      <option value="100">1:100</option>
                      <option value="200">1:200</option>
                      <option value="500">1:500</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Higher leverage increases both potential profits and risks.
                  </p>
                </div>

                {/* Reason for opening */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Reason for Opening
                  </label>
                  <div className="relative">
                    <select
                      name="reasonForAccount"
                      value={formData.reasonForAccount}
                      onChange={handleChange}
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none text-slate-900 text-sm"
                    >
                      {reasons.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-6">
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  Security Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Master Password (for MT5) */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Set MT5 Master Password
                    </label>
                    <div className="relative">
                      <input
                        type={showMasterPassword ? 'text' : 'password'}
                        name="masterPassword"
                        value={formData.masterPassword}
                        onChange={handleChange}
                        required
                        className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 text-sm placeholder:text-slate-400"
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMasterPassword(!showMasterPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Confirm Portal Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="portalPassword"
                        value={formData.portalPassword}
                        onChange={handleChange}
                        required
                        className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 text-sm placeholder:text-slate-400"
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || loadingGroups || !formData.mt5GroupId}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white/90" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    <span>Create {mode === 'demo' ? 'Demo' : 'Live'} Account</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Account Created Success */}
        {currentStep === 2 && createdAccount && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 p-8 text-center max-w-2xl mx-auto">
            {/* Success Icon */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 rounded-full mb-4 ring-1 ring-emerald-100">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Account Created Successfully!
              </h2>
              <p className="text-slate-600">
                Your new trading account is ready. You can now fund your account and start trading.
              </p>
            </div>

            {/* Account Details */}
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-6 mb-8 text-left">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-200/50 last:border-0">
                  <span className="text-slate-500 font-medium text-sm">Trading Account</span>
                  <span className="text-slate-900 font-bold font-mono text-lg">
                    {createdAccount.mt5Response || createdAccount.account_number}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200/50 last:border-0">
                  <span className="text-slate-500 font-medium text-sm">Trading Server</span>
                  <span className="text-slate-900 font-semibold text-sm">{createdAccount.trading_server}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200/50 last:border-0">
                  <span className="text-slate-500 font-medium text-sm">Account Group</span>
                  <span className="text-slate-900 font-semibold text-sm">
                    {createdAccount.mt5_group_name || selectedGroup?.dedicated_name || selectedGroup?.group_name || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200/50 last:border-0">
                  <span className="text-slate-500 font-medium text-sm">Leverage</span>
                  <span className="text-slate-900 font-semibold text-sm">1:{createdAccount.leverage || 'N/A'}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-500 mb-8 flex items-center justify-center gap-2">
              <Info className="w-4 h-4" />
              Account credentials have been sent to your email.
            </p>

            <button
              onClick={() => navigate('/user/dashboard')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl transition-all font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateAccount
