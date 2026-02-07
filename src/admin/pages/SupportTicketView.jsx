import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Headphones, Send, RotateCcw, CheckCircle2, UserPlus, ChevronDown, ArrowLeft, Clock } from 'lucide-react';
import supportService from '../../services/support.service';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal.jsx';

export default function SupportTicketView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { admin } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  
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

  const fetchData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const data = await supportService.getAdminTicket(id);
      if (data.success) {
        setTicket(data.data.ticket);
        // Only update replies if we got new data (avoid unnecessary re-renders)
        const newMessages = data.data.messages || [];
        setReplies(prevReplies => {
          // Check if we have new messages by comparing IDs
          const existingIds = new Set(prevReplies.map(r => r.id));
          const hasNewMessages = newMessages.some(m => !existingIds.has(m.id));
          
          if (hasNewMessages || prevReplies.length !== newMessages.length) {
            return newMessages;
          }
          return prevReplies; // No changes, keep existing
        });
        setSelectedRoleId(data.data.ticket.assigned_role_id || null);
      }
    } catch (error) {
      if (!silent) {
        console.error(error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load ticket' });
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const BASE = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || 'https://fxbrokersuite-back-crm-jack.onrender.com/api';
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

  useEffect(() => { 
    fetchData(); 
    fetchRoles(); // Always fetch roles for assignment
    
    // Auto-refresh messages every 3 seconds to get new replies from users
    const interval = setInterval(() => {
      fetchData(true); // Silent update - don't show loading spinner
    }, 3000); // Poll every 3 seconds
    
    return () => clearInterval(interval); // Cleanup on unmount
  }, [id]);

  const updateStatus = async (status) => {
    try {
      const res = await supportService.updateStatus(id, status);
      if (res.success) {
        Swal.fire({ icon: 'success', title: 'Updated', timer: 1000, showConfirmButton: false });
        fetchData();
      } else {
        throw new Error(res.error);
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Failed', text: 'Could not update status' });
    }
  };

  const sendReply = async () => {
    if (!message.trim() || sendingReply) return;
    
    setSendingReply(true);
    const messageToSend = message.trim();
    
    try {
      // Don't pass status - let backend keep it as 'open'
      const res = await supportService.adminReply(id, messageToSend, null);
      if (res.success) {
        // Add message to replies immediately (real-time update)
        const newReply = {
          id: Date.now(), // Temporary ID
          ticket_id: parseInt(id),
          sender_id: admin?.adminId,
          sender_type: 'admin',
          message: messageToSend,
          sender_name: admin?.username || 'Support Agent',
          created_at: new Date().toISOString()
        };
        setReplies([...replies, newReply]);
        setMessage('');
        
        // Refresh ticket data in background (silently)
        fetchData(true);
      } else {
        throw new Error(res.error);
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Failed', text: error.message || 'Could not send reply' });
    } finally {
      setSendingReply(false);
    }
  };

  const handleAssign = async () => {
    if (assigning) return;
    setAssigning(true);
    try {
      const res = await supportService.assignTicket(id, selectedRoleId);
      if (res.success) {
        Swal.fire({ icon: 'success', title: 'Success', text: 'Ticket assigned successfully', timer: 1500, showConfirmButton: false });
        setShowAssignModal(false);
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

  if (loading || !ticket) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              title="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Headphones className="h-6 w-6 text-blue-700" /> {ticket.subject || '(No subject)'}
            </h1>
          </div>
          <p className="text-gray-600 text-sm ml-[52px]">
            {ticket.user_name || ticket.user_email} • Created {new Date(ticket.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isSuperAdmin && (
            <div className="relative">
              <button 
                onClick={() => setShowAssignModal(true)}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4" /> Assign to Role
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          )}
          {String(ticket.status).toLowerCase() === 'closed' ? (
            <button onClick={() => updateStatus('open')} className="px-3 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2">
              <RotateCcw className="h-4 w-4" /> Reopen
            </button>
          ) : (
            <button onClick={() => updateStatus('closed')} className="px-3 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Close
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Conversation */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 border-b border-gray-200 font-semibold">Conversation</div>
          <div className="p-4 sm:p-6 space-y-4 max-h-[600px] overflow-y-auto">
            {replies.map((r, idx) => (
              <div key={idx} className={`p-3 rounded-lg border ${r.sender_type === 'admin' ? 'bg-brand-50 border-brand-100 ml-10' : 'bg-gray-50 border-gray-200 mr-10'}`}>
                <div className="text-xs text-gray-500 mb-1 flex justify-between">
                  <span className="font-bold">{r.sender_name || (r.sender_type === 'admin' ? 'Support Agent' : 'User')}</span>
                  <span>{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <div className="text-sm text-gray-800 whitespace-pre-wrap">{r.message}</div>
              </div>
            ))}
          </div>
          <div className="p-4 sm:p-6 border-t border-gray-200">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              disabled={sendingReply}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Write a reply..."
            />
            <div className="flex items-center justify-end mt-2">
              <button 
                onClick={sendReply} 
                disabled={sendingReply || !message.trim()}
                className="px-4 py-2 bg-blue-600 text-dark-base rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                {sendingReply ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-dark-base"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send Reply
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        {/* Details */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-fit">
          <div className="px-4 sm:px-6 py-3 border-b border-gray-200 font-semibold">Ticket Details</div>
          <div className="p-4 sm:p-6 space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Status</span>
              <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${ticket.status === 'open' ? 'bg-green-100 text-green-800' :
                ticket.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                  'bg-blue-100 text-blue-800'
                }`}>{ticket.status.toUpperCase()}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Priority</span>
              <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${ticket.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>{ticket.priority}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Category</span>
              <span className="font-medium text-gray-900">{ticket.category}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Assigned To</span>
              <div className="text-right">
                {ticket.assigned_to_username ? (
                  <div>
                    <span className="font-medium px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">
                      {ticket.assigned_to_username}
                    </span>
                    {ticket.assigned_role_name && (
                      <div className="text-xs text-gray-500 mt-1">Role: {ticket.assigned_role_name}</div>
                    )}
                  </div>
                ) : ticket.assigned_role_name ? (
                  <span className="font-medium px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                    {ticket.assigned_role_name}
                  </span>
                ) : (
                  <span className="font-medium px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500 italic">
                    Unassigned
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">User</span>
              <div className="text-right">
                <div className="font-medium">{ticket.user_name}</div>
                <div className="text-xs text-gray-500">{ticket.user_email}</div>
              </div>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Ticket ID</span>
              <span className="font-medium">#{ticket.id}</span>
            </div>
            {ticket.status === 'closed' && (
              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Time Taken
                </span>
                <span className="font-medium text-gray-900" title="Time taken to resolve the ticket">
                  {formatTimeTaken(ticket.time_taken_seconds)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign to Role Modal */}
      <Modal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning}
                className="px-4 py-2 bg-blue-600 text-dark-base rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {assigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </Modal>
    </div>
  );
}

