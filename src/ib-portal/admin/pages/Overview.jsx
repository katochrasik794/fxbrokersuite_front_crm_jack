import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../ui/Card';
import StatCard from '../../ui/StatCard';
import Table from '../../ui/Table';
import Button from '../../ui/Button';
import WaveLoader from '../../ui/WaveLoader.jsx';
import Toast from '../../../components/Toast.jsx';
import {
  Users,
  Clock,
  Wallet,
  UserCheck,
  TrendingUp,
  FileText,
  DollarSign,
  BarChart3,
  ArrowRight,
  Eye,
  AlertCircle,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Overview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [keyMetrics, setKeyMetrics] = useState({
    totalIBs: { value: '0', breakdown: '0 approved | 0 pending' },
    pendingRequests: { value: '0', subtitle: 'Awaiting approval' },
    totalCommissions: { value: '$0.00', from: 'From 0.00 lots', across: 'Across 0 IBs' },
    totalReferrals: { value: '0', subtitle: 'Network growth' },
  });
  const [commissionByAccountGroup, setCommissionByAccountGroup] = useState([]);
  const [ibActivity, setIbActivity] = useState({
    approvedIBs: { value: '0', subtitle: 'Active partners' },
    totalVolume: { value: '0.00', subtitle: 'All IB trading' },
    totalTrades: { value: '0', subtitle: 'All IB activity' },
    avgCommissionLot: { value: '$0.00', subtitle: 'Per lot average' },
  });
  const [recentIBRequests, setRecentIBRequests] = useState([]);
  const [topEarners, setTopEarners] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemSummary, setSystemSummary] = useState({
    ibStatistics: {
      totalIBs: '0',
      approved: '0',
      pending: '0',
      rejected: '0',
      approvalRate: '0.0%',
      ibsEarning: '0',
    },
    tradingStatistics: {
      totalVolume: '0.00 lots',
      totalTrades: '0',
      avgVolumePerTrade: '0.00 lots',
      totalReferrals: '0',
      totalClients: '0',
      ibsWithReferrals: '0',
    },
    commissionStatistics: {
      totalCommission: '$0.00',
      avgCommissionPerLot: '$0.00',
      commissionPerTrade: '$0.00',
      ibsEarning: '0/0',
      avgPerEarningIB: '$0.00',
    },
    performanceMetrics: {
      activeIBs: '0',
      volumePerIB: '0.00 lots',
      commissionPerIB: '$0.00',
      referralsPerIB: '0.0',
      avgReferralsActive: '0.0',
    },
  });

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      // Fetch all overview data in parallel
      const [statsRes, groupsRes, activityRes, requestsRes, earnersRes, activity7DaysRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE_URL}/ib-requests/overview/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/ib-requests/overview/commission-by-group`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/ib-requests/overview/ib-activity`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/ib-requests/overview/recent-requests?limit=5`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/ib-requests/overview/top-earners?limit=5`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/ib-requests/overview/recent-activity?limit=5`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/ib-requests/overview/system-summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Process stats
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setKeyMetrics({
            totalIBs: {
              value: statsData.data.approvedIBs.toString(),
              breakdown: `Total IBs: ${statsData.data.totalIBs} | Pending: ${statsData.data.pendingIBs}`
            },
            pendingRequests: {
              value: statsData.data.pendingIBs.toString(),
              subtitle: 'Awaiting approval'
            },
            totalCommissions: {
              value: `$${parseFloat(statsData.data.totalCommission).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              from: `From ${parseFloat(statsData.data.totalLots).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lots`,
              across: `Across ${statsData.data.approvedIBs} IBs`
            },
            totalReferrals: {
              value: statsData.data.totalReferrals.toString(),
              subtitle: 'Network growth'
            },
          });
        }
      }

      // Process commission by group
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        if (groupsData.success) {
          const formatted = groupsData.data.map(item => ({
            group: item.group,
            amount: `$${parseFloat(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            percentage: item.percentage,
            lots: item.lots
          }));
          setCommissionByAccountGroup(formatted);
        }
      }

      // Process IB activity
      if (activityRes.ok) {
        const activityData = await activityRes.json();
        if (activityData.success) {
          setIbActivity({
            approvedIBs: {
              value: activityData.data.approvedIBs.toString(),
              subtitle: 'Active partners'
            },
            totalVolume: {
              value: parseFloat(activityData.data.totalVolume).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              subtitle: 'All IB trading'
            },
            totalTrades: {
              value: activityData.data.totalTrades,
              subtitle: 'All IB activity'
            },
            avgCommissionLot: {
              value: activityData.data.avgCommissionLot,
              subtitle: 'Per lot average'
            },
          });
        }
      }

      // Process recent requests
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        if (requestsData.success) {
          setRecentIBRequests(requestsData.data);
        }
      }

      // Process top earners
      if (earnersRes.ok) {
        const earnersData = await earnersRes.json();
        if (earnersData.success) {
          setTopEarners(earnersData.data);
        }
      }

      // Process recent activity
      if (activity7DaysRes.ok) {
        const activityData = await activity7DaysRes.json();
        if (activityData.success) {
          setRecentActivity(activityData.data);
        }
      }

      // Process system summary
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        if (summaryData.success) {
          setSystemSummary(summaryData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching overview data:', error);
      setToast({
        message: 'Failed to load overview data',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Recent IB Requests Data - using state
  const recentIBRequestsData = recentIBRequests;

  const ibRequestsColumns = [
    {
      key: 'name',
      label: 'Name',
      render: (value, row) => (
        <div>
          <div className="font-semibold text-gray-900">{value}</div>
          <div className="text-xs text-gray-600">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'rate',
      label: 'Rate',
      render: (value, row) => (
        <div>
          <span className={value === 'Not configured' ? 'px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium' : 'font-semibold text-gray-900'}>
            {value}
          </span>
          {row.rateGroups && (
            <div className="text-xs text-gray-600 mt-1">({row.rateGroups})</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const statusColors = {
          'Approved': 'bg-green-100 text-green-800',
          'Pending': 'bg-orange-100 text-orange-800',
          'Rejected': 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {value}
          </span>
        );
      },
    },
    {
      key: 'date',
      label: 'Date',
      render: (value) => <span className="text-gray-700">{value || 'Jan 02, 2026'}</span>,
    },
  ];

  // Top Commission Earners Data - using state
  const topCommissionEarnersData = topEarners;

  const topEarnersColumns = [
    {
      key: 'name',
      label: 'IB Name',
      render: (value, row) => (
        <div>
          <div className="font-semibold text-gray-900">{value}</div>
          <div className="text-xs text-gray-600">{row.email}</div>
          <div className="text-xs text-gray-500 mt-0.5">({row.referrals})</div>
        </div>
      ),
    },
    {
      key: 'commission',
      label: 'Commission',
      render: (value) => <span className="font-semibold text-green-600">{value}</span>,
    },
    {
      key: 'volume',
      label: 'Volume',
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
  ];

  // Recent Activity Data - using state
  const recentActivityData = recentActivity;

  const recentActivityColumns = [
    {
      key: 'name',
      label: 'IB Name',
      render: (value, row) => (
        <div>
          <div className="font-semibold text-gray-900">{value}</div>
          <div className="text-xs text-gray-600">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'commission',
      label: 'Commission',
      render: (value, row) => (
        <div>
          <span className="font-semibold text-green-600">{value}</span>
          <div className="text-xs text-gray-500">({row.period})</div>
        </div>
      ),
    },
    {
      key: 'volume',
      label: 'Volume',
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
  ];

  // System Summary - using state

  const handleViewAll = () => {
    navigate('/admin/ib/ib-requests');
  };

  const handleManageSymbols = () => {
    navigate('/admin/ib/symbols-pip-values');
  };

  const handleViewLedger = () => {
    navigate('/admin/ib/commission-distribution');
  };

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <WaveLoader message="Loading overview data..." />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">IB Management Dashboard</h1>
        <p className="text-gray-600">Overview of the group-based commission system</p>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Approved IBs</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{keyMetrics.totalIBs.value}</p>
              <p className="text-xs text-gray-600">
                {keyMetrics.totalIBs.breakdown}
              </p>
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
                <span className="text-sm font-medium text-gray-600">Pending Requests</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{keyMetrics.pendingRequests.value}</p>
              <p className="text-xs text-gray-500">{keyMetrics.pendingRequests.subtitle}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Wallet className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Total Commissions</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{keyMetrics.totalCommissions.value}</p>
              <p className="text-xs text-gray-500 mb-0.5">{keyMetrics.totalCommissions.from}</p>
              <p className="text-xs text-gray-500">{keyMetrics.totalCommissions.across}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UserCheck className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Total Referrals</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{keyMetrics.totalReferrals.value}</p>
              <p className="text-xs text-gray-500">{keyMetrics.totalReferrals.subtitle}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Commission by Account Group */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Commission by Account Group</h2>
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
                <p className="text-xl font-bold text-blue-600 mb-1">{item.amount}</p>
                <p className="text-xs text-gray-500 mb-0.5">{item.percentage}</p>
                <p className="text-xs text-gray-600">{item.lots}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* IB Activity Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 mb-1">{ibActivity.approvedIBs.value}</p>
            <p className="text-sm font-medium text-gray-600 mb-1">Approved IBs</p>
            <p className="text-xs text-gray-500">{ibActivity.approvedIBs.subtitle}</p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 mb-1">{ibActivity.totalVolume.value}</p>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Volume (Lots)</p>
            <p className="text-xs text-gray-500">{ibActivity.totalVolume.subtitle}</p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 mb-1">{ibActivity.totalTrades.value}</p>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Trades</p>
            <p className="text-xs text-gray-500">{ibActivity.totalTrades.subtitle}</p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 mb-1">{ibActivity.avgCommissionLot.value}</p>
            <p className="text-sm font-medium text-gray-600 mb-1">Avg Commission/Lot</p>
            <p className="text-xs text-gray-500">{ibActivity.avgCommissionLot.subtitle}</p>
          </div>
        </Card>
      </div>

      {/* Tables Section */}
      <div className="space-y-6">
        {/* Recent IB Requests */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent IB Requests</h2>
            <Button variant="outline" size="sm" onClick={handleViewAll}>
              View All
            </Button>
          </div>
          <Table
            rows={recentIBRequestsData}
            columns={ibRequestsColumns}
            pageSize={5}
            searchPlaceholder="Search requests..."
            filters={{
              searchKeys: ['name', 'email', 'status'],
              selects: [
                {
                  key: 'status',
                  label: 'All Statuses',
                  options: ['Approved', 'Pending', 'Rejected'],
                },
              ],
              dateKey: 'date',
            }}
          />
        </Card>

        {/* Top Commission Earners */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Commission Earners (All-Time)</h2>
          <Table
            rows={topCommissionEarnersData}
            columns={topEarnersColumns}
            pageSize={5}
            searchPlaceholder="Search earners..."
            filters={{
              searchKeys: ['name', 'email'],
            }}
          />
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="space-y-6">
        {/* Recent Activity */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity (Last 7 Days)</h2>
          <Table
            rows={recentActivityData}
            columns={recentActivityColumns}
            pageSize={5}
            searchPlaceholder="Search activity..."
            filters={{
              searchKeys: ['name', 'email'],
              dateKey: 'period',
            }}
          />
        </Card>

        {/* Commission Breakdown */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Commission Breakdown</h2>
          <div className="space-y-4">
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-2">{systemSummary.commissionStatistics.totalCommission}</p>
              <p className="text-sm text-gray-600">Total Commission Earned by All IBs</p>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>From {systemSummary.tradingStatistics.totalVolume} across {systemSummary.tradingStatistics.totalTrades} trades</p>
              <p>Generated by {systemSummary.ibStatistics.approved} approved IBs</p>
            </div>
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <p className="text-xs font-semibold text-gray-700">Data Source:</p>
              <p className="text-xs text-gray-600">Commission Data: Pre-calculated from aggregated summary tables</p>
              <p className="text-xs text-gray-600">Calculation Method: Group-based pip rates with symbol rate matching</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                <p className="text-xs text-gray-700">
                  <strong>Note:</strong> All commissions are calculated using group-specific rates, not a single per_lot value.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* System Summary */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">System Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* IB Statistics */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">IB Statistics</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total IBs:</span>
                <span className="font-semibold text-gray-900">{systemSummary.ibStatistics.totalIBs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Approved:</span>
                <span className="font-semibold text-green-600">{systemSummary.ibStatistics.approved}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending:</span>
                <span className="font-semibold text-orange-600">{systemSummary.ibStatistics.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rejected:</span>
                <span className="font-semibold text-red-600">{systemSummary.ibStatistics.rejected}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Approval Rate:</span>
                <span className="font-semibold text-gray-900">{systemSummary.ibStatistics.approvalRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IBs Earning:</span>
                <span className="font-semibold text-gray-900">{systemSummary.ibStatistics.ibsEarning}</span>
              </div>
            </div>
          </div>

          {/* Trading Statistics */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">Trading Statistics</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Volume:</span>
                <span className="font-semibold text-gray-900">{systemSummary.tradingStatistics.totalVolume}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Trades:</span>
                <span className="font-semibold text-gray-900">{systemSummary.tradingStatistics.totalTrades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Volume/Trade:</span>
                <span className="font-semibold text-gray-900">{systemSummary.tradingStatistics.avgVolumePerTrade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Referrals:</span>
                <span className="font-semibold text-gray-900">{systemSummary.tradingStatistics.totalReferrals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Clients:</span>
                <span className="font-semibold text-gray-900">{systemSummary.tradingStatistics.totalClients}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IBs with Referrals:</span>
                <span className="font-semibold text-gray-900">{systemSummary.tradingStatistics.ibsWithReferrals}</span>
              </div>
            </div>
          </div>

          {/* Commission Statistics */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">$ Commission Statistics</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Commission:</span>
                <span className="font-semibold text-green-600">{systemSummary.commissionStatistics.totalCommission}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Commission/Lot:</span>
                <span className="font-semibold text-gray-900">{systemSummary.commissionStatistics.avgCommissionPerLot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Commission/Trade:</span>
                <span className="font-semibold text-gray-900">{systemSummary.commissionStatistics.commissionPerTrade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IBs Earning:</span>
                <span className="font-semibold text-gray-900">{systemSummary.commissionStatistics.ibsEarning}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg per Earning IB:</span>
                <span className="font-semibold text-gray-900">{systemSummary.commissionStatistics.avgPerEarningIB}</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">Performance Metrics</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Active IBs:</span>
                <span className="font-semibold text-gray-900">{systemSummary.performanceMetrics.activeIBs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Volume per IB:</span>
                <span className="font-semibold text-gray-900">{systemSummary.performanceMetrics.volumePerIB}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Commission per IB:</span>
                <span className="font-semibold text-gray-900">{systemSummary.performanceMetrics.commissionPerIB}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Referrals per IB:</span>
                <span className="font-semibold text-gray-900">{systemSummary.performanceMetrics.referralsPerIB}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Referrals (Active):</span>
                <span className="font-semibold text-gray-900">{systemSummary.performanceMetrics.avgReferralsActive}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Management Tools & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-blue-100 rounded-lg mb-4">
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Symbol Management</h3>
            <p className="text-sm text-gray-600 mb-4">Configure pip values and categories</p>
            <Button variant="primary" onClick={handleManageSymbols}>
              Manage Symbols
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-purple-100 rounded-lg mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">IB Management</h3>
            <p className="text-sm text-gray-600">Manage entitlements and allocations</p>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-green-100 rounded-lg mb-4">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Commission Ledger</h3>
            <p className="text-sm text-gray-600 mb-4">View detailed commission records</p>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleViewLedger}>
              View Ledger
            </Button>
          </div>
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

export default Overview;
