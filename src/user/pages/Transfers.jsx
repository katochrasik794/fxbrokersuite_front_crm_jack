import { useEffect, useState, useMemo, useRef } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import authService from '../../services/auth.js'
import Toast from '../../components/Toast.jsx'
import PageHeader from '../components/PageHeader.jsx'
import ProTable from '../../admin/components/ProTable.jsx'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [filterTarget, setFilterTarget] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Internal transfers datatable state
  const [internalSearchQuery, setInternalSearchQuery] = useState('')
  const [internalFilterFrom, setInternalFilterFrom] = useState('')
  const [internalFilterTo, setInternalFilterTo] = useState('')
  const [internalDateFrom, setInternalDateFrom] = useState('')
  const [internalDateTo, setInternalDateTo] = useState('')
  const [internalSortConfig, setInternalSortConfig] = useState({ key: null, direction: 'asc' })
  const [internalCurrentPage, setInternalCurrentPage] = useState(1)
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
        setCurrentPage(1) // Reset to first page
      }
    } catch (err) {
      console.error('Reload wallet transactions error:', err)
    }
  }

  // Filter and sort transactions
  const filteredAndSorted = useMemo(() => {
    let filtered = [...allTransactions]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((tx) => {
        return (
          tx.type?.toLowerCase().includes(query) ||
          tx.source?.toLowerCase().includes(query) ||
          tx.target?.toLowerCase().includes(query) ||
          tx.mt5_account_number?.toLowerCase().includes(query) ||
          tx.reference?.toLowerCase().includes(query) ||
          tx.amount?.toString().includes(query)
        )
      })
    }

    // Type filter
    if (filterType) {
      filtered = filtered.filter((tx) => tx.type === filterType)
    }

    // Source filter
    if (filterSource) {
      filtered = filtered.filter((tx) => tx.source === filterSource)
    }

    // Target filter
    if (filterTarget) {
      filtered = filtered.filter((tx) => tx.target === filterTarget)
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      filtered = filtered.filter((tx) => {
        const txDate = new Date(tx.created_at)
        return txDate >= fromDate
      })
    }
    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999) // End of day
      filtered = filtered.filter((tx) => {
        const txDate = new Date(tx.created_at)
        return txDate <= toDate
      })
    }

    // Sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]

        // Handle dates
        if (sortConfig.key === 'created_at') {
          aVal = new Date(aVal).getTime()
          bVal = new Date(bVal).getTime()
        }

        // Handle numbers
        if (sortConfig.key === 'amount') {
          aVal = Number(aVal)
          bVal = Number(bVal)
        }

        // Handle strings
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [allTransactions, searchQuery, filterType, filterSource, filterTarget, dateFrom, dateTo, sortConfig])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize))
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredAndSorted.slice(start, start + pageSize)
  }, [filteredAndSorted, currentPage, pageSize])

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const resetFilters = () => {
    setSearchQuery('')
    setFilterType('')
    setFilterSource('')
    setFilterTarget('')
    setDateFrom('')
    setDateTo('')
    setSortConfig({ key: null, direction: 'asc' })
    setCurrentPage(1)
  }

  // Filter and sort internal transfers
  const filteredAndSortedInternal = useMemo(() => {
    let filtered = [...internalTransfers]

    // Search filter
    if (internalSearchQuery) {
      const query = internalSearchQuery.toLowerCase()
      filtered = filtered.filter((transfer) => {
        return (
          transfer.from_type?.toLowerCase().includes(query) ||
          transfer.to_type?.toLowerCase().includes(query) ||
          transfer.from_account?.toLowerCase().includes(query) ||
          transfer.to_account?.toLowerCase().includes(query) ||
          transfer.reference?.toLowerCase().includes(query) ||
          transfer.amount?.toString().includes(query) ||
          transfer.status?.toLowerCase().includes(query)
        )
      })
    }

    // From type filter
    if (internalFilterFrom) {
      filtered = filtered.filter((transfer) => transfer.from_type === internalFilterFrom)
    }

    // To type filter
    if (internalFilterTo) {
      filtered = filtered.filter((transfer) => transfer.to_type === internalFilterTo)
    }

    // Date range filter
    if (internalDateFrom) {
      const fromDate = new Date(internalDateFrom)
      filtered = filtered.filter((transfer) => {
        const txDate = new Date(transfer.created_at)
        return txDate >= fromDate
      })
    }
    if (internalDateTo) {
      const toDate = new Date(internalDateTo)
      toDate.setHours(23, 59, 59, 999) // End of day
      filtered = filtered.filter((transfer) => {
        const txDate = new Date(transfer.created_at)
        return txDate <= toDate
      })
    }

    // Sorting
    if (internalSortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[internalSortConfig.key]
        let bVal = b[internalSortConfig.key]

        // Handle dates
        if (internalSortConfig.key === 'created_at') {
          aVal = new Date(aVal).getTime()
          bVal = new Date(bVal).getTime()
        }

        // Handle numbers
        if (internalSortConfig.key === 'amount') {
          aVal = Number(aVal)
          bVal = Number(bVal)
        }

        // Handle strings
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        }

        if (aVal < bVal) return internalSortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return internalSortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [internalTransfers, internalSearchQuery, internalFilterFrom, internalFilterTo, internalDateFrom, internalDateTo, internalSortConfig])

  // Internal transfers pagination
  const internalTotalPages = Math.max(1, Math.ceil(filteredAndSortedInternal.length / internalPageSize))
  const paginatedInternalTransfers = useMemo(() => {
    const start = (internalCurrentPage - 1) * internalPageSize
    return filteredAndSortedInternal.slice(start, start + internalPageSize)
  }, [filteredAndSortedInternal, internalCurrentPage, internalPageSize])

  const handleInternalSort = (key) => {
    setInternalSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const resetInternalFilters = () => {
    setInternalSearchQuery('')
    setInternalFilterFrom('')
    setInternalFilterTo('')
    setInternalDateFrom('')
    setInternalDateTo('')
    setInternalSortConfig({ key: null, direction: 'asc' })
    setInternalCurrentPage(1)
  }

  const getInternalSortIcon = (columnKey) => {
    if (internalSortConfig.key !== columnKey) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    return internalSortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-[#00A896]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-[#00A896]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
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

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-[#00A896]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-[#00A896]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
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
    <div className="min-h-screen bg-white px-4 sm:px-8 py-6 overflow-x-hidden">
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

      <div className="w-full">
        <h1
          className="text-left p-4 md:p-6 pb-0 mb-4"
          style={{
            fontFamily: 'Roboto, sans-serif',
            fontSize: '20px',
            color: '#000000',
            fontWeight: '400',
          }}
        >
          Move Funds
        </h1>

        {/* Daily Transfer Limit Indicator */}
        <div className="mb-4 px-4 md:px-6">
          <div className={`rounded-lg p-4 border-2 ${
            limitExceeded 
              ? 'bg-red-50 border-red-300' 
              : dailyTransferUsed > DAILY_TRANSFER_LIMIT * 0.8
              ? 'bg-yellow-50 border-yellow-300'
              : 'bg-green-50 border-green-300'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">
                  Daily Transfer Limit:
                </span>
                <span className={`text-sm font-bold ${
                  limitExceeded ? 'text-red-600' : 'text-gray-900'
                }`}>
                  ${dailyTransferUsed.toFixed(2)} / ${DAILY_TRANSFER_LIMIT.toFixed(2)} USD
                </span>
                <span className="text-xs text-gray-500">
                  ({((dailyTransferUsed / DAILY_TRANSFER_LIMIT) * 100).toFixed(1)}% used)
                </span>
              </div>
              {limitExceeded && remainingTime && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-red-600">
                    Limit Exceeded
                  </span>
                  <span className="text-sm font-mono font-bold text-red-700 bg-red-100 px-3 py-1 rounded">
                    Reset in: {formatTimeRemaining(remainingTime)}
                  </span>
                </div>
              )}
            </div>
            {!limitExceeded && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      dailyTransferUsed > DAILY_TRANSFER_LIMIT * 0.8
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min((dailyTransferUsed / DAILY_TRANSFER_LIMIT) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transfer Form */}
        <div className="w-full pb-4 md:pb-6">
          <div className="bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl p-6 md:p-8" style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)' }}>
            {loading ? (
              <div className="text-center text-gray-500 py-8">Loading...</div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Sync Balance Button */}
                <div className="flex justify-end mb-2">
                  <button
                    type="button"
                    onClick={handleSyncBalances}
                    disabled={syncingBalances}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  >
                    {syncingBalances ? (
                      <>
                        <svg className="w-4 h-4 text-gray-600 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm text-gray-700">Refreshing...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        <span className="text-sm text-gray-700 font-medium">Refresh Balance</span>
                      </>
                    )}
                  </button>
                </div>
                {/* Side-by-side Account Selection */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* From Account - Left */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-6" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)' }}>
                    <label
                      className="block mb-4 text-sm font-semibold text-gray-700"
                      style={{
                        fontFamily: 'Roboto, sans-serif',
                      }}
                    >
                      From Account
                    </label>
                    <div className="relative mb-4">
                      <select
                        value={fromAccount}
                        onChange={(e) => {
                          setFromAccount(e.target.value)
                          setAmount('') // Reset amount when account changes
                        }}
                        className="w-full px-5 py-4 rounded-2xl bg-white appearance-none focus:ring-2 focus:ring-[#00A896] focus:ring-offset-2 outline-none transition-all text-gray-800"
                        style={{ 
                          fontFamily: 'Roboto, sans-serif', 
                          fontSize: '15px',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)'
                        }}
                      >
                        <option value="">Choose an account</option>
                        {wallet && toAccount !== 'wallet' && (
                          <option value="wallet">
                            {wallet.wallet_number} | {Number(wallet.balance || 0).toFixed(2)}{wallet.currency}
                          </option>
                        )}
                        {mt5Accounts
                          .filter((acc) => acc.account_number !== toAccount)
                          .map((acc) => {
                            const balanceData = mt5Balances[acc.account_number]
                            const balance = balanceData ? Number(balanceData.balance || 0) : (acc.balance || 0)
                            return (
                              <option key={acc.id} value={acc.account_number}>
                                {acc.account_number} | {Number(balance).toFixed(2)}{acc.currency || 'USD'}
                              </option>
                            )
                          })}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                    {/* Balance Display */}
                    {fromAccount && (
                      <div className="bg-gradient-to-r from-[#00A896]/10 to-[#00A896]/5 rounded-2xl p-4" style={{ boxShadow: '0 4px 15px rgba(0,168,150,0.15), 0 0 0 1px rgba(0,168,150,0.1), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
                        <div className="text-xs text-gray-500 mb-1 font-medium">Available Balance</div>
                        <div className="text-2xl font-bold text-gray-900">
                          ${availableBalance.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* To Account - Right */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-6" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)' }}>
                    <label
                      className="block mb-4 text-sm font-semibold text-gray-700"
                      style={{
                        fontFamily: 'Roboto, sans-serif',
                      }}
                    >
                      To Account
                    </label>
                    <div className="relative mb-4">
                      <select
                        value={toAccount}
                        onChange={(e) => {
                          setToAccount(e.target.value)
                          setAmount('') // Reset amount when account changes
                        }}
                        className="w-full px-5 py-4 rounded-2xl bg-white appearance-none focus:ring-2 focus:ring-[#00A896] focus:ring-offset-2 outline-none transition-all text-gray-800"
                        style={{ 
                          fontFamily: 'Roboto, sans-serif', 
                          fontSize: '15px',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)'
                        }}
                      >
                        <option value="">Choose an account</option>
                        {wallet && fromAccount !== 'wallet' && (
                          <option value="wallet">
                            {wallet.wallet_number} | {Number(wallet.balance || 0).toFixed(2)}{wallet.currency}
                          </option>
                        )}
                        {mt5Accounts
                          .filter((acc) => acc.account_number !== fromAccount)
                          .map((acc) => {
                            const balanceData = mt5Balances[acc.account_number]
                            const balance = balanceData ? Number(balanceData.balance || 0) : (acc.balance || 0)
                            return (
                              <option key={acc.id} value={acc.account_number}>
                                {acc.account_number} | {Number(balance).toFixed(2)}{acc.currency || 'USD'}
                              </option>
                            )
                          })}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                    {/* Balance Display */}
                    {toAccount && (
                      <div className="bg-gradient-to-r from-[#00A896]/10 to-[#00A896]/5 rounded-2xl p-4" style={{ boxShadow: '0 4px 15px rgba(0,168,150,0.15), 0 0 0 1px rgba(0,168,150,0.1), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
                        <div className="text-xs text-gray-500 mb-1 font-medium">Current Balance</div>
                        <div className="text-2xl font-bold text-gray-900">
                          ${toAccount === 'wallet' 
                            ? (wallet ? Number(wallet.balance).toFixed(2) : '0.00')
                            : (() => {
                                const balanceData = mt5Balances[toAccount]
                                return balanceData ? Number(balanceData.balance || 0).toFixed(2) : '0.00'
                              })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transfer Amount with Range Slider */}
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-6" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)' }}>
                  <label
                    className="block mb-4 text-sm font-semibold text-gray-700"
                    style={{
                      fontFamily: 'Roboto, sans-serif',
                    }}
                  >
                    Transfer Amount
                  </label>
                  
                  {/* Amount Input */}
                  <div className="mb-5">
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
                      className="w-full px-5 py-4 rounded-2xl bg-white focus:ring-2 focus:ring-[#00A896] focus:ring-offset-2 outline-none text-xl font-bold text-gray-900 transition-all"
                      style={{ 
                        fontFamily: 'Roboto, sans-serif',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)'
                      }}
                      min="0"
                      max={availableBalance}
                      step="0.01"
                    />
                  </div>

                  {/* Range Slider */}
                  {fromAccount && availableBalance > 0 && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs text-gray-500 font-medium">
                        <span>$0.00</span>
                        <span>${availableBalance.toFixed(2)}</span>
                      </div>
                      <div className="relative">
                        <input
                          type="range"
                          min="0"
                          max={availableBalance}
                          step="0.01"
                          value={amount || 0}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full h-3 rounded-full appearance-none cursor-pointer"
                          style={{
                            background: availableBalance > 0 
                              ? `linear-gradient(to right, #00A896 0%, #00A896 ${((Number(amount) || 0) / availableBalance) * 100}%, #e5e7eb ${((Number(amount) || 0) / availableBalance) * 100}%, #e5e7eb 100%)`
                              : '#e5e7eb',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1), inset 0 1px 2px rgba(0,0,0,0.1)'
                          }}
                        />
                        <style>{`
                          input[type="range"]::-webkit-slider-thumb {
                            appearance: none;
                            width: 24px;
                            height: 24px;
                            border-radius: 50%;
                            background: #00A896;
                            cursor: pointer;
                            border: 3px solid white;
                            box-shadow: 0 4px 12px rgba(0,168,150,0.4), 0 0 0 1px rgba(0,168,150,0.2), inset 0 1px 2px rgba(0,0,0,0.1);
                            transition: all 0.2s;
                          }
                          input[type="range"]::-webkit-slider-thumb:hover {
                            transform: scale(1.1);
                            box-shadow: 0 6px 16px rgba(0,168,150,0.5), 0 0 0 1px rgba(0,168,150,0.3), inset 0 1px 2px rgba(0,0,0,0.1);
                          }
                          input[type="range"]::-moz-range-thumb {
                            width: 24px;
                            height: 24px;
                            border-radius: 50%;
                            background: #00A896;
                            cursor: pointer;
                            border: 3px solid white;
                            box-shadow: 0 4px 12px rgba(0,168,150,0.4), 0 0 0 1px rgba(0,168,150,0.2), inset 0 1px 2px rgba(0,0,0,0.1);
                            transition: all 0.2s;
                          }
                          input[type="range"]::-moz-range-thumb:hover {
                            transform: scale(1.1);
                            box-shadow: 0 6px 16px rgba(0,168,150,0.5), 0 0 0 1px rgba(0,168,150,0.3), inset 0 1px 2px rgba(0,0,0,0.1);
                          }
                        `}</style>
                      </div>
                      <div className="flex justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => setAmount((availableBalance * 0.25).toFixed(2))}
                          className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-[#00A896] hover:text-white text-gray-600 font-medium transition-all"
                          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)' }}
                        >
                          25%
                        </button>
                        <button
                          type="button"
                          onClick={() => setAmount((availableBalance * 0.5).toFixed(2))}
                          className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-[#00A896] hover:text-white text-gray-600 font-medium transition-all"
                          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)' }}
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          onClick={() => setAmount((availableBalance * 0.75).toFixed(2))}
                          className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-[#00A896] hover:text-white text-gray-600 font-medium transition-all"
                          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)' }}
                        >
                          75%
                        </button>
                        <button
                          type="button"
                          onClick={() => setAmount(availableBalance.toFixed(2))}
                          className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-[#00A896] hover:text-white text-gray-600 font-medium transition-all"
                          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)' }}
                        >
                          100%
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button - Compact */}
                <div className="flex justify-center">
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
                    className="bg-gradient-to-r from-[#e6c200] to-[#d4b000] hover:from-[#d4b000] hover:to-[#c2a000] text-gray-900 font-bold py-3 px-12 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                    style={{
                      fontFamily: 'Roboto, sans-serif',
                      fontSize: '15px',
                      fontWeight: '600',
                      boxShadow: '0 8px 25px rgba(230,194,0,0.4), 0 0 0 1px rgba(212,176,0,0.2), inset 0 1px 0 rgba(255,255,255,0.6)'
                    }}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Transfer Funds'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Transactions Datatable */}
        <div className="w-full pb-8 md:pb-10">
          <ProTable
            title="Wallet Transactions"
            rows={allTransactions.map(tx => ({
              ...tx,
              sourceTarget: `${tx.source} → ${tx.target}`,
              amountFormatted: `$${Number(tx.amount).toFixed(2)}`
            }))}
            columns={[
              { key: 'created_at', label: 'Time', sortable: true, render: (value) => formatDateTime(value) },
              { key: 'type', label: 'Type', sortable: true, render: (value) => <span className="capitalize">{String(value).replace('_', ' ')}</span> },
              { key: 'sourceTarget', label: 'Source → Target', sortable: false },
              { key: 'amountFormatted', label: 'Amount', sortable: true, render: (value) => <span className="text-right font-medium">{value}</span> },
              { key: 'mt5_account_number', label: 'MT5 Account', sortable: false, render: (value) => value || '-' },
              { key: 'reference', label: 'Reference', sortable: false, render: (value) => value || '-' }
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

        {/* Internal Transfers Table */}
        <div className="w-full pb-8 md:pb-10">
          {loadingInternalTransfers ? (
            <div className="p-8 text-center text-gray-500">Loading transfers...</div>
          ) : (
            <ProTable
              title="Internal Transfer Transactions"
              rows={internalTransfers.map(transfer => ({
                ...transfer,
                fromDisplay: (
                  <div>
                    <span className="capitalize font-medium">{transfer.from_type}</span>
                    <br />
                    <span className="text-gray-500 text-xs">{transfer.from_account}</span>
                  </div>
                ),
                toDisplay: (
                  <div>
                    <span className="capitalize font-medium">{transfer.to_type}</span>
                    <br />
                    <span className="text-gray-500 text-xs">{transfer.to_account}</span>
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
                      <span className="font-medium">{new Date(value).toLocaleDateString()}</span>
                      <span className="text-xs text-gray-500">{new Date(value).toLocaleTimeString()}</span>
                    </div>
                  )
                },
                { 
                  key: 'from_type', 
                  label: 'From', 
                  sortable: true, 
                  render: (value, row) => (
                    <div>
                      <span className="capitalize font-medium">{row.from_type}</span>
                      <br />
                      <span className="text-gray-500 text-xs">{row.from_account}</span>
                    </div>
                  )
                },
                { 
                  key: 'to_type', 
                  label: 'To', 
                  sortable: true, 
                  render: (value, row) => (
                    <div>
                      <span className="capitalize font-medium">{row.to_type}</span>
                      <br />
                      <span className="text-gray-500 text-xs">{row.to_account}</span>
                    </div>
                  )
                },
                { 
                  key: 'amount', 
                  label: 'Amount', 
                  sortable: true, 
                  render: (value, row) => (
                    <span className="text-right font-medium whitespace-nowrap">
                      ${Number(value).toFixed(2)} <span className="text-gray-500 text-xs">{row.currency || 'USD'}</span>
                    </span>
                  )
                },
                { 
                  key: 'status', 
                  label: 'Status', 
                  sortable: true, 
                  render: (value) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      value === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : value === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
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
                    <span className="truncate max-w-xs block" title={value || '-'}>
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
      </div>
    </div>
  )
}

export default Transfers
