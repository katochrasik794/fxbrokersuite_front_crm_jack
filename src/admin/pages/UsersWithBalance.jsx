// src/pages/admin/UsersWithBalance.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import ProTable from "../components/ProTable.jsx";
import Modal from "../components/Modal.jsx";
import { Eye, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export default function UsersWithBalance() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewModal, setViewModal] = useState(null);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState("");
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [expandedAccountId, setExpandedAccountId] = useState(null); // mobile accordion
  const [actionModal, setActionModal] = useState(null); // { type:'deposit'|'withdraw', accountId, amount:'', comment:'' }
  const [loadingId, setLoadingId] = useState(null); // Track which row is loading

  const BASE = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    let stop = false;
    setLoading(true);
    setError("");
    const token = localStorage.getItem('adminToken');

    fetch(`${BASE}/admin/users/with-balance?limit=500`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (stop) return;
        if (!data?.ok) throw new Error(data?.error || "Failed to load");
        const items = Array.isArray(data.items) ? data.items : [];
        // Filter users to only show those with balance > $1
        const filteredItems = items.filter(u => (u.totalBalance || 0) > 1);
        console.log(`📊 Users with Balance Filter: ${items.length} total users, ${filteredItems.length} users with balance > $1`);
        setRows(filteredItems.map(u => ({
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
  }, [BASE]);

  const handleView = useCallback(async (row) => {
    // If no accounts, show info
    if (!row.MT5Account || row.MT5Account.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No Accounts",
        text: "No MT5 accounts found for this user",
        confirmButtonText: "OK",
      });
      return;
    }

    setLoadingId(row.id);
    try {
      setAccountsLoading(true);
      setAccountsError("");
      setLoadingProgress({ current: 0, total: row.MT5Account.length });

      const token = localStorage.getItem("adminToken");
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
          tradingServer: account.tradingServer || "-",
        };

        try {
          const resp = await fetch(`${BASE}/admin/mt5/proxy/${accData.accountId}/getClientBalance`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const json = await resp.json();
          if (json?.success && json?.data) {
            const data = json.data.Data || json.data; // handle wrapped payloads
            // Map MT5 fields if present
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
              currency: data.Currency ?? accData.currency,
            };
          }
        } catch (e) {
          // keep fallback data; optionally log
          console.error("MT5 balance fetch failed", e);
        }

        accounts.push(accData);
      }

      setViewModal({ user: row, accounts });
      setAccountsLoading(false);
      setLoadingProgress({ current: 0, total: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
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
            disabled={loadingId === row.id}
            className="h-8 w-8 grid place-items-center rounded-md border border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="View MT5 Accounts"
          >
            {loadingId === row.id ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Eye size={16} />
            )}
          </button>
        </div>
      )
    },
  ], [handleView, loadingId]);

  const filters = useMemo(() => ({
    searchKeys: ["name", "email", "phone", "country"],
    dateKey: 'createdAt',
  }), []);

  if (loading) return <div className="rounded-xl bg-white border border-gray-200 p-4">Loading users…</div>;
  if (error) return <div className="rounded-xl bg-white border border-rose-200 text-rose-700 p-4">{error}</div>;

  return (
    <>
      <ProTable
        title="Users with MT5 Balance (>$1)"
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
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">

                  {/* Real Accounts Section */}
                  {viewModal.accounts.some(a => !a.isDemo && !String(a.group || '').toLowerCase().includes('demo')) && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Real Accounts</h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                          {viewModal.accounts.filter(a => !a.isDemo && !String(a.group || '').toLowerCase().includes('demo')).length}
                        </span>
                      </div>

                      {viewModal.accounts.filter(a => !a.isDemo && !String(a.group || '').toLowerCase().includes('demo')).map((account) => {
                        const isOpen = expandedAccountId === account.accountId;
                        return (
                          <div
                            key={account.accountId}
                            className="border rounded-lg bg-white shadow-sm border-l-4 border-l-emerald-500 transition-shadow duration-200"
                          >
                            <button
                              type="button"
                              className="w-full flex items-center justify-between px-4 py-3 transition-colors duration-200 hover:bg-gray-50"
                              onClick={() =>
                                setExpandedAccountId(isOpen ? null : account.accountId)
                              }
                            >
                              <div className="flex items-center gap-3">
                                <div className="text-sm font-medium">
                                  MT5 ID: <span className="font-mono text-gray-900 font-bold">{account.accountId}</span>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-medium border border-gray-200">
                                  {account.currency}
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="text-xs text-gray-500">Balance</div>
                                  <div className="text-sm font-bold text-gray-900">${account.balance.toFixed(2)}</div>
                                </div>
                                <span
                                  className={`text-sm text-gray-500 transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''
                                    }`}
                                >
                                  +
                                </span>
                              </div>
                            </button>
                            {isOpen && (
                              <div className="px-4 pb-3 text-xs space-y-2 border-t border-gray-100 pt-3">
                                <div className="grid grid-cols-2 gap-y-2 bg-gray-50 p-3 rounded-md">
                                  <span className="text-gray-500">Account Name</span>
                                  <span className="text-right font-medium text-gray-900">{account.name}</span>
                                  <span className="text-gray-500">Group</span>
                                  <span className="text-right font-medium">{account.group}</span>
                                  <span className="text-gray-500">Equity</span>
                                  <span className="text-right font-mono font-medium">${account.equity.toFixed(2)}</span>
                                  <span className="text-gray-500">Leverage</span>
                                  <span className="text-right">1:{account.leverage}</span>
                                  <span className="text-gray-500">Margin Level</span>
                                  <span className={`text-right font-mono font-medium ${parseFloat(account.marginLevel) < 100 ? 'text-red-600' : 'text-green-600'}`}>
                                    {account.marginLevel}%
                                  </span>
                                  <span className="text-gray-500">Profit</span>
                                  <span className={`text-right font-mono font-bold ${account.profit > 0 ? 'text-green-600' : account.profit < 0 ? 'text-red-600' : ''
                                    }`}>
                                    ${account.profit.toFixed(2)}
                                  </span>
                                </div>
                                <div className="pt-2 flex gap-2">
                                  <button
                                    onClick={() => setActionModal({ type: 'deposit', accountId: account.accountId, amount: '', comment: 'Admin deposit' })}
                                    className="flex-1 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                                  >
                                    Deposit
                                  </button>
                                  <button
                                    onClick={() => setActionModal({ type: 'withdraw', accountId: account.accountId, amount: '', comment: 'Admin withdrawal' })}
                                    className="flex-1 py-2.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors"
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
                  )}

                  {/* Demo Accounts Section */}
                  {viewModal.accounts.some(a => a.isDemo || String(a.group || '').toLowerCase().includes('demo')) && (
                    <div className="space-y-2 mt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Demo Accounts</h3>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                          DEMO
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px]">
                          {viewModal.accounts.filter(a => a.isDemo || String(a.group || '').toLowerCase().includes('demo')).length}
                        </span>
                      </div>

                      {viewModal.accounts.filter(a => a.isDemo || String(a.group || '').toLowerCase().includes('demo')).map((account) => {
                        const isOpen = expandedAccountId === account.accountId;
                        return (
                          <div
                            key={account.accountId}
                            className="border rounded-md bg-gray-50/50 shadow-sm border-l-4 border-l-amber-400 transition-colors hover:bg-gray-50"
                          >
                            <button
                              type="button"
                              className="w-full flex items-center justify-between px-3 py-2"
                              onClick={() =>
                                setExpandedAccountId(isOpen ? null : account.accountId)
                              }
                            >
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded border border-amber-200 uppercase">DEMO</span>
                                <div className="text-xs font-medium text-gray-700">
                                  ID: <span className="font-mono">{account.accountId}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="text-xs font-mono font-medium text-gray-900">${account.balance.toFixed(0)}</span>
                                </div>
                                <span
                                  className={`text-xs text-gray-400 transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''
                                    }`}
                                >
                                  +
                                </span>
                              </div>
                            </button>
                            {isOpen && (
                              <div className="px-3 pb-3 text-xs border-t border-gray-100 pt-2">
                                <div className="grid grid-cols-2 gap-y-1 text-gray-600 mb-2">
                                  <span>Group:</span> <span className="text-right">{account.group}</span>
                                  <span>Equity:</span> <span className="text-right">${account.equity.toFixed(2)}</span>
                                  <span>Leverage:</span> <span className="text-right">1:{account.leverage}</span>
                                </div>
                                <div className="flex gap-2 opacity-75">
                                  <button
                                    onClick={() => setActionModal({ type: 'deposit', accountId: account.accountId, amount: '', comment: 'Admin deposit' })}
                                    className="flex-1 py-1.5 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-medium"
                                  >
                                    Add Funds
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
            {viewModal.accounts.length === 0 && (
              <div className="text-center py-8">
                <div className="text-lg font-medium text-gray-700">No Accounts Found</div>
                <div className="text-sm text-gray-500 mt-2">This user has no MT5 accounts.</div>
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