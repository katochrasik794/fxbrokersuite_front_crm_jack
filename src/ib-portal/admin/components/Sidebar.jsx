import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

function Sidebar({ isOpen, onClose, collapsed = false }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [openSubmenus, setOpenSubmenus] = useState({
    groupManagement: false,
    ibManagement: false
  })

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // Auto-open submenus when on a submenu page
  useEffect(() => {
    if (location.pathname.startsWith('/admin/ib/group-management/')) {
      setOpenSubmenus(prev => ({ ...prev, groupManagement: true }))
    }
    if (location.pathname.startsWith('/admin/ib/ib-management/')) {
      setOpenSubmenus(prev => ({ ...prev, ibManagement: true }))
    }
  }, [location.pathname])

  const toggleSubmenu = (menu) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }))
  }

  const handleBackToAdmin = () => {
    navigate('/admin/dashboard')
  }

  const handleLogout = () => {
    // Admin logout logic here
    navigate('/admin/login')
  }

  const isActive = (path) => location.pathname === `/admin/ib${path}`

  return (
    <div
      className={`bg-white h-screen fixed left-0 top-0 shadow-lg flex flex-col z-50 transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${collapsed ? 'lg:!w-[80px]' : 'lg:!w-[240px]'}`}
      style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', width: '100%', maxWidth: '100%' }}
    >
      {/* Logo with Close Button */}
      <div className={`bg-transparent pt-2 pb-2 flex-shrink-0 flex items-center ${collapsed ? 'justify-center px-2' : 'justify-between pl-8 pr-6'}`}>
        {collapsed ? (
          <img src="/logo.png" alt="Solitaire Markets" className="h-8 w-8 object-contain" style={{ background: 'transparent' }} />
        ) : (
          <>
            <img src="/logo.png" alt="Solitaire Markets" className="h-10 w-auto " style={{ background: 'transparent' }} />
            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Separator Line - Aligned with navbar */}
      {!collapsed && <div className="border-b border-gray-200 mx-6"></div>}

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div className="px-3 space-y-0.5 pb-4 pt-2">
          {/* IB Dashboard */}
          <Link
            to="/admin/ib/dashboard"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 transition-colors relative rounded-lg ${isActive('/dashboard')
              ? 'bg-[#c8f300] text-dark-base'
              : 'text-gray-700 hover:bg-[#effe92] hover:text-gray-900'
              }`}
            style={{}}
            title={collapsed ? 'IB Dashboard' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">IB Dashboard</span>}
          </Link>

          {/* Overview */}
          <Link
            to="/admin/ib/overview"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 transition-colors relative rounded-lg ${isActive('/overview')
              ? 'bg-[#c8f300] text-dark-base'
              : 'text-gray-700 hover:bg-[#effe92] hover:text-gray-900'
              }`}
            style={{}}
            title={collapsed ? 'Overview' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">Overview</span>}
          </Link>

          {/* IB Profile */}
          <Link
            to="/admin/ib/ib-profile"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 transition-colors relative rounded-lg ${isActive('/ib-profile')
              ? 'bg-[#c8f300] text-dark-base'
              : 'text-gray-700 hover:bg-[#effe92] hover:text-gray-900'
              }`}
            style={{}}
            title={collapsed ? 'IB Profile' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">IB Profile</span>}
          </Link>

          {/* IB Requests */}
          <Link
            to="/admin/ib/ib-requests"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 transition-colors relative rounded-lg ${isActive('/ib-requests')
              ? 'bg-[#c8f300] text-dark-base'
              : 'text-gray-700 hover:bg-[#effe92] hover:text-gray-900'
              }`}
            style={{}}
            title={collapsed ? 'IB Requests' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">IB Requests</span>}
          </Link>

          {/* Commission Distribution */}
          <Link
            to="/admin/ib/commission-distribution"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 transition-colors relative rounded-lg ${isActive('/commission-distribution')
              ? 'bg-[#c8f300] text-dark-base'
              : 'text-gray-700 hover:bg-[#effe92] hover:text-gray-900'
              }`}
            style={{}}
            title={collapsed ? 'Commission Distribution' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">Commission Distribution</span>}
          </Link>

          {/* Symbols Pip Values */}
          <Link
            to="/admin/ib/symbols-pip-values"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 transition-colors relative rounded-lg ${isActive('/symbols-pip-values')
              ? 'bg-[#c8f300] text-dark-base'
              : 'text-gray-700 hover:bg-[#effe92] hover:text-gray-900'
              }`}
            style={{}}
            title={collapsed ? 'Symbols Pip Values' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">Symbols Pip Values</span>}
          </Link>

          {/* Group Management */}
          <div>
            <button
              onClick={() => toggleSubmenu('groupManagement')}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} ${collapsed ? 'px-2' : 'px-4'} py-3 transition-colors relative rounded-lg ${location.pathname.startsWith('/admin/ib/group-management')
                ? 'bg-[#c8f300] text-dark-base'
                : 'text-gray-700 hover:bg-[#effe92] hover:text-gray-900'
                }`}
              style={{}}
              title={collapsed ? 'Group Management' : undefined}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {!collapsed && <span className="text-sm font-normal">Group Management</span>}
              </div>
              {!collapsed && (
                <svg
                  className={`w-4 h-4 flex-shrink-0 transition-transform ${openSubmenus.groupManagement ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
            {openSubmenus.groupManagement && !collapsed && (
              <div className="ml-8 mt-1 space-y-1">
                <Link
                  to="/admin/ib/group-management/trading-groups"
                  className={`block px-4 py-2 rounded-lg transition-colors ${isActive('/group-management/trading-groups')
                    ? 'bg-[#effe92] hover:bg-[#dbfb3d] text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-[#effe92] hover:text-gray-900'
                    }`}
                >
                  <span className="text-sm font-normal">Trading Groups</span>
                </Link>
                <Link
                  to="/admin/ib/group-management/commission-distribution"
                  className={`block px-4 py-2 rounded-lg transition-colors ${isActive('/group-management/commission-distribution')
                    ? 'bg-[#effe92] hover:bg-[#dbfb3d] text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-[#effe92] hover:text-gray-900'
                    }`}
                >
                  <span className="text-sm font-normal">Commission Distribution</span>
                </Link>
              </div>
            )}
          </div>

          {/* IB Management */}
          <div>
            <button
              onClick={() => toggleSubmenu('ibManagement')}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} ${collapsed ? 'px-2' : 'px-4'} py-3 transition-colors relative rounded-lg ${location.pathname.startsWith('/admin/ib/ib-management')
                ? 'bg-[#c8f300] text-dark-base'
                : 'text-gray-700 hover:bg-[#effe92] hover:text-gray-900'
                }`}
              style={{}}
              title={collapsed ? 'IB Management' : undefined}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {!collapsed && <span className="text-sm font-normal">IB Management</span>}
              </div>
              {!collapsed && (
                <svg
                  className={`w-4 h-4 flex-shrink-0 transition-transform ${openSubmenus.ibManagement ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
            {openSubmenus.ibManagement && !collapsed && (
              <div className="ml-8 mt-1 space-y-1">
                <Link
                  to="/admin/ib/ib-management/client-linking"
                  className={`block px-4 py-2 rounded-lg transition-colors ${isActive('/ib-management/client-linking')
                    ? 'bg-[#effe92] hover:bg-[#dbfb3d] text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-[#effe92] hover:text-gray-900'
                    }`}
                >
                  <span className="text-sm font-normal">Client Linking</span>
                </Link>
                <Link
                  to="/admin/ib/ib-management/withdrawal-management"
                  className={`block px-4 py-2 rounded-lg transition-colors ${isActive('/ib-management/withdrawal-management')
                    ? 'bg-[#effe92] hover:bg-[#dbfb3d] text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-[#effe92] hover:text-gray-900'
                    }`}
                >
                  <span className="text-sm font-normal">Withdrawal Management</span>
                </Link>
              </div>
            )}
          </div>

          {/* Back to Admin */}
          <button
            onClick={handleBackToAdmin}
            className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 transition-colors relative rounded-lg text-red-600 hover:bg-red-50`}
            style={{}}
            title={collapsed ? 'Back to Admin' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">Back to Admin</span>}
          </button>
        </div>
      </nav>
    </div>
  )
}

export default Sidebar

