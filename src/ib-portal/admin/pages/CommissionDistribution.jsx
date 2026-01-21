import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import StatCard from '../../ui/StatCard';
import Table from '../../ui/Table';
import Button from '../../ui/Button';
import WaveLoader from '../../ui/WaveLoader.jsx';
import Toast from '../../../components/Toast.jsx';
import ibAdminService from '../../../services/ibAdminService';
import {
  Users,
  User,
  UserCheck,
  Wallet,
  RefreshCw,
  Eye,
  FileText,
  Send,
  X,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  DollarSign,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function CommissionDistribution() {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [selectedIB, setSelectedIB] = useState(null);
  const [calculationData, setCalculationData] = useState(null);
  const [detailsData, setDetailsData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [summaryStats, setSummaryStats] = useState({
    totalApprovedIBs: { value: '0' },
    totalDirectClients: { value: '0' },
    totalSubIBs: { value: '0' },
    totalIBBalance: { value: '$0.00' },
  });
  const [commissionData, setCommissionData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [rateFilter, setRateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('approvalDate');
  const [distributeAmount, setDistributeAmount] = useState('');
  const [distributeNotes, setDistributeNotes] = useState('');
  const [distributing, setDistributing] = useState(false);

  const modalClientColumns = [
    { key: 'name', label: 'Name', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'level', label: 'Level', render: (v) => <span className="text-blue-600 font-bold">{v}</span> },
    { key: 'email', label: 'Email', render: (v) => <span className="text-gray-600 truncate block max-w-[150px] sm:max-w-[250px]">{v}</span> },
    { key: 'accounts', label: 'Accounts', render: (v) => <span className="text-gray-700">{v}</span> },
    { key: 'balance', label: 'Balance', render: (v) => <span className="font-bold text-gray-900">{v}</span> },
  ];

  const modalSubIBColumns = [
    { key: 'name', label: 'Name', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'level', label: 'Level', render: (v) => <span className="text-blue-600 font-bold">{v}</span> },
    { key: 'email', label: 'Email', render: (v) => <span className="text-gray-600 truncate block max-w-[150px] sm:max-w-[250px]">{v}</span> },
    {
      key: 'ibRate', label: 'IB Rate', render: (v) => (
        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[11px] font-bold">
          {v} pip
        </span>
      )
    },
    { key: 'accounts', label: 'Accounts', render: (v) => <span className="text-gray-700">{v}</span> },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      const [summaryRes, listRes] = await Promise.all([
        fetch(`${API_BASE_URL}/ib-requests/commission-distribution/summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/ib-requests/commission-distribution/list`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        if (summaryData.success) {
          setSummaryStats({
            totalApprovedIBs: { value: summaryData.data.totalApprovedIBs.toString() },
            totalDirectClients: { value: summaryData.data.totalDirectClients.toString() },
            totalSubIBs: { value: summaryData.data.totalSubIBs.toString() },
            totalIBBalance: { value: `$${parseFloat(summaryData.data.totalIBBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          });
        }
      }

      if (listRes.ok) {
        const listData = await listRes.json();
        if (listData.success) {
          setCommissionData(listData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching commission distribution data:', error);
      setToast({
        message: 'Failed to load commission distribution data',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCalculationData = async (ibId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/ib-requests/commission-distribution/${ibId}/calculation`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCalculationData(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching calculation data:', error);
      setToast({
        message: 'Failed to load commission calculation',
        type: 'error'
      });
    }
  };

  const fetchDetailsData = async (ibId) => {
    try {
      setDetailsLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/ib-requests/commission-distribution/${ibId}/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDetailsData(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching details data:', error);
      setToast({
        message: 'Failed to load IB details',
        type: 'error'
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  // Filtered and sorted data
  const filteredData = commissionData.filter(ib => {
    const matchesSearch = !searchTerm ||
      ib.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ib.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRate = rateFilter === 'all' || ib.ibRate === rateFilter;

    return matchesSearch && matchesRate;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'commission':
        return parseFloat(b.commission.replace('$', '')) - parseFloat(a.commission.replace('$', ''));
      case 'balance':
        return parseFloat(b.totalBalance.replace('$', '')) - parseFloat(a.totalBalance.replace('$', ''));
      case 'approvalDate':
      default:
        return new Date(b.approvedDate) - new Date(a.approvedDate);
    }
  });

  const commissionColumns = [
    {
      key: 'srNo',
      label: 'Sr No.',
      render: (value, row, index) => <span className="text-gray-700">{index + 1}</span>,
    },
    {
      key: 'ibDetails',
      label: 'IB Details',
      render: (value, row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-600">{row.email}</p>
          <p className="text-xs text-gray-500">Approved: {row.approvedDate}</p>
        </div>
      ),
    },
    {
      key: 'ibRate',
      label: 'IB Rate',
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          {row.groupRates && row.groupRates.length > 0 ? (
            row.groupRates.slice(0, 2).map((g, i) => (
              <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-bold w-fit">
                {g.name}: {g.rate} pip
              </span>
            ))
          ) : (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold w-fit">
              PIP {value}
            </span>
          )}
          {row.groupRates && row.groupRates.length > 2 && (
            <span className="text-[10px] text-gray-500">+{row.groupRates.length - 2} more</span>
          )}
        </div>
      ),
    },
    {
      key: 'directClients',
      label: 'Direct Clients',
      render: (value) => (
        <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
          {value}
        </span>
      ),
    },
    {
      key: 'subIBs',
      label: 'Sub-IBs',
      render: (value) => (
        <span className="inline-flex items-center justify-center w-8 h-8 bg-cyan-100 text-cyan-800 rounded-full text-xs font-semibold">
          {value}
        </span>
      ),
    },
    {
      key: 'totalReferrals',
      label: 'Total Referrals',
      render: (value) => (
        <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
          {value}
        </span>
      ),
    },
    {
      key: 'totalBalance',
      label: 'Available Balance',
      render: (value, row) => <span className="font-semibold text-gray-900">${row.ibBalance}</span>,
    },
    {
      key: 'commission',
      label: 'Commission',
      render: (value) => <span className="font-semibold text-green-600">{value}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <button
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="View Details"
            onClick={() => handleViewDetails(row)}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
            title="Commission Calculation"
            onClick={() => handleCommissionCalculation(row)}
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors"
            title="Distribute Commission"
            onClick={() => handleDistributeCommission(row)}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleViewDetails = async (ib) => {
    setSelectedIB(ib);
    setShowDetailsModal(true);
    await fetchDetailsData(ib.id);
  };

  const handleCommissionCalculation = async (ib) => {
    setSelectedIB(ib);
    setShowCommissionModal(true);
    await fetchCalculationData(ib.id);
  };

  const handleDistributeCommission = (ib) => {
    setSelectedIB(ib);
    setDistributeAmount(ib.commission.replace('$', ''));
    setDistributeNotes('');
    setShowDistributeModal(true);
  };

  const handleCloseModal = () => {
    setShowCommissionModal(false);
    setShowDetailsModal(false);
    setShowDistributeModal(false);
    setSelectedIB(null);
    setCalculationData(null);
    setDetailsData(null);
  };

  const handleDistribute = async () => {
    if (!distributeAmount || isNaN(parseFloat(distributeAmount)) || parseFloat(distributeAmount) <= 0) {
      setToast({ message: 'Please enter a valid amount', type: 'error' });
      return;
    }

    try {
      setDistributing(true);
      const res = await ibAdminService.distributeCommission(selectedIB.id, {
        amount: parseFloat(distributeAmount),
        notes: distributeNotes
      });

      if (res.success) {
        setToast({ message: 'Commission distributed successfully', type: 'success' });
        fetchData(); // Refresh summary and list
        handleCloseModal();
      } else {
        setToast({ message: res.message || 'Failed to distribute commission', type: 'error' });
      }
    } catch (error) {
      console.error('Error distributing commission:', error);
      setToast({ message: 'An error occurred', type: 'error' });
    } finally {
      setDistributing(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <WaveLoader message="Loading commission distribution data..." />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">IB Commission Distribution</h1>
        <p className="text-gray-600">Advanced IB Commission Management and Distribution System</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Approved IBs"
          value={summaryStats.totalApprovedIBs.value}
          icon={Users}
          iconBg="bg-blue-100"
          valueColor="text-blue-600"
        />

        <StatCard
          title="Total Direct Clients"
          value={summaryStats.totalDirectClients.value}
          icon={User}
          iconBg="bg-green-100"
          valueColor="text-green-600"
        />

        <StatCard
          title="Total Sub-IBs"
          value={summaryStats.totalSubIBs.value}
          icon={UserCheck}
          iconBg="bg-cyan-100"
          valueColor="text-cyan-600"
        />

        <StatCard
          title="Total IB Balance"
          value={summaryStats.totalIBBalance.value}
          icon={Wallet}
          iconBg="bg-orange-100"
          valueColor="text-orange-600"
        />
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Rate</label>
            <select
              value={rateFilter}
              onChange={(e) => setRateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
            >
              <option value="all">All Rates</option>
              {[...new Set(commissionData.map(ib => ib.ibRate))].sort().map(rate => (
                <option key={rate} value={rate}>{rate}</option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
            >
              <option value="approvalDate">Approval Date</option>
              <option value="name">Name</option>
              <option value="commission">Commission</option>
              <option value="balance">Balance</option>
            </select>
          </div>
          <Button variant="primary" icon={RefreshCw} onClick={fetchData}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Commission Table */}
      <Card>
        {filteredData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No IBs found</p>
          </div>
        ) : (
          <Table
            rows={filteredData}
            columns={commissionColumns}
            pageSize={10}
            searchPlaceholder="Search IBs..."
            filters={{
              dateKey: 'approvedDate'
            }}
          />
        )}
      </Card>

      {/* Commission Calculation Modal */}
      {showCommissionModal && selectedIB && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Commission Calculation</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* IB Info */}
            <div className="p-6 border-b border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Commission Calculation for {selectedIB.name}</p>
              <p className="text-lg font-semibold text-gray-900">IB Rate: {selectedIB.ibRate} pip/lot</p>
            </div>

            {/* Summary Cards */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-gray-200">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Direct Commission</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${calculationData ? parseFloat(calculationData.directCommission).toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Residual Commission</p>
                <p className="text-2xl font-bold text-green-600">
                  ${calculationData ? parseFloat(calculationData.residualCommission).toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="bg-cyan-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Total Commission</p>
                <p className="text-2xl font-bold text-cyan-600">
                  ${calculationData ? parseFloat(calculationData.totalCommission).toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Total Lots</p>
                <p className="text-2xl font-bold text-orange-600">
                  {calculationData ? parseFloat(calculationData.totalLots).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>

            {/* Direct Client Commission */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Direct Client Commission</h3>
              <p className="text-sm text-gray-600 mb-4">Commission from direct clients (non-IB users)</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Client</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Level</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Trades</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Lots</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculationData && calculationData.directClients && calculationData.directClients.length > 0 ? (
                      calculationData.directClients.map((client, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="px-4 py-2 text-sm text-gray-900">{client.client}</td>
                          <td className="px-4 py-2 text-sm text-blue-600 font-medium">{client.level}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{client.trades}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{client.lots}</td>
                          <td className="px-4 py-2 text-sm font-semibold text-green-600">{client.commission}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                          No direct client data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Residual Commission */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Residual Commission from Sub-IBs</h3>
              <p className="text-sm text-gray-600 mb-4">Commission from sub-IBs with lower rates</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Sub-IB</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Level</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Rate</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Trades</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Lots</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Resid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculationData && calculationData.subIBs && calculationData.subIBs.length > 0 ? (
                      calculationData.subIBs.map((subIB, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="px-4 py-2 text-sm text-gray-900">{subIB.subIB}</td>
                          <td className="px-4 py-2 text-sm text-blue-600 font-medium">{subIB.level}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{subIB.rate} pip</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{subIB.trades}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{subIB.lots}</td>
                          <td className="px-4 py-2 text-sm font-semibold text-green-600">{subIB.residual}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                          No sub-IB data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Commission Summary */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Direct Client Commission:</span>
                  <span className="font-semibold text-gray-900">
                    ${calculationData ? parseFloat(calculationData.directCommission).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Residual Commission:</span>
                  <span className="font-semibold text-gray-900">
                    ${calculationData ? parseFloat(calculationData.residualCommission).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Distributed Commission:</span>
                  <span className="font-semibold text-gray-900">
                    ${calculationData ? parseFloat(calculationData.distributedCommission).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                  <span className="text-gray-900 font-semibold">Total Commission:</span>
                  <span className="font-bold text-green-600">
                    ${calculationData ? parseFloat(calculationData.totalCommission).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Trades:</span>
                  <span className="font-semibold text-gray-900">
                    {calculationData ? calculationData.totalTrades : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Lots:</span>
                  <span className="font-semibold text-gray-900">
                    {calculationData ? parseFloat(calculationData.totalLots).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-gray-600">IB Rate:</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                    {selectedIB.ibRate} pip
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IB Details Modal */}
      {showDetailsModal && selectedIB && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">IB Details</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* IB Information and Commission Summary */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-200">
              {/* IB Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">IB Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Name</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {detailsData ? detailsData.name : selectedIB.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {detailsData ? detailsData.email : selectedIB.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {detailsData ? detailsData.phone : selectedIB.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Approved Date</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {detailsData ? detailsData.approvedDate : selectedIB.approvedDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Member Since</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {detailsData ? detailsData.memberSince : selectedIB.memberSince}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Available Balance</p>
                    <p className="text-sm font-bold text-gray-900">
                      ${detailsData ? detailsData.ibBalance : selectedIB.ibBalance}
                    </p>
                  </div>
                </div>

                {/* Approved Group Rates Section */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                    Approved Group Pip Rates
                  </h4>
                  {detailsLoading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                    </div>
                  ) : detailsData && detailsData.approvedGroups && detailsData.approvedGroups.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {detailsData.approvedGroups.map((group, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                          <span className="text-xs font-medium text-gray-600">{group.name}:</span>
                          <span className="text-xs font-bold text-blue-600">{group.rate} pip</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No specific group rates assigned</p>
                  )}
                </div>
              </div>

              {/* Commission Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Summary</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Trades</p>
                    <p className="text-lg font-bold text-gray-900">
                      {detailsData ? detailsData.totalTrades : 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Lots</p>
                    <p className="text-lg font-bold text-gray-900">
                      {detailsData ? detailsData.totalLots : '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Commission</p>
                    <p className="text-lg font-bold text-green-600">
                      {detailsData ? detailsData.totalCommission : '$0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Estimated Earnings</p>
                    <p className="text-lg font-bold text-green-600">
                      {detailsData ? detailsData.estimatedEarnings : '$0.00'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Clients and Sub-IBs */}
            <div className="p-6 space-y-8">
              {/* Direct Clients */}
              <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-ib-600" />
                    Direct Clients ({detailsData ? detailsData.directClients.length : selectedIB.directClients})
                  </h3>
                </div>
                <Table
                  rows={detailsData ? detailsData.directClients : []}
                  columns={modalClientColumns}
                  loading={detailsLoading}
                  pageSize={5}
                  searchPlaceholder="Search clients..."
                />
              </div>

              {/* Sub-IBs */}
              <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-cyan-600" />
                    Sub-IBs ({detailsData ? detailsData.subIBs.length : selectedIB.subIBs})
                  </h3>
                </div>
                <Table
                  rows={detailsData ? detailsData.subIBs : []}
                  columns={modalSubIBColumns}
                  loading={detailsLoading}
                  pageSize={5}
                  searchPlaceholder="Search sub-IBs..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distribute Commission Modal */}
      {showDistributeModal && selectedIB && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Distribute Commission</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Available Balance:</span>
                  <span className="font-bold text-gray-900">${selectedIB.ibBalance}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Commission:</span>
                  <span className="font-bold text-green-600">{selectedIB.commission}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commission Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={distributeAmount}
                  onChange={(e) => setDistributeAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Calculated earned commission: {selectedIB.commission}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Add any notes about this commission distribution."
                  value={distributeNotes}
                  onChange={(e) => setDistributeNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <Button variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleDistribute}
                disabled={distributing}
              >
                {distributing ? 'Distributing...' : 'Distribute Commission'}
              </Button>
            </div>
          </div>
        </div>
      )}

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

export default CommissionDistribution;
