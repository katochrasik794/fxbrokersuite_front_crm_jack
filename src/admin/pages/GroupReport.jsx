// src/pages/admin/GroupReport.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import ProTable from "../components/ProTable.jsx";
import { RefreshCw, FileText, TrendingUp, TrendingDown, Users, DollarSign, AlertCircle, CheckCircle, XCircle, Clock, BarChart3 } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

const BASE = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:5000/api";

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

// Stat Card Component for Report Metrics
function StatCard({ title, value, subtitle, icon: Icon, color = "blue", percentage = null }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    yellow: "bg-yellow-50 text-yellow-600",
    purple: "bg-purple-50 text-purple-600",
    teal: "bg-teal-50 text-teal-600",
    orange: "bg-orange-50 text-orange-600"
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {percentage !== null && (
          <div className="text-sm font-medium text-gray-600">
            {Number(percentage).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-600">{title}</div>
        {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      </div>
    </div>
  );
}

export default function GroupReport() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reports, setReports] = useState({}); // { groupId: [reports] }
  const [fetchingReport, setFetchingReport] = useState(null); // groupId being fetched
  const [autoUpdateInterval, setAutoUpdateInterval] = useState(null);
  const intervalRef = useRef(null);

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem('adminToken');

      const response = await axios.get(`${BASE}/admin/group-management?is_active=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.data?.ok) {
        throw new Error(response.data?.error || "Failed to load groups");
      }

      const activeGroups = (response.data.items || []).filter(g => g.is_active);
      setGroups(activeGroups);
    } catch (e) {
      setError(e.message || String(e));
      console.error("Failed to load groups:", e);
    } finally {
      setLoading(false);
    }
  }, [BASE]);

  const fetchGroupReport = useCallback(async (groupId, groupName) => {
    try {
      setFetchingReport(groupId);
      const token = localStorage.getItem('adminToken');

      Swal.fire({
        title: 'Fetching Report...',
        text: `Generating report for ${groupName}`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await axios.post(
        `${BASE}/admin/group-management/${groupId}/report`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 60000 // 60 seconds timeout
        }
      );

      if (!response.data?.ok) {
        throw new Error(response.data?.error || "Failed to fetch report");
      }

      const reportData = response.data.data || response.data;
      const newReport = {
        id: Date.now(),
        groupId,
        groupName,
        fetchedAt: new Date().toISOString(),
        ...reportData
      };

      setReports(prev => ({
        ...prev,
        [groupId]: [newReport, ...(prev[groupId] || [])]
      }));

      Swal.fire({
        icon: 'success',
        title: 'Report Generated!',
        text: 'Report has been fetched successfully',
        timer: 2000
      });
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e.message || "Failed to fetch report"
      });
      console.error("Failed to fetch report:", e);
    } finally {
      setFetchingReport(null);
    }
  }, [BASE]);

  // Auto-update reports every 1 hour
  useEffect(() => {
    const updateReports = async () => {
      for (const group of groups) {
        if (reports[group.id] && reports[group.id].length > 0) {
          try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.post(
              `${BASE}/admin/group-management/${group.id}/report`,
              {},
              {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 60000
              }
            );

            if (response.data?.ok) {
              const reportData = response.data.data || response.data;
              const newReport = {
                id: Date.now(),
                groupId: group.id,
                groupName: group.group || group.name,
                fetchedAt: new Date().toISOString(),
                ...reportData
              };

              setReports(prev => ({
                ...prev,
                [group.id]: [newReport, ...(prev[group.id] || [])]
              }));
            }
          } catch (e) {
            console.error(`Auto-update failed for group ${group.id}:`, e);
          }
        }
      }
    };

    // Update immediately on mount if groups have reports
    if (groups.length > 0) {
      // Set up interval for 1 hour (3600000 ms)
      intervalRef.current = setInterval(updateReports, 3600000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [groups, BASE]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const renderReportCards = (report, groupId) => {
    const totalUsers = report.totalUsers || 0;
    const usersWithBalance = report.usersWithBalance || 0;
    const usersWithoutBalance = report.usersWithoutBalance || 0;
    const usersInProfit = report.usersInProfit || 0;
    const usersInLoss = report.usersInLoss || 0;
    const totalDeposit = report.totalDeposit || 0;
    const totalWithdrawal = report.totalWithdrawal || 0;
    const allClientsDeposit = report.allClientsDeposit || 0;
    const allClientsWithdrawal = report.allClientsWithdrawal || 0;
    const allClientsPnL = report.allClientsPnL || 0;

    const usersWithBalancePct = totalUsers > 0 ? (usersWithBalance / totalUsers) * 100 : 0;
    const usersWithoutBalancePct = totalUsers > 0 ? (usersWithoutBalance / totalUsers) * 100 : 0;
    const usersInProfitPct = totalUsers > 0 ? (usersInProfit / totalUsers) * 100 : 0;
    const usersInLossPct = totalUsers > 0 ? (usersInLoss / totalUsers) * 100 : 0;

    return (
      <div className="mt-6 space-y-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Group Report - {report.groupName}</h3>
            <div className="text-xs text-gray-500">
              Fetched: {fmtDate(report.fetchedAt)}
            </div>
          </div>

          {/* User Statistics */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Statistics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <StatCard
                title="Total Users"
                value={totalUsers}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Users with Balance"
                value={usersWithBalance}
                subtitle={`${usersWithBalancePct.toFixed(1)}% of total`}
                icon={CheckCircle}
                color="green"
                percentage={usersWithBalancePct}
              />
              <StatCard
                title="Users without Balance"
                value={usersWithoutBalance}
                subtitle={`${usersWithoutBalancePct.toFixed(1)}% of total`}
                icon={XCircle}
                color="red"
                percentage={usersWithoutBalancePct}
              />
              <StatCard
                title="Users in Profit"
                value={usersInProfit}
                subtitle={`${usersInProfitPct.toFixed(1)}% of total`}
                icon={TrendingUp}
                color="green"
                percentage={usersInProfitPct}
              />
              <StatCard
                title="Users in Loss"
                value={usersInLoss}
                subtitle={`${usersInLossPct.toFixed(1)}% of total`}
                icon={TrendingDown}
                color="red"
                percentage={usersInLossPct}
              />
            </div>
          </div>

          {/* Group Financial Statistics */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Group Financial Statistics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              <StatCard
                title="Total Deposit"
                value={fmtAmount(totalDeposit)}
                icon={TrendingUp}
                color="green"
              />
              <StatCard
                title="Total Withdrawal"
                value={fmtAmount(totalWithdrawal)}
                icon={TrendingDown}
                color="red"
              />
            </div>
          </div>

          {/* All Clients Overall Statistics */}
          <div>
            <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              All Clients Overall Statistics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                title="Overall Deposit"
                value={fmtAmount(allClientsDeposit)}
                icon={DollarSign}
                color="teal"
              />
              <StatCard
                title="Overall Withdrawal"
                value={fmtAmount(allClientsWithdrawal)}
                icon={DollarSign}
                color="orange"
              />
              <StatCard
                title="Overall P&L Net"
                value={fmtAmount(allClientsPnL)}
                subtitle={allClientsPnL >= 0 ? "Profit" : "Loss"}
                icon={allClientsPnL >= 0 ? TrendingUp : TrendingDown}
                color={allClientsPnL >= 0 ? "green" : "red"}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-600">Loading groups...</p>
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
            onClick={loadGroups}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Group Report</h1>
          <p className="text-gray-600">Generate and view reports for MT5 groups</p>
        </div>
        <button
          onClick={loadGroups}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Groups
        </button>
      </div>

      {/* Active Groups Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Active Groups</h2>
          <p className="text-sm text-gray-500 mt-1">Click "Fetch Report" to generate a report for each group</p>
        </div>
        <ProTable
          rows={groups.map((group, index) => ({
            __index: index + 1,
            id: group.id,
            group: group.group || group.name || 'N/A',
            dedicatedName: group.dedicated_name || '-',
            isActive: group.is_active ? 'Yes' : 'No',
            _raw: group
          }))}
          columns={[
            { key: "__index", label: "Sr No", sortable: false },
            { key: "group", label: "Group Name" },
            { key: "dedicatedName", label: "Dedicated Name" },
            { key: "isActive", label: "Active" },
            {
              key: "actions",
              label: "Actions",
              sortable: false,
              render: (value, row) => (
                <button
                  onClick={() => fetchGroupReport(row.id, row.group)}
                  disabled={fetchingReport === row.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {fetchingReport === row.id ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Fetching...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      <span>Fetch Report</span>
                    </>
                  )}
                </button>
              )
            }
          ]}
          pageSize={10}
          searchPlaceholder="Search groups..."
        />
      </div>

      {/* Reports Section - Reverse order (latest first) */}
      {Object.keys(reports).map(groupId => {
        const groupReports = reports[groupId] || [];
        if (groupReports.length === 0) return null;

        const group = groups.find(g => g.id === parseInt(groupId));
        return (
          <div key={groupId} className="mb-8">
            {groupReports.map((report, index) => (
              <div key={report.id}>
                {renderReportCards(report, groupId)}
              </div>
            ))}
          </div>
        );
      })}

      {Object.keys(reports).length === 0 && (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No reports generated yet</p>
          <p className="text-sm text-gray-500 mt-2">Click "Fetch Report" on any group above to generate a report</p>
        </div>
      )}
    </div>
  );
}

