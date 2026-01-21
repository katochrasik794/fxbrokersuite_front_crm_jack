import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import StatCard from '../../ui/StatCard';
import Table from '../../ui/Table';
import Button from '../../ui/Button';
import ibService from '../../../services/ibService';
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Printer,
  Download,
  Eye,
  User,
  Mail,
  FileText,
} from 'lucide-react';

function ReferralReport() {
  const [selectedLevel, setSelectedLevel] = useState('L1');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await ibService.getReferralReport();
        if (res.success) {
          setReportData(res.data);
        }
      } catch (error) {
        console.error('Error fetching referral report:', error);
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

  const currentLevelData = reportData?.levels[selectedLevel] || { referrals: 0, deposits: 0, withdrawals: 0, clients: [] };
  const summary = reportData?.summary || { totalReferrals: 0, totalDeposits: 0, totalWithdrawals: 0, depositCount: 0, withdrawalCount: 0 };

  const tableColumns = [
    {
      key: 'name',
      label: 'Name',
      render: (value) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-gray-900">{value}</span>
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
      key: 'type',
      label: 'Type',
      render: (value) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
          {value}
        </span>
      ),
    },
    {
      key: 'deposits',
      label: 'Deposits',
      render: (value, row) => (
        <div>
          <p className="font-semibold text-gray-900">{formatCurrency(row.deposits.amount)}</p>
          <p className="text-xs text-gray-500">{row.deposits.count} transaction(s)</p>
        </div>
      ),
    },
    {
      key: 'withdrawals',
      label: 'Withdrawals',
      render: (value, row) => (
        <div>
          <p className="font-semibold text-gray-900">{formatCurrency(row.withdrawals.amount)}</p>
          <p className="text-xs text-gray-500">{row.withdrawals.count} transaction(s)</p>
        </div>
      ),
    },
    {
      key: 'netAmount',
      label: 'Net Amount',
      render: (value) => (
        <span className={`font-bold ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      key: 'join_date',
      label: 'Joined',
      render: (value) => (
        <span className="text-gray-600 text-sm">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <Button
          variant="outline"
          size="sm"
          icon={Eye}
          onClick={() => console.log('Details for:', row.id)}
          className="text-xs"
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Referral Report
          </h1>
          <p className="text-gray-600">Track deposits and withdrawals by referral level</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" icon={Printer} onClick={() => window.print()}>Print</Button>
          <Button variant="outline" size="md" icon={Download} onClick={() => console.log('Exporting...')}>Export</Button>
        </div>
      </div>

      {/* Level Selection Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
        {['L1', 'L2', 'L3'].map((level) => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${selectedLevel === level
              ? 'bg-white text-ib-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Level {level.replace('L', '')}
          </button>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Referrals"
          value={summary.totalReferrals}
          subtitle="All referral levels"
          icon={Users}
          iconBg="bg-green-100"
          valueColor="text-green-600"
        />

        <StatCard
          title="Total Deposits"
          value={formatCurrency(summary.totalDeposits)}
          subtitle={`${summary.depositCount} transaction(s)`}
          icon={TrendingUp}
          iconBg="bg-green-100"
          valueColor="text-green-600"
        />

        <StatCard
          title="Total Withdrawals"
          value={formatCurrency(summary.totalWithdrawals)}
          subtitle={`${summary.withdrawalCount} transaction(s)`}
          icon={TrendingDown}
          iconBg="bg-orange-100"
          valueColor="text-orange-600"
        />

        <StatCard
          title="Net Amount"
          value={formatCurrency(summary.totalDeposits - summary.totalWithdrawals)}
          subtitle="Total network net"
          icon={DollarSign}
          iconBg="bg-blue-100"
          valueColor="text-blue-600"
        />
      </div>

      {/* Level-wise Table */}
      <Card>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Level {selectedLevel.replace('L', '')} Details</h2>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                {currentLevelData.referrals} Referrals
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                {formatCurrency(currentLevelData.deposits)} Deposits
              </span>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                {formatCurrency(currentLevelData.withdrawals)} Withdrawals
              </span>
            </div>
          </div>
        </div>

        <Table
          rows={currentLevelData.clients}
          columns={tableColumns}
          pageSize={10}
          searchPlaceholder="Search by name or email..."
          filters={{
            searchKeys: ['name', 'email'],
            dateKey: 'join_date',
          }}
        />
      </Card>
    </div>
  );
}

export default ReferralReport;
