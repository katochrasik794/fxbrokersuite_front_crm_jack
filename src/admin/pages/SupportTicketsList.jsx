import { useEffect, useState, useMemo } from 'react';
import { Headphones, Eye, RefreshCw, UserPlus, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import supportService from '../../services/support.service';
import ProTable from '../components/ProTable.jsx';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/AuthContext';

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export default function SupportTicketsList({ status }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { admin } = useAuth();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [assigning, setAssigning] = useState(false);
  
  // Check if current admin is super admin
  // Check both 'role' and 'admin_role' for compatibility
  const adminRole = admin?.role || admin?.admin_role;
  // Super admin if: no role (null/undefined/empty string), or role is 'admin', 'superadmin', or 'super_admin'
  const isSuperAdmin = 
    !adminRole || 
    adminRole === '' || 
    adminRole === null || 
    adminRole === undefined ||
    adminRole === 'admin' || 
    adminRole === 'superadmin' ||
    adminRole === 'super_admin' ||
    admin?.isSuperAdmin === true;

  const fetchData = async () => {
    setLoading(true);
    try {
      // Map 'opened' to 'open' for API
      const apiStatus = status === 'opened' ? 'open' : status === 'closed' ? 'closed' : '';
      const data = await supportService.getAllTickets(apiStatus);
      if (data.success) {
        setItems(data.data || []);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
    fetchRoles(); // Always fetch roles for assignment
  }, [status]);

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const BASE = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${BASE}/admin/roles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data?.ok && data.roles) {
        setRoles(data.roles || []);
      } else {
        console.error('Failed to fetch roles:', data?.error || 'Unknown error');
        setRoles([]);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      setRoles([]);
    }
  };

  const handleAssignClick = (ticket) => {
    setSelectedTicket(ticket);
    setSelectedRoleId(ticket.assigned_role_id || null);
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (assigning || !selectedTicket) return;
    setAssigning(true);
    try {
      const res = await supportService.assignTicket(selectedTicket.id, selectedRoleId);
      if (res.success) {
        Swal.fire({ icon: 'success', title: 'Success', text: 'Ticket assigned successfully', timer: 1500, showConfirmButton: false });
        setShowAssignModal(false);
        setSelectedTicket(null);
        fetchData();
      } else {
        throw new Error(res.error || 'Failed to assign ticket');
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Failed', text: error.message || 'Could not assign ticket' });
    } finally {
      setAssigning(false);
    }
  };

  const titleMap = {
    opened: 'Open Tickets',
    closed: 'Closed Tickets',
  };

  // Format time taken (seconds to hours, minutes, seconds)
  const formatTimeTaken = (seconds) => {
    if (!seconds || seconds === null || seconds === undefined) return '-';
    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Transform items to ProTable format
  const rows = useMemo(() => {
    return items.map(t => ({
      id: t.id,
      ticketId: `#${t.id}`,
      subject: t.subject,
      category: t.category || '-',
      userName: t.user_name || 'Unknown',
      userEmail: t.user_email || '-',
      priority: t.priority || 'medium',
      status: t.status || 'open',
      updatedAt: t.updated_at,
      createdAt: t.created_at,
      timeTakenSeconds: t.time_taken_seconds || null,
      assignedRoleId: t.assigned_role_id || null,
      assignedRoleName: t.assigned_role_name || null,
      assignedTo: t.assigned_to || null,
      assignedToUsername: t.assigned_to_username || null,
      assignedToEmail: t.assigned_to_email || null,
    }));
  }, [items]);

  const columns = useMemo(() => [
    { key: "__index", label: "Sr No", sortable: false },
    { key: "ticketId", label: "ID", sortable: true },
    { 
      key: "subject", 
      label: "Subject",
      render: (v, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{v || '-'}</div>
          {row.category && row.category !== '-' && (
            <div className="text-xs text-gray-500">{row.category}</div>
          )}
        </div>
      )
    },
    { 
      key: "userName", 
      label: "User",
      render: (v, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{v}</div>
          <div className="text-xs text-gray-500">{row.userEmail}</div>
        </div>
      )
    },
    { 
      key: "priority", 
      label: "Priority",
      render: (v) => {
        const priority = (v || 'medium').toLowerCase();
        const tone = priority === 'high' ? 'red' : priority === 'medium' ? 'amber' : 'blue';
        return <Badge tone={tone}>{(v || 'medium').toUpperCase()}</Badge>;
      }
    },
    { 
      key: "status", 
      label: "Status",
      render: (v) => {
        const status = (v || 'open').toLowerCase();
        const tone = status === 'open' ? 'green' : status === 'closed' ? 'gray' : 'blue';
        return <Badge tone={tone}>{(v || 'open').toUpperCase()}</Badge>;
      }
    },
    { 
      key: "assignedRoleName", 
      label: "Assigned To",
      render: (v, row) => {
        // Show admin user if assigned, otherwise show role, otherwise unassigned
        if (row.assignedToUsername) {
          return (
            <div>
              <Badge tone="purple">{row.assignedToUsername}</Badge>
              {row.assignedRoleName && (
                <div className="text-xs text-gray-500 mt-1">Role: {row.assignedRoleName}</div>
              )}
            </div>
          );
        }
        if (row.assignedRoleName) {
          return <Badge tone="blue">{row.assignedRoleName}</Badge>;
        }
        return <span className="text-gray-400 italic">Unassigned</span>;
      }
    },
    ...(status === 'closed' ? [{
      key: "timeTakenSeconds",
      label: "Time Taken",
      render: (v, row) => {
        const timeStr = formatTimeTaken(v);
        return (
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-700" title="Time taken to resolve the ticket">
              {timeStr}
            </span>
          </div>
        );
      },
      sortable: true
    }] : []),
    { key: "updatedAt", label: "Updated", render: (v) => fmtDate(v), sortable: true },
    { 
      key: "actions", 
      label: "Actions", 
      sortable: false,
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => navigate(`/admin/support/tickets/${row.id}`)}
              className="h-8 w-8 grid place-items-center rounded-md border border-violet-200 text-violet-700 hover:bg-violet-50"
              title="View Ticket"
            >
              <Eye size={16} />
            </button>
            <span className="text-xs text-gray-500">View</span>
          </div>
          {isSuperAdmin && (
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleAssignClick({ id: row.id, assigned_role_id: row.assignedRoleId })}
                className="h-8 w-8 grid place-items-center rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50"
                title="Assign to Role"
              >
                <UserPlus size={16} />
              </button>
              <span className="text-xs text-gray-500">Assign</span>
            </div>
          )}
        </div>
      )
    },
  ], [navigate, isSuperAdmin]);

  const filters = useMemo(() => ({
    searchKeys: ['subject', 'userEmail', 'userName', 'ticketId', 'category'],
    selects: [
      {
        key: 'priority',
        label: 'All Priorities',
        options: ['high', 'medium', 'low']
      },
      {
        key: 'status',
        label: 'All Statuses',
        options: ['open', 'closed', 'pending']
      }
    ],
    dateKey: 'updatedAt'
  }), []);

  return (
    <div className="p-2 sm:p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Headphones className="h-6 w-6" /> {titleMap[status] || 'Tickets'}
          </h1>
          <p className="text-gray-600">Manage and respond to customer support tickets</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-dark-base rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-gray-500">Loading tickets...</div>
        </div>
      ) : (
        <ProTable
          title={titleMap[status] || 'Tickets'}
          rows={rows}
          columns={columns}
          filters={filters}
          pageSize={10}
          searchPlaceholder="Search subject, email, or ID"
        />
      )}

      {/* Assign to Role Modal */}
      <Modal
        open={showAssignModal && !!selectedTicket}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedTicket(null);
        }}
        title="Assign Ticket to Role"
      >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Role
              </label>
              <select
                value={selectedRoleId || ''}
                onChange={(e) => setSelectedRoleId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Unassigned (All admins can see)</option>
                {roles.length > 0 ? (
                  roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))
                ) : (
                  <option value="" disabled>No roles available. Please create roles first.</option>
                )}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedTicket(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning}
                className="px-4 py-2 bg-brand-500 text-dark-base rounded-lg hover:bg-brand-600 disabled:opacity-50"
              >
                {assigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </Modal>
    </div>
  );
}

