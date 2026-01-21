import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { getSuperAdminFeatures } from "./SidebarMenuConfig.js";
import { useAuth } from "../contexts/AuthContext";
import AdminIndexRedirect from "./AdminIndexRedirect.jsx";

export default function FeatureGuard({ feature, children }) {
  const { admin } = useAuth();
  const adminRole = admin?.admin_role || admin?.role || "admin";
  const [allowed, setAllowed] = useState(null); // null=loading, true/false=decision
  const BASE = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:5000/api";

  const isBuiltin = useMemo(() => ["superadmin", "admin", "moderator", "support", "analyst"].includes(adminRole), [adminRole]);
  
  // Extract stable string values for dependencies
  const adminRoleValue = admin?.admin_role || admin?.role || "admin";
  const adminIsCountryAdmin = admin?.isCountryAdmin ? "true" : "false";

  useEffect(() => {
    async function check() {
      // Superadmin and regular admin get access to all features
      if (adminRole === "superadmin" || adminRole === "admin") {
        setAllowed(true);
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
      
      let features = [];
      
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
      } else if (!isBuiltin) {
        // For other custom roles, fetch from DB
        try {
          const token = localStorage.getItem("adminToken");
          const res = await fetch(`${BASE}/admin/roles`, { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();
          const match = Array.isArray(data?.roles) ? data.roles.find(r => (r.name || '').toLowerCase() === String(adminRole).toLowerCase()) : null;
          const feats = match?.permissions?.features;
          if (Array.isArray(feats)) features = feats;
        } catch {}
      }
      
      // Check if feature matches (handle both full paths and last parts)
      // For nested routes like "deposits/approved", check:
      // 1. Full path match: "deposits/approved"
      // 2. Last part match: "approved"
      // 3. Parent match: "deposits" (to allow access to all child routes)
      const matchesFeature = (featPath, featureList) => {
        if (!featPath || !Array.isArray(featureList) || featureList.length === 0) return false;
        const pathStr = featPath.toString().trim();
        if (!pathStr) return false;
        
        // Split path into segments
        const pathSegments = pathStr.split('/').filter(s => s.length > 0);
        const lastPart = pathSegments[pathSegments.length - 1] || pathStr;
        const parentPart = pathSegments[0] || pathStr;
        
        return featureList.some(f => {
          const featStr = f.toString().trim();
          if (!featStr) return false;
          
          // Split feature into segments
          const featSegments = featStr.split('/').filter(s => s.length > 0);
          const featLastPart = featSegments[featSegments.length - 1] || featStr;
          const featParentPart = featSegments[0] || featStr;
          
          // Check various matching scenarios:
          // 1. Exact full path match: "deposits/approved" === "deposits/approved"
          if (featStr === pathStr) return true;
          
          // 2. Last part match: "approved" matches "deposits/approved" or "approved"
          if (featLastPart === lastPart || featStr === lastPart || featLastPart === pathStr) return true;
          
          // 3. Parent match: if feature is "deposits", allow access to "deposits/approved", "deposits/pending", etc.
          if (featParentPart === parentPart && featSegments.length === 1) return true;
          
          // 4. Full path contains feature or vice versa
          if (pathStr.includes(featStr) || featStr.includes(pathStr)) {
            // Make sure it's a proper segment match, not just substring
            if (pathStr.startsWith(featStr + '/') || featStr.startsWith(pathStr + '/')) return true;
          }
          
          return false;
        });
      };
      
      // Check if the full feature path or any part of it matches
      setAllowed(matchesFeature(feature, features));
    }
    check();
  }, [adminRole, feature, isBuiltin, BASE, adminRoleValue, adminIsCountryAdmin]);

  if (allowed === null) return null;
  if (allowed) return children;
  // Not allowed -> send to first permitted route
  return <AdminIndexRedirect />;
}


