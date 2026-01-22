import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'

function Header({ onMenuClick, onSidebarToggle, sidebarCollapsed = false }) {
  const [languageOpen, setLanguageOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const languageRef = useRef(null)
  const profileRef = useRef(null)
  const navigate = useNavigate()

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setLanguageOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      {/* Header Bar - Fixed with rounded corners and shadow */}
      <div className={`bg-white fixed !top-0 left-0 right-0 z-30 border-b border-gray-200 ${sidebarCollapsed ? 'lg:left-[80px]' : 'lg:left-[240px]'}`}>
        <div className="flex justify-between items-center px-4 md:px-6 lg:px-8 py-1.5 md:py-2 lg:py-2.5">
          {/* Left side - Sidebar toggle, Grid icon, Title */}
          <div className="flex items-center gap-2 md:gap-3 lg:gap-4 flex-1 min-w-0">
            {/* Mobile hamburger - only on mobile */}
            <button
              onClick={onMenuClick}
              className="lg:hidden flex items-center justify-center w-8 h-8 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Grid icon - hidden on mobile */}
            <button
              onClick={onSidebarToggle}
              className="hidden md:flex items-center justify-center w-9 h-9 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>

            {/* Title text - hidden on mobile */}
            <div className="hidden md:block text-gray-700 font-medium text-sm lg:text-base truncate ml-1">
              <span className="hidden lg:inline">IB Admin Portal</span>
              <span className="lg:hidden">IB Admin</span>
            </div>

            {/* Mobile logo - centered */}
            <div className="lg:hidden absolute left-1/2 transform -translate-x-1/2">
              <Link to="/admin/ib/dashboard">
                <img src="/logo.png" alt="fxbrokersuite Markets" className="h-7 w-auto" style={{ background: 'transparent' }} />
              </Link>
            </div>
          </div>

          {/* Right side - Language, Profile */}
          <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
            {/* Language Selector */}
            <div className="relative" ref={languageRef}>
              <button
                onClick={() => setLanguageOpen(!languageOpen)}
                className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm md:text-base"
              >
                <span>English</span>
                <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Header

