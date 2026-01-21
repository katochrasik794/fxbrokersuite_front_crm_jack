import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import Card from '../../ui/Card';
import StatCard from '../../ui/StatCard';
import Table from '../../ui/Table';
import Button from '../../ui/Button';
import WaveLoader from '../../ui/WaveLoader.jsx';
import Toast from '../../../components/Toast.jsx';
import {
  Users,
  UserPlus,
  UserCheck,
  CreditCard,
  DollarSign,
  Eye,
  Settings,
  TrendingUp,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

// Helper component for chart filters
const ChartFilterControls = ({ currentFilter, onFilterChange, type }) => (
  <div className="flex items-center gap-1">
    {[
      { label: 'D', value: '1' },
      { label: 'W', value: '7' },
      { label: 'M', value: '30' },
      { label: 'Y', value: 'YTD' },
      { label: 'All', value: 'ALL' },
      { label: 'Custom', value: 'CUSTOM' }
    ].filter(p => {
      if (type === 'processed' && p.value === 'ALL') return false;
      if (type === 'category' && p.value === 'YTD') return false;
      if (type === 'group' && p.value === 'YTD') return false;
      return true;
    }).map((p) => (
      <button
        key={p.value}
        onClick={() => onFilterChange({ ...currentFilter, preset: p.value })}
        className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${currentFilter.preset === p.value
          ? 'bg-ib-600 text-white shadow-sm'
          : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
      >
        {p.label}
      </button>
    ))}
    {currentFilter.preset === 'CUSTOM' && (
      <div className="flex items-center gap-1 scale-[0.85] origin-right ml-1">
        <input
          type="date"
          className="border border-gray-200 rounded px-1 py-0.5 text-[10px] focus:ring-1 focus:ring-ib-500 outline-none"
          value={currentFilter.startDate}
          onChange={(e) => onFilterChange({ ...currentFilter, startDate: e.target.value })}
        />
        <span className="text-[10px] text-gray-400">-</span>
        <input
          type="date"
          className="border border-gray-200 rounded px-1 py-0.5 text-[10px] focus:ring-1 focus:ring-ib-500 outline-none"
          value={currentFilter.endDate}
          onChange={(e) => onFilterChange({ ...currentFilter, endDate: e.target.value })}
        />
      </div>
    )}
  </div>
);

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [keyMetrics, setKeyMetrics] = useState({
    totalUsers: { value: '0' },
    activeIBs: { value: '0' },
    activeUsers30Days: { value: '0' },
    tradingAccounts: { value: '0' },
    totalCommission: {
      value: '$0.00',
      from: 'Loading...',
      breakdown: '',
    },
  });
  const [commissionByAccountGroup, setCommissionByAccountGroup] = useState([]);
  const [commissionChartData, setCommissionChartData] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [commissionByCategory, setCommissionByCategory] = useState({
    Forex: 100,
    Metals: 0,
    Indices: 0,
    Crypto: 0
  });
  const [recentIBRequests, setRecentIBRequests] = useState([]);
  const [recentCommissions, setRecentCommissions] = useState([]);
  const [commissionChartLabels, setCommissionChartLabels] = useState(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);
  const [processedFilter, setProcessedFilter] = useState({ preset: 'YTD', startDate: '', endDate: '' });
  const [categoryFilter, setCategoryFilter] = useState({ preset: 'ALL', startDate: '', endDate: '' });
  const [groupFilter, setGroupFilter] = useState({ preset: '30', startDate: '', endDate: '' });
  const [processedLoading, setProcessedLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!loading) fetchProcessedData();
  }, [processedFilter, loading]);

  useEffect(() => {
    if (!loading) fetchCategoryData();
  }, [categoryFilter, loading]);

  useEffect(() => {
    if (!loading) fetchGroupData();
  }, [groupFilter, loading]);

  const fetchProcessedData = async () => {
    try {
      setProcessedLoading(true);
      const token = localStorage.getItem('adminToken');
      const queryParams = new URLSearchParams();
      queryParams.append('preset', processedFilter.preset);
      if (processedFilter.preset === 'CUSTOM') {
        queryParams.append('startDate', processedFilter.startDate);
        queryParams.append('endDate', processedFilter.endDate);
      }

      const res = await fetch(`${API_BASE_URL}/ib-requests/dashboard/commission-chart?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setCommissionChartData(result.data.data || []);
          setCommissionChartLabels(result.data.labels || []);
        }
      }
    } catch (error) {
      console.error('Error fetching processed data:', error);
    } finally {
      setProcessedLoading(false);
    }
  };

  const fetchCategoryData = async () => {
    try {
      setCategoryLoading(true);
      const token = localStorage.getItem('adminToken');
      const queryParams = new URLSearchParams();
      if (categoryFilter.preset !== 'ALL') {
        queryParams.append('preset', categoryFilter.preset);
        if (categoryFilter.preset === 'CUSTOM') {
          queryParams.append('startDate', categoryFilter.startDate);
          queryParams.append('endDate', categoryFilter.endDate);
        }
      }

      const res = await fetch(`${API_BASE_URL}/ib-requests/dashboard/commission-by-category?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setCommissionByCategory(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching category data:', error);
    } finally {
      setCategoryLoading(false);
    }
  };


  const fetchGroupData = async () => {
    try {
      setGroupLoading(true);
      const token = localStorage.getItem('adminToken');
      const queryParams = new URLSearchParams();
      if (groupFilter.preset !== 'ALL') {
        queryParams.append('preset', groupFilter.preset);
        if (groupFilter.preset === 'CUSTOM') {
          queryParams.append('startDate', groupFilter.startDate);
          queryParams.append('endDate', groupFilter.endDate);
        }
      }

      const res = await fetch(`${API_BASE_URL}/ib-requests/dashboard/commission-by-group?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          const formatted = result.data.map(item => ({
            group: item.group,
            amount: `$${parseFloat(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            percentage: item.percentage
          }));
          setCommissionByAccountGroup(formatted);
        }
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setGroupLoading(false);
    }
  };



  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      // Fetch all dashboard data in parallel
      const [statsRes, chartRes, categoryRes, requestsRes, commissionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/ib-requests/dashboard/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/ib-requests/dashboard/commission-chart`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/ib-requests/dashboard/commission-by-category`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/ib-requests/dashboard/recent-requests?limit=5`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/ib-requests/dashboard/recent-commissions?limit=5`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Process stats
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setKeyMetrics({
            totalUsers: { value: statsData.data.totalUsers.toString() },
            activeIBs: { value: statsData.data.activeIBs.toString() },
            activeUsers30Days: { value: statsData.data.activeUsers30Days.toString() },
            tradingAccounts: { value: statsData.data.tradingAccounts.toString() },
            totalCommission: {
              value: `$${parseFloat(statsData.data.totalCommission).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              from: statsData.data.commissionBreakdown || 'No commission data',
              breakdown: statsData.data.commissionFromIbs > 0 ? `From ${statsData.data.commissionFromIbs} IBs (aggregated)` : '',
            },
          });
        }
      }

      // Process chart data
      if (chartRes.ok) {
        const chartData = await chartRes.json();
        if (chartData.success) {
          setCommissionChartData(chartData.data.data || []);
          setCommissionChartLabels(chartData.data.labels || []);
        }
      }

      // Process commission by category
      if (categoryRes.ok) {
        const categoryData = await categoryRes.json();
        if (categoryData.success) {
          setCommissionByCategory(categoryData.data);
        }
      }

      // Process recent requests
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        if (requestsData.success) {
          setRecentIBRequests(requestsData.data);
        }
      }

      // Process recent commissions
      if (commissionsRes.ok) {
        const commissionsData = await commissionsRes.json();
        if (commissionsData.success) {
          setRecentCommissions(commissionsData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setToast({
        message: 'Failed to load dashboard data',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Commission Processed Chart Data
  const commissionProcessedData = {
    labels: commissionChartLabels,
    datasets: [
      {
        label: 'Commission ($)',
        data: commissionChartData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  // Calculate max value for chart (with padding)
  const maxChartValue = Math.max(...commissionChartData, 100);
  const chartMax = Math.ceil(maxChartValue * 1.2 / 100) * 100; // Round up to nearest 100 with 20% padding

  const commissionProcessedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        borderColor: '#3b82f6',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function (context) {
            return '$' + context.parsed.y.toFixed(2);
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: chartMax || 500,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function (value) {
            return '$' + value.toFixed(0);
          },
          font: { size: 11 },
          stepSize: chartMax > 0 ? Math.ceil(chartMax / 5 / 100) * 100 : 100,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 11 },
        },
      },
    },
  };

  // Commission by Category Chart Data
  const commissionByCategoryData = {
    labels: ['Forex', 'Metals', 'Indices', 'Crypto'],
    datasets: [
      {
        data: [
          parseFloat(commissionByCategory.Forex || 0),
          parseFloat(commissionByCategory.Metals || 0),
          parseFloat(commissionByCategory.Indices || 0),
          parseFloat(commissionByCategory.Crypto || 0)
        ],
        backgroundColor: [
          '#10b981',
          '#f59e0b',
          '#3b82f6',
          '#8b5cf6',
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const commissionByCategoryOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: { size: 12 },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value.toFixed(1)}%`;
          },
        },
      },
    },
  };

  // Recent IB Requests Data - using state
  const recentIBRequestsData = recentIBRequests;

  const ibRequestsColumns = [
    {
      key: 'applicant',
      label: 'Applicant',
      render: (value, row) => (
        <div>
          <div className="font-semibold text-gray-900">{value}</div>
          <div className="text-xs text-gray-600">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'requestedRate',
      label: 'Requested Rate',
      render: (value) => <span className="font-semibold text-gray-900">{value}</span>,
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium capitalize">
          {value}
        </span>
      ),
    },
    {
      key: 'applied',
      label: 'Applied',
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
          {value}
        </span>
      ),
    },
  ];

  // Recent Commission Ledger Data - using state
  const recentCommissionLedgerData = recentCommissions;

  const commissionLedgerColumns = [
    {
      key: 'date',
      label: 'Date',
      render: (value) => <span className="text-gray-900">{value}</span>,
    },
    {
      key: 'ib',
      label: 'IB',
      render: (value) => <span className="font-medium text-gray-900">{value}</span>,
    },
    {
      key: 'symbol',
      label: 'Symbol',
      render: (value) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
          {value}
        </span>
      ),
    },
    {
      key: 'group',
      label: 'Group',
      render: (value) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
          {value}
        </span>
      ),
    },
    {
      key: 'lots',
      label: 'Lots',
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
    {
      key: 'commission',
      label: 'Commission',
      render: (value) => <span className="font-semibold text-green-600">{value}</span>,
    },
  ];

  const handleManageRequests = () => {
    navigate('/admin/ib/ib-requests');
  };

  const handleOpenLedger = () => {
    // Navigate to commission ledger page (if exists)
    navigate('/admin/ib/commission-distribution');
  };

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <WaveLoader message="Loading dashboard data..." />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">IB Dashboard</h1>
        <p className="text-gray-600">Advanced Pip-wise Commission Management System</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Users"
          value={keyMetrics.totalUsers.value}
          icon={Users}
          iconBg="bg-blue-100"
          valueColor="text-blue-600"
        />

        <StatCard
          title="Active IBs"
          value={keyMetrics.activeIBs.value}
          icon={UserPlus}
          iconBg="bg-green-100"
          valueColor="text-green-600"
        />

        <StatCard
          title="Active Users (30 days)"
          value={keyMetrics.activeUsers30Days.value}
          icon={UserCheck}
          iconBg="bg-orange-100"
          valueColor="text-orange-600"
        />

        <StatCard
          title="Trading Accounts"
          value={keyMetrics.tradingAccounts.value}
          icon={CreditCard}
          iconBg="bg-purple-100"
          valueColor="text-purple-600"
        />

        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Total Commission</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{keyMetrics.totalCommission.value}</p>
              <p className="text-xs text-gray-500 mb-1">{keyMetrics.totalCommission.from}</p>
              <p className="text-xs text-gray-600">{keyMetrics.totalCommission.breakdown}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Commission by Account Group */}
      <Card className="relative">
        {groupLoading && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ib-600"></div>
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Commission by Account Group</h2>
          <ChartFilterControls
            type="group"
            currentFilter={groupFilter}
            onFilterChange={setGroupFilter}
          />
        </div>
        {commissionByAccountGroup.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No commission data available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {commissionByAccountGroup.map((item) => (
              <div
                key={item.group}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200"
              >
                <p className="text-sm font-medium text-gray-600 mb-1">{item.group}</p>
                <p className="text-xl font-bold text-gray-900 mb-1">{item.amount}</p>
                <p className="text-xs text-gray-500">{item.percentage} of total</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Commission Processed Chart */}
        <Card className="lg:col-span-2 relative">
          {processedLoading && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ib-600"></div>
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Commission Processed</h2>
            <ChartFilterControls
              type="processed"
              currentFilter={processedFilter}
              onFilterChange={setProcessedFilter}
            />
          </div>
          <div className="h-80">
            {commissionChartData.length > 0 ? (
              <Line data={commissionProcessedData} options={commissionProcessedOptions} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p>No data available for this period</p>
              </div>
            )}
          </div>
        </Card>

        {/* Commission by Category Chart */}
        <Card className="relative">
          {categoryLoading && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ib-600"></div>
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Commission by Category</h2>
            <ChartFilterControls
              type="category"
              currentFilter={categoryFilter}
              onFilterChange={setCategoryFilter}
            />
          </div>
          <div className="h-80">
            {Object.values(commissionByCategory).some(v => v > 0) ? (
              <Doughnut data={commissionByCategoryData} options={commissionByCategoryOptions} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p>No data available</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activity Tables */}
      <div className="space-y-6">
        {/* Recent IB Requests */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent IB Requests</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManageRequests}
            >
              Manage
            </Button>
          </div>
          <Table
            rows={recentIBRequestsData}
            columns={ibRequestsColumns}
            pageSize={10}
            searchPlaceholder="Search requests..."
            filters={{
              searchKeys: ['applicant', 'email', 'type'],
              selects: [
                {
                  key: 'status',
                  label: 'All Statuses',
                  options: ['Pending', 'Approved', 'Rejected'],
                },
                {
                  key: 'type',
                  label: 'All Types',
                  options: ['normal', 'premium'],
                },
              ],
              dateKey: 'date', // Wait, the column is 'date' in the Columns definition? Let me check Columns.
            }}
          />
        </Card>

        {/* Recent Commission Ledger */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Commission Ledger</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenLedger}
            >
              Open Ledger
            </Button>
          </div>
          <Table
            rows={recentCommissionLedgerData}
            columns={commissionLedgerColumns}
            pageSize={10}
            searchPlaceholder="Search ledger..."
            filters={{
              searchKeys: ['ib', 'symbol', 'group'],
              selects: [
                {
                  key: 'group',
                  label: 'All Groups',
                  options: ['Plus', 'Standard', 'Pro', 'Startup', 'Classic', 'Ecn'],
                },
              ],
              dateKey: 'date',
            }}
          />
        </Card>
      </div>

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

export default Dashboard;
