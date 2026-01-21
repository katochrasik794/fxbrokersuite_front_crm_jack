import { Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useNavigate } from 'react-router-dom'
import authService from '../../../services/auth'
import ibService from '../../../services/ibService'
import Toast from '../../../components/Toast'
import { CheckCircle, ArrowUpRight, Activity } from 'lucide-react'
import TourModal from './TourModal'

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [enrollingPlan, setEnrollingPlan] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [tourActivePath, setTourActivePath] = useState(null);

  // Open sidebar by default on small screens, closed on desktop
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024
    }
    return false
  })

  // Collapsed state for desktop sidebar (persisted in localStorage)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('ibSidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleSidebarCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('ibSidebarCollapsed', JSON.stringify(newState));
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
    document.title = `Solitaire IB Portal : ${pageTitle}`;
  }, [location.pathname]);

  // Real-time ban/lock check
  useEffect(() => {
    const checkBanStatus = async () => {
      try {
        const res = await authService.verifyToken();
        if (res.success) {
          const user = res.data?.user;
          setUserProfile(user);

          if (user?.isBanned) {
            setToast({
              message: 'Your IB status is locked due to abnormal activities. Please contact support.',
              type: 'error'
            });
            setTimeout(() => {
              navigate('/user/support');
            }, 2000);
          }

          // Trigger plan modal if master IB and plan is NULL
          if (user?.ibType === 'master' && !user?.planType) {
            setShowPlanModal(true);
          } else {
            setShowPlanModal(false);

            // Show tour if it hasn't been seen yet
            const tourSeen = localStorage.getItem(`ib_tour_seen_${user?.id}`);
            if (!tourSeen) {
              setShowTour(true);
            }
          }
        }
      } catch (err) {
        console.error('Ban check error:', err);
      }
    };

    checkBanStatus();
    const interval = setInterval(checkBanStatus, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleSelectPlan = async (planType) => {
    try {
      setEnrollingPlan(true);
      const res = await ibService.selectPlan(planType);
      if (res.success) {
        setToast({ message: res.message, type: 'success' });
        setShowPlanModal(false);
        // Reload to refresh everything
        window.location.reload();
      } else {
        setToast({ message: res.message || 'Activation failed', type: 'error' });
      }
    } catch (error) {
      setToast({ message: error.message || 'Plan activation failed', type: 'error' });
    } finally {
      setEnrollingPlan(false);
    }
  };

  const handleTourComplete = () => {
    if (userProfile?.id) {
      localStorage.setItem(`ib_tour_seen_${userProfile.id}`, 'true');
    }
    setShowTour(false);
    setTourActivePath(null);
  };

  const handleStepChange = (step) => {
    setTourActivePath(step.targetPath);
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
        tourActiveItem={tourActivePath}
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

        <main className="overflow-x-hidden flex-1 mt-16 md:mt-18 lg:mt-20 p-4 md:p-6 lg:p-8">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>

      {/* Mandatory Plan Selection Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl transform transition-all border border-gray-100 overflow-hidden my-auto">
            <div className="p-8 text-center bg-ib-600">
              <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Welcome to Master IB Portal</h2>
              <p className="text-ib-100 text-lg">Please select a plan to activate your dashboard</p>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Normal Plan */}
                <button
                  type="button"
                  onClick={() => handleSelectPlan('normal')}
                  disabled={enrollingPlan}
                  className="group relative flex flex-col p-6 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left disabled:opacity-50"
                >
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-black rounded-full uppercase tracking-tighter">
                      Basic Rewards
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Normal Plan</h3>
                  <p className="text-sm text-gray-500 mb-6">Direct trader focus. Unlimited trader invites with multi-level pip rewards from their activity.</p>
                  <div className="mt-auto flex items-center text-blue-600 font-bold text-sm group-hover:gap-2 transition-all">
                    <span>Activate Now</span>
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </div>
                </button>

                {/* Advanced Plan */}
                <button
                  type="button"
                  onClick={() => handleSelectPlan('advanced')}
                  disabled={enrollingPlan}
                  className="group relative flex flex-col p-6 rounded-2xl border-2 border-purple-500 bg-purple-50 shadow-md text-left disabled:opacity-50"
                >
                  <div className="absolute top-4 right-4 text-purple-600">
                    <CheckCircle className="w-6 h-6 fill-current bg-white rounded-full" />
                  </div>
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-purple-100 text-purple-600 text-[10px] font-black rounded-full uppercase tracking-tighter">
                      Maximum Earnings
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Advanced Plan</h3>
                  <p className="text-sm text-gray-500 mb-6">Enhanced override capabilities and custom link structures for sub-IBs.</p>
                  <div className="mt-auto flex items-center text-purple-600 font-bold text-sm">
                    <span>Activate Now</span>
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </div>
                </button>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex flex-col gap-3">
                <div className="flex gap-3">
                  <div className="p-1 bg-amber-100 rounded-full h-fit">
                    <Activity className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed font-bold uppercase tracking-tight">
                    Once selected, Master plan can't be changed.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowPlanModal(false);
                    navigate('/user/ib/plans-comparison');
                  }}
                  className="text-xs text-ib-600 font-bold underline hover:text-ib-800 transition-colors text-left pl-7"
                >
                  View more about Normal and Advanced Plan
                </button>
              </div>
            </div>

            {enrollingPlan && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ib-600"></div>
                  <p className="text-gray-900 font-bold animate-pulse uppercase tracking-widest text-xs">Activating Your Plan...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* IB Onboarding Tour */}
      {showTour && !showPlanModal && (
        <TourModal
          onComplete={handleTourComplete}
          onStepChange={handleStepChange}
        />
      )}
    </div>
  )
}

export default Layout

