import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import authService from '../../services/auth.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api';

function Header({ onMenuClick, onSidebarToggle, sidebarCollapsed = false }) {
  const [languageOpen, setLanguageOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [userName, setUserName] = useState('User')
  const [kycStatus, setKycStatus] = useState(null)
  const [kycLoading, setKycLoading] = useState(true)
  const [showKycTooltip, setShowKycTooltip] = useState(false)
  const languageRef = useRef(null)
  const profileRef = useRef(null)
  const kycTooltipRef = useRef(null)
  const navigate = useNavigate()

  // Fetch user data and KYC status on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Try to get from localStorage first
        const userData = authService.getUserData()
        if (userData && userData.firstName) {
          const name = userData.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : userData.firstName
          setUserName(name)
        } else {
          // If not in localStorage, verify token to get fresh data
          const result = await authService.verifyToken()
          if (result.success && result.data && result.data.user) {
            const user = result.data.user
            const name = user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.firstName
            setUserName(name)
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        // Keep default "User" if fetch fails
      }
    }

    const fetchKYCStatus = async () => {
      try {
        const token = authService.getToken()
        if (!token) {
          setKycLoading(false)
          return
        }

        const response = await fetch(`${API_BASE_URL}/kyc/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          setKycStatus('unverified')
          setKycLoading(false)
          return
        }

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setKycStatus(data.data.status?.toLowerCase() || 'unverified')
          } else {
            setKycStatus('unverified')
          }
        } else {
          setKycStatus('unverified')
        }
      } catch (error) {
        console.error('Error fetching KYC status:', error)
        setKycStatus('unverified')
      } finally {
        setKycLoading(false)
      }
    }

    fetchUserData()
    fetchKYCStatus()

    // Refresh KYC status every 30 seconds
    const kycInterval = setInterval(fetchKYCStatus, 30000)
    return () => clearInterval(kycInterval)
  }, [])

  const handleLogout = () => {
    // Clear authentication token
    authService.logout()
    // Close dropdown
    setProfileOpen(false)
    // Redirect to login page
    navigate('/login')
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside language dropdown
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setLanguageOpen(false)
      }
      // Check if click is outside desktop profile dropdown
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
      // Check if click is outside KYC tooltip
      if (kycTooltipRef.current && !kycTooltipRef.current.contains(event.target)) {
        setShowKycTooltip(false)
      }
    }

    // Use a small delay to allow click events on dropdown items to fire first
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const languages = [
    'عربي',
    'Española',
    'Português',
    'ไทย',
    'Tagalog',
    '한국인',
    '中文简体',
    'Tiếng Việt'
  ]

  return (
    <>
      {/* Header Bar - Fixed with rounded corners and shadow */}
      {/* On mobile: full width, On desktop: starts after sidebar */}
      <div className={`bg-white fixed top-0 left-0 right-0 lg:right-0 z-40 transition-all duration-300 ${sidebarCollapsed ? 'lg:left-[80px]' : 'lg:left-[240px]'}`}>
        <div className="mx-1.5 md:mx-2 mt-1.5 mb-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center px-2 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5">
              {/* Left side - Sidebar toggle, Logo, Grid icon, User name */}
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

                {/* Header Logo - left aligned on mobile, hidden on desktop (managed by sidebar) */}
                <Link to="/user/dashboard" className="lg:hidden flex items-center">
                  <img src="/logo.png" alt="fxbrokersuite Markets" className="h-6 md:h-7 w-auto" style={{ background: 'transparent' }} />
                </Link>

                {/* Grid icon - hidden on mobile */}
                <button className="hidden md:flex items-center justify-center w-9 h-9 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>

                {/* User name / Dashboard text - hidden on mobile */}
                <div className="hidden md:block text-gray-700 font-medium text-sm lg:text-base truncate ml-1">
                  <span className="hidden lg:inline">Welcome {userName}</span>
                  <span className="lg:hidden">Dashboard</span>
                </div>
              </div>

              {/* Right side - Language, Notifications, Profile */}
              <div className="flex items-center gap-1.5 md:gap-2 lg:gap-3 flex-shrink-0">
                {/* Language Selector - hidden on mobile */}
                <div className="relative hidden md:block" ref={languageRef}>
                  <button
                    onClick={() => setLanguageOpen(!languageOpen)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    style={{ fontFamily: 'Roboto, sans-serif', fontSize: '13px', fontWeight: '400' }}
                  >
                    <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden lg:inline text-sm">English</span>
                    <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {languageOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <div className="py-2">
                        {languages.map((lang, index) => (
                          <button
                            key={index}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${lang === 'Española' ? 'text-[#00A896]' : 'text-gray-700'
                              }`}
                            style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '400' }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setLanguageOpen(false)
                            }}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* KYC Verification Badge */}
                {!kycLoading && (
                  <div className="relative" ref={kycTooltipRef}>
                    {kycStatus === 'approved' ? (
                      <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1 bg-green-100 text-green-700 rounded-lg border border-green-200">
                        <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-[10px] md:text-xs font-medium whitespace-nowrap">
                          KYC Verified
                        </span>
                      </div>
                    ) : (
                      <Link
                        to="/user/verification"
                        className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors relative border border-amber-200"
                        onMouseEnter={() => setShowKycTooltip(true)}
                        onMouseLeave={() => setShowKycTooltip(false)}
                      >
                        <span className="text-[10px] md:text-xs font-medium whitespace-nowrap">
                          KYC Unverified
                        </span>
                        <div className="relative">
                          <svg className="w-3.5 h-3.5 md:w-4 md:h-4 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {showKycTooltip && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-gray-900 text-white text-[10px] md:text-xs rounded px-2 py-1.5 whitespace-nowrap z-50">
                              Click here to verify
                              <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                            </div>
                          )}
                        </div>
                      </Link>
                    )}
                  </div>
                )}

                {/* User Profile */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>

                  {profileOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <div className="py-2">
                        <div className="px-4 py-2 text-gray-700 border-b border-gray-200">
                          <span className="text-sm font-medium">{userName}</span>
                        </div>
                        <Link
                          to="/user/settings"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                          style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '400' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setProfileOpen(false)
                          }}
                        >
                          My Settings
                        </Link>
                        <Link
                          to="/user/support"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                          style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '400' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setProfileOpen(false)
                          }}
                        >
                          fxbrokersuite Support
                        </Link>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          className="block w-full text-left px-4 py-2 text-[#00A896] hover:bg-gray-50"
                          style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '400' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLogout()
                          }}
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Header

