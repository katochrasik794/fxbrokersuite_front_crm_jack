import { useEffect, useMemo, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import Toast from "../../components/Toast.jsx";
import ProTable from "../components/ProTable.jsx";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_API_URL || "https://fxbrokersuite-back-crm-jack.onrender.com/api";

function SearchableSelect({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.id === value) || null;
  const filtered = options.filter((opt) => {
    if (!query) return true;
    const q = query.toLowerCase();
    const haystack = opt.searchText || opt.label || "";
    return String(haystack).toLowerCase().includes(q);
  });

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-12 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-gray-900 text-sm flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
      >
        <span className={selected ? "" : "text-gray-400"}>
          {selected ? selected.label : placeholder || "Choose an account"}
        </span>
        <svg
          className="w-4 h-4 text-gray-400 ml-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-2xl bg-white shadow-lg border border-gray-200">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by MT5 ID, email…"
              className="w-full h-9 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-lime-400"
            />
          </div>
          <div className="max-h-64 overflow-y-auto text-sm">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-gray-400">No results</div>
            )}
            {filtered.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                  setQuery("");
                }}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${opt.id === value ? "bg-gray-100 font-medium" : ""
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MT5Transfer() {
  const { admin } = useAuth();

  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");

  const [wallets, setWallets] = useState([]);
  const [mt5Accounts, setMt5Accounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        const headers = { Authorization: `Bearer ${token}` };

        const [walletRes, mt5Res, txRes] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/wallets`, { headers }),
          fetch(`${API_BASE_URL}/admin/mt5/users?limit=1000`, { headers }),
          fetch(`${API_BASE_URL}/admin/mt5/transfers?limit=500`, { headers }),
        ]);

        const walletJson = await walletRes.json();
        if (walletJson?.ok && Array.isArray(walletJson.items)) {
          setWallets(walletJson.items);
        }

        const mt5Json = await mt5Res.json();
        if (mt5Json?.ok && Array.isArray(mt5Json.items)) {
          const allAccounts = mt5Json.items.flatMap((u) =>
            (u.MT5Account || []).map((acc) => ({
              ...acc,
              userEmail: u.email,
              userName: u.name,
            }))
          );
          setMt5Accounts(allAccounts);
        }

        const txJson = await txRes.json();
        if (txJson?.ok && Array.isArray(txJson.items)) {
          setTransactions(txJson.items);
        }
      } catch (e) {
        console.error("Load MT5Transfer failed", e);
        setToast({
          type: "error",
          message: "Failed to load transfer data",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [admin?.id]);

  const allAccounts = useMemo(() => {
    const walletOptions = wallets.map((w) => ({
      id: `wallet:${w.id}`,
      label: `W-${w.id} | ${Number(w.balance || 0).toFixed(2)}${w.currency || "USD"}`,
      type: "wallet",
      raw: w,
    }));

    const mt5Options = mt5Accounts.map((a) => {
      const login = a.accountId || a.account_number;
      const email = a.userEmail || a.email || "";
      const name = a.userName || a.name || "";
      return {
        id: `mt5:${login}`,
        label: `${login} | ${Number(a.balance || 0).toFixed(2)}${a.currency || "USD"
          }${name ? ` | ${name}` : ""}${email ? ` | ${email}` : ""}`,
        searchText: `${login} ${name} ${email}`.toLowerCase(),
        type: "mt5",
        raw: a,
      };
    });

    return [...walletOptions, ...mt5Options];
  }, [wallets, mt5Accounts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fromAccount || !toAccount || !amount) {
      setToast({ type: "error", message: "Select accounts and amount" });
      return;
    }
    if (fromAccount === toAccount) {
      setToast({ type: "error", message: "From and To must be different" });
      return;
    }

    // build default comment if empty
    let finalComment = comment;
    if (!finalComment) {
      const fromId = fromAccount.split(":")[1];
      const toId = toAccount.split(":")[1];
      finalComment = `Deposited to ${toId} / Deposited from ${fromId}`;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("adminToken");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const body = JSON.stringify({
        from: fromAccount,
        to: toAccount,
        amount: Number(amount),
        comment: finalComment,
      });

      const res = await fetch(`${API_BASE_URL}/admin/mt5/transfer`, {
        method: "POST",
        headers,
        body,
      });
      const json = await res.json();

      if (!json?.success) {
        throw new Error(json?.message || "Transfer failed");
      }

      setToast({ type: "success", message: "Transfer completed" });
      setAmount("");
      setFromAccount("");
      setToAccount("");
      setComment("");
    } catch (err) {
      console.error("Admin transfer error", err);
      setToast({
        type: "error",
        message: err.message || "Transfer failed",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white border border-gray-200 p-4">
        Loading transfers…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Move Funds
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                From Account
              </label>
              <SearchableSelect
                options={allAccounts}
                value={fromAccount}
                onChange={setFromAccount}
                placeholder="Choose an account"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                To Account
              </label>
              <SearchableSelect
                options={allAccounts.filter((opt) => opt.id !== fromAccount)}
                value={toAccount}
                onChange={setToAccount}
                placeholder="Choose an account"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Transfer Amount
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-12 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Comment (optional)
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Deposited to 78979 / Deposited from 7904"
              className="w-full h-12 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            />
            <p className="text-xs text-gray-400">
              If left empty, system will auto-set:{" "}
              <span className="font-mono">
                Deposited to [TO] / Deposited from [FROM]
              </span>
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="mx-auto flex items-center justify-center rounded-full bg-gradient-to-r from-yellow-300 to-yellow-400 text-gray-900 font-semibold px-10 h-11 shadow-sm hover:shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Processing..." : "Transfer Funds"}
            </button>
          </div>
        </form>
      </div>

      {transactions.length > 0 && (
        <ProTable
          title="Admin MT5 / Wallet Transfers"
          rows={transactions.map((t, idx) => ({
            id: t.id,
            srNo: idx + 1,
            from: `${t.from_type.toUpperCase()}: ${t.from_ref}`,
            to: `${t.to_type.toUpperCase()}: ${t.to_ref}`,
            amount: Number(t.amount || 0),
            currency: t.currency || "USD",
            comment: t.comment || "-",
            adminEmail: t.admin_email || "-",
            createdAt: t.created_at,
          }))}
          columns={[
            { key: "srNo", label: "Sr No" },
            { key: "adminEmail", label: "Admin Email" },
            { key: "from", label: "From" },
            { key: "to", label: "To" },
            {
              key: "amount",
              label: "Amount",
              render: (v, row) => `$${Number(row.amount).toFixed(2)}`,
            },
            { key: "currency", label: "Currency" },
            { key: "comment", label: "Comment" },
            {
              key: "createdAt",
              label: "Created",
              render: (v, row) =>
                row.createdAt ? new Date(row.createdAt).toLocaleString() : "-",
            },
          ]}
          filters={{
            searchKeys: ["adminEmail", "from", "to", "comment"],
            dateKey: 'createdAt',
          }}
          pageSize={10}
          searchPlaceholder="Search transfers by admin, account or comment…"
        />
      )}

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}


