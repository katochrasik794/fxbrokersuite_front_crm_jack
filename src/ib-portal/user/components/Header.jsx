import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import authService from '../../../services/auth.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_API_URL || 'https://fxbrokersuite-back-crm-jack.onrender.com/api';

function Header({ onMenuClick, onSidebarToggle, sidebarCollapsed = false }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [userName, setUserName] = useState('User')
  const [kycStatus, setKycStatus] = useState(null)
  const [kycLoading, setKycLoading] = useState(true)
  const profileRef = useRef(null)
  const navigate = useNavigate()

  // Fetch user data and KYC status on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = authService.getUserData()
        if (userData && userData.firstName) {
          const name = userData.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : userData.firstName
          setUserName(name)
        } else {
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
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getKYCStatusBadge = (status) => {
    if (!status) return null
    const statusLower = status.toLowerCase()
    if (statusLower === 'approved') {
      return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">KYC Verified</span>
    } else if (statusLower === 'pending') {
      return <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">KYC Pending</span>
    } else {
      return <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">KYC Unverified</span>
    }
  }

  return (
    <>
      {/* Header Bar - Fixed with rounded corners and shadow */}
      <div className={`bg-white fixed !top-0 left-0 right-0 z-30 border-b border-gray-200 ${sidebarCollapsed ? 'lg:left-[80px]' : 'lg:left-[240px]'}`}>
        <div className="flex justify-between items-center px-4 md:px-6 lg:px-8 py-1.5 md:py-2 lg:py-2.5">
          {/* Left side - Sidebar toggle, Grid icon, User name */}
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

            {/* Mobile logo - moved to start */}
            <div className="lg:hidden flex-shrink-0">
              <Link to="/user/ib/dashboard">
                <img src="/logo.png" alt="fxbrokersuite Markets" className="h-7 md:h-8 w-auto" style={{ background: 'transparent' }} />
              </Link>
            </div>

            {/* Grid icon - hidden on mobile */}
            <button
              onClick={onSidebarToggle}
              className="hidden md:flex items-center justify-center w-9 h-9 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>

            {/* User name / Dashboard text - hidden on mobile */}
            <div className="hidden md:block text-gray-700 font-medium text-sm lg:text-base truncate ml-1">
              <span className="hidden lg:inline">Welcome {userName}</span>
              <span className="lg:hidden">IB Dashboard</span>
            </div>
          </div>

          {/* Right side - Language, KYC Status, Profile */}
          <div className="flex items-center gap-2 md:gap-3 lg:gap-4">

            {/* KYC Status */}
            {!kycLoading && (
              <div className="flex items-center">
                {getKYCStatusBadge(kycStatus)}
              </div>
            )}

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

