
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../ui/Card';
import StatCard from '../../ui/StatCard';
import Table from '../../ui/Table';
import Button from '../../ui/Button';
import Toast from '../../../components/Toast.jsx';
import WaveLoader from '../../ui/WaveLoader.jsx';
import ButtonLoader from '../../ui/ButtonLoader.jsx';
import {
  Users,
  UserCheck,
  TrendingUp,
  ArrowLeft,
  Eye,
  Edit,
  X,
  Info,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Tag,
  Wallet,
  CreditCard,
  DollarSign,
  FileText,
  Download,
  BarChart3,
  AlertCircle,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fxbrokersuite-back-crm-jack.onrender.com/api';

function IBProfile() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const [selectedIB, setSelectedIB] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalData, setEditModalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupsWithIbs, setGroupsWithIbs] = useState([]);
  const [allIbs, setAllIbs] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedGroupDetail, setSelectedGroupDetail] = useState(null);
  const [stats, setStats] = useState({
    activeIBs: 0,
    masterIBs: 0,
    subIbs: 0,
    totalReferrals: 0,
  });
  const [toast, setToast] = useState(null);
  const [savingPipRates, setSavingPipRates] = useState(false);
  const [pipRateInputs, setPipRateInputs] = useState({});
  const [referredUsers, setReferredUsers] = useState([]);
  const [loadingReferredUsers, setLoadingReferredUsers] = useState(false);
  const [expandedUserRow, setExpandedUserRow] = useState(null);
  const [selectedAccountForTrades, setSelectedAccountForTrades] = useState({});
  const [tradeHistory, setTradeHistory] = useState({});

  // Fetch IB profiles grouped by groups
  useEffect(() => {
    fetchIbProfiles();
  }, []);

  const fetchIbProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`${API_BASE_URL}/ib-requests/profiles-by-groups`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch IB profiles');
      }

      const data = await response.json();
      if (data.success) {
        setGroupsWithIbs(data.data.groups || []);

        // Use allIbs from backend for the table (ensures no IBs are missing)
        const allIbsList = (data.data.allIbs || []).map(ib => ({
          id: ib.ibRequestId,
          userId: ib.userId,
          name: ib.name,
          email: ib.email,
          referredBy: ib.referredBy ? { name: ib.referredBy, email: '' } : { name: '', email: '' },
          type: ib.ibType === 'master' ? 'MASTER' : ib.ibType === 'sub_ib' ? 'SUB-IB' : 'NORMAL',
          groupPipCommissions: ib.groupPipCommissions || {},
          referrals: 0,
          totalCommission: ib.totalCommission || '$0.00',
          ibBalance: ib.ibBalance || '0.00',
          status: 'Active',
          accounts: ib.accounts || [],
          createdAt: ib.createdAt,
        }));
        setAllIbs(allIbsList);

        // Calculate stats
        const totalIbs = allIbsList.length;
        const masterIbs = allIbsList.filter(ib => ib.type === 'MASTER').length;
        const subIbs = allIbsList.filter(ib => ib.type === 'SUB-IB').length;

        setStats({
          activeIBs: totalIbs,
          masterIBs: masterIbs,
          subIbs: subIbs,
          totalReferrals: 0,
        });
      } else {
        throw new Error(data.message || 'Failed to fetch IB profiles');
      }
    } catch (err) {
      console.error('Error fetching IB profiles:', err);
      setError(err.message);
      setToast({
        message: err.message || 'Failed to fetch IB profiles',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAvgPipRate = (groupPipCommissions, groups) => {
    if (!groupPipCommissions || Object.keys(groupPipCommissions).length === 0) {
      return 'Not configured';
    }

    const values = Object.values(groupPipCommissions).filter(v => v !== null && v !== '' && !isNaN(parseFloat(v)));
    if (values.length === 0) {
      return 'Not configured';
    }

    const sum = values.reduce((acc, val) => acc + parseFloat(val), 0);
    const avg = sum / values.length;
    return `${avg.toFixed(2)} pip (avg, group-based)`;
  };

  const calculateOverallAvgPipRate = (groups) => {
    let totalPip = 0;
    let count = 0;

    groups.forEach(group => {
      group.ibs.forEach(ib => {
        if (ib.groupPipCommissions && Object.keys(ib.groupPipCommissions).length > 0) {
          const values = Object.values(ib.groupPipCommissions).filter(v => v !== null && v !== '' && !isNaN(parseFloat(v)));
          if (values.length > 0) {
            const sum = values.reduce((acc, val) => acc + parseFloat(val), 0);
            totalPip += sum / values.length;
            count++;
          }
        }
      });
    });

    return count > 0 ? totalPip / count : 0;
  };

  // Dummy data for IB profiles list (fallback)
  const ibProfilesData = [
    {
      id: 1,
      name: 'ABCD XYZ',
      email: 'admin@gmail.com',
      referredBy: { name: '', email: '' },
      type: 'NORMAL',
      pipRate: '0.53 pip (avg, group-based)',
      referrals: 0,
      totalCommission: '$0.00',
      status: 'Active',
    },
    {
      id: 2,
      name: 'Abdul Rehman',
      email: 'mani3130882929@gmail.com',
      referredBy: { name: 'nazeer sultan', email: 'asiacablg@gmail.com' },
      type: 'NORMAL',
      pipRate: '0.50 pip (avg, group-based)',
      referrals: 8,
      totalCommission: '$0.00',
      status: 'Active',
    },
    {
      id: 3,
      name: 'Aditya Nikam',
      email: 'adityanikam8149@gmail.com',
      referredBy: { name: 'Suyog Datrange', email: 'suyogdatrange@gmail.com' },
      type: 'NORMAL',
      pipRate: '1.50 pip (avg, group-based)',
      referrals: 4,
      totalCommission: '$0.00',
      status: 'Active',
    },
    {
      id: 4,
      name: 'Ajay Rajput',
      email: 'ajayrajput0019@gmail.com',
      referredBy: { name: 'Rohit Kamble', email: 'rohitkamble4147@gmail.com' },
      type: 'NORMAL',
      pipRate: '1.00 pip (avg, group-based)',
      referrals: 6,
      totalCommission: '$0.00',
      status: 'Active',
    },
    {
      id: 5,
      name: 'Ajay Thengil',
      email: 'ajaythengil@gmail.com',
      referredBy: { name: 'Candle Story', email: 'ceo.candlestory@gmail.com' },
      type: 'NORMAL',
      pipRate: '1.20 pip (avg, group-based)',
      referrals: 49,
      totalCommission: '$0.00',
      status: 'Active',
    },
    {
      id: 6,
      name: 'AJIT BHANDALKAR',
      email: 'devanshsaee0809@gmail.com',
      referredBy: { name: 'Sagar Shinde', email: 'sagarshinde0034@gmail.com' },
      type: 'NORMAL',
      pipRate: 'Not configured',
      referrals: 0,
      totalCommission: '$0.00',
      status: 'Active',
    },
    {
      id: 7,
      name: 'AKANKSHA BAHADURE',
      email: 'akankshabahadure@gmail.com',
      referredBy: { name: 'V R ENTERPRISE', email: 'vrenterprisessatara@gmail.com' },
      type: 'NORMAL',
      pipRate: '1.50 pip (avg, group-based)',
      referrals: 0,
      totalCommission: '$0.00',
      status: 'Active',
    },
    {
      id: 8,
      name: 'Akash Jadhav',
      email: 'akashjadhav@gmail.com',
      referredBy: { name: 'Amar Nikam', email: 'amarjeet4770@gmail.com' },
      type: 'NORMAL',
      pipRate: '1.00 pip (avg, group-based)',
      referrals: 0,
      totalCommission: '$0.00',
      status: 'Active',
    },
  ];


  // IB Pip Rates by Group data
  const pipRatesByGroup = [
    {
      id: 'classic',
      label: 'Classic IBs',
      group: 'OXO_B\\Classic',
      pipRate: '0.30',
      commission: '$3.00/lot',
    },
    {
      id: 'ecn',
      label: 'Raw + IBs',
      group: 'OXO_B\\ECN',
      pipRate: '0.01',
      commission: '$0.10/lot',
    },
    {
      id: 'plus',
      label: 'Plus IBs',
      group: 'OXO_B\\Plus',
      pipRate: '0.50',
      commission: '$5.00/lot',
    },
    {
      id: 'pro',
      label: 'Pro IBs',
      group: 'OXO_B\\Pro',
      pipRate: '1.00',
      commission: '$10.00/lot',
    },
    {
      id: 'standard',
      label: 'Standard IBs',
      group: 'OXO_B\\Standard',
      pipRate: '1.50',
      commission: '$15.00/lot',
    },
    {
      id: 'startup',
      label: 'Startup IBs',
      group: 'OXO_B\\Startup',
      pipRate: '0.01',
      commission: '$0.10/lot',
    },
  ];

  const profilesColumns = [
    {
      key: 'name',
      label: 'IB Name',
      render: (value) => <span className="font-semibold text-gray-900">{value}</span>,
    },
    {
      key: 'email',
      label: 'Email',
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
    {
      key: 'referredBy',
      label: 'Referred By',
      render: (value) => {
        if (!value.name) return <span className="text-gray-400">-</span>;
        return (
          <div>
            <a href={`mailto:${value.email}`} className="text-blue-600 hover:underline font-medium">
              {value.name}
            </a>
            <div className="text-xs text-gray-600">{value.email}</div>
          </div>
        );
      },
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
      key: 'pipRate',
      label: 'Pip Rate',
      render: (value, row) => {
        const groupPipCommissions = row.groupPipCommissions || {};

        // If no pip commissions configured
        if (!groupPipCommissions || Object.keys(groupPipCommissions).length === 0) {
          return <span className="text-gray-500 italic">Not configured</span>;
        }

        // Build group-wise pip rate display using groupsWithIbs state
        const pipRatesList = [];
        Object.entries(groupPipCommissions).forEach(([key, pipValue]) => {
          const numericPip = parseFloat(pipValue);
          // Skip zero or invalid rates
          if (pipValue !== null && pipValue !== '' && !isNaN(numericPip) && numericPip > 0) {
            // Robust Resolution: try to find group by ID or by Name (key might be either)
            const group = groupsWithIbs.find(g =>
              String(g.id) === String(key) ||
              String(g.groupName).toLowerCase() === String(key).toLowerCase()
            );

            if (group) {
              pipRatesList.push({
                groupName: group.dedicatedName || group.groupName,
                pipValue: numericPip
              });
            } else {
              // If we can't resolve it and it's a path (contains \), skip it as per "path will be never show"
              // Only push if it's not a path or if user explicitly wants unidentified ones (skipped for now)
              if (!String(key).includes('\\')) {
                pipRatesList.push({ groupName: key, pipValue: numericPip });
              }
            }
          }
        });

        if (pipRatesList.length === 0) {
          return <span className="text-red-500 font-medium italic">Not Allotted</span>;
        }

        // Sort by group name for consistent display
        pipRatesList.sort((a, b) => a.groupName.localeCompare(b.groupName));

        return (
          <div className="flex flex-col gap-1">
            {pipRatesList.map((item, index) => (
              <span key={index} className="text-gray-700 text-sm">
                {item.groupName}: {item.pipValue.toFixed(1)} pip
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'referrals',
      label: 'Referrals',
      render: (value) => <span className="font-semibold text-gray-900">{value}</span>,
    },
    {
      key: 'totalCommission',
      label: 'Total Commission',
      render: (value) => <span className="font-semibold text-green-600">{value}</span>,
    },
    {
      key: 'ibBalance',
      label: 'Available Balance',
      render: (value) => <span className="font-semibold text-gray-900">${value}</span>,
    },
    {
      key: 'workingPlansCount',
      label: 'Working Plans',
      render: (value, row) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900">{value || 0}</span>
          <span className={`text-[10px] font-bold uppercase ${row.planType === 'normal' ? 'text-orange-600' : row.planType === 'advanced' ? 'text-purple-600' : 'text-gray-400'}`}>
            {row.planType || 'None'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
          {value}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Eye}
            onClick={() => handleViewDetail(row)}
          >
            View
          </Button>
          <button
            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
            title="Edit"
            onClick={() => handleEditPipRates(row)}
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleViewDetail = (ib) => {
    const ibRequestId = ib.id || ib.ibRequestId;
    if (ibRequestId) {
      // Navigate to the detail page with ID
      navigate(`/admin/ib/ib-profile/${ibRequestId}`);
    }
  };

  // Fetch referred users when detail view is active
  useEffect(() => {
    if (viewMode === 'detail' && selectedIB) {
      const ibRequestId = selectedIB.id || selectedIB.ibRequestId;
      if (ibRequestId) {
        fetchReferredUsers(ibRequestId);
      }
    }
  }, [viewMode, selectedIB]);

  const fetchReferredUsers = async (ibRequestId) => {
    try {
      setLoadingReferredUsers(true);
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`${API_BASE_URL}/ib-requests/${ibRequestId}/referred-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch referred users');
      }

      const data = await response.json();
      if (data.success) {
        setReferredUsers(data.data.referredUsers || []);
      }
    } catch (err) {
      console.error('Error fetching referred users:', err);
      setToast({
        message: 'Failed to fetch referred users',
        type: 'error'
      });
    } finally {
      setLoadingReferredUsers(false);
    }
  };

  const handleToggleUserRow = (userId) => {
    if (expandedUserRow === userId) {
      setExpandedUserRow(null);
    } else {
      setExpandedUserRow(userId);
    }
  };

  const handleAccountSelect = (userId, accountNumber) => {
    setSelectedAccountForTrades(prev => ({
      ...prev,
      [userId]: accountNumber
    }));
    // TODO: Fetch trade history for this account
    // This will be implemented when we have the MT5 trade history API endpoint
  };

  const handleEditPipRates = (ib) => {
    // Ensure we have the correct ID (ibRequestId or id)
    const ibRequestId = ib.ibRequestId || ib.id;

    if (!ibRequestId) {
      console.error('IB data missing ID:', ib);
      setToast({
        message: 'Invalid IB request ID. Please refresh the page and try again.',
        type: 'error'
      });
      return;
    }

    console.log('Editing pip rates for IB Request ID:', ibRequestId, 'IB data:', ib);

    setEditModalData({
      ...ib,
      id: ibRequestId, // Ensure id is set correctly
      ibRequestId: ibRequestId
    });

    // Initialize pip rate inputs with current values
    const initialInputs = {};
    groupsWithIbs.forEach(group => {
      // Robust lookup: check by ID or by group name in commissions
      const byId = ib.groupPipCommissions?.[group.id];
      const byName = ib.groupPipCommissions?.[group.groupName];

      const currentValue = byId !== undefined ? byId : byName;

      // If no value, leave blank (don't default to 0.0)
      initialInputs[group.id] = (currentValue === undefined || currentValue === null || currentValue === '')
        ? ''
        : String(currentValue);
    });
    setPipRateInputs(initialInputs);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditModalData(null);
    setPipRateInputs({});
    setSavingPipRates(false);
  };

  const handleOpenGroupModal = (group) => {
    setSelectedGroupDetail(group);
    setShowGroupModal(true);
  };

  const handleCloseGroupModal = () => {
    setShowGroupModal(false);
    setSelectedGroupDetail(null);
  };

  const handlePipRateChange = (groupId, value) => {
    setPipRateInputs(prev => ({
      ...prev,
      [groupId]: value
    }));
  };

  const handleSaveChanges = async () => {
    if (!editModalData) return;

    // Get the correct IB request ID
    const ibRequestId = editModalData.id || editModalData.ibRequestId;

    if (!ibRequestId) {
      console.error('Edit modal data missing ID:', editModalData);
      setToast({
        message: 'Invalid IB request ID. Please close and reopen the modal.',
        type: 'error'
      });
      return;
    }

    console.log('Saving pip rates for IB Request ID:', ibRequestId, 'Commissions:', pipRateInputs);

    try {
      setSavingPipRates(true);
      const token = localStorage.getItem('adminToken');

      // Clean up pip commissions - convert to numbers, remove empty values
      const cleanedCommissions = {};
      Object.entries(pipRateInputs).forEach(([groupId, pipValue]) => {
        if (pipValue !== '' && pipValue !== null && pipValue !== undefined) {
          const numValue = parseFloat(pipValue);
          if (!isNaN(numValue) && numValue >= 0) {
            cleanedCommissions[groupId] = numValue;
          }
        }
      });

      console.log('Cleaned commissions to save:', cleanedCommissions);

      const response = await fetch(`${API_BASE_URL}/ib-requests/${ibRequestId}/pip-rates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_pip_commissions: cleanedCommissions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update pip rates');
      }

      const data = await response.json();
      if (data.success) {
        setToast({
          message: 'Pip rates updated successfully',
          type: 'success'
        });
        handleCloseModal();
        // Refresh the data
        fetchIbProfiles();
      } else {
        throw new Error(data.message || 'Failed to update pip rates');
      }
    } catch (err) {
      console.error('Error saving pip rates:', err);
      setToast({
        message: err.message || 'Failed to update pip rates',
        type: 'error'
      });
    } finally {
      setSavingPipRates(false);
    }
  };

  const handleResetDefaults = () => {
    // Set all pip rate inputs to 0.0
    const resetInputs = {};
    groupsWithIbs.forEach(group => {
      resetInputs[group.id] = '0.0';
    });
    setPipRateInputs(resetInputs);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedIB(null);
  };

  // Get pip rate for an IB in a specific group
  const getPipRateForGroup = (ib, groupId) => {
    if (!ib.groupPipCommissions) return 'Not Allotted';

    // Find numeric match
    const byId = ib.groupPipCommissions[groupId];
    if (byId !== undefined && byId !== null && byId !== '' && parseFloat(byId) > 0) {
      return `${parseFloat(byId)} pip`;
    }

    // Find group name to check for name-based commissions
    const group = groupsWithIbs.find(g => g.id === groupId);
    if (group && group.groupName) {
      const byName = ib.groupPipCommissions[group.groupName];
      if (byName !== undefined && byName !== null && byName !== '' && parseFloat(byName) > 0) {
        return `${parseFloat(byName)} pip`;
      }
    }

    return 'Not Allotted';
  };

  // List View
  if (viewMode === 'list') {
    return (
      <div className="w-full space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">IB Profiles</h1>
          <p className="text-gray-600">Manage and view all IB profiles</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active IBs"
            value={stats.activeIBs.toString()}
            icon={Users}
            iconBg="bg-blue-100"
            valueColor="text-blue-600"
          />

          <StatCard
            title="Master IBs"
            value={stats.masterIBs.toString()}
            icon={UserCheck}
            iconBg="bg-purple-100"
            valueColor="text-purple-600"
          />

          <StatCard
            title="Sub IBs"
            value={stats.subIbs.toString()}
            icon={TrendingUp}
            iconBg="bg-green-100"
            valueColor="text-green-600"
          />

          <StatCard
            title="Total Referrals"
            value={stats.totalReferrals.toString()}
            icon={Users}
            iconBg="bg-orange-100"
            valueColor="text-orange-600"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <Card>
            <WaveLoader message="Loading IB profiles..." />
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card>
            <div className="text-center py-8 text-red-600">
              <AlertCircle className="w-12 h-12 mx-auto mb-2" />
              <p>{error}</p>
              <Button
                variant="outline"
                onClick={fetchIbProfiles}
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </Card>
        )}

        {/* IB Groups Section */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupsWithIbs.map((group) => {
              const displayedIbs = group.ibs.slice(0, 10);
              const hasMore = group.ibs.length > 10;

              return (
                <Card key={group.id} className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">
                      {group.dedicatedName}
                    </h3>
                    <span className="w-6 h-6 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full text-xs font-bold ring-1 ring-blue-100">
                      {group.ibCount}
                    </span>
                  </div>

                  {group.ibs.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-sm italic">
                      No approved IBs in this group.
                    </div>
                  ) : (
                    <div className="space-y-2 flex-grow">
                      {displayedIbs.map((ib) => {
                        const pipRate = getPipRateForGroup(ib, group.id);
                        const isNotSet = pipRate === 'Not set' || pipRate === 'Not Allotted';

                        return (
                          <div key={ib.userId} className="p-2.5 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-white transition-all group/item shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0 pr-2">
                                <p className="font-bold text-gray-900 truncate text-sm">{ib.name}</p>
                                <p className="text-[10px] text-gray-500 truncate">{ib.email}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isNotSet ? 'bg-red-50 text-red-500' : 'bg-green-50/80 text-green-600'
                                  }`}>
                                  {pipRate}
                                </span>
                                <button
                                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover/item:opacity-100"
                                  title="Edit"
                                  onClick={() => handleEditPipRates({
                                    ...ib,
                                    id: ib.ibRequestId || ib.id,
                                    ibRequestId: ib.ibRequestId || ib.id,
                                    groupId: group.id,
                                    groupName: group.dedicatedName
                                  })}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Always show View all in bottom left */}
                      <div className="pt-2 text-left border-t border-gray-50 flex items-center justify-between">
                        <button
                          onClick={() => handleOpenGroupModal(group)}
                          className="text-[10px] font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-wider"
                        >
                          View all
                        </button>
                        {hasMore && (
                          <span className="text-[10px] font-medium text-gray-400 italic">
                            +{group.ibs.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}

            {groupsWithIbs.length === 0 && (
              <div className="col-span-full">
                <Card>
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-sm">No active groups found.</p>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Group Detail Modal (View All) */}
        {showGroupModal && selectedGroupDetail && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col transform transition-all">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{selectedGroupDetail.dedicatedName}</h2>
                  <p className="text-sm text-gray-500 font-medium">Full list of {selectedGroupDetail.ibCount} approved IBs</p>
                </div>
                <button
                  onClick={handleCloseGroupModal}
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-3 bg-gray-50/30">
                {selectedGroupDetail.ibs.map((ib) => {
                  const pipRate = getPipRateForGroup(ib, selectedGroupDetail.id);
                  const isNotSet = pipRate === 'Not set' || pipRate === 'Not Allotted';

                  return (
                    <div key={ib.userId} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-bold text-gray-900 truncate text-base">{ib.name}</p>
                        <p className="text-xs text-gray-500 font-medium truncate">{ib.email}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${isNotSet ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'
                          }`}>
                          {pipRate}
                        </span>
                        <button
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-gray-100"
                          title="Edit"
                          onClick={() => {
                            handleCloseGroupModal();
                            handleEditPipRates({
                              ...ib,
                              id: ib.ibRequestId || ib.id,
                              ibRequestId: ib.ibRequestId || ib.id,
                              groupId: selectedGroupDetail.id,
                              groupName: selectedGroupDetail.dedicatedName
                            });
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50/50 border-t border-gray-100 text-center flex-shrink-0">
                <Button variant="outline" className="rounded-2xl font-bold px-8" onClick={handleCloseGroupModal}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Profiles Table */}
        {!loading && !error && (
          <Card>
            <Table
              data={allIbs}
              columns={profilesColumns}
              pageSize={10}
              searchPlaceholder="Search IBs..."
              loading={loading}
              filters={{
                searchKeys: ['name', 'email'],
                dateKey: 'createdAt',
              }}
            />
          </Card>
        )}

        {/* Edit Pip Rates Modal */}
        {showEditModal && editModalData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Edit IB Pip Rates by Group</h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* IB Name */}
              <div className="p-6 border-b border-gray-200">
                <p className="text-sm text-gray-600 mb-1">IB Name</p>
                <p className="text-lg font-semibold text-gray-900">{editModalData.name}</p>
              </div>

              {/* Pip Rates per Group */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pip Rates per Group</h3>
                {loading ? (
                  <WaveLoader message="Loading groups..." />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupsWithIbs.map((group) => {
                      const pipRate = pipRateInputs[group.id] !== undefined
                        ? pipRateInputs[group.id]
                        : (editModalData.groupPipCommissions?.[group.id] || '0.0');
                      return (
                        <div
                          key={group.id}
                          className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">
                              {group.dedicatedName}
                            </h4>
                            <Button variant="outline" size="sm">
                              Custom
                            </Button>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Group</p>
                              <p className="text-sm font-medium text-gray-700">{group.groupName}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Pip Rate</p>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={pipRate}
                                  onChange={(e) => handlePipRateChange(group.id, e.target.value)}
                                  disabled={savingPipRates}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                                <span className="text-sm text-gray-600">pip/lot</span>
                              </div>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded p-2">
                              <p className="text-xs text-gray-700">
                                Rate will apply when IB gets accounts in this group
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Info Message */}
                <div className="mt-6 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    Assign pip rates for each group. The IB will earn commission based on these rates for their clients' trades.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={savingPipRates}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResetDefaults}
                  disabled={savingPipRates}
                >
                  Reset to Defaults
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveChanges}
                  disabled={savingPipRates}
                  className="min-w-[120px]"
                >
                  {savingPipRates ? (
                    <span className="flex items-center gap-2">
                      <ButtonLoader size="sm" />
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
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

  // Detail View
  if (!selectedIB) {
    return (
      <div className="w-full space-y-6">
        <WaveLoader message="Loading IB details..." />
      </div>
    );
  }

  // Build ibDetailData from selectedIB
  const ibDetailData = {
    id: selectedIB.id || selectedIB.userId,
    name: selectedIB.name || 'N/A',
    email: selectedIB.email || 'N/A',
    phone: '0000000000', // TODO: Get from user data
    country: 'N/A', // TODO: Get from user data
    ibType: selectedIB.type || 'NORMAL',
    pipRate: selectedIB.pipRate || '0.00 pip',
    approvedDate: 'N/A', // TODO: Get from IB request data
    referredBy: selectedIB.referredBy || { name: '', email: '' },
    totalAccounts: selectedIB.accounts?.length || 0,
    totalBalance: `$${selectedIB.accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0).toFixed(2) || '0.00'}`,
    totalEquity: `$${selectedIB.accounts?.reduce((sum, acc) => sum + (acc.equity || 0), 0).toFixed(2) || '0.00'}`,
    ownLots: '0.0000', // TODO: Calculate from trades
    teamLots: '0.0000', // TODO: Calculate from team trades
    totalTrades: '0', // TODO: Calculate from trades
    totalLots: '0.0000', // TODO: Calculate
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">IB Profile Details</h1>
          <p className="text-gray-600">Complete overview of IB user data and performance</p>
        </div>
        <Button variant="outline" icon={ArrowLeft} onClick={handleBackToList}>
          ← Back to Profiles
        </Button>
      </div>

      {/* IB Information and Account Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* IB Information */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">IB Information</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Full Name</p>
                <p className="text-sm font-semibold text-gray-900">{ibDetailData.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-sm font-semibold text-gray-900">{ibDetailData.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Phone</p>
                <p className="text-sm font-semibold text-gray-900">{ibDetailData.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Country</p>
                <p className="text-sm font-semibold text-gray-900">{ibDetailData.country}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">IB Type</p>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  {ibDetailData.ibType}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Pip/Lot Rate</p>
                <p className="text-sm font-semibold text-green-600">{ibDetailData.pipRate}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Approved Date</p>
                <p className="text-sm font-semibold text-gray-900">{ibDetailData.approvedDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Referred By</p>
                {ibDetailData.referredBy.name ? (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{ibDetailData.referredBy.name}</p>
                    <p className="text-xs text-gray-600">{ibDetailData.referredBy.email}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Direct signup</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Account Statistics */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Statistics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Accounts</p>
                  <p className="text-2xl font-bold text-gray-900">{ibDetailData.totalAccounts}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Wallet className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Balance</p>
                  <p className="text-2xl font-bold text-gray-900">{ibDetailData.totalBalance}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Equity</p>
                  <p className="text-2xl font-bold text-gray-900">{ibDetailData.totalEquity}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Trade History */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Trade History - Referred Users
          </h2>
          <div className="flex items-center gap-3">
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none">
              <option>All Trades</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
            </select>
            <Button variant="outline" size="sm" icon={Download}>
              Export
            </Button>
          </div>
        </div>

        {loadingReferredUsers ? (
          <WaveLoader message="Loading referred users..." />
        ) : referredUsers.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">No Referred Users Found</p>
            <p className="text-sm text-gray-600">This IB has not referred any users yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">SR No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">From (Name & Email)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">View IB Client Trades</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">IB Commission</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {referredUsers.map((user, index) => (
                  <React.Fragment key={user.userId}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-600">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleUserRow(user.userId)}
                        >
                          {expandedUserRow === user.userId ? 'Hide' : 'View'} IB Client Trades
                        </Button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold text-green-600">$0.00</span>
                        <span className="text-xs text-gray-500 ml-1">(Pending calculation)</span>
                      </td>
                    </tr>
                    {expandedUserRow === user.userId && (
                      <tr>
                        <td colSpan="4" className="px-4 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select MT5 Account
                              </label>
                              <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
                                value={selectedAccountForTrades[user.userId] || ''}
                                onChange={(e) => handleAccountSelect(user.userId, e.target.value)}
                              >
                                <option value="">Select an account...</option>
                                {user.accounts.map((account) => (
                                  <option key={account.id} value={account.accountNumber}>
                                    #{account.accountNumber} - {account.currency} - Balance: ${account.balance.toFixed(2)}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {user.accounts.length === 0 && (
                              <p className="text-sm text-gray-500">No MT5 accounts found for this user.</p>
                            )}

                            {selectedAccountForTrades[user.userId] && (
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                  Trade History for Account #{selectedAccountForTrades[user.userId]}
                                </h4>
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                  <p className="text-sm text-gray-500 text-center py-4">
                                    Trade history will be displayed here once the MT5 API integration is complete.
                                  </p>
                                  {/* TODO: Display trade history table here */}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* IB Tree Structure and User Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IB Tree Structure */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">IB Tree Structure</h2>
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="text-center py-6">
                <p className="text-4xl font-bold mb-2">{ibDetailData.ownLots}</p>
                <p className="text-sm font-medium opacity-90">Own Lots</p>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="text-center py-6">
                <p className="text-4xl font-bold mb-2">{ibDetailData.teamLots}</p>
                <p className="text-sm font-medium opacity-90">Team Lots</p>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
              <div className="text-center py-6">
                <p className="text-4xl font-bold mb-2">{ibDetailData.totalTrades}</p>
                <p className="text-sm font-medium opacity-90">Total Trades</p>
              </div>
            </Card>
          </div>
        </div>

        {/* User Profile Card */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 text-white">
          <div className="text-center mb-6">
            <div className="mx-auto w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
              <UserCheck className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold mb-1">{ibDetailData.name} (#{ibDetailData.id})</h3>
            <p className="text-sm text-gray-300">{ibDetailData.email}</p>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-300">Account Balance</span>
              <span className="font-semibold">{ibDetailData.totalBalance}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-300">Accounts</span>
              <span className="font-semibold">{ibDetailData.totalAccounts}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-300">IB Pip Rate</span>
              <span className="font-semibold text-green-400">${ibDetailData.pipRate.split(' ')[0]} per lot</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-300">Own Lots</span>
              <span className="font-semibold">{ibDetailData.ownLots}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-300">Trades</span>
              <span className="font-semibold">{ibDetailData.totalTrades}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-300">Team Lots</span>
              <span className="font-semibold">{ibDetailData.teamLots}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-gray-300">Total Lots</span>
              <span className="font-semibold">{ibDetailData.totalLots}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default IBProfile;
