import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  CreditCard,
  Wallet,
  Key,
  Globe,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from "lucide-react";

const BASE = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:5000/api";

export default function PaymentGatewaysAutomatic() {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);
  const [showApiKey, setShowApiKey] = useState({});
  const [formData, setFormData] = useState({
    wallet_name: "",
    deposit_wallet_address: "",
    api_key: "",
    secret_key: "",
    project_id: "", // For Cregis
    gateway_url: "", // For Cregis
    webhook_secret: "", // For Cregis
    gateway_type: "Cryptocurrency",
    is_active: true,
    description: ""
  });

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE}/admin/payment-gateways`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGateways(data.gateways || []);
      } else {
        setError('Failed to fetch payment gateways');
      }
    } catch (err) {
      setError('Failed to fetch payment gateways');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('adminToken');
      const url = editingGateway
        ? `${BASE}/api/admin/payment-gateways/${editingGateway.id}`
        : `${BASE}/api/admin/payment-gateways`;

      const method = editingGateway ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        if (editingGateway) {
          setGateways(gateways.map(g => g.id === editingGateway.id ? data.gateway : g));
        } else {
          setGateways([...gateways, data.gateway]);
        }
        setShowForm(false);
        setEditingGateway(null);
        setFormData({
          wallet_name: "",
          deposit_wallet_address: "",
          api_key: "",
          secret_key: "",
          project_id: "",
          gateway_url: "",
          webhook_secret: "",
          gateway_type: "Cryptocurrency",
          is_active: true,
          description: "",
          display_order: 0
        });
        setError("");
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save gateway');
      }
    } catch (err) {
      setError('Failed to save gateway');
    }
  };

  const handleEdit = (gateway) => {
    setEditingGateway(gateway);
    setFormData({
      wallet_name: gateway.wallet_name || "",
      deposit_wallet_address: gateway.deposit_wallet_address || "",
      api_key: gateway.api_key || "",
      secret_key: gateway.secret_key || "",
      project_id: gateway.project_id || "",
      gateway_url: gateway.gateway_url || "",
      webhook_secret: gateway.webhook_secret || "",
      gateway_type: gateway.gateway_type || "Cryptocurrency",
      is_active: gateway.is_active !== undefined ? gateway.is_active : true,
      description: gateway.description || "",
      display_order: gateway.display_order || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this gateway?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE}/api/admin/payment-gateways/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setGateways(gateways.filter(g => g.id !== id));
        setError("");
      } else {
        setError('Failed to delete gateway');
      }
    } catch (err) {
      setError('Failed to delete gateway');
    }
  };

  const toggleApiKeyVisibility = (id) => {
    setShowApiKey(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getStatusInfo = (isActive) => {
    return isActive
      ? { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle }
      : { label: 'Inactive', color: 'bg-red-100 text-red-800', icon: AlertCircle };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Automatic Payment Gateways</h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage API-based payment gateways and crypto wallets</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-brand-500 text-dark-base px-3 sm:px-4 py-2 rounded-lg hover:bg-brand-600 flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Add Gateway</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {editingGateway ? 'Edit Payment Gateway' : 'Add New Payment Gateway'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingGateway(null);
                  setFormData({
                    wallet_name: "",
                    deposit_wallet_address: "",
                    api_key: "",
                    secret_key: "",
                    gateway_type: "Cryptocurrency",
                    project_id: "",
                    gateway_url: "",
                    webhook_secret: "",
                    display_order: 0,
                    is_active: true,
                    description: ""
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wallet Name *
                  </label>
                  <input
                    type="text"
                    value={formData.wallet_name}
                    onChange={(e) => setFormData({ ...formData, wallet_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g., USDT Wallet, Bitcoin Wallet"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gateway Type *
                  </label>
                  <select
                    value={formData.gateway_type}
                    onChange={(e) => setFormData({ ...formData, gateway_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  >
                    <option value="Cryptocurrency">Cryptocurrency</option>
                    <option value="Fiat">Fiat Currency</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deposit Wallet Address
                </label>
                <input
                  type="text"
                  value={formData.deposit_wallet_address}
                  onChange={(e) => setFormData({ ...formData, deposit_wallet_address: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g., 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6 (Optional)"
                />
              </div>

              {/* Project ID and Gateway URL - matching table columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project ID *
                  </label>
                  <input
                    type="text"
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g., 1445920661479424"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gateway URL *
                  </label>
                  <input
                    type="text"
                    value={formData.gateway_url}
                    onChange={(e) => setFormData({ ...formData, gateway_url: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g., https://t-fumzndoo.cregis.io"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key *
                  </label>
                  <input
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Enter API key"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secret Key *
                  </label>
                  <input
                    type="password"
                    value={formData.secret_key}
                    onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Enter secret key"
                    required
                  />
                </div>
              </div>

              {/* Webhook Secret and Display Order */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Webhook Secret
                  </label>
                  <input
                    type="password"
                    value={formData.webhook_secret}
                    onChange={(e) => setFormData({ ...formData, webhook_secret: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Enter webhook secret (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Optional description for this gateway"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Active Gateway
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingGateway(null);
                    setFormData({
                      wallet_name: "",
                      deposit_wallet_address: "",
                      api_key: "",
                      secret_key: "",
                      gateway_type: "Cryptocurrency",
                      project_id: "",
                      gateway_url: "",
                      webhook_secret: "",
                      display_order: 0,
                      is_active: true,
                      description: ""
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 text-dark-base rounded-lg hover:bg-brand-600 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingGateway ? 'Update Gateway' : 'Save Gateway'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Gateways Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Payment Gateways</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your payment gateway configurations</p>
          </div>

          {gateways.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Gateways Found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first payment gateway</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-brand-500 text-dark-base px-4 py-2 rounded-lg hover:bg-brand-600 flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Add Gateway
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gateway
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wallet Address
                    </th>
                    <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project ID
                    </th>
                    <th className="hidden xl:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gateway URL
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      API Key
                    </th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {gateways.map((gateway) => {
                    const statusInfo = getStatusInfo(gateway.is_active);
                    return (
                      <tr key={gateway.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-brand-100 flex items-center justify-center">
                                <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-brand-600" />
                              </div>
                            </div>
                            <div className="ml-2 sm:ml-4">
                              <div className="text-xs sm:text-sm font-medium text-gray-900">{gateway.wallet_name}</div>
                              <div className="text-xs text-gray-500">{gateway.description || 'No description'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden lg:table-cell px-3 sm:px-6 py-4">
                          <div className="text-xs sm:text-sm text-gray-900 font-mono">
                            {gateway.deposit_wallet_address
                              ? (gateway.deposit_wallet_address.length > 20
                                ? `${gateway.deposit_wallet_address.substring(0, 20)}...`
                                : gateway.deposit_wallet_address)
                              : <span className="text-gray-400 italic">Not set</span>
                            }
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-3 sm:px-6 py-4">
                          <div className="text-xs sm:text-sm text-gray-900 font-mono">
                            {gateway.project_id
                              ? (gateway.project_id.length > 15
                                ? `${gateway.project_id.substring(0, 15)}...`
                                : gateway.project_id)
                              : <span className="text-gray-400 italic">Not set</span>
                            }
                          </div>
                        </td>
                        <td className="hidden xl:table-cell px-3 sm:px-6 py-4">
                          <div className="text-xs sm:text-sm text-gray-900 font-mono">
                            {gateway.gateway_url
                              ? (gateway.gateway_url.length > 25
                                ? `${gateway.gateway_url.substring(0, 25)}...`
                                : gateway.gateway_url)
                              : <span className="text-gray-400 italic">Not set</span>
                            }
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-3 sm:px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm text-gray-900 font-mono">
                              {showApiKey[gateway.id]
                                ? (gateway.api_key?.length > 20
                                  ? `${gateway.api_key.substring(0, 20)}...`
                                  : gateway.api_key)
                                : '••••••••••••••••'
                              }
                            </span>
                            <button
                              onClick={() => toggleApiKeyVisibility(gateway.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {showApiKey[gateway.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                        <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {gateway.gateway_type}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <statusInfo.icon className="h-4 w-4" />
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <button
                              onClick={() => handleEdit(gateway)}
                              className="p-1.5 sm:p-2 text-brand-600 hover:text-brand-900 hover:bg-brand-50 rounded-lg transition-colors"
                              title="Edit Gateway"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(gateway.id)}
                              className="p-1.5 sm:p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Gateway"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
