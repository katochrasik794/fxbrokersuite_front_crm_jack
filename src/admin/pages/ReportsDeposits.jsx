import { useEffect, useMemo, useState } from "react";
import ProTable from "../components/ProTable.jsx";

function fmtDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

// Admin > Reports > Deposit Report
export default function ReportsDeposits() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [admins, setAdmins] = useState({});

  const BASE = import.meta.env.VITE_BACKEND_API_URL
    || import.meta.env.VITE_API_BASE_URL
    || "http://localhost:5000/api";

  useEffect(() => {
    let stop = false;
    setLoading(true);
    setError("");
    const token = localStorage.getItem('adminToken');
    // fetch admins map for approvedBy label
    fetch(`${BASE}/admin/admins`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(j => {
        const map = {};
        (j?.admins||[]).forEach(a => { map[String(a.id)] = a; });
        if (!stop) setAdmins(map);
      }).catch(()=>{});
    const depReq = fetch(`${BASE}/admin/deposits?limit=500`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());

    const adminTxReq = fetch(`${BASE}/admin/admin-transactions?operation_type=deposit&limit=500`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(async r => {
      try {
        if (!r.ok) return { ok: true, items: [] };
        const ct = r.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return { ok: true, items: [] };
        return await r.json();
      } catch { return { ok: true, items: [] }; }
    });

    Promise.all([depReq, adminTxReq])
      .then(async ([depData, adminData]) => {
        if (stop) return;
        if (!depData?.ok) throw new Error(depData?.error || 'Failed to load deposits');
        // Fallback to balance-history on live if admin-transactions missing
        if (!adminData?.ok) {
          try {
            const fh = await fetch(`${BASE}/admin/mt5/balance-history?operation_type=deposit&limit=500`, { headers: { 'Authorization': `Bearer ${token}` } });
            const jh = await fh.json();
            adminData = jh?.ok ? { ok: true, items: (jh.operations||[]).map(op => ({
              id: op.id,
              user_email: op.admin?.email || '-', // user email may not be present here
              user_name: '-',
              mt5_login: op.mt5_login,
              amount: op.amount,
              currency: op.currency || 'USD',
              status: op.status || 'completed',
              created_at: op.created_at,
              admin_email: op.admin?.email,
              admin_role: op.admin?.admin_role || 'admin'
            })) } : { ok: true, items: [] };
          } catch { adminData = { ok: true, items: [] }; }
        }
        const depItems = Array.isArray(depData.items) ? depData.items : [];
        const adminItems = Array.isArray(adminData.items) ? adminData.items : [];
        const depRows = depItems.map(d => ({
          id: d.id,
          userEmail: d.User?.email || "-",
          userName: d.User?.name || "-",
          mt5AccountId: d.MT5Account?.accountId || "-",
          method: d.method,
          paymentMethod: d.paymentMethod,
          amount: d.amount,
          currency: d.currency,
          status: d.status,
          createdAt: d.createdAt,
          approvedBy: d.approvedBy || '',
          rejectedBy: d.rejectedBy || '',
        }));
        const adminRows = adminItems.map(t => ({
          id: `adm-${t.id}`,
          userEmail: t.user_email || '-',
          userName: t.user_name || '-',
          mt5AccountId: t.mt5_login,
          method: 'admin',
          paymentMethod: '-',
          amount: t.amount,
          currency: t.currency || 'USD',
          status: t.status || 'completed',
          createdAt: t.created_at,
          approvedBy: t.admin_id || '',
          rejectedBy: '',
        }));
        setRows([...adminRows, ...depRows]);
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
    { key: "method", label: "Method" },
    { key: "paymentMethod", label: "Payment Method" },
    { key: "amount", label: "Amount", render: v => `$${Number(v||0).toFixed(2)}` },
    { key: "currency", label: "Currency" },
    { key: "status", label: "Status", render: (v, _row, Badge) => (
      <Badge tone={v === 'approved' ? 'green' : v === 'rejected' ? 'red' : 'amber'}>{v}</Badge>
    ) },
    { key: "approvedBy", label: "Approved By", render: (v) => {
      if (!v) return '-';
      const a = admins[String(v)];
      if (!a) return String(v);
      const role = a.admin_role || a.role || 'admin';
      return `${a.email} (${role})`;
    } },
    { key: "rejectedBy", label: "Rejected By", render: (v) => {
      if (!v) return '-';
      const a = admins[String(v)];
      if (!a) return String(v);
      const role = a.admin_role || a.role || 'admin';
      return `${a.email} (${role})`;
    } },
  ]), [admins]);

  const filters = useMemo(() => ({
    searchKeys: ["userEmail","userName","mt5AccountId","method","paymentMethod","status","currency"],
    dateKey: "createdAt",
  }), []);

  if (loading) return <div className="rounded-xl bg-white border border-gray-200 p-4">Loading deposits…</div>;
  if (error) return <div className="rounded-xl bg-white border border-rose-200 text-rose-700 p-4">{error}</div>;

  return (
    <ProTable
      title="Deposit Report"
      rows={rows}
      columns={columns}
      filters={filters}
      pageSize={10}
      searchPlaceholder="Search user / MT5 / method / status"
    />
  );
}
