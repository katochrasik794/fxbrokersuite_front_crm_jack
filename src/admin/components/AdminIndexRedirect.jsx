import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { getSuperAdminFeatures } from "./SidebarMenuConfig.js";
import { useAuth } from "../contexts/AuthContext";

export default function AdminIndexRedirect() {
  const { admin } = useAuth();
  const adminRole = admin?.admin_role || admin?.role || "admin";
  const [target, setTarget] = useState(null);

  const BASE = import.meta.env.VITE_BACKEND_API_URL || "https://fxbrokersuite-back-crm-jack.onrender.com/api";
  const builtin = useMemo(() => ["superadmin", "admin", "moderator", "support", "analyst"], []);
  
  // Extract stable string values for dependencies
  const adminRoleValue = admin?.admin_role || admin?.role || "admin";
  const adminIsCountryAdmin = admin?.isCountryAdmin ? "true" : "false";

  useEffect(() => {
    async function resolve() {
      if (adminRole === "superadmin") {
        setTarget("dashboard");
        return;
      }
      
      // Check if user is a country admin
      const adminInfoStr = localStorage.getItem('adminInfo');
      let adminInfo = null;
      try {
        adminInfo = adminInfoStr ? JSON.parse(adminInfoStr) : null;
      } catch (e) {
        // Ignore parse errors
      }
      const isCountryAdmin = adminInfo?.isCountryAdmin || admin?.isCountryAdmin || adminInfo?.admin_role === 'country_admin' || admin?.admin_role === 'country_admin';
      
      const priority = [
        "dashboard",
        "users",
        "kyc",
        "mt5",
        "deposits",
        "withdrawals",
        "payment-gateways",
        "payment-details",
        "bulk-logs",
      ];

      // For superadmin, get all features dynamically
      let features = adminRole === 'superadmin' ? getSuperAdminFeatures() : [];
      
      // If country admin, get features from adminInfo or API
      if (isCountryAdmin) {
        // Helper to normalize feature paths
        const normalizeFeatures = (feats) => {
          if (!Array.isArray(feats)) return [];
          return feats.map(f => {
            if (typeof f === 'string' && f.includes('/')) {
              const cleaned = f.replace(/^\/admin\//, '').replace(/^\//, '').trim();
              return cleaned.split('/').pop() || cleaned;
            }
            return f;
          }).filter(f => f && f.length > 0);
        };
        
        // First try adminInfo
        if (Array.isArray(adminInfo?.features) && adminInfo.features.length > 0) {
          features = normalizeFeatures(adminInfo.features);
        } else {
          // Fetch from API
          try {
            const token = localStorage.getItem("adminToken");
            const res = await fetch(`${BASE}/admin/country-admin/me`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data?.ok && Array.isArray(data?.admin?.features)) {
              features = normalizeFeatures(data.admin.features);
            }
          } catch {}
        }
      } else if (!builtin.includes(adminRole) && adminRole !== 'superadmin') {
        // For other custom roles, fetch from DB
        try {
          const token = localStorage.getItem("adminToken");
          const res = await fetch(`${BASE}/admin/roles`, { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();
          const match = Array.isArray(data?.roles)
            ? data.roles.find((r) => (r.name || "").toLowerCase() === String(adminRole).toLowerCase())
            : null;
          const feats = match?.permissions?.features;
          if (Array.isArray(feats) && feats.length) features = feats;
        } catch {}
      }

      // Helper to check if a feature matches (handles both full paths and last parts)
      const matchesFeature = (featPath, featureList) => {
        if (!featPath) return false;
        const pathStr = featPath.toString();
        const lastPart = pathStr.split('/').pop() || pathStr;
        return featureList.some(f => {
          const featStr = f.toString();
          const featLastPart = featStr.split('/').pop() || featStr;
          return featStr === pathStr || featLastPart === lastPart || featStr === lastPart || featLastPart === pathStr;
        });
      };

      // pick first feature in priority that exists
      const chosen = priority.find((p) => matchesFeature(p, features)) || features[0] || "dashboard";
      setTarget(chosen);
    }
    resolve();
  }, [adminRole, BASE, builtin, adminRoleValue, adminIsCountryAdmin]);

  if (!target) return null;
  return <Navigate to={`/admin/${target}`} replace />;
}


