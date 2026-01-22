// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Users, Download, Upload, Shield, Database, TrendingUp, TrendingDown,
  DollarSign, Clock, AlertCircle, CheckCircle, XCircle, Mail, UserX,
  BarChart3, Activity, Eye, RefreshCw, ArrowUp, ArrowDown, MessageCircle
} from "lucide-react";
import ProTable from "../components/ProTable.jsx";
import Badge from "../components/Badge.jsx";

// Format currency
function fmtAmount(v) {
  return v ? `$${Number(v || 0).toFixed(2)}` : "$0.00";
}


// Format date
function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

// Dashboard data structure
const initialDashboardData = {
  totalUsers: 0,
  emailUnverified: 0,
  kycPending: 0,
  totalMT5Accounts: 0,
  totalDeposited: 0,
  pendingDeposits: 0,
  rejectedDeposits: 0,
  totalWithdrawn: 0,
  rejectedWithdrawals: 0,
  pendingWithdrawals: 0,
  mtdDeposits: 0,
  todayDeposits: 0,
  avg7DayDeposits: 0,
  mtdWithdrawals: 0,
  todayWithdrawals: 0,
  avg7DayWithdrawals: 0,
  topDepositor: "N/A",
  openSupportTickets: 0
};

// Stat Card Component
function StatCard({ title, value, subtitle, icon: Icon, color = "blue", progress = null, onClick }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    yellow: "bg-yellow-50 text-yellow-600",
    purple: "bg-brand-50 text-blue-700"
  };

  return (
    <div
      className={`bg-white rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {progress !== null && (
          <div className="text-sm font-medium text-gray-600">
            {Number(progress).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-600">{title}</div>
        {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      </div>
      {progress !== null && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${colorClasses[color].split(' ')[0]}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Financial Summary Card Component
function FinancialCard({ title, icon: Icon, color, items, summary }) {
  const colorClasses = {
    green: "text-green-600 bg-green-50",
    red: "text-red-600 bg-red-50"
  };

  return (
    <div className="bg-white rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded ${item.color}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{item.label}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {summary && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-4">
                <span className="text-gray-600">MTD</span>
                <span className="font-semibold text-gray-900">{summary.mtd}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-600">Today</span>
                <span className="font-semibold text-gray-900">{summary.today}</span>
              </div>
            </div>
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gray-400"
                style={{ width: '50%' }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Dashboard Component
export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(initialDashboardData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Bulk operation logs state
  const [bulkLogsRows, setBulkLogsRows] = useState([]);
  const [recentDeposits, setRecentDeposits] = useState([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState([]);
  const [recentAccounts, setRecentAccounts] = useState([]);
  const [bulkLogsLoading, setBulkLogsLoading] = useState(true);
  const [bulkLogsError, setBulkLogsError] = useState("");

  const BASE = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:5000/api";
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [countryScope, setCountryScope] = useState("");
  const [scopeResolved, setScopeResolved] = useState(false);

  useEffect(() => {
    // resolve assigned country for current admin (if country partner)
    const token = localStorage.getItem('adminToken');
    const email = admin?.email;
    if (!email) return;
    let cancelled = false;
    fetch(`${BASE}/admin/country-admins`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(list => {
        if (cancelled) return;
        const match = Array.isArray(list) ? list.find(ca => (ca.email || '').toLowerCase() === String(email).toLowerCase()) : null;
        if (match?.country) setCountryScope(String(match.country).toLowerCase());
        setScopeResolved(true);
      })
      .catch(() => { setScopeResolved(true); });
    return () => { cancelled = true; };
  }, [BASE, admin?.email]);

  // Fetch dashboard data from database
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch all data in parallel using correct API endpoints
      const scope = countryScope ? `&country=${encodeURIComponent(countryScope)}` : '';
      const [usersRes, depositsRes, withdrawalsRes, kycRes, mt5Res, supportRes] = await Promise.all([
        fetch(`${BASE}/admin/users/all?limit=1000${scope}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).catch(() => ({ ok: false, items: [] })),

        fetch(`${BASE}/admin/deposits?limit=1000${scope}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).catch(() => ({ ok: false, items: [] })),

        fetch(`${BASE}/admin/withdrawals?limit=1000${scope}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).catch(() => ({ ok: false, items: [] })),

        fetch(`${BASE}/admin/kyc?limit=1000${scope}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).catch(() => ({ ok: false, items: [] })),

        fetch(`${BASE}/admin/mt5/users?limit=1000${scope}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).catch(() => ({ ok: false, items: [] })),

        // Support tickets summary (open tickets count)
        fetch(`${BASE}/admin/support/summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).catch(() => ({ ok: false, openTickets: 0 }))
      ]);

      // Process users data
      const users = usersRes.items || [];
      const totalUsers = users.length;
      const emailUnverified = users.filter(u => !u.emailVerified).length;
      // const activeUsers = users.filter(u => u.status === 'active').length;

      // Process KYC data
      const kycItems = kycRes.items || [];
      const kycPending = kycItems.filter(k => k.verificationStatus === 'Pending').length;

      // Process deposits data
      const deposits = depositsRes.items || [];
      const totalDeposited = depositsRes.totalSum || 0;
      const pendingDeposits = deposits.filter(d => d.status === 'pending').length;
      const rejectedDeposits = deposits.filter(d => d.status === 'rejected').length;

      // Process withdrawals data
      const withdrawals = withdrawalsRes.items || [];
      const totalWithdrawn = withdrawals
        .filter(w => w.status === 'approved')
        .reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);
      const rejectedWithdrawals = withdrawals.filter(w => w.status === 'rejected').length;
      const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;

      // Process MT5 data
      const mt5Accounts = mt5Res.items || [];
      const totalMT5Accounts = mt5Res.total || 0;

      // Support tickets summary
      const openSupportTickets = supportRes.openTickets || 0;

      // Calculate MTD and today values
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const mtdDeposits = deposits
        .filter(d => d.status === 'approved' && new Date(d.createdAt) >= startOfMonth)
        .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

      const todayDeposits = deposits
        .filter(d => d.status === 'approved' && new Date(d.createdAt) >= startOfDay)
        .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

      const mtdWithdrawals = withdrawals
        .filter(w => w.status === 'approved' && new Date(w.createdAt) >= startOfMonth)
        .reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);

      const todayWithdrawals = withdrawals
        .filter(w => w.status === 'approved' && new Date(w.createdAt) >= startOfDay)
        .reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);

      // Calculate 7-day averages
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const avg7DayDeposits = deposits
        .filter(d => d.status === 'approved' && new Date(d.createdAt) >= sevenDaysAgo)
        .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0) / 7;

      const avg7DayWithdrawals = withdrawals
        .filter(w => w.status === 'approved' && new Date(w.createdAt) >= sevenDaysAgo)
        .reduce((sum, w) => sum + parseFloat(w.amount || 0), 0) / 7;

      // Find top depositor
      const depositorTotals = {};
      deposits
        .filter(d => d.status === 'approved')
        .forEach(d => {
          const userId = d.userId;
          if (!depositorTotals[userId]) {
            depositorTotals[userId] = {
              userId,
              name: d.User?.name || 'Unknown',
              total: 0
            };
          }
          depositorTotals[userId].total += parseFloat(d.amount || 0);
        });

      const topDepositor = Object.values(depositorTotals)
        .sort((a, b) => b.total - a.total)[0]?.name || 'N/A';

      setDashboardData({
        totalUsers,
        emailUnverified,
        kycPending,
        totalMT5Accounts,
        totalDeposited,
        pendingDeposits,
        rejectedDeposits,
        totalWithdrawn,
        rejectedWithdrawals,
        pendingWithdrawals,
        mtdDeposits,
        todayDeposits,
        avg7DayDeposits,
        mtdWithdrawals,
        todayWithdrawals,
        avg7DayWithdrawals,
        topDepositor,
        openSupportTickets
      });

    } catch (err) {
      setError("Failed to load dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [BASE, countryScope]);

  // Fetch bulk operation logs
  const fetchBulkLogs = useCallback(async () => {
    setBulkLogsLoading(true);
    setBulkLogsError("");

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({ limit: '500' });
      if (countryScope) params.set('country', countryScope);

      const response = await fetch(`${BASE}/admin/activity-logs?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (!data?.ok) {
        throw new Error(data?.error || "Failed to load bulk logs");
      }

      const items = Array.isArray(data.items) ? data.items : [];
      setBulkLogsRows(items.map((item, index) => ({
        ...item,
        __index: index + 1,
      })));

      // Extract recent activities for cards
      const deposits = items.filter(i => i.type === 'Deposit').slice(0, 5);
      const withdrawals = items.filter(i => i.type === 'Withdrawal').slice(0, 5);
      const accounts = items.filter(i => i.type === 'Account').slice(0, 5);

      setRecentDeposits(deposits);
      setRecentWithdrawals(withdrawals);
      setRecentAccounts(accounts);

    } catch (err) {
      setBulkLogsError(err.message || "Failed to load bulk logs");
      console.error(err);
    } finally {
      setBulkLogsLoading(false);
    }
  }, [BASE]);

  useEffect(() => {
    if (!scopeResolved) return;
    fetchDashboardData();
    fetchBulkLogs();
  }, [fetchDashboardData, fetchBulkLogs, scopeResolved]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-red-400" />
          <p className="mt-2 text-red-600">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Real-time overview of your platform</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Realtime overview</span>
          </div>
          <p className="text-xs text-gray-400 italic">*Percentage shown is average of users per card</p>
        </div>
      </div>

      {/* Top Row - Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Total Users"
          value={dashboardData.totalUsers}
          subtitle={`Active: ${dashboardData.totalUsers} (100%)`}
          icon={Users}
          color="blue"
          progress={100}
        />

        <StatCard
          title="Email Unverified"
          value={dashboardData.emailUnverified}
          subtitle={`Of total users (${dashboardData.totalUsers > 0 ? ((dashboardData.emailUnverified / dashboardData.totalUsers) * 100).toFixed(1) : 0}%)`}
          icon={Mail}
          color="red"
          progress={dashboardData.totalUsers > 0 ? Math.round((dashboardData.emailUnverified / dashboardData.totalUsers) * 100) : 0}
        />

        <StatCard
          title="KYC Pending"
          value={dashboardData.kycPending}
          subtitle={`Pending vs users (${dashboardData.totalUsers > 0 ? ((dashboardData.kycPending / dashboardData.totalUsers) * 100).toFixed(1) : 0}%)`}
          icon={Shield}
          color="purple"
          progress={dashboardData.totalUsers > 0 ? Math.round((dashboardData.kycPending / dashboardData.totalUsers) * 100) : 0}
        />

        <StatCard
          title="Total MT5 Accounts"
          value={dashboardData.totalMT5Accounts}
          subtitle={`Accounts per user: ${dashboardData.totalUsers > 0 ? (dashboardData.totalMT5Accounts / dashboardData.totalUsers).toFixed(2) : 0}`}
          icon={Database}
          color="blue"
          progress={dashboardData.totalUsers > 0 ? Math.round((dashboardData.totalMT5Accounts / dashboardData.totalUsers) * 100) : 0}
        />

        <StatCard
          title="Open Support Tickets"
          value={dashboardData.openSupportTickets}
          subtitle="Tickets waiting for response"
          icon={MessageCircle}
          color="yellow"
          progress={dashboardData.openSupportTickets > 0 && dashboardData.totalUsers > 0
            ? Math.min(100, Math.round((dashboardData.openSupportTickets / dashboardData.totalUsers) * 100))
            : 0}
          onClick={() => navigate('/admin/support/open')}
        />
      </div>

      {/* Bottom Row - Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialCard
          title="Deposits"
          icon={TrendingUp}
          color="green"
          items={[
            {
              label: "Total Deposited",
              value: fmtAmount(dashboardData.totalDeposited),
              icon: DollarSign,
              color: "bg-green-100 text-green-600"
            },
            {
              label: "Pending Deposits",
              value: dashboardData.pendingDeposits.toString(),
              icon: Clock,
              color: "bg-yellow-100 text-yellow-600"
            },
            {
              label: "Rejected Deposits",
              value: dashboardData.rejectedDeposits.toString(),
              icon: XCircle,
              color: "bg-red-100 text-red-600"
            }
          ]}
          summary={{
            mtd: fmtAmount(dashboardData.mtdDeposits),
            today: `${fmtAmount(dashboardData.todayDeposits)} (vs 7-day avg ${fmtAmount(dashboardData.avg7DayDeposits)})`
          }}
        />

        <FinancialCard
          title="Withdrawals"
          icon={TrendingDown}
          color="red"
          items={[
            {
              label: "Total Withdrawn",
              value: fmtAmount(dashboardData.totalWithdrawn),
              icon: DollarSign,
              color: "bg-green-100 text-green-600"
            },
            {
              label: "Rejected Withdrawals",
              value: dashboardData.rejectedWithdrawals.toString(),
              icon: XCircle,
              color: "bg-red-100 text-red-600"
            },
            {
              label: "Pending Withdrawals",
              value: dashboardData.pendingWithdrawals.toString(),
              icon: Clock,
              color: "bg-yellow-100 text-yellow-600"
            }
          ]}
          summary={{
            mtd: fmtAmount(dashboardData.mtdWithdrawals),
            today: `${fmtAmount(dashboardData.todayWithdrawals)} (vs 7-day avg ${fmtAmount(dashboardData.avg7DayWithdrawals)})`
          }}
        />
      </div>

      {/* Bulk Operation Logs Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">All Operation Logs</h2>
      </div>

      {/* Cards for Recent Activities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mb-6">
        {/* Recent Deposits */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Deposits</h3>
          </div>
          <div className="space-y-4">
            {recentDeposits.length > 0 ? recentDeposits.map((item, index) => (
              <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{item.user}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {fmtDate(item.time)} • MTS: {item.mts}
                    </div>
                    {item.details && item.details !== '-' && (
                      <div className="text-xs text-gray-400 mt-1">Txn: {item.details}</div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-semibold text-gray-900">{fmtAmount(item.amount)}</div>
                    <Badge tone={item.status === 'Approved' ? 'green' : item.status === 'Pending' ? 'amber' : 'red'}>
                      {item.status.toLowerCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-sm text-gray-500">No recent deposits</div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs text-gray-500">Showing last 5 results</span>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View all</button>
          </div>
        </div>

        {/* Recent Withdrawals */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Withdrawals</h3>
          </div>
          <div className="space-y-4">
            {recentWithdrawals.length > 0 ? recentWithdrawals.map((item, index) => (
              <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{item.user}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {fmtDate(item.time)} • MTS: {item.mts}
                    </div>
                    {item.details && item.details !== '-' && (
                      <div className="text-xs text-gray-400 mt-1">Txn: {item.details}</div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-semibold text-gray-900">{fmtAmount(item.amount)}</div>
                    <Badge tone={item.status === 'Approved' ? 'green' : item.status === 'Pending' ? 'amber' : 'red'}>
                      {item.status.toLowerCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-sm text-gray-500">No recent withdrawals</div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs text-gray-500">Showing last 5 results</span>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View all</button>
          </div>
        </div>

        {/* Recent Accounts Opened */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Accounts Opened</h3>
          </div>
          <div className="space-y-4">
            {recentAccounts.length > 0 ? recentAccounts.map((item, index) => (
              <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{item.user}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {fmtDate(item.time)}
                    </div>
                    <div className="text-xs text-gray-500">MTS: {item.mts}</div>
                  </div>
                  <div className="text-right ml-4">
                    <Badge tone="green">Opened</Badge>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-sm text-gray-500">No recent accounts</div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs text-gray-500">Showing last 5 results</span>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View all</button>
          </div>
        </div>
      </div>

      {/* Bulk Operation Logs Table */}
      {bulkLogsLoading ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-600">Loading operation logs...</p>
        </div>
      ) : bulkLogsError ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-red-400" />
          <p className="mt-2 text-red-600">{bulkLogsError}</p>
          <button
            onClick={fetchBulkLogs}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <ProTable
          title="Activity Logs"
          rows={bulkLogsRows}
          columns={[
            { key: "__index", label: "Sr No", sortable: false },
            { key: "time", label: "Time", render: (v) => fmtDate(v) },
            { key: "type", label: "Type" },
            { key: "user", label: "User" },
            { key: "mts", label: "MTS" },
            { key: "amount", label: "Amount", render: (v) => fmtAmount(v) },
            {
              key: "status", label: "Status", render: (v) => {
                let tone = 'gray';
                if (v === 'Approved' || v === 'Opened') tone = 'green';
                else if (v === 'Rejected') tone = 'red';
                else if (v === 'Pending') tone = 'amber';
                return <Badge tone={tone}>{v}</Badge>;
              }
            },
            { key: "details", label: "Details" },
          ]}
          filters={{
            searchKeys: ["user", "userName", "mts", "details", "status"],
          }}
          searchPlaceholder="Search user, MTS, details…"
          pageSize={10}
        />
      )}
    </div>
  );
}

