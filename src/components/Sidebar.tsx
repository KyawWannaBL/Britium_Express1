import type { ComponentType } from "react";
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
  PenTool,
  Route,
  Warehouse,
  Activity,
  Boxes,
  ClipboardList,
  MapPinned,
  Camera,
} from "lucide-react";

import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";
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

type NavItem = {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
};

const coreNav: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Create Delivery", url: "/create-delivery", icon: Package },
  { title: "Way Management", url: "/way-management", icon: Map },
];

const managementNav: NavItem[] = [
  { title: "Customer Service", url: "/customer-service", icon: Headset },
  { title: "Supervisor", url: "/supervisor", icon: ShieldCheck },
  { title: "Data Entry", url: "/data-entry", icon: Database },
  { title: "Deliverymen", url: "/deliverymen", icon: Users },
  { title: "Receipts", url: "/receipts", icon: FileText },
  { title: "Reporting", url: "/reporting", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

const customerNav: NavItem[] = [
  { title: "Customer Portal", url: "/customer", icon: UserSquare2 },
  { title: "Live Tracking", url: "/production/live-tracking", icon: MapPinned },
];

const merchantNav: NavItem[] = [
  { title: "Merchants", url: "/merchants", icon: Store },
  { title: "Enterprise Delivery", url: "/production/create-delivery", icon: Package },
  { title: "Live Tracking", url: "/production/live-tracking", icon: Activity },
];

const riderNav: NavItem[] = [
  { title: "Pickup Execution", url: "/production/pickup-execution", icon: ClipboardList },
  { title: "Delivery Execution", url: "/production/delivery-execution", icon: Truck },
  { title: "Focused Way List", url: "/production/focused-way-list", icon: Boxes },
  { title: "Live Tracking", url: "/production/live-tracking", icon: MapPinned },
  { title: "Photo Evidence", url: "/production/delivery-execution", icon: Camera },
  { title: "Signature Pad", url: "/production/delivery-execution", icon: PenTool },
];

const warehouseNav: NavItem[] = [
  { title: "Parcel Intake", url: "/production/parcel-intake", icon: ScanLine },
  { title: "QR / Barcode Intake", url: "/production/parcel-intake", icon: QrCode },
  { title: "OCR Workbench", url: "/production/ocr-workbench", icon: FileText },
  { title: "Warehouse Execution", url: "/production/warehouse-execution", icon: Warehouse },
  { title: "Way Command Center", url: "/production/way-management", icon: Route },
];

const superNav: NavItem[] = [
  { title: "Enterprise Delivery", url: "/production/create-delivery", icon: Package },
  { title: "Pickup Execution", url: "/production/pickup-execution", icon: ClipboardList },
  { title: "Warehouse Execution", url: "/production/warehouse-execution", icon: Warehouse },
  { title: "Delivery Execution", url: "/production/delivery-execution", icon: Truck },
  { title: "Way Command Center", url: "/production/way-management", icon: Route },
  { title: "Focused Way List", url: "/production/focused-way-list", icon: Boxes },
  { title: "Parcel Intake", url: "/production/parcel-intake", icon: ScanLine },
  { title: "OCR Workbench", url: "/production/ocr-workbench", icon: FileText },
  { title: "Live Tracking", url: "/production/live-tracking", icon: Activity },
];

function hasRole(role: string, list: string[]) {
  return list.includes(role);
}

export function Sidebar() {
  const location = useLocation();
  const { roleCode, user, isSuperAdmin } = useEnhancedAuth();

  const email = (user?.email ?? "").toLowerCase();
  const effectiveRole = email === "md@britiumexpress.com" ? "SYS" : roleCode;

  const showAll =
    isSuperAdmin ||
    effectiveRole === "SYS" ||
    hasRole(effectiveRole, ["AUD", "CAP", "FINM", "HRM", "ROM", "BMG", "DSP", "HSP"]);

  const showCustomer = showAll || hasRole(effectiveRole, ["CUS"]);
  const showMerchant = showAll || hasRole(effectiveRole, ["MER"]);
  const showRider = showAll || hasRole(effectiveRole, ["CUR", "RIDER", "DRIVER"]);
  const showWarehouse = showAll || hasRole(effectiveRole, ["HSC", "HSP", "DATA_ENTRY"]);
  const showManagement = showAll || hasRole(effectiveRole, ["CSA", "CCA", "CSH", "DSP", "HSP", "BMG", "ROM"]);

  const isActive = (url: string) => location.pathname === url;

  const renderItems = (items: NavItem[]) =>
    items.map((item) => (
      <SidebarMenuItem key={`${item.url}-${item.title}`}>
        <SidebarMenuButton
          asChild
          isActive={isActive(item.url)}
          tooltip={item.title}
          className="h-10 rounded-xl text-slate-100 transition hover:bg-white/10 data-[active=true]:bg-cyan-500/15 data-[active=true]:text-cyan-200"
        >
          <Link to={item.url}>
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <UISidebar
      collapsible="offcanvas"
      className="border-r border-white/10 bg-[#061120]/95 text-white backdrop-blur-xl"
    >
      <SidebarHeader className="shrink-0 border-b border-white/10 p-3">
        <div className="rounded-2xl border border-cyan-500/15 bg-[linear-gradient(180deg,#081526_0%,#0b1e37_100%)] px-3 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/20">
              <Truck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[11px] font-black uppercase tracking-[0.25em] text-cyan-300">
                Enterprise Delivery
              </div>
              <div className="truncate text-sm font-bold text-white">
                Britium Express Operations
              </div>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="britium-sidebar-scroll min-h-0 overflow-y-auto px-2 pb-6 pt-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/50">
            Core
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(coreNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {showManagement ? (
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/50">
              Management
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(managementNav)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {showCustomer ? (
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/50">
              Customer
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(customerNav)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {showMerchant ? (
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/50">
              Merchant
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(merchantNav)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {showRider ? (
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/50">
              Rider / Driver
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(riderNav)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {showWarehouse ? (
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/50">
              Warehouse / Hub
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(warehouseNav)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {showAll ? (
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/50">
              Production Delivery Suite
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(superNav)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="shrink-0 border-t border-white/10 p-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-white/70">
          Signed in as {email || "user"} · role {effectiveRole || "INT"}
        </div>
      </SidebarFooter>

      <SidebarRail />
    </UISidebar>
  );
}

export default Sidebar;
