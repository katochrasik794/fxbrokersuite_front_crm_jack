import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import authService from '../../../services/auth.js'

function Sidebar({ isOpen, onClose, collapsed = false, tourActiveItem = null }) {
  const location = useLocation()
  const navigate = useNavigate()

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const handleBackToMain = () => {
    navigate('/user/dashboard')
  }

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === `/user/ib${path}`
  const isTourHighlight = (path) => tourActiveItem === path;

  // Pulse animation class for tour highlight
  const pulseClass = "ring-4 ring-blue-600 ring-opacity-50 animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.4)] z-10 scale-105";

  return (
    <div
      className={`bg-white h-screen fixed left-0 top-0 shadow-lg flex flex-col z-50 transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${collapsed ? 'lg:!w-[80px]' : 'lg:!w-[240px]'}`}
      style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', width: '100%', maxWidth: '100%' }}
    >
      {/* Logo with Close Button */}
      <div className={`bg-transparent pt-4 pb-2 flex-shrink-0 flex items-center ${collapsed ? 'justify-center px-2' : 'justify-between pl-8 pr-6'}`}>
        {collapsed ? (
          <img src="/logo.png" alt="fxbrokersuite Markets" className="h-8 w-8 object-contain" style={{ background: 'transparent' }} />
        ) : (
          <>
            <img src="/logo.png" alt="fxbrokersuite Markets" className="h-10 w-auto " style={{ background: 'transparent' }} />
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
            to="/user/ib/dashboard"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 transition-all relative rounded-lg ${isActive('/dashboard')
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-brand-50 hover:text-gray-900'
              } ${isTourHighlight('/dashboard') ? pulseClass : ''}`}
            style={{}}
            title={collapsed ? 'IB Dashboard' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">IB Dashboard</span>}
          </Link>

          {/* Account Overview */}
          <Link
            to="/user/ib/account-overview"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 transition-all relative rounded-lg ${isActive('/account-overview')
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-brand-50 hover:text-gray-900'
              } ${isTourHighlight('/account-overview') ? pulseClass : ''}`}
            style={{}}
            title={collapsed ? 'Account Overview' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">Account Overview</span>}
          </Link>

          {/* Commission Analytics */}
          <Link
            to="/user/ib/commission-analytics"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 transition-all relative rounded-lg ${isActive('/commission-analytics')
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-brand-50 hover:text-gray-900'
              } ${isTourHighlight('/commission-analytics') ? pulseClass : ''}`}
            style={{}}
            title={collapsed ? 'Commission Analytics' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">Commission Analytics</span>}
          </Link>

          {/* My Clients */}
          <Link
            to="/user/ib/my-clients"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 transition-all relative rounded-lg ${isActive('/my-clients')
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-brand-50 hover:text-gray-900'
              } ${isTourHighlight('/my-clients') ? pulseClass : ''}`}
            style={{}}
            title={collapsed ? 'My Clients' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">My Clients</span>}
          </Link>

          {/* IB Tree */}
          <Link
            to="/user/ib/ib-tree"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 transition-all relative rounded-lg ${isActive('/ib-tree')
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-brand-50 hover:text-gray-900'
              } ${isTourHighlight('/ib-tree') ? pulseClass : ''}`}
            style={{}}
            title={collapsed ? 'IB Tree' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">IB Tree</span>}
          </Link>

          {/* Referral Report */}
          <Link
            to="/user/ib/referral-report"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 transition-all relative rounded-lg ${isActive('/referral-report')
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-brand-50 hover:text-gray-900'
              } ${isTourHighlight('/referral-report') ? pulseClass : ''}`}
            style={{}}
            title={collapsed ? 'Referral Report' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">Referral Report</span>}
          </Link>

          {/* My Commission */}
          <Link
            to="/user/ib/my-commission"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 transition-all relative rounded-lg ${isActive('/my-commission')
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-brand-50 hover:text-gray-900'
              } ${isTourHighlight('/my-commission') ? pulseClass : ''}`}
            style={{}}
            title={collapsed ? 'My Commission' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">My Commission</span>}
          </Link>

          {/* Withdrawals */}
          <Link
            to="/user/ib/withdrawals"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 transition-all relative rounded-lg ${isActive('/withdrawals')
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-brand-50 hover:text-gray-900'
              } ${isTourHighlight('/withdrawals') ? pulseClass : ''}`}
            style={{}}
            title={collapsed ? 'Withdrawals' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <rect x="4" y="6" width="16" height="12" rx="2" strokeWidth="2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18V12m0 0l-3 3m3-3l3 3" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">Withdrawals</span>}
          </Link>

          {/* Pip Calculator */}
          <Link
            to="/user/ib/pip-calculator"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 transition-all relative rounded-lg ${isActive('/pip-calculator')
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-brand-50 hover:text-gray-900'
              } ${isTourHighlight('/pip-calculator') ? pulseClass : ''}`}
            style={{}}
            title={collapsed ? 'Pip Calculator' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">Pip Calculator</span>}
          </Link>

          {/* IB Profile Settings */}
          <Link
            to="/user/ib/profile-settings"
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 transition-all relative rounded-lg ${isActive('/profile-settings')
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-brand-50 hover:text-gray-900'
              } ${isTourHighlight('/profile-settings') ? pulseClass : ''}`}
            style={{}}
            title={collapsed ? 'IB Profile Settings' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">IB Profile Settings</span>}
          </Link>

          {/* Back to Main Dashboard */}
          <button
            onClick={handleBackToMain}
            className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 transition-colors relative rounded-lg text-gray-700 hover:bg-gray-100`}
            style={{}}
            title={collapsed ? 'Back to Main Dashboard' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={collapsed ? {} : { marginRight: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {!collapsed && <span className="text-sm font-normal">Back to Main Dashboard</span>}
          </button>
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

