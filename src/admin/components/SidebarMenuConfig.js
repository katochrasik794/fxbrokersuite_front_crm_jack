import {
  LayoutDashboard, Users, User, ShieldCheck, Settings, ServerCog, PlugZap, Database, Building2, Mail,
  Boxes, FolderKanban, LineChart, BarChart3, Calculator, FileText, ClipboardList,
  KeySquare, UserCog, Banknote, IndianRupee, Newspaper, Signal, Link, Link2,
  GitBranch, Network, Copy, Layers, ListChecks, Wallet, CreditCard, QrCode, Activity, Terminal, Headphones, Send, Image
} from "lucide-react";

// Extract all features dynamically from ADMIN_MENU
export function extractAllFeaturesFromMenu() {
  const featureMap = new Map(); // To avoid duplicates and store icon/label
  
  function processItem(item) {
    if (!item.to) return;
    
    // Extract path - remove leading /admin/ if present, then remove leading /
    let path = item.to.replace(/^\/admin\//, '').replace(/^\//, '');
    
    // Extract the main feature path (first part before /)
    const mainPath = path.split('/')[0];
    
    if (mainPath && !featureMap.has(mainPath)) {
      featureMap.set(mainPath, {
        path: mainPath,
        name: item.label || mainPath,
        icon: item.icon || Settings
      });
    }
    
    // Process children if they exist
    if (item.children && Array.isArray(item.children)) {
      item.children.forEach(child => {
        if (!child.to) return;
        let childPath = child.to.replace(/^\/admin\//, '').replace(/^\//, '');
        // Extract the main feature path (first part before /)
        const childMainPath = childPath.split('/')[0];
        if (childMainPath && !featureMap.has(childMainPath)) {
          featureMap.set(childMainPath, {
            path: childMainPath,
            name: child.label || childMainPath,
            icon: child.icon || item.icon || Settings
          });
        }
      });
    }
  }
  
  ADMIN_MENU.forEach(section => {
    if (section.items && Array.isArray(section.items)) {
      section.items.forEach(processItem);
    }
  });
  
  return Array.from(featureMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// Get all available features (for super admin - all features)
export function getAllFeatures() {
  return extractAllFeaturesFromMenu();
}

// Role-based feature access - superadmin gets all features automatically
// Made lazy to avoid initialization order issues
export function getSuperAdminFeatures() {
  return getAllFeatures().map(f => f.path);
}

export const ROLE_FEATURES = {
  // Note: superadmin features are now computed dynamically via getSuperAdminFeatures()
  // Other roles will be stored in DB as custom roles
};

// Function to filter menu based on admin role
// For superadmin, return all menu items
// For other roles, check permissions from DB (handled in AuthContext)
export function getMenuForRole(role, customFeatures = []) {
  // Super admin gets all features
  if (role === 'superadmin') {
    return ADMIN_MENU;
  }
  
  // For other roles, use custom features if provided
  // ROLE_FEATURES is now empty, all roles are custom and stored in DB
  const allowedFeatures = customFeatures.length > 0 ? customFeatures : [];
  
  return ADMIN_MENU.map(section => ({
    ...section,
    items: section.items.filter(item => {
      // Extract the path from the 'to' property
      const path = item.to.replace(/^\/admin\//, '').replace(/^\//, '');
      const mainPath = path.split('/')[0];
      // Always include logout button for all roles
      if (mainPath === 'logout') return true;
      return allowedFeatures.includes(mainPath);
    })
  })).filter(section => {
    // Always include SYSTEM section if it has logout
    if (section.label === 'SYSTEM') {
      const hasLogout = section.items.some(item => {
        const path = item.to.replace(/^\/admin\//, '').replace(/^\//, '');
        const mainPath = path.split('/')[0];
        return mainPath === 'logout';
      });
      if (hasLogout) return true;
    }
    return section.items.length > 0;
  });
}

/* -------------------- SUPER ADMIN -------------------- */
export const SUPERADMIN_MENU = [
  {
    label: "OVERVIEW",
    items: [{ icon: LayoutDashboard, label: "Dashboard", to: "/sa/dashboard" }],
  },
  {
    label: "ADMINS & TENANTS",
    items: [
      { icon: Users, label: "Manage Admins", to: "/sa/admins" },
      { icon: Building2, label: "Assign Tenants", to: "/sa/tenants" },
      { icon: ShieldCheck, label: "Global Roles", to: "/sa/roles" },
    ],
  },
  {
    label: "PLATFORM",
    items: [
      { icon: Settings, label: "Platform Settings", to: "/sa/settings" },
      { icon: PlugZap, label: "Integrations", to: "/sa/integrations" },
      { icon: Database, label: "Storage", to: "/sa/storage" },
      { icon: ServerCog, label: "MT5 Connections", to: "/sa/mt5-connections" },
    ],
  },
  {
    label: "COMPLIANCE & BILLING",
    items: [
      { icon: Mail, label: "KYC Providers", to: "/sa/kyc-providers" },
      { icon: Settings, label: "Billing", to: "/sa/billing" },
      { icon: Settings, label: "Audit Logs", to: "/sa/audit-logs" },
    ],
  },
];

/* -------------------- ADMIN -------------------- */
export const ADMIN_MENU = [
  {
    label: "ADMIN PANEL",
    items: [{ icon: LineChart, label: "Dashboard", to: "dashboard" }],
  },
  {
    label: "CLIENTS & ACCESS",
    items: [
      {
        icon: Users,
        label: "Manage Users",
        to: "users",
        children: [
          { label: "Add User", to: "users/add" },
          { label: "All Users", to: "users/all" },
          { label: "Active Users", to: "users/active" },
          { label: "Banned Users", to: "users/banned" },
          { label: "Email Unverified", to: "users/email-unverified" },
          { label: "KYC Unverified", to: "users/kyc-unverified" },
          { label: "KYC Pending", to: "users/kyc-pending" },
          { label: "With Balance", to: "users/with-balance" },
        ],
      },
      { icon: ShieldCheck, label: "KYC Verifications", to: "kyc" },
      { icon: Send, label: "Send Emails", to: "send-emails" },
      {
        icon: FileText,
        label: "Email Templates",
        to: "email-templates",
        children: [
          { label: "Manage Templates", to: "email-templates" },
          { icon: Link2, label: "Template Assignments", to: "email-templates/assignments" },
        ],
      },
      { icon: ClipboardList, label: "Activity Logs", to: "activity-logs" },
    ],
  },
  {
    label: "SUPPORT",
    items: [
      {
        icon: Headphones,
        label: "Support Tickets",
        to: "support/open",
        children: [
          { label: "Opened Tickets", to: "support/open" },
          { label: "Closed Tickets", to: "support/closed" },
        ],
      },
    ],
  },
  {
    label: "MT5 MANAGEMENT",
    items: [
      {
        icon: LayoutDashboard,
        label: "MT5 Management",
        to: "mt5",
        children: [
          { label: "MT5 Users List", to: "mt5/users" },
          { label: "Assign MT5 to Email", to: "mt5/assign" },
          { label: "Group Management", to: "mt5/group-management" },
          { label: "Group Report", to: "mt5/group-report" },
          { label: "Internal Transfer", to: "mt5/transfer" },
        ],
      },
    ],
  },
  {
    label: "IB MANAGEMENT",
    items: [
      { icon: User, label: "IB Portal", to: "ib/dashboard" },
    ],
  },
  {
    label: "FINANCE & OPS",
    items: [
      {
        icon: Calculator,
        label: "Manage Deposits",
        to: "deposits",
        children: [
          { label: "Pending Deposits", to: "deposits/pending" },
          { label: "Approved Deposits", to: "deposits/approved" },
          { label: "Rejected Deposits", to: "deposits/rejected" },
          { label: "All Deposits", to: "deposits/all" },
        ],
      },
      {
        icon: Calculator,
        label: "Manage Withdrawals",
        to: "withdrawals",
        children: [
          { label: "Pending Withdrawals", to: "withdrawals/pending" },
          { label: "Approved Withdrawals", to: "withdrawals/approved" },
          { label: "Rejected Withdrawals", to: "withdrawals/rejected" },
          { label: "All Withdrawals", to: "withdrawals/all" },
        ],
      },
      {
        icon: CreditCard,
        label: "Payment Gateways",
        to: "payment-gateways",
        children: [
          { label: "Deposit Gateway", to: "payment-gateways/automatic" },
          { label: "Manual Gateways", to: "payment-gateways/manual" },
          { label: "Withdrawal Gateway", to: "payment-gateways/withdrawal" },
          { label: "USDT Gateway", to: "usdt-gateways/manual" },
        ],
      },
      { icon: CreditCard, label: "Payment Details", to: "payment-details" },
      { icon: Database, label: "Bulk Operations Log", to: "bulk-logs" },
    ],
  },
  {
    label: "REPORTS",
    items: [
      {
        icon: BarChart3,
        label: "Reports",
        to: "reports",
        children: [
          { label: "Deposit Report", to: "deposit-report" },
          { label: "Withdrawal Report", to: "withdrawal-report" },
          { label: "Internal Transfer", to: "internal-transfer" },
          { label: "Wallet Report", to: "wallet-report" },
          { label: "Bonus Deposit Report", to: "bonus-deposit-report" },
          { label: "Bonus Withdrawal Report", to: "bonus-withdrawal-report" },
          { label: "Admin Transactions", to: "admin-transactions" },
        ],
      },
    ],
  },
  {
    label: "LOGS",
    items: [
      { icon: FileText, label: "Admin Logs", to: "logs/admin" },
      { icon: FileText, label: "User Logs", to: "logs/user" },
      { icon: Activity, label: "All Actions", to: "logs/all-actions" },
    ],
  },
  {
    label: "BOOK MANAGEMENT",
    items: [
      {
        icon: LayoutDashboard,
        label: "Book Management",
        to: "book-management",
        children: [
          { label: "A Book Management", to: "book-management/a-book" },
          { label: "B Book Management", to: "book-management/b-book" },
          { label: "Combined Book", to: "book-management/combined" },
          { label: "Liquidity Pool Report", to: "book-management/liquidity-pool" },
        ],
      },
    ],
  },
  {
    label: "COUNTRY PARTNER ADMIN",
    items: [
      { icon: Users, label: "Assign Country Partner", to: "assign-country-partner" },
      { icon: ShieldCheck, label: "Assigned Country Admins", to: "assigned-country-admins" },
    ],
  },
  {
    label: "CONTENT MANAGEMENT",
    items: [
      { icon: Newspaper, label: "Manage Tickers", to: "content-management/tickers" },
      { icon: Image, label: "Manage Promotions", to: "content-management/promotions" },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { icon: KeySquare, label: "Assign Roles", to: "assign-roles" },
      { icon: ListChecks, label: "Manage Menus", to: "menu-management" },
      { icon: UserCog, label: "Admin Profile", to: "profile" },
      { icon: Settings, label: "Logout", to: "logout" },
    ],
  },
];

/* -------------------- USER -------------------- */
export const USER_MENU = [
  {
    label: "HOME",
    items: [{ icon: LayoutDashboard, label: "Dashboard", to: "/u/dashboard" }],
  },
  {
    label: "MY ACCOUNT",
    items: [
      {
        icon: Users,
        label: "My Account",
        to: "/u/account",
        children: [
          { label: "Open Trading Account", to: "/u/open-account" },
          { label: "My Accounts", to: "/u/my-accounts" },
          { label: "Account Overview", to: "/u/account-overview" },
        ],
      },
      { icon: Wallet, label: "My Wallet", to: "/u/wallet" },
      {
        icon: Activity,
        label: "Trade Performance",
        to: "/u/trade-performance",
        children: [
          { label: "Summary", to: "/u/trade-performance" },
          { label: "Net Profit", to: "/u/trade-performance?chart=net-profit" },
          { label: "Closed Orders", to: "/u/trade-performance?chart=closed-orders" },
          { label: "Trading Volume", to: "/u/trade-performance?chart=trading-volume" },
          { label: "Equity", to: "/u/trade-performance?chart=equity" },
        ],
      },
      { icon: CreditCard, label: "Payment Details", to: "/u/payment-details" },
    ],
  },
  {
    label: "FUNDS",
    items: [
      {
        icon: Banknote,
        label: "Funds",
        to: "/u/funds",
        children: [
          { label: "Deposit", to: "/u/funds/deposit" },
          { label: "Withdrawal", to: "/u/funds/withdrawal" },
          { label: "Internal Transfer", to: "/u/funds/transfer" },
          { label: "Transaction History", to: "/u/funds/transactions" },
        ],
      },
    ],
  },
  {
    label: "SOCIAL TRADING",
    items: [
      { icon: Copy, label: "Copier Portal", to: "/u/social/copier" },
      { icon: Layers, label: "PAMM Portal", to: "/u/social/pamm" },
    ],
  },
  {
    label: "IB PORTAL",
    items: [
      { icon: GitBranch, label: "Apply IB", to: "/u/ib/apply" },
      { icon: BarChart3, label: "IB Dashboard", to: "/u/ib/dashboard" },
    ],
  },
  {
    label: "TRADING",
    items: [
      { icon: Terminal, label: "Web Terminal", to: "/u/web-terminal" },
    ],
  },
  {
    label: "SUPPORT & SETTINGS",
    items: [
      { icon: Headphones, label: "Helpdesk", to: "/u/helpdesk" },
      { icon: Settings, label: "Profile", to: "/u/settings/profile" },
      { icon: Settings, label: "Logout", to: "/u/logout" },
    ],
  },
];

