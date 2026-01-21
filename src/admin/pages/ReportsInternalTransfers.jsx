import { useEffect, useMemo, useState } from "react";
import ProTable from "../components/ProTable.jsx";

function fmtDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

// Admin > Reports > Internal Transfer
export default function ReportsInternalTransfers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const BASE = import.meta.env.VITE_BACKEND_API_URL
    || import.meta.env.VITE_API_URL
    || "http://localhost:5000/api";

  useEffect(() => {
    let stop = false;
    setLoading(true);
    setError("");
    const token = localStorage.getItem('adminToken');
    fetch(`${BASE}/admin/internal-transfers?limit=500`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(r => r.json())
      .then(data => {
        if (stop) return;
        if (!data?.ok) throw new Error(data?.error || "Failed to load internal transfers");
        const items = Array.isArray(data.items) ? data.items : [];
        const parsed = items.map(t => {
          const fromObj = t.from ? {
            mt5Login: t.from.mt5Login,
            name: t.from.user?.name || '-',
            email: t.from.user?.email || '-',
          } : null;
          const toObj = t.to ? {
            mt5Login: t.to.mt5Login,
            name: t.to.user?.name || '-',
            email: t.to.user?.email || '-',
          } : null;
          return {
            id: t.id,
            createdAt: t.createdAt,
            amount: t.amount,
            currency: t.currency || 'USD',
            status: t.status,
            fromObj,
            toObj,
            accountsText: `${fromObj ? `${fromObj.mt5Login} ${fromObj.name} ${fromObj.email}` : ''} ${toObj ? `${toObj.mt5Login} ${toObj.name} ${toObj.email}` : ''}`.trim(),
            description: t.description || '-',
          };
        });
        setRows(parsed);
      })
      .catch(e => setError(e.message || String(e)))
      .finally(() => !stop && setLoading(false));
    return () => { stop = true; };
  }, [BASE]);

  const columns = useMemo(() => ([
    { key: "__index", label: "Sr No", sortable: false },
    { key: "createdAt", label: "Date", render: v => fmtDate(v) },
    { key: "accounts", label: "From / To", render: (_v, row) => (
      <div className="text-left">
        <div>
          {row.fromObj ? (
            <div>
              <div>{row.fromObj.mt5Login} — {row.fromObj.name}</div>
              <div className="text-xs text-gray-500">{row.fromObj.email}</div>
            </div>
          ) : '-'}
        </div>
        <div className="mt-1">
          {row.toObj ? (
            <div>
              <div>{row.toObj.mt5Login} — {row.toObj.name}</div>
              <div className="text-xs text-gray-500">{row.toObj.email}</div>
            </div>
          ) : '-'}
        </div>
      </div>
    ) },
    { key: "amount", label: "Amount", render: v => `$${Number(v||0).toFixed(2)}` },
    { key: "currency", label: "Currency" },
    { key: "status", label: "Status", render: (v, _row, Badge) => (
      <Badge tone={v === 'completed' ? 'green' : v === 'failed' ? 'red' : 'amber'}>{v}</Badge>
    ) },
    { key: "description", label: "Description" },
  ]), []);

  const filters = useMemo(() => ({
    searchKeys: ["accountsText","status","currency","description"],
    selects: [ { key: 'status', label: 'All Status', options: ['completed','pending','failed'] } ],
    dateKey: "createdAt",
  }), []);

  if (loading) return <div className="rounded-xl bg-white border border-gray-200 p-4">Loading internal transfers…</div>;
  if (error) return <div className="rounded-xl bg-white border border-rose-200 text-rose-700 p-4">{error}</div>;

  return (
    <ProTable
      title="Internal Transfer"
      rows={rows}
      columns={columns}
      filters={filters}
      pageSize={10}
      searchPlaceholder="Search MT5 / status / note"
    />
  );
}
