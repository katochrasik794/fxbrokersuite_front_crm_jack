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

export default function Promotions() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    image: null,
    imagePreview: null,
    existingImageUrl: null,
    button_text: "",
    button_link: "",
    button_position: "right-center",
    is_active: true,
    priority: 0,
    display_order: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE}/promotions/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to load promotions");
      setRows(data.data || []);
    } catch (e) {
      setError(e.message || String(e));
      Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'Failed to load promotions' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPromotion(null);
    setFormData({
      title: "",
      image: null,
      imagePreview: null,
      existingImageUrl: null,
      button_text: "",
      button_link: "",
      button_position: "right-center",
      is_active: true,
      priority: 0,
      display_order: 0,
    });
    setModalOpen(true);
  };

  const handleEdit = (promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      title: promotion.title || "",
      image: null,
      imagePreview: null,
      existingImageUrl: promotion.image_url || null,
      button_text: promotion.button_text || "",
      button_link: promotion.button_link || "",
      button_position: promotion.button_position || "right-center",
      is_active: promotion.is_active !== undefined ? promotion.is_active : true,
      priority: promotion.priority || 0,
      display_order: promotion.display_order || 0,
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
    if (!formData.image && !formData.existingImageUrl) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Image is required' });
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('adminToken');
      const submitData = new FormData();
      if (formData.title) submitData.append('title', formData.title.trim());
      if (formData.button_text) submitData.append('button_text', formData.button_text.trim());
      if (formData.button_link) submitData.append('button_link', formData.button_link.trim());
      submitData.append('button_position', formData.button_position);
      submitData.append('is_active', formData.is_active);
      submitData.append('priority', formData.priority);
      submitData.append('display_order', formData.display_order);
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      const url = editingPromotion 
        ? `${BASE}/promotions/admin/${editingPromotion.id}`
        : `${BASE}/promotions/admin`;
      const method = editingPromotion ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: submitData,
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to save promotion');

      Swal.fire({ 
        icon: 'success', 
        title: 'Success', 
        text: editingPromotion ? 'Promotion updated successfully' : 'Promotion created successfully' 
      });
      setModalOpen(false);
      fetchPromotions();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'Failed to save promotion' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (promotion) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Promotion?',
      text: `Are you sure you want to delete "${promotion.title || 'this promotion'}"?`,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${BASE}/promotions/admin/${promotion.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Failed to delete promotion');
        Swal.fire({ icon: 'success', title: 'Success', text: 'Promotion deleted successfully' });
        fetchPromotions();
      } catch (e) {
        Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'Failed to delete promotion' });
      }
    }
  };

  const handleToggleActive = async (promotion) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE}/promotions/admin/${promotion.id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to toggle promotion status');
      Swal.fire({ 
        icon: 'success', 
        title: 'Success', 
        text: data.message || 'Promotion status updated' 
      });
      fetchPromotions();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'Failed to toggle promotion status' });
    }
  };

  const columns = useMemo(() => [
    { key: "__index", label: "Sr No", sortable: false },
    {
      key: "image_url",
      label: "Image",
      render: (v) => (
        v ? (
          <img
            src={`${BASE.replace('/api', '')}${v}`}
            alt="Promotion"
            className="w-20 h-12 object-cover rounded border border-gray-300"
          />
        ) : (
          <div className="w-20 h-12 bg-gray-100 rounded flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-gray-400" />
          </div>
        )
      ),
    },
    { key: "title", label: "Title" },
    {
      key: "button_position",
      label: "Button Position",
      render: (v) => (
        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
          {v || 'right-center'}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (v) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          v ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {v ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    { key: "priority", label: "Priority" },
    { key: "display_order", label: "Display Order" },
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
            className={`p-1.5 rounded transition ${
              row.is_active 
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
    searchKeys: ["title", "button_text"],
    selects: [
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
          <div className="text-gray-500">Loading promotions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Promotions</h1>
          <p className="text-sm text-gray-600 mt-1">Create and manage promotional banners displayed on user dashboard</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-dark-base rounded-lg transition font-medium"
        >
          <Plus className="w-5 h-5" />
          Create Promotion
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <ProTable
        title="Promotions"
        rows={rows}
        columns={columns}
        filters={filters}
        pageSize={10}
        searchPlaceholder="Search promotions by title, button text..."
      />

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPromotion ? "Edit Promotion" : "Create Promotion"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title (for admin reference)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Enter promotion title (optional)"
              maxLength={255}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Banner Image <span className="text-red-500">*</span>
            </label>
            {formData.imagePreview || formData.existingImageUrl ? (
              <div className="relative mb-2">
                <img
                  src={formData.imagePreview || `${BASE.replace('/api', '')}${formData.existingImageUrl}`}
                  alt="Preview"
                  className="w-full h-64 object-contain border border-gray-300 rounded-lg"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required={!editingPromotion || !formData.existingImageUrl}
            />
            <p className="text-xs text-gray-500 mt-1">Max 5MB. Supported: JPEG, PNG, GIF, WebP</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Button Text (optional)
              </label>
              <input
                type="text"
                value={formData.button_text}
                onChange={(e) => setFormData(prev => ({ ...prev, button_text: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="e.g., Learn More"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Button Position
              </label>
              <select
                value={formData.button_position}
                onChange={(e) => setFormData(prev => ({ ...prev, button_position: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="right-center">Right Center</option>
                <option value="left-center">Left Center</option>
                <option value="center">Center</option>
                <option value="right-top">Right Top</option>
                <option value="left-top">Left Top</option>
                <option value="right-bottom">Right Bottom</option>
                <option value="left-bottom">Left Bottom</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Button Link (optional)
            </label>
            <input
              type="url"
              value={formData.button_link}
              onChange={(e) => setFormData(prev => ({ ...prev, button_link: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="https://example.com"
            />
            <p className="text-xs text-gray-500 mt-1">URL to navigate when button is clicked</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Higher priority shows first</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Order within same priority</p>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
            />
            <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
              Active (promotion will be displayed)
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-dark-base rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? 'Saving...' : editingPromotion ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

