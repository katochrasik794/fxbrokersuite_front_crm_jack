// src/routes/adminRoutes.jsx
import BrandCard from "../components/BrandCard.jsx";
import ProTable from "../components/ProTable.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ReportsBookPnL from "../pages/ReportsBookPnL.jsx";
import ReportsProfitLoss from "../pages/ReportsProfitLoss.jsx";
import ReportsLPStatement from "../pages/ReportsLPStatement.jsx";
import ReportsPartnerReport from "../pages/ReportsPartnerReport.jsx";
import ReportsDeposits from "../pages/ReportsDeposits.jsx";
import ReportsWithdrawals from "../pages/ReportsWithdrawals.jsx";
import ReportsInternalTransfers from "../pages/ReportsInternalTransfers.jsx";
import ReportsBonusDeposits from "../pages/ReportsBonusDeposits.jsx";
import ReportsBonusWithdrawals from "../pages/ReportsBonusWithdrawals.jsx";
import ReportsAdminTransactions from "../pages/ReportsAdminTransactions.jsx";
import ReportsWallet from "../pages/ReportsWallet.jsx";
import KycList from "../pages/KycList.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import UsersAll from "../pages/UsersAll.jsx";
import AssignRoles from "../pages/AssignRoles.jsx";
import AdminProfile from "../pages/AdminProfile.jsx";
import PaymentGatewaysAutomatic from "../pages/PaymentGatewaysAutomatic.jsx";
import PaymentGatewaysManual from "../pages/PaymentGatewaysManual.jsx";
import PaymentGatewaysWithdrawal from "../pages/PaymentGatewaysWithdrawal.jsx";
import UsersView from "../pages/UsersView.jsx";
import UsersActive from "../pages/UsersActive.jsx";
import UsersBanned from "../pages/UsersBanned.jsx";
import UsersEmailUnverified from "../pages/UsersEmailUnverified.jsx";
import UsersKycUnverified from "../pages/UsersKycUnverified.jsx";
import UsersKycPending from "../pages/UsersKycPending.jsx";
import AddUser from "../pages/AddUser.jsx";
import UsersWithBalance from "../pages/UsersWithBalance.jsx";
import MT5Users from "../pages/MT5Users.jsx";
import MT5Assign from "../pages/MT5Assign.jsx";
import MT5Transfer from "../pages/MT5Transfer.jsx";
import DepositsPending from "../pages/DepositsPending.jsx";
import DepositsApproved from "../pages/DepositsApproved.jsx";
import DepositsRejected from "../pages/DepositsRejected.jsx";
import DepositsAll from "../pages/DepositsAll.jsx";
import WithdrawalsPending from "../pages/WithdrawalsPending.jsx";
import WithdrawalsApproved from "../pages/WithdrawalsApproved.jsx";
import WithdrawalsRejected from "../pages/WithdrawalsRejected.jsx";
import WithdrawalsAll from "../pages/WithdrawalsAll.jsx";
import BulkLogs from "../pages/BulkLogs.jsx";
import ActivityLogs from "../pages/ActivityLogs.jsx";
import Logout from "../pages/Logout.jsx";
import PaymentDetails from "../pages/PaymentDetails.jsx";
import SupportTicketsList from "../pages/SupportTicketsList.jsx";
import SupportTicketView from "../pages/SupportTicketView.jsx";
import AssignCountryPartner from "../pages/AssignCountryPartner.jsx";
import AssignedCountryAdmins from "../pages/AssignedCountryAdmins.jsx";
import GroupManagement from "../pages/GroupManagement.jsx";
import AdminLogs from "../pages/AdminLogs.jsx";
import UserLogs from "../pages/UserLogs.jsx";
import LogDetail from "../pages/LogDetail.jsx";
import AdminLogsByAdmin from "../pages/AdminLogsByAdmin.jsx";
import GroupReport from "../pages/GroupReport.jsx";
import SendEmails from "../pages/SendEmails.jsx";
import EmailTemplates from "../pages/EmailTemplates.jsx";
import TemplateAssignments from "../pages/TemplateAssignments.jsx";
import Tickers from "../pages/ContentManagement/Tickers.jsx";
import Promotions from "../pages/ContentManagement/Promotions.jsx";
import MenuManagement from "../pages/MenuManagement.jsx";
import IBRequests from "../pages/IBRequests.jsx";
import AllActions from "../pages/AllActions.jsx";
/** Admin Dashboard */

