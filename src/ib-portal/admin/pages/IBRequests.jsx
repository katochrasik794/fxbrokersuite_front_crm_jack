import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import StatCard from '../../ui/StatCard';
import Table from '../../ui/Table';
import Button from '../../ui/Button';
import Toast from '../../../components/Toast.jsx';
import WaveLoader from '../../ui/WaveLoader.jsx';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  X,
  Info,
  Check,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get admin JWT for IB admin pages
const getAdminToken = () => localStorage.getItem('adminToken');

function IBRequests() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [activeGroups, setActiveGroups] = useState([]);
  const [masterIbs, setMasterIbs] = useState([]);
  const [approveForm, setApproveForm] = useState({
    ib_type: 'master',
    referrer_ib_id: '',
    group_pip_commissions: {},
    plan_type: 'advanced', // 'normal', 'advanced', or null
    show_commission_structure: true,
  });
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showReferrerModal, setShowReferrerModal] = useState(false);
  const [pendingIbTypeChange, setPendingIbTypeChange] = useState(null);
  const [selectedReferrerForSubIb, setSelectedReferrerForSubIb] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected'

  // Removed redundant fetchRequests in favor of fetchAllData

  // Filter requests by status
  const getRequestsByStatus = (status) => {
    return requests.filter(req => req.status === status);
  };

  // fetchActiveGroups and fetchMasterIbs logic merged into fetchAllData

  // Calculate stats and handle data - fetch all requests
  const [allRequests, setAllRequests] = useState([]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAdminToken();

      // Fetch all required data in parallel
      const [groupsRes, mastersRes, allRes] = await Promise.all([
        fetch(`${API_BASE_URL}/ib-requests/active-groups`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/ib-requests/master-ibs`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/ib-requests/admin`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        if (groupsData.success) {
          setActiveGroups(groupsData.data || []);
          const initialCommissions = {};
          groupsData.data.forEach(group => {
            initialCommissions[group.id] = '';
          });
          setApproveForm(prev => ({
            ...prev,
            group_pip_commissions: initialCommissions,
          }));
        }
      }

      if (mastersRes.ok) {
        const mastersData = await mastersRes.json();
        if (mastersData.success) setMasterIbs(mastersData.data || []);
      }

      if (allRes.ok) {
        const allData = await allRes.json();
        if (allData.success) {
          setAllRequests(allData.data.requests || []);
        }
      } else {
        const errorData = await allRes.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch IB requests');
      }
    } catch (err) {
      console.error('Error fetching IB data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filter requests locally based on tab
  const requests = allRequests.filter(req => req.status === activeTab);

  // Calculate stats
  const stats = {
    pending: allRequests.filter(r => r.status === 'pending').length,
    approved: allRequests.filter(r => r.status === 'approved').length,
    rejected: allRequests.filter(r => r.status === 'rejected').length,
    approvedToday: allRequests.filter(r => {
      if (!r.approvedAt) return false;
      const today = new Date();
      const approvedDate = new Date(r.approvedAt);
      return approvedDate.toDateString() === today.toDateString();
    }).length,
    rejectedToday: allRequests.filter(r => {
      if (!r.reviewedAt || r.status !== 'rejected') return false;
      const today = new Date();
      const reviewedDate = new Date(r.reviewedAt);
      return reviewedDate.toDateString() === today.toDateString();
    }).length,
  };

  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setApproveForm({
      ib_type: request.ibType || 'master',
      referrer_ib_id: request.referrerIbId || '',
      group_pip_commissions: request.groupPipCommissions || {},
      plan_type: request.planType || null,
      show_commission_structure: request.showCommissionStructure ?? true,
    });
    setShowApproveModal(true);
  };

  // Handle reject button click
  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectReason('');
    setShowRejectModal(true);
  };

  // Handle approve submission
  const handleApproveSubmit = async () => {
    if (!selectedRequest) return;

    // Validate referrer for Sub-IB
    if (approveForm.ib_type === 'sub_ib' && !approveForm.referrer_ib_id) {
      setToast({
        message: 'Please select a referrer IB for Sub-IB type',
        type: 'error'
      });
      return;
    }

    try {
      setSubmitting(true);
      const token = getAdminToken();

      // Clean up pip commissions - remove empty values
      const cleanedCommissions = {};
      Object.entries(approveForm.group_pip_commissions).forEach(([groupId, pipValue]) => {
        if (pipValue !== '' && pipValue !== null && pipValue !== undefined) {
          const numValue = parseFloat(pipValue);
          if (!isNaN(numValue)) {
            cleanedCommissions[groupId] = numValue;
          }
        }
      });

      const response = await fetch(`${API_BASE_URL}/ib-requests/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ib_type: approveForm.ib_type,
          referrer_ib_id: approveForm.ib_type === 'sub_ib' ? approveForm.referrer_ib_id : null,
          group_pip_commissions: cleanedCommissions,
          plan_type: approveForm.ib_type === 'master' ? (approveForm.plan_type || 'normal') : 'advanced',
          show_commission_structure: approveForm.show_commission_structure
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to approve request');
      }

      const data = await response.json();
      if (data.success) {
        setToast({
          message: 'IB request approved successfully',
          type: 'success'
        });
        setShowApproveModal(false);
        setSelectedRequest(null);
        fetchAllData(); // Refresh list after approval
        // Refresh all requests for stats
        const token = getAdminToken();
        const allRes = await fetch(`${API_BASE_URL}/ib-requests/admin`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (allRes.ok) {
          const allData = await allRes.json();
          if (allData.success) setAllRequests(allData.data.requests || []);
        }
      } else {
        throw new Error(data.message || 'Failed to approve request');
      }
    } catch (err) {
      console.error('Error approving request:', err);
      setToast({
        message: err.message || 'Failed to approve request',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle reject submission
  const handleRejectSubmit = async () => {
    if (!selectedRequest) return;

    try {
      setSubmitting(true);
      const token = getAdminToken();

      const response = await fetch(`${API_BASE_URL}/ib-requests/${selectedRequest.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejection_reason: rejectReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject request');
      }

      const data = await response.json();
      if (data.success) {
        setToast({
          message: 'IB request rejected successfully',
          type: 'success'
        });
        setShowRejectModal(false);
        setSelectedRequest(null);
        setRejectReason('');
        fetchAllData(); // Refresh list after rejection
        // Refresh all requests for stats
        const token = getAdminToken();
        const allRes = await fetch(`${API_BASE_URL}/ib-requests/admin`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (allRes.ok) {
          const allData = await allRes.json();
          if (allData.success) setAllRequests(allData.data.requests || []);
        }
      } else {
        throw new Error(data.message || 'Failed to reject request');
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
      setToast({
        message: err.message || 'Failed to reject request',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Update pip commission value
  const handlePipChange = (groupId, value) => {
    setApproveForm(prev => ({
      ...prev,
      group_pip_commissions: {
        ...prev.group_pip_commissions,
        [groupId]: value,
      },
    }));
  };

  // Handle status change
  const handleStatusChange = async (requestId, newStatus) => {
    try {
      setSubmitting(true);
      const token = getAdminToken();

      const response = await fetch(`${API_BASE_URL}/ib-requests/${requestId}/status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change status');
      }

      const data = await response.json();
      if (data.success) {
        setToast({
          message: 'Status updated successfully',
          type: 'success'
        });
        fetchAllData(); // Refresh list after status change
        // Refresh all requests for stats
        const token = getAdminToken();
        const allRes = await fetch(`${API_BASE_URL}/ib-requests/admin`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (allRes.ok) {
          const allData = await allRes.json();
          if (allData.success) setAllRequests(allData.data.requests || []);
        }
      } else {
        throw new Error(data.message || 'Failed to change status');
      }
    } catch (err) {
      console.error('Error changing status:', err);
      setToast({
        message: err.message || 'Failed to change status',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle ban/unban
  const handleBanToggle = async (requestId, userId, isBanned) => {
    try {
      setSubmitting(true);
      const token = getAdminToken();

      const response = await fetch(`${API_BASE_URL}/ib-requests/${requestId}/ban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          is_banned: !isBanned
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update ban status');
      }

      const data = await response.json();
      if (data.success) {
        setToast({
          message: isBanned ? 'IB unlocked successfully' : 'IB locked successfully',
          type: 'success'
        });
        fetchAllData(); // Refresh list after ban toggle
      } else {
        throw new Error(data.message || 'Failed to update ban status');
      }
    } catch (err) {
      console.error('Error updating ban status:', err);
      setToast({
        message: err.message || 'Failed to update ban status',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle IB type change
  const handleIbTypeChange = async (requestId, newIbType, currentReferrerIbId, row) => {
    // If changing to sub_ib, open modal to select referrer
    if (newIbType === 'sub_ib' && !currentReferrerIbId) {
      setPendingIbTypeChange({ requestId, newIbType, row });
      setSelectedReferrerForSubIb('');
      setShowReferrerModal(true);
      return;
    }

    // If changing from sub_ib to master, clear referrer
    try {
      setSubmitting(true);
      const token = getAdminToken();

      const response = await fetch(`${API_BASE_URL}/ib-requests/${requestId}/ib-type`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ib_type: newIbType,
          // Only send referrer_ib_id if it's sub_ib, otherwise clear it
          referrer_ib_id: newIbType === 'sub_ib' ? currentReferrerIbId : null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update IB type');
      }

      const data = await response.json();
      if (data.success) {
        setToast({
          message: 'IB type updated successfully',
          type: 'success'
        });
        fetchAllData(); // Refresh list after type change
      } else {
        throw new Error(data.message || 'Failed to update IB type');
      }
    } catch (err) {
      console.error('Error updating IB type:', err);
      setToast({
        message: err.message || 'Failed to update IB type',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle referrer selection for Sub-IB
  const handleSubIbReferrerSubmit = async () => {
    if (!pendingIbTypeChange || !selectedReferrerForSubIb) {
      setToast({
        message: 'Please select a referrer Master IB',
        type: 'error'
      });
      return;
    }

    try {
      setSubmitting(true);
      const token = authService.getToken();

      const response = await fetch(`${API_BASE_URL}/ib-requests/${pendingIbTypeChange.requestId}/ib-type`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ib_type: 'sub_ib',
          referrer_ib_id: selectedReferrerForSubIb
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update IB type');
      }

      const data = await response.json();
      if (data.success) {
        setToast({
          message: 'IB type updated to Sub-IB successfully',
          type: 'success'
        });
        setShowReferrerModal(false);
        setPendingIbTypeChange(null);
        setSelectedReferrerForSubIb('');
        fetchAllData(); // Refresh list after sub-ib referrer update
      } else {
        throw new Error(data.message || 'Failed to update IB type');
      }
    } catch (err) {
      console.error('Error updating IB type:', err);
      setToast({
        message: err.message || 'Failed to update IB type',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Table columns - only essential fields
  const columns = [
    {
      key: 'applicant',
      label: 'Applicant',
      render: (value, row) => (
        <div>
          <div className="font-semibold text-gray-900">{value.name}</div>
          <div className="text-xs text-gray-500">User ID: {value.userId}</div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (value, row) => <span className="text-gray-700">{row.applicant.email}</span>,
    },
    {
      key: 'ibExperience',
      label: 'IB Experience',
      render: (value) => (
        <span className="text-gray-700 text-sm">
          {value || 'N/A'}
        </span>
      ),
    },
    {
      key: 'previousClientsCount',
      label: 'Previous Clients',
      render: (value) => (
        <span className="text-gray-700 text-sm">
          {value || 0}
        </span>
      ),
    },
    {
      key: 'willingToBecomeIB',
      label: 'Willing to Become IB',
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${value === 'yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
          {value === 'yes' ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'willingToSignAgreement',
      label: 'Willing to Sign Agreement',
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${value === 'yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
          {value === 'yes' ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => {
        const statusColors = {
          pending: 'bg-orange-100 text-orange-800 border-orange-300',
          approved: 'bg-green-100 text-green-800 border-green-300',
          rejected: 'bg-red-100 text-red-800 border-red-300',
        };
        return (
          <select
            value={value || 'pending'}
            onChange={(e) => handleStatusChange(row.id, e.target.value)}
            className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[value] || 'bg-gray-100 text-gray-800 border-gray-300'} focus:ring-2 focus:ring-ib-500 focus:outline-none cursor-pointer`}
            disabled={submitting}
            style={{ appearance: 'auto' }}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        );
      },
    },
    {
      key: 'referralCode',
      label: 'Referral Code',
      render: (value, row) => (
        <span className="text-gray-700 text-sm font-mono">
          {row.applicant.referralCode || 'N/A'}
        </span>
      ),
    },
    {
      key: 'referredBy',
      label: 'Referred By',
      render: (value, row) => (
        <span className="text-gray-700 text-sm">
          {row.applicant.referredBy || 'N/A'}
        </span>
      ),
    },
    {
      key: 'ibType',
      label: 'IB Type',
      render: (value, row) => {
        const typeColors = {
          normal: 'bg-blue-100 text-blue-800 border-blue-300',
          master: 'bg-purple-100 text-purple-800 border-purple-300',
          sub_ib: 'bg-orange-100 text-orange-800 border-orange-300',
        };
        const currentValue = value || 'master';
        return (
          <select
            value={currentValue === 'normal' ? 'master' : currentValue}
            onChange={(e) => handleIbTypeChange(row.id, e.target.value, row.referrerIbId, row)}
            className={`px-2 py-1 text-xs font-medium rounded-full border ${typeColors[currentValue] || 'bg-gray-100 text-gray-800 border-gray-300'} focus:ring-2 focus:ring-ib-500 focus:outline-none cursor-pointer`}
            disabled={submitting || row.status !== 'approved'}
            style={{ appearance: 'auto' }}
            title={row.status !== 'approved' ? 'Can only change IB type for approved requests' : ''}
          >
            <option value="master">Master IB</option>
            <option value="sub_ib">Sub-IB</option>
          </select>
        );
      },
    },
    {
      key: 'workingPlansCount',
      label: 'Working Plans',
      render: (value, row) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900">{value || 0}</span>
          <span className={`text-[10px] font-bold uppercase ${row.planType === 'normal' ? 'text-orange-600' : row.planType === 'advanced' ? 'text-purple-600' : 'text-gray-400'}`}>
            {row.planType || 'None'}
          </span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created At',
      render: (value) => (
        <span className="text-gray-700 text-sm">
          {value ? new Date(value).toLocaleString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      label: 'Updated At',
      render: (value) => (
        <span className="text-gray-700 text-sm">
          {value ? new Date(value).toLocaleString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex items-center gap-2 flex-wrap">
          {row.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleApproveClick(row)}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={submitting}
              >
                <Check className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleRejectClick(row)}
                disabled={submitting}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </>
          )}
          {row.status === 'approved' && (
            <Button
              size="sm"
              variant={row.isBanned ? "primary" : "danger"}
              onClick={() => handleBanToggle(row.id, row.userId, row.isBanned)}
              className={row.isBanned ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
              disabled={submitting}
            >
              {row.isBanned ? 'Unlock' : 'Lock'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>IB Portal</span>
        <span>{'>'}</span>
        <span className="text-gray-900 font-medium">IB Requests</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">IB Requests</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Pending Requests"
          value={stats.pending}
          subtitle="Awaiting Review"
          icon={AlertCircle}
          iconBg="bg-orange-100"
          valueColor="text-orange-600"
          onClick={() => setActiveTab('pending')}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />
        <StatCard
          title="Approved Requests"
          value={stats.approved}
          subtitle={`${stats.approvedToday} Today`}
          icon={CheckCircle}
          iconBg="bg-green-100"
          valueColor="text-green-600"
          onClick={() => setActiveTab('approved')}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />
        <StatCard
          title="Rejected Requests"
          value={stats.rejected}
          subtitle={`${stats.rejectedToday} Today`}
          icon={XCircle}
          iconBg="bg-red-100"
          valueColor="text-red-600"
          onClick={() => setActiveTab('rejected')}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'approved'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Approved ({stats.approved})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'rejected'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Rejected ({stats.rejected})
          </button>
        </nav>
      </div>

      {/* Requests Table */}
      <Card className="mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 capitalize">{activeTab} IB Requests</h2>
        {error ? (
          <div className="text-center py-8 text-red-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : (
          <Table
            data={requests}
            columns={columns}
            pageSize={25}
            searchPlaceholder={`Search ${activeTab} requests...`}
            loading={loading}
            filters={{
              searchKeys: ['applicant.name', 'applicant.email', 'applicant.referralCode'],
              dateKey: 'createdAt',
            }}
          />
        )}
      </Card>

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Approve IB Request</h2>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedRequest(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Applicant Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Applicant</label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-semibold text-gray-900">{selectedRequest.applicant.name}</div>
                  <div className="text-sm text-gray-600">{selectedRequest.applicant.email}</div>
                </div>
              </div>

              {/* IB Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">IB Type</label>
                <select
                  value={approveForm.ib_type}
                  onChange={(e) => {
                    setApproveForm(prev => ({
                      ...prev,
                      ib_type: e.target.value,
                      referrer_ib_id: e.target.value === 'sub_ib' ? prev.referrer_ib_id : '',
                    }));
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:ring-2 focus:ring-ib-500 focus:border-ib-500"
                >
                  <option value="master">Master IB</option>
                  <option value="sub_ib">Sub-IB</option>
                </select>
              </div>

              {/* Plan Selection - ONLY FOR MASTERS */}
              {approveForm.ib_type === 'master' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">IB Plan</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setApproveForm(prev => ({ ...prev, plan_type: null }))}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${approveForm.plan_type === null
                        ? 'bg-gray-50 border-gray-500 shadow-md ring-2 ring-gray-200'
                        : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                    >
                      {approveForm.plan_type === null && (
                        <div className="absolute top-2 right-2 text-gray-500">
                          <CheckCircle className="w-5 h-5 fill-current bg-white rounded-full" />
                        </div>
                      )}
                      <span className="font-bold text-gray-900">Unset</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-black rounded uppercase tracking-tighter">
                        User Chooses
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setApproveForm(prev => ({ ...prev, plan_type: 'normal' }))}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${approveForm.plan_type === 'normal'
                        ? 'bg-blue-50 border-blue-500 shadow-md ring-2 ring-blue-200'
                        : 'bg-white border-gray-100 hover:border-blue-200'
                        }`}
                    >
                      {approveForm.plan_type === 'normal' && (
                        <div className="absolute top-2 right-2 text-blue-500">
                          <CheckCircle className="w-5 h-5 fill-current bg-white rounded-full" />
                        </div>
                      )}
                      <span className="font-bold text-gray-900">Normal Plan</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-600 text-[10px] font-black rounded uppercase tracking-tighter">
                        Active
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setApproveForm(prev => ({ ...prev, plan_type: 'advanced' }))}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${approveForm.plan_type === 'advanced'
                        ? 'bg-purple-50 border-purple-500 shadow-md ring-2 ring-purple-200'
                        : 'bg-white border-gray-100 hover:border-purple-200'
                        }`}
                    >
                      {approveForm.plan_type === 'advanced' && (
                        <div className="absolute top-2 right-2 text-purple-500">
                          <CheckCircle className="w-5 h-5 fill-current bg-white rounded-full" />
                        </div>
                      )}
                      <span className="font-bold text-gray-900">Advanced Plan</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-600 text-[10px] font-black rounded uppercase tracking-tighter">
                        Active
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Commission Visibility Toggle */}
              {approveForm.ib_type === 'master' && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Show Commission Structure</h4>
                    <p className="text-xs text-gray-500">Allow MIB to see and create custom link structures</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setApproveForm(prev => ({ ...prev, show_commission_structure: !prev.show_commission_structure }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-offset-2 ${approveForm.show_commission_structure ? 'bg-ib-600 ring-ib-200' : 'bg-gray-200 ring-gray-100'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${approveForm.show_commission_structure ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              )}

              {/* Referrer Info */}
              {approveForm.ib_type === 'sub_ib' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Referrer Info</label>
                  <select
                    value={approveForm.referrer_ib_id}
                    onChange={(e) => setApproveForm(prev => ({ ...prev, referrer_ib_id: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:ring-2 focus:ring-ib-500 focus:border-ib-500"
                    required
                  >
                    <option value="">Select Master IB...</option>
                    {masterIbs.map(ib => (
                      <option key={ib.id} value={ib.id}>
                        {ib.name} ({ib.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* MT5 Groups Pip Configuration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">MT5 Groups Pip Configuration</label>
                <div className="space-y-3">
                  {activeGroups.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No groups found</div>
                  ) : (
                    activeGroups.map(group => (
                      <div key={group.id} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-700">{group.displayName}</div>
                          {group.groupName !== group.displayName && (
                            <div className="text-xs text-gray-500">{group.groupName}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={approveForm.group_pip_commissions[group.id] || ''}
                            onChange={(e) => handlePipChange(group.id, e.target.value)}
                            placeholder="0.0"
                            className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-ib-500 focus:border-ib-500"
                          />
                          <span className="text-sm text-gray-600">pip</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-3 flex items-start gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Pip values are pre-filled from the registration URL. Admin can adjust before approval.</span>
                </div>
              </div>

              {/* Info Banner */}
              <div className="flex items-start gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Approval will set status to Approved and stamp approved_at.</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedRequest(null);
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleApproveSubmit}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Reject IB Request</h2>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:ring-2 focus:ring-ib-500 focus:border-ib-500"
                  placeholder="Enter reason for rejection..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedRequest(null);
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleRejectSubmit}
                  disabled={submitting}
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Referrer Selection Modal for Sub-IB */}
      {showReferrerModal && pendingIbTypeChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Select Referrer Master IB</h2>
              <button
                onClick={() => {
                  setShowReferrerModal(false);
                  setPendingIbTypeChange(null);
                  setSelectedReferrerForSubIb('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Master IB Referrer
                </label>
                <select
                  value={selectedReferrerForSubIb}
                  onChange={(e) => setSelectedReferrerForSubIb(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:ring-2 focus:ring-ib-500 focus:border-ib-500"
                  required
                >
                  <option value="">Select Master IB...</option>
                  {masterIbs.map(ib => (
                    <option key={ib.id} value={ib.id}>
                      {ib.name} ({ib.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowReferrerModal(false);
                    setPendingIbTypeChange(null);
                    setSelectedReferrerForSubIb('');
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubIbReferrerSubmit}
                  disabled={submitting || !selectedReferrerForSubIb}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Update to Sub-IB
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
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

export default IBRequests;

