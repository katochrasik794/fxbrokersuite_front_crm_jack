import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Copy, Check, Upload, ArrowLeft, Wallet, AlertTriangle, ChevronRight, Download, CreditCard } from 'lucide-react';
import authService from '../../services/auth.js';
import Swal from 'sweetalert2';
import PageHeader from '../components/PageHeader';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || 'https://fxbrokersuite-back-crm-jack.onrender.com/api';
const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL?.replace('/api', '') || import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://fxbrokersuite-back-crm-jack.onrender.com';

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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!gateway) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <PageHeader 
        title={`Deposit via ${gateway.name}`}
        subtitle="Complete your deposit request safely and securely"
        icon={Wallet}
      />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <button
          onClick={() => navigate('/user/deposits')}
          className="mb-6 flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Payment Methods</span>
        </button>

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {gateway.icon_url ? (
                <div className="w-16 h-16 rounded-2xl bg-gray-50 p-2 border border-gray-100 flex items-center justify-center">
                  <img src={gateway.icon_url} alt={gateway.name} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Wallet className="w-8 h-8" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{gateway.name}</h1>
                <p className="text-sm text-gray-500">Processing time: Instant - 48 hours</p>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center bg-gray-50 rounded-xl p-2">
              <div className={`flex items-center px-4 py-2 rounded-lg transition-all ${step >= 1 ? 'bg-white shadow-sm text-blue-600 font-semibold' : 'text-gray-400'}`}>
                <span className="w-6 h-6 rounded-full bg-current text-white flex items-center justify-center text-xs mr-2 opacity-20">1</span>
                <span>Details</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />
              <div className={`flex items-center px-4 py-2 rounded-lg transition-all ${step >= 2 ? 'bg-white shadow-sm text-blue-600 font-semibold' : 'text-gray-400'}`}>
                <span className="w-6 h-6 rounded-full bg-current text-white flex items-center justify-center text-xs mr-2 opacity-20">2</span>
                <span>Confirm</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />
              <div className={`flex items-center px-4 py-2 rounded-lg transition-all ${step >= 3 ? 'bg-white shadow-sm text-blue-600 font-semibold' : 'text-gray-400'}`}>
                <span className="w-6 h-6 rounded-full bg-current text-white flex items-center justify-center text-xs mr-2 opacity-20">3</span>
                <span>Done</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Bank Details / Crypto Address */}
              {(gateway.type === 'wire' || gateway.type === 'crypto') && (
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Payment Details</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {gateway.type === 'wire' && (
                      <div className="grid gap-3">
                        {[
                          { label: 'Bank Name', value: gateway.bank_name, key: 'bank_name' },
                          { label: 'Account Name', value: gateway.account_name, key: 'account_name' },
                          { label: 'Account Number', value: gateway.account_number, key: 'account_number' },
                          { label: 'IFSC Code', value: gateway.ifsc_code, key: 'ifsc_code' },
                          { label: 'SWIFT Code', value: gateway.swift_code, key: 'swift_code' },
                        ].map((item) => item.value && (
                          <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors group">
                            <span className="text-sm text-gray-500 font-medium mb-1 sm:mb-0">{item.label}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-gray-900 font-mono">{item.value}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(item.value);
                                  setCopiedField(item.key);
                                  setTimeout(() => setCopiedField(null), 2000);
                                }}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-blue-600"
                              >
                                {copiedField === item.key ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {gateway.type === 'crypto' && gateway.crypto_address && (
                      <div className="flex flex-col p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors group">
                        <span className="text-sm text-gray-500 font-medium mb-2">Wallet Address</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-900 font-mono break-all">{gateway.crypto_address}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(gateway.crypto_address);
                              setCopiedField('crypto_address');
                              setTimeout(() => setCopiedField(null), 2000);
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-blue-600 flex-shrink-0"
                          >
                            {copiedField === 'crypto_address' ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* QR Code */}
              {gateway.qr_code_url && (
                <div className="flex justify-center py-4">
                  <div className="relative group">
                    <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow">
                      <div className="w-48 h-48 rounded-xl overflow-hidden bg-gray-50">
                        <img src={gateway.qr_code_url} alt="QR Code" className="w-full h-full object-contain" />
                      </div>
                      <p className="text-center text-xs text-gray-500 mt-2 font-medium">Scan to Pay</p>
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
                            showConfirmButton: false,
                            toast: true,
                            position: 'top-end'
                          });
                        }}
                        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white text-gray-900 px-4 py-2 rounded-full text-xs font-bold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-lg border border-gray-100 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-200"
                      >
                        {copiedField === 'qr_address' ? (
                          <>
                            <Check className="w-3 h-3 text-green-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-blue-500" />
                            <span>Copy Address</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                {/* Deposit To */}
                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    Deposit Destination <span className="text-red-500">*</span>
                  </label>
                  
                  <div className="space-y-3">
                    <div
                      onClick={() => setFormData({ ...formData, deposit_to: 'wallet', mt5_account_id: '' })}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden ${
                        formData.deposit_to === 'wallet'
                          ? 'border-blue-600 bg-blue-50/50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          formData.deposit_to === 'wallet' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          <Wallet className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-900">
                            My Wallet
                          </div>
                          <div className="text-xs text-gray-500">
                            {wallet ? `Balance: ${wallet.currency} ${parseFloat(wallet.balance || 0).toFixed(2)}` : 'Loading...'}
                          </div>
                        </div>
                        {formData.deposit_to === 'wallet' && (
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 bg-gray-50 rounded-2xl border border-gray-200 -z-10"></div>
                      <div className="p-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                          Or Deposit to Trading Account
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
                          className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all bg-white appearance-none cursor-pointer ${
                            formData.deposit_to === 'mt5' ? 'border-blue-600 ring-4 ring-blue-500/10' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <option value="">Select MT5 Account</option>
                          {mt5Accounts.map((account) => (
                            <option key={account.id} value={account.account_number}>
                              {account.account_number} | {account.account_type || 'Standard'}
                            </option>
                          ))}
                        </select>
                        
                        {formData.deposit_to === 'mt5' && formData.mt5_account_id && (() => {
                          const selectedAccount = mt5Accounts.find(acc => acc.account_number === formData.mt5_account_id);
                          if (selectedAccount) {
                            const limits = getSelectedAccountLimits();
                            return (
                              <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-500">Current Balance:</span>
                                  <span className="font-bold text-gray-900">${parseFloat(selectedAccount.balance || 0).toFixed(2)}</span>
                                </div>
                                {(limits.min !== null || limits.max !== null) && (
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Deposit Limit:</span>
                                    <span className="font-bold text-blue-700">
                                      {limits.min !== null ? `$${limits.min.toFixed(2)}` : '$0'} - {limits.max !== null ? `$${limits.max.toFixed(2)}` : 'No limit'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })()}
                        
                        {mt5Accounts.length === 0 && (
                          <p className="mt-2 text-xs text-gray-500 italic flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> No MT5 accounts available
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amount & Proof */}
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
                      Amount (USDT) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amount}
                        onChange={handleAmountChange}
                        className={`w-full px-4 py-3 pl-10 rounded-xl border-2 outline-none transition-all font-mono text-lg ${
                          amountError 
                            ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                            : 'border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'
                        }`}
                        placeholder="0.00"
                        required
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</div>
                    </div>
                    
                    {amountError ? (
                      <p className="text-red-600 text-xs mt-2 flex items-center gap-1 font-medium">
                        <AlertTriangle className="w-3 h-3" /> {amountError}
                      </p>
                    ) : (
                      convertedAmount && (
                        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1 bg-gray-50 w-fit px-2 py-1 rounded-lg">
                          ≈ {convertedAmount.amount} {convertedAmount.currency}
                        </p>
                      )
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
                      Transaction Hash/ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.transaction_hash}
                      onChange={(e) => setFormData({ ...formData, transaction_hash: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      placeholder="Enter transaction hash/ID"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
                      Upload Proof <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative group">
                      <input
                        id="proof-upload"
                        name="proof-upload"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                        formData.proof ? 'border-green-500 bg-green-50/30' : 'border-gray-300 group-hover:border-blue-400 group-hover:bg-blue-50/30'
                      }`}>
                        {formData.proof ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                              <Check className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium text-green-700 truncate max-w-full px-4">
                              {formData.proof.name}
                            </span>
                            <span className="text-xs text-green-600">Click to change</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                              <Upload className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Click to upload proof</span>
                            <span className="text-xs text-gray-400">PNG, JPG, PDF up to 5MB</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-800 mb-1">Important Terms & Conditions</h4>
                  <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside opacity-80">
                    <li>Only deposit to the mentioned payment details above. Funds sent to other addresses will be lost.</li>
                    <li>Ensure you enter the correct transaction hash/ID for verification.</li>
                    <li>Deposits may take 24-48 hours to be processed.</li>
                  </ul>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 active:scale-[0.99] flex items-center justify-center gap-2"
              >
                Continue to Confirmation
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirm Deposit</h3>
                <p className="text-gray-500">Please review your deposit details carefully before submitting</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
                {[
                  { label: 'Payment Gateway', value: gateway.name },
                  { label: 'Deposit Destination', value: formData.deposit_to === 'wallet' ? `Wallet ${wallet ? `(${wallet.wallet_number})` : ''}` : `MT5 Account ${formData.mt5_account_id}` },
                  { label: 'Amount', value: `${formData.amount} USDT`, highlight: true },
                  { label: 'Transaction Hash', value: formData.transaction_hash, mono: true },
                  formData.proof && { label: 'Proof File', value: formData.proof.name }
                ].filter(Boolean).map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0 last:pb-0 first:pt-0">
                    <span className="text-sm text-gray-500">{item.label}</span>
                    <span className={`text-sm font-medium ${
                      item.highlight ? 'text-blue-600 font-bold text-lg' : 
                      item.mono ? 'font-mono text-gray-700' : 'text-gray-900'
                    }`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => navigate(`/user/deposits/${gatewayId}?step=1`)}
                  className="flex-1 px-6 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      Confirm & Submit
                      <Check className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center max-w-lg mx-auto py-8">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Request Submitted!</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Your deposit request has been submitted successfully. It will be reviewed and processed by our team within 24-48 hours.
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSuccess}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30"
                >
                  View Transaction History
                </button>
                <button
                  onClick={() => navigate('/user/home')}
                  className="w-full bg-white text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-50 border border-gray-200 transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DepositRequest;
