// src/admin/pages/AllActions.jsx
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Activity,
  Loader2,
  Filter,
  Search,
  Download,
  Eye,
  RefreshCw,
  Calendar,
  User,
  Server,
  FileText
} from "lucide-react";
import ProTable from "../components/ProTable.jsx";

export default function AllActions() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [actionTypes, setActionTypes] = useState({});
  const [filters, setFilters] = useState({
    system_type: 'all',
    action_type: '',
    action_category: '',
    actor_email: '',
    target_type: '',
    start_date: '',
    end_date: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    total_pages: 0
  });
  const [sortConfig, setSortConfig] = useState({
    sort_by: 'created_at',
    sort_order: 'DESC'
  });

  const BASE = import.meta.env.VITE_BACKEND_API_URL || "https://fxbrokersuite-back-crm-jack.onrender.com/api";

  useEffect(() => {
    loadActions();
    loadStats();
    loadActionTypes();
  }, [filters, pagination.page, sortConfig]);

  const loadActions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        Swal.fire({
          icon: 'error',
          title: 'Authentication Required',
          text: 'Please log in again.',
        }).then(() => {
          window.location.href = '/admin/login';
        });
        return;
      }

      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sort_by: sortConfig.sort_by,
        sort_order: sortConfig.sort_order,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '' && v !== 'all'))
      });

      const response = await axios.get(
        `${BASE}/admin/unified-actions?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.ok) {
        setActions(response.data.actions || []);
        if (response.data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: response.data.pagination.total || 0,
            total_pages: response.data.pagination.total_pages || 0,
            page: response.data.pagination.page || prev.page
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load actions:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to load actions',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `${BASE}/admin/unified-actions/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.ok) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadActionTypes = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `${BASE}/admin/unified-actions/action-types`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.ok) {
        setActionTypes(response.data.action_types || {});
      }
    } catch (error) {
      console.error('Failed to load action types:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSort = (column) => {
    setSortConfig(prev => ({
      sort_by: column,
      sort_order: prev.sort_by === column && prev.sort_order === 'ASC' ? 'DESC' : 'ASC'
    }));
  };

  const getSystemTypeBadge = (systemType) => {
    const badges = {
      'crm_admin': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'CRM Admin' },
      'crm_user': { bg: 'bg-green-100', text: 'text-green-800', label: 'CRM User' },
      'ib_client': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'IB Client' },
      'ib_admin': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'IB Admin' }
    };
    const badge = badges[systemType] || { bg: 'bg-gray-100', text: 'text-gray-800', label: systemType };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const columns = useMemo(() => [
    {
      key: 'created_at',
      label: 'Date & Time',
      sortable: true,
      render: (v) => {
        const date = new Date(v);
        return (
          <div className="text-sm">
            <div className="font-medium">{date.toLocaleDateString()}</div>
            <div className="text-gray-500 text-xs">{date.toLocaleTimeString()}</div>
          </div>
        );
      }
    },
    {
      key: 'system_type',
      label: 'System',
      sortable: false,
      render: (v) => getSystemTypeBadge(v)
    },
    {
      key: 'actor_email',
      label: 'Actor',
      sortable: false,
      render: (v, row) => (
        <div className="text-sm">
          <div className="font-medium">{row.actor_name || v || 'N/A'}</div>
          {v && <div className="text-gray-500 text-xs">{v}</div>}
        </div>
      )
    },
    {
      key: 'action_type',
      label: 'Action',
      sortable: true,
      render: (v, row) => (
        <div className="text-sm">
          <div className="font-medium">{row.action_name || v.replace(/_/g, ' ')}</div>
          <div className="text-gray-500 text-xs">{row.action_category}</div>
        </div>
      )
    },
    {
      key: 'target_identifier',
      label: 'Target',
      sortable: false,
      render: (v, row) => (
        <div className="text-sm">
          {v ? (
            <>
              <div className="font-medium">{v}</div>
              {row.target_type && (
                <div className="text-gray-500 text-xs">{row.target_type}</div>
              )}
            </>
          ) : (
            <span className="text-gray-400">N/A</span>
          )}
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      sortable: false,
      render: (v) => (
        <div className="text-sm text-gray-700 max-w-md truncate" title={v}>
          {v}
        </div>
      )
    },
    {
      key: 'response_status',
      label: 'Status',
      sortable: false,
      render: (v) => {
        if (!v) return <span className="text-gray-400">-</span>;
        const isSuccess = v >= 200 && v < 300;
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {v}
          </span>
        );
      }
    },
    {
      key: 'ip_address',
      label: 'IP Address',
      sortable: false,
      render: (v) => v ? <span className="text-xs font-mono">{v}</span> : <span className="text-gray-400">-</span>
    }
  ], []);

  // Get unique action types and categories for filters
  const systemTypes = ['all', 'crm_admin', 'crm_user', 'ib_client', 'ib_admin'];
  const actionCategories = useMemo(() => {
    const categories = new Set();
    Object.values(actionTypes).forEach(systemActions => {
      systemActions.forEach(action => {
        if (action.action_category) categories.add(action.action_category);
      });
    });
    return Array.from(categories).sort();
  }, [actionTypes]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-neutral-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  All Actions
                </h1>
                <p className="text-gray-600 mt-1">
                  View all actions from CRM Admin, IB Client, and IB Admin systems
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                loadActions();
                loadStats();
              }}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Actions (24h)</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.recent_24h || 0}</p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              {stats.by_system && stats.by_system.map(system => (
                <div key={system.system_type} className="bg-white rounded-lg shadow p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{system.system_type.replace(/_/g, ' ').toUpperCase()}</p>
                      <p className="text-2xl font-bold text-gray-900">{system.count || 0}</p>
                    </div>
                    <Server className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System</label>
              <select
                value={filters.system_type}
                onChange={(e) => handleFilterChange('system_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                {systemTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Systems' : type.replace(/_/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.action_category}
                onChange={(e) => handleFilterChange('action_category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {actionCategories.map(cat => (
                  <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Actor Email</label>
              <input
                type="text"
                value={filters.actor_email}
                onChange={(e) => handleFilterChange('actor_email', e.target.value)}
                placeholder="Search by email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({
                    system_type: 'all',
                    action_type: '',
                    action_category: '',
                    actor_email: '',
                    target_type: '',
                    start_date: '',
                    end_date: ''
                  });
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Actions Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
              <p className="text-gray-600">Loading actions...</p>
            </div>
          ) : actions.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No actions found</p>
            </div>
          ) : (
            <>
              <ProTable
                data={actions}
                columns={columns}
                onSort={handleSort}
                sortConfig={sortConfig}
              />
              
              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} actions
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-1 text-sm">
                      Page {pagination.page} of {pagination.total_pages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page >= pagination.total_pages}
                      className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}






