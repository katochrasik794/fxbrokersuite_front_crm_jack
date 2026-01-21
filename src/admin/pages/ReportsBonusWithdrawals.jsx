import { useEffect, useMemo, useState } from "react";
import ProTable from "../components/ProTable.jsx";

function fmtDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

// Admin > Reports > Bonus Withdrawal Report
export default function ReportsBonusWithdrawals() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const BASE = import.meta.env.VITE_BACKEND_API_URL
    || import.meta.env.VITE_API_BASE_URL
    || "http://localhost:5000/api";

  useEffect(() => {
    let stop = false;
    setLoading(true);
    setError("");
    const token = localStorage.getItem('adminToken');
    fetch(`${BASE}/admin/admin-transactions?operation_type=bonus_deduct&limit=500`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(async r => {
        try {
          if (!r.ok) return { ok: true, items: [] };
          const ct = r.headers.get('content-type') || '';
          if (!ct.includes('application/json')) return { ok: true, items: [] };
          return await r.json();
        } catch { return { ok: true, items: [] }; }
      })
      .then(data => {
        if (stop) return;
        if (!data?.ok) throw new Error(data?.error || "Failed to load admin transactions");
        const items = Array.isArray(data.items) ? data.items : [];
        setRows(items.map(t => ({
          id: t.id,
          userEmail: t.user_email || '-',
          userName: t.user_name || '-',
          mt5AccountId: t.mt5_login,
          bonusType: 'Credit Deduct',
          amount: t.amount,
          reason: t.comment || '-',
          status: t.status || 'completed',
          createdAt: t.created_at,
          performedBy: t.admin_email ? `${t.admin_email} (${t.admin_role || 'admin'})` : t.admin_id,
        })));
      })
      .catch(e => setError(e.message || String(e)))
      .finally(() => !stop && setLoading(false));
    return () => { stop = true; };
  }, [BASE]);

  const columns = useMemo(() => ([
    { key: "__index", label: "Sr No", sortable: false },
    { key: "createdAt", label: "Date", render: v => fmtDate(v) },
    { key: "userEmail", label: "User Email" },
    { key: "userName", label: "User Name" },
    { key: "mt5AccountId", label: "MT5 ID" },
    { key: "bonusType", label: "Bonus Type" },
    { key: "amount", label: "Bonus Deducted", render: v => `$${Number(v||0).toFixed(2)}` },
    { key: "reason", label: "Reason" },
    { key: "status", label: "Status", render: (v, _row, Badge) => (
      <Badge tone={v === 'completed' ? 'green' : v === 'failed' ? 'red' : 'amber'}>{v}</Badge>
    ) },
    { key: "performedBy", label: "Performed By" },
  ]), []);

  const filters = useMemo(() => ({
    searchKeys: ["userEmail","userName","mt5AccountId","bonusType","status","reason"],
    dateKey: "createdAt",
  }), []);

  if (loading) return <div className="rounded-xl bg-white border border-gray-200 p-4">Loading bonus withdrawals…</div>;
  if (error) return <div className="rounded-xl bg-white border border-rose-200 text-rose-700 p-4">{error}</div>;

  return (
    <ProTable
      title="Bonus Withdrawal Report"
      rows={rows}
      columns={columns}
      filters={filters}
      pageSize={10}
      searchPlaceholder="Search user / MT5 / bonus type"
    />
  );
}
