import { Link, useLocation } from "react-router-dom";
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
  Headset,
  UserSquare2,
  ShieldCheck,
  Database,
  Workflow,
  Truck,
  Route,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar as UISidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Operations Control", path: "/operations", icon: Workflow },
  { title: "Create Delivery", path: "/create-delivery", icon: Package },
  { title: "Way Management", path: "/way-management", icon: Map },
  { title: "Customer Service", path: "/customer-service", icon: Headset },
  { title: "Customer Portal", path: "/customer", icon: UserSquare2 },
  { title: "Supervisor Hub", path: "/supervisor", icon: ShieldCheck },
  { title: "Supervisor Pickup", path: "/supervisor-pickup", icon: Truck },
  { title: "Supervisor Wayplan", path: "/supervisor-wayplan", icon: Route },
  { title: "Data Entry", path: "/data-entry", icon: Database },
  { title: "Rider App", path: "/rider/portal", icon: Users },
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
    <UISidebar className={className} variant="sidebar" collapsible="offcanvas">
      <SidebarHeader className="border-b">
        <div className="p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Britium Express" className="w-7 h-7 object-contain" />
          </div>
          <span className="font-bold text-xl tracking-tight">Britium Express</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link to={item.path} className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <div
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
            "text-muted-foreground"
          )}
        >
          <History className="w-4 h-4" />
          Production workflow
        </div>
      </SidebarFooter>
    </UISidebar>
  );
}

export default Sidebar;
