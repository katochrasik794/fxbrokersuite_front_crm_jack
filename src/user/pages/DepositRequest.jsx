import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Copy, Check, Upload, ArrowLeft } from 'lucide-react';
import authService from '../../services/auth.js';
import Swal from 'sweetalert2';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL?.replace('/api', '') || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

function DepositRequest() {
  const navigate = useNavigate();
  const { gatewayId } = useParams();
  const [searchParams] = useSearchParams();
  const step = parseInt(searchParams.get('step') || '1');

  const [gateway, setGateway] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    amount: '',
    transaction_hash: '',
    proof: null,
    deposit_to: 'wallet',
    mt5_account_id: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [userCountry, setUserCountry] = useState(null);
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [mt5Accounts, setMt5Accounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [amountError, setAmountError] = useState('');

  useEffect(() => {
    if (gatewayId) {
      fetchGateway();
      fetchUserCountry();
      fetchWalletAndAccounts();
    }
  }, [gatewayId]);

  const fetchUserCountry = async () => {
    try {
      const userData = authService.getUserData();
      if (userData && userData.country) {
        setUserCountry(userData.country);
      }
    } catch (error) {
      console.error('Error fetching user country:', error);
    }
  };

  const fetchGateway = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/deposits/gateways`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const foundGateway = data.gateways.find(g => g.id === parseInt(gatewayId));
          if (foundGateway) {
            setGateway(foundGateway);
          } else {
            Swal.fire({ icon: 'error', title: 'Gateway Not Found', text: 'The selected payment gateway was not found' });
            navigate('/user/deposits');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching gateway:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load payment gateway' });
      navigate('/user/deposits');
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletAndAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const token = authService.getToken();
      if (!token) return;

      const walletRes = await fetch(`${API_BASE_URL}/wallet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        if (walletData.success) {
          setWallet(walletData.data);
        }
      }

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
          
          // Debug: log accounts with limits
          console.log('DepositRequest - Fetched accounts with limits:', live.map(acc => ({
            account_number: acc.account_number,
            account_type: acc.account_type,
            minimum_deposit: acc.minimum_deposit,
            maximum_deposit: acc.maximum_deposit
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching wallet/accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const convertCurrency = (amount, fromCurrency = 'USD', toCurrency = 'USD') => {
    if (!amount || !toCurrency || fromCurrency === toCurrency) return null;

    const rates = {
      'USD': 1,
      'EUR': 0.92,
      'GBP': 0.79,
      'INR': 83.0,
      'AED': 3.67,
      'JPY': 150.0
    };

    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;
    const converted = (parseFloat(amount) * toRate) / fromRate;

    return {
      amount: converted.toFixed(2),
      currency: toCurrency
    };
  };

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
    const min = limits.min !== null && limits.min !== undefined ? limits.min : 0;
    const max = limits.max !== null && limits.max !== undefined ? limits.max : null;
    
    if (max === null) {
      return `$${min.toFixed(2)} - No maximum`;
    }
    return `$${min.toFixed(2)} - $${max.toFixed(2)}`;
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

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, amount: value });

    if (value && userCountry) {
      const countryCurrencyMap = {
        'United States': 'USD',
        'United Kingdom': 'GBP',
        'India': 'INR',
        'United Arab Emirates': 'AED',
        'Japan': 'JPY'
      };
      const nativeCurrency = countryCurrencyMap[userCountry] || 'USD';
      const conversion = convertCurrency(value, 'USD', nativeCurrency);
      setConvertedAmount(conversion);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({ icon: 'error', title: 'File too large', text: 'File size must be less than 5MB' });
        return;
      }
      setFormData({ ...formData, proof: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Please enter deposit amount' });
      return;
    }

    if (amountError) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: amountError });
      return;
    }

    if (formData.deposit_to === 'mt5' && !formData.mt5_account_id) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Please select an MT5 account' });
      return;
    }

    navigate(`/user/deposits/${gatewayId}?step=2`);
  };

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      const token = authService.getToken();

      const formDataToSend = new FormData();
      formDataToSend.append('gateway_id', gateway.id);
      formDataToSend.append('amount', formData.amount);
      formDataToSend.append('currency', 'USD');
      formDataToSend.append('deposit_to', formData.deposit_to);

      // Always send mt5_account_id if deposit_to is mt5
      if (formData.deposit_to === 'mt5') {
        if (formData.mt5_account_id) {
          formDataToSend.append('mt5_account_id', formData.mt5_account_id);
          console.log('Sending mt5_account_id:', formData.mt5_account_id);
        } else {
          console.error('MT5 account ID is missing!');
        }
      }

      // Always send wallet_number if deposit_to is wallet
      if (formData.deposit_to === 'wallet') {
        if (wallet && wallet.wallet_number) {
          formDataToSend.append('wallet_number', wallet.wallet_number);
          console.log('Sending wallet_number:', wallet.wallet_number);
        } else if (wallet && wallet.id) {
          // Fallback: if wallet_number not available, send wallet_id
          formDataToSend.append('wallet_id', wallet.id.toString());
          console.log('Sending wallet_id (fallback):', wallet.id);
        } else {
          console.error('Wallet ID and wallet_number are missing!', { wallet });
        }
      }

      console.log('FormData being sent:', {
        deposit_to: formData.deposit_to,
        mt5_account_id: formData.deposit_to === 'mt5' ? formData.mt5_account_id : 'N/A',
        wallet_id: formData.deposit_to === 'wallet' ? (wallet?.id || 'N/A') : 'N/A',
        wallet_number: formData.deposit_to === 'wallet' ? (wallet?.wallet_number || 'N/A') : 'N/A'
      });
      if (convertedAmount) {
        formDataToSend.append('converted_amount', convertedAmount.amount);
        formDataToSend.append('converted_currency', convertedAmount.currency);
      }
      if (formData.transaction_hash) {
        formDataToSend.append('transaction_hash', formData.transaction_hash);
      }
      if (formData.proof) {
        formDataToSend.append('proof', formData.proof);
      }

      // Ensure API_BASE_URL doesn't have trailing slash
      const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const requestUrl = `${apiUrl}/deposits/request`;

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          navigate(`/user/deposits/${gatewayId}?step=3`);
        } else {
          throw new Error(data.error || 'Failed to submit deposit request');
        }
      } else {
        // Handle 401 specifically
        if (response.status === 401) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || errorData.error || 'Authentication failed. Please log in again.';
          // Clear token and redirect to login if token is invalid/expired
          if (errorMessage.includes('expired') || errorMessage.includes('Invalid token') || errorMessage.includes('No token')) {
            authService.logout();
            Swal.fire({ 
              icon: 'error', 
              title: 'Session Expired', 
              text: 'Your session has expired. Please log in again.',
              confirmButtonText: 'Go to Login'
            }).then(() => {
              window.location.href = '/login';
            });
            return;
          }
          throw new Error(errorMessage);
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to submit deposit request');
      }
    } catch (error) {
      console.error('Error submitting deposit:', error);
      Swal.fire({ icon: 'error', title: 'Submission Failed', text: error.message || 'Failed to submit deposit request' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccess = () => {
    navigate('/user/reports');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!gateway) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/user/deposits')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Deposits</span>
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            {gateway.icon_url && (
              <img src={gateway.icon_url} alt={gateway.name} className="w-12 h-12 rounded-lg" />
            )}
            <h1 className="text-2xl font-semibold">{gateway.name}</h1>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-2">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-700' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-dark-base' : 'bg-gray-200'}`}>
                {step > 1 ? <CheckCircle className="w-6 h-6" /> : '1'}
              </div>
              <span className="ml-2 text-sm font-medium">Details</span>
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
              <span className="ml-2 text-sm font-medium">Confirmed</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Bank Details / Crypto Address */}
              {(gateway.type === 'wire' || gateway.type === 'crypto') && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Details</h3>
                  <div className="space-y-2">
                    {gateway.type === 'wire' && (
                      <>
                        {gateway.bank_name && (
                          <div className="flex items-center justify-between py-2 border-b border-gray-200">
                            <span className="text-sm text-gray-600 font-medium">Bank Name:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-900">{gateway.bank_name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(gateway.bank_name);
                                  setCopiedField('bank_name');
                                  setTimeout(() => setCopiedField(null), 2000);
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                              >
                                {copiedField === 'bank_name' ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                        {gateway.account_name && (
                          <div className="flex items-center justify-between py-2 border-b border-gray-200">
                            <span className="text-sm text-gray-600 font-medium">Account Name:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-900">{gateway.account_name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(gateway.account_name);
                                  setCopiedField('account_name');
                                  setTimeout(() => setCopiedField(null), 2000);
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                              >
                                {copiedField === 'account_name' ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                        {gateway.account_number && (
                          <div className="flex items-center justify-between py-2 border-b border-gray-200">
                            <span className="text-sm text-gray-600 font-medium">Account Number:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-900 font-mono">{gateway.account_number}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(gateway.account_number);
                                  setCopiedField('account_number');
                                  setTimeout(() => setCopiedField(null), 2000);
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                              >
                                {copiedField === 'account_number' ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                        {gateway.ifsc_code && (
                          <div className="flex items-center justify-between py-2 border-b border-gray-200">
                            <span className="text-sm text-gray-600 font-medium">IFSC Code:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-900 font-mono">{gateway.ifsc_code}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(gateway.ifsc_code);
                                  setCopiedField('ifsc_code');
                                  setTimeout(() => setCopiedField(null), 2000);
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                              >
                                {copiedField === 'ifsc_code' ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                        {gateway.swift_code && (
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-gray-600 font-medium">SWIFT Code:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-900 font-mono">{gateway.swift_code}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(gateway.swift_code);
                                  setCopiedField('swift_code');
                                  setTimeout(() => setCopiedField(null), 2000);
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                              >
                                {copiedField === 'swift_code' ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {gateway.type === 'crypto' && gateway.crypto_address && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-600 font-medium">Wallet Address:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900 font-mono break-all max-w-xs">{gateway.crypto_address}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(gateway.crypto_address);
                              setCopiedField('crypto_address');
                              setTimeout(() => setCopiedField(null), 2000);
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                          >
                            {copiedField === 'crypto_address' ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* QR Code with Border and Copy */}
              {gateway.qr_code_url && (
                <div className="flex justify-center">
                  <div className="flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-center">QR Code</label>
                    <div className="relative">
                      <div className="w-48 h-48 rounded-xl overflow-hidden border-4 border-gray-100 shadow-sm flex items-center justify-center bg-gray-50 p-2">
                        <img src={gateway.qr_code_url} alt="QR Code" className="w-full h-full object-contain" />
                      </div>
                      {gateway.crypto_address && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(gateway.crypto_address);
                            setCopiedField('qr_address');
                            setTimeout(() => setCopiedField(null), 2000);
                            Swal.fire({
                              icon: 'success',
                              title: 'Copied!',
                              text: 'Wallet address copied to clipboard',
                              timer: 2000,
                              showConfirmButton: false
                            });
                          }}
                          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-dark-base px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-lg"
                        >
                          {copiedField === 'qr_address' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Address</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Deposit To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit To *
                </label>
                <div className="space-y-3">
                  <div
                    width={200}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      MT5 Account
                    </label>
                    <select
                      value={formData.deposit_to === 'mt5' ? formData.mt5_account_id : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setFormData({ ...formData, deposit_to: 'mt5', mt5_account_id: e.target.value });
                        } else {
                          setFormData({ ...formData, deposit_to: 'wallet', mt5_account_id: '' });
                        }
                      }}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-brand-200 outline-none transition-all bg-white"
                    >
                    <option value="">Select MT5 Account</option>
                    {mt5Accounts.map((account) => (
                      <option key={account.id} value={account.account_number}>
                        {account.account_number} | {account.account_type || 'Standard'} | Balance: {account.currency || 'USD'} {parseFloat(account.balance || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                  {/* Show limits when MT5 account is selected */}
                  {formData.deposit_to === 'mt5' && formData.mt5_account_id && (() => {
                    const selectedAccount = mt5Accounts.find(acc => acc.account_number === formData.mt5_account_id);
                    if (selectedAccount && (selectedAccount.minimum_deposit !== null || selectedAccount.maximum_deposit !== null)) {
                      const limits = getSelectedAccountLimits();
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
                    return null;
                  })()}
                  {mt5Accounts.length === 0 && (
                    <p className="mt-2 text-sm text-gray-500 italic">No MT5 accounts available</p>
                  )}
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
              onChange={handleAmountChange}
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
            {convertedAmount && !amountError && (
              <p className="mt-2 text-xs text-gray-500">
                ≈ {convertedAmount.amount} {convertedAmount.currency}
              </p>
            )}
          </div>

          {/* Transaction Hash */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Hash/ID
            </label>
            <input
              type="text"
              value={formData.transaction_hash}
              onChange={(e) => setFormData({ ...formData, transaction_hash: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-brand-200 outline-none transition-all required"
              placeholder="Enter transaction hash/ID"
            />
          </div>

          {/* Upload Proof */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Proof (Optional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-brand-400 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="proof-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-700 hover:text-blue-600 focus-within:outline-none">
                    <span>Upload a file</span>
                    <input
                      id="proof-upload"
                      name="proof-upload"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB</p>
                {formData.proof && (
                  <p className="text-sm text-green-600 mt-2">{formData.proof.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Important Terms & Conditions</h4>
            <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
              <li>Only deposit to the mentioned payment details above. Funds sent to other addresses will be lost.</li>
              <li>Ensure you enter the correct transaction hash/ID for verification.</li>
              <li>Deposits may take 24-48 hours to be processed and reflected in your account.</li>
              <li>We reserve the right to request additional verification documents if needed.</li>
              <li>Double-check all payment details before confirming your deposit.</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-dark-base py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Continue
          </button>
        </form>
          )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Confirm Deposit</h3>
              <p className="text-gray-600">Please review your deposit details</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Gateway:</span>
                <span className="font-medium">{gateway.name}</span>
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
              {formData.transaction_hash && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction Hash / Transaction ID:</span>
                  <span className="font-medium font-mono text-sm">{formData.transaction_hash}</span>
                </div>
              )}
              {formData.proof && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Proof:</span>
                  <span className="font-medium">{formData.proof.name}</span>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate(`/user/deposits/${gatewayId}?step=1`)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 bg-blue-600 text-dark-base py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
            <h3 className="text-2xl font-semibold mb-2">Deposit Request Submitted!</h3>
            <p className="text-gray-600 mb-6">
              Your deposit request has been submitted successfully. It will be reviewed and processed within 24-48 hours.
            </p>
            <button
              onClick={handleSuccess}
              className="bg-blue-600 text-dark-base px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Go to Reports
            </button>
          </div>
        )}
      </div>
    </div>
    </div >
  );
}

export default DepositRequest;

