import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, Line, Doughnut, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
  Title
} from "chart.js";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  BarChart3, 
  Info,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Coins,
  LineChart,
  Target,
  Percent,
  Zap,
  Shield,
  Award,
  Calendar,
  Clock,
  TrendingUp as TrendingUpIcon,
  AlertCircle,
  CheckCircle2,
  XCircle,
  PieChart,
  Gauge,
  Users,
  DollarSign as DollarIcon
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
  Title
);

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function TradePerformance() {
  const navigate = useNavigate();
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [timeframe, setTimeframe] = useState("365");
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    netProfit: 0,
    profit: 0,
    loss: 0,
    unrealisedPL: 0,
    closedOrders: 0,
    profitable: 0,
    unprofitable: 0,
    tradingVolume: 0,
    lifetimeVolume: 0,
    equity: 0,
    totalDeposits: 0,
    totalWithdrawals: 0
  });
  const [chartData, setChartData] = useState({
    netProfit: { labels: [], profit: [], loss: [] },
    closedOrders: { labels: [], profitable: [], unprofitable: [] },
    tradingVolume: { labels: [], volumes: [] },
    equity: { labels: [], values: [] }
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [selectedAccount, timeframe]);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/accounts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        const all = Array.isArray(data.data) ? data.data : [];
        
        // Filter exactly like Dashboard: Only active, real MT5 accounts
        const realAccounts = all.filter((acc) => {
          const platform = (acc.platform || '').toUpperCase();
          const status = (acc.account_status || '').toLowerCase();
          const isMT5 = platform === 'MT5';
          const isActive = status === '' || status === 'active' || !status;
          const isReal = !acc.is_demo;
          
          return isMT5 && isActive && isReal;
        });
        
        setAccounts(realAccounts);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const params = new URLSearchParams({
        accountNumber: selectedAccount,
        timeframe: timeframe
      });
      
      const response = await fetch(`${API_BASE_URL}/reports/trading-performance?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setSummary(data.data.summary);
        setChartData(data.data.chartData);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch trading performance');
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
      setError(error.message || 'Failed to load trading performance');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercent = (value) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Calculate advanced metrics - only from real data
  const calculateMetrics = () => {
    const totalTrades = summary.profitable + summary.unprofitable;
    const winRate = totalTrades > 0 ? (summary.profitable / totalTrades) : 0;
    
    // Only calculate profit factor if we have both profit and loss data
    let profitFactor = null;
    if (summary.loss > 0) {
      profitFactor = summary.profit / summary.loss;
    } else if (summary.profit > 0 && summary.loss === 0) {
      profitFactor = null; // Cannot calculate without loss data
    } else {
      profitFactor = 0;
    }
    
    const avgWin = summary.profitable > 0 ? (summary.profit / summary.profitable) : 0;
    const avgLoss = summary.unprofitable > 0 ? (summary.loss / summary.unprofitable) : 0;
    
    // Only calculate risk/reward if we have both avg win and loss
    let riskRewardRatio = null;
    if (avgLoss > 0) {
      riskRewardRatio = avgWin / avgLoss;
    } else if (avgWin > 0 && avgLoss === 0) {
      riskRewardRatio = null; // Cannot calculate without loss data
    } else {
      riskRewardRatio = 0;
    }
    
    const totalDeposits = summary.totalDeposits || 0;
    const roi = totalDeposits > 0 ? ((summary.netProfit / totalDeposits) * 100) : 0;
    
    // These require actual trade history data from MT5 - set to null if not available
    const sharpeRatio = null; // Requires volatility data from actual trades
    const maxDrawdown = null; // Requires historical equity data from actual trades
    
    const expectancy = totalTrades > 0 ? ((winRate * avgWin) - ((1 - winRate) * avgLoss)) : 0;
    
    return {
      winRate,
      profitFactor,
      avgWin,
      avgLoss,
      riskRewardRatio,
      roi,
      sharpeRatio,
      maxDrawdown,
      expectancy,
      totalTrades,
      hasRealData: totalTrades > 0 || summary.netProfit !== 0 || summary.equity > 0
    };
  };

  const metrics = calculateMetrics();

  // Chart configurations
  const netProfitChartData = {
    labels: chartData.netProfit.labels,
    datasets: [
      {
        label: 'Profit',
        data: chartData.netProfit.profit,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1
      },
      {
        label: 'Loss',
        data: chartData.netProfit.loss,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1
      }
    ]
  };

  const closedOrdersChartData = {
    labels: chartData.closedOrders.labels,
    datasets: [
      {
        label: 'Profitable',
        data: chartData.closedOrders.profitable,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1
      },
      {
        label: 'Unprofitable',
        data: chartData.closedOrders.unprofitable,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1
      }
    ]
  };

  const tradingVolumeChartData = {
    labels: chartData.tradingVolume.labels,
    datasets: [
      {
        label: 'Trading Volume',
        data: chartData.tradingVolume.volumes,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }
    ]
  };

  const equityChartData = {
    labels: chartData.equity.labels,
    datasets: [
      {
        label: 'Equity',
        data: chartData.equity.values,
        borderColor: 'rgba(0, 0, 0, 1)',
        borderWidth: 2,
        fill: true,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5
      }
    ]
  };

  const winRatePieData = {
    labels: ['Winning Trades', 'Losing Trades'],
    datasets: [{
      data: [summary.profitable, summary.unprofitable],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(239, 68, 68, 1)'
      ],
      borderWidth: 2
    }]
  };

  const profitLossPieData = {
    labels: ['Profit', 'Loss'],
    datasets: [{
      data: [summary.profit, summary.loss],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(239, 68, 68, 1)'
      ],
      borderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const equityChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  const tradingVolumeChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        ticks: {
          callback: function(value) {
            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
            if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
            return formatCurrency(value);
          }
        }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Net Profit"
          value={formatCurrency(summary.netProfit)}
          icon={DollarSign}
          trend={summary.netProfit >= 0 ? 'up' : 'down'}
          subtitle={`${summary.netProfit >= 0 ? 'Profit' : 'Loss'}: ${formatCurrency(Math.abs(summary.netProfit))}`}
        />
        <MetricCard
          title="Win Rate"
          value={metrics.totalTrades > 0 ? formatPercent(metrics.winRate) : 'N/A'}
          icon={Percent}
          trend={metrics.totalTrades > 0 ? (metrics.winRate >= 0.5 ? 'up' : 'down') : 'neutral'}
          subtitle={metrics.totalTrades > 0 ? `${summary.profitable} wins / ${metrics.totalTrades} trades` : 'No trades yet'}
        />
        <MetricCard
          title="Profit Factor"
          value={metrics.profitFactor !== null ? metrics.profitFactor.toFixed(2) : 'N/A'}
          icon={Zap}
          trend={metrics.profitFactor !== null && metrics.profitFactor >= 1 ? 'up' : metrics.profitFactor !== null ? 'down' : 'neutral'}
          subtitle={metrics.profitFactor !== null ? (metrics.profitFactor >= 1 ? 'Profitable' : 'Unprofitable') : 'Insufficient data'}
        />
        <MetricCard
          title="ROI"
          value={formatPercent(metrics.roi / 100)}
          icon={Award}
          trend={metrics.roi >= 0 ? 'up' : 'down'}
          subtitle={`Return on Investment`}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Net Profit Trend</h3>
          <div className="h-64">
            <Bar data={netProfitChartData} options={chartOptions} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Equity Curve</h3>
          <div className="h-64">
            <Line data={equityChartData} options={equityChartOptions} />
          </div>
        </div>
      </div>

      {/* Pie Charts - Only show if we have trade data */}
      {(summary.profitable > 0 || summary.unprofitable > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Win/Loss Distribution</h3>
            <div className="h-64">
              <Doughnut data={winRatePieData} options={pieChartOptions} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Profit/Loss Breakdown</h3>
            <div className="h-64">
              <Pie data={profitLossPieData} options={pieChartOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DetailCard
          title="Total Profit"
          value={formatCurrency(summary.profit)}
          icon={ArrowUpCircle}
          color="green"
          details={[
            { label: 'Average Win', value: metrics.avgWin > 0 ? formatCurrency(metrics.avgWin) : 'N/A' }
          ]}
        />
        <DetailCard
          title="Total Loss"
          value={formatCurrency(summary.loss)}
          icon={ArrowDownCircle}
          color="red"
          details={[
            { label: 'Average Loss', value: metrics.avgLoss > 0 ? formatCurrency(metrics.avgLoss) : 'N/A' }
          ]}
        />
        <DetailCard
          title="Risk/Reward Ratio"
          value={metrics.riskRewardRatio !== null ? metrics.riskRewardRatio.toFixed(2) : 'N/A'}
          icon={Target}
          color="blue"
          details={[
            { label: 'Avg Win', value: metrics.avgWin > 0 ? formatCurrency(metrics.avgWin) : 'N/A' },
            { label: 'Avg Loss', value: metrics.avgLoss > 0 ? formatCurrency(metrics.avgLoss) : 'N/A' }
          ]}
        />
        <DetailCard
          title="Expectancy"
          value={formatCurrency(metrics.expectancy)}
          icon={Gauge}
          color={metrics.expectancy >= 0 ? 'green' : 'red'}
          details={[
            { label: 'Per Trade', value: formatCurrency(metrics.expectancy) },
            { label: 'Win Rate', value: formatPercent(metrics.winRate) }
          ]}
        />
        <DetailCard
          title="Trading Volume"
          value={formatCurrency(summary.tradingVolume)}
          icon={Coins}
          color="purple"
          details={[
            { label: 'Lifetime Volume', value: formatCurrency(summary.lifetimeVolume) },
            { label: 'Period', value: `${timeframe} days` }
          ]}
        />
        <DetailCard
          title="Equity"
          value={formatCurrency(summary.equity)}
          icon={Wallet}
          color="indigo"
          details={[
            { label: 'Current Balance', value: formatCurrency(summary.equity) },
            { label: 'Unrealised P/L', value: formatCurrency(summary.unrealisedPL) }
          ]}
        />
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Performance</h3>
          <div className="h-80">
            <Bar data={netProfitChartData} options={chartOptions} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Trading Volume Trend</h3>
          <div className="h-80">
            <Bar data={tradingVolumeChartData} options={tradingVolumeChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderRiskAnalysis = () => (
    <div className="space-y-6">
      {/* Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <RiskCard
          title="Max Drawdown"
          value={metrics.maxDrawdown !== null ? formatPercent(metrics.maxDrawdown / 100) : 'N/A'}
          status={metrics.maxDrawdown !== null ? (metrics.maxDrawdown < 20 ? 'good' : metrics.maxDrawdown < 50 ? 'warning' : 'danger') : 'warning'}
          description={metrics.maxDrawdown !== null ? "Maximum peak-to-trough decline" : "Requires historical equity data"}
        />
        <RiskCard
          title="Sharpe Ratio"
          value={metrics.sharpeRatio !== null ? metrics.sharpeRatio.toFixed(2) : 'N/A'}
          status={metrics.sharpeRatio !== null ? (metrics.sharpeRatio > 1 ? 'good' : metrics.sharpeRatio > 0 ? 'warning' : 'danger') : 'warning'}
          description={metrics.sharpeRatio !== null ? "Risk-adjusted return measure" : "Requires trade volatility data"}
        />
        <RiskCard
          title="Profit Factor"
          value={metrics.profitFactor !== null ? metrics.profitFactor.toFixed(2) : 'N/A'}
          status={metrics.profitFactor !== null ? (metrics.profitFactor >= 2 ? 'good' : metrics.profitFactor >= 1 ? 'warning' : 'danger') : 'warning'}
          description={metrics.profitFactor !== null ? "Gross profit / Gross loss" : "Requires both profit and loss data"}
        />
        <RiskCard
          title="Risk/Reward"
          value={metrics.riskRewardRatio !== null ? metrics.riskRewardRatio.toFixed(2) : 'N/A'}
          status={metrics.riskRewardRatio !== null ? (metrics.riskRewardRatio >= 2 ? 'good' : metrics.riskRewardRatio >= 1 ? 'warning' : 'danger') : 'warning'}
          description={metrics.riskRewardRatio !== null ? "Average win / Average loss" : "Requires both win and loss data"}
        />
      </div>

      {/* Risk Assessment */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Risk Assessment</h3>
        <div className="space-y-4">
          <RiskIndicator
            label="Overall Risk Level"
            value={calculateRiskLevel()}
            description="Based on drawdown, profit factor, and win rate"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Recommended Position Size</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.equity * 0.02)}
              </p>
              <p className="text-xs text-gray-500 mt-1">2% of equity per trade</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Max Risk Per Trade</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.equity * 0.01)}
              </p>
              <p className="text-xs text-gray-500 mt-1">1% of equity</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Daily Risk Limit</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.equity * 0.05)}
              </p>
              <p className="text-xs text-gray-500 mt-1">5% of equity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStatistics = () => (
    <div className="space-y-6">
      {/* Trade Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Trades"
          value={metrics.totalTrades}
          icon={Activity}
          subtitle={`${summary.profitable} profitable, ${summary.unprofitable} unprofitable`}
        />
        <StatCard
          title="Win Rate"
          value={formatPercent(metrics.winRate)}
          icon={Percent}
          subtitle={`${summary.profitable} wins out of ${metrics.totalTrades} trades`}
        />
        <StatCard
          title="Average Win"
          value={formatCurrency(metrics.avgWin)}
          icon={TrendingUpIcon}
          subtitle="Per winning trade"
        />
        <StatCard
          title="Average Loss"
          value={formatCurrency(metrics.avgLoss)}
          icon={TrendingDown}
          subtitle="Per losing trade"
        />
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Trade Distribution</h3>
          <div className="h-64">
            <Doughnut data={winRatePieData} options={pieChartOptions} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Closed Orders Trend</h3>
          <div className="h-64">
            <Bar data={closedOrdersChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metric</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <TableRow label="Net Profit" value={formatCurrency(summary.netProfit)} status={summary.netProfit >= 0} />
              <TableRow label="Total Profit" value={formatCurrency(summary.profit)} status={true} />
              <TableRow label="Total Loss" value={formatCurrency(summary.loss)} status={false} />
              <TableRow label="Win Rate" value={formatPercent(metrics.winRate)} status={metrics.winRate >= 0.5} />
              <TableRow label="Profit Factor" value={metrics.profitFactor !== null ? metrics.profitFactor.toFixed(2) : 'N/A'} status={metrics.profitFactor !== null && metrics.profitFactor >= 1} />
              <TableRow label="Risk/Reward Ratio" value={metrics.riskRewardRatio !== null ? metrics.riskRewardRatio.toFixed(2) : 'N/A'} status={metrics.riskRewardRatio !== null && metrics.riskRewardRatio >= 1} />
              <TableRow label="ROI" value={formatPercent(metrics.roi / 100)} status={metrics.roi >= 0} />
              <TableRow label="Expectancy" value={formatCurrency(metrics.expectancy)} status={metrics.expectancy >= 0} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderComparison = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Account Performance Comparison</h3>
        <p className="text-gray-600 mb-4">
          Compare performance across different accounts and time periods
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div key={account.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">Account {account.account_number}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  account.equity >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {formatCurrency(account.equity || 0)}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Balance: {formatCurrency(account.balance || 0)}</p>
                <p>Equity: {formatCurrency(account.equity || 0)}</p>
                <p>Credit: {formatCurrency(account.credit || 0)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const calculateRiskLevel = () => {
    // Only calculate if we have real data
    if (!metrics.hasRealData) {
      return { level: 'Insufficient Data', color: 'gray' };
    }
    
    let score = 0;
    if (metrics.profitFactor !== null) {
      if (metrics.profitFactor >= 2) score += 1;
      else if (metrics.profitFactor >= 1) score += 0.5;
    }
    
    if (metrics.winRate >= 0.6) score += 1;
    else if (metrics.winRate >= 0.5) score += 0.5;
    
    if (metrics.maxDrawdown !== null) {
      if (metrics.maxDrawdown < 20) score += 1;
      else if (metrics.maxDrawdown < 50) score += 0.5;
    }
    
    if (score >= 2.5) return { level: 'Low', color: 'green' };
    if (score >= 1.5) return { level: 'Medium', color: 'yellow' };
    return { level: 'High', color: 'red' };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trade Performance Analytics</h1>
          <p className="text-gray-600">Comprehensive trading performance analysis with detailed metrics and insights</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Account</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Real Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.account_number}>
                    {account.account_number} - {account.account_type || 'MT5'}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last 365 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            title="Net Profit"
            value={formatCurrency(summary.netProfit)}
            icon={DollarSign}
            trend={summary.netProfit >= 0 ? 'up' : 'down'}
            details={[
              { label: 'Profit', value: formatCurrency(summary.profit), color: 'green' },
              { label: 'Loss', value: formatCurrency(summary.loss), color: 'red' }
            ]}
          />
          <SummaryCard
            title="Closed Orders"
            value={formatNumber(summary.closedOrders)}
            icon={Target}
            trend="neutral"
            details={[
              { label: 'Profitable', value: formatNumber(summary.profitable), color: 'green' },
              { label: 'Unprofitable', value: formatNumber(summary.unprofitable), color: 'red' }
            ]}
          />
          <SummaryCard
            title="Trading Volume"
            value={formatCurrency(summary.tradingVolume)}
            icon={Coins}
            trend="neutral"
            details={[
              { label: 'Lifetime', value: formatCurrency(summary.lifetimeVolume), color: 'blue' }
            ]}
          />
          <SummaryCard
            title="Equity"
            value={formatCurrency(summary.equity)}
            icon={Wallet}
            trend="neutral"
            details={[
              { label: 'Unrealised P/L', value: formatCurrency(summary.unrealisedPL), color: 'gray' }
            ]}
          />
        </div>

        {/* Main Content - Combined View */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading analytics data...</div>
            </div>
          ) : !metrics.hasRealData ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Trading Data Available</h3>
              <p className="text-gray-600 mb-4">
                No real MT5 account data found for the selected timeframe.
              </p>
              <p className="text-sm text-gray-500">
                Please ensure you have real MT5 accounts with trading activity.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Overview Section - Key Metrics */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6" />
                  Performance Overview
                </h2>
                {renderOverview()}
              </div>

              {/* Performance Metrics Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  Performance Metrics
                </h2>
                {renderPerformance()}
              </div>

              {/* Statistics Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Target className="w-6 h-6" />
                  Trade Statistics
                </h2>
                {renderStatistics()}
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Data updated: {new Date().toLocaleString('en-US', { 
              timeZone: 'UTC',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })} (UTC). For real-time statistics, check{" "}
            <a href="/user/web-terminal" className="text-blue-600 hover:underline">Terminal</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({ title, value, icon: Icon, trend, subtitle }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            trend === 'up' ? 'bg-green-100' : trend === 'down' ? 'bg-red-100' : 'bg-gray-100'
          }`}>
            <Icon className={`w-5 h-5 ${
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          </div>
        </div>
        {trend === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
        {trend === 'down' && <TrendingDown className="w-5 h-5 text-red-500" />}
      </div>
      <p className={`text-2xl font-bold mb-2 ${
        trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-900'
      }`}>
        {value}
      </p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, trend, details }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border border-blue-100 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          </div>
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-4">{value}</p>
      {details && details.length > 0 && (
        <div className="mt-4 space-y-2 text-sm bg-white/60 rounded-lg p-3">
          {details.map((detail, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span className="text-gray-600">{detail.label}</span>
              <span className={`font-bold ${
                detail.color === 'green' ? 'text-green-600' :
                detail.color === 'red' ? 'text-red-600' :
                detail.color === 'blue' ? 'text-blue-600' : 'text-gray-700'
              }`}>
                {detail.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailCard({ title, value, icon: Icon, color, details }) {
  const colorClasses = {
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    indigo: 'bg-indigo-100 text-indigo-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-4">{value}</p>
      {details && (
        <div className="space-y-2 text-sm">
          {details.map((detail, idx) => (
            <div key={idx} className="flex justify-between text-gray-600">
              <span>{detail.label}</span>
              <span className="font-semibold">{detail.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RiskCard({ title, value, status, description }) {
  const statusColors = {
    good: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    danger: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 border-2 ${statusColors[status]}`}>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <p className="text-2xl font-bold mb-2">{value}</p>
      <p className="text-xs opacity-75">{description}</p>
    </div>
  );
}

function RiskIndicator({ label, value, description }) {
  const { level, color } = value;
  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
          color === 'green' ? 'bg-green-100 text-green-800' :
          color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {level}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${colorClasses[color]}`}
          style={{ width: `${color === 'green' ? 80 : color === 'yellow' ? 50 : 30}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-2">{description}</p>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, subtitle }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gray-100">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
}

function TableRow({ label, value, status }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-900">{label}</td>
      <td className="px-4 py-3 text-sm text-right font-semibold">{value}</td>
      <td className="px-4 py-3 text-sm">
        {status ? (
          <CheckCircle2 className="w-5 h-5 text-green-500 inline" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500 inline" />
        )}
      </td>
    </tr>
  );
}

export default TradePerformance;
