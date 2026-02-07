import { useEffect, useMemo, useState } from "react";
import { Eye, Settings, Lock, Trash2 } from "lucide-react";
import Modal from "../components/Modal.jsx";
import ProTable from "../components/ProTable.jsx";
import Swal from "sweetalert2";

const FEATURE_LABELS = {
  'dashboard': 'Dashboard',
  'users/add': 'Add User',
  'users/all': 'All Users',
  'users/active': 'Active Users',
  'users/banned': 'Banned Users',
  'users/email-unverified': 'Email Unverified',
  'users/with-balance': 'With Balance',
  'kyc': 'KYC Verifications',
  'mt5': 'MT5 Management',
  'mt5/users': 'MT5 Users List',
  'mt5/assign': 'Assign MT5 to Email',
  'support/open': 'Opened Tickets',
  'support/closed': 'Closed Tickets',
  'deposits/pending': 'Pending Deposits',
  'deposits/approved': 'Approved Deposits',
  'deposits/rejected': 'Rejected Deposits',
  'deposits/all': 'All Deposits',
  'withdrawals/pending': 'Pending Withdrawals',
  'withdrawals/approved': 'Approved Withdrawals',
  'withdrawals/rejected': 'Rejected Withdrawals',
  'withdrawals/all': 'All Withdrawals',
  'payment-gateways/automatic': 'Deposit Gateway',
  'payment-gateways/manual': 'Manual Gateways',
  'payment-details': 'Payment Details',
  'bulk-logs': 'Bulk Operations Log',
  'assign-roles': 'Assign Roles',
  'profile': 'Admin Profile',
  'assigned-country-admins': 'Assigned Country Admins',
  'assign-country-partner': 'Assign Country Partner',
  'logout': 'Logout',
};

