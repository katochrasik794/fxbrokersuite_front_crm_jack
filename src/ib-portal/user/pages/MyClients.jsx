import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import StatCard from '../../ui/StatCard';
import Table from '../../ui/Table';
import ibService from '../../../services/ibService';
import {
  Users,
  TrendingUp,
  DollarSign,
  UserCheck,
  Mail,
  Calendar,
  CreditCard,
  Wallet,
  BarChart3,
  Activity,
} from 'lucide-react';

function MyClients() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({
    clientCount: 0,
    teamBalance: 0,
    availableBalance: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [clientsRes, dashboardRes] = await Promise.all([
          ibService.getClients(),
          ibService.getDashboardStats()
        ]);

        if (clientsRes.success) {
          setClients(clientsRes.data.clients.map(c => {
            let pipRate = '-';
            if (c.ib_status === 'approved') {
              const rates = typeof c.sub_ib_rates === 'string' ? JSON.parse(c.sub_ib_rates) : (c.sub_ib_rates || {});
              const ratesArr = Object.values(rates).map(v => parseFloat(v || 0)).filter(v => v > 0);
              const avgRate = ratesArr.length > 0 ? (ratesArr.reduce((a, b) => a + b, 0) / ratesArr.length) : 0;
              pipRate = avgRate > 0 ? `${avgRate.toFixed(2)} pip` : '-';
            }

            return {
              clientName: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
              clientId: c.id,
              email: c.email,
              joinDate: new Date(c.join_date).toLocaleDateString(),
              accounts: c.account_count,
              balance: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(c.total_balance),
              volume: '0.00', // Placeholder
              commission: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(c.total_commission_earned || 0),
              type: c.level === 1 ? 'Direct' : `Level ${c.level}`,
              level: c.level,
              referBy: c.referred_by_name || 'You',
              referByEmail: c.referred_by_email,
              pipRate,
              ibBalance: c.ib_balance ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(c.ib_balance) : null
            };
          }));
        }

        if (dashboardRes.success) {
          setStats(dashboardRes.data.stats);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
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


  const clientsColumns = [
    {
      key: 'clientName',
      label: 'Client Name',
      render: (value, row) => (
        <div>
          <span className="font-semibold text-gray-900">{value}</span>
          <span className="text-xs text-gray-500 ml-1">(ID: {row.clientId})</span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">{value}</span>
        </div>
      ),
    },
    {
      key: 'referBy',
      label: 'Refer By',
      render: (value, row) => (
        <div>
          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${value === 'You' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            {value}
          </span>
          {row.referByEmail && <div className="text-[10px] text-gray-400 mt-0.5">{row.referByEmail}</div>}
        </div>
      ),
    },
    {
      key: 'joinDate',
      label: 'Join Date',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">{value}</span>
        </div>
      ),
    },
    {
      key: 'accounts',
      label: 'Accounts',
      render: (value) => (
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (value, row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-semibold">{value}</span>
            <span className="text-[10px] text-gray-500 ml-1">(Acc)</span>
          </div>
          {row.ibBalance && (
            <div className="flex items-center gap-2 mt-1">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-green-700 font-semibold text-sm">{row.ibBalance}</span>
              <span className="text-[10px] text-green-600 ml-1">(IB)</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'volume',
      label: 'Volume (Lots)',
      render: (value) => (
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900">{value}</span>
        </div>
      ),
    },
    {
      key: 'commission',
      label: 'Commission',
      render: (value) => (
        <span className="font-semibold text-green-600">{value}</span>
      ),
    },
    {
      key: 'pipRate',
      label: 'IB Rate',
      render: (value) => (
        value !== '-' ? (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[11px] font-bold whitespace-nowrap">
            {value}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      key: 'type',
      label: 'Level',
      render: (value, row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.level === 1 ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
          {value}
        </span>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-ib-100 rounded-lg">
          <Users className="w-6 h-6 text-ib-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My IB Clients</h1>
          <p className="text-gray-600 mt-1">Manage and track your introducing broker clients</p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clients"
          value={stats.clientCount}
          subtitle="Total network"
          icon={Users}
          iconBg="bg-blue-100"
          valueColor="text-blue-600"
        />

        <StatCard
          title="Team Balance"
          value={new Intl.NumberFormat('en-US', { style: 'currency', currency: stats.currency || 'USD' }).format(stats.teamBalance || 0)}
          subtitle="Total across all client accounts"
          icon={TrendingUp}
          iconBg="bg-green-100"
          valueColor="text-green-600"
        />

        <StatCard
          title="Available Commission"
          value={new Intl.NumberFormat('en-US', { style: 'currency', currency: stats.currency || 'USD' }).format(stats.availableBalance || 0)}
          subtitle="Ready for withdrawal"
          icon={DollarSign}
          iconBg="bg-yellow-100"
          valueColor="text-yellow-600"
        />

        <StatCard
          title="Active Traded Volume"
          value="0.00"
          subtitle="lots"
          icon={UserCheck}
          iconBg="bg-blue-100"
          valueColor="text-blue-600"
        />
      </div>

      {/* Clients Table */}
      <Card>
        {/* Table Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-ib-600 text-white rounded-full text-sm font-semibold">
              Referral Network
            </span>
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{stats.clientCount}</span> member(s) found
            </div>
          </div>
        </div>

        {/* Table */}
        <Table
          rows={clients}
          columns={clientsColumns}
          pageSize={10}
          searchPlaceholder="Search clients..."
          filters={{
            searchKeys: ['clientName', 'email', 'clientId', 'referBy', 'referByEmail'],
            selects: [
              {
                key: 'type',
                label: 'All Types',
                options: ['Client', 'IB'],
              },
            ],
            dateKey: 'joinDate',
          }}
        />
      </Card>
    </div>
  );
}

export default MyClients;
