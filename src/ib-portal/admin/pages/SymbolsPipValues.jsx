import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import StatCard from '../../ui/StatCard';
import Table from '../../ui/Table';
import Button from '../../ui/Button';
import WaveLoader from '../../ui/WaveLoader.jsx';
import Toast from '../../../components/Toast.jsx';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Plus,
  Grid,
  Eye,
  Edit,
  Trash2,
  Copy,
  Search,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function SymbolsPipValues() {
  const [summary, setSummary] = useState({
    totalSymbols: 0,
    configuredPipLot: 0,
    overrides: 0,
    categories: [],
  });

  const [symbols, setSymbols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState('Preparing to sync symbols...');
  const [syncStats, setSyncStats] = useState({ current: 0, total: 0, skipped: 0 });
  const [toast, setToast] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  // Add/Edit Symbol State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    symbol: '',
    pair: '',
    group_name: 'Standard',
    category: 'Forex',
    pip_per_lot: 1.0,
    pip_value: 0,
    commission: 0,
    currency: 'USD',
    status: 'active'
  });

  useEffect(() => {
    fetchSummary();
    fetchSymbols();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, categoryFilter, groupFilter, statusFilter, page, pageSize]);

  // Auto-calculate commission whenever pip_per_lot or pip_value changes
  useEffect(() => {
    const pipLot = parseFloat(formData.pip_per_lot) || 0;
    const pipVal = parseFloat(formData.pip_value) || 0;
    setFormData(prev => ({
      ...prev,
      commission: (pipLot * pipVal).toFixed(2)
    }));
  }, [formData.pip_per_lot, formData.pip_value]);

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/ib-requests/symbols-summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setSummary(data.data);
      }
    } catch (error) {
      console.error('Error fetching symbols summary:', error);
    }
  };

  const fetchSymbols = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (searchQuery) params.append('search', searchQuery);
      if (categoryFilter) params.append('category', categoryFilter);
      if (groupFilter) params.append('group_name', groupFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(
        `${API_BASE_URL}/ib-requests/symbols-with-categories?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        throw new Error('Failed to fetch symbols');
      }
      const data = await res.json();
      if (data.success) {
        setSymbols(data.data.rows || []);
        setTotal(data.data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching symbols:', error);
      setToast({
        message: 'Failed to load symbols',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row) => {
    setFormData({
      id: row.id,
      symbol: row.symbol,
      pair: row.pair || '',
      group_name: row.group_name || 'Standard',
      category: row.category || 'Forex',
      pip_per_lot: row.pip_per_lot || 1.0,
      pip_value: row.pip_value || 0,
      commission: row.commission || 0,
      currency: row.currency || 'USD',
      status: row.status || 'active'
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this symbol?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/ib-requests/symbols/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: 'Symbol deleted successfully', type: 'success' });
        fetchSymbols();
        fetchSummary();
      } else {
        throw new Error(data.message || 'Failed to delete symbol');
      }
    } catch (error) {
      console.error('Delete symbol error:', error);
      setToast({ message: error.message, type: 'error' });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const token = localStorage.getItem('adminToken');
      const url = isEditing
        ? `${API_BASE_URL}/ib-requests/symbols/${formData.id}`
        : `${API_BASE_URL}/ib-requests/symbols/add`;

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setToast({
          message: isEditing ? 'Symbol updated successfully' : 'Symbol added successfully',
          type: 'success'
        });
        setIsModalOpen(false);
        fetchSymbols();
        fetchSummary();
      } else {
        throw new Error(data.message || 'Failed to save symbol');
      }
    } catch (error) {
      console.error('Save symbol error:', error);
      setToast({ message: error.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const symbolsColumns = [
    {
      key: 'symbol',
      label: 'Symbol',
      render: (value) => <span className="font-semibold text-gray-900">{value}</span>,
    },
    {
      key: 'pair',
      label: 'Pair/Description',
      render: (value) => <span className="text-gray-700">{value || '-'}</span>,
    },
    {
      key: 'group_name',
      label: 'Type Tag',
      render: (value) => {
        const groupColors = {
          'ECN': 'bg-blue-100 text-blue-800',
          'Standard': 'bg-green-100 text-green-800',
          'Stocks': 'bg-blue-100 text-blue-800',
          'Crypto': 'bg-purple-100 text-purple-800',
          'FX Minor': 'bg-indigo-100 text-indigo-800',
          'Forex': 'bg-indigo-100 text-indigo-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${groupColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {value}
          </span>
        );
      },
    },
    {
      key: 'category',
      label: 'Category',
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
    {
      key: 'pip_per_lot',
      label: 'Pip Value Unit',
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
    {
      key: 'pip_value',
      label: 'Pip Value (USD)',
      render: (value) => <span className="font-semibold text-green-600">${parseFloat(value || 0).toFixed(2)}</span>,
    },
    {
      key: 'commission',
      label: 'Commission',
      render: (value) => <span className="font-semibold text-orange-600">${parseFloat(value || 0).toFixed(2)}</span>,
    },
    {
      key: 'currency',
      label: 'Currency',
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${value === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const newSymbol = { ...row, id: null, symbol: `${row.symbol}_copy` };
              setFormData(newSymbol);
              setIsEditing(false);
              setIsModalOpen(true);
            }}
            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
            title="Copy"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleSyncFromAPI = (accountType) => {
    setSyncLoading(true);
    setShowSyncModal(true);
    setSyncProgress(5);
    setSyncMessage(`Initializing ${accountType} sync...`);

    const token = localStorage.getItem('adminToken');
    const url = `${API_BASE_URL}/ib-requests/symbols/sync?accountType=${accountType}&token=${token}`;

    // Note: EventSource doesn't support custom headers easily, so we pass token in URL 
    // or use FETCH with stream reader if preferred. Let's use EventSource for simplicity.
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.status === 'logging_in') {
        setSyncMessage(`Logging in to MT5 for ${data.accountType || accountType}...`);
        setSyncProgress(10);
      } else if (data.status === 'fetching') {
        setSyncMessage(`Fetching symbols from MT5 for ${data.accountType || accountType}...`);
        setSyncProgress(20);
      } else if (data.status === 'inserting') {
        const { current, total, skipped, symbol, msg } = data;
        setSyncStats({ current, total, skipped });

        // Calculate progress percentage: 20% initial + 80% based on processing
        const perc = Math.min(20 + ((current) / total) * 80, 100);
        setSyncProgress(perc);

        if (msg === 'already found') {
          setSyncMessage(`Symbol already found: ${symbol} (${current} of ${total})`);
        } else {
          setSyncMessage(`Processing: ${symbol} (${current} of ${total})`);
        }
      } else if (data.status === 'success' || data.status === 'completed') {
        setSyncProgress(100);
        setSyncMessage(`Sync completed! ${syncStats.current - syncStats.skipped} inserted, ${syncStats.skipped} were already present.`);
        setToast({
          message: `${accountType} symbols synced successfully`,
          type: 'success',
        });
        fetchSummary();
        fetchSymbols();
        setTimeout(() => {
          setShowSyncModal(false);
          setSyncLoading(false);
          setSyncStats({ current: 0, total: 0, skipped: 0 });
        }, 3000);
        eventSource.close();
      } else if (data.status === 'error' || data.status === 'failed') {
        setToast({
          message: `Sync Error: ${data.message || data.error}`,
          type: 'error',
        });
        setSyncMessage(`Error: ${data.message || data.error}`);
        setTimeout(() => setShowSyncModal(false), 3000);
        setSyncLoading(false);
        eventSource.close();
      }
    };

    eventSource.onerror = (err) => {
      console.error('EventSource error:', err);
      eventSource.close();
      setSyncLoading(false);
      // Don't show toast here as it might trigger on completion sometimes
    };
  };

  const handleAddSymbol = () => {
    setFormData({
      id: null,
      symbol: '',
      pair: '',
      group_name: 'Standard',
      category: 'Forex',
      pip_per_lot: 1.0,
      pip_value: 0,
      commission: 0,
      currency: 'USD',
      status: 'active'
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  if (loading && symbols.length === 0) {
    return (
      <div className="w-full space-y-6">
        <WaveLoader message="Loading symbols & pip values..." />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Symbols & Pip Values</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{summary.totalSymbols.toLocaleString()} symbols loaded</span>
            <span>•</span>
            <span className="text-green-600 font-medium">{summary.configuredPipLot.toLocaleString()} configured</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => handleSyncFromAPI('ECN')}
            icon={RefreshCw}
            size="sm"
            variant="outline"
          >
            {syncLoading ? 'Syncing...' : 'Sync ECN'}
          </Button>
          <Button
            onClick={() => handleSyncFromAPI('Standard')}
            icon={RefreshCw}
            size="sm"
            variant="primary"
          >
            {syncLoading ? 'Syncing...' : 'Sync Standard'}
          </Button>
          <Button
            onClick={handleAddSymbol}
            icon={Plus}
            size="sm"
            variant="dark"
          >
            Add Symbol
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Symbols"
          value={summary.totalSymbols.toLocaleString()}
          icon={TrendingUp}
          iconBg="bg-blue-100"
          valueColor="text-blue-600"
        />

        <StatCard
          title="Configured Pip/Lot"
          value={summary.configuredPipLot.toLocaleString()}
          icon={DollarSign}
          iconBg="bg-green-100"
          valueColor="text-green-600"
        />

        <StatCard
          title="Overrides"
          value={summary.overrides.toString()}
          icon={AlertTriangle}
          iconBg="bg-yellow-100"
          valueColor="text-yellow-600"
        />
      </div>

      {/* Categories Card */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Grid className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Categories</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {summary.categories && summary.categories.length > 0 ? (
            summary.categories.map((c) => (
              <span key={c.category} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                {c.category} ({c.count})
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">No categories yet</span>
          )}
        </div>
      </Card>

      {/* Main Data Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Symbols ({total.toLocaleString()} total)
          </h2>
          <Button variant="outline" size="sm" icon={Eye}>
            Preview
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 w-full md:w-1/3">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setPage(1);
                setSearchQuery(e.target.value);
              }}
              placeholder="Search symbols..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setPage(1);
                setCategoryFilter(e.target.value);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Categories</option>
              {summary.categories &&
                summary.categories.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.category}
                  </option>
                ))}
            </select>
            <select
              value={groupFilter}
              onChange={(e) => {
                setPage(1);
                setGroupFilter(e.target.value);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Groups</option>
              <option value="ECN">ECN</option>
              <option value="Standard">Standard</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table
            rows={symbols}
            columns={symbolsColumns}
            pageSize={pageSize}
            searchPlaceholder="Search symbols..."
            loading={loading}
            hideFilters={true}
            hidePagination={true}
          />
        </div>

        <div className="flex items-center justify-between mt-4 text-sm text-gray-700">
          <span>
            Showing {(total === 0 ? 0 : (page - 1) * pageSize + 1).toLocaleString()}-
            {Math.min(page * pageSize, total).toLocaleString()} of {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              Prev
            </button>
            <span className="font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            >
              Next
            </button>
          </div>
        </div>
      </Card>

      {/* Add/Edit Symbol Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSave}>
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  {isEditing ? 'Edit Symbol' : 'Add New Symbol'}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Symbol
                      </label>
                      <input
                        type="text"
                        required
                        disabled={isEditing}
                        value={formData.symbol}
                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-ib-500 ${isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                          }`}
                        placeholder="e.g. EURUSD.t"
                      />
                      {isEditing && (
                        <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Symbol cannot be changed when editing
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pair / Description
                      </label>
                      <input
                        type="text"
                        value={formData.pair}
                        onChange={(e) => setFormData({ ...formData, pair: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-ib-500"
                        placeholder="e.g. Euro vs US Dollar"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pip Value Unit (Pip/Lot)
                      </label>
                      <div className="flex">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.pip_per_lot}
                          onChange={(e) => setFormData({ ...formData, pip_per_lot: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg outline-none focus:ring-2 focus:ring-ib-500"
                        />
                        <span className="px-3 py-2 bg-gray-50 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-500">
                          pip
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pip Value (USD)
                      </label>
                      <div className="flex">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.pip_value}
                          onChange={(e) => setFormData({ ...formData, pip_value: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg outline-none focus:ring-2 focus:ring-ib-500"
                        />
                        <span className="px-3 py-2 bg-gray-50 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-500">
                          $/pip
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-ib-500"
                      >
                        <option value="Forex">Forex</option>
                        <option value="Metals">Metals</option>
                        <option value="Indices">Indices</option>
                        <option value="Cryptocurrencies">Cryptocurrencies</option>
                        <option value="Stocks">Stocks</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Group Name
                      </label>
                      <select
                        value={formData.group_name}
                        onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-ib-500"
                      >
                        <option value="ECN">ECN</option>
                        <option value="Standard">Standard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-ib-500"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="JPY">JPY</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-ib-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Calculation Preview */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 font-medium">Calculation Summary:</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold uppercase">Preview</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-700">
                        Pip value = {parseFloat(formData.pip_value || 0).toFixed(2)} × {parseFloat(formData.pip_per_lot || 0).toFixed(2)} =
                        <span className="font-bold text-green-700 ml-1">
                          ${(parseFloat(formData.pip_value || 0) * parseFloat(formData.pip_per_lot || 0)).toFixed(2)} per pip (1 lot)
                        </span>
                      </p>
                    </div>
                    <div className="space-y-1 text-right md:text-right">
                      <p className="text-sm text-gray-700">
                        Commission = ({parseFloat(formData.pip_per_lot || 0).toFixed(2)} × {parseFloat(formData.pip_value || 0).toFixed(2)}) =
                        <span className="font-bold text-orange-700 ml-1">
                          ${formData.commission}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Save Symbol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sync Progress Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Syncing Symbols from MT5
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {syncMessage}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>{syncStats.total > 0 ? `${syncStats.current} of ${syncStats.total}` : 'Connecting...'}</span>
              <span>{syncProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
              <div
                className="h-3 bg-ib-500 rounded-full transition-all duration-300"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
            {syncStats.skipped > 0 && (
              <p className="text-xs text-orange-600 mb-2">
                Note: {syncStats.skipped} symbols were already found and skipped.
              </p>
            )}
            <p className="mt-3 text-xs text-gray-400">
              Please keep this page open while we sync symbols from the MT5 API.
            </p>
          </div>
        </div>
      )}

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

export default SymbolsPipValues;
