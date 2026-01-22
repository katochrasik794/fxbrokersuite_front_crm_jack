// src/components/Sidebar.jsx
import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { SUPERADMIN_MENU, ADMIN_MENU, USER_MENU, getMenuForRole, getSuperAdminFeatures } from "./SidebarMenuConfig.js";
import { useAuth } from "../contexts/AuthContext";
import { ChevronDown } from "lucide-react";

/* ---------- Section ---------- */
function Section({ title, items, pathname, openMap, onToggle, onNavigate, isDark, collapsed = false }) {
  return (
    <div className="mt-6">
      {!collapsed && (
        <div className={`px-4 text-xs font-semibold tracking-wider ${isDark ? 'text-slate-300/70' : 'text-gray-500'
          }`}>
          {title}
        </div>
      )}

      <div className={`mt-2 space-y-1 ${collapsed ? 'px-2' : 'px-2'}`}>
        {items.map((it) => {
          const hasChildren = Array.isArray(it.children) && it.children.length > 0;
          const active =
            pathname === it.to || (it.to && it.to !== "/" && pathname.startsWith(it.to));
          const withinChild = hasChildren && it.children.some((c) => pathname.startsWith(c.to));
          const isOpen = openMap?.[it.to || it.label] ?? withinChild;

          const parentBase = isDark ? "text-slate-200 hover:bg-neutral-800/20 hover:text-white" : "text-dark-base hover:bg-blue-600/10 hover:text-dark-base";
          const parentActive = isDark ? "bg-neutral-800/40 text-white shadow-sm" : "bg-blue-600 text-white shadow-sm ring-1 ring-black/5";
          const childBase = isDark ? "text-slate-300 hover:bg-neutral-800/15 hover:text-white" : "text-dark-base/70 hover:bg-blue-600/10 hover:text-dark-base";
          const childActive = isDark ? "bg-neutral-800/25 text-white" : "bg-blue-600 text-white font-medium";
          const dotCls = isDark ? "bg-white/60" : "bg-gray-600";

          if (hasChildren) {
            return (
              <div key={it.label}>
                <button
                  type="button"
                  onClick={() => onToggle(it.to || it.label)}
                  className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} rounded-xl ${collapsed ? 'px-2' : 'px-3'} py-2 transition-all duration-200 relative group ${isOpen || active ? parentActive : parentBase
                    }`}
                  title={collapsed ? it.label : undefined}
                >
                  <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-blue-600 transition-all duration-200 ${isOpen || active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`} />
                  <span className="flex items-center gap-2 min-w-0">
                    {it.icon ? <it.icon size={16} className="shrink-0" /> : <span className={`h-2 w-2 rounded-full ${dotCls} shrink-0`} />}
                    {!collapsed && <span className="font-medium truncate text-sm">{it.label}</span>}
                  </span>
                  {!collapsed && (
                    <ChevronDown
                      size={14}
                      className={`ml-1 shrink-0 opacity-75 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  )}
                </button>

                {!collapsed && (
                  <div
                    className={`pl-6 pr-1 transition-all duration-600 grid ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                  >
                    <div className="overflow-hidden my-1 space-y-1">
                      {it.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={onNavigate}
                          className={({ isActive }) =>
                            `flex items-center gap-2 rounded-lg px-2 py-1 text-xs transition-all duration-200 relative group ${isActive ? childActive : childBase
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-blue-600 transition-all duration-200 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                }`} />
                              {child.icon ? (
                                <child.icon size={14} className="shrink-0 opacity-80" />
                              ) : (
                                <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${dotCls}`} />
                              )}
                              <span className="truncate">{child.label}</span>
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={it.to}
              to={it.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `w-full flex items-center ${collapsed ? 'justify-center' : 'gap-2'} rounded-xl ${collapsed ? 'px-2' : 'px-3'} py-2 transition-all duration-200 relative group ${active || isActive ? parentActive : parentBase
                }`
              }
              title={collapsed ? it.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-blue-600 transition-all duration-200 ${active || isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`} />
                  {it.icon ? <it.icon size={16} className="shrink-0" /> : <span className={`h-2 w-2 rounded-full ${dotCls} shrink-0`} />}
                  {!collapsed && <span className="font-medium truncate text-sm">{it.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Header ---------- */
function Header({ role, collapsed = false }) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-center">
        {collapsed ? (
          <img src="/logo.png" alt="fxbrokersuite Markets" className="h-8 w-8 object-contain" style={{ background: 'transparent' }} />
        ) : (
          <img src="/logo.png" alt="fxbrokersuite Markets" className="h-14 w-auto" style={{ background: 'transparent' }} />
        )}
      </div>
    </div>
  );
}

/* ---------- Sidebar Root ---------- */
export default function Sidebar({
  role = "superadmin",
  adminRole = "superadmin",
  pathname = "/",
  open = false,
  onClose = () => { },
  className = "",
  collapsed = false,
}) {
  const { admin } = useAuth();

  const [customFeatures, setCustomFeatures] = useState(null); // null = unknown, [] = none
  const BASE = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    // Check if user is a country admin
    const adminInfoStr = localStorage.getItem('adminInfo');
    let adminInfo = null;
    try {
      adminInfo = adminInfoStr ? JSON.parse(adminInfoStr) : null;
    } catch (e) {
      console.error('Failed to parse adminInfo:', e);
    }

    const isCountryAdmin = adminInfo?.isCountryAdmin || admin?.isCountryAdmin || adminInfo?.admin_role === 'country_admin' || admin?.admin_role === 'country_admin';

    // If country admin, use features from adminInfo or fetch from API
    if (isCountryAdmin) {
      // Helper function to normalize feature paths to match sidebar filter logic
      // The filter uses .split('/').pop() to extract the last part of the path
      const normalizeFeatures = (features) => {
        if (!Array.isArray(features)) return [];
        return features.map(f => {
          // If feature is a full path like "/admin/users/all", extract "all"
          // If feature is already just "all", keep it as is
          if (typeof f === 'string' && f.includes('/')) {
            // Remove leading /admin/ if present, then get last part
            const cleaned = f.replace(/^\/admin\//, '').replace(/^\//, '');
            return cleaned.split('/').pop() || cleaned;
          }
          return f;
        }).filter(f => f && f.length > 0);
      };

      // First try to use features from adminInfo (stored after login)
      if (Array.isArray(adminInfo?.features) && adminInfo.features.length > 0) {
        const normalized = normalizeFeatures(adminInfo.features);
        setCustomFeatures(normalized);
        return;
      }

      // If not in adminInfo, fetch from API
      const abort = new AbortController();
      const token = localStorage.getItem('adminToken');
      fetch(`${BASE}/admin/country-admin/me`, { headers: { 'Authorization': `Bearer ${token}` }, signal: abort.signal })
        .then(r => r.json())
        .then(data => {
          if (data?.ok && Array.isArray(data?.admin?.features)) {
            const normalized = normalizeFeatures(data.admin.features);
            setCustomFeatures(normalized);
            // Also update adminInfo in localStorage with normalized features
            if (adminInfo) {
              adminInfo.features = normalized;
              adminInfo.isCountryAdmin = true;
              localStorage.setItem('adminInfo', JSON.stringify(adminInfo));
            }
          } else {
            setCustomFeatures([]);
          }
        })
        .catch(() => {
          setCustomFeatures([]);
        });
      return () => abort.abort();
    }

    // If role isn't one of the built-ins, try resolving custom role features from backend
    const builtin = ["superadmin", "admin", "moderator", "support", "analyst"];
    const roleName = adminRole || admin?.admin_role;
    if (!roleName || builtin.includes(roleName)) return;
    const abort = new AbortController();
    const token = localStorage.getItem('adminToken');
    fetch(`${BASE}/admin/roles`, { headers: { 'Authorization': `Bearer ${token}` }, signal: abort.signal })
      .then(r => r.json())
      .then(data => {
        const match = Array.isArray(data?.roles) ? data.roles.find(r => (r.name || '').toLowerCase() === String(roleName).toLowerCase()) : null;
        const feats = match?.permissions?.features;
        if (Array.isArray(feats)) setCustomFeatures(feats);
      })
      .catch(() => { });
    return () => abort.abort();
  }, [adminRole, admin, BASE]);

  // Check if user is country admin (to hide superadmin-only items)
  const adminInfoStr = localStorage.getItem('adminInfo');
  let adminInfo = null;
  try {
    adminInfo = adminInfoStr ? JSON.parse(adminInfoStr) : null;
  } catch (e) {
    // Ignore parse errors
  }
  const isCountryAdmin = adminInfo?.isCountryAdmin || admin?.isCountryAdmin || adminInfo?.admin_role === 'country_admin' || admin?.admin_role === 'country_admin';

  const filterMenuByFeatures = useMemo(() => {
    return (features) => {
      if (!Array.isArray(features) || features.length === 0) return [];

      // Helper to check if a path matches any feature
      // Features can be stored as full paths (e.g., "users/all") or just the last part (e.g., "all")
      const matchesFeature = (path, featureList) => {
        if (!path) return false;
        const pathStr = path.toString();
        const lastPart = pathStr.split('/').pop() || pathStr;

        // Check if feature list includes the full path or just the last part
        return featureList.some(f => {
          const featStr = f.toString();
          const featLastPart = featStr.split('/').pop() || featStr;
          // Match if full paths match OR last parts match
          return featStr === pathStr || featLastPart === lastPart || featStr === lastPart || featLastPart === pathStr;
        });
      };

      return ADMIN_MENU.map(section => ({
        ...section,
        items: section.items.filter(item => {
          const path = item.to || '';
          // Always include logout button for all roles
          if (path === 'logout' || path.endsWith('/logout')) return true;

          // Hide superadmin-only items from country admins
          if (isCountryAdmin) {
            // Hide "Assign Country Partner" and "Assigned Country Admins" from country admins
            // These paths can be in different formats: "assign-country-partner" or "/admin/assign-country-partner"
            const normalizedPath = path.replace(/^\/admin\//, '').replace(/^\//, '');
            if (normalizedPath === 'assign-country-partner' || normalizedPath === 'assigned-country-admins') {
              return false;
            }
            // Keep "Assign Roles" visible to country admins (they can distribute roles)
          }

          // Check if this item or any of its children match
          if (matchesFeature(path, features)) return true;
          // If it has children, check if any child matches
          if (Array.isArray(item.children) && item.children.length > 0) {
            return item.children.some(child => matchesFeature(child.to || '', features));
          }
          return false;
        }).map(it => ({
          ...it,
          children: Array.isArray(it.children) ? it.children.filter(child => {
            const childPath = child.to || '';
            // Check if child path matches, or if parent path matches (to show parent with children)
            return matchesFeature(childPath, features) || matchesFeature(it.to || '', features);
          }) : it.children
        }))
      })).filter(section => {
        // Always include SYSTEM section if it has logout
        if (section.label === 'SYSTEM') {
          const hasLogout = section.items.some(item => {
            const path = item.to || '';
            return path === 'logout' || path.endsWith('/logout');
          });
          if (hasLogout) return true;
        }
        return section.items.length > 0;
      });
    };
  }, [isCountryAdmin, admin]);

  const MENU = useMemo(() => {
    // Check if user is a country admin
    const adminInfoStr = localStorage.getItem('adminInfo');
    let adminInfo = null;
    try {
      adminInfo = adminInfoStr ? JSON.parse(adminInfoStr) : null;
    } catch (e) {
      // Ignore parse errors
    }
    const isCountryAdmin = adminInfo?.isCountryAdmin || admin?.isCountryAdmin || adminInfo?.admin_role === 'country_admin' || admin?.admin_role === 'country_admin';

    // If user is not an admin and not a country admin, show user menu
    if (role !== "admin" && !isCountryAdmin && adminRole !== "admin" && adminRole !== "superadmin") {
      return USER_MENU;
    }

    // For country admins with restricted features, filter the menu
    if (isCountryAdmin && Array.isArray(customFeatures) && customFeatures.length > 0) {
      return filterMenuByFeatures(customFeatures);
    }

    // For all other admins (superadmin, regular admin, or any admin user), show full menu
    return ADMIN_MENU;
  }, [role, adminRole, customFeatures, filterMenuByFeatures, admin]);

  // Force light mode
  const isDark = false;

  // auto-open section for current path
  const initialOpen = useMemo(() => {
    const map = {};
    MENU.forEach((section) =>
      section.items.forEach((it) => {
        if (it.children?.length) {
          map[it.to || it.label] = it.children.some((c) => pathname.startsWith(c.to));
        }
      })
    );
    return map;
  }, [MENU, pathname]);

  const [openMap, setOpenMap] = useState(initialOpen);
  useEffect(() => setOpenMap(initialOpen), [initialOpen]);

  const toggle = (key) => setOpenMap((m) => ({ ...m, [key]: !m[key] }));
  const handleNavigate = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) onClose();
  };

  const lightStyle = {
    background: "#ffffff"
  };

  const backgroundStyle = lightStyle;
  const textTheme = "text-dark-base font-sans";

  return (
    <>
      {/* MOBILE DRAWER */}
      <div className={`fixed inset-0 z-40 lg:hidden ${open ? "" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          onClick={onClose}
          aria-hidden="true"
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Sidebar"
          style={{ ...backgroundStyle, width: "70vw", maxWidth: 380 }}
          className={`fixed left-0 top-0 bottom-0 transform transition-transform overflow-y-auto overflow-x-hidden
                      sidebar ${textTheme} shadow-xl ${open ? "translate-x-0" : "-translate-x-full"}
                      scrollbar-thin scrollbar-thumb-brand-500/50 scrollbar-track-neutral-900/10
                      hover:scrollbar-thumb-brand-500/70`}
        >
          <Header role={role} />
          <nav className="pb-8">
            {MENU.map((section) => (
              <Section
                key={section.label}
                title={section.label}
                items={section.items}
                pathname={pathname}
                openMap={openMap}
                onToggle={toggle}
                onNavigate={handleNavigate}
                isDark={isDark}
              />
            ))}
          </nav>
        </aside>
      </div>

      {/* DESKTOP (fixed so no bottom gap) */}
      <aside
        style={{ ...backgroundStyle }}
        className={`hidden lg:block fixed left-0 top-0 bottom-0 shrink-0 overflow-y-auto overflow-x-hidden transition-all duration-300
                    sidebar ${textTheme} shadow-xl ${className} border-r border-gray-200
                    scrollbar-thin scrollbar-thumb-brand-500/50 scrollbar-track-neutral-900/10
                    hover:scrollbar-thumb-brand-500/70 ${collapsed ? 'w-[80px]' : 'w-[240px]'}`}
      >
        <Header role={role} collapsed={collapsed} />
        <nav className="pb-8">
          {MENU.map((section) => (
            <Section
              key={section.label}
              title={section.label}
              items={section.items}
              pathname={pathname}
              openMap={openMap}
              onToggle={toggle}
              onNavigate={() => { }}
              isDark={isDark}
              collapsed={collapsed}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}

