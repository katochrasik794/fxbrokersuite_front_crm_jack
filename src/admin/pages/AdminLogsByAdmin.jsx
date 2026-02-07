import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProTable from "../components/ProTable.jsx";
import { Eye } from "lucide-react";

const BASE = import.meta.env.VITE_BACKEND_API_URL || "https://fxbrokersuite-back-crm-jack.onrender.com/api";

export default function AdminLogsByAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let stop = false;
    setLoading(true);
    setError("");
    
    const token = localStorage.getItem('adminToken');
    fetch(`${BASE}/admin/admins`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (stop) return;
        if (!data?.ok) throw new Error(data?.error || "Failed to load admins");
        
        // Fetch log counts for each admin
        const adminPromises = (data.admins || []).map(admin => 
          fetch(`${BASE}/admin/logs/admin/${admin.id}?limit=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
            .then(r => r.json())
            .then(logData => ({
              id: admin.id,
              email: admin.email,
              username: admin.username,
              role: admin.admin_role,
              isActive: admin.is_active,
              actionCount: logData?.total || 0
            }))
            .catch(() => ({
              id: admin.id,
              email: admin.email,
              username: admin.username,
              role: admin.admin_role,
              isActive: admin.is_active,
              actionCount: 0
            }))
        );
        
        return Promise.all(adminPromises);
      })
      .then(admins => {
        if (stop) return;
        setRows(admins);
      })
      .catch(e => setError(e.message || String(e)))
      .finally(() => !stop && setLoading(false));
    return () => { stop = true; };
  }, []);

  const columns = [
    { key: "__index", label: "Sr No", sortable: false },
    { key: "email", label: "Email" },
    { key: "username", label: "Username" },
    { key: "role", label: "Role" },
    { key: "isActive", label: "Status", render: (v, row, Badge) => (
      <Badge tone={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Badge>
    )},
    { key: "actionCount", label: "Total Actions" },
    {
      key: "__actions",
      label: "Actions",
      render: (_, row) => (
        <button
          onClick={() => navigate(`/admin/logs/admin?adminId=${row.id}`)}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <Eye className="w-4 h-4" />
          View Admin Logs
        </button>
      )
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Logs by Admin</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <ProTable
        columns={columns}
        rows={rows}
        loading={loading}
      />
    </div>
  );
}

