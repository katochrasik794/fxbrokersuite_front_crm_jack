import { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import StatCard from '../../ui/StatCard';
import Button from '../../ui/Button';
import Table from '../../ui/Table';
import ibService from '../../../services/ibService';
import Toast from '../../../components/Toast';
import {
  Wallet,
  User,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Copy,
  Link2,
  BarChart3,
  Activity,
  CheckCircle
} from 'lucide-react';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    referralCode: '',
    stats: {
      clientCount: 0,
      teamBalance: 0,
      availableBalance: 0,
      currency: 'USD',
      groups: []
    },
    profile: null,
    recentWithdrawals: [],
    paymentMethods: [],
    commissionSummary: {
      total_commission: 0,
      my_commission: 0,
      client_commission: 0
    }
  });
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [toast, setToast] = useState(null);

  // Custom IB Link State
  const [numLevels, setNumLevels] = useState(3);
  const [isCustomLevels, setIsCustomLevels] = useState(false);
  const [customRates, setCustomRates] = useState({}); // { level: { groupId: rate } }
  const [generatedLink, setGeneratedLink] = useState('');
  const [planName, setPlanName] = useState('');
  const [savedPlans, setSavedPlans] = useState([]);
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [dashboardRes, profileRes, paymentMethodsRes, ibWithdrawalsRes, commissionRes, plansRes] = await Promise.all([
          ibService.getDashboardStats(),
          ibService.getProfile(),
          ibService.getWithdrawalPaymentMethods(),
          ibService.getIBWithdrawals(),
          ibService.getCommissionSummary(),
          ibService.getIBPlans()
        ]);

        if (dashboardRes.success && profileRes.success) {
          setData({
            ...dashboardRes.data,
            profile: profileRes.data,
            paymentMethods: paymentMethodsRes.success ? paymentMethodsRes.data : [],
            recentWithdrawals: ibWithdrawalsRes.success ? ibWithdrawalsRes.data : [],
            commissionSummary: commissionRes.success ? commissionRes.data : {
              total_commission: 0,
              my_commission: 0,
              client_commission: 0
            }
          });
          if (plansRes.success) setSavedPlans(plansRes.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ib-600"></div>
      </div>
    );
  }

  const { referralCode, stats, profile, recentWithdrawals } = data;
  const baseUrl = window.location.origin; // Dynamically get the portal URL
  const isNormalPlan = stats.planType === 'normal';
  const referralLink = `${baseUrl}/register?ref=${referralCode || ''}${isNormalPlan ? '&type=trader' : ''}`;

  // Formatters
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: stats.currency || 'USD' }).format(val);

  // Multiple trading groups from backend - filter only those where IB is approved (rate > 0)
  const tradingGroups = (stats.groups || []).filter(group => parseFloat(group.rate) > 0);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You can add a toast notification here
  };

  const handleRateChange = (level, groupId, value, maxRate) => {
    // Allow empty string or valid number <= maxRate
    if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= maxRate)) {
      setCustomRates(prev => ({
        ...prev,
        [level]: {
          ...(prev[level] || {}),
          [groupId]: value
        }
      }));
    }
  };

  const generateCustomLink = () => {
    // Build a chain of groups: { groupId: [rateL1, rateL2, ...] }
    const chain = {};

    tradingGroups.forEach(group => {
      const ratesForGroup = [];
      for (let l = 1; l <= numLevels; l++) {
        const rate = customRates[l]?.[group.id];
        if (rate !== undefined && rate !== '') {
          ratesForGroup.push(parseFloat(rate));
        } else {
          // If a middle level is empty, it might be an issue. 
          // For now, let's treat intentionally as 0 if not provided but requested levels > current index
          ratesForGroup.push(0);
        }
      }

      // Only add to chain if at least one level has a non-zero rate
      if (ratesForGroup.some(r => r > 0)) {
        chain[group.id] = {
          name: group.name,
          rates: ratesForGroup
        };
      }
    });

    if (Object.keys(chain).length === 0) {
      alert("Please set at least one rate across the levels.");
      return;
    }

    const encodedData = btoa(JSON.stringify(chain));
    const link = `${baseUrl}/register?ref=${referralCode}&data=${encodedData}`;
    setGeneratedLink(link);
  };

  const handleSavePlan = async () => {
    if (!planName.trim()) {
      setToast({ message: "Please enter a name for the plan.", type: 'error' });
      return;
    }
    if (!generatedLink) {
      setToast({ message: "Please generate a link first.", type: 'error' });
      return;
    }

    try {
      setSavingPlan(true);
      const chain = {};
      tradingGroups.forEach(group => {
        const ratesForGroup = [];
        for (let l = 1; l <= numLevels; l++) {
          ratesForGroup.push(parseFloat(customRates[l]?.[group.id] || 0));
        }
        if (ratesForGroup.some(r => r > 0)) {
          chain[group.id] = { name: group.name, rates: ratesForGroup };
        }
      });

      const res = await ibService.saveIBPlan({
        name: planName,
        plan_type: profile?.plan_type || 'advanced',
        levels_count: numLevels,
        structure: chain,
        link_data: generatedLink
      });

      if (res.success) {
        setToast({ message: "Plan saved successfully!", type: 'success' });
        setPlanName('');
        const plansRes = await ibService.getIBPlans();
        if (plansRes.success) setSavedPlans(plansRes.data);
      } else {
        setToast({ message: res.message || "Failed to save plan.", type: 'error' });
      }
    } catch (error) {
      console.error("Save plan error:", error);
      setToast({ message: "An error occurred. Please try again.", type: 'error' });
    } finally {
      setSavingPlan(false);
    }
  };

  const handleWithdrawalRequest = async () => {
    const amount = parseFloat(withdrawalAmount);

    if (isNaN(amount) || amount <= 0) {
      setToast({ message: "Please enter a valid amount.", type: 'error' });
      return;
    }
    if (!selectedPaymentMethod) {
      setToast({ message: "Please select a payment method.", type: 'error' });
      return;
    }

    // Explicit comparison with formatted numbers to avoid precision issues
    const available = parseFloat(stats.availableBalance);
    if (amount > available) {
      setToast({ message: `Insufficient balance. Available: $${available.toFixed(2)}`, type: 'error' });
      return;
    }

    try {
      setSubmittingWithdrawal(true);
      const res = await ibService.requestWithdrawal(amount, selectedPaymentMethod);
      if (res.success) {
        setToast({ message: "Withdrawal request submitted successfully!", type: 'success' });
        setWithdrawalAmount('');
        // Refresh withdrawals and balance
        const [dash, withs] = await Promise.all([
          ibService.getDashboardStats(),
          ibService.getIBWithdrawals()
        ]);
        setData(prev => ({
          ...prev,
          stats: dash.success ? dash.data.stats : prev.stats,
          recentWithdrawals: withs.success ? withs.data : prev.recentWithdrawals
        }));
      } else {
        setToast({ message: res.message || "Failed to submit withdrawal request.", type: 'error' });
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      setToast({ message: "An error occurred. Please try again.", type: 'error' });
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">IB Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {profile?.first_name} {profile?.last_name} • Commission = Trade Lots × Pip Rate × $10
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {tradingGroups.map((group, idx) => (
            <span key={idx} className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-bold text-[13px] shadow-sm border border-blue-200">
              {group.name} — {group.rate} pip/lot
            </span>
          ))}
          <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-bold text-[13px] shadow-sm border border-green-200">
            Available: {formatCurrency(stats.availableBalance)}
          </span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Commission"
          value={formatCurrency(data.commissionSummary.total_commission)}
          subtitle="From your trades + referrals"
          icon={Wallet}
          iconBg="bg-blue-100"
          valueColor="text-blue-600"
        />
        <StatCard
          title="My Commission"
          value={formatCurrency(data.commissionSummary.my_commission)}
          subtitle="Direct trading reward"
          icon={User}
          iconBg="bg-green-100"
          valueColor="text-green-600"
        />
        <StatCard
          title="Clients Commission"
          value={formatCurrency(data.commissionSummary.client_commission)}
          subtitle={`Network: ${stats.clientCount} members`}
          icon={Users}
          iconBg="bg-purple-100"
          valueColor="text-purple-600"
        />
        <StatCard
          title="Available Balance"
          value={formatCurrency(stats.availableBalance)}
          subtitle="Ready for withdrawal"
          icon={DollarSign}
          iconBg="bg-ib-100"
          valueColor="text-ib-600"
        />
      </div>

      {/* Secondary Stats/Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referral Details */}
        {/* Referral Details - HIDDEN for Master IBs on Advanced Plan */}
        {(stats.ibType !== 'master' || stats.planType === 'normal') && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Link2 className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Referral Details</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold uppercase tracking-wider">
                  {profile?.ib_type === 'sub_ib' ? 'SUB IB' : 'MASTER IB'}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${stats.planType === 'normal'
                  ? 'bg-orange-50 text-orange-600'
                  : stats.planType === 'advanced' ? 'bg-purple-50 text-purple-600' : 'bg-gray-50 text-gray-600'
                  }`}>
                  {stats.planType === 'normal' ? 'Normal Plan' : stats.planType === 'advanced' ? 'Advanced Plan' : 'Plan Not Selected'}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Your Referral Link</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded-lg border border-gray-200 text-blue-600 font-mono text-sm break-all">
                    {referralLink}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(referralLink)}
                    className="shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <p className="text-xs font-medium text-purple-600 mb-1 uppercase tracking-wider">Referral Code</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-purple-900">{referralCode || 'N/A'}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-purple-600"
                      onClick={() => copyToClipboard(referralCode)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 bg-ib-50 rounded-xl border border-ib-100">
                  <p className="text-xs font-medium text-ib-600 mb-1 uppercase tracking-wider">Direct Clients</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-ib-900">{stats.clientCount}</span>
                    <div className="h-8 w-8 flex items-center justify-center bg-ib-100 rounded-lg">
                      <Users className="w-4 h-4 text-ib-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Group-Specific Referral Links - ONLY FOR MASTERS & ADVANCED PLAN & IF ENABLED BY ADMIN */}
        {stats.ibType === 'master' && stats.planType === 'advanced' && stats.showCommissionStructure && (
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Link2 className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Custom IB Link</h2>
              </div>
              <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold uppercase tracking-wider">
                CREATE SUB-IB
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm font-medium text-gray-500 mb-4">
                  Configure commission rates for your sub-IB. The remaining difference (Your Rate - Sub-IB Rate) will be your override commission.
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 p-4 bg-white rounded-xl border border-indigo-100">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Number of Levels</label>
                    <p className="text-xs text-gray-500">How many Sub-IB levels will share this commission?</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {[3, 5, 7, 10].map(n => (
                      <button
                        key={n}
                        onClick={() => {
                          setNumLevels(n);
                          setIsCustomLevels(false);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${!isCustomLevels && numLevels === n
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                          }`}
                      >
                        {n} Levels
                      </button>
                    ))}
                    <button
                      onClick={() => setIsCustomLevels(true)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${isCustomLevels
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                        }`}
                    >
                      Custom
                    </button>
                    {isCustomLevels && (
                      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                        <input
                          type="number"
                          min="3"
                          max="100"
                          value={numLevels}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val >= 3) setNumLevels(val);
                          }}
                          className="w-16 px-2 py-1.5 border border-indigo-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <span className="text-xs text-gray-400 font-bold uppercase">Levels</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {tradingGroups.map((group) => {
                    const myRate = parseFloat(group.rate);
                    return (
                      <div key={group.id} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-2">
                          <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
                          <h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm">
                            {group.name} <span className="text-[10px] text-gray-400 font-normal ml-2 tracking-normal">(Your Rate: {myRate} PIP)</span>
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {Array.from({ length: numLevels }).map((_, levelIdx) => {
                            const level = levelIdx + 1;
                            const prevLevelRate = level === 1
                              ? myRate
                              : parseFloat(customRates[level - 1]?.[group.id] || 0);

                            const currentInputRate = customRates[level]?.[group.id] !== undefined
                              ? customRates[level][group.id]
                              : '';

                            const residual = currentInputRate !== ''
                              ? (prevLevelRate - parseFloat(currentInputRate)).toFixed(2)
                              : '-';

                            return (
                              <div key={`${group.id}-L${level}`} className="p-2.5 bg-gray-50/50 rounded-lg border border-gray-100 transition-all hover:border-indigo-100">
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="font-bold text-indigo-600 text-[10px] uppercase tracking-wider">Level {level}</span>
                                  <span className="text-[9px] text-gray-400 font-medium">Max: {prevLevelRate}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="relative flex-1">
                                    <input
                                      type="number"
                                      min="0"
                                      max={prevLevelRate}
                                      step="0.01"
                                      placeholder="0.00"
                                      value={currentInputRate}
                                      onChange={(e) => handleRateChange(level, group.id, e.target.value, prevLevelRate)}
                                      className="w-full pl-2 pr-7 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-[11px] font-medium transition-all"
                                    />
                                    <span className="absolute right-1.5 top-1 text-[9px] text-gray-400 font-bold">PIP</span>
                                  </div>
                                  <div className="text-[9px] text-right min-w-[45px] leading-tight">
                                    <div className="text-gray-400 scale-90 origin-right">Up-link</div>
                                    <div className={`font-bold ${residual < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                      {residual}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {generatedLink && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-indigo-200 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs font-bold text-indigo-600 mb-2 uppercase tracking-wider">Save this structure as Plan</p>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="text"
                        placeholder="Plan name (e.g. 3-level Crypto Plan)"
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        className="flex-1 w-full bg-gray-50 px-3 py-2 rounded border border-gray-200 text-gray-900 font-medium text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSavePlan}
                        disabled={savingPlan || !planName.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 w-full sm:w-auto"
                      >
                        {savingPlan ? 'Saving...' : 'Save Plan'}
                      </Button>
                    </div>
                    <div className="mt-3 pt-3 border-t border-indigo-50">
                      <p className="text-xs font-bold text-indigo-600 mb-1 uppercase tracking-wider">Generated Link</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-gray-50 px-3 py-2 rounded border border-gray-200 text-gray-600 font-mono text-xs break-all">
                          {generatedLink}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedLink)}
                          className="shrink-0 h-8"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={generateCustomLink}
                    disabled={tradingGroups.length === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Generate Link
                  </Button>
                </div>
              </div>

              {/* Saved Plans Table */}
              {savedPlans.length > 0 && (
                <div className="mt-8 border-t border-gray-100 pt-8 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-bold text-gray-900">Saved IB Plans</h3>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Plan Name</th>
                          <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Levels</th>
                          <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Created</th>
                          <th className="px-4 py-3 uppercase tracking-wider text-[10px] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {savedPlans.map((plan) => (
                          <tr key={plan.id} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="px-4 py-4">
                              <div className="font-bold text-gray-900">{plan.name}</div>
                              <div className="text-[10px] text-gray-400 font-mono mt-0.5 truncate max-w-[200px]" title={plan.link_data}>
                                {plan.link_data.substring(0, 40)}...
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="px-2 py-1 bg-indigo-100 text-indigo-600 rounded text-[10px] font-black uppercase">
                                {plan.levels_count} Levels
                              </span>
                            </td>
                            <td className="px-4 py-4 text-xs text-gray-500 font-medium">
                              {new Date(plan.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  copyToClipboard(plan.link_data);
                                  setToast({ message: "Plan link copied to clipboard!", type: 'success' });
                                }}
                                className="h-8 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                              >
                                <Copy className="w-3 h-3 mr-1.5" />
                                Copy Link
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Withdraw Commission */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-ib-100 rounded-lg">
                <Wallet className="w-5 h-5 text-ib-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Withdraw Commission</h2>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (USD)
              </label>
              <input
                type="number"
                placeholder="Enter amount"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Available: {formatCurrency(stats.availableBalance)}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
                >
                  <option value="">Select Method</option>
                  {data.paymentMethods.map(pm => (
                    <option key={pm.id} value={pm.id}>
                      {pm.payment_method === 'bank_transfer' ? 'Bank' : 'USDT'} - {pm.payment_details.bankName || pm.payment_details.walletAddress}
                    </option>
                  ))}
                  {data.paymentMethods.length === 0 && (
                    <option disabled>No approved payment methods</option>
                  )}
                </select>
              </div>
              <Button
                className="mt-8 px-6"
                icon={ArrowUpRight}
                iconPosition="right"
                onClick={handleWithdrawalRequest}
                disabled={submittingWithdrawal || data.paymentMethods.length === 0}
              >
                {submittingWithdrawal ? 'Requesting...' : 'Request'}
              </Button>
            </div>

            {selectedPaymentMethod && data.paymentMethods.find(pm => pm.id.toString() === selectedPaymentMethod.toString()) && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Selected Payment Details</h4>
                {(() => {
                  const pm = data.paymentMethods.find(p => p.id.toString() === selectedPaymentMethod.toString());
                  if (pm.payment_method === 'bank_transfer') {
                    return (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><p className="text-gray-500 text-[10px]">Bank</p><p className="font-semibold">{pm.payment_details.bankName}</p></div>
                        <div><p className="text-gray-500 text-[10px]">A/C Holder</p><p className="font-semibold">{pm.payment_details.accountName}</p></div>
                        <div><p className="text-gray-500 text-[10px]">A/C Number</p><p className="font-semibold">{pm.payment_details.accountNumber}</p></div>
                        <div><p className="text-gray-500 text-[10px]">IFSC/SWIFT</p><p className="font-semibold">{pm.payment_details.ifscSwiftCode}</p></div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-sm">
                        <p className="text-gray-500 text-[10px]">USDT TRC20 Wallet</p>
                        <p className="font-mono font-semibold break-all">{pm.payment_details.walletAddress}</p>
                      </div>
                    );
                  }
                })()}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pip Rates */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Pip Rates per Group</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3">Group Name</th>
                  <th className="px-4 py-3">Pip Rate</th>
                  <th className="px-4 py-3">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tradingGroups.map((group, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 font-medium text-gray-900">{group.name}</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md font-semibold">
                        {group.rate}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500">pip/lot</td>
                  </tr>
                ))}
                {tradingGroups.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-gray-400">
                      No pip rates configured
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Withdrawal History */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentWithdrawals.map((withdrawal, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 text-gray-500">
                      {new Date(withdrawal.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-900">
                      {withdrawal.payment_method === 'bank_transfer' ? 'Bank' : 'USDT'}
                    </td>
                    <td className="px-4 py-4 font-bold text-gray-900">
                      {formatCurrency(withdrawal.amount)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${withdrawal.status === 'approved' ? 'bg-green-100 text-green-700' :
                        withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                        {withdrawal.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentWithdrawals.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                      No recent activities
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {
        toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )
      }

    </div >
  );
}

export default Dashboard;
