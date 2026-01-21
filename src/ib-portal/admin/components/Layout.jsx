import { Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

function Layout() {
  const location = useLocation();

  // Open sidebar by default on small screens, closed on desktop
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024
    }
    return false
  })

  // Collapsed state for desktop sidebar (persisted in localStorage)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('ibAdminSidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleSidebarCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('ibAdminSidebarCollapsed', JSON.stringify(newState));
  };

  // Update sidebar state on resize
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Update page title based on current route
  useEffect(() => {
    const pathname = location.pathname;
    const pageTitle = pathname.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'IB Dashboard';
    document.title = `Solitaire IB Admin : ${pageTitle}`;
  }, [location.pathname]);

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
        className={`flex-1 overflow-x-hidden w-full flex flex-col min-h-screen ${sidebarCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[240px]'}`}
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

        <main className="overflow-x-hidden flex-1 mt-16 md:mt-18 lg:mt-20 p-4 md:p-6 lg:p-8 bg-[#f3f8de]">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout

