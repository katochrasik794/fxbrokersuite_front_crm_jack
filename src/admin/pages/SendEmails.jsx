// src/pages/admin/SendEmails.jsx
import { useState, useCallback, useRef, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Mail, Users, Search, Eye, Send, Loader2, Inbox, FileText, Star, MoreVertical, Settings, Plus, X, Sparkles } from "lucide-react";
import RichTextEditor from "../components/RichTextEditor.jsx";

const RECIPIENT_TYPES = [
  { value: 'all', label: 'All Users', icon: Users, gradient: 'from-blue-500 to-cyan-500' },
  { value: 'verified', label: 'Verified Users', icon: Mail, gradient: 'from-green-500 to-emerald-500' },
  { value: 'unverified', label: 'Unverified Users', icon: Mail, gradient: 'from-yellow-500 to-orange-500' },
  { value: 'active', label: 'Active Users', icon: Users, gradient: 'from-brand-500 to-brand-600' },
  { value: 'banned', label: 'Banned Users', icon: Users, gradient: 'from-red-500 to-rose-500' },
  { value: 'inactive', label: 'Inactive Users', icon: Users, gradient: 'from-gray-500 to-slate-500' },
  { value: 'kyc_verified', label: 'KYC Verified Users', icon: Mail, gradient: 'from-blue-500 to-cyan-500' },
  { value: 'kyc_unverified', label: 'KYC Unverified Users', icon: Mail, gradient: 'from-amber-500 to-yellow-500' },
  { value: 'specific', label: 'Select Specific Users', icon: Search, gradient: 'from-neutral-600 to-neutral-800' },
  { value: 'zero_balance', label: 'User with 0 Balance', icon: Users, gradient: 'from-orange-500 to-red-500' },
  { value: 'no_account', label: 'User with No Account', icon: Users, gradient: 'from-purple-500 to-pink-500' },
];

