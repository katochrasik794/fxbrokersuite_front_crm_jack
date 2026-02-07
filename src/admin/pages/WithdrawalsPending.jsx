import { useEffect, useMemo, useState } from "react";
import ProTable from "../components/ProTable.jsx";
import Modal from "../components/Modal.jsx";
import { CheckCircle, XCircle, Eye } from "lucide-react";
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

export default function WithdrawalsPending() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmApprove, setConfirmApprove] = useState(null);
  const [txId, setTxId] = useState("");
  const [approving, setApproving] = useState(false);
  const [confirmReject, setConfirmReject] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  // Success toast handled by SweetAlert for quick feedback

  const BASE = import.meta.env.VITE_BACKEND_API_URL
    || import.meta.env.VITE_API_BASE_URL
    || "https://fxbrokersuite-back-crm-jack.onrender.com/api";

  useEffect(() => {
    let stop = false;
    setLoading(true);
    setError("");
    const token = localStorage.getItem('adminToken');
    fetch(`${BASE}/admin/withdrawals?status=pending&limit=500`, {
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
          amount: w.amount,
          currency: w.currency,
          method: w.method,
          bankDetails: w.bankDetails,
          bankName: w.bankName,
          accountName: w.accountName,
          accountNumber: w.accountNumber,
          ifscSwiftCode: w.ifscSwiftCode,
          accountType: w.accountType,
          cryptoAddress: w.cryptoAddress,
          walletAddress: w.walletAddress,
          paymentMethod: w.paymentMethod,
          status: w.status,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
        })));
      })
      .catch(e => setError(e.message || String(e)))
      .finally(() => !stop && setLoading(false));
    return () => { stop = true; };
  }, [BASE]);

  function isDigitsOnly(s) {
    return typeof s === 'string' && !!s.length && /^\d{6,}$/.test(s.replace(/\s|-/g, ''));
  }

  function detectType(row) {
    const pm = String(row.paymentMethod || '').toLowerCase();
    const method = String(row.method || '').toLowerCase();
    const pmType = String(row.pmMethodType || '').toLowerCase();
    const looksBank = pmType === 'bank' || method === 'bank' || method === 'manual' || pm.includes('bank') || pm.includes('wire') || !!row.bankDetails || isDigitsOnly(row.walletAddress);
    if (looksBank) return { isBank: true, isCrypto: false };
    const isCrypto = pmType === 'crypto' || method === 'crypto' || pm.includes('usdt') || pm.includes('btc') || pm.includes('eth') || pm.includes('trc') || pm.includes('erc');
    return { isBank: false, isCrypto };
  }

  function parseCryptoInfo(row) {
    const pm = String((row.pmCurrency && row.pmNetwork) ? `${row.pmCurrency}-${row.pmNetwork}` : (row.paymentMethod || '')).toUpperCase();
    // Expect formats like "USDT-TRC20" or "BTC" etc.
    let currency = null, network = null;
    if (pm.includes('-')) {
      const [tok, net] = pm.split('-');
      currency = tok || null;
      network = net || null;
    } else if (pm) {
      currency = pm;
    }
    return { currency, network };
  }

  const columns = useMemo(() => [
    { key: "__index", label: "Sr No", sortable: false },
    { key: "userEmail", label: "User Email" },
    { key: "userName", label: "User Name" },
    { key: "amount", label: "Amount", render: (v) => fmtAmount(v) },
    { key: "currency", label: "Currency" },
    { key: "method", label: "Method" },
    {
      key: "paymentMethod", label: "Payment Method", render: (v, row) => {
        const t = detectType(row);
        if (t.isBank) return 'Bank Transfer';
        if (row.pmCurrency || row.pmNetwork) {
          return `${row.pmCurrency || ''}${row.pmNetwork ? '-' + row.pmNetwork : ''}` || '-';
        }
        return row.paymentMethod || row.method || '-';
      }
    },
    {
      key: "bankDetails", label: "Bank Details", render: (v, row) => {
        const t = detectType(row);
        if (t.isBank) {
          const hasStructured = row.bankName || row.accountName || row.accountNumber || row.ifscSwiftCode || row.accountType;
          if (hasStructured) {
            return (
              <div className="text-xs text-gray-800 leading-tight whitespace-normal break-words max-w-[560px]">
                {row.bankName && <div><b>Bank:</b> {row.bankName}</div>}
                {(row.accountName || row.accountNumber) && (
                  <div>
                    <b>Account:</b> {row.accountName || '-'} {row.accountNumber ? (<span className="ml-2"># {row.accountNumber}</span>) : null}
                  </div>
                )}
                {row.ifscSwiftCode && <div><b>IFSC/SWIFT:</b> {row.ifscSwiftCode}</div>}
                {row.accountType && <div><b>Type:</b> {row.accountType}</div>}
              </div>
            );
          }
          if (row.bankDetails) return row.bankDetails;
          if (isDigitsOnly(row.walletAddress)) return `Account Number: ${row.walletAddress}`;
          return '-';
        }
        // Crypto presentation inside Bank Details column (to match compact design)
        const { currency, network } = parseCryptoInfo(row);
        const addr = row.pmAddress || row.walletAddress || row.cryptoAddress || '-';
        return (
          <div className="text-xs text-gray-700 leading-tight whitespace-normal break-words max-w-[560px]">
            <div><b>Address:</b> {addr}</div>
            <div>
              <b>Network:</b> {network || '-'}
              <span className="ml-3"><b>Currency:</b> {currency || '-'}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: "cryptoAddress", label: "Crypto Address", render: (v, row) => {
        const t = detectType(row);
        if (!t.isCrypto) return '-';
        return row.cryptoAddress || row.walletAddress || '-';
      }
    },
    {
      key: "walletAddress", label: "Wallet Address", render: (v, row) => {
        const t = detectType(row);
        if (!t.isCrypto) return '-';
        return row.walletAddress || row.cryptoAddress || '-';
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
            className="h-8 w-8 grid place-items-center rounded-md border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50"
            title="Approve Withdrawal"
          >
            <CheckCircle size={16} />
          </button>
          <button
            onClick={() => { setConfirmReject(row); setRejectReason(""); }}
            disabled={approving || rejecting}
            className="h-8 w-8 grid place-items-center rounded-md border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
            title="Reject Withdrawal"
          >
            <XCircle size={16} />
          </button>
        </div>
      )
    },
  ], []);

  const filters = useMemo(() => ({
    searchKeys: ["userEmail", "userName", "method", "paymentMethod"],
    dateKey: "createdAt",
  }), []);

  async function onApprove(row) {
    setApproving(true);
    try {
      if (!txId || !txId.trim()) {
        throw new Error('Please enter a transaction ID/hash');
      }
      const r = await fetch(`${BASE}/admin/withdrawals/${row.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ externalTransactionId: txId.trim() })
      });
      const data = await r.json();
      if (!data?.ok) throw new Error(data?.error || 'Failed to approve');
      setRows(list => list.filter(it => it.id !== row.id));
      setConfirmApprove(null);
      setTxId("");
      await Swal.fire({ icon: 'success', title: 'Approved', text: data.message || 'Withdrawal approved successfully.', timer: 1500, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Failed', text: e.message || String(e) });
    } finally {
      setApproving(false);
    }
  }

  async function onReject(row) {
    setRejecting(true);
    try {
      const r = await fetch(`${BASE}/admin/withdrawals/${row.id}/reject`, {
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
      await Swal.fire({ icon: 'success', title: 'Rejected', text: data.message || 'Withdrawal rejected successfully.', timer: 1500, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Failed', text: e.message || String(e) });
    } finally {
      setRejecting(false);
    }
  }

  if (loading) return <div className="rounded-xl bg-white border border-gray-200 p-4">Loading withdrawals…</div>;
  if (error) return <div className="rounded-xl bg-white border border-rose-200 text-rose-700 p-4">{error}</div>;

  return (
    <>
      <ProTable
        title="Pending Withdrawals"
        rows={rows}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search user email, name, MT5 ID, method…"
        pageSize={10}
      />

      {/* Approve Confirm */}
      <Modal open={!!confirmApprove} onClose={() => { setConfirmApprove(null); setTxId(""); }} title="Approve Withdrawal">
        {confirmApprove && (
          <div className="space-y-4">
            <p>Do you want to approve the withdrawal of <b>{fmtAmount(confirmApprove.amount)}</b> for <b>{confirmApprove.userEmail}</b>?</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID / Hash</label>
              <input
                type="text"
                placeholder="Paste the blockchain tx hash or bank ref"
                value={txId}
                onChange={e => setTxId(e.target.value)}
                disabled={approving}
                className="w-full rounded-md border border-gray-300 h-10 px-3 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-gray-100 disabled:text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">This will be saved as External Transaction ID.</p>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setConfirmApprove(null); setTxId(""); }} className="px-4 h-10 rounded-md border">Cancel</button>
              <button
                onClick={() => onApprove(confirmApprove)}
                disabled={approving}
                className="px-4 h-10 rounded-md bg-green-600 text-white disabled:bg-gray-400"
              >
                {approving ? "Approving..." : "Approve"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Confirm */}
      <Modal open={!!confirmReject} onClose={() => { if (!rejecting) setConfirmReject(null); }} title="Reject Withdrawal">
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
              <button onClick={() => setConfirmReject(null)} disabled={rejecting} className="px-4 h-10 rounded-md border disabled:opacity-50">Cancel</button>
              <button
                onClick={() => onReject(confirmReject)}
                disabled={rejecting}
                className="px-4 h-10 rounded-md bg-red-600 text-white disabled:bg-gray-400"
              >
                {rejecting ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        )}
      </Modal>

    </>
  );
}
