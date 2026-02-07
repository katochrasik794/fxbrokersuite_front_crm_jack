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

export default function WithdrawalsAll() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const BASE = import.meta.env.VITE_BACKEND_API_URL
    || import.meta.env.VITE_API_BASE_URL
    || "https://fxbrokersuite-back-crm-jack.onrender.com/api";

  useEffect(() => {
    let stop = false;
    setLoading(true);
    setError("");
    const token = localStorage.getItem('adminToken');
    fetch(`${BASE}/admin/withdrawals?limit=500`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (stop) return;
        if (!data?.ok) throw new Error(data?.error || "Failed to load");
        const items = Array.isArray(data.items) ? data.items : [];
        setRows(items.map(w => ({
          id: w.id,
          userId: w.userId,
          userEmail: w.User?.email || "-",
          userName: w.User?.name || "-",
          mt5AccountId: w.MT5Account?.accountId || "-",
          amount: w.amount,
          currency: w.currency,
          method: w.method,
          bankDetails: w.bankDetails,
          cryptoAddress: w.cryptoAddress,
          walletAddress: w.walletAddress,
          paymentMethod: w.paymentMethod,
          status: w.status,
          approvedAt: w.approvedAt,
          rejectedAt: w.rejectedAt,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
        })));
      })
      .catch(e => setError(e.message || String(e)))
      .finally(() => !stop && setLoading(false));
    return () => { stop = true; };
  }, [BASE]);

  const columns = useMemo(() => [
    { key: "__index", label: "Sr No", sortable: false },
    { key: "userEmail", label: "User Email" },
    { key: "userName", label: "User Name" },
    { key: "mt5AccountId", label: "MT5 Account ID" },
    { key: "amount", label: "Amount", render: (v) => fmtAmount(v) },
    { key: "currency", label: "Currency" },
    { key: "method", label: "Method" },
    { key: "paymentMethod", label: "Payment Method" },
    { key: "bankDetails", label: "Bank Details" },
    { key: "cryptoAddress", label: "Crypto Address" },
    { key: "walletAddress", label: "Wallet Address" },
    {
      key: "status", label: "Status", render: (v, row, Badge) => {
        let tone = 'gray';
        if (v === 'approved') tone = 'green';
        else if (v === 'rejected') tone = 'red';
        else if (v === 'pending') tone = 'amber';
        return <Badge tone={tone}>{v}</Badge>;
      }
    },
    { key: "approvedAt", label: "Approved At", render: (v) => fmtDate(v) },
    { key: "rejectedAt", label: "Rejected At", render: (v) => fmtDate(v) },
    { key: "createdAt", label: "Created", render: (v) => fmtDate(v) },
  ], []);

  const filters = useMemo(() => ({
    searchKeys: ["userEmail", "userName", "mt5AccountId", "method", "paymentMethod", "status"],
    dateKey: "createdAt",
  }), []);

  if (loading) return <div className="rounded-xl bg-white border border-gray-200 p-4">Loading withdrawals…</div>;
  if (error) return <div className="rounded-xl bg-white border border-rose-200 text-rose-700 p-4">{error}</div>;

  return (
    <ProTable
      title="All Withdrawals"
      rows={rows}
      columns={columns}
      filters={filters}
      searchPlaceholder="Search user email, name, MT5 ID, method…"
      pageSize={10}
    />
  );
}