cd "/d/britium_express (1)" && \
mkdir -p src/components && \
cat > src/components/Sidebar.tsx <<'EOF'
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Map,
  Headset,
  UserSquare2,
  ShieldCheck,
  Database,
  Users,
  Store,
  FileText,
  BarChart3,
  Settings,
  Truck,
} from "lucide-react";

import {
  Sidebar as UISidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Create Delivery", url: "/create-delivery", icon: Package },
  { title: "Way Management", url: "/way-management", icon: Map },
  { title: "Customer Service", url: "/customer-service", icon: Headset },
  { title: "Customer Portal", url: "/customer", icon: UserSquare2 },
  { title: "Supervisor", url: "/supervisor", icon: ShieldCheck },
  { title: "Data Entry", url: "/data-entry", icon: Database },
];

const managementNav = [
  { title: "Deliverymen", url: "/deliverymen", icon: Users },
  { title: "Merchants", url: "/merchants", icon: Store },
  { title: "Waybill", url: "/waybill", icon: FileText },
  { title: "Reporting", url: "/reporting", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname === url;
  };

  return (
    <UISidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 px-3 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Truck className="h-5 w-5" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs uppercase tracking-[0.25em] text-sidebar-foreground/60">
              Logistics
            </p>
            <h2 className="truncate text-sm font-bold text-sidebar-foreground">
              Britium Express
            </h2>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/30 px-3 py-3 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
          Internal portal navigation
        </div>
      </SidebarFooter>

      <SidebarRail />
    </UISidebar>
  );
}

export default Sidebar;
EOF