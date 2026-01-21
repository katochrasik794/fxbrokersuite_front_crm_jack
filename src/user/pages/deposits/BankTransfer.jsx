import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import authService from '../../../services/auth.js'

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function BankTransfer() {
  const navigate = useNavigate();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedAccountType, setSelectedAccountType] = useState('mt5'); // 'mt5' or 'wallet'
  const [amount, setAmount] = useState('')
  const [mt5Accounts, setMt5Accounts] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [amountError, setAmountError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
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

          // Auto-select first account if available
          if (live.length > 0 && !selectedAccount) {
            setSelectedAccount(live[0]);
            setSelectedAccountType('mt5');
          } else if (wallet && !selectedAccount) {
            setSelectedAccountType('wallet');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get selected account limits (accounting for current balance)
  const getSelectedAccountLimits = () => {
    if (selectedAccountType === 'mt5' && selectedAccount) {
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
      
      // Limits calculated successfully
      
      return {
        min: selectedAccount.minimum_deposit !== null && selectedAccount.minimum_deposit !== undefined 
          ? parseFloat(selectedAccount.minimum_deposit) 
          : null,
        max: effectiveMax,
        maxLimit: maxDepositLimit, // Store original max limit for display
        currentBalance: currentBalance
      };
    }
    return { min: null, max: null, maxLimit: null, currentBalance: 0 };
  };

  // Validate amount
  useEffect(() => {
    if (!amount || amount === '') {
      setAmountError('');
      return;
    }

    const amountNum = parseFloat(amount);
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
  }, [amount, selectedAccount, selectedAccountType]);

  const formatLimits = () => {
    const limits = getSelectedAccountLimits();
    // Always show limits, even if they're 0 or null - default to 0 for min
    const min = limits.min !== null && limits.min !== undefined ? limits.min : 0;
    const max = limits.max !== null && limits.max !== undefined ? limits.max : null;
    
    if (max === null) {
      return `$${min.toFixed(2)} - No maximum`;
    }
    return `$${min.toFixed(2)} - $${max.toFixed(2)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (amountError) {
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setAmountError('Please enter a valid amount');
      return;
    }

    if (selectedAccountType === 'mt5' && !selectedAccount) {
      alert('Please select an MT5 account');
      return;
    }

    // TODO: Implement form submission
    console.log('Submit deposit:', {
      amount,
      deposit_to: selectedAccountType,
      mt5_account_id: selectedAccountType === 'mt5' ? selectedAccount?.account_number : null,
      wallet_number: selectedAccountType === 'wallet' ? wallet?.wallet_number : null
    });
  };

  if (loading) {
    return (
      <div className="w-full max-w-8xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-600">Loading accounts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-8xl mx-auto ">
      <div className="bg-gray-50 min-h-screen p-4 sm:p-6">

        {/* LEFT-ALIGNED HEADER + OFFER AREA */}
        <div className="w-full max-w-3xl">

          {/* HEADER */}
          <div className="mb-6">
            <Link
              to="/user/deposits"
              className="inline-flex items-center text-[#00A896] hover:text-[#008f7a] mb-2 block"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>

            <h1
              style={{ fontFamily: 'Roboto, sans-serif', fontSize: '26px', color: '#000', fontWeight: '400' }}
            >
              Deposit with Bank Transfer
            </h1>
          </div>


          {/* OFFER BANNER (LEFT ALIGNED) */}
          <div className="bg-[#00A896] text-white rounded-lg px-5 py-4 mb-6 flex items-center shadow-sm">
            <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
              />
            </svg>
            <p className="text-sm leading-snug" style={{ fontFamily: 'Roboto, sans-serif' }}>
              Deposit $100 or more to receive a complimentary 30% bonus credit
            </p>
          </div>
        </div>



        {/* ACCOUNT SELECT */}
        <div className="bg-white rounded-lg p-5 mb-6 border border-gray-200 shadow-sm">
          <h2 className="mb-1" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '18px', fontWeight: '400' }}>
            Deposit to account
          </h2>

          <p className="text-gray-600 mb-4 text-sm">
            Choose a trading account or wallet for your deposit your money
          </p>

          <div className="space-y-4">
            {/* MT5 Accounts */}
            {mt5Accounts.map((account) => {
              const isSelected = selectedAccountType === 'mt5' && selectedAccount?.account_number === account.account_number;
              // Always show limits if account has limit fields (even if 0 or null)
              const hasLimits = account.hasOwnProperty('minimum_deposit') || account.hasOwnProperty('maximum_deposit');
              const limits = hasLimits
                ? (() => {
                    const currentBalance = parseFloat(account.balance || 0);
                    const maxDepositLimit = account.maximum_deposit !== null && account.maximum_deposit !== undefined 
                      ? parseFloat(account.maximum_deposit) 
                      : null;
                    const effectiveMax = maxDepositLimit !== null && currentBalance > 0 
                      ? Math.max(0, maxDepositLimit - currentBalance) 
                      : maxDepositLimit;
                    const min = account.minimum_deposit !== null && account.minimum_deposit !== undefined 
                      ? parseFloat(account.minimum_deposit) 
                      : 0;
                    
                    return `Deposit limits: $${min.toFixed(2)} - ${effectiveMax !== null ? `$${effectiveMax.toFixed(2)}` : 'No maximum'}`;
                  })()
                : null;

              return (
                <div
                  key={account.account_number}
                  onClick={() => {
                    setSelectedAccount(account);
                    setSelectedAccountType('mt5');
                  }}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${isSelected
                      ? 'border-[#00A896] bg-gray-50'
                      : 'border-gray-300'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                          {account.currency || 'USD'}
                        </span>
                        <span className="text-lg" style={{ fontFamily: 'Roboto' }}>{account.account_number}</span>
                      </div>

                      <p className="text-gray-600 text-sm">{account.account_type || 'MT5 Standard'}</p>
                      <p className="text-gray-600 text-sm">Balance: {account.currency || 'USD'} {parseFloat(account.balance || 0).toFixed(2)}</p>
                      {limits && (
                        <p className="text-gray-500 text-xs mt-1">{limits}</p>
                      )}
                    </div>

                    {isSelected ? (
                      <svg className="w-6 h-6 text-[#00A896]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Wallet Account */}
            {wallet && (
              <div
                onClick={() => {
                  setSelectedAccount(wallet);
                  setSelectedAccountType('wallet');
                }}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedAccountType === 'wallet'
                    ? 'border-[#00A896] bg-gray-50'
                    : 'border-gray-300'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                        {wallet.currency || 'USD'}
                      </span>
                      <span className="text-lg" style={{ fontFamily: 'Roboto' }}>{wallet.wallet_number}</span>
                    </div>

                    <p className="text-gray-600 text-sm">Wallet</p>
                    <p className="text-gray-600 text-sm">Balance: {wallet.currency || 'USD'} {parseFloat(wallet.balance || 0).toFixed(2)}</p>
                  </div>

                  {selectedAccountType === 'wallet' ? (
                    <svg className="w-6 h-6 text-[#00A896]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                  )}
                </div>
              </div>
            )}

            {mt5Accounts.length === 0 && !wallet && (
              <p className="text-gray-500 text-sm italic">No accounts available</p>
            )}
          </div>
        </div>

        {/* DEPOSIT AMOUNT */}
        <div className="bg-white rounded-lg p-5 mb-6 border border-gray-200 shadow-sm">
          <h2 className="mb-1" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '18px', fontWeight: '400' }}>
            Deposit amount
          </h2>

          <p className="text-gray-600 text-sm mb-4">
            {selectedAccountType === 'mt5' && selectedAccount ? (
              <>Transaction limit: {formatLimits()}</>
            ) : (
              <>Transaction limit: No limits set</>
            )}
          </p>

          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden mb-2">
            <div className="flex items-center px-3 py-2 border-r border-gray-300 bg-gray-50">
              <span className="mr-2 text-sm">USD</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`flex-1 px-4 py-2 outline-none text-lg ${amountError ? 'border-red-500' : ''}`}
              placeholder="0.00"
            />
          </div>

          {amountError && (
            <p className="text-red-600 text-sm mb-2">{amountError}</p>
          )}

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setAmount('100')}
              className="py-3 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              USD 100
            </button>

            <button
              type="button"
              onClick={() => setAmount('150')}
              className="py-3 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              USD 150
            </button>

            <button
              type="button"
              onClick={() => setAmount('200')}
              className="py-3 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              USD 200
            </button>
          </div>
        </div>

        {/* BANK TRANSFER BUTTON (CENTERED FULL WIDTH) */}
        <div className="flex justify-center"  >
          <button
            onClick={handleSubmit}
            disabled={!!amountError || !amount || parseFloat(amount) <= 0}
            className="max-w-4xl w-full bg-brand-500 text-dark-base py-4 rounded-lg flex items-center justify-center hover:bg-brand-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Continue with Bank Transfer
          </button>
        </div>
      </div>
    </div>
  )
}

export default BankTransfer
