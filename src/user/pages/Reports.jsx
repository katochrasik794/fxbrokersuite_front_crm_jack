import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import authService from '../../services/auth.js'
import ProTable from '../../admin/components/ProTable.jsx'
import PageHeader from '../components/PageHeader.jsx'

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    <div className="min-h-screen p-4 sm:p-6 overflow-x-hidden" style={{ background: 'linear-gradient(to right, #E5E7EB 0%, #FFFFFF 20%, #FFFFFF 80%, #E5E7EB 100%)' }}>
      <div className="w-full max-w-[95%] mx-auto bg-gray-100 rounded-lg">
        <div className="w-full mx-auto p-4 md:p-6">
          <PageHeader
            icon={FileText}
            title="Reports"
            subtitle="View and download your transaction history and MT5 account statements."
          />

          {/* Main Content Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Report Selection Dropdown */}
              <div className="flex-1">
                <div className="relative">
                  <select
                    value={selectedReport}
                    onChange={(e) => setSelectedReport(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white appearance-none focus:ring-2 focus:ring-[#00A896] focus:border-transparent outline-none"
                    style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', color: selectedReport ? '#000000' : '#6B7280' }}
                  >
                    {reportOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Account Selection for MT5 Statement */}
              {selectedReport === 'account-statement-mt5' && (
                <div className="flex-1">
                  <div className="relative">
                    <select
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white appearance-none focus:ring-2 focus:ring-[#00A896] focus:border-transparent outline-none"
                      style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px' }}
                    >
                      <option value="">All MT5 Accounts</option>
                      {mt5Accounts.map((acc) => (
                        <option key={acc.id} value={acc.account_number}>
                          {acc.account_number} - {acc.account_type || 'Standard'}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Open in New Tab Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="openInNewTab"
                  checked={openInNewTab}
                  onChange={(e) => setOpenInNewTab(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-[#00A896] focus:ring-[#00A896] cursor-pointer"
                />
                <label
                  htmlFor="openInNewTab"
                  className="cursor-pointer"
                  style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', color: '#000000', fontWeight: '400' }}
                >
                  Open in a new tab
                </label>
                {openInNewTab && selectedReport && (
                  <button
                    onClick={handleOpenInNewTab}
                    className="ml-2 px-3 py-1.5 bg-[#00A896] text-white rounded-lg hover:bg-[#008B7A] transition text-sm font-medium"
                  >
                    Open Now
                  </button>
                )}
              </div>
            </div>

            {/* MT5 Account Statement Datatable */}
            {selectedReport === 'account-statement-mt5' && (
              <div className="mt-6">
                <ProTable
                  title="MT5 Account Statement"
                  rows={mt5TableData}
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
                      key: 'type',
                      label: 'Type',
                      sortable: true,
                      render: (value) => (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${value === 'deposit'
                            ? 'bg-green-100 text-green-800'
                            : value === 'withdrawal'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
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
                        <span className="truncate max-w-xs block" title={value}>
                          {value}
                        </span>
                      )
                    },
                    {
                      key: 'amount',
                      label: 'Amount',
                      sortable: true,
                      render: (value, row) => (
                        <div className="text-right font-medium">
                          {value ? `${row.currency} ${Number(value).toFixed(2)}` : '-'}
                        </div>
                      )
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      sortable: true,
                      render: (value) => (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${value === 'completed' || value === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : value === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : value === 'cancelled'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-red-100 text-red-800'
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
                          <span className="font-mono text-xs bg-brand-100 text-brand-900 px-2 py-1 rounded">
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
              <div className="mt-6">
                <ProTable
                  title="Transaction History"
                  rows={transactionTableData}
                  columns={[
                    {
                      key: 'date',
                      label: 'Date',
                      sortable: true,
                      render: (value) => formatDate(value)
                    },
                    {
                      key: 'type',
                      label: 'Type',
                      sortable: true,
                      render: (value) => (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${value === 'deposit'
                            ? 'bg-blue-100 text-blue-800'
                            : value === 'withdrawal'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                          {value === 'deposit' ? 'Deposit' : value === 'withdrawal' ? 'Withdrawal' : 'Account Created'}
                        </span>
                      )
                    },
                    {
                      key: 'description',
                      label: 'Description',
                      sortable: false,
                      render: (value) => value
                    },
                    {
                      key: 'amount',
                      label: 'Amount',
                      sortable: true,
                      render: (value, row) => value ? formatAmount(value, row.currency) : '-'
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      sortable: true,
                      render: (value) => (
                        value ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${value === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : value === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                            {value}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
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
                        if (!value || value === '-') return '-'
                        if (value.startsWith('W-')) {
                          return <span className="text-blue-600">Wallet: {value}</span>
                        }
                        return <span className="text-brand-600">MT5: {value}</span>
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
      </div>
    </div>
  )
}

export default Reports
