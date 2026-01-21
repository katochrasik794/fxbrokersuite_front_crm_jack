import { Route, Navigate } from 'react-router-dom'

// User Pages
import Dashboard from '../pages/Dashboard'
import Deposits from '../pages/Deposits'
import DepositRequest from '../pages/DepositRequest'
import Verification from '../pages/Verification'
import CreateAccount from '../pages/CreateAccount'
import Transfers from '../pages/Transfers'
import Reports from '../pages/Reports'
import Platforms from '../pages/Platforms'
import Legal from '../pages/Legal'
import Support from '../pages/Support'
import PaymentDetails from '../pages/PaymentDetails'
import Settings from '../pages/Settings'

// Withdrawal Pages
import Crypto from '../pages/withdrawals/Crypto'

// Deposit Pages
import GooglePay from '../pages/deposits/GooglePay'
import ApplePay from '../pages/deposits/ApplePay'
import DebitCardDeposit from '../pages/deposits/DebitCard'
import USDTTRC20 from '../pages/deposits/USDTTRC20'
import CregisUSDTTRC20 from '../pages/deposits/CregisUSDTTRC20'
import Bitcoin from '../pages/deposits/Bitcoin'
import USDTERC20 from '../pages/deposits/USDTERC20'
import USDTBEP20 from '../pages/deposits/USDTBEP20'
import Ethereum from '../pages/deposits/Ethereum'
import BankTransfer from '../pages/deposits/BankTransfer'
import OtherCrypto from '../pages/deposits/OtherCrypto'

// Analysis Pages
import SignalCentre from '../pages/analysis/SignalCentre'
import AssetsOverview from '../pages/analysis/AssetsOverview'
import MarketNews from '../pages/analysis/MarketNews'
import MarketCalendar from '../pages/analysis/MarketCalendar'
import ResearchTerminal from '../pages/analysis/ResearchTerminal'
import TradePerformance from '../pages/TradePerformance'
import ApplyAsIB from '../pages/ApplyAsIB'

// Export array of route configurations
const userRoutes = [
  { path: 'dashboard', element: <Dashboard /> },
  { path: 'verification', element: <Verification /> },
  { path: 'create-account', element: <CreateAccount /> },
  { path: 'deposits', element: <Deposits /> },
  { path: 'deposits/:gatewayId', element: <DepositRequest /> },
  { path: 'deposits/google-pay', element: <GooglePay /> },
  { path: 'deposits/apple-pay', element: <ApplePay /> },
  { path: 'deposits/debit-card', element: <DebitCardDeposit /> },
  { path: 'deposits/usdt-trc20', element: <USDTTRC20 /> },
  { path: 'deposits/cregis-usdt-trc20', element: <CregisUSDTTRC20 /> },
  { path: 'deposits/bitcoin', element: <Bitcoin /> },
  { path: 'deposits/usdt-erc20', element: <USDTERC20 /> },
  { path: 'deposits/usdt-bep20', element: <USDTBEP20 /> },
  { path: 'deposits/ethereum', element: <Ethereum /> },
  { path: 'deposits/bank-transfer', element: <BankTransfer /> },
  { path: 'deposits/other-crypto', element: <OtherCrypto /> },
  { path: 'withdrawals', element: <Navigate to="/user/withdrawals/crypto" replace /> },
  { path: 'withdrawals/crypto', element: <Crypto /> },
  { path: 'transfers', element: <Transfers /> },
  { path: 'reports', element: <Reports /> },
  { path: 'analysis/signal-centre', element: <SignalCentre /> },
  { path: 'analysis/assets-overview', element: <AssetsOverview /> },
  { path: 'analysis/market-news', element: <MarketNews /> },
  { path: 'analysis/market-calendar', element: <MarketCalendar /> },
  { path: 'analysis/research-terminal', element: <ResearchTerminal /> },
  { path: 'trade-performance', element: <TradePerformance /> },
  { path: 'platforms', element: <Platforms /> },
  { path: 'legal', element: <Legal /> },
  { path: 'support', element: <Support /> },
  { path: 'payment-details', element: <PaymentDetails /> },
  { path: 'settings', element: <Settings /> },
  { path: 'apply-as-ib', element: <ApplyAsIB /> }
]

// Function to render routes
export function renderUserRoutes() {
  return userRoutes.map((route, index) => (
    <Route key={`user-${route.path}-${index}`} path={route.path} element={route.element} />
  ))
}

export default userRoutes

