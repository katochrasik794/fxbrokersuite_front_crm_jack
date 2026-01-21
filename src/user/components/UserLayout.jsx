import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import Footer from './Footer'
import Ticker from './Ticker'
import { AiOutlineInfoCircle, AiOutlineCheckCircle, AiOutlineClose } from "react-icons/ai";
import authService from '../../services/auth.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Route to title mapping
const routeTitles = {
  '/user/dashboard': 'Dashboard',
  '/user/verification': 'Verification',
  '/user/create-account': 'Create Account',
  '/user/deposits': 'Deposits',
  '/user/deposits/google-pay': 'Google Pay',
  '/user/deposits/apple-pay': 'Apple Pay',
  '/user/deposits/debit-card': 'Debit Card Deposit',
  '/user/deposits/usdt-trc20': 'USDT TRC20',
  '/user/deposits/bitcoin': 'Bitcoin',
  '/user/deposits/usdt-erc20': 'USDT ERC20',
  '/user/deposits/usdt-bep20': 'USDT BEP20',
  '/user/deposits/ethereum': 'Ethereum',
  '/user/deposits/bank-transfer': 'Bank Transfer',
  '/user/deposits/other-crypto': 'Other Crypto',
  '/user/withdrawals': 'Withdrawals',
  '/user/withdrawals/crypto': 'Crypto Withdrawal',
  '/user/transfers': 'Transfers',
  '/user/reports': 'Reports',
  '/user/trade-performance': 'Trade Performance',
  '/user/analysis/signal-centre': 'Signal Centre',
  '/user/analysis/assets-overview': 'Assets Overview',
  '/user/analysis/market-news': 'Market News',
  '/user/analysis/market-calendar': 'Market Calendar',
  '/user/analysis/research-terminal': 'Research Terminal',
  '/user/platforms': 'Platforms',
  '/user/legal': 'Legal Terms'
};