export default [
  /* ----------------------------- TRADING ------------------------------ */
  { path: "dashboard",     element: <Dashboard /> },
  { path: "book-positions",element: <EmptyState title="Book Positions" subtitle="Monitor open positions" /> },
  { path: "book-deals",    element: <EmptyState title="Book Deals" subtitle="All trade deals" /> },
  { path: "traded-lots",   element: <EmptyState title="Open Tickets" subtitle="All traded lots" /> },
  { path: "my-deals",      element: <EmptyState title="My Deals" subtitle="My executed trades" /> },

  /* ----------------------------- REPORTS ------------------------------ */
  { path: "book-pnl",      element: <ReportsBookPnL /> },
  { path: "finance",       element: <ReportsProfitLoss /> },
  { path: "lp-statement",  element: <ReportsLPStatement /> },
  { path: "ib-dashboard",  element: <ReportsPartnerReport /> },
  { path: "deposit-report",        element: <ReportsDeposits /> },
  { path: "withdrawal-report",     element: <ReportsWithdrawals /> },
  { path: "internal-transfer",     element: <ReportsInternalTransfers /> },
  { path: "bonus-deposit-report",  element: <ReportsBonusDeposits /> },
  { path: "bonus-withdrawal-report", element: <ReportsBonusWithdrawals /> },
  { path: "admin-transactions", element: <ReportsAdminTransactions /> },
  { path: "wallet-report", element: <ReportsWallet /> },

  /* ------------------------ CLIENTS & ACCESS -------------------------- */
  { path: "users",                     element: <EmptyState title="Manage Users" subtitle="User management overview" /> },
  { path: "users/add",                 element: <AddUser /> },
  { path: "users/all",                 element: <UsersAll /> },
  { path: "users/:id",                 element: <UsersView /> },
  { path: "users/active",              element: <UsersActive /> },
  { path: "users/banned",              element: <UsersBanned /> },
  { path: "users/email-unverified",    element: <UsersEmailUnverified /> },
  { path: "users/kyc-unverified",      element: <UsersKycUnverified /> },
  { path: "users/kyc-pending",         element: <UsersKycPending /> },
  { path: "users/with-balance",        element: <UsersWithBalance /> },
  { path: "kyc",                       element: <KycList /> },
  { path: "activity-logs",             element: <ActivityLogs /> },

  /* --------------------------- BOOK MGMT ------------------------------ */
  { path: "book-management",                 element: <EmptyState title="Book Management" subtitle="Configure A/B/Combined books" /> },
  { path: "book-management/a-book",          element: <EmptyState title="A Book Management" subtitle="A-Book routing & settings" /> },
  { path: "book-management/b-book",          element: <EmptyState title="B Book Management" subtitle="B-Book risk & exposure" /> },
  { path: "book-management/combined",        element: <EmptyState title="Combined Book" subtitle="Aggregated view" /> },
  { path: "book-management/liquidity-pool",  element: <EmptyState title="Liquidity Pool Report" subtitle="Pool balances & flow" /> },

  /* --------------------------- MT5 MANAGEMENT ------------------------- */
  { path: "mt5",            element: <EmptyState title="MT5 Management" subtitle="Manager tools" /> },
  { path: "mt5/users",      element: <MT5Users /> },
  { path: "mt5/assign",     element: <MT5Assign /> },
  { path: "mt5/transfer",   element: <MT5Transfer /> },
  { path: "mt5/group-management", element: <GroupManagement /> },
  { path: "mt5/group-report", element: <GroupReport /> },

  /* ----------------------- EMAIL MANAGEMENT ------------------------ */
  { path: "send-emails", element: <SendEmails /> },
  { path: "email-templates", element: <EmailTemplates /> },
  { path: "email-templates/assignments", element: <TemplateAssignments /> },

  /* --------------------------- FINANCE & OPS -------------------------- */
  // Deposits
  { path: "deposits",              element: <EmptyState title="Manage Deposits" subtitle="Overview" /> },
  { path: "deposits/pending",      element: <DepositsPending /> },
  { path: "deposits/approved",     element: <DepositsApproved /> },
  { path: "deposits/rejected",     element: <DepositsRejected /> },
  { path: "deposits/all",          element: <DepositsAll /> },

  // Withdrawals
  { path: "withdrawals",           element: <EmptyState title="Manage Withdrawals" subtitle="Overview" /> },
  { path: "withdrawals/pending",   element: <WithdrawalsPending /> },
  { path: "withdrawals/approved",  element: <WithdrawalsApproved /> },
  { path: "withdrawals/rejected",  element: <WithdrawalsRejected /> },
  { path: "withdrawals/all",       element: <WithdrawalsAll /> },

  // Payment Gateways
  { path: "payment-gateways",              element: <EmptyState title="Payment Gateways" subtitle="Automatic & manual gateways" /> },
  { path: "payment-gateways/automatic",    element: <PaymentGatewaysAutomatic /> },
  { path: "payment-gateways/manual",       element: <PaymentGatewaysManual /> },
  { path: "payment-gateways/withdrawal",   element: <PaymentGatewaysWithdrawal /> },
  { path: "payment-details",               element: <PaymentDetails /> },
  { path: "usdt-gateways/manual",       element: <EmptyState title="USDT Gateway" subtitle="USDT Gateway Integration" /> },

  // Support Tickets
  { path: "support/open",    element: <SupportTicketsList status="opened" /> },
  { path: "support/closed",  element: <SupportTicketsList status="closed" /> },
  { path: "support/tickets/:id", element: <SupportTicketView /> },

  // IB Requests
  { path: "ib-requests", element: <IBRequests /> },

  { path: "bulk-logs",          element: <BulkLogs /> },

  /* ------------------------------ SYSTEM ------------------------------ */
  { path: "mt5-connection",      element: <EmptyState title="MT5 Connection" subtitle="Manager API credentials" /> },
  { path: "settings",            element: <EmptyState title="System Settings" subtitle="Branding, storage, integrations" /> },
  { path: "roles",               element: <EmptyState title="Roles" subtitle="Create & manage roles" /> },
  { path: "prize-lots",          element: <EmptyState title="Manage Prize Lots" subtitle="Promo lots" /> },
  { path: "lot-pricing",         element: <EmptyState title="Set Lot Pricing" subtitle="Pricing matrix" /> },
  { path: "prize-distribution",  element: <EmptyState title="Prize Distribution" subtitle="Campaign payouts" /> },
  { path: "profile",             element: <AdminProfile /> },
  { path: "assign-roles",        element: <AssignRoles /> },
  { path: "menu-management",    element: <MenuManagement /> },
  { path: "assign-country-partner", element: <AssignCountryPartner /> },
  { path: "assigned-country-admins", element: <AssignedCountryAdmins /> },

  /* ------------------------ CONTENT MANAGEMENT ------------------------ */
  { path: "content-management/tickers", element: <Tickers /> },
  { path: "content-management/promotions", element: <Promotions /> },

  /* ------------------------------ LOGS -------------------------------- */
  { path: "logs/admin", element: <AdminLogs /> },
  { path: "logs/user", element: <UserLogs /> },
  { path: "logs/admin/detail/:logId", element: <LogDetail /> },
  { path: "logs/user/detail/:logId", element: <LogDetail /> },
  { path: "logs/admin/by-admin", element: <AdminLogsByAdmin /> },
  { path: "logs/all-actions", element: <AllActions /> },

  /* ------------------------------ AUTH -------------------------------- */
  { path: "logout", element: <Logout /> },
];

