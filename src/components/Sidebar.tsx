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
  QrCode,
  ScanLine,
  Camera,
  PenTool,
  Route,
  Warehouse,
  Activity,
  Boxes,
  ClipboardList,
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

const coreNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Create Delivery", url: "/create-delivery", icon: Package },
  { title: "Way Management", url: "/way-management", icon: Map },
];

const portalNav = [
  { title: "Customer Service", url: "/customer-service", icon: Headset },
  { title: "Customer Portal", url: "/customer", icon: UserSquare2 },
  { title: "Supervisor", url: "/supervisor", icon: ShieldCheck },
  { title: "Data Entry", url: "/data-entry", icon: Database },
];

const opsNav = [
  { title: "Deliverymen", url: "/deliverymen", icon: Users },
  { title: "Merchants", url: "/merchants", icon: Store },
  { title: "Receipts", url: "/receipts", icon: FileText },
  { title: "Reporting", url: "/reporting", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

const productionNav = [
  { title: "Enterprise Delivery", url: "/production/create-delivery", icon: Package },
  { title: "Parcel Intake", url: "/production/parcel-intake", icon: ScanLine },
  { title: "QR / Barcode Intake", url: "/production/parcel-intake", icon: QrCode },
  { title: "OCR Workbench", url: "/production/ocr-workbench", icon: FileText },
  { title: "Pickup Execution", url: "/production/pickup-execution", icon: ClipboardList },
  { title: "Warehouse Execution", url: "/production/warehouse-execution", icon: Warehouse },
  { title: "Delivery Execution", url: "/production/delivery-execution", icon: Truck },
  { title: "Way Command Center", url: "/production/way-management", icon: Route },
  { title: "Focused Way List", url: "/production/focused-way-list", icon: Boxes },
  { title: "Live Tracking", url: "/production/live-tracking", icon: Activity },
];

export function Sidebar() {
  const location = useLocation();

  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname === url;
  };

  const renderItems = (
    items: Array<{ title: string; url: string; icon: React.ComponentType<{ className?: string }> }>
  ) =>
    items.map((item) => (
      <SidebarMenuItem key={`${item.url}-${item.title}`}>
        <SidebarMenuButton
          asChild
          isActive={isActive(item.url)}
          tooltip={item.title}
          className="data-[active=true]:bg-cyan-500/15 data-[active=true]:text-cyan-200 hover:bg-white/5"
        >
          <Link to={item.url}>
            <item.icon />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <UISidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,#081526_0%,#0b1e37_100%)] px-3 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.14),transparent_30%)]" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/20">
              <Truck className="h-5 w-5" />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <div className="truncate text-[11px] font-black uppercase tracking-[0.25em] text-cyan-300">
                Britium Express
              </div>
              <div className="truncate text-sm font-bold text-white">
                Enterprise Node
              </div>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Core</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(coreNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Portals</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(portalNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(opsNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Production Delivery Suite</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(productionNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-white/70 group-data-[collapsible=icon]:hidden">
          md@britiumexpress.com is treated as superadmin in the current route guard.
        </div>
      </SidebarFooter>

      <SidebarRail />
    </UISidebar>
  );
}

export default Sidebar;
