// src/layouts/Shell.jsx
import { useMemo, useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";
import { ADMIN_MENU, SUPERADMIN_MENU, USER_MENU } from "../components/SidebarMenuConfig.js";
import { LayoutDashboard, Users as UsersIcon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Shell() {
  const { admin } = useAuth();
  
  // Determine role based on admin's role
  const role = admin?.role === 'superadmin' ? 'superadmin' : 'admin';
  console.log('Shell - admin:', admin, 'role:', role);
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Collapsed state for desktop sidebar (persisted in localStorage)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleSidebar = () => setMobileOpen(v => !v);
  const closeSidebar  = () => setMobileOpen(false);
  
  const toggleSidebarCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('adminSidebarCollapsed', JSON.stringify(newState));
  };

  const menu = useMemo(() => (
    role === 'superadmin' ? SUPERADMIN_MENU : role === 'admin' ? ADMIN_MENU : USER_MENU
  ), [role]);

  const breadcrumbs = useMemo(() => {
    const list = [];
    // Root
    const rootTo = role === 'superadmin' ? '/sa/dashboard' : role === 'admin' ? '/admin/dashboard' : '/u/dashboard';
    const rootLabel = role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'User';
    list.push({ label: rootLabel, to: rootTo, icon: LayoutDashboard });

    let matched = null;
    let parent = null;
    // Remove /admin prefix from pathname for matching
    const cleanPath = pathname.replace(/^\/admin\/?/, '').replace(/^\//, '');
    
    menu.forEach(section => {
      section.items.forEach(item => {
        if (item.children?.length) {
          const found = item.children.find(c => {
            const childPath = c.to?.replace(/^\//, '');
            return childPath === cleanPath || pathname.endsWith(`/${childPath}`) || pathname === `/admin/${childPath}`;
          });
          if (found) { matched = found; parent = item; }
        } else {
          const itemPath = item.to?.replace(/^\//, '');
          if (itemPath === cleanPath || pathname.endsWith(`/${itemPath}`) || pathname === `/admin/${itemPath}`) {
            matched = item; 
            parent = null;
          }
        }
      });
    });

    if (parent) list.push({ label: parent.label, to: parent.to, icon: parent.icon });
    if (matched) list.push({ label: matched.label, to: matched.to, icon: parent?.icon });

    // Fallback for dynamic pages e.g., /admin/users/:id
    if (!matched) {
      if (pathname.startsWith('/admin/users/')) {
        const sec = menu.find(s => s.label.toLowerCase().includes('clients')) || menu[0];
        const manage = sec?.items?.find(i => i.label.toLowerCase().includes('manage users'));
        const all = manage?.children?.find(c => c.label.toLowerCase().includes('all users'));
        if (manage) list.push({ label: manage.label, to: `/admin/${manage.to}`, icon: manage.icon || UsersIcon });
        if (all) list.push({ label: all.label, to: `/admin/${all.to}`, icon: manage?.icon || UsersIcon });
        list.push({ label: 'User Details' });
      }
    }
    return list;
  }, [menu, pathname, role]);

  // Update page title based on active menu
  useEffect(() => {
    let activeMenuLabel = 'Dashboard';
    
    // Find the active menu item from breadcrumbs
    if (breadcrumbs.length > 0) {
      // Get the last breadcrumb (most specific)
      const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
      if (lastBreadcrumb?.label) {
        activeMenuLabel = lastBreadcrumb.label;
      }
    }
    
    // Format: "fxbrokersuite : Admin-{active menu}"
    document.title = `fxbrokersuite : Admin-${activeMenuLabel}`;
  }, [breadcrumbs]);

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#F1F6EC' }}>
      {/* Fixed sidebar (desktop) + drawer (mobile) */}
      <Sidebar
        role={role}
        adminRole={admin?.role || 'admin'}
        pathname={pathname}
        open={mobileOpen}
        onClose={closeSidebar}
        collapsed={sidebarCollapsed}
      />

      {/* Main content area – reserve sidebar width on lg+ */}
      <main className={`min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[80px]' : 'lg:pl-[240px]'}`}>
        <Topbar 
          role={role} 
          onMenuToggle={toggleSidebar} 
          breadcrumbs={breadcrumbs}
          onSidebarToggle={toggleSidebarCollapse}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Page canvas */}
        <div className="min-h-[calc(100vh-72px)]">
          {/* Full-width responsive container with consistent paddings */}
          <div className="w-full py-4 md:py-6 lg:py-8" style={{ paddingInline: 'var(--app-x)' }}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

