import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, ArrowLeft, Clock, Loader } from 'lucide-react';
import authService from '../../../services/auth.js';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function CregisUSDTTRC20() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [timeLeft, setTimeLeft] = useState(59 * 60 + 59); // 59:59 in seconds
  const [paymentStatus, setPaymentStatus] = useState('pending');

  const [formData, setFormData] = useState({
    amount: '',
    deposit_to: 'mt5',
    mt5_account_id: ''
  });

  const [mt5Accounts, setMt5Accounts] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [depositId, setDepositId] = useState(null);
  const [accountBalances, setAccountBalances] = useState({}); // { accountNumber: { balance, equity, margin, credit, leverage } }
  const [syncingBalance, setSyncingBalance] = useState(null); // accountNumber being synced
  const [logoUrl, setLogoUrl] = useState('/tether.svg'); // Default logo
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [amountError, setAmountError] = useState('');

  useEffect(() => {
    fetchAccounts();
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/deposits/gateways`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.gateways) {
          // Find USDT TRC20 gateway logo
          const usdtGateway = data.gateways.find(g =>
            g.name?.toLowerCase().includes('usdt') &&
            (g.name?.toLowerCase().includes('trc20') || g.type === 'crypto')
          );
          if (usdtGateway?.icon_url) {
            setLogoUrl(usdtGateway.icon_url);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching logo:', error);
    }
  };

  // Fetch balance when MT5 account is selected
  useEffect(() => {
    if (formData.deposit_to === 'mt5' && formData.mt5_account_id) {
      fetchAccountBalance(formData.mt5_account_id);
    }
  }, [formData.deposit_to, formData.mt5_account_id]);

  // Get selected account limits (accounting for current balance)
  const getSelectedAccountLimits = () => {
    if (formData.deposit_to === 'mt5' && formData.mt5_account_id) {
      const selectedAccount = mt5Accounts.find(acc => acc.account_number === formData.mt5_account_id);
      if (selectedAccount) {
        const currentBalance = parseFloat(selectedAccount.balance || 0);
        const maxDepositLimit = selectedAccount.maximum_deposit !== null && selectedAccount.maximum_deposit !== undefined 
          ? parseFloat(selectedAccount.maximum_deposit) 
          : null;
        
        // Effective max is the maximum deposit limit minus current balance
        // If max is 3000 and balance is 900, user can only deposit 2100
        let effectiveMax = maxDepositLimit;
        if (maxDepositLimit !== null && currentBalance > 0) {
          effectiveMax = Math.max(0, maxDepositLimit - currentBalance);
        }
        
        return {
          min: selectedAccount.minimum_deposit !== null && selectedAccount.minimum_deposit !== undefined 
            ? parseFloat(selectedAccount.minimum_deposit) 
            : null,
          max: effectiveMax,
          maxLimit: maxDepositLimit, // Store original max limit for display
          currentBalance: currentBalance
        };
      }
    }
    return { min: null, max: null, maxLimit: null, currentBalance: 0 };
  };

  // Format limits for display (shows effective max after accounting for balance)
  const formatLimits = () => {
    const limits = getSelectedAccountLimits();
    if (limits.min === null && limits.max === null) {
      return 'No limits set';
    }
    const min = limits.min !== null && limits.min !== undefined ? limits.min : 0;
    if (limits.max === null) {
      return `$${min.toFixed(2)} - No maximum`;
    }
    return `$${min.toFixed(2)} - $${limits.max.toFixed(2)}`;
  };

  // Validate amount
  useEffect(() => {
    if (!formData.amount || formData.amount === '') {
      setAmountError('');
      return;
    }

    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setAmountError('Please enter a valid amount');
      return;
    }

    const limits = getSelectedAccountLimits();
    if (limits.min !== null && amountNum < limits.min) {
      setAmountError(`Minimum deposit is $${limits.min.toFixed(2)}`);
      return;
    }

    if (limits.max !== null && amountNum > limits.max) {
      if (limits.maxLimit !== null && limits.currentBalance > 0) {
        setAmountError(`Maximum deposit is $${limits.max.toFixed(2)} (account balance + deposit cannot exceed $${limits.maxLimit.toFixed(2)})`);
      } else {
        setAmountError(`Only allowed to deposit $${limits.max.toFixed(2)}`);
      }
      return;
    }

    setAmountError('');
  }, [formData.amount, formData.deposit_to, formData.mt5_account_id, mt5Accounts]);

  // Cancel deposit request
  const handleCancelDeposit = async (reason = 'user') => {
    if (!depositId) return;

    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/deposits/${depositId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log(`Deposit #${depositId} cancelled: ${reason}`);
          if (reason === 'expired') {
            setPaymentStatus('expired');
          }
        }
      }
    } catch (error) {
      console.error('Error cancelling deposit:', error);
    }
  };

  useEffect(() => {
    if (step === 3 && depositId && paymentData) {
      // Start countdown timer
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Timer expired - cancel the deposit
            handleCancelDeposit('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Start polling for payment status
      startStatusPolling();

      // Handle browser close/refresh warning
      const handleBeforeUnload = (e) => {
        if (paymentStatus === 'pending' || paymentStatus === 'new') {
          e.preventDefault();
          e.returnValue = 'Closing this window will cancel the transaction. Are you sure?';
          return e.returnValue;
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        clearInterval(timer);
        setPolling(false);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [step, depositId, paymentData, paymentStatus]);

  // Handle navigation away during payment
  const handleNavigation = (targetPath) => {
    if (step === 3 && depositId && (paymentStatus === 'pending' || paymentStatus === 'new')) {
      setPendingNavigation(targetPath);
      setShowCancelModal(true);
      return false;
    }
    return true;
  };

  // Confirm cancel and navigate
  const handleConfirmCancel = async () => {
    await handleCancelDeposit('user');
    setShowCancelModal(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    } else {
      navigate('/user/deposits');
    }
  };

  // Cancel the cancel action
  const handleCancelCancel = () => {
    setShowCancelModal(false);
    setPendingNavigation(null);
  };

  // Fetch balance for a specific account from MT5 API
  const fetchAccountBalance = async (accountNumber) => {
    try {
      const token = authService.getToken();
      if (!token) return;

      setSyncingBalance(accountNumber);
      const response = await fetch(`${API_BASE_URL}/accounts/${accountNumber}/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success && data.data) {
        setAccountBalances(prev => ({
          ...prev,
          [accountNumber]: data.data
        }));
        return data.data;
      }
    } catch (error) {
      console.error(`Error fetching balance for account ${accountNumber}:`, error);
    } finally {
      setSyncingBalance(null);
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

  const fetchAccounts = async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch wallet
      const walletRes = await fetch(`${API_BASE_URL}/wallet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        if (walletData.success) {
          setWallet(walletData.data);
        }
      }

      // Fetch MT5 accounts
      const accountsRes = await fetch(`${API_BASE_URL}/accounts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        if (accountsData.success) {
          const all = Array.isArray(accountsData.data) ? accountsData.data : [];
          const live = all.filter((acc) => {
            const platform = (acc.platform || '').toUpperCase();
            const status = (acc.account_status || '').toLowerCase();
            const isDemo = !!acc.is_demo;
            return platform === 'MT5' && !isDemo && (status === '' || status === 'active');
          });
          setMt5Accounts(live);

          // Fetch balances for all accounts
          if (live.length > 0) {
            await fetchAllAccountBalances(live);
          }

          // Auto-select first account if available
          if (live.length > 0 && !formData.mt5_account_id) {
            setFormData(prev => ({ ...prev, mt5_account_id: live[0].account_number }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (amountError) {
      alert(amountError);
      return;
    }

    if (formData.deposit_to === 'mt5' && !formData.mt5_account_id) {
      alert('Please select an MT5 account');
      return;
    }

    setStep(2);
  };

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      const token = authService.getToken();

      const response = await fetch(`${API_BASE_URL}/deposits/cregis/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          currency: 'USDT',
          deposit_to: formData.deposit_to,
          mt5_account_id: formData.deposit_to === 'mt5' ? formData.mt5_account_id : null,
          wallet_number: formData.deposit_to === 'wallet' && wallet ? wallet.wallet_number : null
        })
      });

      const responseData = await response.json().catch(() => ({}));

      if (response.ok) {
        if (responseData.success) {
          setDepositId(responseData.data.depositId);
          setPaymentData(responseData.data);
          setStep(3);
          setTimeLeft(59 * 60 + 59); // Reset timer
        } else {
          throw new Error(responseData.error || responseData.message || 'Failed to create payment');
        }
      } else {
        const errorMessage = responseData.error || responseData.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('Payment creation failed:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      const errorMessage = error.message || 'Failed to create payment. Please try again.';
      alert(`Payment Error: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const startStatusPolling = () => {
    if (!depositId || polling) return;

    setPolling(true);
    const pollInterval = setInterval(async () => {
      try {
        const token = authService.getToken();
        const response = await fetch(`${API_BASE_URL}/deposits/cregis/status/${depositId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const status = data.data.cregisStatus;
            setPaymentStatus(status);

            // If payment is approved/completed, stop polling
            if (status === 'paid' || status === 'completed' || status === 'success') {
              clearInterval(pollInterval);
              setPolling(false);
            }
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 1 hour
    setTimeout(() => {
      clearInterval(pollInterval);
      setPolling(false);
    }, 60 * 60 * 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => {
            if (step === 3 && depositId && (paymentStatus === 'pending' || paymentStatus === 'new')) {
              handleNavigation('/user/deposits');
            } else {
              navigate('/user/deposits');
            }
          }}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Deposits</span>
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <img src={logoUrl} alt="USDT TRC20" className="w-12 h-12 rounded-lg" />
            <h1 className="text-2xl font-semibold">USDT TRC20 Deposit</h1>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-2">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-700' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-dark-base' : 'bg-gray-200'}`}>
                {step > 1 ? <CheckCircle className="w-6 h-6" /> : '1'}
              </div>
              <span className="ml-2 text-sm font-medium">Account & Amount</span>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
            <div className={`flex items-center ${step >= 2 ? 'text-blue-700' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-dark-base' : 'bg-gray-200'}`}>
                {step > 2 ? <CheckCircle className="w-6 h-6" /> : '2'}
              </div>
              <span className="ml-2 text-sm font-medium">Confirmation</span>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
            <div className={`flex items-center ${step >= 3 ? 'text-blue-700' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-dark-base' : 'bg-gray-200'}`}>
                {step >= 3 ? <CheckCircle className="w-6 h-6" /> : '3'}
              </div>
              <span className="ml-2 text-sm font-medium">Payment</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          {/* Step 1: Account & Amount */}
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Deposit To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit To *
                </label>
                <div className="space-y-3">
                  <div
                    onClick={() => setFormData({ ...formData, deposit_to: 'wallet', mt5_account_id: '' })}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.deposit_to === 'wallet'
                        ? 'border-blue-600 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.deposit_to === 'wallet'
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-gray-300'
                          }`}>
                          {formData.deposit_to === 'wallet' && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            Wallet {wallet && `(${wallet.wallet_number})`}
                          </div>
                          {wallet && (
                            <div className="text-sm text-gray-600">
                              Balance: {wallet.currency} {parseFloat(wallet.balance || 0).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        MT5 Account
                      </label>
                      {formData.deposit_to === 'mt5' && formData.mt5_account_id && (
                        <button
                          type="button"
                          onClick={() => fetchAccountBalance(formData.mt5_account_id)}
                          disabled={syncingBalance === formData.mt5_account_id}
                          className="flex items-center gap-1 text-xs text-blue-700 hover:text-brand-700 disabled:opacity-50"
                          title="Refresh balance"
                        >
                          {syncingBalance === formData.mt5_account_id ? (
                            <>
                              <Loader className="w-3 h-3 animate-spin" />
                              <span>Syncing...</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>Refresh Balance</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <div
                      onClick={() => {
                        if (formData.deposit_to !== 'mt5') {
                          setFormData({ ...formData, deposit_to: 'mt5' });
                        }
                      }}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.deposit_to === 'mt5'
                          ? 'border-blue-600 bg-brand-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.deposit_to === 'mt5'
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-gray-300'
                          }`}>
                          {formData.deposit_to === 'mt5' && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div className="font-medium text-gray-900">MT5 Account</div>
                      </div>
                      <select
                        value={formData.deposit_to === 'mt5' ? formData.mt5_account_id : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            setFormData({ ...formData, deposit_to: 'mt5', mt5_account_id: e.target.value });
                            // Fetch balance for selected account
                            fetchAccountBalance(e.target.value);
                          } else {
                            setFormData({ ...formData, deposit_to: 'wallet', mt5_account_id: '' });
                          }
                        }}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-brand-200 outline-none transition-all bg-white"
                      >
                        <option value="">Select MT5 Account</option>
                        {mt5Accounts.map((account) => {
                          const balance = accountBalances[account.account_number];
                          const displayBalance = balance ? parseFloat(balance.balance || 0).toFixed(2) : parseFloat(account.balance || 0).toFixed(2);
                          const currency = account.currency || 'USD';
                          return (
                            <option key={account.id} value={account.account_number}>
                              {account.account_number} | {account.account_type || 'standard'} | Balance: {currency} {displayBalance}
                            </option>
                          );
                        })}
                      </select>
                      {/* Show limits immediately when account is selected */}
                      {formData.deposit_to === 'mt5' && formData.mt5_account_id && (() => {
                        const selectedAccount = mt5Accounts.find(acc => acc.account_number === formData.mt5_account_id);
                        if (selectedAccount) {
                          const limits = getSelectedAccountLimits();
                          // Always show limits if they exist (even if 0)
                          if (selectedAccount.minimum_deposit !== null && selectedAccount.minimum_deposit !== undefined || 
                              selectedAccount.maximum_deposit !== null && selectedAccount.maximum_deposit !== undefined) {
                            return (
                              <p className="mt-2 text-xs text-gray-500">
                                Deposit limits: {limits.min !== null ? `$${limits.min.toFixed(2)}` : '$0.00'} - {limits.max !== null ? `$${limits.max.toFixed(2)}` : 'No maximum'}
                                {limits.maxLimit !== null && limits.currentBalance > 0 && (
                                  <span className="block mt-1 text-xs text-gray-400">
                                    (Max balance: ${limits.maxLimit.toFixed(2)}, Current: ${limits.currentBalance.toFixed(2)})
                                  </span>
                                )}
                              </p>
                            );
                          }
                        }
                        return null;
                      })()}
                      {formData.deposit_to === 'mt5' && formData.mt5_account_id && accountBalances[formData.mt5_account_id] && (() => {
                        const selectedAccount = mt5Accounts.find(acc => acc.account_number === formData.mt5_account_id);
                        const balance = accountBalances[formData.mt5_account_id];
                        const currency = balance.currency || selectedAccount?.currency || 'USD';
                        return (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-gray-600">Balance:</span>
                                <span className="ml-2 font-medium">{currency} {parseFloat(balance.balance || 0).toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Equity:</span>
                                <span className="ml-2 font-medium">{currency} {parseFloat(balance.equity || 0).toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Leverage:</span>
                                <span className="ml-2 font-medium">{balance.leverage || selectedAccount?.leverage || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Margin:</span>
                                <span className="ml-2 font-medium">{currency} {parseFloat(balance.margin || 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                      {mt5Accounts.length === 0 && (
                        <p className="mt-2 text-sm text-gray-500 italic">No MT5 accounts available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Deposit Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Amount (USDT) *
                </label>
                {formData.deposit_to === 'mt5' && formData.mt5_account_id ? (
                  <p className="text-gray-500 text-sm mb-2">
                    Transaction limit: {formatLimits()}
                  </p>
                ) : (
                  <p className="text-gray-500 text-sm mb-2">
                    Transaction limit: No limits set
                  </p>
                )}
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${
                    amountError 
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-brand-200'
                  }`}
                  placeholder="0.00"
                  required
                />
                {amountError && (
                  <p className="text-red-600 text-sm mt-2">{amountError}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!!amountError || !formData.amount || parseFloat(formData.amount) <= 0}
                className={`w-full py-3 rounded-xl font-medium transition-colors shadow-lg hover:shadow-xl ${
                  amountError || !formData.amount || parseFloat(formData.amount) <= 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-dark-base hover:bg-blue-700'
                }`}
              >
                Continue
              </button>
            </form>
          )}

          {/* Step 2: Confirmation */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Confirm Deposit</h3>
                <p className="text-gray-600">Please review your deposit details</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">USDT TRC20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Deposit To:</span>
                  <span className="font-medium">
                    {formData.deposit_to === 'wallet'
                      ? `Wallet ${wallet ? `(${wallet.wallet_number})` : ''}`
                      : `MT5 Account ${formData.mt5_account_id}`
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{formData.amount} USDT</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-dark-base py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating Payment...' : 'Confirm & Create Payment'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && paymentData && (
            <div className="space-y-6 text-center">
              {paymentStatus === 'paid' || paymentStatus === 'paid_over' ? (
                <>
                  <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
                  <h3 className="text-2xl font-semibold mb-2">Payment Successful!</h3>
                  <p className="text-gray-600 mb-6">
                    Your deposit has been confirmed and the funds have been added to your account.
                  </p>
                  <button
                    onClick={() => navigate('/user/dashboard')}
                    className="bg-blue-600 text-dark-base px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                  >
                    Go to Dashboard
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Clock className="w-6 h-6 text-blue-700" />
                    <span className="text-2xl font-mono font-semibold text-blue-700">
                      {formatTime(timeLeft)}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold mb-2">Complete Your Payment</h3>
                  <p className="text-gray-600 mb-6">
                    Please complete the payment using the QR code or payment link below. This page will automatically update when payment is confirmed.
                  </p>

                  {/* Payment Address and QR Code */}
                  {paymentData.paymentAddress && (
                    <div className="flex justify-center mb-6">
                      <div className="bg-white p-4 rounded-xl border-4 border-gray-100 shadow-sm">
                        <img
                          src={paymentData.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentData.paymentAddress)}`}
                          alt="Payment QR Code"
                          className="w-64 h-64"
                        />
                      </div>
                    </div>
                  )}

                  {/* Payment Address */}
                  {paymentData.paymentAddress && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <p className="text-sm text-gray-600 mb-2">Send USDT TRC20 to this address:</p>
                      <div className="flex items-center gap-2">
                        <code className="text-blue-700 font-mono text-sm break-all flex-1">
                          {paymentData.paymentAddress}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(paymentData.paymentAddress);
                            alert('Address copied to clipboard!');
                          }}
                          className="px-3 py-1 bg-blue-600 text-dark-base rounded text-sm hover:bg-blue-700"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Checkout URL */}
                  {paymentData.checkoutUrl && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <p className="text-sm text-gray-600 mb-2">Or open checkout page:</p>
                      <a
                        href={paymentData.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:text-brand-700 underline break-all"
                      >
                        {paymentData.checkoutUrl}
                      </a>
                    </div>
                  )}

                  {/* Payment Details */}
                  <div className="bg-gray-50 rounded-xl p-6 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">{paymentData.amount} {paymentData.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium flex items-center gap-2">
                        {polling && <Loader className="w-4 h-4 animate-spin" />}
                        {paymentStatus === 'pending' ? 'Pending Payment' : paymentStatus}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mt-4">
                    Waiting for payment confirmation... This page will update automatically.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Cancel Transaction?</h3>
            <p className="text-gray-600 mb-6">
              Closing this window will cancel the transaction. Are you sure you want to proceed?
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleCancelCancel}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                Continue Payment
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Cancel Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expired Payment Message */}
      {paymentStatus === 'expired' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4 text-red-600">Payment Expired</h3>
            <p className="text-gray-600 mb-6">
              The payment time has expired. The transaction has been cancelled.
            </p>
            <button
              onClick={() => {
                setPaymentStatus('pending');
                navigate('/user/deposits');
              }}
              className="w-full bg-blue-600 text-dark-base py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Back to Deposits
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CregisUSDTTRC20;

