import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import StatCard from '../../ui/StatCard';
import Table from '../../ui/Table';
import Button from '../../ui/Button';
import ibService from '../../../services/ibService';
import Toast from '../../../components/Toast';
import {
  Wallet,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Inbox,
  ArrowUpRight,
} from 'lucide-react';

function Withdrawals() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    availableBalance: 0,
    teamBalance: 0,
    clientCount: 0,
    currency: 'USD',
    pendingWithdrawals: 0,
    totalWithdrawn: 0,
    totalCommission: 0
  });
  const [withdrawals, setWithdrawals] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, paymentMethodsRes, ibWithdrawalsRes, commissionRes] = await Promise.all([
          ibService.getDashboardStats(),
          ibService.getWithdrawalPaymentMethods(),
          ibService.getIBWithdrawals(),
          ibService.getCommissionSummary()
        ]);

        if (statsRes.success) {
          const s = statsRes.data.stats;
          // Calculate pending and total from recent withdrawals for now, or just use s if available
          const rawWithdrawals = ibWithdrawalsRes.success ? ibWithdrawalsRes.data : [];
          const pending = rawWithdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + parseFloat(w.amount), 0);
          const total = rawWithdrawals.filter(w => w.status === 'approved').reduce((sum, w) => sum + parseFloat(w.amount), 0);

          setStats({
            ...s,
            pendingWithdrawals: pending,
            totalWithdrawn: total,
            totalCommission: commissionRes.success ? commissionRes.data.total_commission : (s.availableBalance || 0) + total + pending
          });
        }

        if (paymentMethodsRes.success) {
          setPaymentMethods(paymentMethodsRes.data);
        }

        if (ibWithdrawalsRes.success) {
          setWithdrawals(ibWithdrawalsRes.data);
        }
      } catch (error) {
        console.error('Error fetching withdrawal data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: stats.currency || 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ib-600"></div>
      </div>
    );
  }

  const withdrawalHistoryColumns = [
    {
      key: 'created_at',
      label: 'Date',
      render: (value) => (
        <span className="text-gray-900">{new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => (
        <span className="font-semibold text-gray-900">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'payment_method',
      label: 'Method',
      render: (value) => (
        <span className="text-gray-700">{value === 'bank_transfer' ? 'Bank' : 'USDT'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const displayStatus = value.charAt(0).toUpperCase() + value.slice(1);
        const statusColors = {
          'Pending': 'bg-orange-100 text-orange-800',
          'Approved': 'bg-green-100 text-green-800',
          'Rejected': 'bg-red-100 text-red-800',
          'Completed': 'bg-blue-100 text-blue-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[displayStatus] || 'bg-gray-100 text-gray-800'}`}>
            {displayStatus}
          </span>
        );
      },
    },
  ];

  const handleWithdrawalRequest = async () => {
    const amount = parseFloat(withdrawalAmount);

    if (isNaN(amount) || amount <= 0) {
      setToast({ message: "Please enter a valid amount.", type: 'error' });
      return;
    }
    if (!selectedPaymentMethod) {
      setToast({ message: "Please select a payment method.", type: 'error' });
      return;
    }

    // Explicit validation check
    const available = parseFloat(stats.availableBalance);
    if (amount > available) {
      setToast({ message: `Insufficient balance. Available: $${available.toFixed(2)}`, type: 'error' });
      return;
    }

    try {
      setSubmittingWithdrawal(true);
      const res = await ibService.requestWithdrawal(amount, selectedPaymentMethod);
      if (res.success) {
        setToast({ message: "Withdrawal request submitted successfully!", type: 'success' });
        setWithdrawalAmount('');
        setRemarks('');
        // Refresh data
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setToast({ message: res.message || "Failed to submit withdrawal request.", type: 'error' });
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      setToast({ message: "An error occurred. Please try again.", type: 'error' });
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">IB Withdrawals</h1>
        <p className="text-gray-600">Manage your commission withdrawals</p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Commission"
          value={formatCurrency(stats.totalCommission)}
          subtitle="From your trades + referrals"
          icon={Wallet}
          iconBg="bg-blue-100"
          valueColor="text-blue-600"
        />

        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Wallet className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Available Balance</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats.availableBalance)}</p>
              <p className="text-xs text-gray-500">Ready for withdrawal</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Pending Withdrawals</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats.pendingWithdrawals)}</p>
              <p className="text-xs text-gray-500">Awaiting approval</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Total Withdrawn</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats.totalWithdrawn)}</p>
              <p className="text-xs text-gray-500">All time withdrawals</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Request Withdrawal Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <Plus className="w-5 h-5 text-ib-600" />
            <h2 className="text-xl font-bold text-gray-900">Request Withdrawal</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Available: {formatCurrency(stats.availableBalance)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
                >
                  <option value="">Select Method</option>
                  {paymentMethods.map(pm => (
                    <option key={pm.id} value={pm.id}>
                      {pm.payment_method === 'bank_transfer' ? 'Bank' : 'USDT'} - {pm.payment_details.bankName || pm.payment_details.walletAddress}
                    </option>
                  ))}
                  {paymentMethods.length === 0 && (
                    <option disabled>No approved payment methods</option>
                  )}
                </select>
              </div>
            </div>

            {selectedPaymentMethod && paymentMethods.find(pm => pm.id.toString() === selectedPaymentMethod.toString()) && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-sm font-bold text-gray-700 uppercase mb-3">Selected Payment Details</h4>
                {(() => {
                  const pm = paymentMethods.find(p => p.id.toString() === selectedPaymentMethod.toString());
                  if (pm.payment_method === 'bank_transfer') {
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="bg-white p-2 rounded border border-gray-100"><p className="text-gray-500 text-xs">Bank Name</p><p className="font-semibold text-gray-900">{pm.payment_details.bankName}</p></div>
                        <div className="bg-white p-2 rounded border border-gray-100"><p className="text-gray-500 text-xs">Account Holder</p><p className="font-semibold text-gray-900">{pm.payment_details.accountName}</p></div>
                        <div className="bg-white p-2 rounded border border-gray-100"><p className="text-gray-500 text-xs">Account Number</p><p className="font-semibold text-gray-900 font-mono">{pm.payment_details.accountNumber}</p></div>
                        <div className="bg-white p-2 rounded border border-gray-100"><p className="text-gray-500 text-xs">IFSC / SWIFT Code</p><p className="font-semibold text-gray-900">{pm.payment_details.ifscSwiftCode}</p></div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-white p-3 rounded border border-gray-100 text-sm">
                        <p className="text-gray-500 text-xs mb-1">USDT TRC20 Wallet Address</p>
                        <p className="font-mono font-semibold text-gray-900 break-all">{pm.payment_details.walletAddress}</p>
                      </div>
                    );
                  }
                })()}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Details / Remarks
              </label>
              <textarea
                rows="3"
                placeholder="Enter your wallet address or bank account details..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none resize-none"
              />
            </div>

            <Button
              className="w-full"
              icon={ArrowUpRight}
              iconPosition="right"
              onClick={handleWithdrawalRequest}
              disabled={submittingWithdrawal || paymentMethods.length === 0}
            >
              {submittingWithdrawal ? 'Submitting...' : 'Submit Withdrawal Request'}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900">Important Info</h2>
          </div>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-ib-600 mt-1.5 shrink-0" />
              <span>Withdrawals are processed within 24-48 business hours.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-ib-600 mt-1.5 shrink-0" />
              <span>Minimum withdrawal amount is $1.00.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-ib-600 mt-1.5 shrink-0" />
              <span>Ensure your payment details are correct to avoid delays.</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* Withdrawal History Section - Full Width */}
      <Card>
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-gray-500" />
          <h2 className="text-xl font-bold text-gray-900">Withdrawal History</h2>
        </div>

        <Table
          rows={withdrawals}
          columns={withdrawalHistoryColumns}
          pageSize={10}
          searchPlaceholder="Search withdrawals..."
          filters={{
            searchKeys: ['method', 'status'],
            selects: [
              {
                key: 'status',
                label: 'All Statuses',
                options: ['Pending', 'Approved', 'Rejected', 'Completed'],
              },
            ],
            dateKey: 'date',
          }}
        />
      </Card>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default Withdrawals;
