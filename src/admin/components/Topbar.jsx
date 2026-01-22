// src/components/Topbar.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, Shield, Bell, Search, ChevronDown, User, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { SUPERADMIN_MENU, ADMIN_MENU, USER_MENU, getSuperAdminFeatures } from "./SidebarMenuConfig.js";

/**
 * Props
 * - onMenuToggle?: () => void
 * - role?: "superadmin" | "admin" | "user"
 * - title?: string
 * - breadcrumbs?: {label:string,to?:string}[]
 */
export default function Topbar({
  onMenuToggle = () => {},
  role = "superadmin",
  title = "Dashboard",
  breadcrumbs = [],
  onSidebarToggle = () => {},
  sidebarCollapsed = false,
}) {
  const [open, setOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [customFeatures, setCustomFeatures] = useState(null);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);
  const [latestTickets, setLatestTickets] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const notificationsRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [countryAdminInfo, setCountryAdminInfo] = useState(null);
  // Light theme: use plain white background (no gradient)

  // Resolve accessible menu (respects custom role features just like Sidebar)
  const BASE = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:5000/api";
  
  // Fetch country admin info if logged in as country admin
  useEffect(() => {
    const adminInfoStr = localStorage.getItem('adminInfo');
    let adminInfo = null;
    try {
      adminInfo = adminInfoStr ? JSON.parse(adminInfoStr) : null;
    } catch (e) {
      // Ignore parse errors
    }
    const isCountryAdmin = adminInfo?.isCountryAdmin || admin?.isCountryAdmin || adminInfo?.admin_role === 'country_admin' || admin?.admin_role === 'country_admin';
    
    if (isCountryAdmin) {
      // First try to use data from adminInfo
      if (adminInfo?.name && adminInfo?.country) {
        setCountryAdminInfo({ name: adminInfo.name, country: adminInfo.country });
      } else {
        // Fetch from API
        const abort = new AbortController();
        const token = localStorage.getItem('adminToken');
        fetch(`${BASE}/admin/country-admin/me`, { headers: { 'Authorization': `Bearer ${token}` }, signal: abort.signal })
          .then(r => r.json())
          .then(data => {
            if (data?.ok && data?.admin) {
              setCountryAdminInfo({ name: data.admin.name, country: data.admin.country });
            }
          })
          .catch(() => {});
        return () => abort.abort();
      }
    }
  }, [admin, BASE]);
  
  useEffect(() => {
    const builtin = ["superadmin", "admin", "moderator", "support", "analyst"];
    const roleName = admin?.admin_role;
    if (!roleName || builtin.includes(roleName)) return;
    const abort = new AbortController();
    const token = localStorage.getItem('adminToken');
    fetch(`${BASE}/admin/roles`, { headers: { 'Authorization': `Bearer ${token}` }, signal: abort.signal })
      .then(r => r.json())
      .then(data => {
        const match = Array.isArray(data?.roles) ? data.roles.find(r => (r.name || '').toLowerCase() === String(roleName).toLowerCase()) : null;
        const feats = match?.permissions?.features;
        if (Array.isArray(feats)) setCustomFeatures(feats);
      }).catch(()=>{});
    return () => abort.abort();
  }, [admin?.admin_role, BASE]);

  // Fetch open tickets count for notifications
  const fetchOpenTickets = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      
      const response = await fetch(`${BASE}/admin/support/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data?.ok) {
        const newCount = data.openTickets || 0;
        const newTickets = data.latestTickets || [];
        
        setOpenTicketsCount(newCount);
        setLatestTickets(newTickets);
        
        console.log('📧 Open tickets updated:', newCount, 'tickets');
      } else {
        console.error('Failed to fetch support summary:', data.error);
      }
    } catch (error) {
      console.error('Error fetching open tickets:', error);
    }
  }, [BASE]);

  // Fetch tickets on mount and set up polling
  useEffect(() => {
    // Fetch immediately on mount
    fetchOpenTickets();
    
    // Poll every 10 seconds for new tickets (more responsive)
    const interval = setInterval(() => {
      fetchOpenTickets();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchOpenTickets]);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);

  // Refresh notifications when navigating to support pages
  useEffect(() => {
    if (location.pathname.includes('/support')) {
      fetchOpenTickets();
    }
  }, [location.pathname, fetchOpenTickets]);

  const filterMenuByFeatures = (features) => {
    if (!Array.isArray(features) || features.length === 0) return [];
    return ADMIN_MENU.map(section => ({
      ...section,
      items: section.items.filter(item => {
        const path = (item.to || '').toString().split('/').pop() || item.to;
        // Always include logout button for all roles
        if (path === 'logout') return true;
        return features.includes(path);
      }).map(it => ({
        ...it,
        children: Array.isArray(it.children) ? it.children.filter(child => {
          const p = (child.to || '').toString().split('/').pop() || child.to;
          return features.includes(p) || features.includes((it.to || '').toString().split('/').pop());
        }) : it.children
      }))
    })).filter(section => {
      // Always include SYSTEM section if it has logout
      if (section.label === 'SYSTEM') {
        const hasLogout = section.items.some(item => {
          const path = (item.to || '').toString().split('/').pop() || item.to;
          return path === 'logout';
        });
        if (hasLogout) return true;
      }
      return section.items.length > 0;
    });
  };

  const accessibleMenu = (() => {
    if (role === "superadmin") return SUPERADMIN_MENU;
    if (role === "user") return USER_MENU;
    const roleName = admin?.admin_role || 'admin';
    // For superadmin, get all features dynamically
    const builtinFeatures = roleName === 'superadmin' ? getSuperAdminFeatures() : [];
    // For other roles, use custom features from DB (passed via customFeatures prop)
    const features = Array.isArray(customFeatures) && customFeatures.length > 0 ? customFeatures : builtinFeatures;
    if (Array.isArray(features) && features.length) return filterMenuByFeatures(features);
    return filterMenuByFeatures(["dashboard"]);
  })();

  // Flatten menu items for search - only currently accessible sidebar features
  const getAllMenuItems = () => {
    const menuItems = accessibleMenu;
    const items = [];
    
    menuItems.forEach(section => {
      section.items.forEach(item => {
        // Only add main menu items (not logout)
        if (item.to !== '/logout') {
          items.push({
            label: item.label,
            to: item.to,
            section: section.label,
            icon: item.icon
          });
          
          // Add children if they exist
          if (item.children) {
            item.children.forEach(child => {
              items.push({
                label: child.label,
                to: child.to,
                section: section.label,
                parent: item.label,
                icon: item.icon
              });
            });
          }
        }
      });
    });
    
    return items;
  };

  // Get current page name based on pathname
  const getCurrentPageName = () => {
    const allItems = getAllMenuItems();
    const currentItem = allItems.find(item => item.to === location.pathname);
    return currentItem ? currentItem.label : title;
  };

  // Search functionality - only sidebar features
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const allItems = getAllMenuItems();
    const filtered = allItems.filter(item => 
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.section.toLowerCase().includes(query.toLowerCase()) ||
      (item.parent && item.parent.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 6); // Limit to 6 results for better UX

    setSearchResults(filtered);
  };

  // Navigate to selected item
  const handleNavigate = (to) => {
    navigate(to);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  useEffect(() => {
    const h = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const profileHref =
    role === "user" ? "/u/settings/profile" : role === "admin" ? "/admin/profile" : "/sa/profile";
  const logoutHref = role === "user" ? "/u/logout" : "/logout";

  return (
    <>
      {/* Fixed bar aligned to content width with full responsiveness */}
        <header className={`pointer-events-none fixed z-40 top-2 left-0 right-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:left-[80px]' : 'lg:left-[240px]'}`}>
        <div
          style={{ marginInline: 'var(--app-x)' }}
          className="pointer-events-auto w-[calc(100%-var(--app-x)*2)] rounded-2xl bg-white border border-gray-200 text-gray-800 shadow-md">
          <div className="h-14 px-2 sm:px-4 md:px-6 flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={onMenuToggle}
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Desktop sidebar toggle */}
            <button
              onClick={onSidebarToggle}
              className="hidden lg:inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>

            {/* Title / Breadcrumbs */}
            <div className="flex-1 min-w-0">
              <div className="hidden md:flex items-center gap-2 text-xs">
                {breadcrumbs.length ? (
                  breadcrumbs.map((bc, i) => (
                    <span key={i} className="flex items-center gap-2">
                      {i > 0 && <span className="opacity-40">/</span>}
                      {bc.to ? (
                        <a href={bc.to} className="hover:underline text-gray-600 inline-flex items-center gap-1.5">
                          {bc.icon ? <bc.icon className="h-3.5 w-3.5" /> : null}
                          <span>{bc.label}</span>
                        </a>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 text-gray-900 ${
                            i === breadcrumbs.length - 1 ? "font-semibold" : ""
                          }`}
                        >
                          {bc.icon ? <bc.icon className="h-3.5 w-3.5" /> : null}
                          <span>{bc.label}</span>
                        </span>
                      )}
                    </span>
                  ))
                ) : (
                  <span className="font-semibold text-gray-900">{getCurrentPageName()}</span>
                )}
              </div>
              <div className="md:hidden font-semibold truncate">{getCurrentPageName()}</div>
            </div>

            {/* Mobile Search Button (xs only) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Search (sm+) */}
            <div className="hidden sm:flex relative" ref={searchRef}>
              <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 border border-gray-200 min-w-[260px] max-w-md w-full">
                <Search className="h-4 w-4 opacity-80" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    handleSearch(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Search sidebar features..."
                  className="w-full bg-transparent placeholder:text-gray-500 text-gray-800 outline-none"
                />
              </div>

              {/* Search Dropdown */}
              {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl z-50">
                  <div className="p-2">
                    {searchResults.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleNavigate(item.to)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          {item.icon && (
                            <item.icon className="h-4 w-4 text-gray-500 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-900 font-medium text-sm truncate">{item.label}</div>
                            <div className="text-gray-500 text-xs">
                              {item.parent ? `${item.section} > ${item.parent}` : item.section}
                            </div>
                          </div>
                          <div className="text-gray-500 group-hover:text-gray-700 transition-colors shrink-0">
                            <ChevronDown className="h-4 w-4 -rotate-90" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {isSearchOpen && searchQuery && searchResults.length === 0 && (
                <div className="absolute top-full mt-2 w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl z-50">
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No results found for "{searchQuery}"
                  </div>
                </div>
              )}
            </div>

            {/* Balance Display */}
            {/* <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-xl bg-gray-100 border border-gray-200">
              <div className="text-right">
                <div className="text-[10px] sm:text-xs text-gray-500 font-medium">Balance</div>
                <div className="text-xs sm:text-sm font-semibold text-emerald-600">$25,040.22</div>
              </div>
              <div className="w-px h-6 sm:h-8 bg-gray-300"></div>
              <div className="text-right">
                <div className="text-[10px] sm:text-xs text-gray-500 font-medium">Equity</div>
                <div className="text-xs sm:text-sm font-semibold text-blue-600">$24,890.15</div>
              </div>
            </div> */}

            {/* Role chip / Country Admin Info */}
            {(() => {
              // If country admin, show country and name
              if (countryAdminInfo) {
                return (
                  <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                    <Shield className="h-3.5 w-3.5 text-emerald-700" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-emerald-700 leading-tight">
                        {countryAdminInfo.country ? String(countryAdminInfo.country).toUpperCase() : 'Country Admin'}
                      </span>
                      <span className="text-[9px] text-emerald-600 leading-tight truncate max-w-[120px]">
                        {countryAdminInfo.name || admin?.email || 'Admin'}
                      </span>
                    </div>
                  </div>
                );
              }
              
              // For other admins, show role chip
              const rawRole = admin?.admin_role || role;
              const label = rawRole === 'superadmin'
                ? 'SUPER ADMIN'
                : String(rawRole)
                    .split(/[ _-]/)
                    .filter(Boolean)
                    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
                    .join(' ');
              return (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <Shield className="h-3.5 w-3.5" />
                  {label}
                </span>
              );
            })()}

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="Notifications"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <Bell className="h-5 w-5" />
                {openTicketsCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {openTicketsCount > 99 ? '99+' : openTicketsCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl z-50">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">Support Tickets</h3>
                      <div className="flex items-center gap-2">
                        {openTicketsCount > 0 && (
                          <span className="text-xs font-medium text-red-600">
                            {openTicketsCount} {openTicketsCount === 1 ? 'ticket' : 'tickets'} open
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchOpenTickets();
                          }}
                          className="text-xs text-gray-500 hover:text-gray-700"
                          title="Refresh"
                        >
                          ↻
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {latestTickets.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {latestTickets.map((ticket) => (
                          <button
                            key={ticket.id}
                            onClick={() => {
                              navigate(`/admin/support/tickets/${ticket.id}`);
                              setNotificationsOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  #{ticket.id}: {ticket.subject}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {ticket.user_name || ticket.user_email || 'Unknown User'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(ticket.created_at).toLocaleString()}
                                </p>
                              </div>
                              <span className="ml-2 flex-shrink-0">
                                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                                  {ticket.priority || 'medium'}
                                </span>
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No open tickets</p>
                      </div>
                    )}
                  </div>
                  
                  {openTicketsCount > 0 && (
                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                      <button
                        onClick={() => {
                          navigate('/admin/support/open');
                          setNotificationsOpen(false);
                        }}
                        className="w-full text-sm font-medium text-blue-600 hover:text-blue-700 text-center"
                      >
                        View All Open Tickets →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="flex items-center gap-2 rounded-xl hover:bg-gray-100 px-1.5 py-1.5 border border-gray-200"
              >
                <svg className="h-8 w-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <ChevronDown className="h-4 w-4 opacity-80" />
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white text-gray-800 shadow-2xl">
                  <div className="px-3 py-2 text-xs text-gray-500">
                    Signed in as <span className="text-gray-700">{admin?.email || 'admin@fxbrokersuite.com'}</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    <a href={profileHref} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100">
                      <User className="h-4 w-4 opacity-80" /> Profile
                    </a>
                    <button 
                      onClick={logout}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-rose-600 w-full text-left"
                    >
                      <LogOut className="h-4 w-4 opacity-80" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Spacer so content never hides under the fixed bar */}
      <div className="h-[72px]" />
    </>
  );
}

