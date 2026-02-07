import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

const BASE = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || "https://fxbrokersuite-back-crm-jack.onrender.com/api";

/**
 * Hook to check if admin has permission for a specific feature action
 * @returns {Object} { can: (featureKey, action) => boolean, loading: boolean }
 */
export const useFeaturePermissions = () => {
  const { admin } = useAuth();
  const [featurePermissions, setFeaturePermissions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        // Superadmin always has all permissions
        if (admin?.admin_role === 'superadmin') {
          setFeaturePermissions({});
          setLoading(false);
          return;
        }

        // Get admin info from localStorage first
        const adminInfoStr = localStorage.getItem('adminInfo');
        if (adminInfoStr) {
          try {
            const adminInfo = JSON.parse(adminInfoStr);
            if (adminInfo.feature_permissions) {
              setFeaturePermissions(adminInfo.feature_permissions || {});
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error('Failed to parse adminInfo:', e);
          }
        }

        // Fetch from API if not in localStorage
        const token = localStorage.getItem('adminToken');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${BASE}/admin/admins`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.ok && Array.isArray(data.admins)) {
            const currentAdmin = data.admins.find(a => a.id === admin?.adminId || a.id === admin?.id);
            if (currentAdmin?.feature_permissions) {
              setFeaturePermissions(currentAdmin.feature_permissions || {});
            }
          }
        }
      } catch (error) {
        console.error('Failed to load feature permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [admin]);

  const can = useMemo(() => {
    return (featureKey, action) => {
      // Superadmin always has all permissions
      if (admin?.admin_role === 'superadmin') {
        return true;
      }

      // Normalize feature key (handle different path formats)
      const normalizeFeatureKey = (key) => {
        if (!key) return '';
        return key.replace(/^\/admin\//, '').replace(/^\//, '').replace(/\/$/, '').split('/').pop() || key;
      };

      const normalizedKey = normalizeFeatureKey(featureKey);
      
      // Check permissions
      const featurePerms = featurePermissions[normalizedKey] || featurePermissions[featureKey] || {};
      
      // Default to false if not explicitly set to true
      return featurePerms[action] === true;
    };
  }, [admin, featurePermissions]);

  return { can, loading };
};

