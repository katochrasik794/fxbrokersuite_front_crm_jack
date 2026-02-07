import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BASE = import.meta.env.VITE_BACKEND_API_URL || "https://fxbrokersuite-back-crm-jack.onrender.com/api";

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function JsonViewer({ data, title }) {
  if (!data) return null;
  
  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export default function LogDetail() {
  const { logId } = useParams();
  const navigate = useNavigate();
  const location = window.location.pathname;
  const isUserLog = location.includes('/logs/user/detail/');
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let stop = false;
    setLoading(true);
    setError("");
    
    const token = localStorage.getItem('adminToken');
    const endpoint = isUserLog
      ? `${BASE}/admin/logs/user/detail/${logId}`
      : `${BASE}/admin/logs/admin/detail/${logId}`;
    
    fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (stop) return;
        if (!data?.ok) throw new Error(data?.error || "Failed to load log");
        setLog(data.log);
      })
      .catch(e => setError(e.message || String(e)))
      .finally(() => !stop && setLoading(false));
    return () => { stop = true; };
  }, [logId, isUserLog]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="p-6">
        <div className="text-center">Log not found</div>
      </div>
    );
  }

  const isAdminLog = !isUserLog && (log.admin_id !== null || log.admin_email !== null);

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(isAdminLog ? '/admin/logs/admin' : '/admin/logs/user')}
        className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Logs
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Log Details</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-semibold text-gray-600">Log ID</label>
            <p className="text-gray-800">{log.id}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600">
              {isAdminLog ? 'Admin Email' : 'User Email'}
            </label>
            <p className="text-gray-800">{isAdminLog ? log.admin_email : log.user_email}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600">Action Type</label>
            <p className="text-gray-800 font-mono text-sm">{log.action_type}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600">Category</label>
            <p className="text-gray-800">{log.action_category}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600">Target Type</label>
            <p className="text-gray-800">{log.target_type || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600">Target ID</label>
            <p className="text-gray-800">{log.target_id || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600">Target Identifier</label>
            <p className="text-gray-800">{log.target_identifier || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600">Description</label>
            <p className="text-gray-800">{log.description}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600">Request Method</label>
            <p className="text-gray-800">{log.request_method}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600">Request Path</label>
            <p className="text-gray-800 font-mono text-sm">{log.request_path}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600">Response Status</label>
            <p className="text-gray-800">{log.response_status}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600">IP Address</label>
            <p className="text-gray-800">{log.ip_address || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600">User Agent</label>
            <p className="text-gray-800 text-sm">{log.user_agent || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600">Timestamp</label>
            <p className="text-gray-800">{fmtDate(log.created_at)}</p>
          </div>
        </div>

        <div className="border-t pt-6">
          <JsonViewer data={log.request_body} title="Request Body" />
          <JsonViewer data={log.response_body} title="Response Body" />
          <JsonViewer data={log.before_data} title="Before Data" />
          <JsonViewer data={log.after_data} title="After Data" />
        </div>
      </div>
    </div>
  );
}

