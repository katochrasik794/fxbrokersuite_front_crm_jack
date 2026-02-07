import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  CreditCard,
  Upload,
  QrCode,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Smartphone,
  Banknote,
  Building2,
  Star,
  TrendingDown
} from "lucide-react";
import ProTable from "../components/ProTable.jsx";

const BASE = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || "https://fxbrokersuite-back-crm-jack.onrender.com/api";

const GATEWAY_TYPES = [
  { value: 'crypto', label: 'Cryptocurrency', icon: DollarSign, color: 'bg-orange-100 text-orange-800' },
  { value: 'wire', label: 'Wire Transfer', icon: Building2, color: 'bg-blue-100 text-blue-800' },
  { value: 'upi', label: 'UPI', icon: Smartphone, color: 'bg-green-100 text-green-800' },
  { value: 'local', label: 'Local Depositor', icon: Banknote, color: 'bg-brand-100 text-brand-900' }
];

export default function PaymentGatewaysWithdrawal() {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);
  const [showQR, setShowQR] = useState({});
  const [viewingImage, setViewingImage] = useState(null); // { type: 'icon' | 'qr', url: string }
  const [formData, setFormData] = useState({
    type: "upi",
    name: "",
    details: "",
    icon: null,
    qr_code: null,
    is_active: true,
    is_deposit_enabled: false,
    is_withdrawal_enabled: true,
    // UPI / Crypto
    vpa_address: "",
    crypto_address: "",
    // Bank
    bank_name: "",
    account_name: "",
    account_number: "",
    ifsc_code: "",
    swift_code: "",
    account_type: "",
    country_code: ""
  });
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    fetchGateways();
    // load countries for bank gateway eligibility
    (async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const r = await fetch(`${BASE}/admin/countries`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const j = await r.json();
        const items = Array.isArray(j?.countries) ? j.countries : (Array.isArray(j) ? j : []);
        setCountries(items);
      } catch (err) {
        console.error('Failed to load countries:', err);
      }
    })();
  }, []);

  const fetchGateways = async () => {
    try {
      setError('');
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(`${BASE}/admin/manual-gateways`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter only withdrawal-enabled gateways
        const withdrawalGateways = (Array.isArray(data.gateways) ? data.gateways : []).filter(
          g => g.is_withdrawal_enabled === true
        );
        setGateways(withdrawalGateways);
        setError('');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || errorData.message || 'Failed to fetch withdrawal gateways');
        setGateways([]);
      }
    } catch (err) {
      console.error('Fetch gateways error:', err);
      setError('Failed to fetch withdrawal gateways. Please check your connection.');
      setGateways([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('adminToken');
      const formDataToSend = new FormData();
      formDataToSend.append('type', formData.type);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('details', formData.details);
      formDataToSend.append('is_active', formData.is_active);
      formDataToSend.append('is_deposit_enabled', formData.is_deposit_enabled);
      formDataToSend.append('is_withdrawal_enabled', formData.is_withdrawal_enabled);
      // method-specific fields
      formDataToSend.append('vpa_address', formData.vpa_address || '');
      formDataToSend.append('crypto_address', formData.crypto_address || '');
      formDataToSend.append('bank_name', formData.bank_name || '');
      formDataToSend.append('account_name', formData.account_name || '');
      formDataToSend.append('account_number', formData.account_number || '');
      formDataToSend.append('ifsc_code', formData.ifsc_code || '');
      formDataToSend.append('swift_code', formData.swift_code || '');
      formDataToSend.append('account_type', formData.account_type || '');
      formDataToSend.append('country_code', formData.country_code || '');

      if (formData.icon) {
        formDataToSend.append('icon', formData.icon);
      }
      if (formData.qr_code) {
        formDataToSend.append('qr_code', formData.qr_code);
      }

      const url = editingGateway
        ? `${BASE}/admin/manual-gateways/${editingGateway.id}`
        : `${BASE}/admin/manual-gateways`;

      const method = editingGateway ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend
      });

      if (response.ok) {
        const data = await response.json();
        await fetchGateways(); // Refresh list
        setShowForm(false);
        setEditingGateway(null);
        setFormData({
          type: "upi",
          name: "",
          details: "",
          icon: null,
          qr_code: null,
          is_active: true,
          is_deposit_enabled: false,
          is_withdrawal_enabled: true,
          vpa_address: "",
          crypto_address: "",
          bank_name: "",
          account_name: "",
          account_number: "",
          ifsc_code: "",
          swift_code: "",
          account_type: "",
          country_code: ""
        });
        setError("");
        Swal.fire({ icon: 'success', title: editingGateway ? 'Gateway updated' : 'Gateway saved', timer: 1400, showConfirmButton: false });
      } else {
        const data = await response.json();
        const msg = data.error || 'Failed to save gateway';
        setError(msg);
        Swal.fire({ icon: 'error', title: 'Save failed', text: msg });
      }
    } catch (err) {
      setError('Failed to save gateway');
      Swal.fire({ icon: 'error', title: 'Save failed', text: err.message || String(err) });
    }
  };

  const handleEdit = (gateway) => {
    setEditingGateway(gateway);
    setFormData({
      type: gateway.type,
      name: gateway.name,
      details: gateway.details,
      icon: null,
      qr_code: null,
      is_active: gateway.is_active,
      is_deposit_enabled: gateway.is_deposit_enabled !== undefined ? gateway.is_deposit_enabled : false,
      is_withdrawal_enabled: gateway.is_withdrawal_enabled !== undefined ? gateway.is_withdrawal_enabled : true,
      vpa_address: gateway.vpa_address || '',
      crypto_address: gateway.crypto_address || '',
      bank_name: gateway.bank_name || '',
      account_name: gateway.account_name || '',
      account_number: gateway.account_number || '',
      ifsc_code: gateway.ifsc_code || '',
      swift_code: gateway.swift_code || '',
      account_type: gateway.account_type || '',
      country_code: gateway.country_code || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this gateway?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE}/admin/manual-gateways/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await fetchGateways(); // Refresh list
        setError("");
        Swal.fire({ icon: 'success', title: 'Gateway deleted', timer: 1200, showConfirmButton: false });
      } else {
        const msg = 'Failed to delete gateway';
        setError(msg);
        Swal.fire({ icon: 'error', title: 'Delete failed', text: msg });
      }
    } catch (err) {
      setError('Failed to delete gateway');
      Swal.fire({ icon: 'error', title: 'Delete failed', text: err.message || String(err) });
    }
  };

  const handleToggleStatus = async (gateway) => {
    try {
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`${BASE}/admin/manual-gateways/${gateway.id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        await fetchGateways(); // Refresh list
        setError("");
        Swal.fire({
          icon: 'success',
          title: `Gateway ${data.gateway.is_active ? 'activated' : 'deactivated'}`,
          timer: 1200,
          showConfirmButton: false
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error || 'Failed to update gateway status';
        setError(msg);
        Swal.fire({ icon: 'error', title: 'Update failed', text: msg });
      }
    } catch (err) {
      setError('Failed to update gateway status');
      Swal.fire({ icon: 'error', title: 'Update failed', text: err.message || String(err) });
    }
  };

  const handleToggleRecommended = async (gateway) => {
    try {
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`${BASE}/admin/manual-gateways/${gateway.id}/toggle-recommended`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        await fetchGateways(); // Refresh list
        setError("");
        Swal.fire({
          icon: 'success',
          title: `Gateway ${data.gateway.is_recommended ? 'marked as recommended' : 'removed from recommended'}`,
          timer: 1200,
          showConfirmButton: false
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error || 'Failed to update gateway recommendation';
        setError(msg);
        Swal.fire({ icon: 'error', title: 'Update failed', text: msg });
      }
    } catch (err) {
      setError('Failed to update gateway recommendation');
      Swal.fire({ icon: 'error', title: 'Update failed', text: err.message || String(err) });
    }
  };

  const getTypeInfo = (type) => {
    return GATEWAY_TYPES.find(t => t.value === type) || GATEWAY_TYPES[0];
  };

  const getStatusInfo = (isActive) => {
    return isActive
      ? { icon: CheckCircle, label: 'Active', color: 'text-green-600' }
      : { icon: AlertCircle, label: 'Inactive', color: 'text-gray-400' };
  };

  const fileUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = BASE.replace('/api', '');
    return `${base}${path}`;
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading withdrawal gateways...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingDown className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
            Withdrawal Gateways
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            Manage payment gateways available for user withdrawals
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-dark-base px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Withdrawal Gateway</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Currently Active Methods Summary */}
      {!loading && gateways.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Currently Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {gateways.filter(g => g.is_active).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  of {gateways.length} withdrawal gateways
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">
                  {gateways.filter(g => !g.is_active).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  withdrawal gateways
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Also Enabled for Deposits</p>
                <p className="text-2xl font-bold text-gray-900">
                  {gateways.filter(g => g.is_deposit_enabled !== false).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  withdrawal gateways
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {editingGateway ? 'Edit Withdrawal Gateway' : 'Add New Withdrawal Gateway'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingGateway(null);
                  setFormData({
                    type: "upi",
                    name: "",
                    details: "",
                    icon: null,
                    qr_code: null,
                    is_active: true,
                    is_deposit_enabled: false,
                    is_withdrawal_enabled: true,
                    vpa_address: "",
                    crypto_address: "",
                    bank_name: "",
                    account_name: "",
                    account_number: "",
                    ifsc_code: "",
                    swift_code: "",
                    account_type: "",
                    country_code: ""
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Gateway Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    {GATEWAY_TYPES.map((t) => {
                      const Icon = t.icon;
                      return (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Gateway Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., UPI PAYMENT, USDT TRC20"
                    required
                  />
                </div>
              </div>

              {/* Type-specific fields */}
              {(formData.type === 'upi') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">VPA Address *</label>
                  <input
                    type="text"
                    value={formData.vpa_address}
                    onChange={(e) => setFormData({ ...formData, vpa_address: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="username@bank"
                    required
                  />
                </div>
              )}

              {(formData.type === 'crypto') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Crypto Address *</label>
                  <input
                    type="text"
                    value={formData.crypto_address}
                    onChange={(e) => setFormData({ ...formData, crypto_address: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Wallet address"
                    required
                  />
                </div>
              )}

              {(formData.type === 'wire') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Bank Name *</label>
                    <input type="text" value={formData.bank_name} onChange={e => setFormData({ ...formData, bank_name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Account Name *</label>
                    <input type="text" value={formData.account_name} onChange={e => setFormData({ ...formData, account_name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Account Number *</label>
                    <input type="text" value={formData.account_number} onChange={e => setFormData({ ...formData, account_number: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">IFSC / SWIFT Code *</label>
                    <input type="text" value={formData.ifsc_code || formData.swift_code} onChange={e => setFormData({ ...formData, ifsc_code: e.target.value, swift_code: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Account Type</label>
                    <input type="text" value={formData.account_type} onChange={e => setFormData({ ...formData, account_type: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Savings / Current" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Eligible Country *</label>
                    <select value={formData.country_code} onChange={e => setFormData({ ...formData, country_code: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                      <option value="">Select Country</option>
                      {countries.map(c => (
                        <option key={c.code || c.country_code || c.id} value={(c.code || '').toUpperCase()}>{c.country || c.name} ({c.code})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Icon
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, icon: e.target.files[0] })}
                      className="hidden"
                      id="icon-upload"
                    />
                    <label
                      htmlFor="icon-upload"
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">Choose file</span>
                    </label>
                    <span className="text-sm text-gray-500">
                      {formData.icon ? formData.icon.name : 'No file chosen'}
                    </span>
                  </div>
                </div>

                {(['upi', 'crypto'].includes(formData.type)) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      QR Code
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFormData({ ...formData, qr_code: e.target.files[0] })}
                        className="hidden"
                        id="qr-upload"
                      />
                      <label
                        htmlFor="qr-upload"
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <QrCode className="h-4 w-4" />
                        <span className="text-sm">Choose file</span>
                      </label>
                      <span className="text-sm text-gray-500">
                        {formData.qr_code ? formData.qr_code.name : 'No file chosen'}
                      </span>
                    </div>
                  </div>
                )}
                {formData.type !== 'upi' && formData.type !== 'crypto' && (
                  <div className="text-xs text-gray-500 md:col-span-2">QR is typically not used for bank transfer; you may leave it blank.</div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-blue-700 focus:ring-blue-600"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Active Gateway
                  </label>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_deposit_enabled"
                    checked={formData.is_deposit_enabled}
                    onChange={(e) => setFormData({ ...formData, is_deposit_enabled: e.target.checked })}
                    className="rounded border-gray-300 text-blue-700 focus:ring-blue-600"
                  />
                  <label htmlFor="is_deposit_enabled" className="text-sm text-gray-700">
                    Enable for Deposits
                  </label>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_withdrawal_enabled"
                    checked={formData.is_withdrawal_enabled}
                    onChange={(e) => setFormData({ ...formData, is_withdrawal_enabled: e.target.checked })}
                    className="rounded border-gray-300 text-blue-700 focus:ring-blue-600"
                  />
                  <label htmlFor="is_withdrawal_enabled" className="text-sm text-gray-700">
                    Enable for Withdrawals *
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingGateway(null);
                    setFormData({
                      type: "upi",
                      name: "",
                      details: "",
                      icon: null,
                      qr_code: null,
                      is_active: true,
                      is_deposit_enabled: false,
                      is_withdrawal_enabled: true,
                      vpa_address: "",
                      crypto_address: "",
                      bank_name: "",
                      account_name: "",
                      account_number: "",
                      ifsc_code: "",
                      swift_code: "",
                      account_type: "",
                      country_code: ""
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-dark-base rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingGateway ? 'Update Gateway' : 'Save Gateway'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gateways Table (ProTable) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Withdrawal Gateways</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Gateways enabled for user withdrawals</p>
        </div>

          {gateways.length === 0 ? (
            <div className="p-8 text-center">
              <TrendingDown className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Withdrawal Gateways Found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first withdrawal gateway</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-dark-base px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Add Gateway
              </button>
            </div>
          ) : (
            <div className="p-4">
              <ProTable
                title={null}
                rows={gateways.map((g, i) => ({
                  __index: i + 1,
                  type: g.type,
                  name: g.name,
                  icon: g.icon_url,
                  qr: g.qr_code_url,
                  details: g, // pass full gateway for render
                  status: g.is_active ? 'Active' : 'Inactive',
                  deposit_enabled: g.is_deposit_enabled !== undefined ? g.is_deposit_enabled : false,
                  withdrawal_enabled: g.is_withdrawal_enabled !== undefined ? g.is_withdrawal_enabled : true,
                  actions: g,
                }))}
                columns={[
                  { key: '__index', label: '#', sortable: false },
                  {
                    key: 'type', label: 'Type', render: (v) => {
                      const info = getTypeInfo(v);
                      const Icon = info.icon;
                      return (
                        <span className={`inline-flex items-center gap-2 px-2 py-1 text-xs font-semibold rounded-full ${info.color}`}>
                          <Icon className="h-3 w-3" /> {info.label}
                        </span>
                      );
                    }
                  },
                  { key: 'name', label: 'Name' },
                  {
                    key: 'icon', label: 'Icon', render: (v) => (
                      v ? (
                        <img
                          src={fileUrl(v)}
                          alt="icon"
                          className="h-8 w-8 rounded-full object-cover mx-auto"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling?.remove();
                            const fallback = document.createElement('div');
                            fallback.className = 'h-8 w-8 rounded-full bg-gray-100 grid place-items-center mx-auto';
                            fallback.innerHTML = '<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>';
                            e.target.parentNode?.appendChild(fallback);
                          }}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-100 grid place-items-center mx-auto">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                        </div>
                      )
                    )
                  },
                  {
                    key: 'qr', label: 'QR', render: (v) => (
                      v ? (
                        <img
                          src={fileUrl(v)}
                          alt="QR"
                          className="h-8 w-8 rounded object-cover mx-auto"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"%3E%3Cpath fill="%23ccc" d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/%3E%3C/svg%3E';
                          }}
                        />
                      ) : <span className="text-gray-400 text-sm">No QR</span>
                    )
                  },
                  {
                    key: 'details', label: 'Details', render: (_v, row) => {
                      const g = row.details;
                      if (g.type === 'upi') {
                        return <div className="text-xs text-gray-700"><b>VPA:</b> {g.vpa_address || '-'}</div>;
                      }
                      if (g.type === 'crypto') {
                        return <div className="text-xs text-gray-700"><b>Address:</b> {g.crypto_address || '-'}</div>;
                      }
                      if (g.type === 'wire') {
                        return (
                          <div className="text-xs text-gray-700 text-left">
                            <div><b>Bank:</b> {g.bank_name || '-'}</div>
                            <div><b>Account:</b> {g.account_name || '-'}</div>
                            <div><b>Number:</b> {g.account_number || '-'}</div>
                            <div><b>IFSC/SWIFT:</b> {g.ifsc_code || g.swift_code || '-'}</div>
                            <div><b>Type:</b> {g.account_type || '-'}</div>
                            <div><b>Country:</b> {g.country_code || '-'}</div>
                          </div>
                        );
                      }
                      return <div className="text-xs text-gray-700">{g.details || '-'}</div>;
                    }
                  },
                  {
                    key: 'status', label: 'Status', render: (_v, row) => {
                      const g = row.details;
                      const isActive = g.is_active;
                      const info = getStatusInfo(isActive);
                      const Icon = info.icon;
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Icon className={info.color} size={14} />
                            <span className={`text-xs font-medium ${info.color}`}>
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 space-y-0.5">
                            {g.is_deposit_enabled && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span>Deposit</span>
                              </div>
                            )}
                            {g.is_withdrawal_enabled && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-blue-500" />
                                <span>Withdrawal</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                  },
                  {
                    key: 'actions', label: 'Actions', sortable: false, render: (_v, row) => {
                      const gateway = row.actions;
                      return (
                        <div className="flex items-center justify-center gap-1.5">
                          {gateway.icon_url && (
                            <div className="flex flex-col items-center gap-0.5">
                              <button
                                onClick={() => setViewingImage({ type: 'icon', url: fileUrl(gateway.icon_url) })}
                                className="p-1.5 w-8 h-8 flex items-center justify-center text-blue-600 hover:text-blue-900 hover:bg-blue-50 border border-blue-200 rounded"
                                title="View Icon"
                              >
                                <Eye className="h-3 w-3" />
                              </button>
                              <span className="text-[8px] text-gray-600 whitespace-nowrap leading-tight">View</span>
                            </div>
                          )}
                          {gateway.qr_code_url && (
                            <div className="flex flex-col items-center gap-0.5">
                              <button
                                onClick={() => setViewingImage({ type: 'qr', url: fileUrl(gateway.qr_code_url) })}
                                className="p-1.5 w-8 h-8 flex items-center justify-center text-blue-700 hover:text-brand-900 hover:bg-brand-50 border border-brand-200 rounded"
                                title="View QR Code"
                              >
                                <Eye className="h-3 w-3" />
                              </button>
                              <span className="text-[8px] text-gray-600 whitespace-nowrap leading-tight">QR</span>
                            </div>
                          )}
                          <div className="flex flex-col items-center gap-0.5">
                            <button onClick={() => handleEdit(gateway)} className="p-1.5 w-8 h-8 flex items-center justify-center text-orange-600 hover:text-orange-900 hover:bg-orange-50 border border-orange-200 rounded" title="Edit Gateway">
                              <Edit className="h-3 w-3" />
                            </button>
                            <span className="text-[8px] text-gray-600 whitespace-nowrap leading-tight">Edit</span>
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <button onClick={() => handleDelete(gateway.id)} className="p-1.5 w-8 h-8 flex items-center justify-center text-red-600 hover:text-red-900 hover:bg-red-50 border border-red-200 rounded" title="Delete Gateway">
                              <Trash2 className="h-3 w-3" />
                            </button>
                            <span className="text-[8px] text-gray-600 whitespace-nowrap leading-tight">Delete</span>
                          </div>
                          {/* Recommended Toggle */}
                          <div className="flex flex-col items-center gap-0.5">
                            <button
                              onClick={() => handleToggleRecommended(gateway)}
                              className={`p-1.5 w-8 h-8 flex items-center justify-center border rounded transition-all ${gateway.is_recommended
                                  ? 'text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 border-yellow-200 bg-yellow-50'
                                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-gray-200'
                                }`}
                              title={gateway.is_recommended ? 'Remove from Recommended' : 'Mark as Recommended'}
                            >
                              <Star className={`h-3 w-3 ${gateway.is_recommended ? 'fill-current' : ''}`} />
                            </button>
                            <span className="text-[8px] text-gray-600 whitespace-nowrap leading-tight">Star</span>
                          </div>
                          {/* Toggle Switch with Label */}
                          <div className="flex flex-col items-center gap-0.5">
                            <button
                              onClick={() => handleToggleStatus(gateway)}
                              className={`relative inline-flex h-5 w-7 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-1 focus:ring-offset-1 shadow-sm ${gateway.is_active
                                  ? 'bg-gradient-to-r from-green-400 to-green-600 focus:ring-green-400 shadow-green-200'
                                  : 'bg-gradient-to-r from-gray-300 to-gray-400 focus:ring-gray-300 shadow-gray-200'
                                }`}
                              role="switch"
                              aria-checked={gateway.is_active}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${gateway.is_active ? 'translate-x-3' : 'translate-x-0.5'
                                  }`}
                              />
                            </button>
                            <span className="text-[8px] text-gray-600 whitespace-nowrap leading-tight">Toggle</span>
                          </div>
                        </div>
                      );
                    }
                  }
                ]}
              />
            </div>
          )}
        </div>

        {/* Image View Modal */}
        {viewingImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={() => setViewingImage(null)}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative">
              <button
                onClick={() => setViewingImage(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {viewingImage.type === 'icon' ? 'Gateway Icon' : 'QR Code'}
              </h3>
              <div className="flex justify-center">
                <img
                  src={viewingImage.url}
                  alt={viewingImage.type === 'icon' ? 'Gateway Icon' : 'QR Code'}
                  className="max-w-full max-h-96 object-contain"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23ccc"%3EImage not found%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

