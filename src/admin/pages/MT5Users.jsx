// src/pages/admin/MT5Users.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import ProTable from "../components/ProTable.jsx";
import Modal from "../components/Modal.jsx";
import { Eye } from "lucide-react";
import Swal from "sweetalert2";

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}


export default function MT5Users() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewModal, setViewModal] = useState(null);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState("");
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [expandedAccountId, setExpandedAccountId] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { type, accountId, amount, comment }

  const BASE = import.meta.env.VITE_BACKEND_API_URL || "https://fxbrokersuite-back-crm-jack.onrender.com/api";
  const { admin } = useAuth();
  const [countryScope, setCountryScope] = useState("");
  const [scopeResolved, setScopeResolved] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const email = admin?.email;
    if (!email) { setScopeResolved(true); return; }
    let cancelled = false;
    fetch(`${BASE}/admin/country-admins`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(list => {
        if (cancelled) return;
        const match = Array.isArray(list) ? list.find(ca => (ca.email || '').toLowerCase() === String(email).toLowerCase()) : null;
        if (match?.country) setCountryScope(String(match.country).toLowerCase());
        setScopeResolved(true);
      })
      .catch(() => { setScopeResolved(true); });
    return () => { cancelled = true; };
  }, [BASE, admin?.email]);

  useEffect(() => {
    if (!scopeResolved) return;
    let stop = false;
    setLoading(true);
    setError("");
    const token = localStorage.getItem('adminToken');
    const scope = countryScope ? `&country=${encodeURIComponent(countryScope)}` : '';
    fetch(`${BASE}/admin/mt5/users?limit=500${scope}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (stop) return;
        if (!data?.ok) throw new Error(data?.error || "Failed to load");
        const items = Array.isArray(data.items) ? data.items : [];
        setRows(items.map(u => ({
          id: u.id,
          name: u.name || "-",
          email: u.email,
          phone: u.phone || "-",
          country: u.country || "-",
          totalBalance: u.totalBalance || 0,
          createdAt: u.createdAt,
          MT5Account: u.MT5Account || [],
        })));
      })
      .catch(e => setError(e.message || String(e)))
      .finally(() => !stop && setLoading(false));
    return () => { stop = true; };
  }, [BASE, scopeResolved, countryScope]);

  const handleView = useCallback(async (row) => {
    // Check if user has MT5 accounts
    if (!row.MT5Account || row.MT5Account.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Accounts',
        text: 'No MT5 accounts found for this user',
        confirmButtonText: 'OK'
      });
      return;
    }

    setAccountsLoading(true);
    setAccountsError("");
    setLoadingProgress({ current: 0, total: row.MT5Account.length });

    const token = localStorage.getItem('adminToken');
    const accounts = [];

    for (let i = 0; i < row.MT5Account.length; i++) {
      const account = row.MT5Account[i];
      setLoadingProgress({ current: i + 1, total: row.MT5Account.length });

      // Start with DB values as fallback
      let accData = {
        accountId: account.accountId || account.accountNumber,
        name: row.name || "-",
        group: account.group || "-",
        balance: account.balance || 0,
        equity: account.equity || account.balance || 0,
        leverage: account.leverage || 2000,
        credit: account.credit || 0,
        margin: account.margin || 0,
        marginFree: account.freeMargin || 0,
        marginLevel:
          account.equity && account.margin && account.margin > 0
            ? ((account.equity / account.margin) * 100).toFixed(2)
            : 0,
        profit: (account.equity || 0) - (account.balance || 0) - (account.credit || 0),
        currency: account.currency || "USD",
        isDemo: account.isDemo || false,
        tradingServer: account.tradingServer || "-"
      };

      try {
        const resp = await fetch(
          `${BASE}/admin/mt5/proxy/${accData.accountId}/getClientBalance`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await resp.json();
        if (json?.success && json?.data) {
          const data = json.data.Data || json.data;
          accData = {
            ...accData,
            balance: data.Balance ?? accData.balance,
            equity: data.Equity ?? accData.equity,
            credit: data.Credit ?? accData.credit,
            margin: data.Margin ?? accData.margin,
            marginFree: data.MarginFree ?? accData.marginFree,
            marginLevel: data.MarginLevel ?? accData.marginLevel ?? 0,
            profit: data.Profit ?? accData.profit ?? 0,
            leverage: data.Leverage ?? accData.leverage,
            currency: data.Currency ?? accData.currency
          };
        }
      } catch (e) {
        console.error('MT5 balance fetch failed', e);
      }

      accounts.push(accData);
    }

    setViewModal({ user: row, accounts });
    setAccountsLoading(false);
    setLoadingProgress({ current: 0, total: 0 });
  }, [BASE]);

  const columns = useMemo(() => [
    { key: "__index", label: "Sr No", sortable: false },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "totalBalance", label: "Total Balance", render: (v) => `$${v.toFixed(2)}` },
    { key: "country", label: "Country" },
    { key: "createdAt", label: "Joined", render: (v) => fmtDate(v) },
    {
      key: "actions", label: "Action", sortable: false, render: (v, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleView(row)}
            className="h-8 w-8 grid place-items-center rounded-md border border-violet-200 text-violet-700 hover:bg-violet-50"
            title="View MT5 Accounts"
          >
            <Eye size={16} />
          </button>
        </div>
      )
    },
  ], [handleView]);

  const filters = useMemo(() => ({
    searchKeys: ["name", "email", "phone", "country"],
    dateKey: "createdAt",
  }), []);

  if (loading) return <div className="rounded-xl bg-white border border-gray-200 p-4">Loading users…</div>;
  if (error) return <div className="rounded-xl bg-white border border-rose-200 text-rose-700 p-4">{error}</div>;

  return (
    <>
      <ProTable
        title="MT5 Users"
        rows={rows}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search name / email / phone / country…"
        pageSize={10}
      />

      {/* View Modal */}
      <Modal open={!!viewModal} onClose={() => setViewModal(null)} title={`MT5 Accounts for ${viewModal?.user?.name || 'User'}`}>
        {viewModal && (
          <div className="space-y-4 w-full max-w-5xl mx-auto px-2 sm:px-4">
            {accountsLoading && (
              <div className="text-center py-8">
                <div className="text-lg font-medium text-gray-700">Loading MT5 account details...</div>
                <div className="text-sm text-gray-500 mt-2">
                  Fetching balances from MT5 (account {loadingProgress.current} of {loadingProgress.total})
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width:
                          loadingProgress.total > 0
                            ? `${(loadingProgress.current / loadingProgress.total) * 100}%`
                            : "0%",
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            {accountsError && (
              <div className="text-center py-8">
                <div className="text-lg font-medium text-red-700">Error Loading Accounts</div>
                <div className="text-sm text-red-600 mt-2">{accountsError}</div>
              </div>
            )}
            {!accountsLoading && !accountsError && viewModal.accounts.length > 0 && (
              <>
                {/* Accordion view on all screen sizes */}
                <div className="space-y-3 max-h-[420px] overflow-y-auto">
                  {viewModal.accounts.map((account) => {
                    const isOpen = expandedAccountId === account.accountId;
                    return (
                      <div
                        key={account.accountId}
                        className="border rounded-lg bg-white shadow-sm transition-shadow duration-200"
                      >
                        <button
                          type="button"
                          className="w-full flex items-center justify-between px-4 py-3 transition-colors duration-200 hover:bg-gray-50"
                          onClick={() =>
                            setExpandedAccountId(isOpen ? null : account.accountId)
                          }
                        >
                          <div className="text-sm font-medium">
                            MT5 ID: <span className="font-mono">{account.accountId}</span>
                          </div>
                          <span
                            className={`text-sm text-gray-500 transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''
                              }`}
                          >
                            +
                          </span>
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-3 text-xs space-y-2 transition-opacity duration-200">
                            <div className="grid grid-cols-2 gap-y-1">
                              <span className="text-gray-500">Account Name</span>
                              <span className="text-right font-medium">{account.name}</span>
                              <span className="text-gray-500">Group</span>
                              <span className="text-right">{account.group}</span>
                              <span className="text-gray-500">Balance</span>
                              <span className="text-right font-mono">${account.balance.toFixed(2)}</span>
                              <span className="text-gray-500">Equity</span>
                              <span className="text-right font-mono">${account.equity.toFixed(2)}</span>
                              <span className="text-gray-500">Leverage</span>
                              <span className="text-right">{account.leverage}</span>
                              <span className="text-gray-500">Credit</span>
                              <span className="text-right font-mono">${account.credit.toFixed(2)}</span>
                              <span className="text-gray-500">Margin</span>
                              <span className="text-right font-mono">${account.margin.toFixed(2)}</span>
                              <span className="text-gray-500">Margin Free</span>
                              <span className="text-right font-mono">${account.marginFree.toFixed(2)}</span>
                              <span className="text-gray-500">Margin Level</span>
                              <span className="text-right font-mono">{account.marginLevel.toFixed(2)}%</span>
                              <span className="text-gray-500">Profit</span>
                              <span className={`text-right font-mono ${account.profit > 0 ? 'text-green-600' : account.profit < 0 ? 'text-red-600' : ''
                                }`}>
                                ${account.profit.toFixed(2)}
                              </span>
                              <span className="text-gray-500">Currency</span>
                              <span className="text-right">{account.currency}</span>
                            </div>
                            <div className="pt-2 flex gap-2">
                              <button
                                onClick={() => setActionModal({ type: 'deposit', accountId: account.accountId, amount: '', comment: 'Admin deposit' })}
                                className="flex-1 py-2 rounded-md bg-emerald-600 text-white text-xs font-medium"
                              >
                                Deposit
                              </button>
                              <button
                                onClick={() => setActionModal({ type: 'withdraw', accountId: account.accountId, amount: '', comment: 'Admin withdrawal' })}
                                className="flex-1 py-2 rounded-md bg-rose-600 text-white text-xs font-medium"
                              >
                                Withdraw
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {viewModal.accounts.length === 0 && (
              <div className="text-center py-8">
                <div className="text-lg font-medium text-gray-700">No Accounts Found</div>
                <div className="text-sm text-gray-500 mt-2">
                  This user has no MT5 accounts.
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setViewModal(null)} className="px-4 h-10 rounded-md border">Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Deposit/Withdraw Modal */}
      <Modal open={!!actionModal} onClose={() => setActionModal(null)} title={actionModal ? (actionModal.type === 'deposit' ? 'Add Balance' : 'Deduct Balance') : ''}>
        {actionModal && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
              <input type="number" min="0" step="0.01" value={actionModal.amount}
                onChange={e => setActionModal({ ...actionModal, amount: e.target.value })}
                className="w-full rounded-md border border-gray-300 h-10 px-3 focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
              <input type="text" value={actionModal.comment}
                onChange={e => setActionModal({ ...actionModal, comment: e.target.value })}
                className="w-full rounded-md border border-gray-300 h-10 px-3 focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setActionModal(null)} className="px-4 h-10 rounded-md border">Cancel</button>
              <button onClick={async () => {
                const amt = Number(actionModal.amount);
                if (!amt || amt <= 0) { Swal.fire({ icon: 'error', title: 'Enter amount' }); return; }
                try {
                  const token = localStorage.getItem('adminToken');
                  const url = actionModal.type === 'deposit' ? `${BASE}/admin/mt5/deposit` : `${BASE}/admin/mt5/withdraw`;
                  const payload = { mt5_login: actionModal.accountId, amount: amt, comment: actionModal.comment };
                  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
                  const j = await r.json();
                  if (!j?.success) throw new Error(j?.message || j?.error || 'Failed');
                  setActionModal(null);
                  Swal.fire({ icon: 'success', title: actionModal.type === 'deposit' ? 'Deposit successful' : 'Withdrawal successful', timer: 1500, showConfirmButton: false });
                } catch (e) {
                  Swal.fire({ icon: 'error', title: actionModal.type === 'deposit' ? 'Deposit failed' : 'Withdrawal failed', text: e.message || String(e) });
                }
              }} className={`px-4 h-10 rounded-md text-white ${actionModal.type === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                {actionModal.type === 'deposit' ? 'Deposit' : 'Withdraw'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}