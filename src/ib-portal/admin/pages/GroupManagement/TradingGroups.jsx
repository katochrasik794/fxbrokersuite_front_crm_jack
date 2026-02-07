import React, { useState, useEffect } from 'react';
import Card from '../../../ui/Card';
import StatCard from '../../../ui/StatCard';
import Table from '../../../ui/Table';
import Button from '../../../ui/Button';
import {
  Users,
  Server,
  Eye,
  Trash2,
  RefreshCw,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fxbrokersuite-back-crm-jack.onrender.com/api';

function TradingGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch groups from database
  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('adminToken');
      // Using admin API with is_active=true filter
      const response = await fetch(`${API_BASE_URL}/admin/group-management?is_active=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }

      const data = await response.json();
      if (data.ok) {
        // Transform data for table
        const transformedGroups = (data.items || []).map(group => ({
          id: group.id,
          groupName: group.dedicated_name || group.group,
          originalGroupName: group.group,
          server: group.server || 1,
          company: group.company || 'fxbrokersuite Markets Limited',
          currency: group.currency || 'USD',
          marginCall: group.margin_call ? `${group.margin_call}%` : '100%',
          stopOut: group.margin_stop_out ? `${group.margin_stop_out}%` : '50%',
          tradeFlags: group.trade_flags || 16,
          created: group.created_at ? new Date(group.created_at).toLocaleString() : 'N/A',
        }));
        setGroups(transformedGroups);
      } else {
        throw new Error(data.error || 'Failed to fetch groups');
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/admin/group-management/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to sync groups');
      }

      const data = await response.json();
      if (data.ok) {
        await fetchGroups();
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (err) {
      console.error('Error syncing groups:', err);
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Calculate summary stats from real data
  const summaryStats = {
    totalGroups: { value: groups.length.toString() },
    solAGroups: { value: groups.filter(g => g.originalGroupName?.includes('sol_A')).length.toString() },
    solBGroups: { value: groups.filter(g => g.originalGroupName?.includes('sol_B')).length.toString() },
  };

  const groupsColumns = [
    {
      key: 'id',
      label: 'ID',
      render: (value) => <span className="font-semibold text-gray-900">{value}</span>,
    },
    {
      key: 'groupName',
      label: 'Group Name',
      render: (value) => <span className="font-semibold text-gray-900">{value}</span>,
    },
    {
      key: 'server',
      label: 'Server',
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
    {
      key: 'company',
      label: 'Company',
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
    {
      key: 'currency',
      label: 'Currency',
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
    {
      key: 'marginCall',
      label: 'Margin Call',
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
    {
      key: 'stopOut',
      label: 'Stop Out',
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
    {
      key: 'tradeFlags',
      label: 'Trade Flags',
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
    {
      key: 'created',
      label: 'Created',
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('View/Edit:', row)}
            title="View/Edit"
          >
            <Eye className="w-4 h-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('Delete:', row)}
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>IB Portal</span>
        <span>{'>'}</span>
        <span className="text-gray-900 font-medium">Group Management</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Group Management</h1>
        </div>
        <Button
          variant="primary"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Sync MT5 Groups
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="TOTAL GROUPS"
          value={summaryStats.totalGroups.value}
          subtitle="Groups"
          icon={Users}
          iconBg="bg-blue-100"
          valueColor="text-blue-600"
        />

        <StatCard
          title="sol_A GROUPS"
          value={summaryStats.solAGroups.value}
          subtitle="Server A"
          icon={Server}
          iconBg="bg-purple-100"
          valueColor="text-purple-600"
        />

        <StatCard
          title="sol_B GROUPS"
          value={summaryStats.solBGroups.value}
          subtitle="Server B"
          icon={Server}
          iconBg="bg-green-100"
          valueColor="text-green-600"
        />
      </div>

      {/* Trading Account Groups Table */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Trading Account Groups</h2>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-center py-8 text-gray-500 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-ib-500" />
            <span>Loading groups...</span>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-lg font-medium mb-2">No groups found</div>
            <div className="text-sm">No active groups are available in the database.</div>
            <Button variant="outline" className="mt-4" onClick={handleSync}>
              Sync Now
            </Button>
          </div>
        ) : (
          <Table
            rows={groups}
            columns={groupsColumns}
            pageSize={25}
            searchPlaceholder="Search groups..."
            filters={{
              searchKeys: ['groupId'],
              dateKey: 'created',
              selects: [
                {
                  key: 'server',
                  label: 'All Servers',
                  options: [...new Set(groups.map(g => String(g.server)))],
                },
                {
                  key: 'company',
                  label: 'All Companies',
                  options: [...new Set(groups.map(g => g.company))],
                },
              ],
            }}
          />
        )}
      </Card>
    </div>
  );
}

export default TradingGroups;
