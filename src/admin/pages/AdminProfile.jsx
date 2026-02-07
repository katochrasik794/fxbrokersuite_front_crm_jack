import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Datatable from "../../components/Datatable.jsx";

const BASE =
  import.meta.env.VITE_BACKEND_API_URL ||
  import.meta.env.VITE_API_URL ||
  "https://fxbrokersuite-back-crm-jack.onrender.com/api";
import {
  User,
  Mail,
  Shield,
  Clock,
  MapPin,
  Monitor,
  Globe,
  Key,
  Activity,
  Settings,
  Eye,
  EyeOff,
  Save,
  Edit,
  CheckCircle,
  AlertCircle,
  Info,
  LogOut
} from "lucide-react";

export default function AdminProfile() {
  const { admin, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState({ device: false, all: false });
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    console.log('AdminProfile - admin:', admin);
    console.log('AdminProfile - token:', localStorage.getItem('adminToken'));
    if (admin) {
      fetchProfile();
      fetchLoginHistory();
    }
  }, [admin]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${BASE}/admin/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication failed. Please login again.');
          localStorage.removeItem('adminToken');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.ok) {
        setProfile(data.profile);
        setEditForm({
          username: data.profile.username,
          email: data.profile.email,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        setError(data.error || 'Failed to fetch profile');
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Failed to fetch profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginHistory = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        console.error('No token for login history');
        return;
      }

      const response = await fetch(`${BASE}/admin/login-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Login history fetch failed:', response.status);
        return;
      }

      const data = await response.json();
      if (data.ok) {
        setLoginHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch login history:', err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (editForm.newPassword && editForm.newPassword !== editForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE}/admin/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();
      if (data.ok) {
        setProfile(data.profile);
        setIsEditing(false);
        setError("");
        // Update auth context if needed
        window.location.reload(); // Simple refresh to update context
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  const getRoleInfo = (role) => {
    const roles = {
      'superadmin': { label: 'Super Admin', color: 'bg-red-100 text-red-800', description: 'Full system access' },
      'admin': { label: 'Admin', color: 'bg-blue-100 text-blue-800', description: 'Standard admin access' },
      'moderator': { label: 'Moderator', color: 'bg-green-100 text-green-800', description: 'Limited admin access' },
      'support': { label: 'Support', color: 'bg-yellow-100 text-yellow-800', description: 'Customer support access' },
      'analyst': { label: 'Analyst', color: 'bg-brand-100 text-brand-900', description: 'Analytics and reporting access' }
    };
    return roles[role] || roles['admin'];
  };

  // Define columns for Datatable
  const loginHistoryColumns = [
    {
      key: 'timestamp',
      label: 'Date & Time',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span>
            {new Date(value).toLocaleString()}{" "}
            <span className="text-xs text-gray-400">
              ({formatRelativeTime(value)})
            </span>
          </span>
        </div>
      )
    },
    {
      key: 'ip_address',
      label: 'IP Address',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-gray-400" />
          {value || 'Unknown'}
        </div>
      )
    },
    {
      key: 'location',
      label: 'Location',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          {value || 'Unknown'}
        </div>
      )
    },
    {
      key: 'device',
      label: 'Device',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-gray-400" />
          <span className="truncate max-w-xs">{value || 'Unknown'}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${row.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
            {row.success ? 'Success' : 'Failed'}
          </span>
          {row.isCurrentSession && (
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
              Current Session
            </span>
          )}
        </div>
      )
    }
  ];

  // Transform login history data for Datatable
  const loginHistoryData = loginHistory.map((login) => ({
    ...login,
    status: login.success ? 'Success' : 'Failed'
  }));

  const formatRelativeTime = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHr = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHr / 24);
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${diffDay}d ago`;
  };

  const handleLogoutDevice = async () => {
    if (!confirm('Are you sure you want to logout from this device?')) {
      return;
    }

    setLogoutLoading({ ...logoutLoading, device: true });
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE}/admin/logout/device`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.ok) {
        logout(); // This will redirect to login
      } else {
        setError(data.error || 'Failed to logout from device');
        setLogoutLoading({ ...logoutLoading, device: false });
      }
    } catch (err) {
      console.error('Logout device error:', err);
      setError('Failed to logout from device');
      setLogoutLoading({ ...logoutLoading, device: false });
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm('Are you sure you want to logout from all devices? This will invalidate all your active sessions.')) {
      return;
    }

    setLogoutLoading({ ...logoutLoading, all: true });
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE}/admin/logout/all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.ok) {
        logout(); // This will redirect to login
      } else {
        setError(data.error || 'Failed to logout from all devices');
        setLogoutLoading({ ...logoutLoading, all: false });
      }
    } catch (err) {
      console.error('Logout all devices error:', err);
      setError('Failed to logout from all devices');
      setLogoutLoading({ ...logoutLoading, all: false });
    }
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

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600">Unable to load admin profile</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(profile.is_active);
  const roleInfo = getRoleInfo(profile.admin_role);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Profile</h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage your admin account and view activity</p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-blue-600 text-dark-base px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
            >
              <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
              <span className="sm:hidden">{isEditing ? 'Cancel' : 'Edit'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${roleInfo.color}`}>
                  {roleInfo.label}
                </span>
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-md font-medium text-gray-800 mb-3">Change Password</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={editForm.currentPassword}
                            onChange={(e) => setEditForm({ ...editForm, currentPassword: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input
                          type="password"
                          value={editForm.newPassword}
                          onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <input
                          type="password"
                          value={editForm.confirmPassword}
                          onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-dark-base rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Username</label>
                      <p className="text-lg font-medium text-gray-900">{profile.username}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                      <p className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {profile.email}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
                      <p className="text-lg font-medium text-gray-900">{roleInfo.description}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                      <div className="flex items-center gap-2">
                        {StatusIcon && <StatusIcon className="h-4 w-4" />}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Account Created</label>
                      <p className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                      <p className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {new Date(profile.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Login Attempts</span>
                  <span className="text-sm font-medium text-gray-900">{profile.login_attempts || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Locked</span>
                  <span className={`text-sm font-medium ${profile.locked_until ? 'text-red-600' : 'text-green-600'}`}>
                    {profile.locked_until ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Login</span>
                  <span className="text-sm font-medium text-gray-900">
                    {profile.last_login
                      ? `${new Date(profile.last_login).toLocaleString()} (${formatRelativeTime(profile.last_login)})`
                      : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Key className="h-5 w-5" />
                Security Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Password Last Changed</span>
                  <span className="text-sm font-medium text-gray-900">
                    {profile.password_changed_at ? new Date(profile.password_changed_at).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Two-Factor Auth</span>
                  <span className="text-sm font-medium text-gray-900">Disabled</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Session Timeout</span>
                  <span className="text-sm font-medium text-gray-900">24 hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Login History - full width row */}
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Login History
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Recent login activity and IP addresses</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleLogoutDevice}
                    disabled={logoutLoading.device || logoutLoading.all}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    {logoutLoading.device ? 'Logging out...' : 'Logout from this device'}
                  </button>
                  <button
                    onClick={handleLogoutAll}
                    disabled={logoutLoading.device || logoutLoading.all}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    {logoutLoading.all ? 'Logging out...' : 'Logout from all devices'}
                  </button>
                </div>
              </div>
            </div>

            <Datatable
              data={loginHistoryData}
              columns={loginHistoryColumns}
              loading={loading}
              searchPlaceholder="Search login history..."
              showPagination={true}
              defaultPageSize={10}
              showPageSize={true}
              emptyMessage="No login history available"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
