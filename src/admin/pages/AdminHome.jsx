function AdminHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-neutral-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-700 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Manage your application from here
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Users</h3>
              <p className="text-3xl font-bold text-blue-600">1,234</p>
              <p className="text-sm text-gray-500 mt-2">Total Users</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Orders</h3>
              <p className="text-3xl font-bold text-green-600">567</p>
              <p className="text-sm text-gray-500 mt-2">Total Orders</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Revenue</h3>
              <p className="text-3xl font-bold text-blue-700">$12.5K</p>
              <p className="text-sm text-gray-500 mt-2">This Month</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
                <h3 className="font-semibold text-blue-800 mb-1">Manage Users</h3>
                <p className="text-sm text-gray-600">View and manage all users</p>
              </button>
              <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
                <h3 className="font-semibold text-green-800 mb-1">View Reports</h3>
                <p className="text-sm text-gray-600">Access analytics and reports</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminHome

