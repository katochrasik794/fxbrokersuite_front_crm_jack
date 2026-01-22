import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, CheckCircle, XCircle, Clock, ChevronRight, ChevronLeft, CreditCard } from 'lucide-react';
import authService from '../../services/auth.js';
import Swal from 'sweetalert2';
import ProTable from '../../admin/components/ProTable.jsx';
import PageHeader from '../components/PageHeader.jsx';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function PaymentDetails() {
  const [paymentDetails, setPaymentDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1); // 1: Select method, 2: Fill form
  const [selectedMethod, setSelectedMethod] = useState('');
  const [withdrawalGateways, setWithdrawalGateways] = useState([]);
  const [loadingGateways, setLoadingGateways] = useState(true);
  const [formData, setFormData] = useState({
    // Bank Transfer fields
    name: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    ifscSwiftCode: '',
    accountType: 'savings',
    // USDT TRC20 field
    walletAddress: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [loadingMethod, setLoadingMethod] = useState(false);
  const [userData, setUserData] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchPaymentDetails();
    fetchUserData();
    fetchWithdrawalGateways();
  }, []);

  // Re-validate accountName when name changes
  useEffect(() => {
    if (selectedMethod === 'bank_transfer' && formData.name && formData.accountName) {
      const errors = { ...validationErrors };
      if (formData.accountName.trim().toLowerCase() !== formData.name.trim().toLowerCase()) {
        errors.accountName = 'Account name should match the name above for withdrawals';
      } else {
        delete errors.accountName;
      }
      setValidationErrors(errors);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.name, selectedMethod]);

  // Re-check duplicates when accountNumber or ifscSwiftCode changes
  useEffect(() => {
    if (selectedMethod === 'bank_transfer' && formData.accountNumber && formData.ifscSwiftCode) {
      const duplicate = checkDuplicate('accountNumber', formData.accountNumber);
      const errors = { ...validationErrors };
      if (duplicate) {
        errors.accountNumber = `This account already exists with ${duplicate.status} status`;
        errors.ifscSwiftCode = `This account already exists with ${duplicate.status} status`;
      } else {
        delete errors.accountNumber;
        delete errors.ifscSwiftCode;
      }
      setValidationErrors(errors);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.accountNumber, formData.ifscSwiftCode, selectedMethod]);

  const fetchUserData = async () => {
    try {
      // Get from localStorage first
      const storedUserData = authService.getUserData();
      if (storedUserData) {
        setUserData(storedUserData);
      } else {
        // If not in localStorage, verify token to get fresh data
        const result = await authService.verifyToken();
        if (result.success && result.data && result.data.user) {
          setUserData(result.data.user);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/payment-details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setPaymentDetails(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load payment details' });
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawalGateways = async () => {
    try {
      setLoadingGateways(true);
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/withdrawals/gateways`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setWithdrawalGateways(data.gateways || []);
      }
    } catch (error) {
      console.error('Error fetching withdrawal gateways:', error);
      // Don't show error to user, just log it - gateways are optional
    } finally {
      setLoadingGateways(false);
    }
  };

  // Map gateway type to payment_method value
  const mapGatewayTypeToPaymentMethod = (gateway) => {
    const type = gateway.type;
    if (type === 'wire') return 'bank_transfer';
    if (type === 'crypto') {
      // Check gateway name for specific crypto type
      const name = (gateway.name || '').toLowerCase();
      if (name.includes('trc20')) return 'usdt_trc20';
      if (name.includes('erc20')) return 'usdt_erc20';
      if (name.includes('bep20')) return 'usdt_bep20';
      // Default to TRC20 if not specified
      return 'usdt_trc20';
    }
    if (type === 'upi') return 'upi';
    return type;
  };

  // Get gateway label for display
  const getGatewayLabel = (gateway) => {
    return gateway.name || gateway.type.toUpperCase();
  };

  // Get gateway description
  const getGatewayDescription = (gateway) => {
    const type = gateway.type;
    if (type === 'wire') return 'Add your bank account details';
    if (type === 'crypto') {
      const name = (gateway.name || '').toLowerCase();
      if (name.includes('trc20')) return 'Add your USDT TRC20 wallet address';
      if (name.includes('erc20')) return 'Add your USDT ERC20 wallet address';
      if (name.includes('bep20')) return 'Add your USDT BEP20 wallet address';
      return 'Add your cryptocurrency wallet address';
    }
    if (type === 'upi') return 'Add your UPI ID';
    return 'Add your payment details';
  };

  const handleMethodSelect = async (method) => {
    setLoadingMethod(true);
    // Smooth animation delay
    await new Promise(resolve => setTimeout(resolve, 300));
    setSelectedMethod(method);
    setStep(2);

    // Auto-populate name for bank transfer
    if (method === 'bank_transfer' && userData) {
      const fullName = userData.lastName
        ? `${userData.firstName} ${userData.lastName}`
        : userData.firstName;
      setFormData(prev => ({
        ...prev,
        name: fullName
      }));
    }

    setLoadingMethod(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Real-time validation
    validateField(name, value);
  };

  const checkDuplicate = (fieldName, value) => {
    if (selectedMethod === 'bank_transfer' && fieldName === 'accountNumber' && formData.ifscSwiftCode) {
      const duplicate = paymentDetails.find(detail => {
        if (detail.payment_method !== 'bank_transfer' || !['pending', 'approved'].includes(detail.status)) {
          return false;
        }
        const existingDetails = typeof detail.payment_details === 'string'
          ? JSON.parse(detail.payment_details)
          : detail.payment_details;

        const existingAccountNumber = (existingDetails.accountNumber || '').trim().toLowerCase();
        const existingIfscSwift = (existingDetails.ifscSwiftCode || '').trim().toLowerCase();
        const newAccountNumber = (value || '').trim().toLowerCase();
        const newIfscSwift = (formData.ifscSwiftCode || '').trim().toLowerCase();

        return existingAccountNumber === newAccountNumber && existingIfscSwift === newIfscSwift;
      });
      return duplicate;
    } else if (selectedMethod === 'bank_transfer' && fieldName === 'ifscSwiftCode' && formData.accountNumber) {
      const duplicate = paymentDetails.find(detail => {
        if (detail.payment_method !== 'bank_transfer' || !['pending', 'approved'].includes(detail.status)) {
          return false;
        }
        const existingDetails = typeof detail.payment_details === 'string'
          ? JSON.parse(detail.payment_details)
          : detail.payment_details;

        const existingAccountNumber = (existingDetails.accountNumber || '').trim().toLowerCase();
        const existingIfscSwift = (existingDetails.ifscSwiftCode || '').trim().toLowerCase();
        const newAccountNumber = (formData.accountNumber || '').trim().toLowerCase();
        const newIfscSwift = (value || '').trim().toLowerCase();

        return existingAccountNumber === newAccountNumber && existingIfscSwift === newIfscSwift;
      });
      return duplicate;
    } else if (selectedMethod === 'usdt_trc20' && fieldName === 'walletAddress') {
      const newWalletAddress = (value || '').trim().toLowerCase();
      const duplicate = paymentDetails.find(detail => {
        if (detail.payment_method !== 'usdt_trc20' || !['pending', 'approved'].includes(detail.status)) {
          return false;
        }
        const existingDetails = typeof detail.payment_details === 'string'
          ? JSON.parse(detail.payment_details)
          : detail.payment_details;

        const existingWalletAddress = (existingDetails.walletAddress || '').trim().toLowerCase();
        return existingWalletAddress === newWalletAddress;
      });
      return duplicate;
    }
    return null;
  };

  const validateField = (fieldName, value) => {
    const errors = { ...validationErrors };

    if (selectedMethod === 'bank_transfer') {
      switch (fieldName) {
        case 'bankName':
          if (value.trim() === '') {
            errors.bankName = 'Please enter correct bank name';
          } else if (value.trim().length < 2) {
            errors.bankName = 'Bank name must be at least 2 characters';
          } else {
            delete errors.bankName;
          }
          break;
        case 'accountName':
          if (value.trim() === '') {
            errors.accountName = 'Please enter correct account holder name';
          } else if (value.trim().length < 2) {
            errors.accountName = 'Account name must be at least 2 characters';
          } else {
            // Check if account name matches the name field (for withdrawals)
            if (formData.name && value.trim().toLowerCase() !== formData.name.trim().toLowerCase()) {
              errors.accountName = 'Account name should match the name above for withdrawals';
            } else {
              delete errors.accountName;
            }
          }
          break;
        case 'accountNumber':
          if (value.trim() === '') {
            errors.accountNumber = 'Please enter correct account number';
          } else if (!/^\d+$/.test(value.trim())) {
            errors.accountNumber = 'Account number should contain only digits';
          } else if (value.trim().length < 8) {
            errors.accountNumber = 'Account number must be at least 8 digits';
          } else {
            // Check for duplicate
            const duplicate = checkDuplicate(fieldName, value);
            if (duplicate) {
              errors.accountNumber = `This account already exists with ${duplicate.status} status`;
            } else {
              delete errors.accountNumber;
            }
          }
          break;
        case 'ifscSwiftCode':
          if (value.trim() === '') {
            errors.ifscSwiftCode = 'Please enter correct IFSC or SWIFT code';
          } else if (value.trim().length < 8) {
            errors.ifscSwiftCode = 'IFSC/SWIFT code must be at least 8 characters';
          } else {
            // Check for duplicate
            const duplicate = checkDuplicate(fieldName, value);
            if (duplicate) {
              errors.ifscSwiftCode = `This account already exists with ${duplicate.status} status`;
            } else {
              delete errors.ifscSwiftCode;
            }
          }
          break;
        case 'name':
          // If name changes, re-validate accountName will be handled by useEffect
          break;
      }
    } else if (selectedMethod === 'usdt_trc20') {
      if (fieldName === 'walletAddress') {
        if (value.trim() === '') {
          errors.walletAddress = 'Please enter correct wallet address';
        } else if (value.trim().length < 26) {
          errors.walletAddress = 'Wallet address must be at least 26 characters';
        } else if (!/^T[A-Za-z1-9]{33}$/.test(value.trim())) {
          errors.walletAddress = 'Please enter a valid TRC20 wallet address (starts with T)';
        } else {
          // Check for duplicate
          const duplicate = checkDuplicate(fieldName, value);
          if (duplicate) {
            errors.walletAddress = `This wallet already exists with ${duplicate.status} status`;
          } else {
            delete errors.walletAddress;
          }
        }
      }
    }

    setValidationErrors(errors);
  };

  const validateAllFields = () => {
    const errors = {};

    if (selectedMethod === 'bank_transfer') {
      if (!formData.bankName || formData.bankName.trim() === '') {
        errors.bankName = 'Please enter correct bank name';
      } else if (formData.bankName.trim().length < 2) {
        errors.bankName = 'Bank name must be at least 2 characters';
      }

      if (!formData.accountName || formData.accountName.trim() === '') {
        errors.accountName = 'Please enter correct account holder name';
      } else if (formData.accountName.trim().length < 2) {
        errors.accountName = 'Account name must be at least 2 characters';
      } else if (formData.name && formData.accountName.trim().toLowerCase() !== formData.name.trim().toLowerCase()) {
        errors.accountName = 'Account name should match the name above for withdrawals';
      }

      if (!formData.accountNumber || formData.accountNumber.trim() === '') {
        errors.accountNumber = 'Please enter correct account number';
      } else if (!/^\d+$/.test(formData.accountNumber.trim())) {
        errors.accountNumber = 'Account number should contain only digits';
      } else if (formData.accountNumber.trim().length < 8) {
        errors.accountNumber = 'Account number must be at least 8 digits';
      }

      if (!formData.ifscSwiftCode || formData.ifscSwiftCode.trim() === '') {
        errors.ifscSwiftCode = 'Please enter correct IFSC or SWIFT code';
      } else if (formData.ifscSwiftCode.trim().length < 8) {
        errors.ifscSwiftCode = 'IFSC/SWIFT code must be at least 8 characters';
      }
    } else if (selectedMethod === 'usdt_trc20') {
      if (!formData.walletAddress || formData.walletAddress.trim() === '') {
        errors.walletAddress = 'Please enter correct wallet address';
      } else if (formData.walletAddress.trim().length < 26) {
        errors.walletAddress = 'Wallet address must be at least 26 characters';
      } else if (!/^T[A-Za-z1-9]{33}$/.test(formData.walletAddress.trim())) {
        errors.walletAddress = 'Please enter a valid TRC20 wallet address (starts with T)';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields before submission
    const isValid = validateAllFields();

    if (!isValid) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Please correct the errors in the form' });
      return;
    }

    // Additional check for account name matching name (for withdrawals)
    if (selectedMethod === 'bank_transfer' && formData.name && formData.accountName.trim().toLowerCase() !== formData.name.trim().toLowerCase()) {
      Swal.fire({
        icon: 'warning',
        title: 'Name Mismatch',
        text: 'Account name should match the name above for withdrawals. Please verify the details.',
        showCancelButton: true,
        confirmButtonText: 'Continue Anyway',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (!result.isConfirmed) {
          return;
        }
        // Continue with submission if user confirms
        submitPaymentDetails();
      });
      return;
    }

    submitPaymentDetails();
  };

  const submitPaymentDetails = async () => {
    try {
      setSubmitting(true);

      // Check for duplicates before submitting
      if (selectedMethod === 'bank_transfer') {
        const duplicate = paymentDetails.find(detail => {
          if (detail.payment_method !== 'bank_transfer' || !['pending', 'approved'].includes(detail.status)) {
            return false;
          }
          const existingDetails = typeof detail.payment_details === 'string'
            ? JSON.parse(detail.payment_details)
            : detail.payment_details;

          const existingAccountNumber = (existingDetails.accountNumber || '').trim().toLowerCase();
          const existingIfscSwift = (existingDetails.ifscSwiftCode || '').trim().toLowerCase();
          const newAccountNumber = (formData.accountNumber || '').trim().toLowerCase();
          const newIfscSwift = (formData.ifscSwiftCode || '').trim().toLowerCase();

          return existingAccountNumber === newAccountNumber && existingIfscSwift === newIfscSwift;
        });

        if (duplicate) {
          Swal.fire({
            icon: 'error',
            title: 'Duplicate Payment Method',
            text: `This payment method already exists with ${duplicate.status} status. Please use a different account or delete the existing one.`
          });
          setSubmitting(false);
          return;
        }
      } else if (selectedMethod === 'usdt_trc20') {
        const newWalletAddress = (formData.walletAddress || '').trim().toLowerCase();
        const duplicate = paymentDetails.find(detail => {
          if (detail.payment_method !== 'usdt_trc20' || !['pending', 'approved'].includes(detail.status)) {
            return false;
          }
          const existingDetails = typeof detail.payment_details === 'string'
            ? JSON.parse(detail.payment_details)
            : detail.payment_details;

          const existingWalletAddress = (existingDetails.walletAddress || '').trim().toLowerCase();
          return existingWalletAddress === newWalletAddress;
        });

        if (duplicate) {
          Swal.fire({
            icon: 'error',
            title: 'Duplicate Wallet Address',
            text: `This wallet address already exists with ${duplicate.status} status. Please use a different wallet or delete the existing one.`
          });
          setSubmitting(false);
          return;
        }
      }

      const token = authService.getToken();

      // Prepare payment_details JSON based on method
      let paymentDetailsJson = {};
      if (selectedMethod === 'bank_transfer') {
        paymentDetailsJson = {
          name: formData.name || '',
          bankName: formData.bankName,
          accountName: formData.accountName,
          accountNumber: formData.accountNumber,
          ifscSwiftCode: formData.ifscSwiftCode,
          accountType: formData.accountType
        };
      } else if (selectedMethod === 'usdt_trc20') {
        paymentDetailsJson = {
          walletAddress: formData.walletAddress.trim()
        };
      }

      const response = await fetch(`${API_BASE_URL}/payment-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          payment_method: selectedMethod,
          payment_details: paymentDetailsJson
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit payment details');
      }

      Swal.fire({
        icon: 'success',
        title: 'Submitted!',
        text: 'Payment details submitted successfully. Awaiting admin approval.',
        timer: 2000
      });

      // Reset form
      setShowForm(false);
      setStep(1);
      setSelectedMethod('');
      setFormData({
        name: '',
        bankName: '',
        accountName: '',
        accountNumber: '',
        ifscSwiftCode: '',
        accountType: 'savings',
        walletAddress: ''
      });
      setValidationErrors({});
      
      // Refresh list
      fetchPaymentDetails();
      
    } catch (error) {
      console.error('Error submitting payment details:', error);
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: error.message || 'Failed to submit payment details. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 font-['Inter']">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          icon={CreditCard}
          title="Payment Details"
          subtitle="Manage your bank accounts and crypto wallets for withdrawals."
        />

        {showForm ? (
          <div className="bg-white rounded-2xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {step === 2 && (
                  <button 
                    onClick={() => setStep(1)}
                    className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-500 hover:text-slate-700"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {step === 1 ? 'Select Payment Method' : 'Enter Details'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {step === 1 ? 'Choose how you want to receive your funds' : getGatewayDescription({ type: selectedMethod === 'usdt_trc20' ? 'crypto' : selectedMethod === 'bank_transfer' ? 'wire' : selectedMethod, name: selectedMethod })}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowForm(false);
                  setStep(1);
                  setSelectedMethod('');
                  setValidationErrors({});
                }}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {step === 1 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {loadingGateways ? (
                    <div className="col-span-full flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <>
                      {/* Standard Methods */}
                      <button
                        onClick={() => handleMethodSelect('bank_transfer')}
                        disabled={loadingMethod}
                        className="group relative flex flex-col items-center p-6 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300"
                      >
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                          <span className="text-3xl">🏦</span>
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1">Bank Transfer</h3>
                        <p className="text-sm text-slate-500 text-center">Withdraw directly to your bank account</p>
                      </button>

                      <button
                        onClick={() => handleMethodSelect('usdt_trc20')}
                        disabled={loadingMethod}
                        className="group relative flex flex-col items-center p-6 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300"
                      >
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                          <span className="text-3xl">₮</span>
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1">USDT TRC20</h3>
                        <p className="text-sm text-slate-500 text-center">Crypto withdrawal via TRON network</p>
                      </button>

                      {/* Dynamic Gateways */}
                      {withdrawalGateways.map((gateway) => {
                         const method = mapGatewayTypeToPaymentMethod(gateway);
                         // Skip if already shown above
                         if (method === 'bank_transfer' || method === 'usdt_trc20') return null;
                         
                         return (
                          <button
                            key={gateway.id}
                            onClick={() => handleMethodSelect(method)}
                            disabled={loadingMethod}
                            className="group relative flex flex-col items-center p-6 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300"
                          >
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                              {gateway.logo ? (
                                <img src={gateway.logo} alt={gateway.name} className="w-10 h-10 object-contain" />
                              ) : (
                                <span className="text-3xl">💳</span>
                              )}
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-1">{getGatewayLabel(gateway)}</h3>
                            <p className="text-sm text-slate-500 text-center">{getGatewayDescription(gateway)}</p>
                          </button>
                         );
                      })}
                    </>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
                  {selectedMethod === 'bank_transfer' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Account Holder Name</label>
                          <input
                            type="text"
                            name="accountName"
                            value={formData.accountName}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border ${validationErrors.accountName ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20'} focus:border-blue-500 focus:outline-none transition-all`}
                            placeholder="Enter account holder name"
                          />
                          {validationErrors.accountName && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> {validationErrors.accountName}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Bank Name</label>
                          <input
                            type="text"
                            name="bankName"
                            value={formData.bankName}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border ${validationErrors.bankName ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20'} focus:border-blue-500 focus:outline-none transition-all`}
                            placeholder="Enter bank name"
                          />
                          {validationErrors.bankName && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> {validationErrors.bankName}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Account Number</label>
                          <input
                            type="text"
                            name="accountNumber"
                            value={formData.accountNumber}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border ${validationErrors.accountNumber ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20'} focus:border-blue-500 focus:outline-none transition-all`}
                            placeholder="Enter account number"
                          />
                          {validationErrors.accountNumber && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> {validationErrors.accountNumber}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">IFSC / SWIFT Code</label>
                          <input
                            type="text"
                            name="ifscSwiftCode"
                            value={formData.ifscSwiftCode}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border ${validationErrors.ifscSwiftCode ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20'} focus:border-blue-500 focus:outline-none transition-all`}
                            placeholder="Enter IFSC or SWIFT code"
                          />
                          {validationErrors.ifscSwiftCode && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> {validationErrors.ifscSwiftCode}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Account Type</label>
                          <select
                            name="accountType"
                            value={formData.accountType}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all appearance-none"
                          >
                            <option value="savings">Savings</option>
                            <option value="current">Current</option>
                            <option value="checking">Checking</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedMethod === 'usdt_trc20' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Wallet Address (TRC20)</label>
                      <input
                        type="text"
                        name="walletAddress"
                        value={formData.walletAddress}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl bg-slate-50 border ${validationErrors.walletAddress ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20'} focus:border-blue-500 focus:outline-none transition-all font-mono`}
                        placeholder="T..."
                      />
                      {validationErrors.walletAddress && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> {validationErrors.walletAddress}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        Please ensure you enter a valid TRC20 address starting with 'T'.
                      </p>
                    </div>
                  )}

                  <div className="pt-4 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-6 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all font-medium flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Save Details</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Saved Methods</h2>
                <p className="text-sm text-slate-500 mt-1">Manage your saved payment methods</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add Method</span>
              </button>
            </div>
            
            <ProTable
              columns={[
                {
                  header: 'Method',
                  accessorKey: 'payment_method',
                  cell: (info) => {
                    const method = info.getValue();
                    const labels = {
                      'bank_transfer': 'Bank Transfer',
                      'usdt_trc20': 'USDT TRC20',
                      'upi': 'UPI'
                    };
                    return (
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-slate-50 rounded-lg text-lg">
                          {method === 'bank_transfer' ? '🏦' : method.includes('usdt') ? '₮' : '💳'}
                        </span>
                        <span className="font-medium text-slate-700">{labels[method] || method}</span>
                      </div>
                    );
                  }
                },
                {
                  header: 'Details',
                  accessorKey: 'payment_details',
                  cell: (info) => {
                    const details = typeof info.getValue() === 'string' 
                      ? JSON.parse(info.getValue()) 
                      : info.getValue();
                    const method = info.row.original.payment_method;
                    
                    if (method === 'bank_transfer') {
                      return (
                        <div className="text-sm">
                          <div className="font-medium text-slate-900">{details.bankName}</div>
                          <div className="text-slate-500 font-mono">{details.accountNumber}</div>
                        </div>
                      );
                    } else if (method === 'usdt_trc20') {
                      return (
                        <div className="font-mono text-sm text-slate-600">
                          {details.walletAddress?.substring(0, 6)}...{details.walletAddress?.substring(details.walletAddress.length - 4)}
                        </div>
                      );
                    }
                    return <span className="text-slate-500">-</span>;
                  }
                },
                {
                  header: 'Status',
                  accessorKey: 'status',
                  cell: (info) => {
                    const status = info.getValue();
                    const styles = {
                      approved: 'bg-green-50 text-green-700 border-green-200',
                      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                      rejected: 'bg-red-50 text-red-700 border-red-200'
                    };
                    return (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    );
                  }
                },
                {
                  header: 'Date Added',
                  accessorKey: 'created_at',
                  cell: (info) => (
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Clock className="w-3 h-3" />
                      {new Date(info.getValue()).toLocaleDateString()}
                    </div>
                  )
                },
                {
                  header: 'Actions',
                  id: 'actions',
                  cell: (info) => (
                    <button
                      onClick={() => {
                        Swal.fire({
                          title: 'Are you sure?',
                          text: "You won't be able to revert this!",
                          icon: 'warning',
                          showCancelButton: true,
                          confirmButtonColor: '#d33',
                          cancelButtonColor: '#3085d6',
                          confirmButtonText: 'Yes, delete it!'
                        }).then(async (result) => {
                          if (result.isConfirmed) {
                            try {
                              const token = authService.getToken();
                              const response = await fetch(`${API_BASE_URL}/payment-details/${info.row.original.id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              if (response.ok) {
                                Swal.fire('Deleted!', 'Payment method has been deleted.', 'success');
                                fetchPaymentDetails();
                              }
                            } catch (error) {
                              console.error('Error deleting:', error);
                            }
                          }
                        });
                      }}
                      className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )
                }
              ]}
              data={paymentDetails}
              loading={loading}
              searchPlaceholder="Search payment methods..."
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentDetails;
