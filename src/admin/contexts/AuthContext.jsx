// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is logged in on app start
    const token = localStorage.getItem("adminToken");
    const adminInfo = localStorage.getItem("adminInfo");

    if (token && adminInfo) {
      try {
        setAdmin(JSON.parse(adminInfo));
      } catch (err) {
        // Invalid admin info, clear storage
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminInfo");
      }
    }
    setLoading(false);
  }, []);

  const login = (adminData, token) => {
    localStorage.setItem("adminToken", token);
    localStorage.setItem("adminInfo", JSON.stringify(adminData));
    setAdmin(adminData);
  };

  const logout = () => {
    // Clear ALL localStorage and cache
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear any cached data
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }

    // Clear cookies
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    
    setAdmin(null);
    
    // Force redirect to admin login
    window.location.href = '/admin/login';
  };

  // Intercept all fetch responses: on 401, perform logout to refresh token
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const response = await originalFetch(input, init);
      if (response && response.status === 401) {
        try { logout(); } catch {}
      }
      return response;
    };
    return () => { window.fetch = originalFetch; };
  }, []);

  const isAuthenticated = () => {
    return !!admin && !!localStorage.getItem("adminToken");
  };

  const value = {
    admin,
    loading,
    login,
    logout,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

