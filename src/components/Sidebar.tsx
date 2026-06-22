import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Database,
  FileText,
  Headset,
  History,
  Home,
  LayoutDashboard,
  Map,
  MapPinned,
  Megaphone,
  Package,
  Printer,
  ReceiptText,
  Route,
  Settings as SettingsIcon,
  ShieldCheck,
  Store,
  Truck,
  UserCog,
  UserRound,
  Users,
  Warehouse,
  Workflow,
  type LucideIcon,
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
import { appScreenCategories, appScreens } from "@/lib/appScreens";

const iconByKey: Record<string, LucideIcon> = {
  DASHBOARD: LayoutDashboard,
  GO_LIVE_READINESS: ClipboardCheck,
  ANALYTICS: BarChart3,
  CUSTOMER_SERVICE: Headset,
  CS_COMMAND: Activity,
  CS_PORTAL: Headset,
  EXCEPTIONS: AlertTriangle,
  DATA_ENTRY: Database,
  WAYBILL_STUDIO: FileText,
  PICKUP_FORM: Package,
  DOC_PRINT: Printer,
  WAREHOUSE: Warehouse,
  WAREHOUSE_OPS: Building2,
  DISPATCH_COMMAND: Workflow,
  WAYPLAN_COMMAND: Route,
  SUPERVISOR: ShieldCheck,
  SUPERVISOR_PICKUP: Truck,
  SUPERVISOR_WAYPLAN: MapPinned,
  FINANCE_PORTAL: CreditCard,
  INVOICE_STUDIO: ReceiptText,
  COD_SETTLEMENT: CreditCard,
  WORKFORCE_COMMISSION: Users,
  RIDER_SETTLEMENT: UserRound,
  MERCHANT_PORTAL: Store,
  CUSTOMER_PORTAL: Home,
  BRANCH_ADMIN: Building2,
  MASTER_DATA: Database,
  BIZ_DEV: BriefcaseBusiness,
  BUSINESS_DEVELOPMENT_MANAGER: UserCog,
  MARKETING: Megaphone,
  MARKETING_PORTAL: Megaphone,
  TARIFF: ReceiptText,
  RIDER_MANAGEMENT: Users,
  MOBILE_SANDBOX: Activity,
  DRIVER_MANAGEMENT: Truck,
  ADMIN_HR: UserCog,
  ACCOUNTS: Users,
  PROFILE: UserRound,
  AUDIT_LOGS: History,
  TEMPLATES: FileText,
  SETTINGS: SettingsIcon,
};

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const groupedScreens = appScreenCategories
    .map((category) => ({ category, screens: appScreens.filter((screen) => screen.category === category) }))
    .filter((group) => group.screens.length > 0);

  return (
    <UISidebar className={className} variant="sidebar" collapsible="offcanvas">
      <SidebarHeader className="border-b">
        <div className="p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Britium Express" className="w-7 h-7 object-contain" />
          </div>
          <div className="min-w-0">
            <span className="block truncate font-bold text-xl tracking-tight">Britium Express</span>
            <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">Go-Live Apps</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {groupedScreens.map((group) => (
            <div key={group.category} className="mb-4">
              <div className="px-3 pb-2 pt-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {group.category}
              </div>
              {group.screens.map((screen) => {
                const Icon = iconByKey[screen.key] || FileText;
                const isActive = screen.path === "/" ? location.pathname === "/" : location.pathname === screen.path || location.pathname.startsWith(`${screen.path}/`);

                return (
                  <SidebarMenuItem key={screen.key}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={screen.path} className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{screen.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </div>
          ))}
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
          All screens wired
        </div>
      </SidebarFooter>
    </UISidebar>
  );
}

export default Sidebar;
