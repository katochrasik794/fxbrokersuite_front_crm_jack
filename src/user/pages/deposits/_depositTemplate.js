// Template for deposit pages with limits support
// Copy this pattern to all deposit pages

import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import authService from '../../../services/auth.js'

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Replace this function name with your deposit method name
export function DepositTemplate() {
  const navigate = useNavigate();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedAccountType, setSelectedAccountType] = useState('mt5');
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

  const getSelectedAccountLimits = () => {
    if (selectedAccountType === 'mt5' && selectedAccount) {
      return {
        min: selectedAccount.minimum_deposit !== null && selectedAccount.minimum_deposit !== undefined 
          ? parseFloat(selectedAccount.minimum_deposit) 
          : null,
        max: selectedAccount.maximum_deposit !== null && selectedAccount.maximum_deposit !== undefined 
          ? parseFloat(selectedAccount.maximum_deposit) 
          : null
      };
    }
    return { min: null, max: null };
  };

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
      setAmountError(`Only allowed to deposit $${limits.max.toFixed(2)}`);
      return;
    }

    setAmountError('');
  }, [amount, selectedAccount, selectedAccountType]);

  const formatLimits = () => {
    const limits = getSelectedAccountLimits();
    if (limits.min === null && limits.max === null) {
      return 'No limits set';
    }
    if (limits.max === null) {
      return `$${limits.min.toFixed(2)} - No maximum`;
    }
    return `$${limits.min.toFixed(2)} - $${limits.max.toFixed(2)}`;
  };

  // Use this in your JSX:
  // 1. Show limits below each account card
  // 2. Show limits near amount input
  // 3. Show validation errors
  // 4. Disable submit button when invalid
}

