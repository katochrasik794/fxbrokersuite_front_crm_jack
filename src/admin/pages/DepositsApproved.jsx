import { useEffect, useMemo, useState } from "react";
import ProTable from "../components/ProTable.jsx";

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function fmtAmount(v) {
  return `$${Number(v || 0).toFixed(2)}`;
}

export default function DepositsApproved() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalSum, setTotalSum] = useState(0);

  const BASE = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    let stop = false;
    setLoading(true);
    setError("");
    const token = localStorage.getItem('adminToken');
    fetch(`${BASE}/admin/deposits?status=approved&limit=10000`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (stop) return;
        if (!data?.ok) throw new Error(data?.error || "Failed to load");
        const items = Array.isArray(data.items) ? data.items : [];
        setTotalSum(Number(data.totalSum || 0));
        setRows(items.map(d => {
          const walletId = d.walletId ? parseInt(d.walletId) : null;
          return {
            id: d.id,
            userId: d.userId,
            userEmail: d.User?.email || "-",
            userName: d.User?.name || "-",
            mt5AccountId: d.mt5AccountId || d.MT5Account?.accountId || "-",
            walletId: walletId,
            walletNumber: d.walletNumber || null,
            depositTo: d.depositTo || 'wallet',
            amount: d.amount,
            currency: d.currency,
            method: d.method,
            paymentMethod: d.paymentMethod,
            status: d.status,
            approvedAt: d.approvedAt,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
          };
        }));
      })
      .catch(e => setError(e.message || String(e)))
      .finally(() => !stop && setLoading(false));
    return () => { stop = true; };
  }, [BASE]);

  const columns = useMemo(() => [
    { key: "__index", label: "Sr No", sortable: false },
    { key: "userEmail", label: "User Email" },
    { key: "userName", label: "User Name" },
    { key: "mt5AccountId", label: "MT5 Account ID", render: (v) => v && v !== "-" ? v : "-" },
    {
      key: "depositTo",
      label: "Deposit To",
      render: (v, row) => {
        if (row.depositTo === 'wallet' && row.walletNumber) {
          return <span className="text-blue-600 font-medium">Deposit in wallet {row.walletNumber}</span>;
        } else if (row.depositTo === 'mt5' && row.mt5AccountId && row.mt5AccountId !== "-") {
          return <span className="text-brand-600 font-medium">Deposit in MT5 ID {row.mt5AccountId}</span>;
        }
        return <span className="text-gray-400">-</span>;
      }
    },
    { key: "amount", label: "Amount", render: (v) => fmtAmount(v) },
    { key: "currency", label: "Currency" },
    { key: "method", label: "Method" },
    { key: "paymentMethod", label: "Payment Method" },
    {
      key: "status", label: "Status", render: (v, row, Badge) => (
        <Badge tone="green">{v}</Badge>
      )
    },
    { key: "approvedAt", label: "Approved At", render: (v) => fmtDate(v) },
    { key: "createdAt", label: "Created", render: (v) => fmtDate(v) },
  ], []);

  const filters = useMemo(() => ({
    searchKeys: ["userEmail", "userName", "mt5AccountId", "method", "paymentMethod"],
    dateKey: "createdAt",
  }), []);

  if (loading) return <div className="rounded-xl bg-white border border-gray-200 p-4">Loading deposits…</div>;
  if (error) return <div className="rounded-xl bg-white border border-rose-200 text-rose-700 p-4">{error}</div>;

  return (
    <div>
      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800">Total Approved Deposits</h3>
        <p className="text-2xl font-bold text-green-600">{fmtAmount(totalSum)}</p>
      </div>
      <ProTable
        title="Approved Deposits"
        rows={rows}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search user email, name, MT5 ID, method…"
        pageSize={50}
      />
    </div>
  );
}