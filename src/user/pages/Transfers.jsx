import { useEffect, useState, useRef } from 'react'
import { ArrowLeftRight, RefreshCw, AlertCircle, Clock } from 'lucide-react'
import authService from '../../services/auth.js'
import Toast from '../../components/Toast.jsx'
import PageHeader from '../components/PageHeader.jsx'
import ProTable from '../../admin/components/ProTable.jsx'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fxbrokersuite-back-crm-jack.onrender.com/api'
const DAILY_TRANSFER_LIMIT = 10000 // Default daily limit in USD

function Transfers() {
  const [fromAccount, setFromAccount] = useState('')
  const [toAccount, setToAccount] = useState('')
  const [amount, setAmount] = useState('')

  const [wallet, setWallet] = useState(null)
  const [mt5Accounts, setMt5Accounts] = useState([])
  const [mt5Balances, setMt5Balances] = useState({}) // { account_number: { balance, equity, margin, credit, leverage } }
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [syncingBalances, setSyncingBalances] = useState(false)

  // Datatable state
  const [allTransactions, setAllTransactions] = useState([])
  const [internalTransfers, setInternalTransfers] = useState([])
  const [loadingInternalTransfers, setLoadingInternalTransfers] = useState(true)
  const [pageSize, setPageSize] = useState(10)
  const [internalPageSize, setInternalPageSize] = useState(10)

  const [toast, setToast] = useState(null)
  
  // Daily transfer limit state
  const [dailyTransferUsed, setDailyTransferUsed] = useState(0)
  const [remainingTime, setRemainingTime] = useState(null)
  const [limitExceeded, setLimitExceeded] = useState(false)
  const countdownIntervalRef = useRef(null)

  // Fetch balance for a specific MT5 account from API
  const fetchAccountBalance = async (accountNumber) => {
    try {
      const token = authService.getToken()
      if (!token) return null

      const response = await fetch(`${API_BASE_URL}/accounts/${accountNumber}/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success && data.data) {
        return data.data
      }
    } catch (error) {
      console.error(`Error fetching balance for account ${accountNumber}:`, error)
    }
    return null
  }

  // Fetch all MT5 account balances
  const fetchAllAccountBalances = async (accountList) => {
    const balances = {}
    const promises = accountList.map(async (acc) => {
      const accountNumber = acc.account_number
      const balanceData = await fetchAccountBalance(accountNumber)
      if (balanceData) {
        balances[accountNumber] = balanceData
      } else {
        // Fallback to database balance if API fails
        balances[accountNumber] = {
          balance: acc.balance || 0,
          equity: acc.equity || 0,
          margin: acc.margin || 0,
          credit: acc.credit || 0,
          leverage: acc.leverage || 2000
        }
      }
    })
    await Promise.all(promises)
    setMt5Balances(balances)
  }

  // Calculate daily transfer used from internal transfers
  const calculateDailyTransferUsed = (transfers) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayTransfers = transfers.filter(transfer => {
      const transferDate = new Date(transfer.created_at)
      transferDate.setHours(0, 0, 0, 0)
      return transferDate.getTime() === today.getTime()
    })
    
    const totalUsed = todayTransfers.reduce((sum, transfer) => {
      return sum + parseFloat(transfer.amount || 0)
    }, 0)
    
    return totalUsed
  }

  // Calculate remaining time until next day
  const calculateRemainingTime = () => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    const diff = tomorrow.getTime() - now.getTime()
    return diff
  }

  // Format time remaining as HH:MM:SS
  const formatTimeRemaining = (ms) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  // Update countdown timer
  useEffect(() => {
    if (limitExceeded) {
      const updateCountdown = () => {
        const remaining = calculateRemainingTime()
        setRemainingTime(remaining)
        
        if (remaining <= 0) {
          // Reset limit for new day
          setLimitExceeded(false)
          setDailyTransferUsed(0)
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
            countdownIntervalRef.current = null
          }
        }
      }
      
      updateCountdown()
      countdownIntervalRef.current = setInterval(updateCountdown, 1000)
      
      return () => {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
        }
      }
    }
  }, [limitExceeded])

  // Check daily limit when internal transfers load
  useEffect(() => {
    if (internalTransfers.length > 0) {
      const used = calculateDailyTransferUsed(internalTransfers)
      setDailyTransferUsed(used)
      
      if (used >= DAILY_TRANSFER_LIMIT) {
        setLimitExceeded(true)
        setRemainingTime(calculateRemainingTime())
      } else {
        setLimitExceeded(false)
      }
    }
  }, [internalTransfers])

  // Load wallet + MT5 accounts + all transactions for client-side filtering
  useEffect(() => {
    const load = async () => {
      try {
        const token = authService.getToken()
        if (!token) return

        const headers = { Authorization: `Bearer ${token}` }

        // Fetch all transactions (use a large limit to get all)
        const [walletRes, accountsRes, txRes] = await Promise.all([
          fetch(`${API_BASE_URL}/wallet`, { headers }),
          fetch(`${API_BASE_URL}/accounts`, { headers }),
          fetch(`${API_BASE_URL}/wallet/transactions?limit=1000&offset=0`, { headers }),
        ])

        const walletData = await walletRes.json()
        if (walletData.success) setWallet(walletData.data)

        const accountsData = await accountsRes.json()
        if (accountsData.success) {
          const all = Array.isArray(accountsData.data) ? accountsData.data : []
          // Filter for active MT5 accounts only, exclude demo accounts
          const mt5 = all.filter((acc) => {
            const isMT5 = (acc.platform || '').toUpperCase() === 'MT5'
            const isActive = acc.account_status === 'active'
            const isNotDemo = !acc.is_demo && (!acc.trading_server || !acc.trading_server.toLowerCase().includes('demo'))
            return isMT5 && isActive && isNotDemo
          })
          setMt5Accounts(mt5)
          
          // Fetch real-time balances for MT5 accounts from API
          if (mt5.length > 0) {
            await fetchAllAccountBalances(mt5)
          }
        }

        const txData = await txRes.json()
        if (txData.success && txData.data) {
          setAllTransactions(txData.data.items || [])
        }

        // Fetch internal transfers
        const internalRes = await fetch(`${API_BASE_URL}/wallet/internal-transfers?limit=1000&offset=0`, { headers })
        const internalData = await internalRes.json()
        if (internalData.success && internalData.data) {
          setInternalTransfers(internalData.data.items || [])
        }
      } catch (err) {
        console.error('Load transfers page error:', err)
      } finally {
        setLoading(false)
        setLoadingInternalTransfers(false)
      }
    }

    load()
  }, [])

  const reloadTransactions = async () => {
    try {
      const token = authService.getToken()
      if (!token) return

      const headers = { Authorization: `Bearer ${token}` }
      const res = await fetch(
        `${API_BASE_URL}/wallet/transactions?limit=1000&offset=0`,
        { headers }
      )
      const data = await res.json()
      if (data.success && data.data) {
        setAllTransactions(data.data.items || [])
      }
    } catch (err) {
      console.error('Reload wallet transactions error:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fromAccount || !toAccount || !amount) {
      setToast({ message: 'Please select accounts and amount', type: 'error' })
      return
    }
    if (fromAccount === toAccount) {
      setToast({ message: 'From and To accounts must be different', type: 'error' })
      return
    }

    const isFromWallet = fromAccount === 'wallet'
    const isToWallet = toAccount === 'wallet'

    if (!(isFromWallet ^ isToWallet)) {
      setToast({
        message: 'Only transfers between Wallet and MT5 accounts are allowed',
        type: 'error',
      })
      return
    }

    // Check daily transfer limit
    const transferAmount = parseFloat(amount)
    const newTotal = dailyTransferUsed + transferAmount
    
    if (newTotal > DAILY_TRANSFER_LIMIT) {
      const remaining = DAILY_TRANSFER_LIMIT - dailyTransferUsed
      const timeRemaining = remainingTime ? formatTimeRemaining(remainingTime) : 'calculating...'
      setToast({
        message: `Daily transfer limit exceeded. You can transfer up to $${remaining.toFixed(2)} more today. Please wait for ${timeRemaining} for the limit to reset.`,
        type: 'error',
      })
      return
    }

    const mt5Account = isFromWallet ? toAccount : fromAccount

    setSubmitting(true)
    try {
      const token = authService.getToken()
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }

      let endpoint = ''
      if (isFromWallet && !isToWallet) {
        endpoint = '/wallet/transfer-to-mt5'
      } else if (!isFromWallet && isToWallet) {
        endpoint = '/wallet/transfer-from-mt5'
      }

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mt5Account,
          amount: parseFloat(amount),
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Transfer failed')
      }

      setToast({
        message: 'Transfer completed successfully',
        type: 'success',
      })

      // Refresh wallet, balances, and transactions
      const walletRes = await fetch(`${API_BASE_URL}/wallet`, { headers })
      const walletData = await walletRes.json()
      if (walletData.success) setWallet(walletData.data)

      // Refresh accounts and balances
      const accountsRes = await fetch(`${API_BASE_URL}/accounts`, { headers })
      const accountsData = await accountsRes.json()
      if (accountsData.success) {
        const all = Array.isArray(accountsData.data) ? accountsData.data : []
        // Filter for active MT5 accounts only, exclude demo accounts
        const mt5 = all.filter((acc) => {
          const isMT5 = (acc.platform || '').toUpperCase() === 'MT5'
          const isActive = acc.account_status === 'active'
          const isNotDemo = !acc.is_demo && (!acc.trading_server || !acc.trading_server.toLowerCase().includes('demo'))
          return isMT5 && isActive && isNotDemo
        })
        setMt5Accounts(mt5)
        
        // Fetch fresh balances for all MT5 accounts
        if (mt5.length > 0) {
          await fetchAllAccountBalances(mt5)
        }
      }

      await reloadTransactions()

      // Reload internal transfers
      const internalRes = await fetch(`${API_BASE_URL}/wallet/internal-transfers?limit=1000&offset=0`, { headers })
      const internalData = await internalRes.json()
      if (internalData.success && internalData.data) {
        const updatedTransfers = internalData.data.items || []
        setInternalTransfers(updatedTransfers)
        
        // Update daily transfer used
        const used = calculateDailyTransferUsed(updatedTransfers)
        setDailyTransferUsed(used)
        
        if (used >= DAILY_TRANSFER_LIMIT) {
          setLimitExceeded(true)
          setRemainingTime(calculateRemainingTime())
        }
      }

      // Reset form
      setFromAccount('')
      setToAccount('')
      setAmount('')
    } catch (err) {
      console.error('Transfer error:', err)
      setToast({ message: err.message || 'Transfer failed', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const formatDateTime = (value) => {
    if (!value) return '-'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '-'
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
  }

  // Get available balance for selected account
  const getAvailableBalance = () => {
    if (fromAccount === 'wallet') {
      return wallet ? Number(wallet.balance) : 0
    } else if (fromAccount) {
      const balanceData = mt5Balances[fromAccount]
      return balanceData ? Number(balanceData.balance || 0) : 0
    }
    return 0
  }

  // Handle sync balances
  const handleSyncBalances = async () => {
    setSyncingBalances(true)
    try {
      const token = authService.getToken()
      if (!token) return

      const headers = { Authorization: `Bearer ${token}` }

      // Refresh accounts list first
      const accountsRes = await fetch(`${API_BASE_URL}/accounts`, { headers })
      const accountsData = await accountsRes.json()
      
      if (accountsData.success) {
        const all = Array.isArray(accountsData.data) ? accountsData.data : []
        // Filter for active MT5 accounts only, exclude demo accounts
        const mt5 = all.filter((acc) => {
          const isMT5 = (acc.platform || '').toUpperCase() === 'MT5'
          const isActive = acc.account_status === 'active'
          const isNotDemo = !acc.is_demo && (!acc.trading_server || !acc.trading_server.toLowerCase().includes('demo'))
          return isMT5 && isActive && isNotDemo
        })
        setMt5Accounts(mt5)
        
        // Fetch fresh balances for all MT5 accounts
        if (mt5.length > 0) {
          await fetchAllAccountBalances(mt5)
        }
      }

      // Also refresh wallet
      const walletRes = await fetch(`${API_BASE_URL}/wallet`, { headers })
      const walletData = await walletRes.json()
      if (walletData.success) setWallet(walletData.data)

      setToast({
        message: 'Balances refreshed successfully',
        type: 'success'
      })
    } catch (err) {
      console.error('Sync balances error:', err)
      setToast({
        message: 'Failed to refresh balances',
        type: 'error'
      })
    } finally {
      setSyncingBalances(false)
    }
  }

  const availableBalance = getAvailableBalance()

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <PageHeader
        icon={ArrowLeftRight}
        title="Transfers"
        subtitle="Transfer funds between your wallet and MT5 trading accounts."
      />

        {/* Daily Transfer Limit Indicator */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                limitExceeded ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {limitExceeded ? <AlertCircle size={20} /> : <Clock size={20} />}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Daily Transfer Limit</h3>
                <div className="flex items-baseline gap-2">
                  <span className={`text-xl font-bold ${
                    limitExceeded ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    ${dailyTransferUsed.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-400">
                    / ${DAILY_TRANSFER_LIMIT.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {limitExceeded && remainingTime && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-xl border border-red-100">
                <span className="text-sm font-semibold text-red-600">Limit Exceeded</span>
                <span className="w-px h-4 bg-red-200"></span>
                <span className="text-sm font-mono font-medium text-red-700">
                  Reset in: {formatTimeRemaining(remainingTime)}
                </span>
              </div>
            )}
          </div>

          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                limitExceeded ? 'bg-red-500' : 
                dailyTransferUsed > DAILY_TRANSFER_LIMIT * 0.8 ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min((dailyTransferUsed / DAILY_TRANSFER_LIMIT) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Transfer Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-900">Move Funds</h2>
            <button
              type="button"
              onClick={handleSyncBalances}
              disabled={syncingBalances}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-all disabled:opacity-50 text-sm font-medium border border-gray-200/50"
            >
              <RefreshCw className={`w-4 h-4 ${syncingBalances ? 'animate-spin' : ''}`} />
              {syncingBalances ? 'Refreshing...' : 'Refresh Balance'}
            </button>
          </div>
          
          <div className="p-6 md:p-8">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <form className="space-y-8" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  {/* From Account */}
                  <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 transition-all hover:border-blue-200/50 hover:shadow-sm group">
                    <label className="block mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      From Account
                    </label>
                    <div className="relative mb-6">
                      <select
                        value={fromAccount}
                        onChange={(e) => {
                          setFromAccount(e.target.value)
                          setAmount('')
                        }}
                        className="w-full px-5 py-4 rounded-xl bg-white border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all appearance-none font-medium text-gray-900"
                      >
                        <option value="">Select source account</option>
                        {wallet && toAccount !== 'wallet' && (
                          <option value="wallet">
                            Wallet ({wallet.wallet_number}) - ${Number(wallet.balance || 0).toFixed(2)}
                          </option>
                        )}
                        {mt5Accounts
                          .filter((acc) => acc.account_number !== toAccount)
                          .map((acc) => {
                            const balanceData = mt5Balances[acc.account_number]
                            const balance = balanceData ? Number(balanceData.balance || 0) : (acc.balance || 0)
                            return (
                              <option key={acc.id} value={acc.account_number}>
                                MT5 {acc.account_number} - ${Number(balance).toFixed(2)}
                              </option>
                            )
                          })}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 group-hover:text-blue-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    
                    {fromAccount && (
                      <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <span className="text-sm text-gray-500">Available Balance</span>
                        <span className="text-lg font-bold text-gray-900">${availableBalance.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* To Account */}
                  <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 transition-all hover:border-blue-200/50 hover:shadow-sm group">
                    <label className="block mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      To Account
                    </label>
                    <div className="relative mb-6">
                      <select
                        value={toAccount}
                        onChange={(e) => {
                          setToAccount(e.target.value)
                          setAmount('')
                        }}
                        className="w-full px-5 py-4 rounded-xl bg-white border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all appearance-none font-medium text-gray-900"
                      >
                        <option value="">Select destination account</option>
                        {wallet && fromAccount !== 'wallet' && (
                          <option value="wallet">
                            Wallet ({wallet.wallet_number}) - ${Number(wallet.balance || 0).toFixed(2)}
                          </option>
                        )}
                        {mt5Accounts
                          .filter((acc) => acc.account_number !== fromAccount)
                          .map((acc) => {
                            const balanceData = mt5Balances[acc.account_number]
                            const balance = balanceData ? Number(balanceData.balance || 0) : (acc.balance || 0)
                            return (
                              <option key={acc.id} value={acc.account_number}>
                                MT5 {acc.account_number} - ${Number(balance).toFixed(2)}
                              </option>
                            )
                          })}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 group-hover:text-blue-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {toAccount && (
                      <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <span className="text-sm text-gray-500">Current Balance</span>
                        <span className="text-lg font-bold text-gray-900">
                          ${toAccount === 'wallet' 
                            ? (wallet ? Number(wallet.balance).toFixed(2) : '0.00')
                            : (() => {
                                const balanceData = mt5Balances[toAccount]
                                return balanceData ? Number(balanceData.balance || 0).toFixed(2) : '0.00'
                              })()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount Section */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
                  <label className="block mb-6 text-sm font-semibold text-gray-700 uppercase tracking-wider text-center">
                    Transfer Amount
                  </label>
                  
                  <div className="max-w-xl mx-auto space-y-8">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                        <span className="text-2xl font-bold text-gray-400">$</span>
                      </div>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '' || (Number(val) >= 0 && Number(val) <= availableBalance)) {
                            setAmount(val)
                          }
                        }}
                        placeholder="0.00"
                        className="w-full pl-12 pr-6 py-6 text-4xl font-bold text-center text-gray-900 bg-gray-50 border-b-2 border-gray-200 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder-gray-300 rounded-t-xl"
                        min="0"
                        max={availableBalance}
                        step="0.01"
                      />
                    </div>

                    {fromAccount && availableBalance > 0 && (
                      <div className="space-y-6">
                        <div className="relative pt-6 pb-2">
                          <input
                            type="range"
                            min="0"
                            max={availableBalance}
                            step="0.01"
                            value={amount || 0}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <div className="flex justify-between mt-2 text-xs font-medium text-gray-400">
                            <span>$0.00</span>
                            <span>${availableBalance.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                          {[25, 50, 75, 100].map((percent) => (
                            <button
                              key={percent}
                              type="button"
                              onClick={() => setAmount((availableBalance * (percent / 100)).toFixed(2))}
                              className="px-2 py-2 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 text-sm font-medium transition-colors"
                            >
                              {percent}%
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={
                        submitting || 
                        !fromAccount || 
                        !toAccount || 
                        !amount || 
                        Number(amount) <= 0 || 
                        Number(amount) > availableBalance ||
                        limitExceeded ||
                        (dailyTransferUsed + Number(amount)) > DAILY_TRANSFER_LIMIT
                      }
                      className="w-full py-4 px-6 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-[0.98]"
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Processing Transfer...
                        </span>
                      ) : (
                        'Confirm Transfer'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Transactions Tables */}
        <div className="space-y-8">
          {/* Internal Transfers Table */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Internal Transfer History</h3>
            </div>
            {loadingInternalTransfers ? (
              <div className="p-12 text-center text-gray-500">Loading transfers...</div>
            ) : (
              <ProTable
                rows={internalTransfers.map(transfer => ({
                  ...transfer,
                  fromDisplay: (
                    <div>
                      <span className="capitalize font-medium text-gray-900">{transfer.from_type}</span>
                      <br />
                      <span className="text-gray-500 text-xs font-mono">{transfer.from_account}</span>
                    </div>
                  ),
                  toDisplay: (
                    <div>
                      <span className="capitalize font-medium text-gray-900">{transfer.to_type}</span>
                      <br />
                      <span className="text-gray-500 text-xs font-mono">{transfer.to_account}</span>
                    </div>
                  ),
                  amountFormatted: `$${Number(transfer.amount).toFixed(2)} ${transfer.currency || 'USD'}`,
                  dateTime: transfer.created_at
                }))}
                columns={[
                  { 
                    key: 'dateTime', 
                    label: 'Date & Time', 
                    sortable: true, 
                    render: (value) => (
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{new Date(value).toLocaleDateString()}</span>
                        <span className="text-xs text-gray-500">{new Date(value).toLocaleTimeString()}</span>
                      </div>
                    )
                  },
                  { 
                    key: 'from_type', 
                    label: 'From', 
                    sortable: true, 
                    render: (value, row) => row.fromDisplay
                  },
                  { 
                    key: 'to_type', 
                    label: 'To', 
                    sortable: true, 
                    render: (value, row) => row.toDisplay
                  },
                  { 
                    key: 'amount', 
                    label: 'Amount', 
                    sortable: true, 
                    render: (value, row) => (
                      <span className="font-bold text-gray-900">
                        ${Number(value).toFixed(2)} <span className="text-gray-500 text-xs font-normal">{row.currency || 'USD'}</span>
                      </span>
                    )
                  },
                  { 
                    key: 'status', 
                    label: 'Status', 
                    sortable: true, 
                    render: (value) => (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                        value === 'completed'
                          ? 'bg-green-50 text-green-700 border border-green-100'
                          : value === 'pending'
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                          : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {value}
                      </span>
                    )
                  },
                  { 
                    key: 'reference', 
                    label: 'Reference', 
                    sortable: false, 
                    render: (value) => (
                      <span className="text-xs text-gray-500 font-mono truncate max-w-[150px] block" title={value || '-'}>
                        {value || '-'}
                      </span>
                    )
                  }
                ]}
                filters={{
                  searchKeys: ['from_type', 'to_type', 'from_account', 'to_account', 'reference', 'amount', 'status'],
                  selects: [
                    { key: 'from_type', label: 'All From', options: ['wallet', 'mt5'] },
                    { key: 'to_type', label: 'All To', options: ['wallet', 'mt5'] }
                  ],
                  dateKey: 'created_at'
                }}
                pageSize={internalPageSize}
                searchPlaceholder="Search transfers..."
              />
            )}
          </div>

          {/* Wallet Transactions Table */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Wallet Transaction History</h3>
            </div>
            <ProTable
              rows={allTransactions.map(tx => ({
                ...tx,
                sourceTarget: `${tx.source} → ${tx.target}`,
                amountFormatted: `$${Number(tx.amount).toFixed(2)}`
              }))}
              columns={[
                { key: 'created_at', label: 'Time', sortable: true, render: (value) => formatDateTime(value) },
                { key: 'type', label: 'Type', sortable: true, render: (value) => (
                  <span className="capitalize font-medium text-gray-700">{String(value).replace('_', ' ')}</span>
                ) },
                { key: 'sourceTarget', label: 'Source → Target', sortable: false },
                { key: 'amountFormatted', label: 'Amount', sortable: true, render: (value) => <span className="font-bold text-gray-900">{value}</span> },
                { key: 'mt5_account_number', label: 'MT5 Account', sortable: false, render: (value) => value ? <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{value}</span> : '-' },
                { key: 'reference', label: 'Reference', sortable: false, render: (value) => <span className="text-xs text-gray-400 font-mono">{value || '-'}</span> }
              ]}
              filters={{
                searchKeys: ['type', 'source', 'target', 'mt5_account_number', 'reference', 'amount'],
                selects: [
                  { key: 'type', label: 'All Types', options: ['deposit', 'withdrawal', 'transfer_in', 'transfer_out'] },
                  { key: 'source', label: 'All Sources', options: ['wallet', 'mt5'] },
                  { key: 'target', label: 'All Targets', options: ['wallet', 'mt5'] }
                ],
                dateKey: 'created_at'
              }}
              pageSize={pageSize}
              searchPlaceholder="Search transactions..."
            />
          </div>
        </div>
    </div>
  )
}

export default Transfers