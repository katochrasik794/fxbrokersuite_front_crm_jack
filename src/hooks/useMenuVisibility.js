import { useState, useEffect } from 'react';
import { getEnabledMenuPaths } from '../services/menuService.js';

/**
 * Hook to check if a menu item should be visible
 * @param {string} routePath - The route path to check
 * @returns {boolean} True if menu should be visible
 */
export function useMenuVisibility(routePath) {
  const [isVisible, setIsVisible] = useState(true); // Default to visible to prevent flicker
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkVisibility = async () => {
      try {
        const enabledPaths = await getEnabledMenuPaths();
        const isEnabled = enabledPaths.has(routePath);
        
        // For sub-menus, also check parent
        if (!isEnabled && routePath.includes('/')) {
          const parentPath = routePath.split('/')[0];
          const parentEnabled = enabledPaths.has(parentPath);
          // If parent is enabled, check if this specific sub-menu is enabled
          if (parentEnabled) {
            setIsVisible(enabledPaths.has(routePath));
          } else {
            setIsVisible(false);
          }
        } else {
          setIsVisible(isEnabled);
        }
      } catch (error) {
        console.error('Error checking menu visibility:', error);
        // On error, default to visible to prevent breaking the UI
        setIsVisible(true);
      } finally {
        setLoading(false);
      }
    };

    checkVisibility();
  }, [routePath]);

  return { isVisible, loading };
}