function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Open sidebar by default on small screens, closed on desktop
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024
    }
    return false
  })

  // Collapsed state for desktop sidebar (persisted in localStorage)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('userSidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleSidebarCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('userSidebarCollapsed', JSON.stringify(newState));
  };

  const [kycStatus, setKycStatus] = useState(() => {
    const user = authService.getUserData();
    return user?.kyc_status || null;
  })
  const [topTickers, setTopTickers] = useState([])
  const [middleTickers, setMiddleTickers] = useState([])
  const [dismissedTickers, setDismissedTickers] = useState(new Set())

  // Success ticker state (persisted)
  const [showSuccessTicker, setShowSuccessTicker] = useState(() => {
    return !localStorage.getItem('hide_kyc_success_ticker');
  });

  // Update sidebar state on resize
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth >= 1024) {
        // On desktop, sidebar is always visible (not controlled by state)
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Update page title based on current route
  useEffect(() => {
    const pathname = location.pathname;
    const pageTitle = routeTitles[pathname] || 'Dashboard';
    document.title = `Solitaire : ${pageTitle}`;
  }, [location.pathname]);

  // Check KYC status on mount
  useEffect(() => {
    const checkKYCStatus = async () => {
      try {
        const token = authService.getToken()
        if (!token) return

        const response = await fetch(`${API_BASE_URL}/kyc/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setKycStatus(data.data.status)
          }
        }
      } catch (err) {
        console.error('Error checking KYC status:', err)
      }
    }

    checkKYCStatus()
  }, [])

  // Fetch active tickers on mount
  useEffect(() => {
    const fetchTickers = async () => {
      try {
        // Fetch all active tickers (both positions)
        const response = await fetch(`${API_BASE_URL}/tickers?is_active=true`)

        if (!response.ok) {
          console.error('Tickers API response not OK:', response.status, response.statusText)
          return
        }

        const data = await response.json()

        console.log('Tickers API response:', data)

        if (data.success && Array.isArray(data.data)) {
          // Separate by position and sort by priority
          const top = data.data
            .filter(t => t.position === 'top' && t.is_active === true)
            .sort((a, b) => (b.priority || 0) - (a.priority || 0))
          const middle = data.data
            .filter(t => t.position === 'middle' && t.is_active === true)
            .sort((a, b) => (b.priority || 0) - (a.priority || 0))

          console.log('Top tickers:', top)
          console.log('Middle tickers:', middle)

          setTopTickers(top)
          setMiddleTickers(middle)
        } else {
          console.error('Tickers API error - invalid response format:', data)
          // Set empty arrays if response is invalid
          setTopTickers([])
          setMiddleTickers([])
        }
      } catch (err) {
        console.error('Error fetching tickers:', err)
        // Set empty arrays on error
        setTopTickers([])
        setMiddleTickers([])
      }
    }

    fetchTickers()

    // Refresh tickers every 30 seconds to get updates
    const interval = setInterval(fetchTickers, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleTickerClose = (tickerId) => {
    setDismissedTickers(prev => new Set([...prev, tickerId]))
  }

  const handleDismissSuccess = () => {
    setShowSuccessTicker(false);
    localStorage.setItem('hide_kyc_success_ticker', 'true');
  };

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
      />

      <div
        className={`flex-1 overflow-x-hidden w-full relative z-10 transition-all duration-300 flex flex-col min-h-screen ${sidebarCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[240px]'}`}
        onClick={() => {
          // Close sidebar when clicking on main content area on mobile
          if (typeof window !== 'undefined' && window.innerWidth < 1024 && sidebarOpen) {
            setSidebarOpen(false)
          }
        }}
      >
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onSidebarToggle={toggleSidebarCollapse}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Middle Position Tickers - Between navbar and content (accounting for fixed header + margin) */}
        <div className="pt-[64px] md:pt-[68px] lg:pt-[72px] relative z-30">
          {middleTickers
            .filter(ticker => !dismissedTickers.has(ticker.id))
            .map(ticker => (
              <Ticker
                key={ticker.id}
                ticker={ticker}
                onClose={() => handleTickerClose(ticker.id)}
              />
            ))}
        </div>

        <main className="overflow-x-hidden flex-1">
          {/* Top Position Tickers - Above verification banner */}
          <div className="relative z-30">
            {topTickers
              .filter(ticker => !dismissedTickers.has(ticker.id))
              .map(ticker => (
                <Ticker
                  key={ticker.id}
                  ticker={ticker}
                  onClose={() => handleTickerClose(ticker.id)}
                />
              ))}
          </div>

          {/* Success Ticker - Show when KYC is approved AND not dismissed */}
          {kycStatus === 'approved' && showSuccessTicker && (
            <div className="w-full bg-green-50 border-t border-green-200 px-4 md:px-6 py-3 transition-all duration-300">
              <div className="flex items-center justify-center relative">
                <div className="flex items-center gap-2 text-green-800 text-sm md:text-base font-medium text-center pr-8">
                  <AiOutlineCheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span>Your KYC has been approved now you can start your trading activities</span>
                </div>

                <button
                  onClick={handleDismissSuccess}
                  className="absolute right-0 text-green-800 hover:text-green-900 p-1 rounded-full hover:bg-green-100 transition-colors"
                  aria-label="Dismiss"
                >
                  <AiOutlineClose className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Deposit Banner - Hide when KYC is approved or loading */}
          {kycStatus !== 'approved' && kycStatus !== null && (
            <div className="w-full bg-[#FFF9E6] border-t border-[#f3e7b5] px-4 md:px-6 py-4">
              {/* MOBILE LAYOUT */}
              <div className="flex items-center justify-center gap-3 md:hidden">
                <AiOutlineInfoCircle className="w-5 h-5 text-black" />
                <Link to="/user/verification" className="text-black underline text-sm hover:text-gray-700 transition">
                  Complete verification
                </Link>
              </div>

              {/* DESKTOP LAYOUT */}
              <div className="hidden md:flex items-center justify-center gap-3">
                <AiOutlineInfoCircle className="w-6 h-6 text-black" />
                <Link to="/user/verification" className="text-black underline text-sm md:text-base hover:text-gray-700 transition">
                  Complete verification
                </Link>
              </div>
            </div>
          )}

          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}

export default UserLayout

