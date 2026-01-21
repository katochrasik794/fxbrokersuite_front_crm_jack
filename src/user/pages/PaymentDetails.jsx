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
      Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'Failed to submit payment details' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, status) => {
    if (status === 'approved') {
      Swal.fire({ icon: 'warning', title: 'Cannot Delete', text: 'Approved payment details cannot be deleted. Please contact support.' });
      return;
    }

    const result = await Swal.fire({
      title: 'Delete Payment Details?',
      text: 'Are you sure you want to delete this payment detail?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const token = authService.getToken();
        const response = await fetch(`${API_BASE_URL}/payment-details/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (data.success) {
          Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Payment detail deleted successfully', timer: 1500 });
          fetchPaymentDetails();
        } else {
          throw new Error(data.message || 'Failed to delete');
        }
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'Failed to delete payment detail' });
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1"><CheckCircle size={12} /> Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium flex items-center gap-1"><XCircle size={12} /> Rejected</span>;
      default:
        return <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium flex items-center gap-1"><Clock size={12} /> Pending</span>;
    }
  };

  const getMethodLabel = (method) => {
    switch (method) {
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'usdt_trc20':
        return 'USDT TRC20';
      case 'usdt_erc20':
        return 'USDT ERC20';
      case 'usdt_bep20':
        return 'USDT BEP20';
      case 'upi':
        return 'UPI';
      default:
        return method.replace(/_/g, ' ').toUpperCase();
    }
  };


  const pendingCount = paymentDetails.filter(p => p.status === 'pending').length;
  const approvedCount = paymentDetails.filter(p => p.status === 'approved').length;
  const canAddMore = (pendingCount + approvedCount) < 3;

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="w-full max-w-full">
        {/* Header */}
        <PageHeader
          icon={CreditCard}
          title="Payment Details"
          subtitle="Manage your payment methods for withdrawals. Maximum 3 payment details allowed."
        />

        {/* Add Button */}
        {canAddMore && (
          <div className="mb-6">
            <button
              onClick={() => {
                setShowForm(true);
                setStep(1);
                setSelectedMethod('');
              }}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-dark-base rounded-lg font-medium flex items-center gap-2 transition"
            >
              <Plus size={20} />
              Add Payment Method
            </button>
          </div>
        )}

        {!canAddMore && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">You have reached the maximum limit of 3 payment details. Please delete an existing one to add a new method.</p>
          </div>
        )}

        {/* Step-by-Step Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border border-gray-200">
            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${step >= 1 ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                  1
                </div>
                <div className={`w-24 h-1 mx-2 transition-all ${step >= 2 ? 'bg-brand-500' : 'bg-gray-200'
                  }`}></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${step >= 2 ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                  2
                </div>
              </div>
            </div>

            {/* Step 1: Select Payment Method */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-6">Select Payment Method</h3>
                <div className="flex flex-col items-center gap-4">
                  {loadingMethod || loadingGateways ? (
                    <div className="py-12 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
                    </div>
                  ) : withdrawalGateways.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-gray-600 mb-4">No withdrawal methods are currently available.</p>
                      <p className="text-sm text-gray-500">Please contact support if you need to add a payment method.</p>
                    </div>
                  ) : (
                    <>
                      {withdrawalGateways.map((gateway) => {
                        const paymentMethod = mapGatewayTypeToPaymentMethod(gateway);
                        return (
                          <button
                            key={gateway.id}
                            onClick={() => handleMethodSelect(paymentMethod)}
                            className="w-full max-w-md px-6 py-4 border-2 border-gray-200 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-all text-left group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                {gateway.icon_url && (
                                  <img
                                    src={gateway.icon_url}
                                    alt={gateway.name}
                                    className="w-10 h-10 object-contain"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                )}
                                <div>
                                  <div className="font-semibold text-black mb-1">{getGatewayLabel(gateway)}</div>
                                  <div className="text-sm text-black">{getGatewayDescription(gateway)}</div>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-500 transition flex-shrink-0" />
                            </div>
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
                <div className="flex flex-col items-center mt-6 gap-2">
                  <p className="text-xs text-gray-500 text-center italic">
                    Please select a method to add your payment method to place withdrawals
                  </p>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setStep(1);
                      setSelectedMethod('');
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Fill Form */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-black">
                    {selectedMethod === 'bank_transfer' ? 'Bank Transfer Details' :
                      selectedMethod.startsWith('usdt_') ? `${selectedMethod.toUpperCase().replace('_', ' ')} Details` :
                        selectedMethod === 'upi' ? 'UPI Details' :
                          'Payment Details'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setSelectedMethod('');
                    }}
                    className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    <ChevronLeft size={16} />
                    Back
                  </button>
                </div>

                {selectedMethod === 'bank_transfer' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${validationErrors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-brand-500'
                          }`}
                        placeholder="Optional name for this payment method"
                      />
                      {validationErrors.name && (
                        <p className="text-xs text-red-600 mt-1">{validationErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Bank Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${validationErrors.bankName ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-brand-500'
                          }`}
                        placeholder="Enter bank name"
                      />
                      {validationErrors.bankName && (
                        <p className="text-xs text-red-600 mt-1">{validationErrors.bankName}</p>
                      )}
                      {!validationErrors.bankName && formData.bankName && formData.bankName.trim().length >= 2 && (
                        <p className="text-xs text-black mt-1">Valid</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Account Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="accountName"
                        value={formData.accountName}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${validationErrors.accountName ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-brand-500'
                          }`}
                        placeholder="Enter account holder name"
                      />
                      {validationErrors.accountName && (
                        <p className="text-xs text-red-600 mt-1">{validationErrors.accountName}</p>
                      )}
                      {!validationErrors.accountName && formData.accountName && formData.accountName.trim().length >= 2 && (
                        <p className="text-xs text-black mt-1">Valid</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Account Number <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${validationErrors.accountNumber ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-brand-500'
                          }`}
                        placeholder="Enter account number"
                      />
                      {validationErrors.accountNumber && (
                        <p className="text-xs text-red-600 mt-1">{validationErrors.accountNumber}</p>
                      )}
                      {!validationErrors.accountNumber && formData.accountNumber && /^\d+$/.test(formData.accountNumber.trim()) && formData.accountNumber.trim().length >= 8 && (
                        <p className="text-xs text-black mt-1">Valid</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">IFSC / SWIFT Code <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="ifscSwiftCode"
                        value={formData.ifscSwiftCode}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${validationErrors.ifscSwiftCode ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-brand-500'
                          }`}
                        placeholder="Enter IFSC or SWIFT code"
                      />
                      {validationErrors.ifscSwiftCode && (
                        <p className="text-xs text-red-600 mt-1">{validationErrors.ifscSwiftCode}</p>
                      )}
                      {!validationErrors.ifscSwiftCode && formData.ifscSwiftCode && formData.ifscSwiftCode.trim().length >= 8 && (
                        <p className="text-xs text-black mt-1">Valid</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Account Type</label>
                      <select
                        name="accountType"
                        value={formData.accountType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="savings">Savings</option>
                        <option value="current">Current</option>
                        <option value="checking">Checking</option>
                      </select>
                    </div>
                  </div>
                )}

                {selectedMethod === 'usdt_trc20' && (
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Wallet Address <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="walletAddress"
                      value={formData.walletAddress}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${validationErrors.walletAddress ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-brand-500'
                        }`}
                      placeholder="Enter USDT TRC20 wallet address"
                    />
                    {validationErrors.walletAddress && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.walletAddress}</p>
                    )}
                    {!validationErrors.walletAddress && formData.walletAddress && /^T[A-Za-z1-9]{33}$/.test(formData.walletAddress.trim()) && (
                      <p className="text-xs text-black mt-1">Valid</p>
                    )}
                    {!validationErrors.walletAddress && !formData.walletAddress && (
                      <p className="text-xs text-gray-500 mt-1">Make sure to enter the correct TRC20 network address</p>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
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
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-dark-base rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-dark-base"></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit for Review'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Payment Details DataTable */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading payment details...</p>
          </div>
        ) : paymentDetails.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600">No payment details added yet.</p>
            {canAddMore && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setStep(1);
                }}
                className="mt-4 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-dark-base rounded-lg font-medium"
              >
                Add Payment Method
              </button>
            )}
          </div>
        ) : (
          <>
            <ProTable
              rows={paymentDetails.map(detail => ({
                id: detail.id,
                method: getMethodLabel(detail.payment_method),
                details: detail.payment_method === 'bank_transfer'
                  ? `${detail.payment_details.bankName || ''} • ${detail.payment_details.accountName || ''} • ${detail.payment_details.accountNumber || ''}`
                  : detail.payment_details.walletAddress || '',
                status: detail.status,
                submittedDate: detail.created_at,
                reviewedDate: detail.reviewed_at,
                rejectionReason: detail.rejection_reason,
                paymentMethod: detail.payment_method,
                paymentDetails: detail.payment_details,
                detail: detail
              }))}
              columns={[
                {
                  key: 'method',
                  label: 'Method',
                  render: (value) => <span className="font-medium text-gray-900">{value}</span>
                },
                {
                  key: 'details',
                  label: 'Details',
                  render: (value, row) => {
                    if (row.paymentMethod === 'bank_transfer') {
                      return (
                        <div className="text-sm text-gray-900 text-left whitespace-normal">
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 min-w-max">
                            {row.paymentDetails.name && (
                              <>
                                <div className="font-medium text-gray-600 whitespace-nowrap">Name:</div>
                                <div className="text-gray-900 whitespace-nowrap">{row.paymentDetails.name}</div>
                              </>
                            )}
                            <div className="font-medium text-gray-600 whitespace-nowrap">Bank:</div>
                            <div className="text-gray-900 whitespace-nowrap">{row.paymentDetails.bankName}</div>
                            <div className="font-medium text-gray-600 whitespace-nowrap">Account Name:</div>
                            <div className="text-gray-900 whitespace-nowrap">{row.paymentDetails.accountName}</div>
                            <div className="font-medium text-gray-600 whitespace-nowrap">Account Number:</div>
                            <div className="text-gray-900 font-mono text-xs whitespace-nowrap">{row.paymentDetails.accountNumber}</div>
                            <div className="font-medium text-gray-600 whitespace-nowrap">IFSC/SWIFT:</div>
                            <div className="text-gray-900 font-mono text-xs whitespace-nowrap">{row.paymentDetails.ifscSwiftCode}</div>
                            {row.paymentDetails.accountType && (
                              <>
                                <div className="font-medium text-gray-600 whitespace-nowrap">Account Type:</div>
                                <div className="text-gray-900 capitalize whitespace-nowrap">{row.paymentDetails.accountType}</div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-left whitespace-normal">
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 min-w-max">
                            <div className="font-medium text-gray-600 whitespace-nowrap">Wallet Address:</div>
                            <div className="text-gray-900 font-mono text-xs whitespace-nowrap">{row.paymentDetails.walletAddress}</div>
                          </div>
                        </div>
                      );
                    }
                  }
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (value, row) => (
                    <div className="flex flex-col items-start gap-1">
                      {getStatusBadge(value)}
                      {row.rejectionReason && (
                        <div className="mt-1 text-xs text-red-600 max-w-xs bg-red-50 px-2 py-1 rounded">
                          {row.rejectionReason}
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  key: 'submittedDate',
                  label: 'Date',
                  render: (value, row) => (
                    <div className="text-sm text-gray-500 text-left space-y-2">
                      <div>
                        <div className="font-medium text-gray-700">Submitted:</div>
                        <div className="text-xs">{new Date(value).toLocaleDateString()}</div>
                        <div className="text-xs">{new Date(value).toLocaleTimeString()}</div>
                      </div>
                      {row.reviewedDate && (
                        <div>
                          <div className="font-medium text-gray-700">
                            {row.status === 'approved' ? 'Approved:' : 'Rejected:'}
                          </div>
                          <div className="text-xs">{new Date(row.reviewedDate).toLocaleDateString()}</div>
                          <div className="text-xs">{new Date(row.reviewedDate).toLocaleTimeString()}</div>
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  key: 'actions',
                  label: 'Actions',
                  render: (value, row) => (
                    <div className="text-center">
                      {row.status !== 'approved' && (
                        <button
                          onClick={() => handleDelete(row.id, row.status)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} className="mr-1" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      )}
                      {row.status === 'approved' && (
                        <span className="text-xs text-gray-400 italic">Locked</span>
                      )}
                    </div>
                  ),
                  sortable: false
                }
              ]}
              filters={{
                dateKey: 'submittedAt'
              }}
              pageSize={10}
              searchPlaceholder="Search payment methods..."
            />
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700 text-center italic">
                Funds will be only credited to approved payment methods
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentDetails;

