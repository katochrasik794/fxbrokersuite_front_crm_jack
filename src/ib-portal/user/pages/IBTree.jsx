import React, { useState, useRef, useCallback, useEffect } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import ibService from '../../../services/ibService';
import {
  User,
  Mail,
  ChevronDown,
  ChevronUp,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';

function IBTree() {
  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [expandedNodes, setExpandedNodes] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const treeRef = useRef(null);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        setLoading(true);
        const [profileRes, treeRes] = await Promise.all([
          ibService.getProfile(),
          ibService.getTree()
        ]);

        if (profileRes.success && treeRes.success) {
          // Construct the root node from profile
          const root = {
            id: 'root',
            name: `${profileRes.data.first_name || ''} ${profileRes.data.last_name || ''}`.trim(),
            email: profileRes.data.email,
            level: 'Me',
            type: profileRes.data.ib_type || 'IB',
            metrics: {
              amountLots: '$0.00',
              ibClients: '0',
              ownLots: '0.0000',
              traders: '0',
              teamLots: '0.0000',
              totalLots: '0.0000',
            },
            children: treeRes.data
          };
          setTreeData(root);
          setExpandedNodes(['root']);
        }
      } catch (error) {
        console.error('Error fetching tree data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTree();
  }, []);

  // Attach event listeners




  const levels = [
    { value: 'all', label: 'All Levels' },
    { value: 'L1', label: 'Level 1' },
    { value: 'L2', label: 'Level 2' },
    { value: 'L3', label: 'Level 3' },
  ];

  // Filter nodes by level
  const filterNodesByLevel = (node, level) => {
    if (level === 'all') return true;
    return node.level === level;
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) =>
      prev.includes(nodeId)
        ? prev.filter((id) => id !== nodeId)
        : [...prev, nodeId]
    );
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
  React.useEffect(() => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ib-600"></div>
      </div>
    );
  }

  const renderNode = (node, depth = 0, isLast = false) => {
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
            <div className="flex items-start justify-between min-h-[40px]">
              <div className="flex items-start gap-1.5 flex-1 min-w-0">
                <div className="p-1.5 bg-ib-100 rounded flex-shrink-0">
                  <User className="w-4 h-4 text-ib-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{node.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1">
                    <Mail className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="truncate">{node.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">
                      {node.level}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${node.type === 'IB' || node.type === 'Master IB'
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
                  className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
                  )}
                </button>
              )}
            </div>

            {/* Render metrics only if they exist */}
            {node.metrics && node.metrics.totalLots !== undefined && (
              <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-gray-100">
                <div className="bg-gray-50 rounded p-1.5">
                  <p className="text-[10px] text-gray-500 font-medium">TOT VOL</p>
                  <p className="text-xs font-bold text-gray-900">{node.metrics.totalLots}</p>
                </div>
                <div className="bg-gray-50 rounded p-1.5">
                  <p className="text-[10px] text-gray-500 font-medium">CLIENTS</p>
                  <p className="text-xs font-bold text-gray-900">{node.metrics.ibClients}</p>
                </div>
              </div>
            )}

            {/* Show info if it's a leaf node and has no children or expanded */}
            {(!hasChildren || !isExpanded) && node.children?.length > 0 && (
              <div className="mt-2 text-[10px] text-ib-600 font-medium text-center bg-ib-50 py-1 rounded">
                {node.children.length} sub-referrals
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

  return (
    <div className="w-full space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">IB Tree</h1>
          <p className="text-sm text-gray-600">Hierarchical view of your IB network</p>
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
                {renderNode(treeData, 0, true)}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default IBTree;
