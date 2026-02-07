// src/pages/admin/ActivityLogs.jsx
import { useEffect, useMemo, useState } from "react";
import ProTable from "../components/ProTable.jsx";
import Badge from "../components/Badge.jsx";
import { ArrowUp, ArrowDown, UserPlus } from "lucide-react";

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function fmtAmount(v) {
  return v ? `$${Number(v || 0).toFixed(2)}` : "-";
}

export default function ActivityLogs() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentDeposits, setRecentDeposits] = useState([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState([]);
  const [recentAccounts, setRecentAccounts] = useState([]);

  const BASE = import.meta.env.VITE_BACKEND_API_URL || "https://fxbrokersuite-back-crm-jack.onrender.com/api";

  useEffect(() => {
    let stop = false;
    setLoading(true);
    setError("");

    const token = localStorage.getItem('adminToken');
    fetch(`${BASE}/admin/activity-logs?limit=500`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (stop) return;
        if (!data?.ok) throw new Error(data?.error || "Failed to load");
        const items = Array.isArray(data.items) ? data.items : [];
        setRows(items);

        // Extract recent activities for cards
        const deposits = items.filter(i => i.type === 'Deposit').slice(0, 5);
        const withdrawals = items.filter(i => i.type === 'Withdrawal').slice(0, 5);
        const accounts = items.filter(i => i.type === 'Account').slice(0, 5);

        setRecentDeposits(deposits);
        setRecentWithdrawals(withdrawals);
        setRecentAccounts(accounts);
      })
      .catch(e => setError(e.message || String(e)))
      .finally(() => !stop && setLoading(false));
    return () => { stop = true; };
  }, [BASE]);

  const columns = useMemo(() => [
    { key: "__index", label: "Sr No", sortable: false },
    { key: "time", label: "Time", render: (v) => fmtDate(v) },
    {
      key: "type", label: "Type", render: (v, row, Badge) => {
        if (v === 'Deposit') return <Badge tone="blue"><ArrowUp size={12} className="inline mr-1" /> Deposit</Badge>;
        if (v === 'Withdrawal') return <Badge tone="red"><ArrowDown size={12} className="inline mr-1" /> Withdrawal</Badge>;
        if (v === 'Account') return <Badge tone="green"><UserPlus size={12} className="inline mr-1" /> Account</Badge>;
        return <Badge tone="gray">{v}</Badge>;
      }
    },
    { key: "user", label: "User" },
    { key: "email", label: "Email" },
    { key: "accountId", label: "Account ID" },
    { key: "amount", label: "Amount", render: (v) => v ? fmtAmount(v) : "-" },
    {
      key: "status", label: "Status", render: (v, row, Badge) => {
        let tone = 'gray';
        if (v === 'Approved' || v === 'Opened' || v === 'Active') tone = 'green';
        else if (v === 'Rejected' || v === 'Suspended') tone = 'red';
        else if (v === 'Pending') tone = 'amber';
        return <Badge tone={tone}>{v}</Badge>;
      }
    },
    { key: "details", label: "Details" },
  ], []);

  const filters = useMemo(() => ({
    searchKeys: ["user", "email", "accountId", "details", "status"],
    dateKey: "time",
  }), []);

  if (loading) return <div className="rounded-xl bg-white border border-gray-200 p-4">Loading activities…</div>;
  if (error) return <div className="rounded-xl bg-white border border-rose-200 text-rose-700 p-4">{error}</div>;

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6">
      <div className="w-full space-y-4 sm:space-y-6">
        {/* Page Title */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">All Operation Logs</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Monitor all CRM activities and operations</p>
        </div>

        {/* Cards for Recent Activities */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
          {/* Recent Deposits */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 flex-shrink-0"></div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Recent Deposits</h3>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {recentDeposits.length > 0 ? recentDeposits.map((item, index) => (
                <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{item.user || item.email}</div>
                      <div className="text-xs text-gray-500 mt-1">{fmtDate(item.time)}</div>
                      {item.accountId && (
                        <div className="text-xs text-gray-400 mt-1">Account: {item.accountId}</div>
                      )}
                    </div>
                    <div className="flex flex-col sm:items-end gap-1">
                      <div className="text-xs sm:text-sm font-semibold text-gray-900">{fmtAmount(item.amount)}</div>
                      <Badge tone={item.status === 'Approved' ? 'green' : item.status === 'Pending' ? 'amber' : 'red'}>
                        {item.status?.toLowerCase() || 'pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-xs sm:text-sm text-gray-500">No recent deposits</div>
              )}
            </div>
            <div className="mt-3 sm:mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-xs text-gray-500">Showing last 5 results</span>
              <button className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium">View all</button>
            </div>
          </div>

          {/* Recent Withdrawals */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2 flex-shrink-0"></div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Recent Withdrawals</h3>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {recentWithdrawals.length > 0 ? recentWithdrawals.map((item, index) => (
                <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{item.user || item.email}</div>
                      <div className="text-xs text-gray-500 mt-1">{fmtDate(item.time)}</div>
                      {item.accountId && (
                        <div className="text-xs text-gray-400 mt-1">Account: {item.accountId}</div>
                      )}
                    </div>
                    <div className="flex flex-col sm:items-end gap-1">
                      <div className="text-xs sm:text-sm font-semibold text-gray-900">{fmtAmount(item.amount)}</div>
                      <Badge tone={item.status === 'Approved' ? 'green' : item.status === 'Pending' ? 'amber' : 'red'}>
                        {item.status?.toLowerCase() || 'pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-xs sm:text-sm text-gray-500">No recent withdrawals</div>
              )}
            </div>
            <div className="mt-3 sm:mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-xs text-gray-500">Showing last 5 results</span>
              <button className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium">View all</button>
            </div>
          </div>

          {/* Recent Accounts Opened */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2 flex-shrink-0"></div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Recent Accounts Opened</h3>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {recentAccounts.length > 0 ? recentAccounts.map((item, index) => (
                <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{item.user || item.email}</div>
                      <div className="text-xs text-gray-500 mt-1">{fmtDate(item.time)}</div>
                      {item.accountId && (
                        <div className="text-xs text-gray-400 mt-1">Account: {item.accountId}</div>
                      )}
                      {item.details && (
                        <div className="text-xs text-gray-400 mt-1">{item.details}</div>
                      )}
                    </div>
                    <div className="flex flex-col sm:items-end gap-1">
                      <Badge tone="green">Opened</Badge>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-xs sm:text-sm text-gray-500">No recent accounts</div>
              )}
            </div>
            <div className="mt-3 sm:mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-xs text-gray-500">Showing last 5 results</span>
              <button className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium">View all</button>
            </div>
          </div>
        </div>

        {/* Table */}
        <ProTable
          title="Activity Logs"
          rows={rows.map((r, i) => ({ ...r, __index: i + 1 }))}
          columns={columns}
          filters={filters}
          searchPlaceholder="Search user, email, account ID, details…"
          pageSize={10}
        />
      </div>
    </div>
  );
}

