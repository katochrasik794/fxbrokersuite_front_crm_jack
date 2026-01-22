import { Link, useLocation } from 'react-router-dom'

function AdminSidebar() {
  const location = useLocation()

  const isActive = (path) => location.pathname === `/admin${path}`

  return (
    <div className="w-64 bg-white h-screen fixed left-0 top-0 shadow-lg">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-blue-600">fxbrokersuite Admin</h1>
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        <div className="px-4 space-y-1">
          {/* Dashboard */}
          <Link
            to="/admin"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('') || isActive('/')
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-50'
              }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="font-medium">Dashboard</span>
          </Link>

          {/* Users */}
          <Link
            to="/admin/users"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/users')
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-50'
              }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="font-medium">Users</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}

export default AdminSidebar

