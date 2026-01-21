import { useEffect, useMemo, useState } from "react";
import ProTable from "../components/ProTable.jsx";

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

export default function ReportsWallet() {
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
    fetch(`${BASE}/admin/wallet-transactions?limit=1000`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(r => r.json())
      .then(data => {
        if (stop) return;
        if (!data?.ok) throw new Error(data?.error || 'Failed to load wallet transactions');
        const items = Array.isArray(data.items) ? data.items : [];
        setRows(items.map(it => ({
          ...it,
        })));
      })
      .catch(e => setError(e.message || String(e)))
      .finally(() => !stop && setLoading(false));
    return () => { stop = true; };
  }, [BASE]);

  const columns = useMemo(() => ([
    { key: "__index", label: "#", sortable: false },
    { key: "createdAt", label: "Date", render: v => fmtDate(v) },
    { key: "userEmail", label: "User" , render: (v,row) => (
      <div>
        <div className="text-sm text-gray-900">{row.userName || '-'}</div>
        <div className="text-xs text-gray-500">{row.userEmail || '-'}</div>
      </div>
    ) },
    { key: "mt5AccountId", label: "MT5 ID" },
    { key: "wallet", label: "Wallet", render: (_v,row) => (
      <div>
        <div className="text-sm text-gray-900">{row.walletLabel || '-'}</div>
        <div className="text-xs text-gray-500">{row.walletId || ''}</div>
      </div>
    ) },
    { key: "type", label: "Type" },
    { key: "amount", label: "Amount", render: v => `$${Number(v||0).toFixed(2)}` },
    { key: "status", label: "Status", render: (v,_r,Badge) => (<Badge tone={v==='completed' || v==='approved' ? 'green' : v==='rejected' ? 'red' : 'amber'}>{v||'-'}</Badge>) },
    { key: "description", label: "Description" },
    { key: "withdrawalId", label: "Withdrawal ID" },
  ]), []);

  const filters = useMemo(() => ({
    searchKeys: ["userEmail","userName","mt5AccountId","walletId","walletLabel","type","status","description"],
    dateKey: "createdAt"
  }), []);

  if (loading) return <div className="rounded-xl bg-white border border-gray-200 p-4">Loading wallet transactions…</div>;
  if (error) return <div className="rounded-xl bg-white border border-rose-200 text-rose-700 p-4">{error}</div>;

  return (
    <ProTable
      title="Wallet Report"
      rows={rows}
      columns={columns}
      filters={filters}
      pageSize={20}
      searchPlaceholder="Search user, MT5, type, status, desc…"
    />
  );
}
