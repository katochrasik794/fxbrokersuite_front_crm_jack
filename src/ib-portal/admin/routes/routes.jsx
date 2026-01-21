import { Route } from 'react-router-dom'

// IB Admin Pages
import Dashboard from '../pages/Dashboard'
import Overview from '../pages/Overview'
import IBProfile from '../pages/IBProfile'
import ViewIbProfileDetails from '../pages/ViewIbProfileDetails'
import CommissionDistribution from '../pages/CommissionDistribution'
import SymbolsPipValues from '../pages/SymbolsPipValues'
import IBRequests from '../pages/IBRequests'

// Group Management Pages
import TradingGroups from '../pages/GroupManagement/TradingGroups'
import GroupManagementCommissionDistribution from '../pages/GroupManagement/CommissionDistribution'

// IB Management Pages
import ClientLinking from '../pages/IBManagement/ClientLinking'
import WithdrawalManagement from '../pages/IBManagement/WithdrawalManagement'

// Export array of route configurations
const ibAdminRoutes = [
  { path: 'dashboard', element: <Dashboard /> },
  { path: 'overview', element: <Overview /> },
  { path: 'ib-profile', element: <IBProfile /> },
  { path: 'ib-profile/:id', element: <ViewIbProfileDetails /> },
  { path: 'ib-requests', element: <IBRequests /> },
  { path: 'commission-distribution', element: <CommissionDistribution /> },
  { path: 'symbols-pip-values', element: <SymbolsPipValues /> },
  { path: 'group-management/trading-groups', element: <TradingGroups /> },
  { path: 'group-management/commission-distribution', element: <GroupManagementCommissionDistribution /> },
  { path: 'ib-management/client-linking', element: <ClientLinking /> },
  { path: 'ib-management/withdrawal-management', element: <WithdrawalManagement /> },
  { path: '', element: <Dashboard /> }, // Default route to dashboard
]

// Function to render routes
export function renderIBAdminRoutes() {
  return ibAdminRoutes.map((route, index) => (
    <Route key={`ib-admin-${route.path}-${index}`} path={route.path} element={route.element} />
  ))
}

export default ibAdminRoutes

