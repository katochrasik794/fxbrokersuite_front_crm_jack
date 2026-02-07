import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import { ADMIN_MENU } from "../components/SidebarMenuConfig.js";
import { useNavigate } from "react-router-dom";

function getAllFeaturesFromMenu() {
  const features = [];
  // Features that should NOT be assignable to country admins (superadmin only)
  const restrictedFeatures = [
    '/admin/assign-country-partner',
    'assign-country-partner',
    '/admin/assigned-country-admins',
    'assigned-country-admins',
    '/admin/assign-roles',
    'assign-roles'
  ];

  for (const section of ADMIN_MENU) {
    for (const item of section.items) {
      if (item.children && Array.isArray(item.children)) {
        for (const child of item.children) {
          // Skip restricted features
          const childPath = child.to || '';
          const normalizedPath = childPath.replace(/^\/admin\//, '').replace(/^\//, '');
          if (restrictedFeatures.includes(childPath) || restrictedFeatures.includes(normalizedPath)) {
            continue;
          }
          features.push({ key: child.to, label: `${item.label}: ${child.label}` });
        }
      } else {
        // Skip restricted features
        const itemPath = item.to || '';
        const normalizedPath = itemPath.replace(/^\/admin\//, '').replace(/^\//, '');
        if (restrictedFeatures.includes(itemPath) || restrictedFeatures.includes(normalizedPath)) {
          continue;
        }
        features.push({ key: item.to, label: item.label });
      }
    }
  }
  return features;
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function AssignCountryPartner() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    status: "active",
    features: [],
    country: ""
  });
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const BASE = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || "https://fxbrokersuite-back-crm-jack.onrender.com/api";
    fetch(`${BASE}/admin/countries`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
      }
    }).then(r => r.json()).then(res => {
      if (res.ok && Array.isArray(res.countries)) setCountries(res.countries.filter(Boolean));
    });
  }, []);

  const FLATTENED_FEATURES = useMemo(() => getAllFeaturesFromMenu(), []);
  const handleCheck = (feature) => {
    setForm(f => ({
      ...f, features: f.features.includes(feature)
        ? f.features.filter(f2 => f2 !== feature)
        : [...f.features, feature]
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const BASE = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || "https://fxbrokersuite-back-crm-jack.onrender.com/api";
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${BASE}/admin/country-admins`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await safeJson(res);
      if (!res.ok || !data?.ok) {
        if (res.status === 404) {
          throw new Error("API endpoint /admin/country-admins not found (404). Please check your backend routes.");
        } else if (res.status >= 500) {
          throw new Error(`Server error (${res.status}). Please check your backend logs.`);
        } else if (data && data.error) {
          throw new Error(data.error);
        } else {
          throw new Error(`API Error ${res.status}: ${res.statusText}`);
        }
      }
      if (!data) {
        throw new Error('API did not return valid JSON. Check if your backend returns JSON, not HTML.');
      }
      await Swal.fire({ icon: 'success', title: 'Partner created!', text: 'Country manager account created.' });
      setForm({ name: "", email: "", password: "", status: "active", features: [], country: "" });
      navigate("/admin/assigned-country-admins");
    } catch (e) {
      await Swal.fire({ icon: 'error', title: 'Error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen p-3 sm:p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Assign Country Partner</h1>
        <p className="text-sm sm:text-base text-gray-600">Create a new country admin account with custom features and permissions.</p>
      </div>

      {/* Main Form Card */}
      <div className="w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Card Header */}
          <div className="bg-linear-to-r from-brand-50 to-neutral-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">User Information</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Fill in the details to add a new Country Partner</p>
          </div>
          {/* Form Content */}
          <div className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Full Name *</label>
                    <input className="w-full rounded-lg border border-gray-300 h-11 px-4 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Enter full name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email Address *</label>
                    <input className="w-full rounded-lg border border-gray-300 h-11 px-4 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all" required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@example.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Password *</label>
                    <input className="w-full rounded-lg border border-gray-300 h-11 px-4 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all" required type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Enter secure password" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Country</label>
                    <select className="w-full rounded-lg border border-gray-300 h-11 px-4 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all" required value={form.country || ""} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}>
                      <option value="" disabled>Select country...</option>
                      {countries.map((c) => c && c.code ? (
                        <option key={c.code} value={c.code}>{c.country}</option>
                      ) : null)}
                    </select>
                  </div>
                </div>
              </div>
              {/* Account Settings Section */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Account Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <select className="w-full rounded-lg border border-gray-300 h-11 px-4 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="space-y-2 col-span-2 lg:col-span-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Features</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, features: FLATTENED_FEATURES.map(feat => feat.key) }))}
                          className="px-3 py-1 text-xs font-medium text-blue-700 hover:text-brand-700 hover:bg-brand-50 rounded-md transition-all"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, features: [] }))}
                          className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-all"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                      {FLATTENED_FEATURES.map(feat => (
                        <label key={feat.key} className="flex items-center min-h-[32px] p-2 rounded-lg hover:bg-gray-50 cursor-pointer w-full transition-all">
                          <input type="checkbox" checked={form.features.includes(feat.key)} onChange={() => handleCheck(feat.key)} className="mr-2" />
                          <span className="text-sm">{feat.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex flex-col gap-4 pt-4 sm:pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setForm({ name: "", email: "", password: "", status: "active", features: [], country: "" })}
                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all font-medium text-sm sm:text-base"
                  >Reset Form</button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 sm:px-8 py-2 sm:py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-dark-base disabled:opacity-60 disabled:cursor-not-allowed transition-all font-medium shadow-sm hover:shadow-md text-sm sm:text-base"
                  >{loading ? "Creating..." : "Create Partner"}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
