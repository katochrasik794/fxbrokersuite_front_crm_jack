import React, { useState, useEffect } from 'react';
import Card from '../../../ui/Card';
import StatCard from '../../../ui/StatCard';
import Table from '../../../ui/Table';
import Button from '../../../ui/Button';
import {
  DollarSign,
  CheckCircle,
  TrendingUp,
  Users,
  Plus,
  X,
  Edit,
  Trash2,
  RefreshCw,
  Search,
} from 'lucide-react';
import WaveLoader from '../../../ui/WaveLoader';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fxbrokersuite-back-crm-jack.onrender.com/api';

function CommissionDistribution() {
  const [distributions, setDistributions] = useState([]);
  const [activeGroups, setActiveGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState(null);
  const [searchUsersQuery, setSearchUsersQuery] = useState('');
  const [foundUsers, setFoundUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [formData, setFormData] = useState({
    group_path: '',
    display_name: '',
    pip_value: 0,
    availability: 'All Users',
    is_active: true
  });
  const [toast, setToast] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);

  const fetchDistributions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/ib-requests/commission-distributions`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        setDistributions(data.data);
      }
    } catch (err) {
      console.error('Error fetching distributions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveGroups = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ib-requests/active-groups`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        setActiveGroups(data.data);
      }
    } catch (err) {
      console.error('Error fetching active groups:', err);
    }
  };

  const searchUsers = async (query = '') => {
    try {
      setUsersLoading(true);
      const res = await fetch(`${API_BASE_URL}/ib-requests/users-search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        setFoundUsers(data.data);
      }
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchDistributions();
    fetchActiveGroups();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchUsersQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchUsersQuery]);

  useEffect(() => {
    if ((showAddModal || showEditModal) && formData.availability === 'Selected Users' && foundUsers.length === 0) {
      searchUsers('');
    }
  }, [showAddModal, showEditModal, formData.availability, foundUsers.length]);

  const summaryStats = {
    totalDistributions: distributions.length,
    activeDistributions: distributions.filter(d => d.is_active).length,
    averagePipValue: distributions.length > 0
      ? (distributions.reduce((acc, d) => acc + parseFloat(d.pipValue || 0), 0) / distributions.length).toFixed(2)
      : '0.00',
    availableGroups: activeGroups.length,
  };

  const distributionColumns = [
    {
      key: 'id',
      label: 'ID',
      render: (value) => <span className="font-semibold text-gray-900">{value}</span>,
    },
    {
      key: 'displayName',
      label: 'Group Name',
      render: (value) => (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
          {value}
        </span>
      ),
    },
    {
      key: 'groupPath',
      label: 'Group Path',
      render: (value) => (
        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
          {value}
        </span>
      ),
    },
    {
      key: 'pipValue',
      label: 'Pip Value',
      render: (value) => <span className="font-semibold text-gray-900">{value}</span>,
    },
    {
      key: 'availability',
      label: 'Availability',
      render: (value, row) => (
        <div>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
            {value}
          </span>
          {row.availabilityCount > 0 && (
            <div className="text-xs text-gray-600 mt-1">({row.availabilityCount} users)</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${value === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'created',
      label: 'Created',
      render: (value) => <span className="text-gray-700 text-xs">{new Date(value).toLocaleString()}</span>,
    },
    {
      key: 'updated',
      label: 'Updated',
      render: (value) => <span className="text-gray-700 text-xs">{new Date(value).toLocaleString()}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <button
            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
            title="Edit"
            onClick={() => handleEdit(row)}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Delete"
            onClick={() => handleDelete(row.id)}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleAdd = () => {
    setFormData({
      group_path: '',
      display_name: '',
      pip_value: 0,
      availability: 'All Users',
      is_active: true
    });
    setSelectedUserIds([]);
    setFoundUsers([]);
    setSearchUsersQuery('');
    searchUsers('');
    setShowAddModal(true);
  };

  const handleEdit = (row) => {
    setSelectedDistribution(row);
    setFormData({
      group_path: row.groupPath,
      display_name: row.displayName,
      pip_value: row.pipValue,
      availability: row.availability,
      is_active: row.is_active
    });
    setSelectedUserIds(row.selectedUsers?.map(u => u.id) || []);
    setFoundUsers(row.selectedUsers || []);
    setSearchUsersQuery('');
    searchUsers('');
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this distribution?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/ib-requests/commission-distributions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchDistributions();
      }
    } catch (err) {
      console.error('Error deleting distribution:', err);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedDistribution(null);
    setSearchUsersQuery('');
    setFormData({
      group_path: '',
      display_name: '',
      pip_value: 0,
      availability: 'All Users',
      is_active: true
    });
    setSelectedUserIds([]);
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/ib-requests/commission-distributions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          user_ids: selectedUserIds
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchDistributions();
        handleCloseModal();
      }
    } catch (err) {
      console.error('Error saving distribution:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/ib-requests/commission-distributions/${selectedDistribution.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          user_ids: selectedUserIds
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchDistributions();
        handleCloseModal();
      }
    } catch (err) {
      console.error('Error updating distribution:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGroupSelectChange = (e) => {
    const path = e.target.value;
    const group = activeGroups.find(g => g.groupName === path);
    setFormData(prev => ({
      ...prev,
      group_path: path,
      display_name: group ? group.displayName : ''
    }));
  };

  return (
    <div className="w-full space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>IB Portal</span>
          <span>{'>'}</span>
          <span className="text-gray-900 font-medium">Commission Distribution</span>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Commission Distribution</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">TOTAL DISTRIBUTIONS</p>
              <p className="text-3xl font-bold text-gray-900 mb-3">{summaryStats.totalDistributions}</p>
              <Button variant="outline" size="sm" icon={DollarSign}>
                Pip Values
              </Button>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">ACTIVE DISTRIBUTIONS</p>
              <p className="text-3xl font-bold text-gray-900 mb-3">{summaryStats.activeDistributions}</p>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                <CheckCircle className="w-3 h-3" />
                Active
              </span>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">AVERAGE PIP VALUE</p>
              <p className="text-3xl font-bold text-gray-900 mb-3">{summaryStats.averagePipValue}</p>
              <Button variant="outline" size="sm" icon={TrendingUp}>
                Average
              </Button>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">AVAILABLE GROUPS</p>
              <p className="text-3xl font-bold text-gray-900 mb-3">{summaryStats.availableGroups}</p>
              <Button variant="outline" size="sm" icon={Users} className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200">
                Groups
              </Button>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Commission Distribution Actions */}
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Commission Distribution Actions</h3>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleAdd}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Add Group
            </Button>
          </div>
        </div>
      </Card>

      {/* Commission Distribution Settings Table */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Commission Distribution Settings</h2>
        <Table
          rows={distributions}
          columns={distributionColumns}
          pageSize={25}
          loading={loading}
          searchPlaceholder="Search distributions..."
          filters={{
            searchKeys: ['displayName', 'groupPath'],
            dateKey: 'created',
            selects: [
              {
                key: 'status',
                label: 'All Statuses',
                options: ['Active', 'Inactive'],
              },
              {
                key: 'availability',
                label: 'All Availabilities',
                options: ['All Users', 'Selected Users'],
              },
            ],
          }}
        />
      </Card>

      {/* Add Commission Distribution Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Add Commission Distribution</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Group <span className="text-red-500">*</span>
                </label>
                <select
                  name="group_path"
                  value={formData.group_path}
                  onChange={handleGroupSelectChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
                >
                  <option value="">Select a group...</option>
                  {activeGroups.map((group) => (
                    <option key={group.id} value={group.groupName}>
                      {group.displayName} ({group.groupName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  placeholder="e.g., ECN+, Pro, Standard"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">User-friendly name shown in trading account dropdown</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pip Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="pip_value"
                  value={formData.pip_value}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="Enter pip value"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Enter the pip value for this group (0.00 - 100.00)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Availability <span className="text-red-500">*</span>
                </label>
                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
                >
                  <option value="All Users">All Users</option>
                  <option value="Selected Users">Selected Users</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-ib-500 border-gray-300 rounded focus:ring-ib-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              {/* Select Users Section */}
              {formData.availability === 'Selected Users' && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Select Users</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={searchUsersQuery}
                      onChange={(e) => setSearchUsersQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3 max-h-60 overflow-y-auto">
                    {usersLoading ? (
                      <WaveLoader message="loading users please wait" />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {foundUsers.map((user) => (
                          <div
                            key={user.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedUserIds.includes(user.id)
                              ? 'bg-ib-50 border-ib-200 shadow-sm'
                              : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            onClick={() => toggleUserSelection(user.id)}
                          >
                            <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedUserIds.includes(user.id)
                              ? 'bg-ib-500 border-ib-500 text-white'
                              : 'bg-white border-gray-300'
                              }`}>
                              {selectedUserIds.includes(user.id) && <CheckCircle className="w-3.5 h-3.5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">{user.name}</div>
                              <div className="text-xs text-gray-500 truncate">{user.email}</div>
                            </div>
                          </div>
                        ))}
                        {foundUsers.length === 0 && (
                          <div className="col-span-2 text-center py-4 text-gray-500">
                            {searchUsersQuery ? 'No users found' : 'No users available'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedUserIds.length > 0 && (
                    <p className="text-xs font-semibold text-ib-600">
                      {selectedUserIds.length} users selected
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <Button variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={submitting || !formData.group_path || !formData.display_name}>
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Commission
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Commission Distribution Modal */}
      {showEditModal && selectedDistribution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Edit Commission Distribution</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group Path</label>
                <input
                  type="text"
                  value={formData.group_path}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Backend group path (read-only)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">User-friendly name shown in trading account dropdown</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pip Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="pip_value"
                  value={formData.pip_value}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability <span className="text-red-500">*</span>
                </label>
                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
                >
                  <option value="All Users">All Users</option>
                  <option value="Selected Users">Selected Users</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-ib-500 border-gray-300 rounded focus:ring-ib-500"
                />
                <label htmlFor="edit-active" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              {/* Select Users Section */}
              {formData.availability === 'Selected Users' && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Select Users</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={searchUsersQuery}
                      onChange={(e) => setSearchUsersQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3 max-h-60 overflow-y-auto">
                    {usersLoading ? (
                      <WaveLoader message="loading users please wait" />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {foundUsers.map((user) => (
                          <div
                            key={user.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedUserIds.includes(user.id)
                              ? 'bg-ib-50 border-ib-200 shadow-sm'
                              : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            onClick={() => toggleUserSelection(user.id)}
                          >
                            <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedUserIds.includes(user.id)
                              ? 'bg-ib-500 border-ib-500 text-white'
                              : 'bg-white border-gray-300'
                              }`}>
                              {selectedUserIds.includes(user.id) && <CheckCircle className="w-3.5 h-3.5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">{user.name}</div>
                              <div className="text-xs text-gray-500 truncate">{user.email}</div>
                            </div>
                          </div>
                        ))}
                        {foundUsers.length === 0 && (
                          <div className="col-span-2 text-center py-4 text-gray-500">
                            {searchUsersQuery ? 'No users found' : 'No users available'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedUserIds.length > 0 && (
                    <p className="text-xs font-semibold text-ib-600">
                      {selectedUserIds.length} users selected
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <Button variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdate} disabled={submitting}>
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                Update
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommissionDistribution;
