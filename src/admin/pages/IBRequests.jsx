import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  User,
  Mail,
  Globe,
  Hash,
  Calendar,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import Swal from 'sweetalert2';
import ProTable from '../components/ProTable.jsx';
import Badge from '../components/Badge.jsx';

const BASE = import.meta.env.VITE_BACKEND_API_URL || 'https://fxbrokersuite-back-crm-jack.onrender.com/api';
const IB_ADMIN_URL = import.meta.env.VITE_IB_ADMIN_URL || 'http://localhost:5173';

export default function IBRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE}/admin/ib-requests/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data?.ok) {
        setRequests(data.requests || []);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.error || 'Failed to fetch IB requests'
        });
      }
    } catch (error) {
      console.error('Error fetching IB requests:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch IB requests. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleViewInIBAdmin = async (requestId) => {
    try {
      // Get admin email from localStorage to check if credentials might match
      const adminInfoStr = localStorage.getItem('adminInfo');
      let adminInfo = null;
      try {
        adminInfo = adminInfoStr ? JSON.parse(adminInfoStr) : null;
      } catch (e) {
        // Ignore parse errors
      }

      const adminEmail = adminInfo?.email || adminInfo?.username;

      // Try to get IB admin backend URL from environment or construct it
      const IB_BACKEND_URL = import.meta.env.VITE_IB_BACKEND_URL || IB_ADMIN_URL.replace(/\/$/, '').replace(/\/admin.*$/, '');

      // Try to auto-login if we have credentials
      if (adminEmail) {
        Swal.fire({
          title: 'Redirecting to IB Admin...',
          text: 'Attempting auto-login...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        try {
          // Try to get a cross-login token from CRM backend
          const token = localStorage.getItem('adminToken');
          const crossLoginResponse = await fetch(`${BASE}/admin/ib-requests/cross-login`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: adminEmail })
          });

          const crossLoginData = await crossLoginResponse.json();

          if (crossLoginData?.ok && crossLoginData?.ibToken) {
            // Store IB admin token and redirect
            localStorage.setItem('ibAdminToken', crossLoginData.ibToken);
            const redirectUrl = `${IB_ADMIN_URL}/admin/ib-management/requests?highlight=${requestId}`;

            // Create a hidden form to submit the token to IB admin
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = `${IB_ADMIN_URL}/admin/auth/cross-login`;
            form.target = '_blank';

            const tokenInput = document.createElement('input');
            tokenInput.type = 'hidden';
            tokenInput.name = 'token';
            tokenInput.value = crossLoginData.ibToken;
            form.appendChild(tokenInput);

            const requestInput = document.createElement('input');
            requestInput.type = 'hidden';
            requestInput.name = 'redirect';
            requestInput.value = `/admin/ib-management/requests?highlight=${requestId}`;
            form.appendChild(requestInput);

            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);

            Swal.close();
            return;
          }
        } catch (crossLoginError) {
          console.error('Cross-login error:', crossLoginError);
        }
      }

      // Fallback: redirect to IB admin login page with redirect parameter
      Swal.fire({
        icon: 'info',
        title: 'Redirecting to IB Admin',
        text: adminEmail
          ? 'If your credentials match, you may be automatically logged in. Otherwise, please login manually.'
          : 'Please login to the IB admin panel with your credentials.',
        confirmButtonText: 'Continue',
        didClose: () => {
          const redirectUrl = `${IB_ADMIN_URL}/admin/login?redirect=/admin/ib-management/requests&highlight=${requestId}`;
          window.open(redirectUrl, '_blank');
        }
      });
    } catch (error) {
      console.error('Error redirecting to IB admin:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to redirect to IB admin panel.'
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (value) => `#${value}`
    },
    {
      key: 'full_name',
      label: 'Full Name',
      render: (value) => value || '-'
    },
    {
      key: 'email',
      label: 'Email',
      render: (value) => value || '-'
    },
    {
      key: 'country',
      label: 'Country',
      render: (value) => value || '-'
    },
    {
      key: 'referral_code',
      label: 'Referral Code',
      render: (value) => value ? (
        <span className="font-mono text-sm">{value}</span>
      ) : '-'
    },
    {
      key: 'submitted_at',
      label: 'Submitted',
      render: (value) => formatDate(value)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => handleViewInIBAdmin(row.id)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          View in IB Admin
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">IB Requests</h1>
          <p className="text-sm text-gray-600 mt-1">
            Pending Introducing Broker requests awaiting approval
          </p>
        </div>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pending</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{requests.length}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="text-sm text-gray-600 mt-2">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600">No pending IB requests</p>
          </div>
        ) : (
          <ProTable
            rows={requests}
            columns={columns}
            filters={{
              searchKeys: ['full_name', 'email', 'country', 'referral_code'],
              dateKey: 'submitted_at'
            }}
            pageSize={10}
            searchPlaceholder="Search name, email, country..."
          />
        )}
      </div>
    </div>
  );
}

