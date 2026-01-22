import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AiOutlinePlus } from "react-icons/ai";
import { RiLoginBoxLine } from "react-icons/ri";
import { RiArrowLeftRightLine } from "react-icons/ri";
import { RiLogoutBoxLine } from "react-icons/ri";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { LuWallet } from "react-icons/lu";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";
import { RiArrowDownCircleLine, RiArrowUpCircleLine } from "react-icons/ri";
import { LayoutDashboard } from "lucide-react";
import authService from "../../services/auth.js";
import PageHeader from "../components/PageHeader.jsx";
import PromotionsSlider from "../components/PromotionsSlider.jsx";

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
import AccountsTable from '../components/AccountsTable.jsx';

function Dashboard() {
  const navigate = useNavigate();
  const [showKycBanner, setShowKycBanner] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [archivedAccounts, setArchivedAccounts] = useState([]); // Disabled/inactive accounts
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountBalances, setAccountBalances] = useState({}); // { accountNumber: { leverage, equity, balance, margin, credit } }
  const [syncingAccount, setSyncingAccount] = useState(null); // accountNumber being synced
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityList, setActivityList] = useState([]);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityPage, setActivityPage] = useState(1);
  const [wallet, setWallet] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(true);

  // Account Summary state
  const [summaryTotals, setSummaryTotals] = useState({
    totalBalance: 0,
    totalCredit: 0,
    totalEquity: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    loading: true
  });

  // Refs to prevent multiple calculations
  const isCalculatingRef = useRef(false);
  const hasCalculatedRef = useRef(false);

  // Helper function to remove duplicate accounts by account_number
  const deduplicateAccounts = (accounts) => {
    const seen = new Set();
    return accounts.filter(acc => {
      if (!acc.account_number) return false;
      if (seen.has(acc.account_number)) return false;
      seen.add(acc.account_number);
      return true;
    });
  };

  // Wallet modal state
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletModalStep, setWalletModalStep] = useState(1); // 1: Details, 2: Confirmation, 3: Confirmed
  const [walletModalAction, setWalletModalAction] = useState(null); // 'deposit', 'withdraw', 'transfer'
  const [walletFormData, setWalletFormData] = useState({
    amount: '',
    mt5Account: '',
    direction: 'to-mt5' // 'to-mt5' or 'from-mt5'
  });
  const [walletSubmitting, setWalletSubmitting] = useState(false);

  // Fetch balance for a specific account from MT5 API
  const fetchAccountBalance = async (accountNumber) => {
    try {
      const token = authService.getToken();
      if (!token) return null;

      const response = await fetch(`${API_BASE_URL}/accounts/${accountNumber}/balance`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data.success && data.data) {
        setAccountBalances(prev => ({
          ...prev,
          [accountNumber]: data.data
        }));
        return data.data;
      }
    } catch (error) {
      // Silent fail, use fallback
    }
    return null;
  };

  // Fetch all account balances
  const fetchAllAccountBalances = async (accountList) => {
    const promises = accountList.map(acc => {
      const accountNumber = acc.account_number;
      return fetchAccountBalance(accountNumber);
    });
    await Promise.all(promises);
  };

  // Calculate summary totals from real accounts only
  const calculateSummaryTotals = useCallback(async (balances = null, showLoading = false) => {
    // Prevent multiple simultaneous calculations
    if (isCalculatingRef.current) {
      return;
    }

    try {
      isCalculatingRef.current = true;

      // Show loading on initial calculation
      if (showLoading) {
        setSummaryTotals(prev => ({ ...prev, loading: true }));
      }

      const token = authService.getToken();
      if (!token) {
        isCalculatingRef.current = false;
        return;
      }

      // Use provided balances or current state
      const currentBalances = balances || accountBalances;

      // Get real accounts only (not demo)
      const realAccounts = accounts.filter(acc => !acc.is_demo);

      // Calculate totals from account balances
      let totalBalance = 0;
      let totalCredit = 0;
      let totalEquity = 0;

      realAccounts.forEach(acc => {
        const accountNumber = acc.account_number;
        const balance = currentBalances[accountNumber];
        if (balance) {
          totalBalance += parseFloat(balance.balance || 0);
          totalCredit += parseFloat(balance.credit || 0);
          totalEquity += parseFloat(balance.equity || 0);
        } else {
          // Fallback to account data if balance not fetched yet
          const accBalance = parseFloat(acc.balance || 0);
          const accCredit = parseFloat(acc.credit || 0);
          const accEquity = parseFloat(acc.equity || 0);

          totalBalance += accBalance;
          totalCredit += accCredit;
          totalEquity += accEquity;

          // If account has balance data, use it even if balance API call failed
          // (Silent - no console log needed)
        }
      });

      // Fetch approved deposits and withdrawals in parallel
      let totalDeposits = 0;
      let totalWithdrawals = 0;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const [depositsRes, withdrawalsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/deposits/my?status=approved&limit=1000`, {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: controller.signal
          }).catch(() => ({ ok: false })),
          fetch(`${API_BASE_URL}/withdrawals/my?status=approved&limit=1000`, {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: controller.signal
          }).catch(() => ({ ok: false }))
        ]);

        clearTimeout(timeoutId);

        if (depositsRes.ok) {
          try {
            const depositsData = await depositsRes.json();
            if (depositsData.success && Array.isArray(depositsData.items)) {
              totalDeposits = depositsData.items.reduce((sum, dep) => {
                return sum + parseFloat(dep.amount || 0);
              }, 0);
            } else if (depositsData.success && Array.isArray(depositsData.data)) {
              // Fallback: check if data is in data array
              totalDeposits = depositsData.data.reduce((sum, dep) => {
                return sum + parseFloat(dep.amount || 0);
              }, 0);
            }
          } catch (err) {
            // Silent fail
          }
        }

        if (withdrawalsRes.ok) {
          try {
            const withdrawalsData = await withdrawalsRes.json();
            if (withdrawalsData.success && Array.isArray(withdrawalsData.items)) {
              totalWithdrawals = withdrawalsData.items.reduce((sum, wd) => {
                return sum + parseFloat(wd.amount || 0);
              }, 0);
            } else if (withdrawalsData.success && Array.isArray(withdrawalsData.data)) {
              // Fallback: check if data is in data array
              totalWithdrawals = withdrawalsData.data.reduce((sum, wd) => {
                return sum + parseFloat(wd.amount || 0);
              }, 0);
            } else if (withdrawalsData.ok && Array.isArray(withdrawalsData.items)) {
              // Another fallback format
              totalWithdrawals = withdrawalsData.items.reduce((sum, wd) => {
                return sum + parseFloat(wd.amount || 0);
              }, 0);
            }
          } catch (err) {
            // Silent fail
          }
        }
      } catch (error) {
        // Silent fail
      }

      // Stop loading immediately - we're using stored data so it's instant
      // No need to wait, data is already available from accounts list
      setSummaryTotals({
        totalBalance,
        totalCredit,
        totalEquity,
        totalDeposits,
        totalWithdrawals,
        loading: false
      });

      hasCalculatedRef.current = true;
    } catch (error) {
      setSummaryTotals(prev => ({ ...prev, loading: false }));
    } finally {
      isCalculatingRef.current = false;
    }
  }, [accounts, accountBalances]);

  // Fetch accounts from API - IMMEDIATELY on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        // Set loading state IMMEDIATELY when user logs in
        setSummaryTotals(prev => ({ ...prev, loading: true }));

        const token = authService.getToken();
        if (!token) {
          setSummaryTotals(prev => ({ ...prev, loading: false }));
          return;
        }

        // Fetch accounts first
        const response = await fetch(`${API_BASE_URL}/accounts`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Handle 401 Unauthorized
        if (response.status === 401) {
          authService.logout();
          navigate('/login');
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          const all = Array.isArray(data.data) ? data.data : [];
          console.log('All accounts fetched:', all.length, all.map(a => ({ id: a.account_number, status: a.account_status })));

          // Remove duplicates by account_number (safety measure in case backend returns duplicates)
          const uniqueAccounts = deduplicateAccounts(all);

          // Store all active MT5 accounts (status is empty, 'active', or null)
          const activeAccounts = uniqueAccounts.filter((acc) => {
            const platform = (acc.platform || '').toUpperCase();
            const status = (acc.account_status || '').toLowerCase();
            const isActive = platform === 'MT5' && (status === '' || status === 'active' || !status);
            return isActive;
          });
          setAccounts(activeAccounts);
          console.log('Active accounts:', activeAccounts.length);

          // Store archived (disabled/inactive) MT5 accounts - check for ANY non-active status
          const archived = all.filter((acc) => {
            const platform = String(acc.platform || '').toUpperCase();
            const status = String(acc.account_status || '').toLowerCase().trim();
            const isArchived = platform === 'MT5' && status && status !== '' && status !== 'active' && status !== 'null';
            if (isArchived) {
              console.log('📦 Found archived account:', acc.account_number, 'status:', status, 'platform:', platform);
            }
            return isArchived;
          });
          setArchivedAccounts(archived);
          console.log('📦 Total archived accounts:', archived.length, archived.map(a => ({ id: a.account_number, status: a.account_status, platform: a.platform })));

          // Use stored balance data IMMEDIATELY - no waiting for API calls
          const realAccounts = activeAccounts.filter(acc => !acc.is_demo);
          if (realAccounts.length > 0) {
            // Use account's stored balance IMMEDIATELY (from accounts list)
            const balanceResults = {};
            realAccounts.forEach(acc => {
              // Use stored balance data right away - instant display
              balanceResults[acc.account_number] = {
                balance: parseFloat(acc.balance || 0),
                credit: parseFloat(acc.credit || 0),
                equity: parseFloat(acc.equity || 0)
              };
            });

            // Calculate and display IMMEDIATELY with stored data
            // We await it here so that we have the final totals before fetching fresh balances
            // But with the new timeout in calculateSummaryTotals, this won't hang for long
            await calculateSummaryTotals(balanceResults, false);

            // Fetch fresh balances in background (silent update, no loading state)
            realAccounts.forEach(acc => {
              fetchAccountBalance(acc.account_number).then(result => {
                if (result) {
                  // Update silently in background
                  setAccountBalances(prev => ({
                    ...prev,
                    [acc.account_number]: result
                  }));
                  // Recalculate with fresh data silently
                  calculateSummaryTotals({
                    ...balanceResults,
                    [acc.account_number]: result
                  }, false);
                }
              }).catch(() => {
                // Silent fail, keep using stored balance
              });
            });
          } else {
            // Still calculate summary for deposits/withdrawals even if no accounts
            await calculateSummaryTotals(null, true);
          }
        } else {
          setSummaryTotals(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        setSummaryTotals(prev => ({ ...prev, loading: false }));
      } finally {
        setLoadingAccounts(false);
      }
    };

    // Fetch immediately on mount
    fetchAccounts();
  }, []);

  // Recalculate summary when accountBalances change (only if already calculated once)
  // This prevents blinking on initial load
  useEffect(() => {
    if (hasCalculatedRef.current && accounts.length > 0 && Object.keys(accountBalances).length > 0) {
      const realAccounts = accounts.filter(acc => !acc.is_demo);
      if (realAccounts.length > 0) {
        // Debounce to prevent multiple rapid recalculations
        const timeoutId = setTimeout(() => {
          calculateSummaryTotals(null, false);
        }, 300);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [accountBalances, accounts, calculateSummaryTotals]);

  // Fetch wallet from API
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        setLoadingWallet(true);
        const token = authService.getToken();
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/wallet`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success) {
          setWallet(data.data);
        }
      } catch (err) {
        console.error('Error fetching wallet:', err);
      } finally {
        setLoadingWallet(false);
      }
    };

    fetchWallet();
  }, []);

  // Fetch recent account activity (last 5 items)
  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoadingActivities(true);
        const token = authService.getToken();
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/accounts/activity?limit=5&offset=0`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setRecentActivities(Array.isArray(data.data.items) ? data.data.items : []);
        }
      } catch (err) {
        console.error('Error fetching recent activity:', err);
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchRecentActivity();
  }, []);

  const loadActivityPage = async (page) => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const limit = 10;
      const offset = (page - 1) * limit;

      const res = await fetch(
        `${API_BASE_URL}/accounts/activity?limit=${limit}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await res.json();
      if (data.success && data.data) {
        setActivityList(Array.isArray(data.data.items) ? data.data.items : []);
        setActivityTotal(data.data.total || 0);
        setActivityPage(page);
      }
    } catch (err) {
      console.error('Error loading activity page:', err);
    }
  };

  return (
    <div className="w-full pb-8">
      <div className="px-4 md:px-8 mt-6 space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <PageHeader
          icon={LayoutDashboard}
          title="Dashboard"
          subtitle="Overview of your trading accounts, wallet balance, and recent activities."
        />

        {/* Promotional Banners Slider */}
        <PromotionsSlider />

        {/* Account Summary */}
        <h2 className="text-sm md:text-md font-medium text-gray-800 mb-4">
          Account Summary
        </h2>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Total Balance Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-50 rounded-xl p-3 group-hover:scale-110 transition-transform duration-300">
                <MdOutlineAccountBalanceWallet className="text-blue-600 text-2xl" />
              </div>
            </div>
            <div className="text-gray-500 text-xs font-medium mb-1 uppercase tracking-wide">Total Balance</div>
            <div className="text-gray-900 font-bold text-xl">
              {summaryTotals.loading ? (
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></span>
                  <span className="w-2 h-2 bg-gray-200 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-gray-200 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                </span>
              ) : (
                `${summaryTotals.totalBalance.toFixed(2)} USD`
              )}
            </div>
          </div>

          {/* Total Credit Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-50 rounded-xl p-3 group-hover:scale-110 transition-transform duration-300">
                <LuWallet className="text-purple-600 text-2xl" />
              </div>
            </div>
            <div className="text-gray-500 text-xs font-medium mb-1 uppercase tracking-wide">Total Credit</div>
            <div className="text-gray-900 font-bold text-xl">
              {summaryTotals.loading ? (
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></span>
                  <span className="w-2 h-2 bg-gray-200 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-gray-200 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                </span>
              ) : (
                `${summaryTotals.totalCredit.toFixed(2)} USD`
              )}
            </div>
          </div>

          {/* Total Equity Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-50 rounded-xl p-3 group-hover:scale-110 transition-transform duration-300">
                <MdOutlineAccountBalanceWallet className="text-emerald-600 text-2xl" />
              </div>
            </div>
            <div className="text-gray-500 text-xs font-medium mb-1 uppercase tracking-wide">Total Equity</div>
            <div className="text-gray-900 font-bold text-xl">
              {summaryTotals.loading ? (
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></span>
                  <span className="w-2 h-2 bg-gray-200 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-gray-200 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                </span>
              ) : (
                `${summaryTotals.totalEquity.toFixed(2)} USD`
              )}
            </div>
          </div>

          {/* Total Deposits Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-teal-50 rounded-xl p-3 group-hover:scale-110 transition-transform duration-300">
                <RiArrowUpCircleLine className="text-teal-600 text-2xl" />
              </div>
            </div>
            <div className="text-gray-500 text-xs font-medium mb-1 uppercase tracking-wide">Total Deposits</div>
            <div className="text-gray-900 font-bold text-xl">
              {summaryTotals.loading ? (
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></span>
                  <span className="w-2 h-2 bg-gray-200 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-gray-200 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                </span>
              ) : (
                `${summaryTotals.totalDeposits.toFixed(2)} USD`
              )}
            </div>
          </div>

          {/* Total Withdrawals Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-rose-50 rounded-xl p-3 group-hover:scale-110 transition-transform duration-300">
                <RiArrowDownCircleLine className="text-rose-600 text-2xl" />
              </div>
            </div>
            <div className="text-gray-500 text-xs font-medium mb-1 uppercase tracking-wide">Total Withdrawals</div>
            <div className="text-gray-900 font-bold text-xl">
              {summaryTotals.loading ? (
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></span>
                  <span className="w-2 h-2 bg-gray-200 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-gray-200 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                </span>
              ) : (
                `${summaryTotals.totalWithdrawals.toFixed(2)} USD`
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="w-full">
          {/* Header with Icon */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-blue-600 flex-shrink-0"></div>
            <h2 className="text-sm md:text-md font-bold text-gray-800">
              Recent Activity
            </h2>
          </div>

          {/* Activity Card */}
          <div className="bg-white border border-gray-100 rounded-2xl w-full overflow-hidden shadow-sm">
            {loadingActivities ? (
              <div className="flex items-center justify-center text-gray-500 text-sm p-6">
                Loading activity…
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="flex items-center justify-center text-gray-500 text-sm p-6">
                No recent activity
              </div>
            ) : (
              <>
                {/* Activity List */}
                <div className="divide-y divide-gray-100">
                  {recentActivities.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="p-5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Left Section */}
                        <div className="flex-1">
                          {/* Description */}
                          <div className="font-semibold text-gray-900 text-sm mb-1">
                            {item.title}{" "}
                            {item.accountNumber ? `#${item.accountNumber}` : ""}
                          </div>
                          {/* Date and Time */}
                          <div className="text-gray-500 text-xs">
                            {new Date(item.time).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}, {new Date(item.time).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false
                            })}
                          </div>
                        </div>

                        {/* Right Section - Status Badge */}
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                            Success
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-gray-500 text-xs">
                    Showing last {recentActivities.length} results
                  </span>
                  <button
                    onClick={() => {
                      setActivityModalOpen(true);
                      loadActivityPage(1);
                    }}
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium transition-colors hover:underline"
                  >
                    View all
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Live Accounts Section */}
        <div className="w-full">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
            <h2 className="text-gray-700 text-sm md:text-md font-medium">
              Live Accounts
            </h2>
            <Link
              to="/user/create-account?mode=live"
              className="flex items-center justify-center gap-2 border border-gray-300 bg-white px-3 py-1 rounded-md hover:bg-gray-50 transition text-sm sm:text-md"
            >
              <AiOutlinePlus /> Create Live Account
            </Link>
          </div>

          <AccountsTable
            accounts={accounts.filter(a => !a.is_demo)}
            loading={loadingAccounts}
            accountBalances={accountBalances}
            onSync={async (accountNumber) => {
              setSyncingAccount(accountNumber);
              try {
                await fetchAccountBalance(accountNumber);
                // Also refresh accounts list to get updated balance from DB
                const token = authService.getToken();
                const response = await fetch(`${API_BASE_URL}/accounts`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                  const all = Array.isArray(data.data) ? data.data : [];
                  // Remove duplicates first
                  const uniqueAll = deduplicateAccounts(all);
                  const live = uniqueAll.filter((acc) => {
                    const platform = (acc.platform || '').toUpperCase();
                    const status = (acc.account_status || '').toLowerCase();
                    const isDemo = !!acc.is_demo; // actually fetchAccounts filters this better now with updated logic
                    // Re-apply the main filter logic to ensure consistency
                    return platform === 'MT5' && (status === '' || status === 'active');
                  });
                  setAccounts(live);
                  const archived = uniqueAll.filter((acc) => {
                    const platform = (acc.platform || '').toUpperCase();
                    const status = (acc.account_status || '').toLowerCase();
                    return platform === 'MT5' && (status === 'inactive' || status === 'suspended' || status === 'disabled');
                  });
                  setArchivedAccounts(archived);
                }
              } catch (error) {
                console.error('Error syncing account:', error);
              } finally {
                setSyncingAccount(null);
              }
            }}
            syncingAccount={syncingAccount}
            title="Live"
          />
        </div>

        {/* Demo Accounts Section */}
        <div className="w-full mt-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
            <h2 className="text-gray-700 text-sm md:text-md font-medium">
              Demo Accounts
            </h2>
            <Link
              to="/user/create-account?mode=demo"
              className="flex items-center justify-center gap-2 border border-gray-300 bg-white px-3 py-1 rounded-md hover:bg-gray-50 transition text-sm sm:text-md"
            >
              <AiOutlinePlus /> Create Demo Account
            </Link>
          </div>

          <AccountsTable
            accounts={accounts.filter(a => a.is_demo)}
            loading={loadingAccounts}
            accountBalances={accountBalances}
            onSync={async (accountNumber) => {
              setSyncingAccount(accountNumber);
              try {
                await fetchAccountBalance(accountNumber);
                const token = authService.getToken();
                const response = await fetch(`${API_BASE_URL}/accounts`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                  const all = Array.isArray(data.data) ? data.data : [];
                  // Remove duplicates first
                  const uniqueAll = deduplicateAccounts(all);
                  const live = uniqueAll.filter((acc) => {
                    const platform = (acc.platform || '').toUpperCase();
                    const status = (acc.account_status || '').toLowerCase();
                    return platform === 'MT5' && (status === '' || status === 'active');
                  });
                  setAccounts(live);
                  const archived = uniqueAll.filter((acc) => {
                    const platform = (acc.platform || '').toUpperCase();
                    const status = (acc.account_status || '').toLowerCase();
                    return platform === 'MT5' && (status === 'inactive' || status === 'suspended' || status === 'disabled');
                  });
                  setArchivedAccounts(archived);
                }
              } catch (error) {
                console.error('Error syncing account:', error);
              } finally {
                setSyncingAccount(null)
              }
            }}
            syncingAccount={syncingAccount}
            title="Demo"
          />
        </div>

        {/* Archive Accounts Section */}
        <div className="w-full mt-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
            <h2 className="text-gray-700 text-sm md:text-md font-medium">
              Archive Accounts
            </h2>
          </div>

          {archivedAccounts.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600" style={{ fontFamily: "Roboto, sans-serif", fontSize: "14px" }}>
                No archived accounts found
              </p>
            </div>
          ) : (

            <AccountsTable
              accounts={archivedAccounts}
              loading={loadingAccounts}
              accountBalances={accountBalances}
              onSync={async (accountNumber) => {
                setSyncingAccount(accountNumber);
                try {
                  await fetchAccountBalance(accountNumber);
                  const token = authService.getToken();
                  const response = await fetch(`${API_BASE_URL}/accounts`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  const data = await response.json();
                  if (data.success) {
                    const all = Array.isArray(data.data) ? data.data : [];
                    // Remove duplicates first
                    const uniqueAll = deduplicateAccounts(all);
                    const active = uniqueAll.filter((acc) => {
                      const platform = (acc.platform || '').toUpperCase();
                      const status = (acc.account_status || '').toLowerCase();
                      return platform === 'MT5' && (status === '' || status === 'active');
                    });
                    setAccounts(active);
                    const archived = uniqueAll.filter((acc) => {
                      const platform = (acc.platform || '').toUpperCase();
                      const status = (acc.account_status || '').toLowerCase();
                      return platform === 'MT5' && (status === 'inactive' || status === 'suspended' || status === 'disabled');
                    });
                    setArchivedAccounts(archived);
                  }
                } catch (error) {
                  console.error('Error syncing account:', error);
                } finally {
                  setSyncingAccount(null);
                }
              }}
              syncingAccount={syncingAccount}
              title="Archive"
            />
          )}
        </div>

        {/* Activity Modal */}
        {activityModalOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3
                  className="text-sm md:text-md font-medium text-gray-900"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  All Activity
                </h3>
                <button
                  onClick={() => setActivityModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {activityList.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-6">
                    No activity found
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-xs font-semibold text-gray-600">
                          Time
                        </th>
                        <th className="px-3 py-2 text-xs font-semibold text-gray-600">
                          Details
                        </th>
                        <th className="px-3 py-2 text-xs font-semibold text-gray-600 text-right">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityList.map((item) => (
                        <tr key={item.id} className="border-b last:border-b-0">
                          <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">
                            {new Date(item.time).toLocaleDateString()}{" "}
                            {new Date(item.time).toLocaleTimeString()}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-800">
                            {item.title}{" "}
                            {item.accountNumber ? `#${item.accountNumber}` : ""}
                          </td>
                          <td className="px-3 py-2 text-xs text-right">
                            <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
                              Success
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Modal Footer / Pagination */}
              <div className="px-4 py-3 border-t flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Page {activityPage} of{" "}
                  {Math.max(1, Math.ceil(activityTotal / 10) || 1)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    className="px-2 py-1 border border-gray-300 rounded disabled:opacity-40"
                    disabled={activityPage <= 1}
                    onClick={() => loadActivityPage(activityPage - 1)}
                  >
                    Prev
                  </button>
                  <button
                    className="px-2 py-1 border border-gray-300 rounded disabled:opacity-40"
                    disabled={activityPage >= Math.ceil(activityTotal / 10)}
                    onClick={() => loadActivityPage(activityPage + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* ================= WALLET ACCOUNTS ================= */}
        <div className="mb-4">
          <h2 className="text-gray-700 text-sm md:text-md font-medium">
            Wallet Accounts
          </h2>
        </div>

        {/* Wallet Card */}
        <div className="bg-white border border-gray-200 rounded-lg w-full p-4 sm:p-6">
          {/* ================= MOBILE LAYOUT ================= */}
          <div className="block sm:hidden">
            {/* Currency + ID */}
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 text-xs font-semibold bg-[#e5f5ea] text-green-700 rounded-md">
                {wallet?.currency || 'USD'}
              </span>
              <span className="text-teal-600 font-semibold text-sm">
                {wallet?.wallet_number || '—'}
              </span>
            </div>

            {/* Balance */}
            <div className="text-gray-600 text-sm mb-3">
              Balance{" "}
              <span className="font-bold text-gray-900">
                {loadingWallet
                  ? '...'
                  : (wallet?.balance != null
                    ? Number(wallet.balance).toFixed(2)
                    : '0.00')}
              </span>
            </div>

            {/* Buttons (stacked like screenshot) */}
            <div className="flex flex-col gap-3">
              <Link
                to="/user/deposits"
                className="
        flex items-center gap-2 
        w-full px-4 py-3 
        text-sm font-medium
        rounded-md border 
        bg-white hover:bg-gray-50 transition
      "
              >
                <RiLoginBoxLine className="text-teal-600 w-5 h-5" />
                <span className="text-gray-900">Deposit</span>
              </Link>

              <Link
                to="/user/transfers"
                className="
        flex items-center gap-2 
        w-full px-4 py-3 
        text-sm font-medium
        rounded-md border 
        bg-white hover:bg-gray-50 transition
      "
              >
                <RiArrowLeftRightLine className="text-gray-600 w-5 h-5" />
                <span className="text-gray-700">Transfer</span>
              </Link>

              <Link
                to="/user/withdrawals"
                className="
        flex items-center gap-2 
        w-full px-4 py-3 
        text-sm font-medium
        rounded-md border 
        bg-white hover:bg-gray-50 transition
      "
              >
                <RiLogoutBoxLine className="text-gray-600 w-5 h-5" />
                <span className="text-gray-700">Withdraw</span>
              </Link>
            </div>
          </div>

          {/* ================= DESKTOP LAYOUT ================= */}
          <div className="hidden sm:flex items-center justify-between gap-6">
            {/* Left: Currency + Wallet ID */}
            <div className="flex items-center gap-3 min-w-max">
              <span className="px-3 py-1 text-xs font-semibold bg-[#e5f5ea] text-green-600 rounded-md">
                {wallet?.currency || 'USD'}
              </span>
              <span className="text-teal-600 font-semibold text-sm md:text-base">
                {wallet?.wallet_number || '—'}
              </span>
            </div>

            {/* Center: Balance */}
            <div className="text-gray-600 text-sm flex-1 text-center">
              Balance{" "}
              <span className="font-bold text-gray-900">
                {loadingWallet
                  ? '...'
                  : (wallet?.balance != null
                    ? Number(wallet.balance).toFixed(2)
                    : '0.00')}
              </span>
            </div>

            {/* Right: Buttons (matches screenshot EXACTLY) */}
            <div className="flex items-center gap-3 min-w-max">
              {/* Deposit (highlighted) */}
              <Link
                to="/user/deposits"
                className="
        flex items-center gap-2 
        border rounded-md px-4 py-2 
        text-sm font-medium 
        hover:bg-gray-50 transition
      "
              >
                <RiLoginBoxLine className="text-teal-600" />
                <span className="text-gray-900">Deposit</span>
              </Link>

              {/* Transfer */}
              <Link
                to="/user/transfers"
                className="
        flex items-center gap-2 
        border rounded-md px-4 py-2 
        text-sm hover:bg-gray-50 transition
      "
              >
                <RiArrowLeftRightLine className="text-gray-600" />
                <span className="text-gray-600">Transfer</span>
              </Link>

              {/* Withdraw */}
              <Link
                to="/user/withdrawals"
                className="
        flex items-center gap-2 
        border rounded-md px-4 py-2 
        text-sm hover:bg-gray-50 transition
      "
              >
                <RiLogoutBoxLine className="text-gray-600" />
                <span className="text-gray-600">Withdraw</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Wallet Modal - 3 Step Flow */}
        {walletModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget && walletModalStep === 3) {
                setWalletModalOpen(false);
                setWalletModalStep(1);
                setWalletFormData({ amount: '', mt5Account: '', direction: 'to-mt5' });
                navigate('/user/transfers');
              }
            }}
          >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Step Indicators */}
              <div className="flex items-center justify-center gap-2 p-4 border-b">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${walletModalStep >= 1 ? 'bg-[#00A896] text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                  1
                </div>
                <div className={`flex-1 h-0.5 ${walletModalStep >= 2 ? 'bg-[#00A896]' : 'bg-gray-200'
                  }`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${walletModalStep >= 2 ? 'bg-[#00A896] text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                  2
                </div>
                <div className={`flex-1 h-0.5 ${walletModalStep >= 3 ? 'bg-[#00A896]' : 'bg-gray-200'
                  }`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${walletModalStep >= 3 ? 'bg-[#00A896] text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                  3
                </div>
              </div>

              {/* Step 1: Details */}
              {walletModalStep === 1 && (
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {walletModalAction === 'deposit' && 'Deposit to Wallet'}
                    {walletModalAction === 'withdraw' && 'Withdraw from Wallet'}
                    {walletModalAction === 'transfer' && 'Internal Transfer'}
                  </h3>

                  {walletModalAction === 'transfer' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transfer Direction
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="to-mt5"
                            checked={walletFormData.direction === 'to-mt5'}
                            onChange={(e) => setWalletFormData({ ...walletFormData, direction: e.target.value })}
                            className="mr-2"
                          />
                          <span className="text-sm">Wallet → MT5</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="from-mt5"
                            checked={walletFormData.direction === 'from-mt5'}
                            onChange={(e) => setWalletFormData({ ...walletFormData, direction: e.target.value })}
                            className="mr-2"
                          />
                          <span className="text-sm">MT5 → Wallet</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {walletModalAction === 'transfer' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        MT5 Account
                      </label>
                      <select
                        value={walletFormData.mt5Account}
                        onChange={(e) => setWalletFormData({ ...walletFormData, mt5Account: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00A896]"
                        required
                      >
                        <option value="">Select MT5 Account</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.account_number}>
                            {acc.account_number} ({acc.platform} {acc.account_type})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={walletFormData.amount}
                      onChange={(e) => setWalletFormData({ ...walletFormData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00A896]"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setWalletModalOpen(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (walletFormData.amount && (walletModalAction !== 'transfer' || walletFormData.mt5Account)) {
                          setWalletModalStep(2);
                        }
                      }}
                      disabled={!walletFormData.amount || (walletModalAction === 'transfer' && !walletFormData.mt5Account)}
                      className="flex-1 px-4 py-2 bg-[#00A896] text-white rounded-md hover:bg-[#008B7A] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Confirmation */}
              {walletModalStep === 2 && (
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Transaction</h3>

                  <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-semibold text-gray-900 capitalize">
                        {walletModalAction === 'deposit' && 'Deposit'}
                        {walletModalAction === 'withdraw' && 'Withdraw'}
                        {walletModalAction === 'transfer' && `Transfer ${walletFormData.direction === 'to-mt5' ? 'Wallet → MT5' : 'MT5 → Wallet'}`}
                      </span>
                    </div>
                    {walletModalAction === 'transfer' && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">MT5 Account:</span>
                        <span className="font-semibold text-gray-900">{walletFormData.mt5Account}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold text-gray-900">${Number(walletFormData.amount).toFixed(2)}</span>
                    </div>
                    {wallet && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Balance:</span>
                        <span className="font-semibold text-gray-900">${Number(wallet.balance).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setWalletModalStep(1)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                    >
                      Back
                    </button>
                    <button
                      onClick={async () => {
                        setWalletSubmitting(true);
                        try {
                          const token = authService.getToken();
                          let response;

                          if (walletModalAction === 'deposit') {
                            response = await fetch(`${API_BASE_URL}/wallet/deposit`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({ amount: parseFloat(walletFormData.amount) })
                            });
                          } else if (walletModalAction === 'withdraw') {
                            response = await fetch(`${API_BASE_URL}/wallet/withdraw`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({ amount: parseFloat(walletFormData.amount) })
                            });
                          } else if (walletModalAction === 'transfer') {
                            const endpoint = walletFormData.direction === 'to-mt5'
                              ? '/wallet/transfer-to-mt5'
                              : '/wallet/transfer-from-mt5';
                            response = await fetch(`${API_BASE_URL}${endpoint}`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({
                                mt5Account: walletFormData.mt5Account,
                                amount: parseFloat(walletFormData.amount)
                              })
                            });
                          }

                          const data = await response.json();
                          if (data.success) {
                            setWalletModalStep(3);
                            // Refresh wallet balance
                            const walletRes = await fetch(`${API_BASE_URL}/wallet`, {
                              headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const walletData = await walletRes.json();
                            if (walletData.success) setWallet(walletData.data);
                          } else {
                            alert(data.message || 'Transaction failed');
                            setWalletSubmitting(false);
                          }
                        } catch (error) {
                          console.error('Transaction error:', error);
                          alert('Transaction failed. Please try again.');
                          setWalletSubmitting(false);
                        }
                      }}
                      disabled={walletSubmitting}
                      className="flex-1 px-4 py-2 bg-[#00A896] text-white rounded-md hover:bg-[#008B7A] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {walletSubmitting ? 'Processing...' : 'Confirm'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirmed */}
              {walletModalStep === 3 && (
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Transaction Confirmed</h3>
                  <p className="text-gray-600 mb-6">
                    Your {walletModalAction} of ${Number(walletFormData.amount).toFixed(2)} has been processed successfully.
                  </p>
                  <button
                    onClick={() => {
                      setWalletModalOpen(false);
                      setWalletModalStep(1);
                      setWalletFormData({ amount: '', mt5Account: '', direction: 'to-mt5' });
                      navigate('/user/transfers');
                    }}
                    className="w-full px-4 py-2 bg-[#00A896] text-white rounded-md hover:bg-[#008B7A] transition"
                  >
                    View Transfers
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
