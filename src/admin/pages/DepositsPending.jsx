import { useEffect, useMemo, useState } from "react";
import ProTable from "../components/ProTable.jsx";
import Modal from "../components/Modal.jsx";
import { CheckCircle, XCircle, Eye, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function fmtAmount(v) {
  return `$${Number(v || 0).toFixed(2)}`;
}

export default function DepositsPending() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmApprove, setConfirmApprove] = useState(null);
  const [approving, setApproving] = useState(false);
  const [confirmReject, setConfirmReject] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [toast, setToast] = useState(null);
  const [approveComment, setApproveComment] = useState("");

  const BASE = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    let stop = false;
    setLoading(true);
    setError("");
    const token = localStorage.getItem('adminToken');
    fetch(`${BASE}/admin/deposits?status=pending&limit=500`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (stop) return;
        if (!data?.ok) throw new Error(data?.error || "Failed to load");
        const items = Array.isArray(data.items) ? data.items : [];
        console.log('Deposits data received:', items);
        setRows(items.map(d => {
          const walletId = d.walletId ? parseInt(d.walletId) : null;
          console.log('Mapping deposit:', {
            id: d.id,
            depositTo: d.depositTo,
            walletId: d.walletId,
            walletIdParsed: walletId,
            walletNumber: d.walletNumber
          });
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
            bankDetails: d.bankDetails,
            cryptoAddress: d.cryptoAddress,
            depositAddress: d.depositAddress,
            status: d.status,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
          };
        }));
      })
      .catch(e => setError(e.message || String(e)))
      .finally(() => !stop && setLoading(false));
    return () => { stop = true; };
  }, [BASE]);

  // Bank details are now provided by backend joined with manual_gateway per user country

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
    // Combine payment method and bank details compactly under "Payment Method"
    {
      key: "payment", label: "Payment Method", render: (_v, row) => {
        const method = row.bankDetails ? 'Bank Transfer' : (row.paymentMethod || row.method || '-');
        const raw = row.bankDetails || '';
        // Split bank details by " | " and render 2 items per visual row using a grid
        const parts = raw ? String(raw).split(' | ').map(s => s.trim()).filter(Boolean) : [];
        const pairs = [];
        for (let i = 0; i < parts.length; i += 2) {
          pairs.push([parts[i], parts[i + 1] || '']);
        }
        return (
          <div className="leading-tight">
            <div className="text-gray-900 text-sm font-medium">{method}</div>
            {parts.length ? (
              <div className="text-xs text-gray-600 max-w-[520px]">
                {pairs.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-1/2 pr-2 truncate" title={p[0]}>{p[0]}</span>
                    <span className="w-1/2 truncate" title={p[1]}>{p[1]}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-400">-</div>
            )}
          </div>
        );
      }
    },
    {
      key: "status", label: "Status", render: (v, row, Badge) => (
        <Badge tone="amber">{v}</Badge>
      )
    },
    { key: "createdAt", label: "Created", render: (v) => fmtDate(v) },
    {
      key: "actions", label: "Actions", sortable: false, render: (v, row) => (
        <div className="flex items-center gap-2 justify-center">
          <button
            onClick={() => setConfirmApprove(row)}
            disabled={approving || rejecting}
            className="h-8 w-8 grid place-items-center rounded-md border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Approve Deposit"
          >
            <CheckCircle size={16} />
          </button>
          <button
            onClick={() => { setConfirmReject(row); setRejectReason(""); }}
            disabled={approving || rejecting}
            className="h-8 w-8 grid place-items-center rounded-md border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reject Deposit"
          >
            <XCircle size={16} />
          </button>
        </div>
      )
    },
  ], [approving, rejecting]);

  const filters = useMemo(() => ({
    searchKeys: ["userEmail", "userName", "mt5AccountId", "paymentMethod"],
    dateKey: "createdAt",
  }), []);

  async function onApprove(row) {
    setApproving(true);
    setErrorMessage("");
    try {
      const methodLabel = row.bankDetails
        ? "Bank Transfer"
        : (row.paymentMethod || row.method || "-");

      const autoComment = `Deposit approved via ${methodLabel}`;
      const finalComment = approveComment?.trim()
        ? approveComment.trim()
        : autoComment;

      const r = await fetch(`${BASE}/admin/deposits/${row.id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment: finalComment }),
      });
      const data = await r.json();
      if (!data?.ok) throw new Error(data?.error || "Failed to approve");

      setRows((list) => list.filter((it) => it.id !== row.id));
      setConfirmApprove(null);
      setApproveComment("");
      setToast({
        type: "success",
        message: data.message || "Deposit approved successfully.",
      });
      setTimeout(() => setToast(null), 5000);
    } catch (e) {
      setToast({ type: "error", message: e.message || String(e) });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setApproving(false);
    }
  }

  async function onReject(row) {
    setRejecting(true);
    setErrorMessage("");
    try {
      const r = await fetch(`${BASE}/admin/deposits/${row.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      const data = await r.json();
      if (!data?.ok) throw new Error(data?.error || 'Failed to reject');
      setRows(list => list.filter(it => it.id !== row.id));
      setConfirmReject(null);
      setRejectReason("");
      setToast({ type: 'success', message: data.message || 'Deposit rejected successfully.' });
      setTimeout(() => setToast(null), 5000);
    } catch (e) {
      setToast({ type: 'error', message: e.message || String(e) });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setRejecting(false);
    }
  }

  if (loading) return <div className="rounded-xl bg-white border border-gray-200 p-4">Loading deposits…</div>;
  if (error) return <div className="rounded-xl bg-white border border-rose-200 text-rose-700 p-4">{error}</div>;

  return (
    <>
      <ProTable
        title="Pending Deposits"
        rows={rows}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search user email, name, MT5 ID, method…"
        pageSize={10}
      />

      {/* Approve Confirm */}
      <Modal open={!!confirmApprove} onClose={() => { if (!approving) setConfirmApprove(null); }} title="Approve Deposit">
        {confirmApprove && (
          <div className="space-y-4">
            <p>
              Do you want to approve the deposit of{" "}
              <b>{fmtAmount(confirmApprove.amount)}</b> for{" "}
              <b>{confirmApprove.userEmail}</b>?
            </p>
            <p className="text-sm text-gray-600">
              Default comment will be:{" "}
              <span className="font-mono">
                Deposit approved via{" "}
                {confirmApprove.bankDetails
                  ? "Bank Transfer"
                  : confirmApprove.paymentMethod ||
                  confirmApprove.method ||
                  "-"}
              </span>
            </p>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Comment (optional)
              </label>
              <input
                type="text"
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                placeholder="Add your own comment for this approval"
                className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-gray-400">
                If empty, system uses the default comment above.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmApprove(null)}
                disabled={approving}
                className="px-4 h-10 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => onApprove(confirmApprove)}
                disabled={approving}
                className="px-4 h-10 rounded-md bg-green-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {approving && <Loader2 className="w-4 h-4 animate-spin" />}
                {approving ? "Approving..." : "Approve"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 ${toast.type === 'success'
          ? 'bg-green-100 border border-green-400 text-green-800'
          : 'bg-red-100 border border-red-400 text-red-800'
          }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Reject Confirm */}
      <Modal open={!!confirmReject} onClose={() => { if (!rejecting) setConfirmReject(null); }} title="Reject Deposit">
        {confirmReject && (
          <div className="space-y-4">
            <p>Provide a reason and confirm rejection of <b>{fmtAmount(confirmReject.amount)}</b> for <b>{confirmReject.userEmail}</b>.</p>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Rejection Reason (optional)</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 p-2"
                placeholder="Reason for rejection"
                disabled={rejecting}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmReject(null)}
                disabled={rejecting}
                className="px-4 h-10 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => onReject(confirmReject)}
                disabled={rejecting}
                className="px-4 h-10 rounded-md bg-red-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {rejecting && <Loader2 className="w-4 h-4 animate-spin" />}
                {rejecting ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
