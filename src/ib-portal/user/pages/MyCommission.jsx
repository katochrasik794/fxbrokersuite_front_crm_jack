import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import Card from '../../ui/Card';
import StatCard from '../../ui/StatCard';
import Table from '../../ui/Table';
import Button from '../../ui/Button';
import ibService from '../../../services/ibService';
import {
  Coins,
  User,
  Users,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Info,
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

function MyCommission() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashRes, summaryRes, historyRes] = await Promise.all([
          ibService.getDashboardStats(),
          ibService.getCommissionSummary(),
          ibService.getCommissionHistory(1, 10)
        ]);

        if (dashRes.success) {
          const allGroups = dashRes.data.stats.groups || [];
          setGroups(allGroups.filter(g => parseFloat(g.rate) > 0));
        }
        if (summaryRes.success) {
          setData(summaryRes.data);
        }
        if (historyRes.success) {
          setHistory(historyRes.data);
        }
      } catch (error) {
        console.error('Error fetching my commission data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ib-600"></div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Commission by Client Data mapping
  const commissionByClientData = history.map(h => ({
    id: h.id,
    client: h.client_name,
    email: 'N/A', // We'd need to fetch more client info for this
    referral: true,
    ibStatus: 'Approved',
    mt5Account: h.mt5_account_id,
    accountGroup: groups.find(g => g.id === h.group_id)?.name || 'N/A',
    tradingPair: h.symbol,
    pipRate: `${h.pip_rate} pip/lot`,
    pipValue: `@$${h.pip_value}/pip`,
    volume: h.lots,
    excludedVolume: h.status === 'excluded' ? { lots: h.lots, trades: 1 } : null,
    commission: formatCurrency(h.commission_amount),
    percentTotal: data?.total_commission > 0 ? ((h.commission_amount / data.total_commission) * 100).toFixed(1) : '0.0',
    createdAt: h.created_at,
    rawCreatedAt: h.created_at
  }));

  const commissionByClientColumns = [
    {
      key: 'client',
      label: 'Client',
      render: (value, row) => (
        <div>
          <div className="font-semibold text-gray-900">{value}</div>
          {row.referral && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
              Referral
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'mt5Account',
      label: 'MT5 Account',
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
      ),
    },
    {
      key: 'accountGroup',
      label: 'Account Group',
      render: (value) => (
        <span className="font-semibold text-gray-900">{value}</span>
      ),
    },
    {
      key: 'tradingPair',
      label: 'Trading Pair',
      render: (value) => (
        <span className="font-semibold text-blue-600">{value}</span>
      ),
    },
    {
      key: 'pipRate',
      label: 'Pip Rate',
      render: (value, row) => (
        <div>
          <span className="text-gray-900">{value}</span>
          <div className="text-xs text-gray-500">({row.pipValue})</div>
        </div>
      ),
    },
    {
      key: 'volume',
      label: 'Volume (Lots)',
      render: (value, row) => (
        <div>
          <span className="font-semibold text-gray-900">{parseFloat(value).toFixed(2)} lots</span>
          {row.excludedVolume && (
            <div className="mt-1 flex items-center gap-1 text-xs text-orange-600">
              <AlertTriangle className="w-3 h-3" />
              <span>Excluded: {parseFloat(row.excludedVolume.lots).toFixed(2)} lots</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'commission',
      label: 'Commission',
      render: (value) => (
        <span className="font-semibold text-gray-900">{value}</span>
      ),
    },
  ];

  const historyColumns = [
    { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
    { key: 'tradingPair', label: 'Pair', render: (v) => <span className="font-bold">{v}</span> },
    { key: 'volume', label: 'Volume', render: (v) => parseFloat(v).toFixed(2) },
    { key: 'commission', label: 'Commission', render: (v) => <span className="text-green-600 font-bold">{v}</span> },
  ];

  // Recent Commission History Data
  const recentCommissionHistoryData = history.map(h => ({
    id: h.id,
    date: new Date(h.created_at).toLocaleDateString(),
    symbol: h.symbol,
    volume: h.lots,
    commission: formatCurrency(h.commission_amount),
    type: h.ib_id === h.client_id ? 'My Trade' : 'Referral Trade',
    rawDate: h.created_at
  }));

  const recentHistoryColumns = [
    {
      key: 'date',
      label: 'Date',
      render: (value) => <span className="text-gray-900">{value}</span>,
    },
    {
      key: 'symbol',
      label: 'Symbol',
      render: (value) => <span className="font-semibold text-blue-600">{value}</span>,
    },
    {
      key: 'volume',
      label: 'Volume',
      render: (value) => <span className="text-gray-900">{parseFloat(value).toFixed(2)}</span>,
    },
    {
      key: 'commission',
      label: 'Commission',
      render: (value) => <span className="font-semibold text-gray-900">{value}</span>,
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${value === 'My Trade' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
          }`}>
          {value}
        </span>
      ),
    },
  ];

  // Monthly Commission Trend Data
  const monthlyData = {
    labels: data?.monthlyTrend?.map(t => t.month) || [],
    datasets: [
      {
        label: 'Commission ($)',
        data: data?.monthlyTrend?.map(t => parseFloat(t.amount)) || [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  const monthlyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: (context) => '$' + context.parsed.y.toFixed(2),
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          callback: (value) => '$' + value.toFixed(2),
          font: { size: 11 },
        },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
    },
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Commission</h1>
        <p className="text-gray-600">Your personal trading commission analytics</p>
      </div>

      {/* My Pip Rate Per Lot */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Pip Rate Per Lot:</h2>
        <div className="flex flex-wrap gap-3">
          {groups.map((g) => (
            <div
              key={g.id}
              className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200"
            >
              <span className="text-sm font-semibold text-gray-700">{g.name}: </span>
              <span className="text-sm font-bold text-gray-900">{parseFloat(g.rate).toFixed(2)}</span>
            </div>
          ))}
          {groups.length === 0 && <p className="text-sm text-gray-500 italic">No commission rates configured.</p>}
        </div>
      </Card>

      {/* Top Row - Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Earnings"
          value={formatCurrency(data?.total_commission || 0)}
          subtitle={`From Trades: ${formatCurrency(data?.total_commission || 0)}`}
          icon={Coins}
          iconBg="bg-blue-100"
          valueColor="text-blue-600"
        />

        <StatCard
          title="My Commission"
          value={formatCurrency(data?.my_commission || 0)}
          subtitle={`${parseFloat(data?.my_lots || 0).toFixed(2)} lots from my trades`}
          icon={User}
          iconBg="bg-green-100"
          valueColor="text-green-600"
        />

        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <Users className="w-5 h-5 text-cyan-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Clients Commission</span>
              </div>
              <p className="text-2xl font-bold text-cyan-600 mb-1">{formatCurrency(data?.client_commission || 0)}</p>
              <p className="text-xs text-gray-500 mb-1">Total volume: {parseFloat(data?.client_lots || 0).toFixed(2)} lots (all clients)</p>
              <p className="text-xs text-orange-600">Commission from approved IB clients only</p>
            </div>
          </div>
        </Card>

        <StatCard
          title="This Month"
          value={formatCurrency(data?.this_month || 0)}
          subtitle={`Avg: ${formatCurrency((data?.this_month || 0) / 30)}/day`}
          icon={Calendar}
          iconBg="bg-orange-100"
          valueColor="text-orange-600"
        />
      </div>

      {/* Middle Row - Monthly Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">This Month - My Commission</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(data?.my_commission || 0)}</p>
              <p className="text-xs text-gray-500">From your own trades</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <Users className="w-5 h-5 text-cyan-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">This Month - Clients Commission</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(data?.client_commission || 0)}</p>
              <p className="text-xs text-gray-500">From all clients (IB + non-IB)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Row - Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-600 mb-2 block">Available Balance</span>
              <p className="text-3xl font-bold text-green-600 mb-1">{formatCurrency(data?.availableBalance || 0)}</p>
              <p className="text-xs text-gray-500">Ready for withdrawal</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Pending Balance</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(0)}</p>
              <p className="text-xs text-gray-500">Awaiting approval</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <Clock className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Monthly Commission Trend Chart */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Monthly Commission Trend</h2>
        </div>
        <div className="h-80">
          {data?.monthlyTrend?.length > 0 ? (
            <Line data={monthlyData} options={monthlyOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 italic">No chart data available</div>
          )}
        </div>
      </Card>

      {/* Excluded Trades Section */}
      <Card className="bg-yellow-50 border-l-4 border-yellow-400">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Excluded Trades (Duration ≤ 60 seconds)
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              The following trades are excluded from commission calculation because they were closed within 60 seconds (1 minute) of opening. Note: This rule only applies to trades closed on or after November 21, 2025.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="px-4 py-2 bg-blue-100 rounded-lg">
                <div className="text-xs font-medium text-gray-600">My Trades</div>
                <div className="text-sm font-bold text-gray-900">{data?.excluded?.my_count || 0} trades</div>
                <div className="text-xs text-gray-600">{parseFloat(data?.excluded?.my_lots || 0).toFixed(2)} lots</div>
              </div>
              <div className="px-4 py-2 bg-blue-100 rounded-lg">
                <div className="text-xs font-medium text-gray-600">Client Trades</div>
                <div className="text-sm font-bold text-gray-900">{data?.excluded?.client_count || 0} trades</div>
                <div className="text-xs text-gray-600">{parseFloat(data?.excluded?.client_lots || 0).toFixed(2)} lots</div>
              </div>
              <div className="px-4 py-2 bg-red-100 rounded-lg">
                <div className="text-xs font-medium text-gray-600">Total Excluded</div>
                <div className="text-sm font-bold text-gray-900">{data?.excluded?.count || 0} trades</div>
                <div className="text-xs text-gray-600">{parseFloat(data?.excluded?.lots || 0).toFixed(2)} lots</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Commission by Client Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-gray-500" />
            <h2 className="text-xl font-bold text-gray-900">Commission by Client</h2>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Shows all referral clients (all levels) that generate commission from trades.
        </p>

        <div className="space-y-4">
          <Table
            rows={commissionByClientData}
            columns={commissionByClientColumns}
            pageSize={10}
            searchPlaceholder="Search clients..."
            filters={{
              searchKeys: ['client', 'mt5Account', 'tradingPair'],
              dateKey: 'rawCreatedAt'
            }}
          />

          {/* Subtotal */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900">
                Subtotal (Live Commission Summary):
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Total Volume</p>
                <p className="text-lg font-bold text-gray-900">{parseFloat((data?.my_lots || 0) + (data?.client_lots || 0)).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Total Commission</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(data?.total_commission || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Active Clients</p>
                <p className="text-lg font-bold text-blue-600">{data?.active_clients || 0}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-600 italic">
              <Info className="w-3 h-3" />
              <span>Includes My Trades & Referred Client Trades</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Commission History Section */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-500" />
          <h2 className="text-xl font-bold text-gray-900">Recent Commission History</h2>
        </div>

        <Table
          rows={recentCommissionHistoryData}
          columns={recentHistoryColumns}
          pageSize={10}
          searchPlaceholder="Search trades..."
          filters={{
            searchKeys: ['symbol', 'type'],
            dateKey: 'rawDate',
          }}
        />
      </Card>
    </div>
  );
}

export default MyCommission;
