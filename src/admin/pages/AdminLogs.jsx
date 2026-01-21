import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProTable from "../components/ProTable.jsx";
import { Eye, Download } from "lucide-react";

const BASE = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:5000/api";

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export default function AdminLogs() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    adminEmail: "",
    actionType: "",
    actionCategory: "",
    targetType: "",
    startDate: "",
    endDate: "",
    search: ""
  });
  const [pagination, setPagination] = useState({ limit: 100, offset: 0, total: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    let stop = false;
    setLoading(true);
    setError("");
    
    const params = new URLSearchParams({
      limit: pagination.limit.toString(),
      offset: pagination.offset.toString(),
    });
    
    if (filters.adminEmail) params.append('adminEmail', filters.adminEmail);
    if (filters.actionType) params.append('actionType', filters.actionType);
    if (filters.actionCategory) params.append('actionCategory', filters.actionCategory);
    if (filters.targetType) params.append('targetType', filters.targetType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.search) params.append('search', filters.search);
    
    const token = localStorage.getItem('adminToken');
    fetch(`${BASE}/admin/logs/admin?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (stop) return;
        if (!data?.ok) throw new Error(data?.error || "Failed to load logs");
        setRows(data.logs || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      })
      .catch(e => setError(e.message || String(e)))
      .finally(() => !stop && setLoading(false));
    return () => { stop = true; };
  }, [filters, pagination.limit, pagination.offset]);

  const columns = useMemo(() => [
    { key: "__index", label: "Sr No", sortable: false },
    { key: "admin_email", label: "Admin Email" },
    { key: "action_type", label: "Action Type", render: (v) => (
      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{v}</span>
    )},
    { key: "action_category", label: "Category", render: (v, row, Badge) => (
      <Badge tone="blue">{v}</Badge>
    )},
    { key: "target_type", label: "Target" },
    { key: "target_identifier", label: "Target ID" },
    { key: "description", label: "Description", render: (v) => (
      <span className="text-sm text-gray-700">{v?.substring(0, 50)}{v?.length > 50 ? '...' : ''}</span>
    )},
    { key: "ip_address", label: "IP Address" },
    { key: "created_at", label: "Timestamp", render: (v) => fmtDate(v) },
    {
      key: "__actions",
      label: "Actions",
      render: (_, row) => (
        <button
          onClick={() => navigate(`/admin/logs/admin/detail/${row.id}`)}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <Eye className="w-4 h-4" />
          View
        </button>
      )
    }
  ], [navigate]);

  const actionTypes = useMemo(() => {
    const types = new Set(rows.map(r => r.action_type).filter(Boolean));
    return Array.from(types).sort();
  }, [rows]);

  const categories = useMemo(() => {
    const cats = new Set(rows.map(r => r.action_category).filter(Boolean));
    return Array.from(cats).sort();
  }, [rows]);

  const handleExport = () => {
    const csv = [
      ['Admin Email', 'Action Type', 'Category', 'Target', 'Target ID', 'Description', 'IP Address', 'Timestamp'].join(','),
      ...rows.map(r => [
        r.admin_email || '',
        r.action_type || '',
        r.action_category || '',
        r.target_type || '',
        r.target_identifier || '',
        `"${(r.description || '').replace(/"/g, '""')}"`,
        r.ip_address || '',
        fmtDate(r.created_at)
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Admin Logs</h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="px-3 py-2 border rounded-lg"
          />
          <input
            type="text"
            placeholder="Admin Email"
            value={filters.adminEmail}
            onChange={(e) => setFilters(prev => ({ ...prev, adminEmail: e.target.value }))}
            className="px-3 py-2 border rounded-lg"
          />
          <select
            value={filters.actionType}
            onChange={(e) => setFilters(prev => ({ ...prev, actionType: e.target.value }))}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">All Action Types</option>
            {actionTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            value={filters.actionCategory}
            onChange={(e) => setFilters(prev => ({ ...prev, actionCategory: e.target.value }))}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="date"
            placeholder="Start Date"
            value={filters.startDate}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-3 py-2 border rounded-lg"
          />
          <input
            type="date"
            placeholder="End Date"
            value={filters.endDate}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <ProTable
        columns={columns}
        rows={rows}
        // keep client-side helpers but also reset outer filters when toolbar buttons are used
        onResetAll={() => {
          setFilters({
            adminEmail: "",
            actionType: "",
            actionCategory: "",
            targetType: "",
            startDate: "",
            endDate: "",
            search: ""
          });
          setPagination(prev => ({ ...prev, offset: 0 }));
        }}
        onClearDates={() => {
          setFilters(prev => ({ ...prev, startDate: "", endDate: "" }));
          setPagination(prev => ({ ...prev, offset: 0 }));
        }}
      />
    </div>
  );
}

