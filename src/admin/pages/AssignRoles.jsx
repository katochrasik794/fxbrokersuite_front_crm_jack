import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../contexts/AuthContext";
import { getAllFeatures, extractAllFeaturesFromMenu } from "../components/SidebarMenuConfig.js";
import Swal from "sweetalert2";

const BASE = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || "https://fxbrokersuite-back-crm-jack.onrender.com/api";
import {
  Users,
  Shield,
  Plus,
  Save,
  X,
  Eye,
  UserCheck,
  Settings,
  Database,
  BarChart3,
  FileText,
  CreditCard,
  MessageSquare,
  Bell,
  Mail,
  Calendar,
  TrendingUp,
  PieChart,
  DollarSign,
  Target,
  Award,
  Globe,
  Lock,
  Unlock
} from "lucide-react";
import { Trash2 } from "lucide-react";

// Get all available features dynamically from sidebar menu
const ALL_AVAILABLE_FEATURES = getAllFeatures();

// Super admin role - always has all features (not editable)
const SUPERADMIN_ROLE = {
  value: 'superadmin',
  label: 'Super Admin',
  color: 'bg-red-100 text-red-800',
  description: 'Full access to all features (automatically includes all sidebar pages)',
  isProtected: true // Cannot be edited
};

// Note: All other roles (admin, moderator, support, analyst) will be stored as custom roles in DB