export default function SendEmails() {
  const [activeTab, setActiveTab] = useState('compose'); // 'compose', 'sent'
  const [recipientType, setRecipientType] = useState('all');
  const [specificUsers, setSpecificUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sentEmails, setSentEmails] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [selectedSentEmail, setSelectedSentEmail] = useState(null);
  const [showSentDetails, setShowSentDetails] = useState(false);
  const [sentFilter, setSentFilter] = useState('all'); // 'all' | 'successful' | 'failed'
  const recipientsListRef = useRef(null);
  const [recipientListFilter, setRecipientListFilter] = useState('all'); // 'all' | 'success' | 'failed'
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateVariables, setTemplateVariables] = useState({});
  const [availableVariables, setAvailableVariables] = useState([]);

  const BASE = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:5000/api";

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        console.warn('No admin token found');
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
        if (errorMsg.includes('expired') || errorMsg.includes('Token')) {
          Swal.fire({
            icon: 'warning',
            title: 'Session Expired',
            text: 'Your session has expired. Please refresh the page and log in again.',
            confirmButtonText: 'OK'
          });
        }
        return;
      }
      
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to load templates';
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Templates',
        text: errorMessage
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadTemplateContent = async (templateId, currentVariables = {}) => {
    try {
      const token = localStorage.getItem('adminToken');

      // Get the template details
      const templateResponse = await axios.get(`${BASE}/admin/email-templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (templateResponse.data.ok && templateResponse.data.template) {
        const template = templateResponse.data.template;
        const htmlCode = template.html_code || '';

        // Set available variables for inputs (excluding auto-filled ones)
        const vars = template.variables || [];
        const autoFilled = ['logoUrl', 'companyEmail', 'currentYear', 'recipientName', 'recipientEmail'];
        const manualVars = vars.filter(v => !autoFilled.includes(v));
        setAvailableVariables(manualVars);

        // Extract subject from HTML
        let extractedSubject = '';
        const titleMatch = htmlCode.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          extractedSubject = titleMatch[1].trim();
          extractedSubject = extractedSubject.replace(/\{\{subject\}\}/gi, '').trim();
        }
        if (!extractedSubject) {
          extractedSubject = template.name || 'Email Subject';
        }

        // Get the PREVIEW (rendered HTML with variables)
        const previewResponse = await axios.post(
          `${BASE}/admin/email-templates/preview`,
          {
            html_code: htmlCode,
            variables: currentVariables
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (previewResponse.data.ok && previewResponse.data.preview_html) {
          console.log('✅ Preview loaded successfully');
          setSubject(extractedSubject);
          setBody(previewResponse.data.preview_html);
        } else {
          console.warn('⚠️ Preview failed or returned empty HTML, falling back to raw code', previewResponse.data);
          setSubject(extractedSubject);
          setBody(htmlCode);
        }
      }
    } catch (error) {
      console.error('Failed to load template content:', error);
    }
  };

  const handleTemplateChange = async (e) => {
    const templateId = e.target.value ? Number(e.target.value) : null;
    setSelectedTemplateId(templateId);
    setTemplateVariables({}); // Reset variables

    if (templateId) {
      await loadTemplateContent(templateId, {});
    } else {
      setSubject('');
      setBody('');
      setAvailableVariables([]);
    }
  };

  const handleVariableChange = async (key, value) => {
    const newVariables = { ...templateVariables, [key]: value };
    setTemplateVariables(newVariables);

    // Debounce preview update
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      if (selectedTemplateId) {
        loadTemplateContent(selectedTemplateId, newVariables);
      }
    }, 500);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load sent emails and drafts from localStorage
  useEffect(() => {
    const savedSent = localStorage.getItem('admin_sent_emails');
    const savedDrafts = localStorage.getItem('admin_email_drafts');
    if (savedSent) {
      try {
        setSentEmails(JSON.parse(savedSent));
      } catch (e) {
        console.error('Failed to load sent emails:', e);
      }
    }
    if (savedDrafts) {
      try {
        setDrafts(JSON.parse(savedDrafts));
      } catch (e) {
        console.error('Failed to load drafts:', e);
      }
    }
  }, []);

  // Search users for specific selection
  const searchUsers = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${BASE}/admin/send-emails/search-users`, {
        params: { q: query, limit: 20 },
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data?.ok) {
        setSearchResults(response.data.users || []);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Search users failed:', error);
      setSearchResults([]);
    }
  }, [BASE]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (userSearchQuery) {
        searchUsers(userSearchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [userSearchQuery, searchUsers]);

  const handleAddUser = (user) => {
    if (!specificUsers.find(u => u.id === user.id)) {
      setSpecificUsers([...specificUsers, user]);
    }
    setUserSearchQuery('');
    setShowSearchResults(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleRemoveUser = (userId) => {
    setSpecificUsers(specificUsers.filter(u => u.id !== userId));
  };

  const handleSaveDraft = () => {
    if (!subject.trim() && !body.trim()) {
      Swal.fire({ icon: 'warning', title: 'Nothing to save', text: 'Please enter subject or body' });
      return;
    }

    const draft = {
      id: Date.now().toString(),
      recipientType,
      specificUsers,
      subject,
      body,
      imageUrl,
      createdAt: new Date().toISOString(),
    };

    const updatedDrafts = [draft, ...drafts.filter(d => d.id !== draft.id)];
    setDrafts(updatedDrafts);
    localStorage.setItem('admin_email_drafts', JSON.stringify(updatedDrafts));
    Swal.fire({ icon: 'success', title: 'Draft saved', timer: 1500, showConfirmButton: false });
  };

  const handleLoadDraft = (draft) => {
    setRecipientType(draft.recipientType);
    setSpecificUsers(draft.specificUsers || []);
    setSubject(draft.subject || '');
    setBody(draft.body || '');
    setImageUrl(draft.imageUrl || '');
    setActiveTab('compose');
    Swal.fire({ icon: 'success', title: 'Draft loaded', timer: 1500, showConfirmButton: false });
  };

  const handleDeleteDraft = (draftId) => {
    const updatedDrafts = drafts.filter(d => d.id !== draftId);
    setDrafts(updatedDrafts);
    localStorage.setItem('admin_email_drafts', JSON.stringify(updatedDrafts));
  };

  const handlePreview = useCallback(async () => {
    if (!recipientType) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Please select a recipient type' });
      return;
    }

    if (recipientType === 'specific' && specificUsers.length === 0) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Please select at least one user' });
      return;
    }

    try {
      setLoadingPreview(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${BASE}/admin/send-emails/preview`,
        {
          recipientType,
          specificUsers: specificUsers.map(u => u.id),
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data?.ok) {
        setPreviewData(response.data);
        setShowPreview(true);
      } else {
        throw new Error(response.data?.error || 'Failed to preview');
      }
    } catch (error) {
      console.error('Preview failed:', error);
      Swal.fire({
        icon: 'error',
        title: 'Preview Failed',
        text: error.response?.data?.error || error.message || 'Failed to preview recipients'
      });
    } finally {
      setLoadingPreview(false);
    }
  }, [BASE, recipientType, specificUsers]);

  const handleSend = useCallback(async () => {
    // If template is selected, subject and body are not required
    if (!selectedTemplateId) {
      if (!subject.trim()) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Please enter a subject' });
        return;
      }

      if (!body.trim()) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Please enter email body' });
        return;
      }
    }

    if (!recipientType) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Please select a recipient type' });
      return;
    }

    if (recipientType === 'specific' && specificUsers.length === 0) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Please select at least one user' });
      return;
    }

    // Figure out how many recipients we’re about to hit.
    // For "specific", we already know the count from the selected users.
    // For other types, we call the preview endpoint (if we don't already have data)
    // so the confirmation dialog always shows a real number instead of "N/A".
    let recipientCount =
      recipientType === 'specific'
        ? specificUsers.length
        : (previewData?.count ?? null);

    if (recipientType !== 'specific' && recipientCount == null) {
      try {
        const token = localStorage.getItem('adminToken');
        const previewResponse = await axios.post(
          `${BASE}/admin/send-emails/preview`,
          {
            recipientType,
            specificUsers: specificUsers.map((u) => u.id),
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (previewResponse.data?.ok) {
          recipientCount = previewResponse.data.count ?? null;
          // Cache for later so the main Preview button also sees it
          setPreviewData(previewResponse.data);
        }
      } catch (e) {
        console.error('Auto-preview before send failed:', e);
      }
    }

    const displayRecipientCount =
      recipientCount != null ? recipientCount : 'N/A';

    // Confirm before sending
    const result = await Swal.fire({
      title: 'Send Emails?',
      html: `
        <p>Are you sure you want to send this email?</p>
        <p><strong>Recipients:</strong> ${displayRecipientCount} users</p>
        <p><strong>Subject:</strong> ${subject}</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Send',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#667eea',
    });

    if (!result.isConfirmed) return;

    try {
      setSending(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${BASE}/admin/send-emails`,
        {
          recipientType,
          // Pass only the identifiers the backend needs. It now supports
          // an array of IDs, emails, or full user objects, but to keep it
          // simple we send IDs.
          specificUsers: specificUsers.map((u) => u.id),
          // When template is selected, don't send body (backend will use template directly)
          // Only send body if no template is selected
          subject: selectedTemplateId ? '' : subject.trim(),
          body: selectedTemplateId ? '' : body.trim(),
          isHtml: true,
          imageUrl: imageUrl.trim() || undefined,
          templateId: selectedTemplateId || null,
          templateVariables: selectedTemplateId ? templateVariables : {},
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data?.ok) {
        // Save to sent emails
        const sentEmail = {
          id: Date.now().toString(),
          recipientType,
          recipientCount: response.data.recipientsCount,
          successCount: response.data.successCount,
          failureCount: response.data.failureCount,
          subject,
          body,
          imageUrl,
          sentAt: new Date().toISOString(),
          results: Array.isArray(response.data.results) ? response.data.results : [],
        };
        const updatedSent = [sentEmail, ...sentEmails];
        setSentEmails(updatedSent);
        localStorage.setItem('admin_sent_emails', JSON.stringify(updatedSent));

        Swal.fire({
          icon: 'success',
          title: 'Emails Sent!',
          html: `
            <p><strong>Total:</strong> ${response.data.recipientsCount} recipients</p>
            <p><strong>Successful:</strong> ${response.data.successCount}</p>
            <p><strong>Failed:</strong> ${response.data.failureCount}</p>
          `,
          confirmButtonText: 'OK'
        });

        // Reset form
        setSubject('');
        setBody('');
        setImageUrl('');
        setSpecificUsers([]);
        setPreviewData(null);
        setShowPreview(false);
        setActiveTab('sent');
      } else {
        throw new Error(response.data?.error || 'Failed to send emails');
      }
    } catch (error) {
      console.error('Send failed:', error);
      Swal.fire({
        icon: 'error',
        title: 'Send Failed',
        text: error.response?.data?.error || error.message || 'Failed to send emails'
      });
    } finally {
      setSending(false);
    }
  }, [BASE, recipientType, specificUsers, subject, body, imageUrl, previewData, sentEmails]);

  function fmtDate(v) {
    if (!v) return "-";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "-";
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] w-full bg-gradient-to-br from-gray-50 via-white to-brand-50 rounded-xl overflow-hidden border border-gray-200 shadow-xl">
      {/* Left Sidebar */}
      <div className="w-64 md:w-72 lg:w-80 flex-shrink-0 bg-gradient-to-b from-gray-800 via-gray-900 to-black text-white flex flex-col relative overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-brand-500/10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-gray-700">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-xl blur-lg" />
                <div className="relative bg-gradient-to-br from-white/30 to-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/20">
                  <img
                    src="/favicon-32x32.png"
                    alt="fxbrokersuite"
                    className="h-8 w-8 rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden items-center justify-center h-8 w-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg text-white font-bold text-lg">
                    Z
                  </div>
                </div>
              </div>
              <div className="hidden sm:block">
                <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  fxbrokersuite Mail
                </h2>
                <p className="text-xs text-white/70 mt-0.5">Professional Email Suite</p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveTab('compose');
                setSubject('');
                setBody('');
                setImageUrl('');
                setSpecificUsers([]);
                setPreviewData(null);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 backdrop-blur-sm border border-white/20 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              <Plus size={20} />
              <span>New message</span>
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-2 md:p-3">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('compose')}
                className={`w-full flex items-center justify-between px-3 md:px-4 py-2 md:py-3 rounded-xl transition-all ${activeTab === 'compose'
                  ? 'bg-white/20 backdrop-blur-sm shadow-lg border border-white/20'
                  : 'hover:bg-white/10'
                  }`}
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <Inbox size={18} />
                  <span className="text-xs md:text-sm font-medium">Compose</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`w-full flex items-center justify-between px-3 md:px-4 py-2 md:py-3 rounded-xl transition-all ${activeTab === 'sent'
                  ? 'bg-white/20 backdrop-blur-sm shadow-lg border border-white/20'
                  : 'hover:bg-white/10'
                  }`}
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <Send size={18} />
                  <span className="text-xs md:text-sm font-medium">Sent</span>
                </div>
                {sentEmails.length > 0 && (
                  <span className="text-xs bg-white/30 backdrop-blur-sm px-2 md:px-2.5 py-0.5 md:py-1 rounded-full font-semibold">
                    {sentEmails.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-2 text-white/70 text-xs">
              <Sparkles size={14} />
              <span>Powered by fxbrokersuite</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white/80 backdrop-blur-sm">
        {/* Top Bar with Search */}
        <div className="border-b border-gray-200/50 bg-white/50 backdrop-blur-sm p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 md:py-2.5 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-sm text-sm md:text-base"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'compose' && (
            <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full">
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className="h-1 w-8 md:w-12 bg-gradient-to-r from-brand-500 to-brand-600 rounded-full" />
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                  Compose Email
                </h1>
              </div>

              {/* Recipient Selection */}
              <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-4 md:p-6 border border-gray-200/50 shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-3 md:mb-4">Select Recipients</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
                  {RECIPIENT_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isActive = recipientType === type.value;
                    return (
                      <button
                        key={type.value}
                        onClick={() => {
                          setRecipientType(type.value);
                          if (type.value !== 'specific') {
                            setSpecificUsers([]);
                          }
                          setPreviewData(null);
                          setShowPreview(false);
                        }}
                        className={`group relative flex flex-col items-center gap-1 md:gap-2 px-2 md:px-4 py-3 md:py-4 rounded-lg md:rounded-xl border-2 transition-all overflow-hidden ${isActive
                          ? `border-transparent bg-gradient-to-br ${type.gradient} text-white shadow-lg scale-105`
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md text-gray-700'
                          }`}
                      >
                        {isActive && (
                          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                        )}
                        <div className={`relative ${isActive ? 'text-white' : `text-gray-600 group-hover:text-blue-700`}`}>
                          <Icon size={16} className="md:w-5 md:h-5" />
                        </div>
                        <span className={`text-[10px] md:text-xs font-medium relative text-center ${isActive ? 'text-white' : 'text-gray-700'}`}>
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2 px-1">
                  * Select <strong>Specific User(s)</strong> to search and add individual recipients.
                </p>

                {/* Specific User Selection */}
                {recipientType === 'specific' && (
                  <div className="mt-6 space-y-3">
                    <div className="relative" ref={searchContainerRef}>
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        onFocus={() => {
                          if (searchResults.length > 0) setShowSearchResults(true);
                        }}
                        placeholder="Search users by email or name..."
                        className="w-full rounded-xl border border-gray-300 h-12 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white shadow-sm"
                      />
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />

                      {/* Search Results Dropdown */}
                      {showSearchResults && searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                          {searchResults.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => handleAddUser(user)}
                              className="w-full text-left px-4 py-3 hover:bg-brand-50 border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                              <div className="font-medium text-gray-900">{user.email}</div>
                              {user.name && <div className="text-sm text-gray-500">{user.name}</div>}
                              <div className="text-xs text-gray-400 mt-1">
                                {user.emailVerified ? '✓ Verified' : '✗ Unverified'} • {user.status}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {showSearchResults && userSearchQuery.length >= 2 && searchResults.length === 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-center text-gray-500 text-sm">
                          No users found
                        </div>
                      )}
                    </div>

                    {/* Selected Users */}
                    {specificUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {specificUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center gap-2 px-3 py-2 bg-brand-100 text-brand-900 rounded-full text-sm font-medium shadow-sm"
                          >
                            <span>{user.email}</span>
                            <button
                              onClick={() => handleRemoveUser(user.id)}
                              className="hover:text-brand-900 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Email Composition */}
              <div className="space-y-4 md:space-y-6 bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-4 md:p-6 border border-gray-200/50 shadow-sm">
                {/* Email Template Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Template
                    <span className="text-xs text-gray-500 ml-2">(Optional - uses default if not selected)</span>
                  </label>
                  <select
                    value={selectedTemplateId || ''}
                    onChange={handleTemplateChange}
                    className="w-full rounded-xl border border-gray-300 h-10 md:h-12 px-3 md:px-4 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white shadow-sm text-sm md:text-base"
                    disabled={loadingTemplates}
                  >
                    <option value="">Use Default Template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} {template.is_default && '(Default)'}
                      </option>
                    ))}
                  </select>
                  {loadingTemplates && (
                    <p className="text-xs text-gray-500 mt-1">Loading templates...</p>
                  )}
                </div>

                {/* Template Variables Inputs */}
                {selectedTemplateId && availableVariables.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Settings size={14} />
                      Template Variables
                    </h3>
                    <p className="text-xs text-gray-500">
                      Fill in the values below to update the email preview.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.isArray(availableVariables) && availableVariables.map(variable => (
                        <div key={variable}>
                          <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">
                            {variable.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          <input
                            type="text"
                            value={templateVariables[variable] || ''}
                            onChange={(e) => handleVariableChange(variable, e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                            placeholder={`Enter ${variable}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subject Field - Always visible, shows template subject when template is selected */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject {!selectedTemplateId && '*'}
                    {selectedTemplateId && <span className="text-xs text-gray-500 ml-2">(from template)</span>}
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject"
                    className="w-full rounded-xl border border-gray-300 h-10 md:h-12 px-3 md:px-4 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white shadow-sm text-sm md:text-base"
                    readOnly={!!selectedTemplateId}
                  />
                </div>

                {/* Email Body Field - Shows RichTextEditor for custom emails, or preview for templates */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Body {!selectedTemplateId && '*'}
                    {selectedTemplateId && <span className="text-xs text-gray-500 ml-2">(from template - preview)</span>}
                  </label>

                  {selectedTemplateId ? (
                    // Show HTML preview when template is selected (same as Email Templates page)
                    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 flex items-center gap-2">
                        <span className="text-white font-semibold text-sm">Template Preview</span>
                      </div>
                      <div className="p-4 bg-gray-50 min-h-[400px] max-h-[600px] overflow-y-auto">
                        {body ? (
                          <div
                            dangerouslySetInnerHTML={{ __html: body }}
                            className="bg-white rounded-lg shadow-sm"
                            style={{
                              maxWidth: '100%',
                              margin: '0 auto'
                            }}
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                              <p>Loading template preview...</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-blue-600 p-3 bg-blue-50 border-t border-blue-200 flex items-center gap-1">
                        <span>ℹ️</span>
                        <span>This is the preview of the selected template. The template will be used when sending emails.</span>
                      </p>
                    </div>
                  ) : (
                    // Show RichTextEditor for custom email composition
                    <>
                      <RichTextEditor
                        value={body}
                        onChange={setBody}
                        placeholder="Start typing your email content... You can paste images directly!"
                      />
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <span>💡</span>
                        <span>Tip: You can paste images directly from your clipboard or drag & drop them into the editor!</span>
                      </p>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Footer Image URL (Optional)</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full rounded-xl border border-gray-300 h-12 px-4 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white shadow-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">Image will be displayed at the bottom of the email</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <button
                  onClick={handleSaveDraft}
                  className="px-4 md:px-6 py-2 md:py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-50 font-medium transition-all shadow-sm hover:shadow-md text-sm md:text-base"
                >
                  Save Draft
                </button>
                <button
                  onClick={handlePreview}
                  disabled={loadingPreview || sending}
                  className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-50 font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                >
                  {loadingPreview ? (
                    <>
                      <Loader2 size={16} className="animate-spin md:w-[18px] md:h-[18px]" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <Eye size={16} className="md:w-[18px] md:h-[18px]" />
                      <span className="hidden sm:inline">Preview Recipients</span>
                      <span className="sm:hidden">Preview</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleSend}
                  disabled={sending || (!selectedTemplateId && (!subject.trim() || !body.trim()))}
                  className="flex items-center gap-2 px-6 md:px-8 py-2 md:py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-dark-base hover:from-brand-600 hover:to-brand-700 font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 text-sm md:text-base"
                >
                  {sending ? (
                    <>
                      <Loader2 size={16} className="animate-spin md:w-[18px] md:h-[18px]" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} className="md:w-[18px] md:h-[18px]" />
                      <span>Send Emails</span>
                    </>
                  )}
                </button>
              </div>

              {/* Preview Section */}
              {showPreview && previewData && (
                <div className="mt-6 p-6 bg-gradient-to-br from-brand-50 to-brand-100 rounded-2xl border border-brand-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      <strong>Total Recipients:</strong> {previewData.count}
                    </p>
                    {previewData.sampleUsers && previewData.sampleUsers.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Sample Recipients (first 10):</p>
                        <div className="bg-white rounded-xl border border-gray-200 p-4 max-h-40 overflow-y-auto shadow-sm">
                          <ul className="space-y-1">
                            {previewData.sampleUsers.map((user) => (
                              <li key={user.id} className="text-sm text-gray-600">
                                {user.email} {user.name && `(${user.name})`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Email Preview */}
              {showPreview && body && (
                <div className="mt-6 p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Preview</h3>
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <strong className="text-gray-900">Subject:</strong> <span className="text-gray-700">{subject || '(No subject)'}</span>
                    </div>
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: body }}
                    />
                    {imageUrl && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <img src={imageUrl} alt="Email" className="max-w-full h-auto rounded-xl" onError={(e) => {
                          e.target.style.display = 'none';
                        }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sent' && (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-white to-gray-50/50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSentFilter('all')}
                    className={`px-4 py-2 text-sm rounded-xl font-medium transition-colors ${sentFilter === 'all'
                      ? 'bg-blue-600 text-dark-base shadow-sm'
                      : 'text-gray-700 hover:bg-brand-50 hover:text-brand-700'
                      }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSentFilter('successful')}
                    className={`px-4 py-2 text-sm rounded-xl font-medium transition-colors ${sentFilter === 'successful'
                      ? 'bg-blue-600 text-dark-base shadow-sm'
                      : 'text-gray-700 hover:bg-brand-50 hover:text-brand-700'
                      }`}
                  >
                    Successful
                  </button>
                  <button
                    onClick={() => setSentFilter('failed')}
                    className={`px-4 py-2 text-sm rounded-xl font-medium transition-colors ${sentFilter === 'failed'
                      ? 'bg-blue-600 text-dark-base shadow-sm'
                      : 'text-gray-700 hover:bg-brand-50 hover:text-brand-700'
                      }`}
                  >
                    Failed
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {sentEmails.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center">
                        <Send size={40} className="text-brand-400" />
                      </div>
                      <p className="text-lg font-medium">No sent emails</p>
                      <p className="text-sm">Emails you send will appear here</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 w-full">
                    {sentEmails
                      .filter((email) => {
                        if (sentFilter === 'successful') {
                          return email.successCount > 0 && (email.failureCount || 0) === 0;
                        }
                        if (sentFilter === 'failed') {
                          return (email.failureCount || 0) > 0;
                        }
                        return true;
                      })
                      .map((email) => {
                        const typeInfo = RECIPIENT_TYPES.find(t => t.value === email.recipientType);
                        const firstRecipient = Array.isArray(email.results) && email.results.length > 0
                          ? email.results[0]
                          : null;
                        return (
                          <div
                            key={email.id}
                            className="p-5 hover:bg-gradient-to-r hover:from-brand-50 hover:to-brand-100 cursor-pointer transition-all rounded-xl border border-gray-200 hover:border-brand-200 hover:shadow-md"
                            onClick={() => {
                              setSelectedSentEmail(email);
                              setShowSentDetails(true);
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${typeInfo?.gradient || 'from-gray-400 to-gray-500'} text-white flex items-center justify-center font-semibold text-sm shadow-sm`}>
                                    {typeInfo?.label.charAt(0) || 'A'}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">
                                      {typeInfo?.label || 'Recipients'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {email.recipientCount} recipients
                                    </div>
                                  </div>
                                </div>
                                <div className="ml-14">
                                  <div className="font-bold text-gray-900 mb-1">{email.subject}</div>
                                  {firstRecipient ? (
                                    <>
                                      <div className="text-sm text-gray-800 font-medium">
                                        {firstRecipient.name || firstRecipient.email}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {firstRecipient.email}
                                      </div>
                                      <div className="text-xs text-gray-400 mt-1">
                                        Sent {fmtDate(firstRecipient.sentAt)}
                                      </div>
                                    </>
                                  ) : (
                                    <div
                                      className="text-sm text-gray-600 line-clamp-2"
                                      dangerouslySetInnerHTML={{
                                        __html: email.body.substring(0, 100) + '...',
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-sm text-gray-500 mb-2">{fmtDate(email.sentAt)}</div>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className={`px-3 py-1 rounded-lg font-medium ${email.successCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                    ✓ {email.successCount}
                                  </span>
                                  {email.failureCount > 0 && (
                                    <span className="px-3 py-1 rounded-lg font-medium bg-red-100 text-red-700">
                                      ✗ {email.failureCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sent email details modal */}
      {showSentDetails && selectedSentEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Email Details</h3>
                <p className="text-xs text-gray-500">
                  Sent {fmtDate(selectedSentEmail.sentAt)} •{' '}
                  {RECIPIENT_TYPES.find(t => t.value === selectedSentEmail.recipientType)?.label || 'Recipients'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSentDetails(false);
                  setSelectedSentEmail(null);
                }}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="flex flex-col md:flex-row gap-4 h-full">
                {/* Left column: subject, stats, content */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Subject</h4>
                    <p className="text-base font-medium text-gray-900">{selectedSentEmail.subject}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        if (recipientsListRef.current) {
                          setRecipientListFilter('all');
                          recipientsListRef.current.scrollIntoView({
                            behavior: 'smooth',
                            block: 'nearest',
                          });
                        }
                      }}
                      className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-left hover:border-brand-300 hover:bg-brand-50/40 transition-colors"
                    >
                      <div className="text-xs text-gray-500 mb-1">Recipients</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {selectedSentEmail.recipientCount ?? '-'}
                      </div>
                      <div className="text-[11px] text-blue-700 mt-1">View all</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (recipientsListRef.current) {
                          setRecipientListFilter('success');
                          recipientsListRef.current.scrollIntoView({
                            behavior: 'smooth',
                            block: 'nearest',
                          });
                        }
                      }}
                      className="bg-green-50 rounded-xl p-3 border border-green-100 text-left hover:border-green-300 hover:bg-green-50/60 transition-colors"
                    >
                      <div className="text-xs text-gray-500 mb-1">Successful</div>
                      <div className="text-sm font-semibold text-green-800">
                        {selectedSentEmail.successCount ?? 0}
                      </div>
                      <div className="text-[11px] text-green-700 mt-1">View all</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (recipientsListRef.current) {
                          setRecipientListFilter('failed');
                          recipientsListRef.current.scrollIntoView({
                            behavior: 'smooth',
                            block: 'nearest',
                          });
                        }
                      }}
                      className="bg-red-50 rounded-xl p-3 border border-red-100 text-left hover:border-red-300 hover:bg-red-50/60 transition-colors"
                    >
                      <div className="text-xs text-gray-500 mb-1">Failed</div>
                      <div className="text-sm font-semibold text-red-800">
                        {selectedSentEmail.failureCount ?? 0}
                      </div>
                      <div className="text-[11px] text-red-700 mt-1">View all</div>
                    </button>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Email Content</h4>
                    <div className="border border-gray-200 rounded-xl p-3 max-h-56 overflow-y-auto bg-gray-50">
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: selectedSentEmail.body }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right column: recipients list */}
                <div
                  ref={recipientsListRef}
                  className="w-full md:w-80 lg:w-96 md:flex-shrink-0 border border-gray-200 rounded-xl bg-gray-50 max-h-80 md:max-h-full overflow-y-auto"
                >
                  <div className="px-3 py-2 border-b border-gray-200 bg-white rounded-t-xl sticky top-0 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-800">
                      Recipients
                    </h4>
                    <div className="flex gap-1 text-[11px]">
                      <span
                        className={`px-2 py-0.5 rounded-full cursor-pointer ${recipientListFilter === 'all'
                          ? 'bg-blue-600 text-dark-base'
                          : 'text-gray-600 hover:bg-brand-50 hover:text-brand-700'
                          }`}
                        onClick={() => setRecipientListFilter('all')}
                      >
                        All
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full cursor-pointer ${recipientListFilter === 'success'
                          ? 'bg-green-600 text-white'
                          : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                          }`}
                        onClick={() => setRecipientListFilter('success')}
                      >
                        ✓
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full cursor-pointer ${recipientListFilter === 'failed'
                          ? 'bg-red-600 text-white'
                          : 'text-gray-600 hover:bg-red-50 hover:text-red-700'
                          }`}
                        onClick={() => setRecipientListFilter('failed')}
                      >
                        ✗
                      </span>
                    </div>
                  </div>
                  <ul className="divide-y divide-gray-200 text-xs">
                    {(
                      Array.isArray(selectedSentEmail.results)
                        ? selectedSentEmail.results
                        : []
                    )
                      .filter((r) => {
                        if (recipientListFilter === 'success') return r.status === 'success';
                        if (recipientListFilter === 'failed') return r.status !== 'success';
                        return true;
                      })
                      .map((r, idx) => (
                        <li key={`${r.email}-${idx}`} className="px-3 py-2 flex flex-col">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 truncate">
                                {r.name || r.email}
                              </div>
                              <div className="text-[11px] text-gray-500 truncate">
                                {r.email}
                              </div>
                            </div>
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${r.status === 'success'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                                }`}
                            >
                              {r.status === 'success' ? 'Sent' : 'Failed'}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-400 mt-1">
                            {r.sentAt ? fmtDate(r.sentAt) : '-'}
                          </div>
                        </li>
                      ))}
                    {!Array.isArray(selectedSentEmail.results) ||
                      selectedSentEmail.results.length === 0 ? (
                      <li className="px-3 py-4 text-[11px] text-gray-500 text-center">
                        No per-recipient details available for this email.
                      </li>
                    ) : null}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
