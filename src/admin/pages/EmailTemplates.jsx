// src/pages/admin/EmailTemplates.jsx
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Code2,
  Eye,
  Save,
  Trash2,
  Star,
  Plus,
  Edit,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  FileCode,
  Sparkles
} from "lucide-react";

const AVAILABLE_VARIABLES = [
  { name: 'content', description: 'Email body content' },
  { name: 'subject', description: 'Email subject' },
  { name: 'logoUrl', description: 'Company logo URL' },
  { name: 'companyName', description: 'Solitaire Markets Limited' },
  { name: 'companyEmail', description: 'Company email address' },
  { name: 'companyPhone', description: 'Company phone number' },
  { name: 'imageUrl', description: 'Optional footer image URL' },
  { name: 'currentYear', description: 'Current year' },
  { name: 'recipientName', description: 'Recipient\'s name' },
  { name: 'recipientEmail', description: 'Recipient\'s email' },
];

export default function EmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [htmlCode, setHtmlCode] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isNewTemplate, setIsNewTemplate] = useState(true);
  const [copiedVariable, setCopiedVariable] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const BASE = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:5000/api";

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Load preview when HTML code changes
  useEffect(() => {
    if (htmlCode) {
      const timeoutId = setTimeout(() => {
        updatePreview();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [htmlCode]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        Swal.fire({
          icon: 'error',
          title: 'Authentication Required',
          text: 'Please log in again to access email templates.',
          confirmButtonText: 'Go to Login',
        }).then(() => {
          window.location.href = '/admin/login';
        });
        return;
      }
      
      const response = await axios.get(`${BASE}/admin/email-templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.ok) {
        setTemplates(response.data.templates || []);
      } else {
        throw new Error(response.data.error || response.data.message || 'Failed to load templates');
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      
      // Handle 401 specifically - token expired or invalid
      if (error.response?.status === 401) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Authentication failed';
        Swal.fire({
          icon: 'warning',
          title: 'Session Expired',
          text: errorMsg === 'Token has expired' || errorMsg.includes('expired') 
            ? 'Your session has expired. Please log in again.'
            : errorMsg,
          confirmButtonText: 'Log In Again',
        }).then(() => {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminInfo');
          window.location.href = '/admin/login';
        });
        return;
      }
      
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to load templates';
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Templates',
        html: `
          <p>${errorMessage}</p>
          ${error.response?.data?.details ? `<pre style="text-align: left; font-size: 11px; max-height: 200px; overflow: auto; background: #f5f5f5; padding: 10px; border-radius: 4px; margin-top: 10px;">${error.response.data.details}</pre>` : ''}
        `,
        width: '600px'
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreview = async () => {
    if (!htmlCode.trim()) {
      setPreviewHtml('');
      return;
    }

    try {
      setPreviewLoading(true);
      const response = await axios.post(
        `${BASE}/admin/email-templates/preview`,
        { html_code: htmlCode },
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      if (response.data.ok) {
        setPreviewHtml(response.data.preview_html);
      }
    } catch (error) {
      console.error('Failed to preview template:', error);
      setPreviewHtml('<p style="color: red;">Error generating preview</p>');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleNewTemplate = () => {
    setSelectedTemplate(null);
    setHtmlCode('');
    setTemplateName('');
    setTemplateDescription('');
    setFromEmail('');
    setPreviewHtml('');
    setIsNewTemplate(true);
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setHtmlCode(template.html_code || '');
    setTemplateName(template.name || '');
    setTemplateDescription(template.description || '');
    setFromEmail(template.from_email || '');
    setIsNewTemplate(false);
    updatePreview();
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Template name is required',
      });
      return;
    }

    if (!htmlCode.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'HTML code is required',
      });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: templateName,
        description: templateDescription,
        html_code: htmlCode,
        from_email: fromEmail.trim() || null,
        variables: AVAILABLE_VARIABLES.map(v => v.name),
      };

      let response;
      if (isNewTemplate) {
        response = await axios.post(
          `${BASE}/admin/email-templates`,
          payload,
          { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
        );
      } else {
        response = await axios.put(
          `${BASE}/admin/email-templates/${selectedTemplate.id}`,
          payload,
          { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
        );
      }

      if (response.data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: isNewTemplate ? 'Template created successfully' : 'Template updated successfully',
        });
        await loadTemplates();
        if (isNewTemplate) {
          handleNewTemplate();
        } else {
          handleSelectTemplate(response.data.template);
        }
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to save template',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (template) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Template?',
      text: `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(
          `${BASE}/admin/email-templates/${template.id}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
        );
        Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'Template deleted successfully',
        });
        if (selectedTemplate?.id === template.id) {
          handleNewTemplate();
        }
        await loadTemplates();
      } catch (error) {
        console.error('Failed to delete template:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.error || 'Failed to delete template',
        });
      }
    }
  };

  const handleSetDefault = async (template) => {
    try {
      await axios.post(
        `${BASE}/admin/email-templates/${template.id}/set-default`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Template set as default',
      });
      await loadTemplates();
    } catch (error) {
      console.error('Failed to set default template:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to set default template',
      });
    }
  };

  const copyVariable = (variable) => {
    const varText = `{{${variable}}}`;
    navigator.clipboard.writeText(varText);
    setCopiedVariable(variable);
    setTimeout(() => setCopiedVariable(null), 2000);
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-neutral-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-[1920px] mx-auto h-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-brand-500 rounded-lg">
              <FileCode className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Email Templates
            </h1>
          </div>
          <p className="text-gray-600">Create and manage custom email templates with variable support</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Code Editor */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
            <div className="bg-brand-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Code2 className="w-5 h-5" />
                <span className="font-semibold">Template Code</span>
              </div>
              <button
                onClick={handleNewTemplate}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New
              </button>
            </div>

            <div className="p-4 border-b border-gray-200 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Welcome Email Template"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Brief description of this template"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Email (SMTP)</label>
                <input
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="e.g., noreply@solitaire.com or leave empty for default"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Email address to send from when using this template. Leave empty to use default SMTP settings.</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-600">HTML Code</span>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <AlertCircle className="w-4 h-4" />
                  <span>Use variables like {'{{content}}'}, {'{{subject}}'}, etc.</span>
                </div>
              </div>
              <textarea
                value={htmlCode}
                onChange={(e) => setHtmlCode(e.target.value)}
                placeholder="Enter your HTML template code here...&#10;&#10;Example:&#10;&lt;html&gt;&#10;  &lt;body&gt;&#10;    &lt;h1&gt;{{subject}}&lt;/h1&gt;&#10;    &lt;div&gt;{{content}}&lt;/div&gt;&#10;  &lt;/body&gt;&#10;&lt;/html&gt;"
                className="flex-1 w-full p-4 font-mono text-sm border-0 focus:ring-0 resize-none outline-none"
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleSave}
                disabled={saving || !templateName.trim() || !htmlCode.trim()}
                className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isNewTemplate ? 'Create Template' : 'Update Template'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Eye className="w-5 h-5" />
                <span className="font-semibold">Live Preview</span>
              </div>
              {previewLoading && (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              )}
            </div>

            <div className="flex-1 overflow-auto p-4 bg-gray-50">
              {previewHtml ? (
                <div
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                  className="bg-white rounded-lg shadow-sm p-4"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Preview will appear here</p>
                    <p className="text-sm mt-1">Start typing HTML code to see the preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Template List */}
        <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-brand-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Saved Templates</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white placeholder-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No templates found</p>
            </div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedTemplate?.id === template.id
                      ? 'border-brand-500 bg-brand-50 shadow-md'
                      : 'border-gray-200 hover:border-brand-300 hover:shadow-sm'
                      }`}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          {template.is_default && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              Default
                            </span>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefault(template);
                        }}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center gap-1"
                        title="Set as default"
                      >
                        <Star className={`w-3 h-3 ${template.is_default ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(template);
                        }}
                        className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded flex items-center gap-1"
                        title="Delete template"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <span className="text-xs text-gray-500 ml-auto">
                        {new Date(template.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Variable Helper */}
        <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-brand-500" />
            Available Variables
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
            {AVAILABLE_VARIABLES.map((variable) => (
              <button
                key={variable.name}
                onClick={() => copyVariable(variable.name)}
                className="p-3 border border-gray-200 rounded-lg hover:border-brand-300 hover:bg-brand-50 transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-1">
                  <code className="text-sm font-mono text-brand-600">{`{{${variable.name}}}`}</code>
                  {copiedVariable === variable.name ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400 group-hover:text-brand-500" />
                  )}
                </div>
                <p className="text-xs text-gray-600">{variable.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

