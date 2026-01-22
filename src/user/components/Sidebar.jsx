import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import authService from '../../services/auth.js'
import { getEnabledMenuPaths, getEnabledMenuPathsSync } from '../../services/menuService.js'

function Sidebar({ isOpen, onClose, collapsed = false }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [openSubmenus, setOpenSubmenus] = useState({
    analysis: false
  })
  // Initialize with cached data immediately (synchronous) to prevent flicker
  const [enabledMenus, setEnabledMenus] = useState(() => getEnabledMenuPathsSync())
  const [menusLoading, setMenusLoading] = useState(false) // Start as false since we have cache
  const [ibStatus, setIbStatus] = useState(() => {
    const user = authService.getUserData()
    // Prioritize user data from authService if available
    if (user && (user.ib_status || user.ibStatus)) {
      return user.ib_status || user.ibStatus
    }
    return localStorage.getItem('ibStatusCache')
  })

  // Fetch enabled menus on mount (refresh from API in background)
  useEffect(() => {
    const loadEnabledMenus = async () => {
      try {
        const enabledPaths = await getEnabledMenuPaths()
        setEnabledMenus(enabledPaths)
      } catch (error) {
        console.error('Error loading enabled menus:', error)
        // On error, keep using cached data or show all menus
        const cached = getEnabledMenuPathsSync()
        if (cached.size > 0) {
          setEnabledMenus(cached)
        } else {
          // Only show all menus if no cache exists
          setEnabledMenus(new Set())
        }
      }
    }
    // Only fetch if we don't have cached data
    if (enabledMenus.size === 0) {
      setMenusLoading(true)
      loadEnabledMenus().finally(() => setMenusLoading(false))
    } else {
      // Still refresh in background to get latest data
      loadEnabledMenus()
    }
  }, [])

  // Fetch IB status
  useEffect(() => {
    const fetchIBStatus = async () => {
      try {
        const token = authService.getToken()
        if (!token) {
          setIbStatus('not-approved')
          return
        }

        const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api'
        const response = await fetch(`${API_BASE_URL}/ib-requests/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data && data.data.status === 'approved') {
            setIbStatus('approved')
            localStorage.setItem('ibStatusCache', 'approved')
          } else {
            setIbStatus('not-approved')
            localStorage.setItem('ibStatusCache', 'not-approved')
          }
        } else {
          setIbStatus('not-approved')
          localStorage.setItem('ibStatusCache', 'not-approved')
        }
      } catch (error) {
        console.error('Error fetching IB status:', error)
        setIbStatus('not-approved')
        localStorage.setItem('ibStatusCache', 'not-approved')
      }
    }

    fetchIBStatus()
  }, [])

  // Auto-open submenus when on a submenu page
  useEffect(() => {
    if (location.pathname.startsWith('/user/analysis/')) {
      setOpenSubmenus(prev => ({ ...prev, analysis: true }))
    }
  }, [location.pathname])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const toggleSubmenu = (menu) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }))
  }

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === `/user${path}`
  const isSubmenuActive = (paths) => paths.some(path => location.pathname === `/user${path}`)

  // Check if a menu is enabled
  const isMenuEnabled = (routePath) => {
    // If we have cached data, use it
    if (enabledMenus.size > 0) {
      return enabledMenus.has(routePath);
    }

    // If no cache AND not loading, show all (fallback)
    if (!menusLoading) {
      return true;
    }

    // While loading for the first time with NO cache, show all to prevent empty sidebar
    return true;
  }

  // Check if a submenu item is enabled (also checks if parent is enabled)
  const isSubMenuEnabled = (routePath) => {
    if (enabledMenus.size === 0 && !menusLoading) {
      return true
    }

    // Extract parent path
    const parts = routePath.split('/')
    if (parts.length > 1) {
      const parentPath = parts[0]
      // Check if parent is enabled first
      if (!enabledMenus.has(parentPath)) {
        return false // Parent disabled, so submenu is disabled
      }
    }

    // Check if the specific sub-menu is enabled
    return enabledMenus.has(routePath)
  }

  // Check if a parent menu has any enabled children (and parent itself is enabled)
  const hasEnabledChildren = (parentPath) => {
    if (enabledMenus.size === 0 && !menusLoading) {
      return true
    }

    // First check if parent itself is enabled
    if (!enabledMenus.has(parentPath)) {
      return false // Parent disabled, so no children shown
    }

    // Check if there are any enabled submenus
    return Array.from(enabledMenus).some(path => path.startsWith(parentPath + '/'))
  }

  return (
    <div
      className={`bg-white h-screen fixed left-0 top-0 border-r border-gray-100 flex flex-col z-50 transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${collapsed ? 'lg:!w-[80px]' : 'lg:!w-[240px]'}`}
      style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', width: '100%', maxWidth: '100%' }}
    >
      {/* Logo with Close Button */}
      <div className={`bg-transparent pt-4 pb-2 flex-shrink-0 flex items-center ${collapsed ? 'justify-center px-2' : 'justify-between pl-8 pr-6'}`}>
        {collapsed ? (
          <img src="/logo.png" alt="fxbrokersuite Markets" className="h-8 w-8 object-contain" style={{ background: 'transparent' }} />
        ) : (
          <>
            <img src="/logo.png" alt="fxbrokersuite Markets" className="h-14 w-auto " style={{ background: 'transparent' }} />
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
          {/* Dashboard */}
          {isMenuEnabled('dashboard') && <Link
            to="/user/dashboard"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4 mx-3'} py-3 mb-1 transition-colors relative rounded-xl ${isActive('/dashboard')
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            style={{}}
            title={collapsed ? 'Dashboard' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">Dashboard</span>}
          </Link>}

          {/* Deposits */}
          {isMenuEnabled('deposits') && <Link
            to="/user/deposits"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4 mx-3'} py-3 mb-1 transition-colors relative rounded-xl ${isActive('/deposits')
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            style={{}}
            title={collapsed ? 'Deposits' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <rect x="4" y="6" width="16" height="12" rx="2" strokeWidth="2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0l-3-3m3 3l3-3" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">Deposits</span>}
          </Link>}

          {/* Withdrawals */}
          {isMenuEnabled('withdrawals') && <Link
            to="/user/withdrawals"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4 mx-3'} py-3 mb-1 transition-colors relative rounded-xl ${isActive('/withdrawals') || isActive('/withdrawals/crypto')
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            style={{}}
            title={collapsed ? 'Withdrawals' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <rect x="4" y="6" width="16" height="12" rx="2" strokeWidth="2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18V12m0 0l-3 3m3-3l3 3" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">Withdrawals</span>}
          </Link>}

          {/* Transfers */}
          {isMenuEnabled('transfers') && <Link
            to="/user/transfers"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4 mx-3'} py-3 mb-1 transition-colors relative rounded-xl ${isActive('/transfers')
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            style={{}}
            title={collapsed ? 'Transfers' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">Transfers</span>}
          </Link>}

          {/* Payment Details */}
          {isMenuEnabled('payment-details') && <Link
            to="/user/payment-details"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4 mx-3'} py-3 mb-1 transition-colors relative rounded-xl ${isActive('/payment-details')
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            style={{}}
            title={collapsed ? 'Payment Details' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">Payment Details</span>}
          </Link>}

          {/* Reports */}
          {isMenuEnabled('reports') && <Link
            to="/user/reports"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4 mx-3'} py-3 mb-1 transition-colors relative rounded-xl ${isActive('/reports')
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            style={{}}
            title={collapsed ? 'Reports' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">Reports</span>}
          </Link>}

          {/* Trade Performance */}
          {isMenuEnabled('trade-performance') && (
            <Link
              to="/user/trade-performance"
              className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 transition-colors rounded-lg ${isActive('/trade-performance')
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              title={collapsed ? 'Trade Performance' : undefined}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {!collapsed && <span className="text-sm font-normal">Trade Performance</span>}
            </Link>
          )}

          {/* Analysis */}
          {hasEnabledChildren('analysis') && <div>
            <button
              onClick={() => toggleSubmenu('analysis')}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} ${collapsed ? 'px-2' : 'px-4 mx-3'} py-3 mb-1 transition-colors relative rounded-xl ${isSubmenuActive(['/analysis', '/analysis/signal-centre', '/analysis/assets-overview', '/analysis/market-news', '/analysis/market-calendar', '/analysis/research-terminal'])
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              style={{}}
              title={collapsed ? 'Analysis' : undefined}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
                  <circle cx="11" cy="11" r="8" strokeWidth="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
                </svg>
                {!collapsed && <span className="text-sm font-normal">Analysis</span>}
              </div>
              {!collapsed && (
                <svg
                  className={`w-4 h-4 flex-shrink-0 transition-transform ${openSubmenus.analysis ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
            {openSubmenus.analysis && !collapsed && (
              <div className="ml-8 mt-1 space-y-1">
                {isSubMenuEnabled('analysis/signal-centre') && <Link
                  to="/user/analysis/signal-centre"
                  className={`block px-4 py-2 mx-3 mb-1 rounded-xl transition-colors ${isActive('/analysis/signal-centre')
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-gray-600 hover:bg-brand-50 hover:text-brand-900'
                    }`}
                >
                  <span className="text-sm font-normal">Signal Centre</span>
                </Link>}
                {isSubMenuEnabled('analysis/assets-overview') && <Link
                  to="/user/analysis/assets-overview"
                  className={`block px-4 py-2 mx-3 mb-1 rounded-xl transition-colors ${isActive('/analysis/assets-overview')
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-gray-600 hover:bg-brand-50 hover:text-brand-900'
                    }`}
                >
                  <span style={{ fontSize: '14px', fontFamily: 'Roboto, sans-serif', fontWeight: '400' }}>Assets Overview</span>
                </Link>}
                {isSubMenuEnabled('analysis/market-news') && <Link
                  to="/user/analysis/market-news"
                  className={`block px-4 py-2 mx-3 mb-1 rounded-xl transition-colors ${isActive('/analysis/market-news')
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-gray-600 hover:bg-brand-50 hover:text-brand-900'
                    }`}
                >
                  <span style={{ fontSize: '14px', fontFamily: 'Roboto, sans-serif', fontWeight: '400' }}>Market News</span>
                </Link>}
                {isSubMenuEnabled('analysis/market-calendar') && <Link
                  to="/user/analysis/market-calendar"
                  className={`block px-4 py-2 mx-3 mb-1 rounded-xl transition-colors ${isActive('/analysis/market-calendar')
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-gray-600 hover:bg-brand-50 hover:text-brand-900'
                    }`}
                >
                  <span style={{ fontSize: '14px', fontFamily: 'Roboto, sans-serif', fontWeight: '400' }}>Market Calendar</span>
                </Link>}
                {isSubMenuEnabled('analysis/research-terminal') && <Link
                  to="/user/analysis/research-terminal"
                  className={`block px-4 py-2 mx-3 mb-1 rounded-xl transition-colors ${isActive('/analysis/research-terminal')
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-gray-600 hover:bg-brand-50 hover:text-brand-900'
                    }`}
                >
                  <span style={{ fontSize: '14px', fontFamily: 'Roboto, sans-serif', fontWeight: '400' }}>Research Terminal</span>
                </Link>}
              </div>
            )}
          </div>}

          {/* Platforms */}
          {isMenuEnabled('platforms') && <Link
            to="/user/platforms"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4 mx-3'} py-3 mb-1 transition-colors relative rounded-xl ${isActive('/platforms')
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            style={{}}
            title={collapsed ? 'Platforms' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">Platforms</span>}
          </Link>}

          {/* fxbrokersuite Support */}
          {isMenuEnabled('support') && <Link
            to="/user/support"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4 mx-3'} py-3 mb-1 transition-colors relative rounded-xl ${isActive('/support')
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            style={{}}
            title={collapsed ? 'fxbrokersuite Support' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">fxbrokersuite Support</span>}
          </Link>}

          {/* Partner's Cabinet / Apply as IB */}
          {ibStatus === 'approved' ? (
            <Link
              to="/user/ib/dashboard"
              className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4 mx-3'} py-3 mb-1 transition-colors relative rounded-xl ${location.pathname.startsWith('/user/ib')
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              style={{}}
              title={collapsed ? "Partner's Cabinet" : undefined}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {!collapsed && <span className="text-sm font-normal">Partner's Cabinet</span>}
            </Link>
          ) : (
            <Link
              to="/user/apply-as-ib"
              className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4 mx-3'} py-3 mb-1 transition-colors relative rounded-xl ${isActive('/apply-as-ib')
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              style={{}}
              title={collapsed ? 'Apply as IB' : undefined}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              {!collapsed && <span className="text-sm font-normal">Apply as IB</span>}
            </Link>
          )}
        </div>
      </nav>

      {/* Logout Button - Fixed at bottom */}
      <div className={`${collapsed ? 'p-2' : 'p-4'} pb-0 flex-shrink-0`}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-start'} ${collapsed ? 'px-2' : 'px-4'} py-3 bg-black hover:bg-gray-900 rounded-lg transition-colors`}
          style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '500', color: '#3b82f6' }}
          title={collapsed ? 'Logout' : undefined}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#3b82f6', ...(collapsed ? {} : { marginRight: '8px' }) }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span style={{ color: '#3b82f6' }}>Logout</span>}
        </button>
      </div>
    </div>
  )
}

export default Sidebar

