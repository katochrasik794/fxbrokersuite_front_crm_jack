import { useEffect, useState } from "react";
import React from "react";
import ProTable from "../components/ProTable.jsx";
import { RefreshCw, Power, PowerOff, ListChecks, ChevronDown, ChevronRight } from "lucide-react";
import Swal from "sweetalert2";
import { clearMenuCache } from "../../services/menuService.js";

const BASE = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || "https://fxbrokersuite-back-crm-jack.onrender.com/api";

export default function MenuManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchMenus();
  }, []);

  // Auto-expand all parent menus when menus are loaded
  useEffect(() => {
    if (rows.length > 0) {
      const parentsWithChildren = rows
        .filter(menu => !menu.parent_path)
        .map(menu => menu.route_path)
        .filter(parentPath => rows.some(m => m.parent_path === parentPath));
      
      if (parentsWithChildren.length > 0) {
        setExpandedParents(new Set(parentsWithChildren));
      }
    }
  }, [rows]);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE}/menus/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to load menus");
      setRows(data.data || []);
    } catch (e) {
      setError(e.message || String(e));
      Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'Failed to load menus' });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchNewMenus = async () => {
    try {
      setFetching(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE}/menus/admin/fetch`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch menus");
      
      setRows(data.data || []);
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: data.message || `Synced ${data.data?.length || 0} menus. ${data.newMenusCount || 0} new menu(s) added.`
      });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'Failed to fetch new menus' });
    } finally {
      setFetching(false);
    }
  };

  const handleToggleMenu = async (menu) => {
    try {
      // Check if this menu has children (submenus)
      const hasChildren = rows.some(m => m.parent_path === menu.route_path);
      const willDisable = !menu.is_enabled === false; // If currently enabled, will disable
      
      // Confirm if disabling a parent menu with children
      if (hasChildren && willDisable) {
        const confirm = await Swal.fire({
          title: 'Disable Parent Menu?',
          text: `Disabling "${menu.display_name}" will also disable all its submenus. Continue?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc2626',
          cancelButtonColor: '#6b7280',
          confirmButtonText: 'Yes, disable all',
          cancelButtonText: 'Cancel'
        });
        
        if (!confirm.isConfirmed) {
          return;
        }
      }

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE}/menus/admin/${menu.id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to toggle menu");

      // Clear menu cache so user sees changes immediately
      clearMenuCache();

      // Refetch menus to get updated status for submenus
      await fetchMenus();
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: data.message || `Menu ${data.data.is_enabled ? 'enabled' : 'disabled'} successfully`
      });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'Failed to toggle menu' });
    }
  };

  // State for expanded/collapsed parent menus
  const [expandedParents, setExpandedParents] = useState(new Set());

  // Organize menus hierarchically
  const organizeMenus = (menus) => {
    const menuMap = new Map();
    const topLevelMenus = [];

    // First pass: create menu objects and index them
    menus.forEach(menu => {
      menuMap.set(menu.route_path, { ...menu, children: [] });
    });

    // Second pass: build hierarchy
    menus.forEach(menu => {
      if (menu.parent_path) {
        const parent = menuMap.get(menu.parent_path);
        if (parent) {
          parent.children.push(menuMap.get(menu.route_path));
        } else {
          // Parent doesn't exist, treat as top-level
          topLevelMenus.push(menuMap.get(menu.route_path));
        }
      } else {
        topLevelMenus.push(menuMap.get(menu.route_path));
      }
    });

    return topLevelMenus;
  };

  const organizedMenus = organizeMenus(rows);

  const toggleParent = (parentPath) => {
    setExpandedParents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(parentPath)) {
        newSet.delete(parentPath);
      } else {
        newSet.add(parentPath);
      }
      return newSet;
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ListChecks className="w-6 h-6" />
            Manage Menus
          </h1>
          <p className="text-gray-600 mt-1">
            Enable or disable client-side menu items. Menus are automatically discovered from routes.
          </p>
        </div>
        <button
          onClick={handleFetchNewMenus}
          disabled={fetching}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-dark-base rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
          {fetching ? 'Fetching...' : 'Fetch New Menus'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading menus...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">No menus found. Click "Fetch New Menus" to discover menus from routes.</p>
            <button
              onClick={handleFetchNewMenus}
              disabled={fetching}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-dark-base rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 inline mr-2 ${fetching ? 'animate-spin' : ''}`} />
              Fetch New Menus
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Display Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route Path
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {organizedMenus.map((menu) => {
                  const hasChildren = menu.children && menu.children.length > 0;
                  const isExpanded = expandedParents.has(menu.route_path);
                  
                  return (
                    <React.Fragment key={menu.id}>
                      {/* Parent Menu Row */}
                      <tr className="bg-white hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {hasChildren && (
                              <button
                                onClick={() => toggleParent(menu.route_path)}
                                className="mr-2 p-1 hover:bg-gray-200 rounded transition-colors"
                                title={isExpanded ? 'Collapse' : 'Expand'}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                            )}
                            {!hasChildren && <div className="w-6 mr-2"></div>}
                            <div>
                              <div className="font-medium text-gray-900">
                                {menu.display_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">{menu.route_path}</code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            menu.is_enabled 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {menu.is_enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleToggleMenu(menu)}
                            className={`p-2 rounded-lg transition-colors ${
                              menu.is_enabled
                                ? 'bg-red-50 hover:bg-red-100 text-red-600'
                                : 'bg-green-50 hover:bg-green-100 text-green-600'
                            }`}
                            title={menu.is_enabled ? 'Disable Menu' : 'Enable Menu'}
                          >
                            {menu.is_enabled ? (
                              <PowerOff className="w-4 h-4" />
                            ) : (
                              <Power className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Submenu Rows (only show if expanded) */}
                      {hasChildren && isExpanded && menu.children.map((child) => (
                        <tr 
                          key={child.id}
                          className="bg-gray-50/50 hover:bg-gray-100 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center pl-8">
                              <span className="text-gray-400 mr-3 text-lg">├─</span>
                              <div>
                                <div className="font-medium text-gray-700">
                                  {child.display_name}
                                </div>
                                {child.parent_path && (
                                  <div className="text-xs text-gray-500 mt-0.5">Parent: {child.parent_path}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">{child.route_path}</code>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              child.is_enabled 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {child.is_enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleToggleMenu(child)}
                              className={`p-2 rounded-lg transition-colors ${
                                child.is_enabled
                                  ? 'bg-red-50 hover:bg-red-100 text-red-600'
                                  : 'bg-green-50 hover:bg-green-100 text-green-600'
                              }`}
                              title={child.is_enabled ? 'Disable Menu' : 'Enable Menu'}
                            >
                              {child.is_enabled ? (
                                <PowerOff className="w-4 h-4" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Click "Fetch New Menus" to discover any new routes that have been added</li>
          <li>New menus are enabled by default</li>
          <li>Disabling a menu will hide it from the client-side sidebar</li>
          <li>Disabling a parent menu will automatically disable all its submenus</li>
          <li>Sub-menus require their parent menu to be enabled to be visible</li>
        </ul>
      </div>
    </div>
  );
}