export default function AssignRoles() {
  const { admin } = useAuth();
  const [countryAdminFeatures, setCountryAdminFeatures] = useState(null);
  const [isCountryAdmin, setIsCountryAdmin] = useState(false);

  // Add custom styles for dropdown
  const dropdownStyles = `
    .role-dropdown {
      position: relative;
      z-index: 50;
    }
    
    .role-dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 50;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      margin-top: 0.25rem;
    }
    
    .role-dropdown-option {
      padding: 0.5rem 0.75rem;
      cursor: pointer;
      transition: background-color 0.15s ease-in-out;
    }
    
    .role-dropdown-option:hover {
      background-color: #f3f4f6;
    }
    
    .role-dropdown-option:first-child {
      border-top-left-radius: 0.5rem;
      border-top-right-radius: 0.5rem;
    }
    
    .role-dropdown-option:last-child {
      border-bottom-left-radius: 0.5rem;
      border-bottom-right-radius: 0.5rem;
    }
    
    /* Enhanced backdrop blur for modals */
    .backdrop-blur-enhanced {
      backdrop-filter: blur(8px) !important;
      -webkit-backdrop-filter: blur(8px) !important;
      background-color: rgba(0, 0, 0, 0.4) !important;
    }
  `;

  const [roles, setRoles] = useState([]); // roles from DB
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [featurePermissions, setFeaturePermissions] = useState({}); // { "feature_path": { view: false, add: false, edit: false, delete: false } }
  const [showRoleDropdown, setShowRoleDropdown] = useState(null);
  const [dropdownAnchor, setDropdownAnchor] = useState(null); // { id, rect }
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    features: []
  });
  const [showRoleViewModal, setShowRoleViewModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [editRole, setEditRole] = useState({ name: "", description: "", features: [] });
  const [newAdmin, setNewAdmin] = useState({
    username: "",
    email: "",
    password: "",
    admin_role: "admin",
    features: [] // Features will be saved directly to admin table
  });

  // Build a global feature lookup from dynamic features
  const FEATURE_MAP = useMemo(() => {
    const map = {};
    ALL_AVAILABLE_FEATURES.forEach(f => {
      if (f?.path) map[f.path] = f;
    });
    return map;
  }, []);

  const findCustomRole = (name) => {
    if (!name) return null;
    return roles.find(r => (r.name || '').toLowerCase() === String(name).toLowerCase()) || null;
  };

  const getFeaturesForAdminUser = (adminUser) => {
    // First check if admin has features stored directly in admin table
    if (Array.isArray(adminUser?.features) && adminUser.features.length > 0) {
      return adminUser.features.map(p => FEATURE_MAP[p] || { name: p, icon: Settings, path: p });
    }
    
    // If no features in admin table, check if a matching custom role exists
    const custom = findCustomRole(adminUser?.admin_role);
    const customFeatures = custom?.permissions?.features;
    if (Array.isArray(customFeatures) && customFeatures.length) {
      return customFeatures.map(p => FEATURE_MAP[p] || { name: p, icon: Settings, path: p });
    }
    
    // Fallback to built-in role mapping
    return getFeaturesForRole(adminUser?.admin_role);
  };

  useEffect(() => {
    // Check if logged in as country admin and fetch their features
    const adminInfoStr = localStorage.getItem('adminInfo');
    let adminInfo = null;
    try {
      adminInfo = adminInfoStr ? JSON.parse(adminInfoStr) : null;
    } catch (e) {
      // Ignore parse errors
    }
    const isCountryAdminUser = adminInfo?.isCountryAdmin || admin?.isCountryAdmin || adminInfo?.admin_role === 'country_admin' || admin?.admin_role === 'country_admin';
    setIsCountryAdmin(isCountryAdminUser);

    if (isCountryAdminUser) {
      // Fetch country admin features
      const token = localStorage.getItem('adminToken');
      fetch(`${BASE}/admin/country-admin/me`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          if (data?.ok && data?.admin?.features) {
            // Normalize features (same as backend)
            const normalizeFeature = (f) => {
              if (typeof f !== 'string') return '';
              return f.replace(/^\/admin\//, '').replace(/^\//, '').trim().split('/').pop() || f.trim();
            };
            const normalizedFeatures = data.admin.features.map(normalizeFeature);
            setCountryAdminFeatures(normalizedFeatures);
          }
        })
        .catch(() => { });
    }

    fetchAdmins();
    fetchRoles();
  }, [admin, BASE]);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE}/admin/admins`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins || []);
      } else {
        setError('Failed to fetch admins');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${BASE}/admin/roles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data?.ok) setRoles(data.roles || []);
    } catch (err) {
      console.error(err);
      // ignore silently; UI can work without roles
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();

    try {
      // First, check if email exists in USER table
      const token = localStorage.getItem('adminToken');
      const checkUserResponse = await fetch(`${BASE}/admin/users/check-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newAdmin.email })
      });

      if (checkUserResponse.ok) {
        const checkData = await checkUserResponse.json();
        if (checkData.exists) {
          Swal.fire({
            icon: 'error',
            title: 'Email Already Exists!',
            text: 'This email is already registered as a client user. Please use a different email address.',
            confirmButtonText: 'OK'
          });
          return;
        }
      }

      // If email doesn't exist in USER table, proceed with admin creation
      const response = await fetch(`${BASE}/admin/admins`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAdmin)
      });

      const data = await response.json();
      
      if (response.ok && data.ok && data.admin) {
        setAdmins([...admins, data.admin]);
        setShowCreateModal(false);
        setNewAdmin({
          username: "",
          email: "",
          password: "",
          admin_role: "admin",
          features: []
        });
        setError("");

        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Admin account created successfully',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        const errorMessage = data.error || data.message || 'Failed to create admin';

        // Check if it's an email already exists error
        if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('already')) {
          Swal.fire({
            icon: 'error',
            title: 'Email Already Exists!',
            text: 'This email is already registered in the system. Please use a different email address.',
            confirmButtonText: 'OK'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: errorMessage,
            confirmButtonText: 'OK'
          });
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = 'Failed to create admin';
      setError(errorMessage);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: errorMessage,
        confirmButtonText: 'OK'
      });
    }
  };

  const handleUpdateRole = async (adminId, newRole) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE}/admin/admins/${adminId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ admin_role: newRole })
      });

      if (response.ok) {
        setAdmins(admins.map(admin =>
          admin.id === adminId ? { ...admin, admin_role: newRole } : admin
        ));
        setError("");

        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Admin role updated successfully',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        const data = await response.json();
        const errorMessage = data.error || 'Failed to update role';
        setError(errorMessage);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: errorMessage,
          confirmButtonText: 'OK'
        });
      }
    } catch (err) {
      console.error(err);
      const errorMessage = 'Failed to update role';
      setError(errorMessage);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: errorMessage,
        confirmButtonText: 'OK'
      });
    }
  };

  const handleFeatureSelection = (adminUser) => {
    // For superadmin, don't allow editing
    if (adminUser.admin_role === 'superadmin') {
      Swal.fire({
        icon: 'info',
        title: 'Super Admin',
        text: 'Super Admin has all features automatically. Cannot be edited.',
        confirmButtonText: 'OK'
      });
      return;
    }
    setSelectedAdmin(adminUser);
    
    // Get features from admin table first, then fallback to role
    let features = [];
    if (Array.isArray(adminUser.features) && adminUser.features.length > 0) {
      features = adminUser.features;
    } else {
      // Fallback to custom role features
      const custom = findCustomRole(adminUser.admin_role);
      features = custom?.permissions?.features || [];
    }
    
    // Get feature permissions from admin table (default to all false)
    const permissions = adminUser.feature_permissions || {};
    
    setSelectedFeatures(features);
    setFeaturePermissions(permissions);
    setShowFeatureModal(true);
  };

  const handleFeatureToggle = (feature) => {
    setSelectedFeatures(prev => {
      if (prev.includes(feature)) {
        // When unchecking feature, also clear its permissions
        setFeaturePermissions(prevPerms => {
          const newPerms = { ...prevPerms };
          delete newPerms[feature];
          return newPerms;
        });
        return prev.filter(f => f !== feature);
      } else {
        // When checking feature, initialize permissions to all false
        setFeaturePermissions(prevPerms => ({
          ...prevPerms,
          [feature]: { view: false, add: false, edit: false, delete: false }
        }));
        return [...prev, feature];
      }
    });
  };

  const handlePermissionToggle = (featurePath, action) => {
    setFeaturePermissions(prev => {
      const currentPerms = prev[featurePath] || { view: false, add: false, edit: false, delete: false };
      return {
        ...prev,
        [featurePath]: {
          ...currentPerms,
          [action]: !currentPerms[action]
        }
      };
    });
  };

  const handleSaveFeatures = async () => {
    if (!selectedAdmin) return;

    // For superadmin, don't allow saving
    if (selectedAdmin.admin_role === 'superadmin') {
      Swal.fire({
        icon: 'error',
        title: 'Cannot Edit',
        text: 'Super Admin features cannot be edited.',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      // Prepare feature permissions - only include permissions for selected features
      const permissionsToSave = {};
      selectedFeatures.forEach(featurePath => {
        if (featurePermissions[featurePath]) {
          permissionsToSave[featurePath] = featurePermissions[featurePath];
        } else {
          // Initialize to all false if not set
          permissionsToSave[featurePath] = { view: false, add: false, edit: false, delete: false };
        }
      });
      
      // Save features and permissions directly to admin table
      const res = await fetch(`${BASE}/admin/admins/${selectedAdmin.id}/features`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          features: selectedFeatures,
          featurePermissions: permissionsToSave
        })
      });
      
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to save features');
      }
      
      // Update local state
      setAdmins(admins.map(admin =>
        admin.id === selectedAdmin.id 
          ? { ...admin, features: selectedFeatures, feature_permissions: permissionsToSave }
          : admin
      ));
      
      Swal.fire({ icon: 'success', title: 'Features updated', timer: 1500, showConfirmButton: false });
      setShowFeatureModal(false);
      setSelectedAdmin(null);
      setSelectedFeatures([]);
      setFeaturePermissions({});
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Failed to save features', text: err.message || 'Unable to save features' });
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match');
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Passwords do not match',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Password must be at least 6 characters',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE}/admin/admins/${selectedAdmin.id}/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: passwordForm.newPassword
        })
      });

      if (response.ok) {
        setShowPasswordModal(false);
        setSelectedAdmin(null);
        setPasswordForm({ newPassword: '', confirmPassword: '' });
        setError("");

        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Password updated successfully',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        const data = await response.json();
        const errorMessage = data.error || 'Failed to update password';
        setError(errorMessage);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: errorMessage,
          confirmButtonText: 'OK'
        });
      }
    } catch (err) {
      console.error(err);
      const errorMessage = 'Failed to update password';
      setError(errorMessage);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: errorMessage,
        confirmButtonText: 'OK'
      });
    }
  };

  const handleDeleteAdmin = async (adminUser) => {
    if (adminUser.admin_role === 'superadmin') return;
    const result = await Swal.fire({
      icon: 'warning',
      title: `Delete admin “${adminUser.username}”?`,
      text: 'This action cannot be undone.',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Delete',
    });
    if (!result.isConfirmed) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${BASE}/admin/admins/${adminUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to delete admin');
      setAdmins(prev => prev.filter(a => a.id !== adminUser.id));
      Swal.fire({ icon: 'success', title: 'Admin deleted', timer: 1500, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Delete failed', text: err.message || 'Unable to delete admin' });
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();

    if (!newRole.name.trim()) {
      setError('Role name is required');
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Role name is required',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (newRole.features.length === 0) {
      setError('Please select at least one feature for the role');
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Please select at least one feature for the role',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE}/admin/roles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newRole.name,
          description: newRole.description,
          features: newRole.features
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update roles list
        setRoles(prev => [data.role, ...prev]);
        setShowCreateRoleModal(false);
        setNewRole({
          name: "",
          description: "",
          features: []
        });
        setError("");

        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Role created successfully!',
          timer: 2000,
          showConfirmButton: false
        });
        await fetchRoles();
      } else {
        const data = await response.json();
        const errorMessage = data.error || 'Failed to create role';
        setError(errorMessage);
        Swal.fire({
          icon: 'error',
          title: 'Failed to create role',
          text: 'Unable to create new role. Please try again.',
          confirmButtonText: 'OK'
        });
      }
    } catch (err) {
      console.error(err);
      const errorMessage = 'Failed to create role';
      setError(errorMessage);
      Swal.fire({
        icon: 'error',
        title: 'Failed to create role',
        text: 'Unable to create new role. Please try again.',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleDeleteRole = async (role) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: `Delete role “${role.name}”?`,
      text: 'This action cannot be undone.',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Delete',
    });
    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${BASE}/admin/roles/${role.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to delete role');
      setRoles(prev => prev.filter(r => r.id !== role.id));
      Swal.fire({ icon: 'success', title: 'Role deleted', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Delete failed', text: err.message || 'Unable to delete role' });
    }
  };

  const handleRoleDropdownToggle = (adminId, event) => {
    const isOpen = showRoleDropdown === adminId;
    if (isOpen) {
      setShowRoleDropdown(null);
      setDropdownAnchor(null);
      return;
    }
    const rect = event?.currentTarget?.getBoundingClientRect?.();
    setDropdownAnchor(rect ? { id: adminId, rect } : null);
    setShowRoleDropdown(adminId);
  };

  const handleRoleSelect = async (adminId, newRole) => {
    await handleUpdateRole(adminId, newRole);
    setShowRoleDropdown(null);
  };

  const handleClickOutside = (event) => {
    if (!event.target.closest('.role-dropdown') && !event.target.closest('.role-dropdown-portal')) {
      setShowRoleDropdown(null);
      setDropdownAnchor(null);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const getFeaturesForRole = (role) => {
    // Super admin gets all features automatically
    if (role === 'superadmin') {
      return ALL_AVAILABLE_FEATURES;
    }
    // For other roles, check if there's a custom role in DB
    const custom = findCustomRole(role);
    if (custom?.permissions?.features) {
      return custom.permissions.features.map(p => FEATURE_MAP[p] || { name: p, icon: Settings, path: p });
    }
    return [];
  };

  const getStatusInfo = (isActive) => {
    return isActive
      ? { label: 'Active', color: 'bg-green-100 text-green-800', icon: '✓' }
      : { label: 'Inactive', color: 'bg-red-100 text-red-800', icon: '✗' };
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
      <style>{dropdownStyles}</style>
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Role Assignment</h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage admin roles and permissions</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setShowCreateRoleModal(true)}
                className="bg-blue-600 text-dark-base px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
              >
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Create Role</span>
                <span className="sm:hidden">Role</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-dark-base px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Create Admin</span>
                <span className="sm:hidden">Admin</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <X className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Super Admin Role Card (Protected) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${SUPERADMIN_ROLE.color}`}>
                {SUPERADMIN_ROLE.label}
              </div>
              <Shield className="h-5 w-5 text-gray-400" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">{SUPERADMIN_ROLE.label}</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-3">{SUPERADMIN_ROLE.description}</p>
            <div className="space-y-1">
              <div className="text-xs sm:text-sm font-medium text-gray-700">Features:</div>
              <div className="flex flex-wrap gap-1">
                {ALL_AVAILABLE_FEATURES.slice(0, window.innerWidth < 640 ? 2 : 3).map((feature, index) => (
                  <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    <feature.icon className="h-3 w-3" />
                    {feature.name}
                  </span>
                ))}
                {ALL_AVAILABLE_FEATURES.length > (window.innerWidth < 640 ? 2 : 3) && (
                  <span className="text-xs text-gray-500">+{ALL_AVAILABLE_FEATURES.length - (window.innerWidth < 640 ? 2 : 3)} more</span>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500 italic">Protected - All features included automatically</div>
            </div>
          </div>
        </div>

        {/* Roles Table */}
        {(() => {
          // Filter roles for country admins - only show roles they created (strictly filter)
          const filteredRoles = isCountryAdmin
            ? roles.filter(r => {
              // Only show roles that have created_by matching current admin email
              const adminInfoStr = localStorage.getItem('adminInfo');
              let adminInfo = null;
              try {
                adminInfo = adminInfoStr ? JSON.parse(adminInfoStr) : null;
              } catch (e) { }
              const currentEmail = adminInfo?.email || admin?.email || '';
              // Strictly check: role must have created_by and it must match current email
              return r.created_by && r.created_by === currentEmail;
            })
            : roles;

          return filteredRoles.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible mb-8">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Custom Roles</h2>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Manage roles saved in the database</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Features</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRoles.map(r => {
                      const features = r.permissions?.features || [];
                      return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{r.name}</td>
                          <td className="px-3 sm:px-6 py-3 text-sm text-gray-600">{r.description || '-'}</td>
                          <td className="px-3 sm:px-6 py-3 text-sm text-gray-600">{features.length} feature{features.length === 1 ? '' : 's'}</td>
                          <td className="px-3 sm:px-6 py-3 text-sm">
                            <div className="flex items-end gap-6">
                              {r.name.toLowerCase() !== 'superadmin' && (
                                <button
                                  onClick={() => { setSelectedRole(r); setShowEditRoleModal(true); setEditRole({ name: r.name || '', description: r.description || '', features: (r.permissions?.features) || [] }); }}
                                  className="flex flex-col items-center text-green-600 hover:text-green-700"
                                  title="Edit Features"
                                >
                                  <Settings className="h-4 w-4" />
                                  <small className="text-[10px] leading-3 mt-1">Features</small>
                                </button>
                              )}

                              <button
                                onClick={() => { setSelectedRole(r); setShowRoleViewModal(true); }}
                                className="flex flex-col items-center text-blue-600 hover:text-blue-700"
                                title="View Role"
                              >
                                <Eye className="h-4 w-4" />
                                <small className="text-[10px] leading-3 mt-1">View</small>
                              </button>

                              <button
                                onClick={() => {
                                  Swal.fire({
                                    icon: 'info',
                                    title: 'Change Password',
                                    text: 'Roles do not have passwords. Please change passwords from Admin Users.',
                                    confirmButtonText: 'OK'
                                  });
                                }}
                                className="flex flex-col items-center text-orange-600 hover:text-orange-700"
                                title="Change Password"
                              >
                                <Lock className="h-4 w-4" />
                                <small className="text-[10px] leading-3 mt-1">Password</small>
                              </button>

                              {/* Delete button - available for all custom roles except superadmin */}
                              {r.name.toLowerCase() !== 'superadmin' && (
                                <button
                                  onClick={() => handleDeleteRole(r)}
                                  className="flex flex-col items-center text-red-600 hover:text-red-700"
                                  title="Delete Role"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <small className="text-[10px] leading-3 mt-1">Delete</small>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* Admins Table */}
        {/* Use overflow-visible so dropdowns can render above rows/cards */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Admin Users</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage admin accounts and their roles</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Features
                  </th>
                  <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins.map((adminUser) => {
                  // Check if it's superadmin or a custom role
                  const isSuperAdmin = adminUser.admin_role === 'superadmin';
                  const customRole = !isSuperAdmin ? findCustomRole(adminUser.admin_role) : null;
                  const statusInfo = getStatusInfo(adminUser.is_active);
                  // For display purposes, determine role label
                  const roleLabel = isSuperAdmin ? SUPERADMIN_ROLE.label : (customRole?.name || adminUser.admin_role);
                  const roleColor = isSuperAdmin ? SUPERADMIN_ROLE.color : 'bg-brand-100 text-brand-800';
                  return (
                    <tr key={adminUser.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-brand-100 flex items-center justify-center">
                              <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700" />
                            </div>
                          </div>
                          <div className="ml-2 sm:ml-4">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">{adminUser.username}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-none">{adminUser.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="role-dropdown">
                          <button
                            onClick={(e) => handleRoleDropdownToggle(adminUser.id, e)}
                            className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-900 hover:text-blue-700 transition-colors"
                          >
                            <span className={`px-2 py-1 rounded-full text-xs ${roleColor}`}>
                              {roleLabel}
                            </span>
                          </button>

                          {showRoleDropdown === adminUser.id && dropdownAnchor && dropdownAnchor.id === adminUser.id && createPortal(
                            (
                              <div
                                className="role-dropdown-menu role-dropdown-portal"
                                style={{
                                  position: 'fixed',
                                  top: (dropdownAnchor.rect.bottom + 8) + 'px',
                                  left: dropdownAnchor.rect.left + 'px',
                                  width: Math.max(180, dropdownAnchor.rect.width) + 'px',
                                  zIndex: 1000,
                                }}
                              >
                                {[
                                  // Super admin first (protected) - only show to superadmins
                                  ...(isCountryAdmin ? [] : [SUPERADMIN_ROLE]),
                                  // then custom roles from DB - filter for country admins (strictly)
                                  ...(isCountryAdmin
                                    ? roles.filter(r => {
                                      const adminInfoStr = localStorage.getItem('adminInfo');
                                      let adminInfo = null;
                                      try {
                                        adminInfo = adminInfoStr ? JSON.parse(adminInfoStr) : null;
                                      } catch (e) { }
                                      const currentEmail = adminInfo?.email || admin?.email || '';
                                      // Only show roles created by this country admin
                                      return r.created_by && r.created_by === currentEmail;
                                    })
                                    : roles
                                  ).map(r => ({ value: r.name, label: r.name, color: 'bg-brand-100 text-brand-800' })),
                                ].map((roleOption) => (
                                  <div
                                    key={roleOption.value}
                                    onClick={() => handleRoleSelect(adminUser.id, roleOption.value)}
                                    className="role-dropdown-option flex items-center gap-2"
                                  >
                                    <span className={`px-2 py-1 rounded-full text-xs ${roleOption.color}`}>
                                      {roleOption.label}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ),
                            document.body
                          )}
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-3 sm:px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {getFeaturesForAdminUser(adminUser).slice(0, 2).map((feature, index) => (
                            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              <feature.icon className="h-3 w-3" />
                              {feature.name}
                            </span>
                          ))}
                          {getFeaturesForAdminUser(adminUser).length > 2 && (
                            <span className="text-xs text-gray-500">+{getFeaturesForAdminUser(adminUser).length - 2} more</span>
                          )}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                          <span>{statusInfo.icon}</span>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {adminUser.last_login ? new Date(adminUser.last_login).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-end gap-4">
                          {isSuperAdmin && (
                            <div className="flex flex-col items-center text-gray-400">
                              <Lock className="h-4 w-4" />
                              <small className="text-[10px] leading-3 mt-1">Protected</small>
                            </div>
                          )}

                          {!isSuperAdmin && (
                            <button
                              onClick={() => handleFeatureSelection(adminUser)}
                              className="flex flex-col items-center text-green-600 hover:text-green-800"
                              title="Edit Features"
                            >
                              <Settings className="h-4 w-4" />
                              <small className="text-[10px] leading-3 mt-1">Features</small>
                            </button>
                          )}

                          <button
                            onClick={() => { setSelectedAdmin(adminUser); setShowViewModal(true); }}
                            className="flex flex-col items-center text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                            <small className="text-[10px] leading-3 mt-1">View</small>
                          </button>

                          <button
                            onClick={() => { setSelectedAdmin(adminUser); setShowPasswordModal(true); }}
                            className="flex flex-col items-center text-orange-600 hover:text-orange-800"
                            title="Change Password"
                          >
                            <Lock className="h-4 w-4" />
                            <small className="text-[10px] leading-3 mt-1">Password</small>
                          </button>

                          {adminUser.admin_role !== 'superadmin' && (
                            <button
                              onClick={() => handleDeleteAdmin(adminUser)}
                              className="flex flex-col items-center text-red-600 hover:text-red-800"
                              title="Delete Admin"
                            >
                              <Trash2 className="h-4 w-4" />
                              <small className="text-[10px] leading-3 mt-1">Delete</small>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Admin Permissions Modal */}
        {showViewModal && selectedAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-enhanced flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Admin Permissions</h3>
                  <p className="text-sm text-gray-600">{selectedAdmin.username} • {selectedAdmin.email}</p>
                </div>
                <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 sm:p-6">
                <div className="mb-4">
                  {(() => {
                    const isSuperAdmin = selectedAdmin.admin_role === 'superadmin';
                    return (
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${isSuperAdmin ? SUPERADMIN_ROLE.color : 'bg-brand-100 text-brand-800'
                        }`}>
                        {isSuperAdmin ? SUPERADMIN_ROLE.label : (selectedAdmin.admin_role)}
                      </span>
                    );
                  })()}
                </div>

                <h4 className="text-sm font-semibold text-gray-900 mb-2">Enabled Features</h4>
                {(() => {
                  const features = getFeaturesForAdminUser(selectedAdmin);
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 border border-gray-200 rounded-lg p-2">
                          <feature.icon className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-800">{feature.name}</span>
                        </div>
                      ))}
                      {features.length === 0 && (
                        <div className="text-sm text-gray-500">No features enabled.</div>
                      )}
                    </div>
                  );
                })()}

                <div className="flex justify-end mt-6">
                  <button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800">Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Admin Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm backdrop-blur-enhanced flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Create New Admin</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewAdmin({
                      username: "",
                      email: "",
                      password: "",
                      admin_role: "admin",
                      features: []
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleCreateAdmin} className="p-4 sm:p-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Basic Information</h4>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username *
                      </label>
                      <input
                        type="text"
                        value={newAdmin.username}
                        onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="Enter username"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="Enter email"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="Enter password"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role *
                      </label>
                      <select
                        value={newAdmin.admin_role}
                        onChange={(e) => setNewAdmin({ ...newAdmin, admin_role: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required
                      >
                        {/* Super admin - only show to superadmins */}
                        {!isCountryAdmin && <option value={SUPERADMIN_ROLE.value}>{SUPERADMIN_ROLE.label}</option>}
                        {/* Custom roles from DB - filter for country admins (strictly) */}
                        {(() => {
                          const filteredRoles = isCountryAdmin
                            ? roles.filter(r => {
                              const adminInfoStr = localStorage.getItem('adminInfo');
                              let adminInfo = null;
                              try {
                                adminInfo = adminInfoStr ? JSON.parse(adminInfoStr) : null;
                              } catch (e) { }
                              const currentEmail = adminInfo?.email || admin?.email || '';
                              // Only show roles created by this country admin
                              return r.created_by && r.created_by === currentEmail;
                            })
                            : roles;
                          return filteredRoles.map(r => (
                            <option key={r.id} value={r.name}>{r.name}</option>
                          ));
                        })()}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewAdmin({
                        username: "",
                        email: "",
                        password: "",
                        admin_role: "admin",
                        features: []
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
                    Create Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Feature Selection Modal */}
        {showFeatureModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-enhanced flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Select which features this admin can access</h3>
                  <button
                    onClick={() => {
                      setShowFeatureModal(false);
                      setSelectedAdmin(null);
                      setSelectedFeatures([]);
      setFeaturePermissions({});
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Group features by category from sidebar */}
                  {ALL_AVAILABLE_FEATURES
                    .filter(f => {
                      // Exclude system pages
                      if (f.path === 'assign-roles' || f.path === 'profile' || f.path === 'logout') return false;
                      // For country admins, only show features they have access to
                      if (isCountryAdmin && countryAdminFeatures) {
                        const normalizeFeature = (feat) => {
                          if (typeof feat !== 'string') return '';
                          return feat.replace(/^\/admin\//, '').replace(/^\//, '').trim().split('/').pop() || feat.trim();
                        };
                        const normalizedPath = normalizeFeature(f.path);
                        return countryAdminFeatures.includes(normalizedPath);
                      }
                      return true;
                    })
                    .map((feature, index) => {
                      const isSelected = selectedFeatures.includes(feature.path);
                      const perms = featurePermissions[feature.path] || { view: false, add: false, edit: false, delete: false };
                      
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                          {/* Main feature checkbox */}
                          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer mb-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleFeatureToggle(feature.path)}
                              className="rounded border-gray-300 text-blue-700 focus:ring-blue-600"
                            />
                            <feature.icon className="h-4 w-4 text-gray-500" />
                            <span>{feature.name}</span>
                          </label>
                          
                          {/* Granular permissions - only show if feature is selected */}
                          {isSelected && (
                            <div className="ml-6 mt-2 space-y-2">
                              <div className="text-xs font-medium text-gray-600 mb-2">Permissions:</div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {['view', 'add', 'edit', 'delete'].map((action) => (
                                  <label key={action} className="flex items-center gap-1.5 text-xs cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={perms[action] || false}
                                      onChange={() => handlePermissionToggle(feature.path, action)}
                                      className="rounded border-gray-300 text-blue-700 focus:ring-blue-600 h-3 w-3"
                                    />
                                    <span className="capitalize text-gray-700">{action}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowFeatureModal(false);
                      setSelectedAdmin(null);
                      setSelectedFeatures([]);
      setFeaturePermissions({});
                      setFeaturePermissions({});
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveFeatures}
                    className="px-4 py-2 bg-blue-600 text-dark-base rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Features
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-enhanced flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Change Password for {selectedAdmin?.username}
                  </h3>
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setSelectedAdmin(null);
                      setPasswordForm({ newPassword: '', confirmPassword: '' });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password *
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="Enter new password"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setSelectedAdmin(null);
                      setPasswordForm({ newPassword: '', confirmPassword: '' });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    className="px-4 py-2 bg-blue-600 text-dark-base rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Role Modal */}
        {showCreateRoleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-enhanced flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Create New Role
                  </h3>
                  <button
                    onClick={() => {
                      setShowCreateRoleModal(false);
                      setNewRole({
                        name: "",
                        description: "",
                        features: []
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateRole} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role Name *
                      </label>
                      <input
                        type="text"
                        value={newRole.name}
                        onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="e.g., Manager, Supervisor, Coordinator"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={newRole.description}
                        onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="Brief description of this role"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Features for this Role * {isCountryAdmin ? '(Only features you have access to)' : '(All sidebar pages are available)'}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ALL_AVAILABLE_FEATURES
                        .filter((feature) => {
                          // Exclude system pages
                          if (feature.path === 'assign-roles' || feature.path === 'profile' || feature.path === 'logout') return false;
                          // For country admins, only show features they have access to
                          if (isCountryAdmin && countryAdminFeatures) {
                            const normalizeFeature = (f) => {
                              if (typeof f !== 'string') return '';
                              return f.replace(/^\/admin\//, '').replace(/^\//, '').trim().split('/').pop() || f.trim();
                            };
                            const normalizedPath = normalizeFeature(feature.path);
                            return countryAdminFeatures.includes(normalizedPath);
                          }
                          return true;
                        })
                        .map((feature, index) => (
                          <label key={index} className="flex items-center gap-2 text-sm cursor-pointer border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={newRole.features.includes(feature.path)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewRole({
                                    ...newRole,
                                    features: [...newRole.features, feature.path]
                                  });
                                } else {
                                  setNewRole({
                                    ...newRole,
                                    features: newRole.features.filter(f => f !== feature.path)
                                  });
                                }
                              }}
                              className="rounded border-gray-300 text-blue-700 focus:ring-blue-600"
                            />
                            <feature.icon className="h-4 w-4 text-gray-500" />
                            <span>{feature.name}</span>
                          </label>
                        ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateRoleModal(false);
                        setNewRole({
                          name: "",
                          description: "",
                          features: []
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
                      Create Role
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Role Modal */}
        {showRoleViewModal && selectedRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-enhanced flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Role: {selectedRole.name}</h3>
                <button onClick={() => setShowRoleViewModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 sm:p-6">
                <p className="text-sm text-gray-600 mb-4">{selectedRole.description || '—'}</p>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Enabled Features</h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedRole.permissions?.features || []).map((p, idx) => {
                    const feature = FEATURE_MAP[p] || { name: p, icon: Settings };
                    const Icon = feature.icon;
                    return (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        <Icon className="h-3 w-3" />
                        {feature.name}
                      </span>
                    );
                  })}
                  {(selectedRole.permissions?.features || []).length === 0 && (
                    <span className="text-sm text-gray-500">No features assigned.</span>
                  )}
                </div>
                <div className="flex justify-end mt-6">
                  <button onClick={() => setShowRoleViewModal(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800">Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Role Modal - Only for non-superadmin roles */}
        {showEditRoleModal && selectedRole && selectedRole.name.toLowerCase() !== 'superadmin' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-enhanced flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Edit Role</h3>
                <button onClick={() => setShowEditRoleModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
                    <input
                      type="text"
                      value={editRole.name}
                      onChange={(e) => setEditRole({ ...editRole, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={editRole.description}
                      onChange={(e) => setEditRole({ ...editRole, description: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Select Features * {isCountryAdmin ? '(Only features you have access to)' : '(All sidebar pages are available)'}</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ALL_AVAILABLE_FEATURES
                      .filter((feature) => {
                        // Exclude system pages
                        if (feature.path === 'assign-roles' || feature.path === 'profile' || feature.path === 'logout') return false;
                        // For country admins, only show features they have access to
                        if (isCountryAdmin && countryAdminFeatures) {
                          const normalizeFeature = (f) => {
                            if (typeof f !== 'string') return '';
                            return f.replace(/^\/admin\//, '').replace(/^\//, '').trim().split('/').pop() || f.trim();
                          };
                          const normalizedPath = normalizeFeature(feature.path);
                          return countryAdminFeatures.includes(normalizedPath);
                        }
                        return true;
                      })
                      .map((feature, index) => (
                        <label key={index} className="flex items-center gap-2 text-sm cursor-pointer border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={editRole.features.includes(feature.path)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditRole({ ...editRole, features: [...editRole.features, feature.path] });
                              } else {
                                setEditRole({ ...editRole, features: editRole.features.filter(f => f !== feature.path) });
                              }
                            }}
                            className="rounded border-gray-300 text-blue-700 focus:ring-blue-600"
                          />
                          <feature.icon className="h-4 w-4 text-gray-500" />
                          <span>{feature.name}</span>
                        </label>
                      ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => setShowEditRoleModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!editRole.name.trim() || editRole.features.length === 0) {
                        Swal.fire({ icon: 'error', title: 'Role name and features are required' });
                        return;
                      }
                      // Prevent editing superadmin
                      if (editRole.name.toLowerCase() === 'superadmin') {
                        Swal.fire({ icon: 'error', title: 'Cannot edit Super Admin', text: 'Super Admin role cannot be edited.' });
                        return;
                      }
                      try {
                        const token = localStorage.getItem('adminToken');
                        const res = await fetch(`${BASE}/admin/roles/${selectedRole.id}`, {
                          method: 'PUT',
                          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name: editRole.name, description: editRole.description, features: editRole.features })
                        });
                        const data = await res.json();
                        if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to update role');
                        await fetchRoles();
                        setShowEditRoleModal(false);
                        setSelectedRole(null);
                        Swal.fire({ icon: 'success', title: 'Role updated', timer: 1500, showConfirmButton: false });
                      } catch (err) {
                        Swal.fire({ icon: 'error', title: 'Update failed', text: err.message || 'Unable to update role' });
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-dark-base rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
