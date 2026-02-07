// src/pages/admin/UsersView.jsx
import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Users, Wallet, Download, Upload, ShieldCheck, CreditCard, LogIn, Key, CheckCircle, XCircle, Power, PowerOff, Archive, Info } from "lucide-react";
import ProTable from "../components/ProTable.jsx";
import Modal from "../components/Modal.jsx";
import Badge from "../components/Badge.jsx";
import Swal from "sweetalert2";

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
      <span className={`h-10 w-10 grid place-items-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-lg font-semibold tracking-tight">{value}</div>
      </div>
    </div>
  );
}

function fmt(v) { if (!v) return "-"; const d = new Date(v); return isNaN(d) ? "-" : d.toLocaleString(); }

export default function UsersView() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [logins, setLogins] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [actionModal, setActionModal] = useState(null); // { type, accountId, amount, comment }
  const [mt5Map, setMt5Map] = useState({}); // accountId -> {balance, equity}
  const [submitting, setSubmitting] = useState(false);
  const [mt5Tab, setMt5Tab] = useState("real"); // 'real' | 'demo'

  // Reset modal when tab changes
  const handleTabChange = (tab) => {
    setMt5Tab(tab);
    if (createAccountModal) {
      setCreateAccountModal(false);
      setCreateAccountForm({ mt5GroupId: '', leverage: 2000, masterPassword: '' });
    }
  };
  const [createAccountModal, setCreateAccountModal] = useState(false);
  const [mt5Groups, setMt5Groups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [createAccountForm, setCreateAccountForm] = useState({
    mt5GroupId: '',
    leverage: 2000,
    masterPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loggingInAsUser, setLoggingInAsUser] = useState(false);
  const [passwordModal, setPasswordModal] = useState(null); // { accountId, accountNumber }
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [userPasswordModal, setUserPasswordModal] = useState(false);
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [changingUserPassword, setChangingUserPassword] = useState(false);
  const [disabledAccounts, setDisabledAccounts] = useState(new Set()); // Track disabled account IDs
  const [enablingAccount, setEnablingAccount] = useState(null); // Track which account is being enabled
  const [disablingAccount, setDisablingAccount] = useState(null); // Track which account is being disabled
  // Backend base URL (Express server runs on 5000 with /api prefix)
  const BASE = import.meta.env.VITE_BACKEND_API_URL || "https://fxbrokersuite-back-crm-jack.onrender.com/api";



  // Enable/Disable MT5 Account
  async function handleDisableAccount(accountId) {
    try {
      const result = await Swal.fire({
        title: 'Disable MT5 Account?',
        text: `Are you sure you want to disable account ${accountId}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, disable it',
        cancelButtonText: 'Cancel'
      });

      if (!result.isConfirmed) return;

      setDisablingAccount(accountId);
      const token = localStorage.getItem('adminToken');

      // Call backend proxy to disable account (handles MT5 API call)
      try {
        const response = await fetch(`${BASE}/admin/mt5/account/${accountId}/disable`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to disable account');
        }

        // Update database account_status to 'inactive'
        try {
          const updateResponse = await fetch(`${BASE}/admin/mt5/account/${accountId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ account_status: 'inactive' })
          });

          const updateData = await updateResponse.json();
          if (updateResponse.ok && updateData.success) {
            console.log(`✅ Database status updated to 'inactive' for account ${accountId}`);
          } else {
            console.warn('⚠️ Failed to update database status:', updateData);
            // Account is disabled in MT5, but DB update failed - show warning
            await Swal.fire({
              icon: 'warning',
              title: 'Account Disabled',
              text: `MT5 account ${accountId} has been disabled, but database update failed. Please refresh.`,
              timer: 2000,
              showConfirmButton: false
            });
            setTimeout(() => {
              fetchUser();
            }, 500);
            return;
          }
        } catch (dbError) {
          console.error('❌ Error updating database status:', dbError);
          await Swal.fire({
            icon: 'warning',
            title: 'Account Disabled',
            text: `MT5 account ${accountId} has been disabled, but database update failed. Please refresh.`,
            timer: 2000,
            showConfirmButton: false
          });
          setTimeout(() => {
            fetchUser();
          }, 500);
          return;
        }

        setDisabledAccounts(prev => new Set([...prev, accountId]));
        await Swal.fire({
          icon: 'success',
          title: 'Account Disabled',
          text: `MT5 account ${accountId} has been disabled successfully.`,
          timer: 2000,
          showConfirmButton: false
        });
        // Refresh MT5 data
        setTimeout(() => {
          fetchUser();
        }, 500);
      } catch (error) {
        console.error('Error disabling account:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Failed to Disable Account',
          text: error.message || 'Failed to disable account. Please try again.',
        });
      } finally {
        setDisablingAccount(null);
      }
    } catch (error) {
      console.error('Error disabling account:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to disable MT5 account'
      });
    } finally {
      setDisablingAccount(null);
    }
  }

  async function handleEnableAccount(accountId) {
    try {
      const result = await Swal.fire({
        title: 'Enable MT5 Account?',
        text: `Are you sure you want to enable account ${accountId}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, enable it',
        cancelButtonText: 'Cancel'
      });

      if (!result.isConfirmed) return;

      setEnablingAccount(accountId);
      const token = localStorage.getItem('adminToken');

      // Call backend proxy to enable account (handles MT5 API call)
      try {
        const response = await fetch(`${BASE}/admin/mt5/account/${accountId}/enable`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to enable account');
        }

        // Update database account_status to 'active'
        try {
          const updateResponse = await fetch(`${BASE}/admin/mt5/account/${accountId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ account_status: 'active' })
          });

          const updateData = await updateResponse.json();
          if (updateResponse.ok && updateData.success) {
            console.log(`✅ Database status updated to 'active' for account ${accountId}`);
          } else {
            console.warn('⚠️ Failed to update database status:', updateData);
            // Account is enabled in MT5, but DB update failed - show warning
            await Swal.fire({
              icon: 'warning',
              title: 'Account Enabled',
              text: `MT5 account ${accountId} has been enabled, but database update failed. Please refresh.`,
              timer: 2000,
              showConfirmButton: false
            });
            setTimeout(() => {
              fetchUser();
            }, 500);
            return;
          }
        } catch (dbError) {
          console.error('❌ Error updating database status:', dbError);
          await Swal.fire({
            icon: 'warning',
            title: 'Account Enabled',
            text: `MT5 account ${accountId} has been enabled, but database update failed. Please refresh.`,
            timer: 2000,
            showConfirmButton: false
          });
          setTimeout(() => {
            fetchUser();
          }, 500);
          return;
        }

        setDisabledAccounts(prev => {
          const newSet = new Set(prev);
          newSet.delete(accountId);
          return newSet;
        });
        await Swal.fire({
          icon: 'success',
          title: 'Account Enabled',
          text: `MT5 account ${accountId} has been enabled successfully.`,
          timer: 2000,
          showConfirmButton: false
        });
        // Refresh MT5 data and wait a bit for DB to update
        setTimeout(() => {
          fetchUser();
        }, 500);
      } catch (error) {
        console.error('Error enabling account:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Failed to Enable Account',
          text: error.message || 'Failed to enable account. Please try again.',
        });
      } finally {
        setEnablingAccount(null);
      }
    } catch (error) {
      console.error('Error enabling account:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to enable MT5 account'
      });
    } finally {
      setEnablingAccount(null);
    }
  }

  // Bonus actions
  async function handleAddBonus(accountId) {
    try {
      const { value: amountStr } = await Swal.fire({
        title: 'Add Bonus',
        input: 'number',
        inputLabel: 'Amount (USD)',
        inputAttributes: { min: 0, step: 0.01 },
        inputPlaceholder: 'Enter bonus amount',
        showCancelButton: true,
        confirmButtonText: 'Continue',
      });
      if (amountStr === undefined) return; // cancelled
      const amount = Number(amountStr);
      if (!amount || amount <= 0) {
        await Swal.fire({ icon: 'error', title: 'Enter a valid amount' });
        return;
      }

      const { value: comment } = await Swal.fire({
        title: 'Add Comment',
        input: 'text',
        inputLabel: 'Optional',
        inputPlaceholder: 'Reason / note (optional)',
        showCancelButton: true,
        confirmButtonText: 'Submit',
      });
      if (comment === undefined) return; // cancelled

      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${BASE}/admin/mt5/credit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ login: accountId, amount, description: comment || '' })
      });
      let ok = res.ok;
      let msg = 'Bonus added successfully';
      let emailSent = false;
      try {
        const j = await res.json();
        if (j?.Success === false || j?.ok === false) {
          ok = false;
          msg = j?.Message || j?.error || msg;
        } else { emailSent = !!j?.emailSent; }
      } catch { /* ignore non-JSON */ }
      if (!ok) throw new Error(msg);

      // Send bonus email notification
      let bonusEmailSent = false;
      try {
        const emailResponse = await fetch('https://zuperior-crm-api.onrender.com/api/emails/send-deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data?.user?.email,
            account_login: accountId,
            amount: amount.toString(),
            date: new Date().toISOString(),
            name: data?.user?.name || data?.user?.email
          })
        });
        bonusEmailSent = emailResponse.ok;
      } catch (emailError) {
        console.warn('Bonus email notification failed:', emailError);
      }

      await Swal.fire({ icon: 'success', title: bonusEmailSent ? 'Bonus credited and email sent' : 'Bonus credited (email failed)', timer: 1800, showConfirmButton: false });
      // Refresh MT5 balances if available
      fetchUser();
      // Log admin transaction
      try {
        await fetch(`${BASE}/admin/admin-transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ operation_type: 'bonus_add', mt5_login: accountId, amount, currency: 'USD', status: 'completed', comment })
        });
      } catch (_) { }
    } catch (e) {
      await Swal.fire({ icon: 'error', title: 'Bonus credit failed', text: e.message || String(e) });
    }
  }

  async function handleWithdrawBonus(accountId) {
    try {
      const { value: amountStr } = await Swal.fire({
        title: 'Withdraw Bonus',
        input: 'number',
        inputLabel: 'Amount (USD)',
        inputAttributes: { min: 0, step: 0.01 },
        inputPlaceholder: 'Enter bonus amount to deduct',
        showCancelButton: true,
        confirmButtonText: 'Continue',
      });
      if (amountStr === undefined) return; // cancelled
      const amount = Number(amountStr);
      if (!amount || amount <= 0) {
        await Swal.fire({ icon: 'error', title: 'Enter a valid amount' });
        return;
      }

      const { value: comment } = await Swal.fire({
        title: 'Add Comment',
        input: 'text',
        inputLabel: 'Optional',
        inputPlaceholder: 'Reason / note (optional)',
        showCancelButton: true,
        confirmButtonText: 'Submit',
      });
      if (comment === undefined) return; // cancelled

      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${BASE}/admin/mt5/credit/deduct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ login: accountId, amount, description: comment || '' })
      });
      let ok = res.ok;
      let msg = 'Bonus deducted successfully';
      let emailSent = false;
      try {
        const j = await res.json();
        if (j?.Success === false || j?.ok === false) {
          ok = false;
          msg = j?.Message || j?.error || msg;
        } else { emailSent = !!j?.emailSent; }
      } catch { /* ignore non-JSON */ }
      if (!ok) throw new Error(msg);

      // Send bonus withdrawal email notification
      let bonusEmailSent = false;
      try {
        const emailResponse = await fetch('https://zuperior-crm-api.onrender.com/api/emails/send-withdrawal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data?.user?.email,
            account_login: accountId,
            amount: amount.toString(),
            date: new Date().toISOString(),
            name: data?.user?.name || data?.user?.email
          })
        });
        bonusEmailSent = emailResponse.ok;
      } catch (emailError) {
        console.warn('Bonus withdrawal email notification failed:', emailError);
      }

      await Swal.fire({ icon: 'success', title: bonusEmailSent ? 'Bonus deducted and email sent' : 'Bonus deducted (email failed)', timer: 1800, showConfirmButton: false });
      // Refresh MT5 balances if available
      fetchUser();
      // Log admin transaction
      try {
        await fetch(`${BASE}/admin/admin-transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ operation_type: 'bonus_deduct', mt5_login: accountId, amount, currency: 'USD', status: 'completed', comment })
        });
      } catch (_) { }
    } catch (e) {
      await Swal.fire({ icon: 'error', title: 'Bonus deduction failed', text: e.message || String(e) });
    }
  }

  const totalMt5Balance = useMemo(() => {
    try {
      return Object.values(mt5Map).reduce((sum, v) => sum + (Number(v?.balance) || 0), 0);
    } catch {
      return 0;
    }
  }, [mt5Map]);

  const totalMt5Equity = useMemo(() => {
    try {
      return Object.values(mt5Map).reduce((sum, v) => sum + (Number(v?.equity) || 0), 0);
    } catch {
      return 0;
    }
  }, [mt5Map]);

  const splitMt5Accounts = useMemo(() => {
    const all = data?.user?.MT5Account || [];
    const real = [];
    const demo = [];
    all.forEach((a) => {
      const meta = mt5Map[a.accountId] || {};
      const groupName = meta.group || a.group || "";
      const isDemo =
        String(groupName || "")
          .toLowerCase()
          .includes("demo") || a.isDemo;
      if (isDemo) demo.push(a);
      else real.push(a);
    });
    return { real, demo };
  }, [data?.user?.MT5Account, mt5Map]);

  // Real vs Demo split by group name using API group
  const { realBalance, demoBalance, realEquity, demoEquity } = useMemo(() => {
    let rb = 0,
      db = 0,
      re = 0,
      de = 0;
    Object.values(mt5Map).forEach((v) => {
      const isDemo = String(v?.group || "")
        .toLowerCase()
        .includes("demo");
      if (isDemo) {
        db += Number(v?.balance || 0);
        de += Number(v?.equity || 0);
      } else {
        rb += Number(v?.balance || 0);
        re += Number(v?.equity || 0);
      }
    });
    return { realBalance: rb, demoBalance: db, realEquity: re, demoEquity: de };
  }, [mt5Map]);

  const fetchUser = useCallback(() => {
    let stop = false;
    const token = localStorage.getItem('adminToken');
    fetch(`${BASE}/admin/users/${id}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(r => r.json())
      .then(d => { if (stop) return; if (!d?.ok) throw new Error(d?.error || 'Failed'); setData(d); })
      .catch(e => setErr(e.message || String(e)));
    return () => { stop = true };
  }, [BASE, id]);

  useEffect(() => {
    const cancel = fetchUser();
    return cancel;
  }, [fetchUser]);

  // Initialize disabledAccounts from database account_status on data load
  useEffect(() => {
    if (data?.user?.MT5Account) {
      const disabled = new Set();
      data.user.MT5Account.forEach(account => {
        if (account.accountStatus && account.accountStatus !== 'active' && account.accountStatus !== '') {
          disabled.add(account.accountId);
        }
      });
      setDisabledAccounts(disabled);
    }
  }, [data?.user?.MT5Account]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    let cancel = false;
    fetch(`${BASE}/admin/users/${id}/logins`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(j => { if (cancel) return; setLogins(Array.isArray(j.items) ? j.items : []); })
      .catch(() => { });
    return () => { cancel = true; };
  }, [BASE, id]);

  // Fetch payment methods for this user
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    let cancel = false;
    fetch(`${BASE}/admin/users/${id}/payment-methods`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(j => { if (cancel) return; setPaymentMethods(Array.isArray(j.paymentMethods) ? j.paymentMethods : []); })
      .catch(() => { });
    return () => { cancel = true; };
  }, [BASE, id]);

  // Fetch MT5 profile (balance/equity/group/leverage) for each account id on page load
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!data?.user?.MT5Account?.length) return;
    let stop = false;
    (async () => {
      const entries = await Promise.all(
        data.user.MT5Account.map(async a => {
          try {
            const res = await fetch(
              `${BASE}/admin/mt5/proxy/${a.accountId}/getClientProfile`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const j = await res.json();
            const d = j?.data?.Data || j?.data || {};
            const levRaw = d.LeverageInCents
              ? Number(d.LeverageInCents) / 100
              : d.Leverage || null;
            return [
              a.accountId,
              {
                balance: Number(d.Balance ?? 0),
                equity: Number(d.Equity ?? 0),
                credit: Number(d.Credit ?? 0),
                margin: Number(d.Margin ?? 0),
                marginFree: Number(d.MarginFree ?? 0),
                marginLevel: Number(d.MarginLevel ?? 0),
                profit: Number(d.Profit ?? 0),
                group: d.Group || d.GroupName || a.group || '-',
                leverage: levRaw,
              },
            ];
          } catch {
            return [a.accountId, { balance: 0, equity: 0, credit: 0, margin: 0, marginFree: 0, marginLevel: 0, profit: 0, group: '-', leverage: null }];
          }
        })
      );
      if (!stop) setMt5Map(Object.fromEntries(entries));
    })();
    return () => { stop = true; };
  }, [BASE, data?.user?.MT5Account]);

  // Fetch MT5 groups when modal opens
  useEffect(() => {
    if (!createAccountModal) return;
    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${BASE}/admin/users/${id}/allowed-groups`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          // Filter groups based on current tab (real/demo)
          const filtered = data.data.filter(g => {
            const name = (g.group_name || '').toLowerCase();
            const isDemoGroup = name.includes('demo');
            return mt5Tab === 'demo' ? isDemoGroup : !isDemoGroup;
          });
          setMt5Groups(filtered);
          if (filtered.length > 0) {
            setCreateAccountForm(prev => ({ ...prev, mt5GroupId: filtered[0].id.toString() }));
          }
        }
      } catch (err) {
        console.error('Error fetching MT5 groups:', err);
        Swal.fire({ icon: 'error', title: 'Failed to load MT5 groups' });
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchGroups();
  }, [createAccountModal, mt5Tab, BASE]);

  // Handle create account submission
  const handleCreateAccount = async () => {
    if (!createAccountForm.mt5GroupId || !createAccountForm.leverage || !createAccountForm.masterPassword) {
      Swal.fire({ icon: 'error', title: 'Please fill all required fields' });
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE}/admin/users/${id}/accounts/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mt5GroupId: parseInt(createAccountForm.mt5GroupId),
          leverage: parseInt(createAccountForm.leverage),
          masterPassword: createAccountForm.masterPassword,
          isDemo: mt5Tab === 'demo'
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create account');
      }

      Swal.fire({ icon: 'success', title: 'Account created successfully', timer: 2000 });
      setCreateAccountModal(false);
      setCreateAccountForm({ mt5GroupId: '', leverage: 2000, masterPassword: '' });
      fetchUser();
      // Refresh MT5 data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed to create account', text: err.message || String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle login as user
  const handleLoginAsUser = async () => {
    const result = await Swal.fire({
      title: 'Login as User?',
      text: `You are about to login as ${data?.user?.name || data?.user?.email}. The user dashboard will open in a new tab.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, login as user',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setLoggingInAsUser(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE}/admin/users/${id}/login-as`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to login as user');
      }

      // Encode token for URL (base64 encoding)
      const encodedToken = btoa(encodeURIComponent(data.data.token));
      const encodedUserData = data.data.user ? btoa(encodeURIComponent(JSON.stringify(data.data.user))) : '';

      // Open user dashboard in new tab with token
      const dashboardUrl = `/auth/admin-login-as?token=${encodedToken}${encodedUserData ? `&userData=${encodedUserData}` : ''}`;
      const newWindow = window.open(dashboardUrl, '_blank');

      if (newWindow) {
        Swal.fire({
          icon: 'success',
          title: 'Opening user dashboard',
          text: 'User dashboard is opening in a new tab...',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        // If popup blocked, show error
        Swal.fire({
          icon: 'warning',
          title: 'Popup blocked',
          text: 'Please allow popups for this site to open the user dashboard in a new tab.',
          confirmButtonText: 'OK'
        });
      }

      setLoggingInAsUser(false);
    } catch (err) {
      setLoggingInAsUser(false);
      Swal.fire({ icon: 'error', title: 'Failed to login as user', text: err.message || String(err) });
    }
  };

  if (err) return <div className="rounded-xl bg-white border border-rose-200 text-rose-700 p-4">{err}</div>;
  if (!data) return <div className="rounded-xl bg-white border border-gray-200 p-4">Loading…</div>;

  const u = data.user; const t = data.totals;

  return (
    <div className="space-y-6 text-gray-900">
      {/* Header */}
      <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-xl font-bold">{u.name || u.email}</div>
              {(() => {
                const status = (u.status && u.status.toLowerCase()) || 'active';
                if (status === 'active') {
                  return <CheckCircle className="h-5 w-5 text-green-600" />;
                } else if (status === 'inactive') {
                  return <XCircle className="h-5 w-5 text-gray-500" />;
                } else {
                  return <XCircle className="h-5 w-5 text-red-600" />;
                }
              })()}
            </div>
            <div className="text-sm text-gray-600">{u.email}</div>
            <div className="text-xs text-gray-500 mt-1">
              Created {fmt(u.createdAt)} • Last login {fmt(u.lastLoginAt)}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 text-xs">
              <button
                type="button"
                onClick={() => handleTabChange("real")}
                className={`px-3 py-1 rounded-full transition ${mt5Tab === "real"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-800"
                  }`}
              >
                Real Accounts
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("demo")}
                className={`px-3 py-1 rounded-full transition ${mt5Tab === "demo"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-800"
                  }`}
              >
                Demo Accounts
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUserPasswordModal(true)}
                className="px-4 h-10 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium flex items-center gap-2 transition"
              >
                <Key className="w-4 h-4" />
                Change Password
              </button>
              <button
                onClick={handleLoginAsUser}
                disabled={loggingInAsUser}
                className="px-4 h-10 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition"
              >
                <LogIn className="w-4 h-4" />
                {loggingInAsUser ? 'Logging in...' : 'Login as User'}
              </button>
              <Link
                to="/admin/users/all"
                className="px-4 h-10 rounded-md border text-sm flex items-center"
              >
                Back to All Users
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {mt5Tab === "real" && (
          <>
            <Stat
              icon={Wallet}
              label="Real Balance"
              value={`$${realBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              tone="bg-violet-100 text-violet-700"
            />
            <Stat
              icon={Wallet}
              label="Real Equity"
              value={`$${realEquity.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              tone="bg-blue-100 text-blue-700"
            />
          </>
        )}
        {mt5Tab === "demo" && (
          <>
            <Stat
              icon={Wallet}
              label="Demo Balance"
              value={`$${demoBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              tone="bg-fuchsia-100 text-fuchsia-700"
            />
            <Stat
              icon={Wallet}
              label="Demo Equity"
              value={`$${demoEquity.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              tone="bg-cyan-100 text-cyan-700"
            />
          </>
        )}
        <Stat
          icon={Download}
          label="Total Deposits"
          value={`$${t.deposits.amount.toLocaleString()} (${t.deposits.count})`}
          tone="bg-emerald-100 text-emerald-700"
        />
        <Stat
          icon={Upload}
          label="Total Withdrawals"
          value={`$${t.withdrawals.amount.toLocaleString()} (${t.withdrawals.count})`}
          tone="bg-rose-100 text-rose-700"
        />
        <Stat
          icon={ShieldCheck}
          label="Email Verified"
          value={u.emailVerified ? "Yes" : "No"}
          tone={
            u.emailVerified
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-800"
          }
        />
      </div>

      {/* KYC */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div className="px-5 pt-4 pb-2 text-sm font-semibold">KYC Status</div>
        <div className="p-5 grid gap-4 md:grid-cols-3">
          {u.KYC ? (
            <>
              <div className="rounded-xl border p-4">
                <div className="text-xs text-gray-500">Status</div>
                <div className="font-semibold">{u.KYC.verificationStatus}</div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="text-xs text-gray-500">Document Verified</div>
                <div className="font-semibold">{u.KYC.isDocumentVerified ? 'Yes' : 'No'}</div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="text-xs text-gray-500">Address Verified</div>
                <div className="font-semibold">{u.KYC.isAddressVerified ? 'Yes' : 'No'}</div>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-600">No KYC submitted.</div>
          )}
        </div>
      </div>

      {/* MT5 Accounts full width using ProTable */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">MT5 Accounts</div>
          <button
            onClick={() => setCreateAccountModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-dark-base rounded-lg text-sm font-medium transition"
          >
            Create {mt5Tab === 'real' ? 'Live' : 'Demo'} Account
          </button>
        </div>
        <div className="p-4">
          <ProTable
            rows={((mt5Tab === "real"
              ? splitMt5Accounts.real
              : splitMt5Accounts.demo) || []
            )
              .filter(a => {
                // Filter out disabled accounts - check both state and database status
                const isDisabled = disabledAccounts.has(a.accountId) ||
                  (a.accountStatus && a.accountStatus !== 'active' && a.accountStatus !== '');
                return !isDisabled;
              })
              .map((a, idx) => ({
                __index: idx + 1,
                accountId: a.accountId,
                // Prefer live group from MT5 API; fall back to DB only if API missing
                group: mt5Map[a.accountId]?.group || a.group || "-",
                leverage: mt5Map[a.accountId]?.leverage
                  ? `1:${Number(mt5Map[a.accountId]?.leverage).toFixed(0)}`
                  : "-",
                balance: `$${(mt5Map[a.accountId]?.balance || 0).toFixed(2)}`,
                equity: `$${(mt5Map[a.accountId]?.equity || 0).toFixed(2)}`,
                createdAt: fmt(a.createdAt),
                _raw: a,
              }))}
            columns={[
              { key: "__index", label: "Sr No", sortable: false },
              { key: "accountId", label: "Account ID" },
              {
                key: "group",
                label: "Group",
                render: (v) => {
                  const groupName = v || "-";
                  const isDemo = String(groupName)
                    .toLowerCase()
                    .includes("demo");
                  return (
                    <Badge tone={isDemo ? "green" : "blue"}>{groupName}</Badge>
                  );
                },
              },
              { key: "leverage", label: "Leverage" },
              { key: "balance", label: "Balance" },
              { key: "equity", label: "Equity" },
              { key: "createdAt", label: "Created" },
              {
                key: "actions",
                label: "Actions",
                sortable: false,
                render: (v, row) => {
                  const isDisabled = disabledAccounts.has(row.accountId) ||
                    (row._raw?.accountStatus && row._raw.accountStatus !== 'active' && row._raw.accountStatus !== '');
                  return (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setActionModal({
                            type: "deposit",
                            accountId: row.accountId,
                            amount: "",
                            comment: "Admin deposit",
                          })
                        }
                        className="px-2 py-1 rounded-full bg-emerald-600 text-white text-xs hover:bg-emerald-700 shadow-sm"
                      >
                        Deposit
                      </button>
                      <button
                        onClick={() =>
                          setActionModal({
                            type: "withdraw",
                            accountId: row.accountId,
                            amount: "",
                            comment: "Admin withdrawal",
                            txId: "",
                          })
                        }
                        className="px-2 py-1 rounded-full bg-rose-600 text-white text-xs hover:bg-rose-700 shadow-sm"
                      >
                        Withdraw
                      </button>
                      {!isDisabled ? (
                        <button
                          onClick={() => handleDisableAccount(row.accountId)}
                          disabled={disablingAccount === row.accountId}
                          className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Disable Account"
                        >
                          <PowerOff className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnableAccount(row.accountId)}
                          disabled={enablingAccount === row.accountId}
                          className="p-1.5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Enable Account"
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                },
              },
              {
                key: "bonus",
                label: "Bonus Actions",
                sortable: false,
                render: (v, row) => (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddBonus(row.accountId)}
                      className="px-2 py-1 rounded-full bg-blue-600 text-dark-base text-xs hover:bg-blue-700 shadow-sm"
                    >
                      Add Bonus
                    </button>
                    <button
                      onClick={() => handleWithdrawBonus(row.accountId)}
                      className="px-2 py-1 rounded-full bg-gray-700 text-white text-xs hover:bg-gray-800 shadow-sm"
                    >
                      Withdraw Bonus
                    </button>
                  </div>
                ),
              },
              {
                key: "password",
                label: "Password",
                sortable: false,
                render: (v, row) => (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPasswordModal({ accountId: row.accountId, accountNumber: row.accountId })}
                      className="px-2 py-1 rounded-full bg-blue-600 text-white text-xs hover:bg-blue-700 shadow-sm"
                    >
                      Change Password
                    </button>
                  </div>
                ),
              },
            ]}
            pageSize={5}
            searchPlaceholder="Search by account, group…"
            filters={{ searchKeys: ["accountId", "group"], dateKey: "createdAt" }}
          />
        </div>
      </div>

      {/* Archive Accounts */}
      {((mt5Tab === "real" ? splitMt5Accounts.real : splitMt5Accounts.demo) || [])
        .filter(a => {
          const isDisabled = disabledAccounts.has(a.accountId) ||
            (a.accountStatus && a.accountStatus !== 'active' && a.accountStatus !== '');
          return isDisabled;
        }).length > 0 && (
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm mt-6">
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Archive className="h-4 w-4 text-gray-600" />
                <div className="text-sm font-semibold">Archive Accounts</div>
              </div>
            </div>
            <div className="p-4">
              <ProTable
                rows={((mt5Tab === "real"
                  ? splitMt5Accounts.real
                  : splitMt5Accounts.demo) || []
                )
                  .filter(a => {
                    const isDisabled = disabledAccounts.has(a.accountId) ||
                      (a.accountStatus && a.accountStatus !== 'active' && a.accountStatus !== '');
                    return isDisabled;
                  })
                  .map((a, idx) => ({
                    __index: idx + 1,
                    accountId: a.accountId,
                    group: mt5Map[a.accountId]?.group || a.group || "-",
                    leverage: mt5Map[a.accountId]?.leverage
                      ? `1:${Number(mt5Map[a.accountId]?.leverage).toFixed(0)}`
                      : "-",
                    balance: `$${(mt5Map[a.accountId]?.balance || 0).toFixed(2)}`,
                    equity: `$${(mt5Map[a.accountId]?.equity || 0).toFixed(2)}`,
                    createdAt: fmt(a.createdAt),
                    _raw: a,
                  }))}
                columns={[
                  { key: "__index", label: "Sr No", sortable: false },
                  { key: "accountId", label: "Account ID" },
                  {
                    key: "group",
                    label: "Group",
                    render: (v) => {
                      const groupName = v || "-";
                      const isDemo = String(groupName)
                        .toLowerCase()
                        .includes("demo");
                      return (
                        <Badge tone={isDemo ? "green" : "blue"}>{groupName}</Badge>
                      );
                    },
                  },
                  { key: "leverage", label: "Leverage" },
                  { key: "balance", label: "Balance" },
                  { key: "equity", label: "Equity" },
                  { key: "createdAt", label: "Created" },
                  {
                    key: "status",
                    label: "Status",
                    sortable: false,
                    render: (v, row) => (
                      <Badge tone="red">Disabled</Badge>
                    ),
                  },
                  {
                    key: "actions",
                    label: "Actions",
                    sortable: false,
                    render: (v, row) => (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEnableAccount(row.accountId)}
                          disabled={enablingAccount === row.accountId}
                          className="px-3 py-1.5 rounded-full bg-green-600 text-white text-xs hover:bg-green-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Enable and restore this account"
                        >
                          <div className="flex items-center gap-1">
                            <Power className="w-3 h-3" />
                            {enablingAccount === row.accountId ? 'Enabling...' : 'Active Account'}
                          </div>
                        </button>
                      </div>
                    ),
                  },
                ]}
                pageSize={5}
                searchPlaceholder="Search archived accounts…"
                filters={{ searchKeys: ["accountId", "group"], dateKey: "createdAt" }}
              />
            </div>
          </div>
        )}

      {/* Approved Payment Methods */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div className="px-5 pt-4 pb-2 text-sm font-semibold flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Approved Payment Methods
        </div>
        <div className="p-4">
          {paymentMethods.length === 0 ? (
            <div className="text-sm text-gray-600 py-4">No approved payment methods found.</div>
          ) : (
            <ProTable
              rows={paymentMethods.map((pm, idx) => ({
                __index: idx + 1,
                address: pm.address || '-',
                currency: pm.currency || '-',
                network: pm.network || '-',
                submittedAt: fmt(pm.submittedAt),
                approvedAt: fmt(pm.approvedAt),
                status: pm.status || 'approved',
              }))}
              columns={[
                { key: '__index', label: 'Sr No', sortable: false },
                { key: 'address', label: 'Address' },
                { key: 'currency', label: 'Currency' },
                { key: 'network', label: 'Network' },
                { key: 'submittedAt', label: 'Submitted' },
                { key: 'approvedAt', label: 'Approved' },
                {
                  key: 'status', label: 'Status', render: (v) => (
                    <Badge tone={v === 'approved' ? 'green' : v === 'rejected' ? 'red' : 'amber'}>
                      {v || 'pending'}
                    </Badge>
                  )
                },
              ]}
              pageSize={5}
              searchPlaceholder="Search by address, currency, network…"
              filters={{ searchKeys: ['address', 'currency', 'network'], dateKey: 'approvedAt' }}
            />
          )}
        </div>
      </div>

      {/* Login Activity */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div className="px-5 pt-4 pb-2 text-sm font-semibold">Login Activity</div>
        <div className="p-4">
          <ProTable
            title={null}
            rows={(logins || []).map((r, idx) => ({
              __index: idx + 1,
              time: r.createdAt || r.createdat || r.created_at,
              device: r.device || '-',
              browser: r.browser || '-',
              user_agent: r.user_agent || '-',
              success: r.success ? 'Yes' : 'No',
              failure_reason: r.failure_reason || '-',
            }))}
            columns={[
              { key: '__index', label: 'Sr No', sortable: false },
              { key: 'time', label: 'Time' },
              { key: 'device', label: 'Device' },
              { key: 'browser', label: 'Browser' },
              { key: 'user_agent', label: 'User Agent' },
              { key: 'success', label: 'Success' },
              { key: 'failure_reason', label: 'Failure Reason' },
            ]}
            filters={{ searchKeys: ['device', 'browser', 'user_agent', 'failure_reason'], dateKey: 'time' }}
            pageSize={10}
          />
        </div>
      </div>

      {/* Create Account Modal */}
      <Modal open={createAccountModal} onClose={() => {
        setCreateAccountModal(false);
        setCreateAccountForm({ mt5GroupId: '', leverage: 2000, masterPassword: '' });
      }} title={`Create ${mt5Tab === 'real' ? 'Live' : 'Demo'} MT5 Account`}>
        <div className="space-y-4">
          {/* Trading Group Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trading Group <span className="text-red-500">*</span>
            </label>
            {loadingGroups ? (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="ml-2 text-sm text-gray-600">Loading groups...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mt5Groups.length === 0 ? (
                  <div className="col-span-full text-center py-4 text-gray-500">
                    No {mt5Tab} groups available currently.
                  </div>
                ) : (
                  mt5Groups.map((group) => (
                    <label key={group.id} className="cursor-pointer">
                      <input
                        type="radio"
                        name="mt5GroupId"
                        value={group.id}
                        checked={createAccountForm.mt5GroupId === group.id.toString()}
                        onChange={(e) => setCreateAccountForm(prev => ({ ...prev, mt5GroupId: e.target.value }))}
                        className="sr-only"
                      />
                      <div className={`border-2 rounded-lg p-3 transition-all ${createAccountForm.mt5GroupId === group.id.toString()
                        ? 'border-blue-600 bg-blue-600 bg-opacity-5'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-4 h-4 rounded-full ${createAccountForm.mt5GroupId === group.id.toString() ? 'bg-blue-600' : 'bg-gray-300'
                            }`}></div>
                          <span className="font-semibold text-gray-900 text-sm">
                            {group.dedicated_name || 'Unnamed Group'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 ml-6">
                          • Currency: {group.currency}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Leverage Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leverage <span className="text-red-500">*</span>
            </label>
            <select
              value={createAccountForm.leverage}
              onChange={(e) => setCreateAccountForm(prev => ({ ...prev, leverage: parseInt(e.target.value) }))}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="50">1:50</option>
              <option value="100">1:100</option>
              <option value="200">1:200</option>
              <option value="500">1:500</option>
              <option value="1000">1:1000</option>
              <option value="1500">1:1500</option>
              <option value="2000">1:2000</option>
            </select>
          </div>

          {/* Master Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Master Password (MT5 Login Password) <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-600 mb-2">
              This will be the main password to login to MT5. Keep it strong and do not share it with anyone.
            </p>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={createAccountForm.masterPassword}
                onChange={(e) => setCreateAccountForm(prev => ({ ...prev, masterPassword: e.target.value }))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 pr-10"
                placeholder="Set your MT5 master password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => {
                setCreateAccountModal(false);
                setCreateAccountForm({ mt5GroupId: '', leverage: 2000, masterPassword: '' });
              }}
              disabled={submitting}
              className="px-4 h-10 rounded-md border disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAccount}
              disabled={submitting || loadingGroups || !createAccountForm.mt5GroupId || !createAccountForm.masterPassword}
              className="px-4 h-10 rounded-md bg-blue-600 hover:bg-blue-700 text-dark-base disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Deposit/Withdraw Modal for MT5 accounts */}
      <Modal open={!!actionModal} onClose={() => setActionModal(null)} title={actionModal ? (actionModal.type === 'deposit' ? 'Add Balance' : 'Deduct Balance') : ''}>
        {actionModal && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
              <input type="number" min="0" step="0.01" value={actionModal.amount}
                onChange={e => setActionModal({ ...actionModal, amount: e.target.value })}
                disabled={submitting}
                className="w-full rounded-md border border-gray-300 h-10 px-3 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-gray-100 disabled:text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
              <input type="text" value={actionModal.comment}
                onChange={e => setActionModal({ ...actionModal, comment: e.target.value })}
                disabled={submitting}
                className="w-full rounded-md border border-gray-300 h-10 px-3 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-gray-100 disabled:text-gray-500" />
            </div>
            {actionModal.type === 'withdraw' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID / Hash (optional)</label>
                <input type="text" value={actionModal.txId || ''}
                  onChange={e => setActionModal({ ...actionModal, txId: e.target.value })}
                  disabled={submitting}
                  placeholder="Paste blockchain tx hash or bank reference (optional)"
                  className="w-full rounded-md border border-gray-300 h-10 px-3 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100 disabled:text-gray-500" />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setActionModal(null)} disabled={submitting} className="px-4 h-10 rounded-md border disabled:opacity-60">Cancel</button>
              <button onClick={async () => {
                const amt = Number(actionModal.amount);
                if (!amt || amt <= 0) { Swal.fire({ icon: 'error', title: 'Enter amount' }); return; }
                try {
                  setSubmitting(true);
                  const token = localStorage.getItem('adminToken');
                  const url = actionModal.type === 'deposit' ? `${BASE}/admin/mt5/deposit` : `${BASE}/admin/mt5/withdraw`;
                  const payload = { mt5_login: actionModal.accountId, amount: amt, comment: actionModal.comment };
                  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
                  const j = await r.json();
                  if (!j?.success) throw new Error(j?.message || j?.error || 'Failed');

                  // Send email notification using external CRM API
                  let emailSent = false;
                  try {
                    const emailUrl = actionModal.type === 'deposit'
                      ? 'https://zuperior-crm-api.onrender.com/api/emails/send-deposit'
                      : 'https://zuperior-crm-api.onrender.com/api/emails/send-withdrawal';

                    const emailResponse = await fetch(emailUrl, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        email: u.email,
                        account_login: actionModal.accountId,
                        amount: amt.toString(),
                        date: new Date().toISOString(),
                        name: u.name || u.email
                      })
                    });
                    emailSent = emailResponse.ok;
                  } catch (emailError) {
                    console.warn('Email notification failed:', emailError);
                  }

                  setActionModal(null);
                  const title = actionModal.type === 'deposit'
                    ? (emailSent ? 'Deposit successful and email sent' : 'Deposit successful (email failed)')
                    : (emailSent ? 'Withdrawal successful and email sent' : 'Withdrawal successful (email failed)');
                  Swal.fire({ icon: 'success', title, timer: 1800, showConfirmButton: false });
                  fetchUser();
                  // Log in admin_transactions for reporting
                  try {
                    await fetch(`${BASE}/admin/admin-transactions`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({
                        operation_type: actionModal.type === 'deposit' ? 'deposit' : 'withdraw',
                        mt5_login: actionModal.accountId,
                        amount: amt,
                        currency: 'USD',
                        status: 'completed',
                        comment: actionModal.comment || '',
                        ...(actionModal.type === 'withdraw' && actionModal.txId ? { external_transaction_id: actionModal.txId.trim() } : {})
                      })
                    });
                  } catch (_) { }
                } catch (e) {
                  Swal.fire({ icon: 'error', title: actionModal.type === 'deposit' ? 'Deposit failed' : 'Withdrawal failed', text: e.message || String(e) });
                } finally {
                  setSubmitting(false);
                }
              }} disabled={submitting} className={`px-4 h-10 rounded-md text-white disabled:opacity-70 ${actionModal.type === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  actionModal.type === 'deposit' ? 'Deposit' : 'Withdraw'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Change Password Modal */}
      <Modal open={!!passwordModal} onClose={() => {
        setPasswordModal(null);
        setNewPassword('');
        setShowNewPassword(false);
      }} title="Change MT5 Password">
        {passwordModal && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account ID: <span className="font-semibold">{passwordModal.accountId}</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Password must be at least 8 characters long. This will update the password in MT5 and the database.
              </p>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 pr-10"
                  placeholder="Enter new password (min 8 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => {
                  setPasswordModal(null);
                  setNewPassword('');
                  setShowNewPassword(false);
                }}
                disabled={changingPassword}
                className="px-4 h-10 rounded-md border disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newPassword || newPassword.length < 8) {
                    Swal.fire({ icon: 'error', title: 'Invalid Password', text: 'Password must be at least 8 characters long' });
                    return;
                  }

                  try {
                    setChangingPassword(true);
                    const token = localStorage.getItem('adminToken');
                    const response = await fetch(`${BASE}/admin/mt5/account/${passwordModal.accountId}/password`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({ newPassword })
                    });

                    const data = await response.json();

                    if (!response.ok || !data?.ok) {
                      throw new Error(data?.error || 'Failed to change password');
                    }

                    Swal.fire({
                      icon: 'success',
                      title: 'Password Changed!',
                      text: 'MT5 password has been updated successfully',
                      timer: 2000
                    });

                    setPasswordModal(null);
                    setNewPassword('');
                    setShowNewPassword(false);
                  } catch (err) {
                    Swal.fire({ icon: 'error', title: 'Failed to Change Password', text: err.message || String(err) });
                  } finally {
                    setChangingPassword(false);
                  }
                }}
                disabled={changingPassword || !newPassword || newPassword.length < 8}
                className="px-4 h-10 rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Change User Password Modal */}
      <Modal open={userPasswordModal} onClose={() => {
        setUserPasswordModal(false);
        setNewUserPassword('');
        setShowNewUserPassword(false);
      }} title="Change User Password">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User: <span className="font-semibold">{u.name || u.email}</span>
            </label>
            <p className="text-xs text-gray-600">
              This will change the CRM login password for this user. The user will need to use this new password to log in.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-600 mb-2">
              Password must be at least 8 characters long.
            </p>
            <div className="relative">
              <input
                type={showNewUserPassword ? 'text' : 'password'}
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 pr-10"
                placeholder="Enter new password (min 8 characters)"
              />
              <button
                type="button"
                onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewUserPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => {
                setUserPasswordModal(false);
                setNewUserPassword('');
                setShowNewUserPassword(false);
              }}
              disabled={changingUserPassword}
              className="px-4 h-10 rounded-md border disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!newUserPassword || newUserPassword.length < 8) {
                  Swal.fire({ icon: 'error', title: 'Invalid Password', text: 'Password must be at least 8 characters long' });
                  return;
                }

                try {
                  setChangingUserPassword(true);
                  const token = localStorage.getItem('adminToken');
                  const response = await fetch(`${BASE}/admin/users/${id}/password`, {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ newPassword: newUserPassword })
                  });

                  const data = await response.json();

                  if (!response.ok || !data?.ok) {
                    throw new Error(data?.error || 'Failed to change password');
                  }

                  Swal.fire({
                    icon: 'success',
                    title: 'Password Changed!',
                    text: 'User password has been updated successfully',
                    timer: 2000
                  });

                  setUserPasswordModal(false);
                  setNewUserPassword('');
                  setShowNewUserPassword(false);
                } catch (err) {
                  Swal.fire({ icon: 'error', title: 'Failed to Change Password', text: err.message || String(err) });
                } finally {
                  setChangingUserPassword(false);
                }
              }}
              disabled={changingUserPassword || !newUserPassword || newUserPassword.length < 8}
              className="px-4 h-10 rounded-md bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {changingUserPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
