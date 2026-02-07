const BASE = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || "https://fxbrokersuite-back-crm-jack.onrender.com/api";

// Cache for enabled menus (in-memory)
let enabledMenusCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = 'enabledMenusCache';
const STORAGE_TIMESTAMP_KEY = 'enabledMenusCacheTimestamp';

/**
 * Get enabled menus from localStorage (synchronous, for immediate access)
 * @returns {Array|null} Array of enabled menu objects or null if not cached
 */
function getEnabledMenusFromStorage() {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
    
    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      if (age < CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.error('Error reading menu cache from storage:', error);
  }
  return null;
}

/**
 * Save enabled menus to localStorage (synchronous)
 */
function saveEnabledMenusToStorage(menus) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(menus));
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error saving menu cache to storage:', error);
  }
}

/**
 * Get enabled menus from API
 * @returns {Promise<Array>} Array of enabled menu objects
 */
export async function getEnabledMenus() {
  // Check in-memory cache first
  if (enabledMenusCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return enabledMenusCache;
  }

  // Check localStorage cache (synchronous)
  const storageCache = getEnabledMenusFromStorage();
  if (storageCache) {
    enabledMenusCache = storageCache;
    cacheTimestamp = Date.now();
    return enabledMenusCache;
  }

  try {
    const token = localStorage.getItem('token');
    
    // If no token, return cached data or empty array
    if (!token) {
      if (storageCache) {
        return storageCache;
      }
      return [];
    }

    const response = await fetch(`${BASE}/menus/user`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      // Return cached data if available, otherwise empty array
      if (storageCache) {
        return storageCache;
      }
      return [];
    }

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      const menus = data.data || [];
      enabledMenusCache = menus;
      cacheTimestamp = Date.now();
      // Save to localStorage for immediate access on next load
      saveEnabledMenusToStorage(menus);
      return menus;
    } else {
      throw new Error(data.error || 'Failed to fetch enabled menus');
    }
  } catch (error) {
    console.error('Error fetching enabled menus:', error);
    // Return cached data from storage even if expired, as fallback
    if (storageCache) {
      return storageCache;
    }
    // Return empty array on error to prevent blocking
    return [];
  }
}

/**
 * Check if a specific route is enabled
 * @param {string} routePath - The route path to check (e.g., "dashboard", "analysis/signal-centre")
 * @returns {Promise<boolean>} True if menu is enabled
 */
export async function isMenuEnabled(routePath) {
  const enabledMenus = await getEnabledMenus();
  
  // Check if the exact route is enabled
  const menu = enabledMenus.find(m => m.route_path === routePath);
  if (menu) {
    return true;
  }

  // For sub-menus, check if parent is enabled
  if (routePath.includes('/')) {
    const parts = routePath.split('/');
    const parentPath = parts[0];
    const parentMenu = enabledMenus.find(m => m.route_path === parentPath);
    if (parentMenu) {
      // Check if the specific sub-menu is enabled
      const subMenu = enabledMenus.find(m => m.route_path === routePath);
      return !!subMenu;
    }
  }

  return false;
}

/**
 * Clear the menu cache (useful after menu changes)
 */
export function clearMenuCache() {
  enabledMenusCache = null;
  cacheTimestamp = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Error clearing menu cache from storage:', error);
  }
}

/**
 * Get enabled menu paths as a Set for quick lookup (synchronous from cache)
 * @returns {Set<string>} Set of enabled route paths
 */
export function getEnabledMenuPathsSync() {
  const storageCache = getEnabledMenusFromStorage();
  if (storageCache && Array.isArray(storageCache)) {
    return new Set(storageCache.map(m => m.route_path));
  }
  // Return empty set if no cache (will be updated async)
  return new Set();
}

/**
 * Get enabled menu paths as a Set for quick lookup (async, fetches if needed)
 * @returns {Promise<Set<string>>} Set of enabled route paths
 */
export async function getEnabledMenuPaths() {
  const enabledMenus = await getEnabledMenus();
  return new Set(enabledMenus.map(m => m.route_path));
}

