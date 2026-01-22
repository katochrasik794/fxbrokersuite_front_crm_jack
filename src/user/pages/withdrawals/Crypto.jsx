import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, AlertCircle, CheckCircle, Copy, ArrowRight, ShieldCheck, DollarSign, CreditCard } from 'lucide-react'
import withdrawalService from '../../../services/withdrawal.service'
import authService from '../../../services/auth.js'
import Swal from 'sweetalert2'
import PageHeader from '../../components/PageHeader'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Crypto() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [wallet, setWallet] = useState(null)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [accountType, setAccountType] = useState('trading') // 'trading' or 'wallet'
  const [amount, setAmount] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cryptoAddress, setCryptoAddress] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [selectedNetwork, setSelectedNetwork] = useState('TRC20')
  const [kycStatus, setKycStatus] = useState(null)
  const [kycLoading, setKycLoading] = useState(true)
  const [amountError, setAmountError] = useState('')

  useEffect(() => {
    checkKYCStatus()
  }, [])

  useEffect(() => {
    // Only fetch accounts and wallet if KYC is approved (case-insensitive check)
    const status = String(kycStatus || '').toLowerCase()
    if (status === 'approved') {
      fetchAccounts()
      fetchWallet()
      fetchPaymentMethods()
    }
  }, [kycStatus])

  // Fetch approved payment methods
  const fetchPaymentMethods = async () => {
    try {
      const token = authService.getToken()
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/payment-details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && Array.isArray(data.data)) {
          // Filter only approved payment methods
          const approved = data.data.filter(pm => 
            pm.status?.toLowerCase() === 'approved' && 
            (pm.payment_method === 'usdt_trc20' || pm.payment_method === 'usdt_erc20' || pm.payment_method === 'usdt_bep20')
          )
          setPaymentMethods(approved)
          
          // Auto-select first payment method if available
          if (approved.length > 0 && !selectedPaymentMethod) {
            const matchingNetwork = approved.find(pm => {
              const method = pm.payment_method?.toLowerCase() || ''
              if (selectedNetwork === 'TRC20' && method === 'usdt_trc20') return true
              if (selectedNetwork === 'ERC20' && method === 'usdt_erc20') return true
              if (selectedNetwork === 'BEP20' && method === 'usdt_bep20') return true
              return false
            })
            if (matchingNetwork) {
              setSelectedPaymentMethod(matchingNetwork)
              const details = typeof matchingNetwork.payment_details === 'string' 
                ? JSON.parse(matchingNetwork.payment_details) 
                : matchingNetwork.payment_details
              setCryptoAddress(details.walletAddress || details.wallet_address || '')
            } else if (approved[0]) {
              setSelectedPaymentMethod(approved[0])
              const details = typeof approved[0].payment_details === 'string' 
                ? JSON.parse(approved[0].payment_details) 
                : approved[0].payment_details
              setCryptoAddress(details.walletAddress || details.wallet_address || '')
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error)
    }
  }

  // Update selected payment method when network changes (optional - try to match, but don't require it)
  useEffect(() => {
    if (paymentMethods.length > 0 && !selectedPaymentMethod) {
      // Try to find matching network first
      const matchingMethod = paymentMethods.find(pm => {
        const method = pm.payment_method?.toLowerCase() || ''
        if (selectedNetwork === 'TRC20' && method === 'usdt_trc20') return true
        if (selectedNetwork === 'ERC20' && method === 'usdt_erc20') return true
        if (selectedNetwork === 'BEP20' && method === 'usdt_bep20') return true
        return false
      })
      
      if (matchingMethod) {
        setSelectedPaymentMethod(matchingMethod)
        const details = typeof matchingMethod.payment_details === 'string' 
          ? JSON.parse(matchingMethod.payment_details) 
          : matchingMethod.payment_details
        setCryptoAddress(details.walletAddress || details.wallet_address || '')
      } else if (paymentMethods[0]) {
        // If no matching network, select first available
        setSelectedPaymentMethod(paymentMethods[0])
        const details = typeof paymentMethods[0].payment_details === 'string' 
          ? JSON.parse(paymentMethods[0].payment_details) 
          : paymentMethods[0].payment_details
        setCryptoAddress(details.walletAddress || details.wallet_address || '')
      }
    }
  }, [selectedNetwork, paymentMethods])

  const checkKYCStatus = async () => {
    try {
      setKycLoading(true)
      const token = authService.getToken()
      if (!token) {
        navigate('/login')
        return
      }

      const response = await fetch(`${API_BASE_URL}/kyc/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          // Normalize status to lowercase for consistent checking
          const status = (data.data.status || 'unverified').toLowerCase()
          setKycStatus(status)
        } else {
          setKycStatus('unverified')
        }
      } else {
        setKycStatus('unverified')
      }
    } catch (error) {
      console.error('Error checking KYC status:', error)
      setKycStatus('unverified')
    } finally {
      setKycLoading(false)
    }
  }

  // Set default selection after accounts and wallet are loaded
  useEffect(() => {
    if (!selectedAccount) {
      if (accounts.length > 0) {
        setSelectedAccount({ ...accounts[0], type: 'trading' })
        setAccountType('trading')
      } else if (wallet) {
        setSelectedAccount({ ...wallet, type: 'wallet' })
        setAccountType('wallet')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, wallet])

  const fetchAccounts = async () => {
    try {
      const data = await withdrawalService.getAccounts()
      if (data && data.success && Array.isArray(data.data)) {
        // Filter for active MT5 accounts only, exclude demo accounts
        const activeAccounts = data.data.filter(acc => {
          const isMT5 = acc.platform === 'MT5'
          const isActive = acc.account_status === 'active'
          const isNotDemo = !acc.is_demo && (!acc.trading_server || !acc.trading_server.toLowerCase().includes('demo'))
          return isMT5 && isActive && isNotDemo
        })
        setAccounts(activeAccounts)
      }
    } catch (error) {
      console.error('Failed to fetch accounts', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load your trading accounts'
      })
    }
  }

  const fetchWallet = async () => {
    try {
      const data = await withdrawalService.getWallet()
      if (data && data.success && data.data) {
        setWallet(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch wallet', error)
    }
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()

    if (!selectedAccount) {
      Swal.fire('Error', 'Please select an account', 'error')
      return
    }

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      Swal.fire('Error', 'Please enter a valid amount', 'error')
      return
    }

    if (amountError) {
      Swal.fire('Error', amountError, 'error')
      return
    }

    if (!password) {
      Swal.fire('Error', 'Please enter your password', 'error')
      return
    }

    if (!selectedPaymentMethod) {
      Swal.fire('Error', 'Please select a payment method', 'error')
      return
    }

    // Get wallet address from selected payment method
    const paymentDetails = typeof selectedPaymentMethod.payment_details === 'string' 
      ? JSON.parse(selectedPaymentMethod.payment_details) 
      : selectedPaymentMethod.payment_details
    const walletAddress = paymentDetails.walletAddress || paymentDetails.wallet_address || ''
    
    if (!walletAddress) {
      Swal.fire('Error', 'Selected payment method has no wallet address', 'error')
      return
    }

    setLoading(true)

    try {
      const withdrawalData = {
        mt5AccountId: accountType === 'trading' ? selectedAccount.account_number : null,
        walletId: accountType === 'wallet' ? selectedAccount.id : null,
        amount: parseFloat(amount),
        currency: selectedAccount.currency || 'USD',
        method: 'crypto',
        paymentMethod: `USDT-${selectedNetwork}`,
        cryptoAddress: walletAddress,
        paymentDetailId: selectedPaymentMethod.id, // Include payment detail ID
        pmCurrency: 'USDT',
        pmNetwork: selectedNetwork,
        password: password
      }

      const response = await withdrawalService.createWithdrawal(withdrawalData)

      if (response && response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Withdrawal request submitted successfully! Funds have been deducted from your account pending approval.'
        })
        setAmount('')
        setPassword('')
        // Refresh accounts and wallet to show updated balance
        fetchAccounts()
        fetchWallet()
        fetchPaymentMethods()
      } else {
        throw new Error(response.message || 'Unknown error')
      }

    } catch (error) {
      console.error('Withdrawal failed:', error)
      Swal.fire({
        icon: 'error',
        title: 'Withdrawal Failed',
        text: error.response?.data?.error || error.message || 'Something went wrong'
      })
    } finally {
      setLoading(false)
    }
  }

  // Check if KYC is approved (case-insensitive)
  const isKYCApproved = String(kycStatus || '').toLowerCase() === 'approved'

  // Get selected account limits
  const getSelectedAccountLimits = () => {
    if (accountType === 'trading' && selectedAccount) {
      return {
        min: selectedAccount.minimum_withdrawal ? parseFloat(selectedAccount.minimum_withdrawal) : null,
        max: selectedAccount.maximum_withdrawal ? parseFloat(selectedAccount.maximum_withdrawal) : null
      };
    }
    return { min: null, max: null };
  };

  // Format limits for display
  const formatLimits = () => {
    const limits = getSelectedAccountLimits();
    if (limits.min === null && limits.max === null) {
      return 'USD 10 - USD 20000';
    }
    if (limits.max === null) {
      return `USD ${limits.min.toFixed(2)} - No maximum`;
    }
    return `USD ${limits.min.toFixed(2)} - USD ${limits.max.toFixed(2)}`;
  };

  // Validate amount
  useEffect(() => {
    if (!amount || amount === '') {
      setAmountError('');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setAmountError('Please enter a valid amount');
      return;
    }

    const limits = getSelectedAccountLimits();
    if (limits.min !== null && amountNum < limits.min) {
      setAmountError(`Minimum withdrawal is $${limits.min.toFixed(2)}`);
      return;
    }

    if (limits.max !== null && amountNum > limits.max) {
      setAmountError(`Maximum withdrawal is $${limits.max.toFixed(2)}`);
      return;
    }

    setAmountError('');
  }, [amount, selectedAccount, accountType]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crypto Withdrawal"
        subtitle="Withdraw funds securely to your crypto wallet"
        icon={Wallet}
      />
      
      {/* Loading State */}
        {kycLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 font-medium">Checking verification status...</p>
            </div>
          </div>
        )}

        {/* KYC Warning Overlay */}
        {!kycLoading && !isKYCApproved && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 w-full max-w-lg text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-50 mb-6">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                KYC Verification Required
              </h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                To proceed with withdrawals, please complete your KYC (Know Your Customer) verification. This is required for security and regulatory compliance.
              </p>
              <button
                onClick={() => navigate('/user/verification')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl transition-all font-semibold text-base shadow-lg shadow-blue-600/20"
              >
                Go to KYC Verification
              </button>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${!isKYCApproved && !kycLoading ? 'opacity-30 pointer-events-none' : ''}`}>
          {/* Main Form Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50">
                <h2 className="text-lg font-semibold text-slate-900">Withdrawal Details</h2>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleWithdraw} className="space-y-6">
                  {/* Account Selection */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">Withdraw From</label>
                    <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {/* Wallet Account */}
                      {wallet && (
                        <div
                          onClick={() => {
                            setSelectedAccount({ ...wallet, type: 'wallet' })
                            setAccountType('wallet')
                          }}
                          className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all group ${
                            accountType === 'wallet' && selectedAccount?.id === wallet.id 
                              ? 'border-blue-600 bg-blue-50/30' 
                              : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <div className={`p-2.5 rounded-lg ${
                                accountType === 'wallet' && selectedAccount?.id === wallet.id 
                                  ? 'bg-blue-100 text-blue-600' 
                                  : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                              }`}>
                                <Wallet className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">My Wallet</p>
                                <p className="text-sm text-slate-500 font-mono mt-0.5">{wallet.wallet_number}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-500 mb-0.5">Available Balance</p>
                              <p className="font-bold text-slate-900">{wallet.currency || 'USD'} {parseFloat(wallet.balance || 0).toFixed(2)}</p>
                            </div>
                          </div>
                          {accountType === 'wallet' && selectedAccount?.id === wallet.id && (
                            <div className="absolute top-4 right-4">
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Trading Accounts */}
                      {accounts.map(acc => (
                        <div
                          key={acc.id}
                          onClick={() => {
                            setSelectedAccount({ ...acc, type: 'trading' })
                            setAccountType('trading')
                          }}
                          className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all group ${
                            accountType === 'trading' && selectedAccount?.id === acc.id 
                              ? 'border-blue-600 bg-blue-50/30' 
                              : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <div className={`p-2.5 rounded-lg ${
                                accountType === 'trading' && selectedAccount?.id === acc.id 
                                  ? 'bg-blue-100 text-blue-600' 
                                  : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                              }`}>
                                <CreditCard className="w-6 h-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-slate-900">{acc.platform}</p>
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                                    {acc.account_type}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-500 font-mono mt-0.5">{acc.account_number}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-500 mb-0.5">Available Balance</p>
                              <p className="font-bold text-slate-900">{acc.currency} {parseFloat(acc.balance || 0).toFixed(2)}</p>
                            </div>
                          </div>
                          {accountType === 'trading' && selectedAccount?.id === acc.id && (
                            <div className="absolute top-4 right-4">
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Network Selection */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <label className="block text-sm font-medium text-slate-700">Network</label>
                    <div className="grid grid-cols-3 gap-4">
                      {['TRC20', 'ERC20', 'BEP20'].map((network) => (
                        <button
                          key={network}
                          type="button"
                          onClick={() => setSelectedNetwork(network)}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            selectedNetwork === network
                              ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          USDT {network}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">Amount</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <DollarSign className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className={`block w-full pl-11 pr-4 py-3.5 bg-white border ${
                          amountError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
                        } rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 transition-all`}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    {amountError ? (
                      <p className="text-sm text-red-600 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        {amountError}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Limits: {formatLimits()}
                      </p>
                    )}
                  </div>

                  {/* Password Input */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                        placeholder="Enter your password to confirm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading || !!amountError || !amount || !password}
                      className={`w-full py-4 px-6 rounded-xl text-white font-semibold text-lg shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 ${
                        loading || !!amountError || !amount || !password
                          ? 'bg-slate-300 cursor-not-allowed shadow-none'
                          : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5'
                      }`}
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Confirm Withdrawal
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            {/* Destination Wallet Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                Destination Wallet
              </h3>
              
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Wallet Address</p>
                <div className="flex items-start gap-3">
                  <p className="text-sm font-mono text-slate-700 break-all leading-relaxed">
                    {cryptoAddress || 'Select a payment method to view address'}
                  </p>
                  {cryptoAddress && (
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(cryptoAddress)
                        Swal.fire({
                          icon: 'success',
                          title: 'Copied!',
                          toast: true,
                          position: 'top-end',
                          showConfirmButton: false,
                          timer: 1500
                        })
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>Ensure the network matches: <span className="font-bold">USDT-{selectedNetwork}</span></p>
              </div>
            </div>

            {/* Important Info Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg shadow-blue-900/20 p-6 text-white">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Security Information
              </h3>
              <ul className="space-y-3 text-blue-50 text-sm">
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-2 flex-shrink-0" />
                  <p>Withdrawals are processed within 24 hours during business days.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-2 flex-shrink-0" />
                  <p>Ensure your destination wallet supports USDT-{selectedNetwork}.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-2 flex-shrink-0" />
                  <p>Two-factor authentication may be required for large withdrawals.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
    </div>
  )
}

export default Crypto
