// src/admin/pages/TemplateAssignments.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Link2,
  Loader2,
  CheckCircle2,
  XCircle,
  Mail,
  AlertCircle,
  Save,
  RefreshCw
} from "lucide-react";

export default function TemplateAssignments() {
  const [actions, setActions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [assignments, setAssignments] = useState({});

  const BASE = import.meta.env.VITE_BACKEND_API_URL || "https://fxbrokersuite-back-crm-jack.onrender.com/api";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        Swal.fire({
          icon: 'error',
          title: 'Authentication Required',
          text: 'Please log in again.',
        }).then(() => {
          window.location.href = '/admin/login';
        });
        return;
      }

      // Load actions and current assignments
      const [actionsRes, templatesRes] = await Promise.all([
        axios.get(`${BASE}/admin/email-templates/actions`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${BASE}/admin/email-templates`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (actionsRes.data.ok) {
        setActions(actionsRes.data.actions || []);
        // Build assignments map using action id
        const assignMap = {};
        actionsRes.data.actions.forEach(action => {
          if (action.template_id) {
            assignMap[action.id] = action.template_id;
          }
        });
        setAssignments(assignMap);
      }

      if (templatesRes.data.ok) {
        setTemplates(templatesRes.data.templates || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to load template assignments',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (actionId, templateId) => {
    try {
      setSaving(prev => ({ ...prev, [actionId]: true }));
      const token = localStorage.getItem('adminToken');

      await axios.put(
        `${BASE}/admin/email-templates/assign-action`,
        {
          action_id: actionId,
          template_id: templateId || null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update local state
      setAssignments(prev => {
        const newAssignments = { ...prev };
        if (templateId) {
          newAssignments[actionId] = templateId;
        } else {
          delete newAssignments[actionId];
        }
        return newAssignments;
      });

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: templateId ? 'Template assigned successfully' : 'Template unassigned successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Failed to assign template:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || error.response?.data?.message || 'Failed to assign template',
      });
    } finally {
      setSaving(prev => ({ ...prev, [actionId]: false }));
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'User Management': 'bg-blue-100 text-blue-800',
      'Trading Accounts': 'bg-green-100 text-green-800',
      'Transactions': 'bg-purple-100 text-purple-800',
      'Security': 'bg-red-100 text-red-800',
      'Compliance': 'bg-yellow-100 text-yellow-800',
      'Support': 'bg-indigo-100 text-indigo-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Group actions by system_type (since we don't have category anymore)
  const groupedActions = actions.reduce((acc, action) => {
    const category = action.system_type || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(action);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-neutral-50 p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading template assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-neutral-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Link2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Template Assignments
                </h1>
                <p className="text-gray-600 mt-1">
                  Assign email templates to specific CRM actions
                </p>
              </div>
            </div>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 font-medium mb-1">
                How Template Assignments Work
              </p>
              <p className="text-sm text-blue-800">
                When a CRM action occurs (e.g., account creation, deposit request), the system will automatically use the assigned template to send the email. 
                If no template is assigned, it will fall back to templates with matching names. 
                You can create new templates in the <a href="/admin/email-templates" className="underline font-semibold">Email Templates</a> page.
              </p>
            </div>
          </div>
        </div>

        {/* Actions by Category */}
        {Object.keys(groupedActions).map(category => (
          <div key={category} className="mb-6 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-brand-500 to-brand-600 p-4">
              <h2 className="text-xl font-semibold text-white">{category}</h2>
            </div>
            <div className="p-4 space-y-4">
              {groupedActions[category].map(action => {
                const assignedTemplateId = assignments[action.id];
                const assignedTemplate = templates.find(t => t.id === assignedTemplateId);

                return (
                  <div
                    key={action.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-brand-300 transition-colors overflow-hidden"
                  >
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <h3 className="font-semibold text-gray-900 break-words">{action.action_name}</h3>
                          {assignedTemplate && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center gap-1 flex-shrink-0">
                              <CheckCircle2 className="w-3 h-3" />
                              Assigned
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 font-mono break-words">
                          System: <span className="font-semibold">{action.system_type}</span>
                          {action.assigned_template_name && (
                            <> • Template: <span className="font-semibold">{action.assigned_template_name}</span></>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                      <select
                        value={assignedTemplateId || ''}
                        onChange={(e) => {
                          const newTemplateId = e.target.value ? parseInt(e.target.value) : null;
                          handleAssign(action.id, newTemplateId);
                        }}
                        disabled={saving[action.id]}
                        className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Select Template (or leave unassigned) --</option>
                        {templates.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                            {template.description ? ` - ${template.description}` : ''}
                          </option>
                        ))}
                      </select>

                      {assignedTemplate && (
                        <button
                          onClick={() => handleAssign(action.id, null)}
                          disabled={saving[action.id]}
                          className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors flex-shrink-0 whitespace-nowrap"
                        >
                          {saving[action.id] ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              Unassign
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {assignedTemplate && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-900">
                          <span className="font-semibold">Currently Assigned:</span> {assignedTemplate.name}
                        </p>
                        {assignedTemplate.description && (
                          <p className="text-xs text-green-700 mt-1">{assignedTemplate.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {actions.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
            <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No actions available</p>
          </div>
        )}
      </div>
    </div>
  );
}


