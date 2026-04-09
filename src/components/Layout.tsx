import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Route,
  Store,
  Receipt,
  DollarSign,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  Bell,
  User,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  submenu?: Array<{ label: string; path: string }>;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: ROUTE_PATHS.DASHBOARD,
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Create Delivery',
    path: ROUTE_PATHS.CREATE_DELIVERY,
    icon: <Package className="w-5 h-5" />,
  },
  {
    label: 'Way Management',
    path: ROUTE_PATHS.WAY_MANAGEMENT,
    icon: <Route className="w-5 h-5" />,
    submenu: [
      { label: 'Deliver Ways', path: `${ROUTE_PATHS.WAY_MANAGEMENT}?tab=deliver` },
      { label: 'Failed Ways', path: `${ROUTE_PATHS.WAY_MANAGEMENT}?tab=failed` },
      { label: 'Return Ways', path: `${ROUTE_PATHS.WAY_MANAGEMENT}?tab=return` },
      { label: 'Parcel In/Out', path: `${ROUTE_PATHS.WAY_MANAGEMENT}?tab=parcel` },
      { label: 'Transit Route', path: `${ROUTE_PATHS.WAY_MANAGEMENT}?tab=transit` },
      { label: 'Tracking Map', path: `${ROUTE_PATHS.WAY_MANAGEMENT}?tab=map` },
    ],
  },
  {
    label: 'Merchants',
    path: ROUTE_PATHS.MERCHANTS,
    icon: <Store className="w-5 h-5" />,
  },
  {
    label: 'Receipts',
    path: ROUTE_PATHS.RECEIPTS,
    icon: <Receipt className="w-5 h-5" />,
  },
  {
    label: 'Financial Center',
    path: ROUTE_PATHS.FINANCIAL_CENTER,
    icon: <DollarSign className="w-5 h-5" />,
  },
  {
    label: 'Deliverymen',
    path: ROUTE_PATHS.DELIVERYMEN,
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: 'Reporting',
    path: ROUTE_PATHS.REPORTING,
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: 'Settings',
    path: ROUTE_PATHS.SETTINGS,
    icon: <Settings className="w-5 h-5" />,
  },
];

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const location = useLocation();

  const toggleSubmenu = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  const isActiveRoute = (path: string) => {
    if (path === ROUTE_PATHS.DASHBOARD) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <motion.div
            initial={false}
            animate={{ opacity: sidebarOpen ? 1 : 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            {sidebarOpen && (
              <span className="font-semibold text-lg text-sidebar-foreground">Britium Express</span>
            )}
          </motion.div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.label}>
                {item.submenu ? (
                  <div>
                    <button
                      onClick={() => toggleSubmenu(item.label)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActiveRoute(item.path)
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                      )}
                    >
                      {item.icon}
                      {sidebarOpen && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {expandedMenu === item.label ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </>
                      )}
                    </button>
                    <AnimatePresence>
                      {sidebarOpen && expandedMenu === item.label && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="ml-8 mt-1 space-y-1 overflow-hidden"
                        >
                          {item.submenu.map((subItem) => (
                            <li key={subItem.label}>
                              <NavLink
                                to={subItem.path}
                                className={({ isActive }) =>
                                  cn(
                                    'block px-3 py-2 rounded-lg text-sm transition-colors',
                                    isActive
                                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                                  )
                                }
                              >
                                {subItem.label}
                              </NavLink>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                      )
                    }
                  >
                    {item.icon}
                    {sidebarOpen && <span>{item.label}</span>}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div
        className={cn(
          'transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-20'
        )}
      >
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex h-full items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-foreground">
                {navItems.find((item) => isActiveRoute(item.path))?.label || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  3
                </Badge>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium">Admin User</div>
                      <div className="text-xs text-muted-foreground">admin@britium.com</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Support</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
