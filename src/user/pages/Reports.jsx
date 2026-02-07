import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Download } from 'lucide-react'
import authService from '../../services/auth.js'
import ProTable from '../../admin/components/ProTable.jsx'
import PageHeader from '../components/PageHeader.jsx'

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || 'https://fxbrokersuite-back-crm-jack.onrender.com/api';

function Reports() {
  const navigate = useNavigate()
  const [selectedReport, setSelectedReport] = useState('')
  const [openInNewTab, setOpenInNewTab] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [mt5Transactions, setMt5Transactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMt5, setLoadingMt5] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState('')
  const [mt5Accounts, setMt5Accounts] = useState([])
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [downloadingExcel, setDownloadingExcel] = useState(false)
  const [downloadingTransactionPDF, setDownloadingTransactionPDF] = useState(false)
  const [downloadingTransactionExcel, setDownloadingTransactionExcel] = useState(false)

  const reportOptions = [
    { value: '', label: 'Please select a report' },
    { value: 'account-statement-mt5', label: 'Account Statement - MT5' },
    { value: 'transaction-history', label: 'Transaction History' }
  ]

  // Fetch MT5 accounts
  useEffect(() => {
    const fetchMt5Accounts = async () => {
      try {
        const token = authService.getToken()
        if (!token) return

        const response = await fetch(`${API_BASE_URL}/accounts`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()
        if (data.success) {
          const all = Array.isArray(data.data) ? data.data : []
          const mt5 = all.filter(
            (acc) => (acc.platform || '').toUpperCase() === 'MT5'
          )
          setMt5Accounts(mt5)
        }
      } catch (error) {
        console.error('Error fetching MT5 accounts:', error)
      }
    }

    fetchMt5Accounts()
  }, [])

  useEffect(() => {
    if (selectedReport === 'transaction-history') {
      fetchTransactionHistory()
      setMt5Transactions([])
    } else if (selectedReport === 'account-statement-mt5') {
      fetchMt5AccountStatement()
      setTransactions([])
    } else {
      setTransactions([])
      setMt5Transactions([])
    }
  }, [selectedReport, selectedAccount])

  const fetchTransactionHistory = async () => {
    try {
      setLoading(true)
      const token = authService.getToken()
      const response = await fetch(`${API_BASE_URL}/reports/transaction-history?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTransactions(data.data.transactions || [])
        }
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMt5AccountStatement = async () => {
    try {
      setLoadingMt5(true)
      const token = authService.getToken()
      const url = `${API_BASE_URL}/reports/mt5-account-statement?limit=1000${selectedAccount ? `&accountNumber=${selectedAccount}` : ''}`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMt5Transactions(data.data.transactions || [])
        }
      }
    } catch (error) {
      console.error('Error fetching MT5 account statement:', error)
    } finally {
      setLoadingMt5(false)
    }
  }

  const handleOpenInNewTab = () => {
    if (openInNewTab && selectedReport) {
      const url = `/user/reports?report=${selectedReport}${selectedAccount ? `&account=${selectedAccount}` : ''}`
      window.open(url, '_blank')
    }
  }

  const handleDownloadPDF = async () => {
    if (downloadingPDF) return // Prevent multiple clicks
    
    setDownloadingPDF(true)
    try {
      const token = authService.getToken()
      if (!token) {
        alert('Please login to download reports')
        return
      }

      const url = `${API_BASE_URL}/reports/mt5-account-statement/download/pdf${selectedAccount ? `?accountNumber=${encodeURIComponent(selectedAccount)}` : ''}`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      // Check if response is actually a PDF
      if (!response.ok) {
        // Try to get error message
        const errorData = await response.json().catch(() => ({ error: 'Failed to download PDF' }))
        throw new Error(errorData.error || errorData.message || 'Failed to download PDF')
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/pdf') && !contentType.includes('pdf')) {
        // If not PDF, try to get error message
        const text = await response.text()
        try {
          const errorData = JSON.parse(text)
          throw new Error(errorData.error || errorData.message || 'Invalid response format')
        } catch {
          throw new Error('Invalid response format. Expected PDF file.')
        }
      }

      const blob = await response.blob()
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty')
      }

      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `MT5_Account_Statement_${selectedAccount || 'All'}_${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      
      // Clean up after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(a)
      }, 100)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert(error.message || 'Failed to download PDF. Please try again.')
    } finally {
      setDownloadingPDF(false)
    }
  }

  const handleDownloadExcel = async () => {
    if (downloadingExcel) return // Prevent multiple clicks
    
    setDownloadingExcel(true)
    try {
      const token = authService.getToken()
      if (!token) {
        alert('Please login to download reports')
        return
      }

      const url = `${API_BASE_URL}/reports/mt5-account-statement/download/excel${selectedAccount ? `?accountNumber=${encodeURIComponent(selectedAccount)}` : ''}`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      // Check if response is actually an Excel file
      if (!response.ok) {
        // Try to get error message
        const errorData = await response.json().catch(() => ({ error: 'Failed to download Excel' }))
        throw new Error(errorData.error || errorData.message || 'Failed to download Excel')
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('spreadsheet') && !contentType.includes('excel') && !contentType.includes('xlsx') && !contentType.includes('application/vnd')) {
        // If not Excel, try to get error message
        const text = await response.text()
        try {
          const errorData = JSON.parse(text)
          throw new Error(errorData.error || errorData.message || 'Invalid response format')
        } catch {
          throw new Error('Invalid response format. Expected Excel file.')
        }
      }

      const blob = await response.blob()
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty')
      }

      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `MT5_Account_Statement_${selectedAccount || 'All'}_${Date.now()}.xlsx`
      document.body.appendChild(a)
      a.click()
      
      // Clean up after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(a)
      }, 100)
    } catch (error) {
      console.error('Error downloading Excel:', error)
      alert(error.message || 'Failed to download Excel. Please try again.')
    } finally {
      setDownloadingExcel(false)
    }
  }

  const handleDownloadTransactionHistoryPDF = async () => {
    if (downloadingTransactionPDF) return
    
    setDownloadingTransactionPDF(true)
    try {
      const token = authService.getToken()
      if (!token) {
        alert('Please login to download reports')
        return
      }

      const url = `${API_BASE_URL}/reports/transaction-history/download/pdf`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to download PDF' }))
        throw new Error(errorData.error || errorData.message || 'Failed to download PDF')
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/pdf') && !contentType.includes('pdf')) {
        const text = await response.text()
        try {
          const errorData = JSON.parse(text)
          throw new Error(errorData.error || errorData.message || 'Invalid response format')
        } catch {
          throw new Error('Invalid response format. Expected PDF file.')
        }
      }

      const blob = await response.blob()
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty')
      }

      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `Transaction_History_${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(a)
      }, 100)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert(error.message || 'Failed to download PDF. Please try again.')
    } finally {
      setDownloadingTransactionPDF(false)
    }
  }

  const handleDownloadTransactionHistoryExcel = async () => {
    if (downloadingTransactionExcel) return
    
    setDownloadingTransactionExcel(true)
    try {
      const token = authService.getToken()
      if (!token) {
        alert('Please login to download reports')
        return
      }

      const url = `${API_BASE_URL}/reports/transaction-history/download/excel`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to download Excel' }))
        throw new Error(errorData.error || errorData.message || 'Failed to download Excel')
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('spreadsheet') && !contentType.includes('excel') && !contentType.includes('xlsx') && !contentType.includes('application/vnd')) {
        const text = await response.text()
        try {
          const errorData = JSON.parse(text)
          throw new Error(errorData.error || errorData.message || 'Invalid response format')
        } catch {
          throw new Error('Invalid response format. Expected Excel file.')
        }
      }

      const blob = await response.blob()
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty')
      }

      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `Transaction_History_${Date.now()}.xlsx`
      document.body.appendChild(a)
      a.click()
      
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(a)
      }, 100)
    } catch (error) {
      console.error('Error downloading Excel:', error)
      alert(error.message || 'Failed to download Excel. Please try again.')
    } finally {
      setDownloadingTransactionExcel(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatAmount = (amount, currency = 'USD') => {
    return `${currency} ${parseFloat(amount || 0).toFixed(2)}`
  }

  // Prepare MT5 transactions data for Datatable
  const mt5TableData = mt5Transactions.map((tx) => ({
    id: tx.id,
    dateTime: tx.createdAt,
    type: tx.type,
    description: tx.description,
    amount: tx.amount,
    currency: tx.currency || 'USD',
    status: tx.status || 'completed',
    account: tx.mt5AccountId
  }))

  // Prepare transaction history data for Datatable
  const transactionTableData = transactions.map((tx) => ({
    id: tx.id,
    date: tx.createdAt,
    type: tx.type,
    description: tx.description,
    amount: tx.amount,
    currency: tx.currency || 'USD',
    status: tx.status || 'completed',
    account: tx.mt5AccountId || tx.walletNumber || tx.accountNumber || '-'
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileText}
        title="Reports"
        subtitle="View and download your transaction history and MT5 account statements."
      />

      {/* Main Content Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 mb-8">
            {/* Report Selection Dropdown */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Report Type</label>
              <div className="relative">
                <select
                  value={selectedReport}
                  onChange={(e) => setSelectedReport(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none text-gray-900"
                >
                  {reportOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Account Selection for MT5 Statement */}
            {selectedReport === 'account-statement-mt5' && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Account</label>
                <div className="relative">
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none text-gray-900"
                  >
                    <option value="">All MT5 Accounts</option>
                    {mt5Accounts.map((acc) => (
                      <option key={acc.id} value={acc.account_number}>
                        {acc.account_number} - {acc.account_type || 'Standard'}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Open in New Tab Checkbox */}
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={openInNewTab}
                    onChange={(e) => setOpenInNewTab(e.target.checked)}
                    className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-md checked:bg-blue-600 checked:border-blue-600 transition-all"
                  />
                  <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">Open in a new tab</span>
              </label>
              
              {openInNewTab && selectedReport && (
                <button
                  onClick={handleOpenInNewTab}
                  className="ml-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors text-sm font-semibold flex items-center gap-2"
                >
                  Open Now
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* MT5 Account Statement Datatable */}
          {selectedReport === 'account-statement-mt5' && (
            <div className="space-y-4">
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloadingPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-semibold disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {downloadingPDF ? 'Downloading...' : 'Download PDF'}
                </button>
                <button
                  onClick={handleDownloadExcel}
                  disabled={downloadingExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors text-sm font-semibold disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {downloadingExcel ? 'Downloading...' : 'Download Excel'}
                </button>
              </div>
              <ProTable
                loading={loadingMt5}
                title="MT5 Account Statement"
                rows={mt5TableData}
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
                    key: 'type',
                    label: 'Type',
                    sortable: true,
                    render: (value) => (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${value === 'deposit'
                          ? 'bg-green-50 text-green-700 border border-green-100'
                          : value === 'withdrawal'
                            ? 'bg-red-50 text-red-700 border border-red-100'
                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                        {value}
                      </span>
                    )
                  },
                  {
                    key: 'description',
                    label: 'Description',
                    sortable: false,
                    render: (value) => (
                      <span className="truncate max-w-xs block text-gray-600" title={value}>
                        {value}
                      </span>
                    )
                  },
                  {
                    key: 'amount',
                    label: 'Amount',
                    sortable: true,
                    render: (value, row) => (
                      <div className={`text-right font-semibold ${
                        row.type === 'deposit' ? 'text-green-600' : 
                        row.type === 'withdrawal' ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {value ? `${row.currency} ${Number(value).toFixed(2)}` : '-'}
                      </div>
                    )
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    sortable: true,
                    render: (value) => (
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${value === 'completed' || value === 'approved'
                          ? 'bg-green-50 text-green-700 border border-green-100'
                          : value === 'pending'
                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                            : value === 'cancelled'
                              ? 'bg-gray-100 text-gray-700 border border-gray-200'
                              : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                        {value || 'Completed'}
                      </span>
                    )
                  },
                  {
                    key: 'account',
                    label: 'Account',
                    sortable: false,
                    render: (value) => (
                      value ? (
                        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg border border-gray-200">
                          {value}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )
                    )
                  }
                ]}
                filters={{
                  searchKeys: ['type', 'description', 'account', 'status'],
                  selects: [
                    { key: 'type', label: 'All Types', options: ['deposit', 'withdrawal'] },
                    { key: 'status', label: 'All Status', options: ['completed', 'approved', 'pending', 'rejected', 'cancelled'] }
                  ],
                  dateKey: 'dateTime'
                }}
                pageSize={10}
                searchPlaceholder="Search transactions..."
              />
            </div>
          )}

          {/* Transaction History Datatable */}
          {selectedReport === 'transaction-history' && (
            <div className="space-y-4">
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleDownloadTransactionHistoryPDF}
                  disabled={downloadingTransactionPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-semibold disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {downloadingTransactionPDF ? 'Downloading...' : 'Download PDF'}
                </button>
                <button
                  onClick={handleDownloadTransactionHistoryExcel}
                  disabled={downloadingTransactionExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors text-sm font-semibold disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {downloadingTransactionExcel ? 'Downloading...' : 'Download Excel'}
                </button>
              </div>
              <ProTable
                title="Transaction History"
                rows={transactionTableData}
                columns={[
                  {
                    key: 'date',
                    label: 'Date',
                    sortable: true,
                    render: (value) => <span className="text-gray-900 font-medium">{formatDate(value)}</span>
                  },
                  {
                    key: 'type',
                    label: 'Type',
                    sortable: true,
                    render: (value) => (
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${value === 'deposit'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : value === 'withdrawal'
                            ? 'bg-red-50 text-red-700 border border-red-100'
                            : 'bg-green-50 text-green-700 border border-green-100'
                        }`}>
                        {value === 'deposit' ? 'Deposit' : value === 'withdrawal' ? 'Withdrawal' : 'Account Created'}
                      </span>
                    )
                  },
                  {
                    key: 'description',
                    label: 'Description',
                    sortable: false,
                    render: (value) => <span className="text-gray-600">{value}</span>
                  },
                  {
                    key: 'amount',
                    label: 'Amount',
                    sortable: true,
                    render: (value, row) => (
                      <div className={`font-semibold ${
                        row.type === 'deposit' ? 'text-blue-600' : 
                        row.type === 'withdrawal' ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {value ? formatAmount(value, row.currency) : '-'}
                      </div>
                    )
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    sortable: true,
                    render: (value) => (
                      value ? (
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${value === 'approved'
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : value === 'pending'
                              ? 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                              : 'bg-red-50 text-red-700 border border-red-100'
                          }`}>
                          {value}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                          Completed
                        </span>
                      )
                    )
                  },
                  {
                    key: 'account',
                    label: 'Account',
                    sortable: false,
                    render: (value) => {
                      if (!value || value === '-') return <span className="text-gray-400">-</span>
                      if (value.startsWith('W-')) {
                        return <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-100">Wallet: {value}</span>
                      }
                      return <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg border border-gray-200">MT5: {value}</span>
                    }
                  }
                ]}
                filters={{
                  searchKeys: ['type', 'description', 'account', 'status'],
                  selects: [
                    { key: 'type', label: 'All Types', options: ['deposit', 'withdrawal', 'account_creation'] },
                    { key: 'status', label: 'All Status', options: ['approved', 'pending', 'rejected', 'completed', 'cancelled'] }
                  ],
                  dateKey: 'date'
                }}
                pageSize={10}
                searchPlaceholder="Search transactions..."
              />
            </div>
          )}
        </div>
    </div>
  )
}

export default Reports
