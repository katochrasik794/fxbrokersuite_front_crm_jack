import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Shield, Activity, Key, Eye, EyeOff, Save, CheckCircle, AlertCircle, Settings as SettingsIcon } from 'lucide-react';
import authService from '../../services/auth.js';
import PageHeader from '../components/PageHeader.jsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Settings() {
  const [profile, setProfile] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Password change form
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchLogs();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile(data.data);
        } else {
          setError(data.message || 'Failed to fetch profile');
        }
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to fetch profile');
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
      setError('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/auth/logs?limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLogs(data.data.logs || []);
        }
      }
    } catch (err) {
      console.error('Fetch logs error:', err);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    setChangingPassword(true);

    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Password changed successfully');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordForm(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Change password error:', err);
      setError('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
      suspended: { color: 'bg-red-100 text-red-800', label: 'Suspended' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' }
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.inactive;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getKYCStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      unverified: { color: 'bg-gray-100 text-gray-800', label: 'Unverified' }
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.unverified;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          icon={SettingsIcon}
          title="Settings"
          subtitle="Manage your profile, security, and account settings"
        />
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="mt-4 text-gray-500 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="space-y-6">
        <PageHeader 
          icon={SettingsIcon}
          title="Settings"
          subtitle="Manage your profile, security, and account settings"
        />
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Settings</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={SettingsIcon}
        title="Settings"
        subtitle="Manage your profile, security, and account settings"
      />

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Profile Information
              </h2>
              {profile?.profile && getStatusBadge(profile.profile.status)}
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">First Name</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 font-medium">
                    {profile?.profile?.firstName || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Last Name</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 font-medium">
                    {profile?.profile?.lastName || 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 font-medium flex items-center justify-between">
                  <span>{profile?.profile?.email || 'N/A'}</span>
                  {profile?.profile?.isEmailVerified ? (
                    <span className="text-green-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="text-yellow-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                      <AlertCircle className="h-3 w-3" />
                      Not Verified
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 font-medium">
                    {profile?.profile?.phoneCode && profile?.profile?.phoneNumber
                      ? `${profile.profile.phoneCode} ${profile.profile.phoneNumber}`
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Country
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 font-medium">
                    {profile?.profile?.country || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Account Created</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 text-sm">
                    {formatDate(profile?.profile?.createdAt)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Last Login</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 text-sm">
                    {formatDate(profile?.profile?.lastLogin) || 'Never'}
                  </div>
                </div>
              </div>

              {profile?.profile?.referralCode && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Referral Code</label>
                  <div className="px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-900 font-mono font-medium">
                    {profile.profile.referralCode}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Status Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Account Status
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-50">
                <span className="text-gray-600 font-medium">Account Status</span>
                {profile?.profile && getStatusBadge(profile.profile.status)}
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-50">
                <span className="text-gray-600 font-medium">KYC Verification</span>
                {profile?.profile && getKYCStatusBadge(profile.profile.kycStatus)}
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-50">
                <span className="text-gray-600 font-medium">Email Verification</span>
                {profile?.profile?.isEmailVerified ? (
                  <span className="text-green-600 text-sm font-bold flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Verified
                  </span>
                ) : (
                  <span className="text-yellow-600 text-sm font-bold flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Not Verified
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600 font-medium">Trading Accounts</span>
                <span className="text-gray-900 font-bold text-lg">{profile?.accountsCount || 0}</span>
              </div>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Recent Activity
              </h2>
            </div>

            <div className="p-6">
              {logs.length > 0 ? (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div key={log.id} className="group p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{log.description || log.action_type}</p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            {log.action_category && (
                              <span className="capitalize bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium text-[10px] uppercase tracking-wide">
                                {log.action_category}
                              </span>
                            )}
                            {log.ip_address && <span className="font-mono">IP: {log.ip_address}</span>}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-gray-400 group-hover:text-blue-500 transition-colors">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>No activity logs available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Password Change Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                Security
              </h2>
            </div>

            <div className="p-6">
              {!showPasswordForm ? (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 active:transform active:scale-[0.98]"
                >
                  Change Password
                </button>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200 outline-none pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200 outline-none pr-10"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200 outline-none pr-10"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:transform active:scale-[0.98]"
                    >
                      {changingPassword ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Changing...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setError('');
                      }}
                      className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Wallet Info Card */}
          {profile?.wallet && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900">Wallet Balance</h2>
              </div>
              <div className="p-6">
                <div className="text-3xl font-bold text-gray-900 tracking-tight">
                  {profile.wallet.balance.toFixed(2)} <span className="text-lg text-gray-500 font-medium">{profile.wallet.currency}</span>
                </div>
              </div>
            </div>
          )}

          {/* KYC Info Card */}
          {profile?.kyc && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900">KYC Status</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Current Status</span>
                  {getKYCStatusBadge(profile.kyc.status)}
                </div>
                {profile.kyc.submittedAt && (
                  <div className="text-xs text-gray-500 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100">
                    Submitted: {formatDate(profile.kyc.submittedAt)}
                  </div>
                )}
                {profile.kyc.reviewedAt && (
                  <div className="text-xs text-gray-500 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100">
                    Reviewed: {formatDate(profile.kyc.reviewedAt)}
                  </div>
                )}
                {profile.kyc.rejectionReason && (
                  <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                    <span className="font-bold block mb-1">Rejection Reason:</span>
                    {profile.kyc.rejectionReason}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
