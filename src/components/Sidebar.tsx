import { useLocation, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Store, 
  Settings as SettingsIcon, 
  FileText, 
  BarChart3,
  Map,
  History,
  Headset,      // For Customer Service
  UserSquare2,  // For Customer Portal
  ShieldCheck,  // For Supervisor
  Database      // For Data Entry
} from "lucide-react";
import { cn } from "@/lib/utils";

// Updated navigation with the requested portals
const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Create Delivery", path: "/create-delivery", icon: Package },
  { title: "Way Management", path: "/way-management", icon: Map },
  
  // --- New Portals ---
  { title: "Customer Service", path: "/customer-service", icon: Headset },
  { title: "Customer Portal", path: "/customer", icon: UserSquare2 },
  { title: "Supervisor Hub", path: "/supervisor", icon: ShieldCheck },
  { title: "Data Entry", path: "/data-entry", icon: Database },
  // -------------------

  { title: "Deliverymen", path: "/deliverymen", icon: Users },
  { title: "Merchants", path: "/merchants", icon: Store },
  { title: "Receipts", path: "/receipts", icon: FileText },
  { title: "Reporting", path: "/reporting", icon: BarChart3 },
  { title: "Settings", path: "/settings", icon: SettingsIcon },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className={cn("w-64 bg-sidebar border-r flex flex-col h-screen", className)}>
      <div className="p-6 flex items-center gap-2 border-b">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Package className="text-primary-foreground w-5 h-5" />
        </div>
        <span className="font-bold text-xl tracking-tight">Britium Express</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm font-medium",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.title}
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-border">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/maplibre/maplibre-gl-style-spec/blob/main/CHANGELOG.md"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <History className="w-4 h-4" />
            Changelog
          </a>
        </div>
      </nav>
    </aside>
  );
}
