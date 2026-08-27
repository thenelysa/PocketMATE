import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  Bell,
  FileBarChart,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  List,
  Wallet,
  BellRing,
  BarChart3,
  Settings2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui';

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard, badge: 'home' },
  { name: 'Bills', href: '/app/bills', icon: Receipt, badge: 'list' },
  { name: 'Credit Cards', href: '/app/cards', icon: CreditCard, badge: 'wallet' },
  { name: 'Reminders', href: '/app/reminders', icon: Bell, badge: 'bell' },
  { name: 'Reports', href: '/app/reports', icon: FileBarChart, badge: 'chart' },
  { name: 'Settings', href: '/app/settings', icon: Settings, badge: 'gear' },
];

const badgeIcons: Record<string, any> = {
  home: Home,
  list: List,
  wallet: Wallet,
  bell: BellRing,
  chart: BarChart3,
  gear: Settings2,
};

export function Sidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'false' ? false : true;
  });
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const toggleCollapse = () => {
    const newValue = !collapsed;
    setCollapsed(newValue);
    localStorage.setItem('sidebar_collapsed', String(newValue));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('sidebarToggle'));
  };

  const handleSignOut = () => {
    setShowSignOutDialog(false);
    signOut();
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-md bg-[#F7F8F5] border border-[#D5ECEB]"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5 text-[#071936]" /> : <Menu className="h-5 w-5 text-[#071936]" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 bg-[#F7F8F5] border-r border-[#D5ECEB] transition-all duration-300 lg:translate-x-0',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo & Brand */}
          <div className={cn('py-6 border-b border-[#D5ECEB]', collapsed ? 'px-2' : 'px-6')}>
            <a href="/" className={cn('flex flex-col items-center gap-3 hover:opacity-80 transition-opacity', collapsed ? 'px-0' : '')}>
              <img src="/images/logo.png" alt="PocketMATE Logo" className={cn('w-auto transition-all', collapsed ? 'h-10' : 'h-14')} />
              {!collapsed && (
                <span
                  className="text-xl font-extrabold bg-gradient-to-r from-[#078D88] to-[#19C4B6] bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform text-center"
                >
                  PocketMATE
                </span>
              )}
            </a>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const BadgeIcon = badgeIcons[item.badge];
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-3 mb-2 text-base transition-all duration-200 transform',
                    isActive
                      ? 'bg-gradient-to-r from-[#078D88] to-[#19C4B6] text-white shadow-lg'
                      : 'text-[#4B5D7A] hover:bg-[#F1FAFA] hover:text-[#071936] hover:shadow-md'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <div className={cn('flex items-center justify-center', isActive ? 'scale-110' : '')}>
                    {BadgeIcon ? <BadgeIcon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-[#078D88]')} /> : <item.icon className="h-5 w-5" />}
                  </div>
                  {!collapsed && <span className="text-base">{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Circular Collapse Toggle Button */}
          <button
            onClick={toggleCollapse}
            className={cn(
              'absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 w-7 h-7 rounded-full bg-[#F7F8F5] border-2 border-[#D5ECEB] shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg z-50',
              collapsed ? 'bg-[#078D88] border-[#078D88] text-white' : 'text-[#078D88]'
            )}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          {/* Sign out */}
          <div className="border-t border-[#D5ECEB] p-2">
            <button
              onClick={() => setShowSignOutDialog(true)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700',
                collapsed && 'justify-center px-0'
              )}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>Sign out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Sign Out Confirmation Dialog */}
      <Dialog open={showSignOutDialog} onClose={() => setShowSignOutDialog(false)}>
        <DialogContent className="text-center sm:max-w-sm">
          <DialogHeader className="mb-2">
            <DialogTitle>Sign Out</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            <img src="/images/signout.png" alt="Sign Out" className="w-20 h-20 mx-auto" />
            <p className="text-muted-foreground text-sm">
              Are you sure you want to sign out? You'll need to log in again to access your data.
            </p>
          </div>
          <DialogFooter className="justify-center sm:justify-center mt-4">
            <Button variant="outline" onClick={() => setShowSignOutDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
