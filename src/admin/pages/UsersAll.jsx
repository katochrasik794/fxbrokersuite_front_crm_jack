// src/pages/admin/UsersAll.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import ProTable from "../components/ProTable.jsx";
import Modal from "../components/Modal.jsx";
import { Pencil, Trash2, MailCheck, MailX, Eye, Lock, Unlock, CheckCircle, XCircle } from "lucide-react";
import Swal from "sweetalert2";

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export default function UsersAll({ initialTitle = 'All Users', queryParams = {} }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // row
  const [confirmDel, setConfirmDel] = useState(null); // row
  const [deleting, setDeleting] = useState(false); // loading state for delete
  const [userFunds, setUserFunds] = useState(null); // {walletBalance, mt5Accounts, totalFunds}
  const [loadingFunds, setLoadingFunds] = useState(false);
  const [confirmVerify, setConfirmVerify] = useState(null); // {row,next}
  const [confirmBan, setConfirmBan] = useState(null); // {row,next}
  const [countryScope, setCountryScope] = useState("");
  const navigate = useNavigate();

  // Backend base URL (Express server runs on 5000 with /api prefix)
  const BASE = import.meta.env.VITE_BACKEND_API_URL || "https://fxbrokersuite-back-crm-jack.onrender.com/api";
  const { admin } = useAuth();

  useEffect(() => {
    // Resolve country scope if logged-in email matches a country admin
    const token = localStorage.getItem('adminToken');
    const email = admin?.email;
    if (!email) return;
    let cancelled = false;
    fetch(`${BASE}/admin/country-admins`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(list => {
        if (cancelled) return;
        const match = Array.isArray(list) ? list.find(ca => (ca.email || '').toLowerCase() === String(email).toLowerCase()) : null;
        if (match?.country) setCountryScope(String(match.country).toLowerCase());
      })
      .catch(() => { });
    return () => { cancelled = true; };
  }, [BASE, admin?.email]);

  useEffect(() => {
    let stop = false;
    setLoading(true);
    setError("");
    const withScope = { ...queryParams };
    if (countryScope) withScope.country = countryScope;
    const search = new URLSearchParams({ limit: '500', ...Object.fromEntries(Object.entries(withScope).map(([k, v]) => [k, String(v)])) });
    const token = localStorage.getItem('adminToken');
    fetch(`${BASE}/admin/users/all?${search.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (stop) return;
        if (!data?.ok) throw new Error(data?.error || "Failed to load");
        const items = Array.isArray(data.items) ? data.items : [];
        setRows(items.map(u => ({
          id: u.id,
          clientId: u.clientId,
          name: u.name || "-",
          email: u.email,
          phone: u.phone || "-",
          country: u.country || "-",
          role: u.role,
          status: u.status,
          emailVerified: u.emailVerified ? "Yes" : "No",
          kycVerified: (u.KYC?.verificationStatus && String(u.KYC.verificationStatus).toLowerCase() === 'approved') ? 'Yes' : 'No',
          createdAt: u.createdAt,
          lastLoginAt: u.lastLoginAt,
        })));
      })
      .catch(e => setError(e.message || String(e)))
      .finally(() => !stop && setLoading(false));
    return () => { stop = true; };
  }, [BASE, JSON.stringify(queryParams), countryScope]);

  const columns = useMemo(() => [
    { key: "__index", label: "Sr No", sortable: false },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "country", label: "Country" },
    {
      key: "status", label: "Status", render: (v, row, Badge) => {
        const isActive = v === 'active';
        const isInactive = v === 'inactive';
        const isBanned = v === 'banned';
        return (
          <div className="flex items-center gap-2">
            {isActive ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : isInactive ? (
              <XCircle className="h-4 w-4 text-gray-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <Badge tone={isActive ? 'green' : isBanned ? 'red' : 'gray'}>{v}</Badge>
          </div>
        );
      }
    },
    {
      key: "emailVerified", label: "Email Verified", render: (v, row, Badge) => (
        <Badge tone={v === 'Yes' ? 'green' : 'amber'}>{v}</Badge>
      )
    },
    {
      key: "kycVerified", label: "KYC Verified", render: (v, row, Badge) => (
        <Badge tone={v === 'Yes' ? 'green' : 'amber'}>{v}</Badge>
      )
    },
    { key: "createdAt", label: "Created", render: (v) => fmtDate(v) },
    { key: "lastLoginAt", label: "Last Login", render: (v) => fmtDate(v) },
    {
      key: "actions", label: "Actions", sortable: false, render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => navigate(`/admin/users/${row.id}`)}
              className="h-8 w-8 grid place-items-center rounded-md border border-violet-200 text-violet-700 hover:bg-violet-50"
              title="View Details"
            >
              <Eye size={16} />
            </button>
            <span className="text-xs text-gray-500">View</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setEditing(row)}
              className="h-8 w-8 grid place-items-center rounded-md border border-violet-200 text-violet-700 hover:bg-violet-50"
              title="Edit"
            >
              <Pencil size={16} />
            </button>
            <span className="text-xs text-gray-500">Edit</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setConfirmBan({ row, next: row.status === 'banned' ? 'active' : 'banned' })}
              className="h-8 w-8 grid place-items-center rounded-md border border-violet-200 text-violet-700 hover:bg-violet-50"
              title={row.status === 'banned' ? 'Unlock User' : 'Lock User'}
            >
              {row.status === 'banned' ? <Unlock size={16} /> : <Lock size={16} />}
            </button>
            <span className="text-xs text-gray-500">{row.status === 'banned' ? 'Unlock' : 'Lock'}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => {
                const nextStatus = row.status === 'inactive' ? 'active' : 'inactive';
                setConfirmBan({ row, next: nextStatus });
              }}
              className="h-8 w-8 grid place-items-center rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50"
              title={row.status === 'inactive' ? 'Activate User' : 'Deactivate User'}
            >
              {row.status === 'inactive' ? <CheckCircle size={16} /> : <XCircle size={16} />}
            </button>
            <span className="text-xs text-gray-500">{row.status === 'inactive' ? 'Activate' : 'Deactivate'}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setConfirmVerify({ row, next: row.emailVerified !== 'Yes' })}
              className="h-8 w-8 grid place-items-center rounded-md border border-violet-200 text-violet-700 hover:bg-violet-50"
              title={row.emailVerified === 'Yes' ? 'Unverify Email' : 'Verify Email'}
            >
              {row.emailVerified === 'Yes' ? <MailX size={16} /> : <MailCheck size={16} />}
            </button>
            <span className="text-xs text-gray-500">{row.emailVerified === 'Yes' ? 'Unverify' : 'Verify'}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => {
                setConfirmDel(row);
                fetchUserFunds(row.id);
              }}
              className="h-8 w-8 grid place-items-center rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
            <span className="text-xs text-gray-500">Delete</span>
          </div>
        </div>
      )
    },
  ], []);

  const filters = useMemo(() => ({
    searchKeys: ["name", "email", "phone", "country", "status"],
    dateKey: "createdAt",
  }), []);

  async function onToggleVerify(row) {
    try {
      const next = row.emailVerified !== 'Yes';
      const token = localStorage.getItem('adminToken');
      const r = await fetch(`${BASE}/admin/users/${row.id}/email-verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ verified: next })
      });
      const data = await r.json();
      if (!data?.ok) throw new Error(data?.error || 'Failed');
      setRows(list => list.map(it => it.id === row.id ? { ...it, emailVerified: next ? 'Yes' : 'No' } : it));
      setConfirmVerify(null);

      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Email ${next ? 'verified' : 'unverified'} successfully`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: e.message || String(e)
      });
    }
  }

  async function fetchUserFunds(userId) {
    setLoadingFunds(true);
    try {
      const token = localStorage.getItem('adminToken');
      const r = await fetch(`${BASE}/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await r.json();
      if (data?.ok && data?.user) {
        const walletBalance = parseFloat(data.user.walletBalance || 0);
        const mt5Accounts = (data.user.MT5Account || []).map(acc => ({
          accountId: acc.accountId,
          group: acc.group,
          balance: parseFloat(acc.balance || 0),
          equity: parseFloat(acc.equity || 0),
          credit: parseFloat(acc.credit || 0),
          total: parseFloat(acc.balance || 0) + parseFloat(acc.equity || 0) + parseFloat(acc.credit || 0)
        }));

        const totalMt5Funds = mt5Accounts.reduce((sum, acc) => sum + acc.total, 0);
        const totalFunds = walletBalance + totalMt5Funds;

        setUserFunds({
          walletBalance,
          mt5Accounts,
          totalMt5Funds,
          totalFunds
        });
      } else {
        setUserFunds(null);
      }
    } catch (e) {
      console.error('Failed to fetch user funds:', e);
      setUserFunds(null);
    } finally {
      setLoadingFunds(false);
    }
  }

  async function onDelete(row) {
    if (deleting) return; // Prevent double clicks
    setDeleting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const r = await fetch(`${BASE}/admin/users/${row.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Check if response is ok
      if (!r.ok) {
        const errorData = await r.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${r.status} ${r.statusText}`);
      }

      const data = await r.json();
      if (!data?.ok) throw new Error(data?.error || 'Delete failed');

      setRows(list => list.filter(it => it.id !== row.id));
      setConfirmDel(null);

      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: data.message || 'User deleted successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (e) {
      console.error('Delete user error:', e);

      // Show error message with more details
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed!',
        text: e.message || 'Failed to delete user. Please try again.',
        confirmButtonText: 'OK'
      });
    } finally {
      setDeleting(false);
      // Only close modal if successful (already closed on success)
      if (!deleting) {
        // If error occurred, keep modal open so user can retry
      }
    }
  }

  async function onEditSubmit(state) {
    try {
      const token = localStorage.getItem('adminToken');
      const r = await fetch(`${BASE}/admin/users/${state.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: state.name, phone: state.phone, country: state.country, status: state.status })
      });
      const data = await r.json();
      if (!data?.ok) throw new Error(data?.error || 'Failed');
      setRows(list => list.map(it => it.id === state.id ? { ...it, name: state.name, phone: state.phone, country: state.country, status: state.status } : it));

      // Update KYC verification status based on checkbox
      const wasKycApproved = editing.KYC?.verificationStatus && String(editing.KYC.verificationStatus).toLowerCase() === 'approved';
      if (state.kycVerified !== wasKycApproved) {
        try {
          const kycRes = await fetch(`${BASE}/admin/users/${state.id}/kyc-verify`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ verified: state.kycVerified })
          });
          const kycData = await kycRes.json();
          if (kycData?.ok) {
            // Update the row's KYC status in the list
            setRows(list => list.map(it => {
              if (it.id === state.id) {
                return {
                  ...it,
                  KYC: {
                    verificationStatus: state.kycVerified ? 'approved' : 'pending',
                    isDocumentVerified: state.kycVerified,
                    isAddressVerified: state.kycVerified
                  },
                  kycVerified: state.kycVerified ? 'Yes' : 'No'
                };
              }
              return it;
            }));
          }
        } catch (kycErr) {
          console.error('KYC update error:', kycErr);
          // Don't fail the whole update if KYC update fails
        }
      }
      setEditing(null);

      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'User updated successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: e.message || String(e)
      });
    }
  }

  async function onToggleBan(row, nextStatus) {
    try {
      const next = nextStatus || (row.status === 'banned' ? 'active' : 'banned');
      const token = localStorage.getItem('adminToken');
      const r = await fetch(`${BASE}/admin/users/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: next })
      });
      const data = await r.json();
      if (!data?.ok) throw new Error(data?.error || 'Failed');
      setRows(list => {
        const updated = list.map(it => it.id === row.id ? { ...it, status: next } : it);
        // If this page is filtered by status and the row no longer matches, drop it
        if (queryParams && queryParams.status) {
          return updated.filter(u => String(u.status) === String(queryParams.status));
        }
        return updated;
      });
      setConfirmBan(null);

      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `User ${next === 'banned' ? 'locked' : 'unlocked'} successfully`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: e.message || String(e)
      });
    }
  }

  if (loading) return <div className="rounded-xl bg-white border border-gray-200 p-4">Loading users…</div>;
  if (error) return <div className="rounded-xl bg-white border border-rose-200 text-rose-700 p-4">{error}</div>;

  return (
    <>
      <ProTable
        title={initialTitle}
        rows={rows}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search name / email / phone / country / status…"
        pageSize={10}
      />

      {/* Edit Modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit User">
        {editing && (
          <UserEditForm
            user={editing}
            onCancel={() => setEditing(null)}
            onSubmit={onEditSubmit}
          />
        )}
      </Modal>

      {/* Verify Confirm */}
      <Modal open={!!confirmVerify} onClose={() => setConfirmVerify(null)} title="Confirm Email Verification">
        {confirmVerify && (
          <div className="space-y-4">
            <p>Do you want to {confirmVerify.next ? 'verify' : 'unverify'} email for <b>{confirmVerify.row.email}</b>?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmVerify(null)} className="px-4 h-10 rounded-md border">Cancel</button>
              <button onClick={() => onToggleVerify(confirmVerify.row)} className="px-4 h-10 rounded-md bg-violet-600 text-white">Confirm</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Lock/Unlock Confirm */}
      <Modal open={!!confirmBan} onClose={() => setConfirmBan(null)} title={
        confirmBan?.next === 'banned' ? 'Lock User' :
          confirmBan?.next === 'inactive' ? 'Deactivate User' :
            confirmBan?.next === 'active' ? (confirmBan?.row?.status === 'inactive' ? 'Activate User' : 'Unlock User') :
              'Update User Status'
      }>
        {confirmBan && (
          <div className="space-y-4">
            <p>
              Do you want to {
                confirmBan.next === 'banned' ? 'lock' :
                  confirmBan.next === 'inactive' ? 'deactivate' :
                    confirmBan.next === 'active' ? (confirmBan.row.status === 'inactive' ? 'activate' : 'unlock') :
                      'update status for'
              } user <b>{confirmBan.row.email}</b>?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmBan(null)} className="px-4 h-10 rounded-md border">Cancel</button>
              <button onClick={() => onToggleBan(confirmBan.row, confirmBan.next)} className={`px-4 h-10 rounded-md ${confirmBan.next === 'banned' ? 'bg-rose-600' :
                  confirmBan.next === 'inactive' ? 'bg-gray-600' :
                    'bg-emerald-600'
                } text-white`}>
                {confirmBan.next === 'banned' ? 'Lock' :
                  confirmBan.next === 'inactive' ? 'Deactivate' :
                    confirmBan.next === 'active' ? (confirmBan.row.status === 'inactive' ? 'Activate' : 'Unlock') :
                      'Update'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!confirmDel} onClose={() => {
        if (!deleting) {
          setConfirmDel(null);
          setUserFunds(null);
        }
      }} title="Delete User">
        {confirmDel && (
          <div className="space-y-4">
            <p>Are you sure you want to delete <b>{confirmDel.email}</b>?</p>
            <p className="text-sm text-gray-600">This will delete all related records including deposits, withdrawals, MT5 accounts, KYC, and other data.</p>

            {/* Funds Information */}
            {loadingFunds ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <svg className="animate-spin h-5 w-5 text-gray-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                <p className="text-xs text-gray-500 mt-2">Loading funds information...</p>
              </div>
            ) : userFunds ? (
              <div className="space-y-3">
                {/* Wallet Balance */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-blue-800">Wallet Balance:</span>
                    <span className="text-sm font-bold text-blue-900">${userFunds.walletBalance.toFixed(2)}</span>
                  </div>
                </div>

                {/* MT5 Accounts */}
                {userFunds.mt5Accounts.length > 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-gray-800 mb-2">MT5 Trading Accounts:</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {userFunds.mt5Accounts.map((acc, idx) => (
                        <div key={idx} className="bg-white rounded p-2 border border-gray-200">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-medium text-gray-700">Account: {acc.accountId || 'N/A'}</span>
                            <span className="text-xs text-gray-500">{acc.group || 'N/A'}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">Balance:</span>
                              <span className="ml-1 font-medium">${acc.balance.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Equity:</span>
                              <span className="ml-1 font-medium">${acc.equity.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Credit:</span>
                              <span className="ml-1 font-medium">${acc.credit.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="mt-1 pt-1 border-t border-gray-200">
                            <span className="text-xs text-gray-500">Total: </span>
                            <span className="text-xs font-bold text-gray-900">${acc.total.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-800">Total MT5 Funds:</span>
                        <span className="text-sm font-bold text-gray-900">${userFunds.totalMt5Funds.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600">No MT5 trading accounts</p>
                  </div>
                )}

                {/* Total Funds */}
                <div className={`border rounded-lg p-3 ${userFunds.totalFunds > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-semibold ${userFunds.totalFunds > 0 ? 'text-red-800' : 'text-green-800'}`}>
                      Total Funds:
                    </span>
                    <span className={`text-lg font-bold ${userFunds.totalFunds > 0 ? 'text-red-900' : 'text-green-900'}`}>
                      ${userFunds.totalFunds.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Warning if funds exist */}
                {userFunds.totalFunds > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Cannot Delete:</p>
                    <p className="text-xs text-amber-700">This user has funds. Please ensure all funds are withdrawn before deleting.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-600">Unable to load funds information</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setConfirmDel(null);
                  setUserFunds(null);
                }}
                disabled={deleting}
                className="px-4 h-10 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => onDelete(confirmDel)}
                disabled={deleting || (userFunds && userFunds.totalFunds > 0)}
                className={`px-4 h-10 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${(userFunds && userFunds.totalFunds > 0)
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-rose-600 text-white'
                  }`}
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function UserEditForm({ user, onCancel, onSubmit }) {
  // Initialize KYC verified based on user's current KYC status
  const isKycApproved = user.KYC?.verificationStatus && String(user.KYC.verificationStatus).toLowerCase() === 'approved';

  const [state, setState] = useState({
    id: user.id,
    name: user.name || "",
    phone: user.phone || "",
    country: user.country || "",
    status: user.status || "active",
    kycVerified: isKycApproved,
  });
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(state); }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-600">Name</label>
          <input value={state.name} onChange={e => setState({ ...state, name: e.target.value })}
            className="mt-1 w-full rounded-md border border-gray-300 h-10 px-3" />
        </div>
        <div>
          <label className="text-xs text-gray-600">Email</label>
          <input value={user.email || ""} disabled className="mt-1 w-full rounded-md border border-gray-200 bg-gray-50 h-10 px-3" />
        </div>
        <div>
          <label className="text-xs text-gray-600">Phone</label>
          <input value={state.phone} onChange={e => setState({ ...state, phone: e.target.value })}
            className="mt-1 w-full rounded-md border border-gray-300 h-10 px-3" />
        </div>
        <div>
          <label className="text-xs text-gray-600">Country</label>
          <input value={state.country} onChange={e => setState({ ...state, country: e.target.value })}
            className="mt-1 w-full rounded-md border border-gray-300 h-10 px-3" />
        </div>
        <div>
          <label className="text-xs text-gray-600">Status</label>
          <select value={state.status} onChange={e => setState({ ...state, status: e.target.value })}
            className="mt-1 w-full rounded-md border border-gray-300 h-10 px-3">
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="banned">banned</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-gray-600">KYC Verification</label>
          <div className="mt-1 flex items-center gap-2">
            <input type="checkbox" id={`kyc-${user.id}`} checked={state.kycVerified} onChange={e => setState({ ...state, kycVerified: e.target.checked })} />
            <label htmlFor={`kyc-${user.id}`} className="text-sm">Mark KYC as verified</label>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 h-10 rounded-md border">Cancel</button>
        <button type="submit" className="px-4 h-10 rounded-md bg-violet-600 text-white">Save Changes</button>
      </div>
    </form>
  );
}
