import React, { useState } from 'react';
import Card from '../../../ui/Card';
import StatCard from '../../../ui/StatCard';
import Table from '../../../ui/Table';
import Button from '../../../ui/Button';
import {
  Users,
  CheckCircle,
  Clock,
  Network,
  Eye,
  Search,
  X,
  Info,
} from 'lucide-react';

function ClientLinking() {
  const [clientLogin, setClientLogin] = useState('');
  const [selectedIB, setSelectedIB] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Default Group');
  const [note, setNote] = useState('');

  // Dummy data
  const summaryStats = {
    totalClients: { value: '0' },
    linked: { value: '0' },
    pending: { value: '0' },
    ibs: { value: '0' },
  };

  const ibsList = [
    { id: 1, name: 'AJIT BHANDALKAR', email: 'devanshsaee0809@gmail.com' },
    { id: 2, name: 'Shail Raj', email: 'shailphotography1997@gmail.com' },
    { id: 3, name: 'Amitkumar PATIL', email: 'amitkumarpatil1982@gmail.com' },
    { id: 4, name: 'Mahesh Kumbhar', email: 'kumbharmahesh3810@gmil.com' },
  ];

  const groupsList = [
    'Default Group',
    'Classic',
    'ECN',
    'Plus',
    'Pro',
    'Standard',
    'Startup',
  ];

  // Empty data for now
  const pendingRequestsData = [];
  const linkedClientsData = [];

  const pendingRequestsColumns = [
    {
      key: 'client',
      label: 'Client',
      render: (value, row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.clientName}</p>
          <p className="text-xs text-gray-600">{row.clientEmail}</p>
        </div>
      ),
    },
    {
      key: 'requestedIB',
      label: 'Requested IB',
      render: (value, row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.ibName}</p>
          <p className="text-xs text-gray-600">{row.ibEmail}</p>
        </div>
      ),
    },
    {
      key: 'group',
      label: 'Group',
      render: (value) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
          {value}
        </span>
      ),
    },
    {
      key: 'requested',
      label: 'Requested',
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => console.log('Approve:', row)}>
            Approve
          </Button>
          <Button variant="outline" size="sm" onClick={() => console.log('Reject:', row)}>
            Reject
          </Button>
        </div>
      ),
    },
  ];

  const linkedClientsColumns = [
    {
      key: 'client',
      label: 'Client',
      render: (value, row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.clientName}</p>
          <p className="text-xs text-gray-600">{row.clientEmail}</p>
        </div>
      ),
    },
    {
      key: 'directIB',
      label: 'Direct IB',
      render: (value, row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.ibName}</p>
          <p className="text-xs text-gray-600">{row.ibEmail}</p>
        </div>
      ),
    },
    {
      key: 'group',
      label: 'Group',
      render: (value) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
          {value}
        </span>
      ),
    },
    {
      key: 'linkedOn',
      label: 'Linked On',
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
          {value}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <button
            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
            title="View"
            onClick={() => console.log('View:', row)}
          >
            <Eye className="w-4 h-4" />
          </button>
          <Button variant="outline" size="sm" onClick={() => console.log('Unlink:', row)}>
            Unlink
          </Button>
        </div>
      ),
    },
  ];

  const handlePreview = () => {
    console.log('Preview:', { clientLogin, selectedIB, selectedGroup, note });
  };

  const handleLink = () => {
    console.log('Link (Coming Soon)');
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Linking</h1>
        <p className="text-gray-600">Assign clients to direct IBs per group</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clients"
          value={summaryStats.totalClients.value}
          icon={Users}
          iconBg="bg-blue-100"
          valueColor="text-blue-600"
        />

        <StatCard
          title="Linked"
          value={summaryStats.linked.value}
          icon={CheckCircle}
          iconBg="bg-green-100"
          valueColor="text-green-600"
        />

        <StatCard
          title="Pending"
          value={summaryStats.pending.value}
          icon={Clock}
          iconBg="bg-orange-100"
          valueColor="text-orange-600"
        />

        <StatCard
          title="IBs"
          value={summaryStats.ibs.value}
          icon={Network}
          iconBg="bg-purple-100"
          valueColor="text-purple-600"
        />
      </div>

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assign Client to IB */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Assign Client to IB</h2>
            <Button variant="outline" size="sm" icon={Eye}>
              Preview
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client (Login/Email)
              </label>
              <input
                type="text"
                placeholder="Client login or email"
                value={clientLogin}
                onChange={(e) => setClientLogin(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Direct IB
              </label>
              <select
                value={selectedIB}
                onChange={(e) => setSelectedIB(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
              >
                <option value="">Select IB...</option>
                {ibsList.map((ib) => (
                  <option key={ib.id} value={ib.id}>
                    {ib.name} ({ib.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
              >
                {groupsList.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note
              </label>
              <input
                type="text"
                placeholder="Optional note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="primary" onClick={handlePreview} className="bg-purple-600 hover:bg-purple-700 text-white">
                Preview
              </Button>
              <Button variant="outline" onClick={handleLink} disabled className="bg-purple-100 border-purple-300 text-purple-800 opacity-60 cursor-not-allowed">
                Link (Coming Soon)
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">Linking validates IB entitlements and budgets.</p>
            </div>
          </div>
        </Card>

        {/* Pending Linking Requests */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pending Linking Requests</h2>
            <Button variant="outline" size="sm">
              Open Requests
            </Button>
          </div>

          {pendingRequestsData.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">No pending requests</p>
            </div>
          ) : (
            <Table
              rows={pendingRequestsData}
              columns={pendingRequestsColumns}
              pageSize={10}
              searchPlaceholder="Search requests..."
            />
          )}
        </Card>
      </div>

      {/* Linked Clients */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Linked Clients</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 focus:border-ib-500 outline-none"
              />
            </div>
          </div>
        </div>

        {linkedClientsData.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600">No linked clients yet</p>
          </div>
        ) : (
          <Table
            rows={linkedClientsData}
            columns={linkedClientsColumns}
            pageSize={25}
            searchPlaceholder="Search clients..."
            filters={{
              searchKeys: ['clientName', 'clientEmail', 'ibName'],
              selects: [
                {
                  key: 'group',
                  label: 'All Groups',
                  options: groupsList,
                },
                {
                  key: 'status',
                  label: 'All Statuses',
                  options: ['Active', 'Inactive'],
                },
              ],
              dateKey: 'linkedOn',
            }}
          />
        )}
      </Card>
    </div>
  );
}

export default ClientLinking;