function prettyFeatureLabel(slug) {
  return FEATURE_LABELS[slug] ||
    slug // fallback: try splitting
      .replace(/^\//, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
}

export default function AssignedCountryAdmins() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const BASE = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || "https://fxbrokersuite-back-crm-jack.onrender.com/api";

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${BASE}/admin/country-admins`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setRows(data);
      else if (Array.isArray(data.admins)) setRows(data.admins);
      else setRows([]);
    } catch {
      setRows([]);
    }

  };

  async function onDelete(row) {
    const confirm = await Swal.fire({ icon: 'warning', title: `Delete ${row.email}?`, showCancelButton: true, confirmButtonColor: '#d33' });
    if (!confirm.isConfirmed) return;
    const token = localStorage.getItem('adminToken');
    const r = await fetch(`${BASE}/admin/country-admins/${row.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    const j = await r.json().catch(() => ({ ok: true }));
    if (r.ok && (j.ok !== false)) setRows(list => list.filter(it => it.id !== row.id));
    else Swal.fire({ icon: 'error', title: 'Delete failed', text: j?.error || 'Unable to delete' });
  }

  async function onPassword(row, password) {
    const token = localStorage.getItem('adminToken');
    const r = await fetch(`${BASE}/admin/country-admins/${row.id}/password`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ password }) });
    const j = await r.json();
    if (!r.ok || j?.ok === false) throw new Error(j?.error || 'Failed');
  }

  const columns = useMemo(() => [
    { key: "__index", label: "Sr No" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "status", label: "Status", render: (v) => (
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${String(v).toLowerCase() === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{v}</span>
      )
    },
    { key: "country", label: "Country", render: (v, row) => String(v || row.country_code || '').toUpperCase() },
    {
      key: "features", label: "Features", render: (v) => (
        <div className="flex flex-wrap gap-1 justify-center">
          {(Array.isArray(v) && v.length) ? v.map((slug, i) => (
            <span key={i} className="inline-block rounded-lg px-2 py-1 bg-brand-100 text-brand-900 text-xs font-semibold whitespace-nowrap">{prettyFeatureLabel(slug)}</span>
          )) : <span className="text-gray-400 text-xs">None</span>}
        </div>
      )
    },
    {
      key: "actions", label: "Actions", sortable: false, render: (v, row) => (
        <div className="flex items-end gap-4 justify-center">
          <button onClick={() => setEditing(row)} className="flex flex-col items-center text-green-600 hover:text-green-800" title="Edit Features">
            <Settings className="h-4 w-4" />
            <small className="text-[10px] leading-3 mt-1">Features</small>
          </button>
          <button onClick={() => setViewing(row)} className="flex flex-col items-center text-blue-600 hover:text-blue-800" title="View">
            <Eye className="h-4 w-4" />
            <small className="text-[10px] leading-3 mt-1">View</small>
          </button>
          <button onClick={async () => {
            const { value: pwd } = await Swal.fire({ title: 'Change Password', input: 'password', inputLabel: 'New Password', showCancelButton: true });
            if (!pwd) return; try { await onPassword(row, pwd); Swal.fire({ icon: 'success', title: 'Password updated', timer: 1500, showConfirmButton: false }); } catch (e) { Swal.fire({ icon: 'error', title: 'Failed', text: e.message || 'Unable to update' }); }
          }} className="flex flex-col items-center text-orange-600 hover:text-orange-800" title="Password">
            <Lock className="h-4 w-4" />
            <small className="text-[10px] leading-3 mt-1">Password</small>
          </button>
          <button onClick={() => onDelete(row)} className="flex flex-col items-center text-red-600 hover:text-red-800" title="Delete">
            <Trash2 className="h-4 w-4" />
            <small className="text-[10px] leading-3 mt-1">Delete</small>
          </button>
        </div>
      )
    },
  ], []);

  const mapped = rows.map(r => ({ ...r, actions: true }));

  return (
    <div className="min-h-screen w-full px-2 md:px-8 py-6 md:py-10 bg-gray-100">
      <ProTable
        title="Assigned Country Admins"
        rows={mapped}
        columns={columns}
        filters={{ searchKeys: ["name", "email", "country", "status"], dateKey: 'createdAt' }}
        pageSize={10}
        searchPlaceholder="Search name / email / country / status…"
      />

      {/* View Modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Country Admin Details">
        {viewing && (
          <div className="space-y-3">
            <div className="text-sm"><b>Name:</b> {viewing.name}</div>
            <div className="text-sm"><b>Email:</b> {viewing.email}</div>
            <div className="text-sm"><b>Status:</b> {viewing.status}</div>
            <div className="text-sm"><b>Country:</b> {viewing.country}</div>
            <div className="text-sm"><b>Features:</b></div>
            <div className="flex flex-wrap gap-1">
              {(viewing.features || []).map((f, i) => (<span key={i} className="inline-block rounded-lg px-2 py-1 bg-gray-100 text-gray-700 text-xs">{prettyFeatureLabel(f)}</span>))}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Country Admin">
        {editing && <EditCountryAdmin row={editing} onClose={() => { setEditing(null); fetchData(); }} />}
      </Modal>
    </div>
  );
}

function EditCountryAdmin({ row, onClose }) {
  const [state, setState] = useState({ name: row.name, status: row.status, country: row.country, features: row.features || [] });
  const BASE = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || "https://fxbrokersuite-back-crm-jack.onrender.com/api";
  const ALL = Object.keys(FEATURE_LABELS);
  async function save() {
    const token = localStorage.getItem('adminToken');
    const r = await fetch(`${BASE}/admin/country-admins/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(state) });
    const j = await r.json();
    if (!r.ok || j?.ok === false) return Swal.fire({ icon: 'error', title: 'Update failed', text: j?.error || 'Unable to save' });
    Swal.fire({ icon: 'success', title: 'Updated', timer: 1500, showConfirmButton: false });
    onClose();
  }
  return (
    <form onSubmit={e => { e.preventDefault(); save(); }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-600">Name</label>
          <input value={state.name} onChange={e => setState({ ...state, name: e.target.value })} className="mt-1 w-full rounded-md border border-gray-300 h-10 px-3" />
        </div>
        <div>
          <label className="text-xs text-gray-600">Status</label>
          <select value={state.status} onChange={e => setState({ ...state, status: e.target.value })} className="mt-1 w-full rounded-md border border-gray-300 h-10 px-3">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600">Country</label>
          <input value={state.country} onChange={e => setState({ ...state, country: e.target.value })} className="mt-1 w-full rounded-md border border-gray-300 h-10 px-3" />
        </div>
      </div>
      <div>
        <div className="text-xs text-gray-600 mb-2">Features</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-auto p-2 border rounded-md">
          {ALL.map((slug) => (
            <label key={slug} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={state.features.includes(slug)} onChange={e => {
                if (e.target.checked) setState(s => ({ ...s, features: [...s.features, slug] }));
                else setState(s => ({ ...s, features: s.features.filter(x => x !== slug) }));
              }} />
              <span>{prettyFeatureLabel(slug)}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 h-10 rounded-md border">Cancel</button>
        <button type="submit" className="px-4 h-10 rounded-md bg-blue-600 text-dark-base">Save Changes</button>
      </div>
    </form>
  );
}
