import React, { useState, useEffect } from 'react';
import Card from '../../../ui/Card';
import StatCard from '../../../ui/StatCard';
import Table from '../../../ui/Table';
import Button from '../../../ui/Button';
import ibAdminService from '../../../../services/ibAdminService';
import Toast from '../../../../components/Toast';
import WaveLoader from '../../../ui/WaveLoader';
import {
  FileText,
  Clock,
  CheckCircle,
  X,
  Eye,
  Search,
  CreditCard,
  Check,
  Ban
} from 'lucide-react';

function WithdrawalManagement() {
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await ibAdminService.getWithdrawals();
      if (res.success) {
        setWithdrawals(res.data);
      } else {
        setToast({ type: 'error', message: res.message || 'Failed to fetch withdrawals' });
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      setToast({ type: 'error', message: 'An error occurred while fetching withdrawals' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleApprove = async () => {
    if (!pendingAction) return;

    try {
      setSubmitting(true);
      const res = await ibAdminService.approveWithdrawal(pendingAction.id);
      if (res.success) {
        setToast({ type: 'success', message: 'Withdrawal approved successfully' });
        setShowApproveModal(false);
        setPendingAction(null);
        fetchWithdrawals();
      } else {
        setToast({ type: 'error', message: res.message || 'Failed to approve withdrawal' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!pendingAction || !rejectionReason.trim()) return;

    try {
      setSubmitting(true);
      const res = await ibAdminService.rejectWithdrawal(pendingAction.id, rejectionReason);
      if (res.success) {
        setToast({ type: 'success', message: 'Withdrawal rejected' });
        setShowRejectModal(false);
        setPendingAction(null);
        setRejectionReason('');
        fetchWithdrawals();
      } else {
        setToast({ type: 'error', message: res.message || 'Failed to reject withdrawal' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const summaryStats = {
    totalRequests: withdrawals.length,
    pending: {
      count: withdrawals.filter(w => w.status === 'pending').length,
      amount: withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + parseFloat(w.amount), 0)
    },
    approved: {
      count: withdrawals.filter(w => w.status === 'approved').length,
      amount: withdrawals.filter(w => w.status === 'approved').reduce((sum, w) => sum + parseFloat(w.amount), 0)
    },
    rejected: {
      count: withdrawals.filter(w => w.status === 'rejected').length
    }
  };

  const withdrawalColumns = [
    {
      key: 'id',
      label: 'Request ID',
      render: (value) => <span className="font-semibold text-gray-900">#{value}</span>,
    },
    {
      key: 'ibUser',
      label: 'IB User',
      render: (value, row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.first_name} {row.last_name}</p>
          <p className="text-xs text-gray-600">ID: {row.user_id}</p>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => <span className="font-semibold text-blue-600">${parseFloat(value).toFixed(2)}</span>,
    },
    {
      key: 'payment_method',
      label: 'Payment Method',
      render: (value, row) => (
        <div>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold mb-1 inline-block">
            {value === 'bank_transfer' ? 'Bank' : 'USDT'}
          </span>
          <button
            className="text-xs text-blue-600 hover:text-blue-700 hover:underline mt-1 flex items-center gap-1"
            onClick={() => handleViewPaymentDetails(row)}
          >
            <Eye className="w-3 h-3" />
            View Details
          </button>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${value === 'approved' ? 'bg-green-100 text-green-800' :
          value === 'pending' ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Requested Date',
      render: (value, row) => (
        <div className="text-xs">
          <p className="text-gray-700 font-medium">Req: {new Date(value).toLocaleDateString()} {new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          {row.approved_at && <p className="text-green-600 text-[10px]">App: {new Date(row.approved_at).toLocaleDateString()} {new Date(row.approved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
          {row.rejected_at && <p className="text-red-600 text-[10px]">Rej: {new Date(row.rejected_at).toLocaleDateString()} {new Date(row.rejected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {row.status === 'pending' && (
            <>
              <button
                className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                title="Approve"
                disabled={submitting}
                onClick={() => {
                  setPendingAction(row);
                  setShowApproveModal(true);
                }}
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                title="Reject"
                disabled={submitting}
                onClick={() => {
                  setPendingAction(row);
                  setShowRejectModal(true);
                }}
              >
                <Ban className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
            title="View Details"
            onClick={() => handleViewPaymentDetails(row)}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleViewPaymentDetails = (row) => {
    setSelectedPayment(row);
    setShowPaymentModal(true);
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setSelectedPayment(null);
  };

  if (loading && withdrawals.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <WaveLoader />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">IB Withdrawal Management</h1>
        <p className="text-gray-600">Review and manage IB commission withdrawal requests</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={summaryStats.totalRequests.toString()}
          icon={FileText}
          iconBg="bg-blue-100"
          valueColor="text-blue-600"
        />

        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Pending</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{summaryStats.pending.count}</p>
              <p className="text-xs text-gray-500">${summaryStats.pending.amount.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Approved</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{summaryStats.approved.count}</p>
              <p className="text-xs text-gray-500">${summaryStats.approved.amount.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <X className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Rejected</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{summaryStats.rejected.count}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Withdrawal Requests Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Withdrawal Requests</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
            />
          </div>
        </div>

        <Table
          rows={withdrawals.filter(w =>
            (w.first_name + ' ' + w.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
            w.email.toLowerCase().includes(searchTerm.toLowerCase())
          )}
          columns={withdrawalColumns}
          pageSize={25}
          searchPlaceholder="Search requests..."
          filters={{
            searchKeys: ['first_name', 'last_name', 'email', 'payment_method'],
            selects: [
              {
                key: 'status',
                label: 'All Statuses',
                options: ['approved', 'pending', 'rejected'],
              },
              {
                key: 'payment_method',
                label: 'All Payment Methods',
                options: ['bank_transfer', 'usdt_trc20'],
              },
            ],
            dateKey: 'created_at',
          }}
        />
      </Card>

      {/* Approved Withdrawals History */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Approved Withdrawals History</h2>
        <Table
          rows={withdrawals.filter(w => w.status === 'approved')}
          columns={withdrawalColumns.filter(col => col.key !== 'actions')}
          pageSize={10}
          searchPlaceholder="Search history..."
          filters={{
            searchKeys: ['first_name', 'last_name', 'email', 'payment_method'],
            dateKey: 'created_at',
          }}
        />
      </Card>

      {/* Rejected Withdrawals History */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 text-red-600">Rejected Withdrawals History</h2>
        <Table
          rows={withdrawals.filter(w => w.status === 'rejected')}
          columns={withdrawalColumns.filter(col => col.key !== 'actions')}
          pageSize={10}
          searchPlaceholder="Search history..."
          filters={{
            searchKeys: ['first_name', 'last_name', 'email', 'payment_method'],
            dateKey: 'created_at',
          }}
        />
      </Card>

      {/* Approve Modal */}
      {showApproveModal && pendingAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4 text-green-600">
                <CheckCircle className="w-8 h-8" />
                <h3 className="text-xl font-bold">Approve Withdrawal</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to approve the withdrawal of <span className="font-bold text-gray-900">${parseFloat(pendingAction.amount).toFixed(2)}</span> for <span className="font-bold text-gray-900">{pendingAction.first_name} {pendingAction.last_name}</span>?
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowApproveModal(false)}>Cancel</Button>
                <Button variant="success" onClick={handleApprove} disabled={submitting}>
                  {submitting ? 'Approving...' : 'Yes, Approve'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && pendingAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4 text-red-600">
                <Ban className="w-8 h-8" />
                <h3 className="text-xl font-bold">Reject Withdrawal</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Please enter a reason for rejecting this withdrawal for <span className="font-bold text-gray-900">{pendingAction.first_name} {pendingAction.last_name}</span>.
              </p>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none mb-6 min-h-[100px]"
                placeholder="Reason for rejection (e.g. Invalid payment details)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}>Cancel</Button>
                <Button variant="danger" onClick={handleReject} disabled={submitting || !rejectionReason.trim()}>
                  {submitting ? 'Rejecting...' : 'Confirm Reject'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-500" />
                <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method:</label>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  {selectedPayment.payment_method === 'bank_transfer' ? 'Bank' : 'USDT'}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requested By:</label>
                <p className="text-sm font-semibold text-gray-900">{selectedPayment.first_name} {selectedPayment.last_name}</p>
                <p className="text-xs text-gray-500">{selectedPayment.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Details:</label>
                {selectedPayment.payment_method === 'bank_transfer' && selectedPayment.payment_details ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Account Holder</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedPayment.payment_details.accountName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Bank Name</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedPayment.payment_details.bankName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Account Number</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedPayment.payment_details.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">IFSC/SWIFT Code</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedPayment.payment_details.ifscSwiftCode}</p>
                    </div>
                  </div>
                ) : selectedPayment.payment_method === 'usdt_trc20' && selectedPayment.payment_details ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">USDT Wallet Address (TRC20):</p>
                      <p className="text-sm font-mono break-all font-semibold text-gray-900">{selectedPayment.payment_details.walletAddress}</p>
                    </div>
                  </div>
                ) : null}
              </div>

              {selectedPayment.status === 'rejected' && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-xs font-bold text-red-600 mb-1">Rejection Reason:</p>
                  <p className="text-xs text-red-700">{selectedPayment.rejection_reason}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200 gap-3">
              {selectedPayment.status === 'pending' && (
                <>
                  <Button variant="danger" size="sm" onClick={() => {
                    setPendingAction(selectedPayment);
                    setShowRejectModal(true);
                  }} disabled={submitting}>
                    Reject
                  </Button>
                  <Button variant="success" size="sm" onClick={() => {
                    setPendingAction(selectedPayment);
                    setShowApproveModal(true);
                  }} disabled={submitting}>
                    Approve
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={handleCloseModal}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WithdrawalManagement;
