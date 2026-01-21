import React, { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import Card from '../../ui/Card';
import StatCard from '../../ui/StatCard';
import Button from '../../ui/Button';
import Table from '../../ui/Table';
import ibService from '../../../services/ibService';
import {
  Wallet,
  Calendar,
  TrendingUp,
  Users,
  Download,
  BarChart3,
  PieChart,
  Circle,
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

function CommissionAnalytics() {
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState({
    monthlyTrend: [],
    byCategory: []
  });
  const [history, setHistory] = useState([]);

  // Scoped Filtering State (Applied only to charts)
  const [filter, setFilter] = useState({
    preset: '30',
    startDate: '',
    endDate: '',
    granularity: 'day'
  });

  // Initial Load - Fetch all data with default/all-time stats
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        // Stats and Ledger fetch (static unless refreshed)
        // We use 'all' for summary to get the grand totals for StatCards
        const [summaryRes, historyRes] = await Promise.all([
          ibService.getCommissionSummary({ startDate: 'all' }),
          ibService.getCommissionHistory(1, 20)
        ]);

        if (summaryRes.success) {
          setSummary(summaryRes.data);
          // After getting initial page stats, fetch the filtered chart data
          await fetchChartData(true);
        }
        if (historyRes.success) {
          setHistory(historyRes.data);
        }
      } catch (error) {
        console.error('Error fetching initial commission analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Filter Change - Fetch only chart data
  useEffect(() => {
    if (!loading) {
      fetchChartData();
    }
  }, [filter]);

  const fetchChartData = async (isInitial = false) => {
    try {
      if (!isInitial) setChartLoading(true);
      const params = { granularity: filter.granularity };

      if (filter.preset === 'CUSTOM') {
        params.startDate = filter.startDate;
        params.endDate = filter.endDate;
      } else if (filter.preset === 'ALL') {
        params.startDate = 'all';
      } else if (filter.preset === 'YTD') {
        params.startDate = new Date(new Date().getFullYear(), 0, 1).toISOString();
      } else {
        const days = parseInt(filter.preset);
        params.startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      }

      const res = await ibService.getCommissionSummary(params);
      if (res.success) {
        setChartData({
          monthlyTrend: res.data.monthlyTrend,
          byCategory: res.data.byCategory
        });
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      if (!isInitial) setChartLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ib-600"></div>
      </div>
    );
  }

  // Formatting helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Prepare Charts Data
  const monthlyData = {
    labels: chartData.monthlyTrend?.map(t => t.label) || [],
    datasets: [
      {
        label: 'Commission ($)',
        data: chartData.monthlyTrend?.map(t => parseFloat(t.amount)) || [],
        backgroundColor: '#10b981',
        borderRadius: 4,
        hoverBackgroundColor: '#059669',
      },
    ],
  };

  const categoryData = {
    labels: (Array.isArray(chartData.byCategory) ? chartData.byCategory : []).map(c => c.category) || [],
    datasets: [
      {
        data: (Array.isArray(chartData.byCategory) ? chartData.byCategory : []).map(c => parseFloat(c.amount)) || [],
        backgroundColor: [
          '#10b981',
          '#3b82f6',
          '#f59e0b',
          '#8b5cf6',
          '#ec4899',
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const topSymbolsData = summary?.topSymbols?.map(s => ({
    symbol: s.symbol,
    category: s.category,
    lots: s.lots,
    commission: formatCurrency(s.commission),
    trades: s.trades,
  })) || [];

  const ledgerData = history.map(h => ({
    id: h.id,
    date: h.created_at,
    client: h.client_name,
    symbol: h.symbol,
    lots: h.lots,
    commission: formatCurrency(h.commission_amount),
  }));

  const topSymbolsColumns = [
    {
      key: 'symbol',
      label: 'Symbol',
      render: (value) => <span className="font-semibold text-gray-900">{value}</span>,
    },
    {
      key: 'category',
      label: 'Category',
      render: (value) => (
        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
          {value}
        </span>
      ),
    },
    {
      key: 'lots',
      label: 'Lots',
      render: (value) => <span className="text-gray-900">{parseFloat(value).toFixed(2)}</span>,
    },
    {
      key: 'commission',
      label: 'Commission',
      render: (value) => <span className="font-semibold text-green-600">{value}</span>,
    },
    {
      key: 'trades',
      label: 'Trades',
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
  ];

  const ledgerColumns = [
    {
      key: 'date',
      label: 'Date',
      render: (value) => (
        <span className="text-gray-700">{new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      ),
    },
    {
      key: 'client',
      label: 'Client',
      render: (value) => <span className="font-medium text-gray-900">{value}</span>,
    },
    {
      key: 'symbol',
      label: 'Symbol',
      render: (value) => <span className="font-semibold text-gray-900">{value}</span>,
    },
    {
      key: 'lots',
      label: 'Lots',
      render: (value) => <span className="text-gray-700">{parseFloat(value).toFixed(2)}</span>,
    },
    {
      key: 'commission',
      label: 'Commission',
      render: (value) => <span className="font-semibold text-green-600">{value}</span>,
    },
  ];

  const monthlyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        borderColor: '#10b981',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          callback: (value) => '$' + value.toFixed(0),
          font: { size: 11 },
        },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
    },
  };

  const categoryOptions = {
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
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
          },
        },
      },
    },
  };

  const handleExport = () => {
    console.log('Exporting ledger data...');
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Commission Analytics</h1>
        <p className="text-gray-600">Performance insights and network-wide commission breakdowns</p>
      </div>

      {/* Summary Statistics - STATIC */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Commission"
          value={formatCurrency(summary?.total_commission || 0)}
          subtitle="All-time earned"
          icon={Wallet}
          iconBg="bg-green-100"
          valueColor="text-green-600"
        />

        <StatCard
          title="This Month"
          value={formatCurrency(summary?.this_month || 0)}
          subtitle="Current month commission"
          icon={Calendar}
          iconBg="bg-blue-100"
          valueColor="text-blue-600"
        />

        <StatCard
          title="Avg Daily"
          value={formatCurrency((summary?.this_month || 0) / 30)}
          subtitle="Estimated daily average"
          icon={TrendingUp}
          iconBg="bg-cyan-100"
          valueColor="text-cyan-600"
        />

        <StatCard
          title="Active Clients"
          value={summary?.active_clients || 0}
          subtitle="Network clients trading"
          icon={Users}
          iconBg="bg-orange-100"
          valueColor="text-orange-600"
        />
      </div>

      {/* Visual Trends Section - FILTERED */}
      <div className="space-y-4">
        {/* Scoped Filter Bar Card - Localized here */}
        <Card className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
            {[
              { label: 'Today', value: '1' },
              { label: '7 Days', value: '7' },
              { label: '30 Days', value: '30' },
              { label: 'This Year', value: 'YTD' },
              { label: 'All Time', value: 'ALL' },
              { label: 'Custom', value: 'CUSTOM' }
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setFilter(prev => ({ ...prev, preset: p.value }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filter.preset === p.value
                  ? 'bg-ib-600 text-white shadow-md'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {filter.preset === 'CUSTOM' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filter.startDate}
                  onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ib-500 outline-none"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={filter.endDate}
                  onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ib-500 outline-none"
                />
              </div>
            )}

            <select
              value={filter.granularity}
              onChange={(e) => setFilter(prev => ({ ...prev, granularity: e.target.value }))}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white focus:ring-2 focus:ring-ib-500 outline-none"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
        </Card>

        {/* Charts Container with Local Loading Overlay */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
          {chartLoading && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ib-600"></div>
            </div>
          )}

          {/* Monthly Commission Trend Chart */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Monthly Commission Trend</h2>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1">
                <Circle className="w-2 h-2 fill-green-600" />
                Live Data
              </span>
            </div>
            <div className="h-80">
              {chartData.monthlyTrend?.length > 0 ? (
                <Bar data={monthlyData} options={monthlyOptions} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                  <BarChart3 className="w-12 h-12 opacity-20" />
                  <p>No activity found for this period</p>
                  <p className="text-xs">0.00 - 0.00</p>
                </div>
              )}
            </div>
          </Card>

          {/* Commission by Category Chart */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Commission by Category</h2>
            <div className="h-48 sm:h-64 lg:h-80">
              {chartData.byCategory?.length > 0 ? (
                <Doughnut data={categoryData} options={categoryOptions} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                  <PieChart className="w-12 h-12 opacity-20" />
                  <p>No data</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Detailed Data Tables - STATIC */}
      <div className="grid grid-cols-1 gap-6">
        {/* Top Symbols */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Top Symbols</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
              <Calendar className="w-4 h-4" />
              Cumulative (All Time)
            </div>
          </div>
          <Table
            rows={topSymbolsData}
            columns={topSymbolsColumns}
            pageSize={5}
            searchPlaceholder="Search symbols..."
            filters={{
              searchKeys: ['symbol', 'category'],
            }}
          />
        </Card>

        {/* Recent Commission Ledger */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Commission Ledger</h2>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleExport}
            >
              Export
            </Button>
          </div>
          <Table
            rows={ledgerData}
            columns={ledgerColumns}
            pageSize={5}
            searchPlaceholder="Search ledger..."
            filters={{
              searchKeys: ['client', 'symbol'],
              dateKey: 'date',
            }}
          />
        </Card>
      </div>

      {/* Info Note */}
      <Card className="bg-blue-50 border-l-4 border-blue-500">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900 mb-1">Commission Analytics Note</p>
            <p className="text-xs text-blue-800 leading-relaxed">
              Commission analytics provides insights into the entire referral network's performance. Trend data is localized to your selected filter, while summary metrics reflect all-time performance.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default CommissionAnalytics;
