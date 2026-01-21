import { Route } from 'react-router-dom'

// IB User Pages
import Dashboard from '../pages/Dashboard'
import AccountOverview from '../pages/AccountOverview'
import CommissionAnalytics from '../pages/CommissionAnalytics'
import MyClients from '../pages/MyClients'
import IBTree from '../pages/IBTree'
import ReferralReport from '../pages/ReferralReport'
import MyCommission from '../pages/MyCommission'
import Withdrawals from '../pages/Withdrawals'
import PipCalculator from '../pages/PipCalculator'
import IBProfileSettings from '../pages/IBProfileSettings'
import PlansComparison from '../pages/PlansComparison'

// Export array of route configurations
const ibRoutes = [
  { path: 'dashboard', element: <Dashboard /> },
  { path: 'account-overview', element: <AccountOverview /> },
  { path: 'commission-analytics', element: <CommissionAnalytics /> },
  { path: 'my-clients', element: <MyClients /> },
  { path: 'ib-tree', element: <IBTree /> },
  { path: 'referral-report', element: <ReferralReport /> },
  { path: 'my-commission', element: <MyCommission /> },
  { path: 'withdrawals', element: <Withdrawals /> },
  { path: 'pip-calculator', element: <PipCalculator /> },
  { path: 'profile-settings', element: <IBProfileSettings /> },
  { path: 'plans-comparison', element: <PlansComparison /> },
  { path: '', element: <Dashboard /> }, // Default route to dashboard
]

// Function to render routes
export function renderIBRoutes() {
  return ibRoutes.map((route, index) => (
    <Route key={`ib-${route.path}-${index}`} path={route.path} element={route.element} />
  ))
}

export default ibRoutes

