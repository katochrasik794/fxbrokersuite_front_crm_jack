import { useEffect, useMemo, useState } from "react";
import ProTable from "../../components/ProTable.jsx";
import Modal from "../../components/Modal.jsx";
import { Plus, Edit, Trash2, Power, PowerOff, Image as ImageIcon, X } from "lucide-react";
import Swal from "sweetalert2";

const BASE = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export default function Tickers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTicker, setEditingTicker] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    image: null,
    imagePreview: null,
    existingImageUrl: null,
    link_url: "",
    position: "top",
    is_active: true,
    display_duration: 5,
    animation_speed: 50,
    priority: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickers();
  }, []);

  const fetchTickers = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE}/tickers/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to load tickers");
      setRows(data.data || []);
    } catch (e) {
      setError(e.message || String(e));
      Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'Failed to load tickers' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTicker(null);
    setFormData({
      title: "",
      message: "",
      image: null,
      imagePreview: null,
      existingImageUrl: null,
      link_url: "",
      position: "top",
      is_active: true,
      display_duration: 5,
      animation_speed: 50,
      priority: 0,
    });
    setModalOpen(true);
  };

  const handleEdit = (ticker) => {
    setEditingTicker(ticker);
    setFormData({
      title: ticker.title || "",
      message: ticker.message || "",
      image: null,
      imagePreview: null,
      existingImageUrl: ticker.image_url || null,
      link_url: ticker.link_url || "",
      position: ticker.position || "top",
      is_active: ticker.is_active !== undefined ? ticker.is_active : true,
      display_duration: ticker.display_duration || 5,
      animation_speed: ticker.animation_speed || 50,
      priority: ticker.priority || 0,
    });
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Image size must be less than 5MB' });
        return;
      }
      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
        existingImageUrl: null,
      }));
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null,
      imagePreview: null,
      existingImageUrl: null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Title is required' });
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('adminToken');
      const submitData = new FormData();
      submitData.append('title', formData.title.trim());
      if (formData.message) submitData.append('message', formData.message.trim());
      if (formData.link_url) submitData.append('link_url', formData.link_url.trim());
      submitData.append('position', formData.position);
      submitData.append('is_active', formData.is_active);
      submitData.append('display_duration', formData.display_duration);
      submitData.append('animation_speed', formData.animation_speed);
      submitData.append('priority', formData.priority);

      if (formData.image) {
        submitData.append('image', formData.image);
      }

      const url = editingTicker
        ? `${BASE}/tickers/admin/${editingTicker.id}`
        : `${BASE}/tickers/admin`;
      const method = editingTicker ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: submitData,
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to save ticker');

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: editingTicker ? 'Ticker updated successfully' : 'Ticker created successfully'
      });
      setModalOpen(false);
      fetchTickers();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'Failed to save ticker' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (ticker) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Ticker?',
      text: `Are you sure you want to delete "${ticker.title}"?`,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${BASE}/tickers/admin/${ticker.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Failed to delete ticker');
        Swal.fire({ icon: 'success', title: 'Success', text: 'Ticker deleted successfully' });
        fetchTickers();
      } catch (e) {
        Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'Failed to delete ticker' });
      }
    }
  };

  const handleToggleActive = async (ticker) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE}/tickers/admin/${ticker.id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to toggle ticker status');
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: data.message || 'Ticker status updated'
      });
      fetchTickers();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'Failed to toggle ticker status' });
    }
  };

  const columns = useMemo(() => [
    { key: "__index", label: "Sr No", sortable: false },
    { key: "title", label: "Title" },
    {
      key: "position",
      label: "Position",
      render: (v) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${v === 'top' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
          }`}>
          {v === 'top' ? 'Top' : 'Middle'}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (v) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${v ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
          {v ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    { key: "priority", label: "Priority" },
    { key: "display_duration", label: "Duration (s)" },
    { key: "animation_speed", label: "Speed" },
    {
      key: "created_at",
      label: "Created",
      render: fmtDate,
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleActive(row)}
            className={`p-1.5 rounded transition ${row.is_active
                ? 'text-yellow-600 hover:bg-yellow-50'
                : 'text-green-600 hover:bg-green-50'
              }`}
            title={row.is_active ? 'Deactivate' : 'Activate'}
          >
            {row.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ], []);

  const filters = useMemo(() => ({
    searchKeys: ["title", "message"],
    selects: [
      {
        key: "position",
        label: "All Positions",
        options: ["top", "middle"],
      },
      {
        key: "is_active",
        label: "All Statuses",
        options: ["true", "false"],
      },
    ],
  }), []);

  if (loading && rows.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading tickers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Tickers</h1>
          <p className="text-sm text-gray-600 mt-1">Create and manage tickers displayed on user dashboard</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-dark-base rounded-lg transition font-medium"
        >
          <Plus className="w-5 h-5" />
          Create Ticker
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <ProTable
        title="Tickers"
        rows={rows}
        columns={columns}
        filters={filters}
        pageSize={10}
        searchPlaceholder="Search tickers by title, message..."
      />

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTicker ? "Edit Ticker" : "Create Ticker"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Enter ticker title"
              maxLength={255}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Enter ticker message (optional)"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image
            </label>
            {formData.imagePreview || formData.existingImageUrl ? (
              <div className="relative mb-2">
                <img
                  src={formData.imagePreview || `${BASE.replace(/\/api\/?$/, '')}${formData.existingImageUrl}`}
                  alt="Preview"
                  className="w-full h-48 object-contain border border-gray-300 rounded-lg"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.png'; // Fallback
                    e.target.style.opacity = '0.5';
                  }}
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : null}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-gray-500 mt-1">Max 5MB. Supported: JPEG, PNG, GIF, WebP</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link URL
            </label>
            <input
              type="url"
              value={formData.link_url}
              onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="https://example.com (optional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <select
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="top">Top (Above verification banner)</option>
                <option value="middle">Middle (Between navbar and content)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                min="0"
                max="5"
              />
              <p className="text-xs text-gray-500 mt-1">Higher priority shows first (0-5)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Duration (seconds)
              </label>
              <input
                type="number"
                value={formData.display_duration}
                onChange={(e) => setFormData(prev => ({ ...prev, display_duration: parseInt(e.target.value) || 5 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Animation Speed (pixels/sec)
              </label>
              <input
                type="number"
                value={formData.animation_speed}
                onChange={(e) => setFormData(prev => ({ ...prev, animation_speed: parseInt(e.target.value) || 50 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                min="10"
                required
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500"
            />
            <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
              Active (ticker will be displayed)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-dark-base rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? 'Saving...' : editingTicker ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

