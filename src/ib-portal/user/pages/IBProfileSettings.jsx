import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import StatCard from '../../ui/StatCard';
import Table from '../../ui/Table';
import Button from '../../ui/Button';
import ibService from '../../../services/ibService';
import {
  Wallet,
  Calendar,
  Users,
  User,
  Mail,
  Phone,
  MapPin,
  Tag,
  Info,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';

function IBProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    profile: null,
    stats: {
      clientCount: 0,
      teamBalance: 0,
      availableBalance: 0,
      currency: 'USD',
      groups: []
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileRes, statsRes, commissionRes] = await Promise.all([
          ibService.getProfile(),
          ibService.getDashboardStats(),
          ibService.getCommissionSummary()
        ]);

        if (profileRes.success && statsRes.success) {
          setData({
            profile: profileRes.data,
            stats: statsRes.data.stats,
            commissionSummary: commissionRes.success ? commissionRes.data : { total_commission: 0 }
          });
        }
      } catch (error) {
        console.error('Error fetching profile settings:', error);
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

  const { profile, stats } = data;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: stats.currency || 'USD',
    }).format(amount);
  };

  const pipRatesData = (stats.groups || [])
    .filter(g => parseFloat(g.rate) > 0)
    .map(g => ({
      accountGroup: g.name,
      yourRate: `${parseFloat(g.rate).toFixed(2)} pip/lot`,
      maxRate: '—'
    }));

  const pipRatesColumns = [
    {
      key: 'accountGroup',
      label: 'Account Group',
      render: (value) => <span className="font-semibold text-gray-900">{value}</span>,
    },
    {
      key: 'yourRate',
      label: 'Your Rate',
      render: (value) => (
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {value}
        </span>
      ),
    },
    {
      key: 'maxRate',
      label: 'Max Rate',
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
  ];

  const accountStatsColumns = [
    {
      key: 'accountNumber',
      label: 'Account Number',
      render: (value) => <span className="font-semibold text-gray-900">{value}</span>,
    },
    {
      key: 'accountGroup',
      label: 'Account Group',
      render: (value) => (
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
          {value}
        </span>
      ),
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (value) => <span className="text-gray-900">{value}</span>,
    },
    {
      key: 'equity',
      label: 'Equity',
      render: (value) => <span className="text-gray-900">{value}</span>,
    },
    {
      key: 'volume',
      label: 'Volume (Lots)',
      render: (value) => <span className="text-gray-900">{value}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const statusColors = {
          'Active': 'bg-green-100 text-green-800',
          'Inactive': 'bg-gray-100 text-gray-800',
          'Suspended': 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {value}
          </span>
        );
      },
    },
  ];

  const networkStats = {
    totalClients: '2',
    subIBs: '0',
    activeTraders: '1',
    directReferrals: '2',
  };

  const recentActivityData = [
    {
      id: 1,
      date: 'Nov 21, 2025 15:51',
      client: 'sol TRADING',
      symbol: 'XAUUSD.r',
      accountGroup: 'Pro',
      volume: '0.01',
      commission: '$0.10',
    },
  ];

  const recentActivityColumns = [
    {
      key: 'date',
      label: 'Date',
      render: (value) => <span className="text-gray-900">{value}</span>,
    },
    {
      key: 'client',
      label: 'Client',
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
      key: 'accountGroup',
      label: 'Account Group',
      render: (value) => (
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
          {value}
        </span>
      ),
    },
    {
      key: 'volume',
      label: 'Volume',
      render: (value) => <span className="text-gray-900">{value}</span>,
    },
    {
      key: 'commission',
      label: 'Commission',
      render: (value) => <span className="font-semibold text-green-600">{value}</span>,
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">IB Profile</h1>
          <p className="text-gray-600">Viewing IB profile as: {profile?.first_name} {profile?.last_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-ib-50 border-ib-200 text-ib-800 hover:bg-ib-100">
            {profile?.ib_type || 'IB'} Account
          </Button>
          <Button variant="outline" className={`border-2 font-bold ${profile?.is_banned ? 'bg-red-50 border-red-200 text-red-800' : (profile?.ib_status === 'approved' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-orange-50 border-orange-200 text-orange-800')}`}>
            {profile?.is_banned ? 'IB Locked' : (profile?.ib_status === 'approved' ? 'IB Approved' : 'Pending Approval')}
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Commission"
          value={formatCurrency(data.commissionSummary?.total_commission || 0)}
          icon={Wallet}
          iconBg="bg-blue-100"
          valueColor="text-blue-600"
        />

        <StatCard
          title="Available Balance"
          value={formatCurrency(stats.availableBalance)}
          icon={Calendar}
          iconBg="bg-green-100"
          valueColor="text-green-600"
        />

        <StatCard
          title="Total Clients"
          value={stats.clientCount}
          icon={Users}
          iconBg="bg-cyan-100"
          valueColor="text-cyan-600"
        />

        <StatCard
          title="Team Balance"
          value={formatCurrency(stats.teamBalance)}
          icon={User}
          iconBg="bg-orange-100"
          valueColor="text-orange-600"
        />
      </div>

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* IB Information */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">IB Information</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Full Name</p>
                <p className="text-sm font-semibold text-gray-900">{profile?.first_name} {profile?.last_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-sm font-semibold text-gray-900">{profile?.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Approved Date</p>
                <p className="text-sm font-semibold text-gray-900">
                  {profile?.approved_at ? new Date(profile.approved_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Referral Code</p>
                <span className="inline-block px-3 py-1 bg-ib-100 text-ib-800 rounded-full text-sm font-semibold">
                  {profile?.referral_code}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">IB Type</p>
                <span className="inline-block px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm font-semibold">
                  {profile?.ib_type || 'Normal'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Network Statistics */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Network Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Direct Clients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.clientCount}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Team Volume</p>
              <p className="text-xl font-bold text-gray-900">0.00 <span className="text-xs text-gray-500">lots</span></p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Total Team Balance</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.teamBalance)}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">IB Rewards Rate</p>
              <p className="text-xl font-bold text-gray-900 truncate px-1" title={
                (stats.groups || [])
                  .filter(g => parseFloat(g.rate) > 0)
                  .map(g => `${g.name}: ${parseFloat(g.rate).toFixed(2)}`)
                  .join(', ')
              }>
                {(() => {
                  const rates = (stats.groups || [])
                    .filter(g => parseFloat(g.rate) > 0)
                    .map(g => parseFloat(g.rate).toFixed(2));
                  return rates.length > 0 ? `${rates.join(', ')} pip/lot` : '—';
                })()}
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-ib-50 rounded-lg border border-ib-100">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-ib-600" />
              <p className="text-sm font-semibold text-ib-900">About Commission</p>
            </div>
            <p className="text-xs text-ib-700 leading-relaxed">
              Your commissions are automatically calculated and added to your available balance daily.
              Payouts depend on your current IB level and client trading activity.
            </p>
          </div>
        </Card>
      </div>

      {/* Group-Based Pip Rates */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Pip Commissions per Group</h2>
        <Table
          rows={pipRatesData}
          columns={[
            {
              key: 'accountGroup',
              label: 'Account Group',
              render: (value) => <span className="font-semibold text-gray-900">{value}</span>,
            },
            {
              key: 'yourRate',
              label: 'Your Current Rate',
              render: (value) => (
                <span className="px-3 py-1 bg-ib-100 text-ib-800 rounded-full text-sm font-medium">
                  {value}
                </span>
              ),
            }
          ]}
          pageSize={10}
        />
      </Card>
    </div>
  );
}

export default IBProfileSettings;
