import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Toast from '../../../components/Toast.jsx';
import WaveLoader from '../../ui/WaveLoader.jsx';
import {
  UserCheck,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Tag,
  Wallet,
  CreditCard,
  DollarSign,
  Download,
  BarChart3,
  Users,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Eye,
  User,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Trash2,
  Edit,
  Link,
  Save,
  X,
  Check,
  CheckCircle
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ViewIbProfileDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ibData, setIbData] = useState(null);
  const [referredUsers, setReferredUsers] = useState([]);
  const [loadingReferredUsers, setLoadingReferredUsers] = useState(false);
  const [expandedUserRow, setExpandedUserRow] = useState(null);
  const [selectedAccountForTrades, setSelectedAccountForTrades] = useState({});
  const [ibTreeData, setIbTreeData] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState([]);
  const [toast, setToast] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [groupsWithIbs, setGroupsWithIbs] = useState([]);
  const [editConfig, setEditConfig] = useState({
    plan_type: null,
    show_commission_structure: true
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [customPlans, setCustomPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    levels_count: 3,
    structure: {},
    link_data: ''
  });
  const containerRef = useRef(null);
  const treeRef = useRef(null);

  useEffect(() => {
    if (id) {
      // Fetch groups first, then other data
      fetchGroups().then(() => {
        fetchIbDetails();
        fetchReferredUsers();
        fetchIbTree();
        fetchCustomPlans();
      });
    }
  }, [id]);

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/ib-requests/active-groups`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGroupsWithIbs(data.data || []);
          return data.data || [];
        }
      }
      return [];
    } catch (err) {
      console.error('Error fetching groups:', err);
      return [];
    }
  };

  const fetchIbDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('adminToken');

      // Fetch IB request details
      const response = await fetch(`${API_BASE_URL}/ib-requests/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch IB details');
      }

      const data = await response.json();
      if (data.success) {
        setIbData(data.data);
        setEditConfig({
          plan_type: data.data.plan_type || null,
          show_commission_structure: data.data.show_commission_structure ?? true
        });
      }
    } catch (err) {
      console.error('Error fetching IB details:', err);
      setError(err.message);
      setToast({
        message: 'Failed to fetch IB details',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReferredUsers = async () => {
    try {
      setLoadingReferredUsers(true);
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`${API_BASE_URL}/ib-requests/${id}/referred-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch referred users');
      }

      const data = await response.json();
      if (data.success) {
        setReferredUsers(data.data.referredUsers || []);
      }
    } catch (err) {
      console.error('Error fetching referred users:', err);
    } finally {
      setLoadingReferredUsers(false);
    }
  };

  const fetchCustomPlans = async () => {
    try {
      setLoadingPlans(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/ib-requests/${id}/plans`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCustomPlans(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching custom plans:', err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/ib-requests/${id}/ib-type`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ib_type: ibData.ib_type,
          referrer_ib_id: ibData.referrer_ib_id,
          plan_type: editConfig.plan_type,
          show_commission_structure: editConfig.show_commission_structure
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update configuration');
      }

      const data = await response.json();
      if (data.success) {
        setToast({
          message: 'Configuration updated successfully',
          type: 'success'
        });
        fetchIbDetails();
      }
    } catch (err) {
      console.error('Error saving config:', err);
      setToast({
        message: err.message,
        type: 'error'
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const fetchIbTree = async () => {
    try {
      const token = localStorage.getItem('adminToken');

      // Fetch IB tree data - this will build the hierarchical structure
      const response = await fetch(`${API_BASE_URL}/ib-requests/${id}/ib-tree`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // If endpoint doesn't exist yet, we'll build it from referred users
        console.log('IB tree endpoint not available, will build from referred users');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setIbTreeData(data.data);
        // Auto-expand root node
        const rootId = data.data.ibRequestId?.toString() || data.data.userId?.toString() || `node-${data.data.level}`;
        if (rootId) {
          setExpandedNodes([rootId]);
        }
      }
    } catch (err) {
      console.error('Error fetching IB tree:', err);
      // Silently fail - we'll build tree from referred users
    }
  };

  const handleOpenPlanModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        name: plan.name,
        levels_count: plan.levels_count,
        structure: typeof plan.structure === 'string' ? JSON.parse(plan.structure) : plan.structure,
        link_data: plan.link_data
      });
    } else {
      setEditingPlan(null);
      // Initialize structure with empty values for each group
      const initialStructure = {};
      groupsWithIbs.forEach(group => {
        initialStructure[group.id] = { L1: '', L2: '', L3: '' };
      });
      setPlanForm({
        name: '',
        levels_count: 3,
        structure: initialStructure,
        link_data: ''
      });
    }
    setShowPlanModal(true);
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this custom plan?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/ib-requests/plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setToast({ message: 'Plan deleted successfully', type: 'success' });
        fetchCustomPlans();
      } else {
        throw new Error('Failed to delete plan');
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleSavePlan = async () => {
    if (!planForm.name) {
      setToast({ message: 'Plan name is required', type: 'error' });
      return;
    }

    try {
      setSavingConfig(true);
      const token = localStorage.getItem('adminToken');

      // Clean up structure - ensure numeric values
      const cleanedStructure = {};
      Object.entries(planForm.structure).forEach(([groupId, levels]) => {
        cleanedStructure[groupId] = {};
        Object.entries(levels).forEach(([level, value]) => {
          if (value !== '') {
            cleanedStructure[groupId][level] = parseFloat(value);
          }
        });
      });

      const url = editingPlan
        ? `${API_BASE_URL}/ib-requests/plans/${editingPlan.id}`
        : `${API_BASE_URL}/ib-requests/admin/plans`;

      const response = await fetch(url, {
        method: editingPlan ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...planForm,
          user_id: ibData.user_id, // For creating new plans via admin
          structure: cleanedStructure,
          link_data: planForm.link_data || `${window.location.origin}/register?code=${ibData.referral_code}&plans_name=${encodeURIComponent(planForm.name)}`
        }),
      });

      if (response.ok) {
        setToast({ message: editingPlan ? 'Plan updated' : 'Plan created', type: 'success' });
        setShowPlanModal(false);
        fetchCustomPlans();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save plan');
      }
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSavingConfig(false);
    }
  };

  const renderNode = (node, depth = 0, isLast = false) => {
    if (!node) return null;

    // Apply level filter
    if (!filterNodesByLevel(node, selectedLevel)) {
      return null;
    }

    const isExpanded = expandedNodes.includes(node.id);
    const hasChildren = node.children && node.children.length > 0;

    // Filter children by level
    const visibleChildren = hasChildren
      ? node.children.filter((child) => filterNodesByLevel(child, selectedLevel))
      : [];

    return (
      <div key={node.id} className="relative">
        {/* Ultra Compact Node Card - Wider and Shorter */}
        <div className="relative z-10 mb-2">
          <Card className="w-full max-w-[300px] mx-auto hover:shadow-md transition-all duration-200 bg-white border border-gray-200">
            {/* Ultra Compact Header */}
            <div className="flex items-start justify-between mb-1.5 pb-1.5 border-b border-gray-100">
              <div className="flex items-start gap-1.5 flex-1 min-w-0">
                <div className="p-1 bg-ib-100 rounded flex-shrink-0">
                  <User className="w-3 h-3 text-ib-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <h3 className="text-xs font-bold text-gray-900 truncate">{node.name}</h3>
                    {node.status && (
                      <div
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${node.status === 'active' ? 'bg-green-500' : 'bg-orange-500'
                          }`}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-600 mb-0.5">
                    <Mail className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="truncate">{node.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-semibold">
                      {node.level}
                    </span>
                    <span
                      className={`px-1 py-0.5 rounded text-[10px] font-semibold ${node.type === 'IB'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                        }`}
                    >
                      {node.type}
                    </span>
                  </div>
                </div>
              </div>
              {hasChildren && visibleChildren.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNode(node.id);
                  }}
                  className="p-0.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-3 h-3 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-gray-600" />
                  )}
                </button>
              )}
            </div>

            {/* Ultra Compact Metrics Grid - Horizontal Layout */}
            <div className="grid grid-cols-3 gap-1.5 mb-1.5">
              <div className="bg-gray-50 rounded p-1.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <Wallet className="w-2.5 h-2.5 text-gray-400" />
                  <span className="text-[10px] text-gray-600 font-medium">AMT</span>
                </div>
                <p className="text-xs font-bold text-gray-900 leading-tight">{node.metrics.amountLots}</p>
              </div>

              <div className="bg-gray-50 rounded p-1.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <Users className="w-2.5 h-2.5 text-gray-400" />
                  <span className="text-[10px] text-gray-600 font-medium">IB</span>
                </div>
                <p className="text-xs font-bold text-gray-900 leading-tight">{node.metrics.ibClients}</p>
              </div>

              <div className="bg-gray-50 rounded p-1.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <BarChart3 className="w-2.5 h-2.5 text-gray-400" />
                  <span className="text-[10px] text-gray-600 font-medium">OWN</span>
                </div>
                <p className="text-xs font-bold text-gray-900 leading-tight">{node.metrics.ownLots}</p>
              </div>

              <div className="bg-gray-50 rounded p-1.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <Users className="w-2.5 h-2.5 text-gray-400" />
                  <span className="text-[10px] text-gray-600 font-medium">TR</span>
                </div>
                <p className="text-xs font-bold text-gray-900 leading-tight">{node.metrics.traders}</p>
              </div>

              <div className="bg-gray-50 rounded p-1.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <TrendingUp className="w-2.5 h-2.5 text-gray-400" />
                  <span className="text-[10px] text-gray-600 font-medium">TEAM</span>
                </div>
                <p className="text-xs font-bold text-gray-900 leading-tight">{node.metrics.teamLots}</p>
              </div>

              <div className="bg-gray-50 rounded p-1.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <BarChart3 className="w-2.5 h-2.5 text-gray-400" />
                  <span className="text-[10px] text-gray-600 font-medium">TOT</span>
                </div>
                <p className="text-xs font-bold text-gray-900 leading-tight">{node.metrics.totalLots}</p>
              </div>
            </div>

            {/* Ultra Compact Commission Summary */}
            {node.commission && (
              <div className="mb-1.5 p-1.5 bg-green-50 rounded border border-green-200">
                <div className="flex items-center gap-1 mb-0.5">
                  <DollarSign className="w-3 h-3 text-green-600" />
                  <span className="text-[10px] font-semibold text-green-900">
                    {node.commission.total}
                  </span>
                </div>
                <p className="text-[10px] text-green-700">{node.commission.from}</p>
              </div>
            )}

            {/* Ultra Compact Pip Rates */}
            {node.pipRates && Object.keys(node.pipRates).length > 0 && (
              <div>
                <h4 className="text-[10px] font-semibold text-gray-700 mb-1">Pip:</h4>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(node.pipRates).slice(0, 3).map(([category, rate]) => (
                    <span
                      key={category}
                      className="px-1.5 py-0.5 bg-gray-100 text-gray-900 rounded text-[10px] font-medium border border-gray-200"
                    >
                      {category}: {rate}
                    </span>
                  ))}
                  {Object.entries(node.pipRates).length > 3 && (
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                      +{Object.entries(node.pipRates).length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Children Nodes */}
        {hasChildren && isExpanded && visibleChildren.length > 0 && (
          <div className="relative mt-2">
            {depth === 0 && (
              <div className="absolute left-1/2 top-0 w-0.5 h-2 bg-gray-300 transform -translate-x-1/2 -translate-y-2" />
            )}
            <div className="flex flex-col md:flex-row md:justify-center md:items-start gap-2 md:gap-3 pt-2">
              {visibleChildren.map((child, index) => (
                <div key={child.id} className="relative flex-1 max-w-[300px]">
                  <div className="absolute left-1/2 -top-2 w-0.5 h-2 bg-gray-300 transform -translate-x-1/2" />
                  {renderNode(child, depth + 1, index === visibleChildren.length - 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleToggleUserRow = (userId) => {
    if (expandedUserRow === userId) {
      setExpandedUserRow(null);
    } else {
      setExpandedUserRow(userId);
    }
  };

  const handleAccountSelect = (userId, accountNumber) => {
    setSelectedAccountForTrades(prev => ({
      ...prev,
      [userId]: accountNumber
    }));
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev =>
      prev.includes(nodeId)
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  // Level filter
  const levels = [
    { value: 'all', label: 'All Levels' },
    { value: 'L1', label: 'Level 1' },
    { value: 'L2', label: 'Level 2' },
    { value: 'L3', label: 'Level 3' },
  ];

  const filterNodesByLevel = (node, level) => {
    if (level === 'all') return true;
    return node.level === level;
  };

  // Zoom functions
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Drag functions
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return; // Only left mouse button
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }, [position]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch events for mobile
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  }, [position]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Attach event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Transform tree data to match IBTree format
  const transformTreeData = (node) => {
    if (!node) return null;

    // Get pip rates from node's own group_pip_commissions (each node has its own)
    const pipRates = {};
    if (node.groupPipCommissions && typeof node.groupPipCommissions === 'object') {
      // Map group IDs to group names using groupsWithIbs
      Object.entries(node.groupPipCommissions).forEach(([groupId, rate]) => {
        if (rate !== null && rate !== '' && rate !== undefined) {
          const numValue = parseFloat(rate);
          if (!isNaN(numValue) && numValue >= 0) {
            const group = groupsWithIbs.find(g => g.id === parseInt(groupId));
            // Use dedicatedName first, then groupName (camelCase from API)
            if (group) {
              const groupName = group.dedicatedName || group.groupName;
              if (groupName) {
                pipRates[groupName] = numValue.toString();
              }
            }
          }
        }
      });
    }

    // Count IB children
    const ibChildrenCount = node.children?.filter(c =>
      c.type === 'IB' || c.type === 'MASTER' || c.type === 'SUB-IB' || c.type === 'Client'
    ).length || 0;

    return {
      id: node.ibRequestId?.toString() || node.userId?.toString() || `node-${node.level}`,
      name: node.name,
      email: node.email,
      level: node.level,
      type: node.type === 'IB' || node.type === 'MASTER' || node.type === 'SUB-IB' ? 'IB' : 'Client',
      status: 'active', // Default to active
      metrics: {
        amountLots: `$${(node.totalBalance || 0).toFixed(2)}`,
        ibClients: ibChildrenCount,
        ownLots: '0.0000', // TODO: Calculate from trades
        traders: node.accountCount || 0,
        teamLots: '0.0000', // TODO: Calculate from team trades
        totalLots: '0.0000', // TODO: Calculate
      },
      commission: (node.type === 'IB' || node.type === 'MASTER' || node.type === 'SUB-IB') && ibChildrenCount > 0 ? {
        total: '$0.00', // TODO: Calculate commission
        from: `${ibChildrenCount} client(s) trading activity`
      } : null,
      pipRates: Object.keys(pipRates).length > 0 ? pipRates : {},
      children: node.children?.map(child => transformTreeData(child)).filter(Boolean) || []
    };
  };

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <WaveLoader message="Loading IB profile details..." />
      </div>
    );
  }

  if (error || !ibData) {
    return (
      <div className="w-full space-y-6">
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-900 mb-2">Error loading IB profile</p>
          <p className="text-sm text-gray-600">{error || 'IB not found'}</p>
          <Button variant="outline" onClick={() => navigate('/admin/ib/ib-profile')} className="mt-4">
            ← Back to Profiles
          </Button>
        </div>
      </div>
    );
  }

  // Build pip rates display from group_pip_commissions
  const buildPipRatesDisplay = () => {
    if (!ibData?.group_pip_commissions || typeof ibData.group_pip_commissions !== 'object') {
      return [];
    }

    // Wait for groups to be loaded
    if (!groupsWithIbs || groupsWithIbs.length === 0) {
      return [];
    }

    const pipRatesList = [];
    Object.entries(ibData.group_pip_commissions).forEach(([groupId, pipValue]) => {
      if (pipValue !== null && pipValue !== '' && pipValue !== undefined) {
        const numValue = parseFloat(pipValue);
        if (!isNaN(numValue) && numValue >= 0) {
          // Find group name from groupsWithIbs - exactly like in IBProfile table
          const group = groupsWithIbs.find(g => g.id === parseInt(groupId));
          if (group) {
            // Use dedicatedName if available, otherwise groupName (same logic as table - camelCase)
            const groupName = group.dedicatedName || group.groupName;
            if (groupName) {
              pipRatesList.push({ groupName, pipValue: numValue });
            }
          }
        }
      }
    });

    // Sort by group name (with null safety)
    pipRatesList.sort((a, b) => {
      const nameA = a?.groupName || '';
      const nameB = b?.groupName || '';
      return nameA.localeCompare(nameB);
    });

    return pipRatesList;
  };

  const pipRatesList = buildPipRatesDisplay();

  // Build ibDetailData from fetched data
  const ibDetailData = {
    id: ibData.id || id,
    name: `${ibData.first_name || ''} ${ibData.last_name || ''}`.trim() || 'N/A',
    email: ibData.email || 'N/A',
    phone: ibData.phone || 'N/A',
    country: ibData.country || 'N/A',
    ibType: ibData.ib_type || 'NORMAL',
    pipRate: pipRatesList, // Now contains array of {groupName, pipValue}
    approvedDate: ibData.approved_at ? new Date(ibData.approved_at).toLocaleString() : 'N/A',
    referredBy: ibData.referred_by_name ? { name: ibData.referred_by_name, email: ibData.referred_by_email || '' } : { name: '', email: '' },
    totalAccounts: ibData.accounts?.length || 0,
    totalBalance: `$${ibData.accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0).toFixed(2) || '0.00'}`,
    totalEquity: `$${ibData.accounts?.reduce((sum, acc) => sum + (acc.equity || 0), 0).toFixed(2) || '0.00'}`,
    ownLots: '0.0000',
    teamLots: '0.0000',
    totalTrades: '0',
    totalLots: '0.0000',
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">IB Profile Details</h1>
          <p className="text-gray-600">Complete overview of IB user data and performance</p>
        </div>
        <Button variant="outline" icon={ArrowLeft} onClick={() => navigate('/admin/ib/ib-profile')}>
          ← Back to Profiles
        </Button>
      </div>

      {/* IB Information and Account Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* IB Information */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">IB Information</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Full Name</p>
                <p className="text-sm font-semibold text-gray-900">{ibDetailData.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-sm font-semibold text-gray-900">{ibDetailData.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Phone</p>
                <p className="text-sm font-semibold text-gray-900">{ibDetailData.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Country</p>
                <p className="text-sm font-semibold text-gray-900">{ibDetailData.country}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">IB Type</p>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  {ibDetailData.ibType.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Pip/Lot Rate</p>
                {Array.isArray(ibDetailData.pipRate) && ibDetailData.pipRate.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {ibDetailData.pipRate.map((item, index) => (
                      <p key={index} className="text-sm font-semibold text-green-600">
                        {item?.groupName || 'Unknown'}: {item?.pipValue?.toFixed(1) || '0.0'} pip
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-gray-500 italic">Not configured</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Approved Date</p>
                <p className="text-sm font-semibold text-gray-900">{ibDetailData.approvedDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">Referred By</p>
                {ibDetailData.referredBy.name ? (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{ibDetailData.referredBy.name}</p>
                    <p className="text-xs text-gray-600">{ibDetailData.referredBy.email}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Direct signup</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* IB Configuration */}
        {ibData && ibData.ib_type === 'master' && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 flex-1">IB Configuration</h2>
              <Button
                size="sm"
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="bg-ib-600 hover:bg-ib-700 text-white ml-4"
              >
                {savingConfig ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Managed IB Plan
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditConfig(prev => ({ ...prev, plan_type: null }))}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${editConfig.plan_type === null
                      ? 'bg-gray-50 border-gray-500 shadow-sm'
                      : 'bg-white border-gray-100 hover:border-gray-200'
                      }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold text-gray-900">Unset / User Chooses</span>
                      <span className="text-[10px] text-gray-500">Wait for user to select in their dashboard</span>
                    </div>
                    {editConfig.plan_type === null && <Check className="w-4 h-4 text-gray-900" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditConfig(prev => ({ ...prev, plan_type: 'normal' }))}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${editConfig.plan_type === 'normal'
                      ? 'bg-blue-50 border-blue-500 shadow-sm'
                      : 'bg-white border-gray-100 hover:border-blue-200'
                      }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold text-gray-900">Normal IB Plan</span>
                      <span className="text-[10px] text-green-600 font-bold uppercase tracking-tighter">Active</span>
                    </div>
                    {editConfig.plan_type === 'normal' && <Check className="w-4 h-4 text-blue-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditConfig(prev => ({ ...prev, plan_type: 'advanced' }))}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${editConfig.plan_type === 'advanced'
                      ? 'bg-purple-50 border-purple-500 shadow-sm'
                      : 'bg-white border-gray-100 hover:border-blue-200'
                      }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold text-gray-900">Advanced IB Plan</span>
                      <span className="text-[10px] text-green-600 font-bold uppercase tracking-tighter">Active</span>
                    </div>
                    {editConfig.plan_type === 'advanced' && <Check className="w-4 h-4 text-purple-600" />}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Commission Structure Visibility</h4>
                    <p className="text-[10px] text-gray-500">Display "Custom IB Link" (Commission Structure) in user dashboard</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditConfig(prev => ({ ...prev, show_commission_structure: !prev.show_commission_structure }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-offset-2 ${editConfig.show_commission_structure ? 'bg-ib-600 ring-ib-200' : 'bg-gray-200 ring-gray-100'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editConfig.show_commission_structure ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Account Statistics */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Statistics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Accounts</p>
                  <p className="text-2xl font-bold text-gray-900">{ibDetailData.totalAccounts}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Wallet className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Balance</p>
                  <p className="text-2xl font-bold text-gray-900">{ibDetailData.totalBalance}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Equity</p>
                  <p className="text-2xl font-bold text-gray-900">{ibDetailData.totalEquity}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Custom IB Plans Section - Always show for Master IBs for management */}
      {ibData && ibData.ib_type === 'master' && (
        <Card className="mt-8 border-t-4 border-t-purple-500">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Link className="w-5 h-5 text-purple-600" />
                Saved IB Plans (Custom Structures)
              </h2>
              <p className="text-xs text-gray-500">Manage custom commission chains and referral links for this Master IB</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => handleOpenPlanModal()}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
            >
              Add New Custom Plan
            </Button>
          </div>

          {loadingPlans ? (
            <div className="py-12 text-center">
              <WaveLoader message="Loading saved plans..." />
            </div>
          ) : customPlans.length === 0 ? (
            <div className="py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center">
              <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Link className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-900 font-bold text-lg mb-1 tracking-tight">No custom plans found</p>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">Create specialized commission structures for this IB to use in their marketing campaigns.</p>
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => handleOpenPlanModal()}
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                Create First Plan
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">
                    <th className="pb-3 pl-2">Plan Name & Referral Link</th>
                    <th className="pb-3">Levels</th>
                    <th className="pb-3">Created Date</th>
                    <th className="pb-3 pr-2 text-right">Operation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customPlans.map((plan) => (
                    <tr key={plan.id} className="group hover:bg-purple-50/30 transition-colors">
                      <td className="py-5 pl-2">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-sm mb-1">{plan.name}</span>
                          <span className="text-[10px] font-mono text-gray-400 bg-gray-100 self-start px-1.5 py-0.5 rounded truncate max-w-[400px]">
                            {plan.link_data}
                          </span>
                        </div>
                      </td>
                      <td className="py-5">
                        <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-black uppercase tracking-tight border border-purple-100">
                          {plan.levels_count} Levels
                        </span>
                      </td>
                      <td className="py-5 text-gray-600 text-xs font-medium">
                        {new Date(plan.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit'
                        })}
                      </td>
                      <td className="py-5 pr-2 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-100 transition-opacity">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-blue-600 border-blue-100 hover:bg-blue-50"
                            onClick={() => handleOpenPlanModal(plan)}
                            title="Edit Plan Structure"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-red-600 border-red-100 hover:bg-red-50"
                            onClick={() => handleDeletePlan(plan.id)}
                            title="Delete Plan"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}


      {/* Trade History */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Trade History - Referred Users
          </h2>
          <div className="flex items-center gap-3">
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none">
              <option>All Trades</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
            </select>
            <Button variant="outline" size="sm" icon={Download}>
              Export
            </Button>
          </div>
        </div>

        {loadingReferredUsers ? (
          <WaveLoader message="Loading referred users..." />
        ) : referredUsers.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">No Referred Users Found</p>
            <p className="text-sm text-gray-600">This IB has not referred any users yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">SR No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">From (Name & Email)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">View IB Client Trades</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">IB Commission</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {referredUsers.map((user, index) => (
                  <React.Fragment key={user.userId}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-600">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleUserRow(user.userId)}
                        >
                          {expandedUserRow === user.userId ? 'Hide' : 'View'} IB Client Trades
                        </Button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold text-green-600">$0.00</span>
                        <span className="text-xs text-gray-500 ml-1">(Pending calculation)</span>
                      </td>
                    </tr>
                    {expandedUserRow === user.userId && (
                      <tr>
                        <td colSpan="4" className="px-4 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select MT5 Account
                              </label>
                              <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
                                value={selectedAccountForTrades[user.userId] || ''}
                                onChange={(e) => handleAccountSelect(user.userId, e.target.value)}
                              >
                                <option value="">Select an account...</option>
                                {user.accounts.map((account) => (
                                  <option key={account.id} value={account.accountNumber}>
                                    #{account.accountNumber} - {account.currency} - Balance: ${account.balance.toFixed(2)}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {user.accounts.length === 0 && (
                              <p className="text-sm text-gray-500">No MT5 accounts found for this user.</p>
                            )}

                            {selectedAccountForTrades[user.userId] && (
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                  Trade History for Account #{selectedAccountForTrades[user.userId]}
                                </h4>
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                  <p className="text-sm text-gray-500 text-center py-4">
                                    Trade history will be displayed here once the MT5 API integration is complete.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* IB Tree Structure */}
      <div className="w-full space-y-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">IB Tree</h2>
            <p className="text-sm text-gray-600">Hierarchical view of IB network</p>
          </div>
        </div>

        {/* Level Filter */}
        <Card className="p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>
            {levels.map((level) => (
              <Button
                key={level.value}
                variant={selectedLevel === level.value ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedLevel(level.value)}
                className="text-xs px-3 py-1"
              >
                {level.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Tree Visualization with Zoom and Drag */}
        {ibTreeData ? (
          <Card className="p-0 overflow-hidden relative">
            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2 border border-gray-200">
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Reset Zoom"
              >
                <Maximize2 className="w-4 h-4 text-gray-700" />
              </button>
              <div className="text-xs text-center text-gray-600 font-medium px-2 py-1">
                {Math.round(zoom * 100)}%
              </div>
            </div>

            <div
              ref={containerRef}
              className="bg-yellow-50 relative"
              style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              <div
                ref={treeRef}
                className="absolute inset-0 overflow-auto"
                style={{
                  cursor: isDragging ? 'grabbing' : 'grab',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 #f1f5f9',
                }}
              >
                <style>
                  {`
                    div[style*="scrollbarWidth"]::-webkit-scrollbar {
                      width: 8px;
                      height: 8px;
                    }
                    div[style*="scrollbarWidth"]::-webkit-scrollbar-track {
                      background: #f1f5f9;
                      border-radius: 4px;
                    }
                    div[style*="scrollbarWidth"]::-webkit-scrollbar-thumb {
                      background: #cbd5e1;
                      border-radius: 4px;
                    }
                    div[style*="scrollbarWidth"]::-webkit-scrollbar-thumb:hover {
                      background: #94a3b8;
                    }
                  `}
                </style>
                <div
                  className="relative py-8"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                    transformOrigin: 'top center',
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                  }}
                >
                  {/* Tree Container */}
                  <div className="flex flex-col items-center">
                    {ibTreeData && groupsWithIbs.length > 0 ? (
                      renderNode(transformTreeData(ibTreeData), 0, true)
                    ) : ibTreeData ? (
                      <div className="py-8 text-center text-gray-500">
                        <p>Loading groups for pip rate mapping...</p>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-500">
                        <p>No IB tree data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="py-12 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">No IB Tree Data</p>
              <p className="text-sm text-gray-600">IB tree structure will be displayed here once data is available.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create New Custom Plan'}
              </h2>
              <button
                onClick={() => setShowPlanModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name</label>
                  <input
                    type="text"
                    value={planForm.name}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
                    placeholder="e.g. India Network Plan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Levels Count</label>
                  <select
                    value={planForm.levels_count}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, levels_count: parseInt(e.target.value) }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5].map(lvl => (
                      <option key={lvl} value={lvl}>{lvl} Level{lvl > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Commission Structure Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 border-b pb-2">Commission Structure (Pip per Lot)</label>
                <div className="space-y-4">
                  {groupsWithIbs.filter(group => {
                    // Only show groups that have a pip value assigned to this IB
                    if (!ibData?.group_pip_commissions) return false;
                    const pipVal = ibData.group_pip_commissions[group.id];
                    return pipVal !== undefined && pipVal !== null && pipVal !== '' && !isNaN(parseFloat(pipVal));
                  }).map(group => (
                    <div key={group.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="mb-3">
                        <span className="text-sm font-bold text-gray-900">{group.dedicatedName || group.groupName}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[...Array(planForm.levels_count)].map((_, i) => {
                          const level = `L${i + 1}`;
                          return (
                            <div key={level}>
                              <label className="block text-[10px] text-gray-500 uppercase font-black mb-1">{level}</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={planForm.structure[group.id]?.[level] ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPlanForm(prev => {
                                    const newStructure = { ...prev.structure };
                                    if (!newStructure[group.id]) newStructure[group.id] = {};
                                    newStructure[group.id][level] = val;
                                    return { ...prev, structure: newStructure };
                                  });
                                }}
                                className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs focus:ring-1 focus:ring-ib-500 outline-none"
                                placeholder="0.0"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Referral Link Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Referral Link Override (Optional)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={planForm.link_data}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, link_data: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-10 py-2 text-xs font-mono focus:ring-2 focus:ring-ib-500 outline-none"
                    placeholder="Auto-generated if left blank"
                  />
                  <Link className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
                <p className="mt-1 text-[10px] text-gray-500">
                  Default: {window.location.origin}/register?code={ibData.referral_code}&plans_name={encodeURIComponent(planForm.name || 'Plan')}
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowPlanModal(false)}
                disabled={savingConfig}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSavePlan}
                disabled={savingConfig || !planForm.name}
                className="bg-ib-600 hover:bg-ib-700 text-white"
                icon={Save}
              >
                {savingConfig ? 'Saving...' : (editingPlan ? 'Update Plan' : 'Create Plan')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default ViewIbProfileDetails;

