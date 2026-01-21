import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import StatCard from '../../ui/StatCard';
import Button from '../../ui/Button';
import ibService from '../../../services/ibService';
import {
  Wallet,
  TrendingUp,
  Users,
  DollarSign,
  CreditCard,
  BarChart3,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  User,
  Activity
} from 'lucide-react';

function AccountOverview() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {
      clientCount: 0,
      teamBalance: 0,
      availableBalance: 0,
      currency: 'USD',
      myAccountCount: 0,
      myTotalBalance: 0,
      myTotalEquity: 0,
      ibStatus: 'none',
      ibType: 'normal'
    },
    commission: {
      total_commission: 0,
      my_commission: 0,
      client_commission: 0,
      client_lots: 0,
      my_lots: 0
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, commissionRes] = await Promise.all([
          ibService.getDashboardStats(),
          ibService.getCommissionSummary()
        ]);

        if (statsRes.success) {
          setData(prev => ({
            ...prev,
            stats: statsRes.data.stats,
            commission: commissionRes.success ? commissionRes.data : prev.commission
          }));
        }
      } catch (error) {
        console.error('Error fetching account overview data:', error);
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
      currency: data.stats.currency || 'USD',
    }).format(amount);
  };

  const { stats, commission } = data;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Overview</h1>
        <p className="text-gray-600">Your trading accounts grouped by type</p>
      </div>

      {/* Account Stats Grid - 8 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Accounts */}
        <StatCard
          title="Total Accounts"
          value={stats.myAccountCount}
          subtitle="Personal Trading Accounts"
          icon={CreditCard}
          iconBg="bg-blue-100"
          valueColor="text-blue-600"
        />

        {/* Total Balance */}
        <StatCard
          title="Total Balance"
          value={formatCurrency(stats.myTotalBalance)}
          subtitle="All personal accounts"
          icon={Wallet}
          iconBg="bg-green-100"
          valueColor="text-green-600"
        />

        {/* Total Equity */}
        <StatCard
          title="Total Equity"
          value={formatCurrency(stats.myTotalEquity)}
          subtitle="Live Equity"
          icon={TrendingUp}
          iconBg="bg-cyan-100"
          valueColor="text-cyan-600"
        />

        {/* Account Status */}
        <Card className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Account Status</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${stats.ibStatus === 'approved' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                  {stats.ibStatus === 'approved' ? (
                    <><CheckCircle2 className="w-3 h-3" /> IB Approved</>
                  ) : (
                    <><Activity className="w-3 h-3" /> {stats.ibStatus.charAt(0).toUpperCase() + stats.ibStatus.slice(1)}</>
                  )}
                </span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        {/* Available Balance */}
        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-green-600 mb-1">{formatCurrency(stats.availableBalance)}</p>
              <p className="text-xs text-gray-500">Ready for withdrawal</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg flex-shrink-0">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Client Commission */}
        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Client Commission</p>
              <p className="text-2xl font-bold text-cyan-600 mb-1">{formatCurrency(commission.client_commission)}</p>
              <p className="text-xs text-gray-500">Total volume: {parseFloat(commission.client_lots).toFixed(2)} lots</p>
              <p className="text-xs text-blue-600 mt-1">From approved IB clients only</p>
            </div>
            <div className="p-3 bg-cyan-100 rounded-lg flex-shrink-0">
              <Users className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </Card>

        {/* Team Balance */}
        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Team Balance</p>
              <p className="text-2xl font-bold text-blue-600 mb-1">{formatCurrency(stats.teamBalance)}</p>
              <p className="text-xs text-gray-500">From all clients</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Direct Referrals */}
        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Direct Referrals</p>
              <p className="text-2xl font-bold text-purple-600 mb-1">{stats.clientCount}</p>
              <p className="text-xs text-gray-500">Directly referred clients</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* No Trading Accounts Section */}
      {stats.myAccountCount === 0 && (
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-ib-50/50 to-transparent"></div>
          <div className="relative text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-ib-100 to-ib-200 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <CreditCard className="w-12 h-12 text-ib-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Trading Accounts Found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You don't have any trading accounts yet. Create your first account to start trading.
            </p>
            {/* Button removed as per user request */}
          </div>
        </Card>
      )}

      {/* IB Commission Information */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-ib-100 rounded-lg">
            <Clock className="w-5 h-5 text-ib-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">IB Commission Information</h2>
            <p className="text-sm text-gray-600 mt-1">Your Commission Rates (Per Lot)</p>
          </div>
        </div>

        {/* Commission Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* My Trades Commission */}
          <Card className="border-2 border-gray-200 hover:border-ib-300 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700 mb-2">My Trades Commission</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(commission.my_commission)}</p>
                <p className="text-sm text-gray-600">{parseFloat(commission.my_lots).toFixed(2)} lots traded</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl flex-shrink-0">
                <User className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Referral Clients Commission */}
          <Card className="border-2 border-gray-200 hover:border-ib-300 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700 mb-2">Referral Clients Commission</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(commission.client_commission)}</p>
                <p className="text-sm text-gray-600 mb-1">Total volume: {parseFloat(commission.client_lots).toFixed(2)} lots (all clients)</p>
                <p className="text-xs text-orange-600 font-medium">Commission from approved IB clients only</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl flex-shrink-0">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Total Commission Earned Banner */}
        <div className="bg-gradient-to-r from-ib-600 to-ib-700 rounded-xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-ib-100 mb-2">Total Commission Earned</p>
              <p className="text-4xl font-bold mb-2">{formatCurrency(commission.total_commission)}</p>
              <p className="text-sm text-ib-100 mb-1">From {stats.clientCount} network referrals</p>
              <p className="text-xs text-ib-200">Commission only from approved IB clients</p>
            </div>
            <div className="p-6 bg-white/20 rounded-full backdrop-blur-sm">
              <DollarSign className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        {/* Important Note */}
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 mb-1">Important Note</p>
              <p className="text-xs text-blue-800 leading-relaxed">
                Commission is calculated based on your approved IB clients' trading activity on each account type.
                Total volume shown includes all clients (IB + non-IB), but commission is only earned from approved IB clients.
                Data is updated every 30 minutes. Last updated: {new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default AccountOverview;
