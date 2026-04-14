import React, { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Sidebar } from "./components/Sidebar";

// Core pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateDelivery from "./pages/CreateDelivery";
import WayManagement from "./pages/WayManagement";
import Deliverymen from "./pages/Deliverymen";
import Merchants from "./pages/Merchants";
import Receipts from "./pages/Receipts";
import Reporting from "./pages/Reporting";
import Settings from "./pages/Settings";
import SupervisorPortal from "./pages/SupervisorPortal";
import DataEntryPortal from "./pages/DataEntryPortal";
import CustomerServicePortal from "./pages/CustomerServicePortal";
import CustomerPortal from "./pages/CustomerPortal";

// Enterprise workspaces
import {
  ProfileDashboardPage,
  WalletHubPage,
  CustomerWalletPage,
  MerchantWalletPage,
  FinanceWalletPage,
  RiderWalletPage,
  BranchWalletPage,
  AdminOperationsPortalPage,
  HRAdminPortalPage,
  WarehouseControllerPortalPage,
  BranchOfficePortalPage,
} from "./pages/EnterpriseWorkspaces";

// Production delivery suite
import CreateDeliveryScreen from "../features/production-delivery/screens/CreateDeliveryScreen";
import PickupExecutionScreen from "../features/production-delivery/screens/PickupExecutionScreen";
import WarehouseExecutionScreen from "../features/production-delivery/screens/WarehouseExecutionScreen";
import DeliveryExecutionScreen from "../features/production-delivery/screens/DeliveryExecutionScreen";
import WayManagementScreen from "../features/production-delivery/screens/WayManagementScreen";
import FocusedWayListScreen from "../features/production-delivery/screens/FocusedWayListScreen";
import ParcelIntakeScreen from "../features/production-delivery/screens/ParcelIntakeScreen";
import OcrWorkbenchScreen from "../features/production-delivery/screens/OcrWorkbenchScreen";
import LiveTrackingScreen from "../features/production-delivery/screens/LiveTrackingScreen";

const queryClient = new QueryClient();

const ROLE_SUPER = ["super_admin", "admin", "SYS", "SUPER_ADMIN", "ADMIN"];

const ROLE_OPERATIONS = [
  ...ROLE_SUPER,
  "operations_admin",
  "OPS_ADMIN",
  "ROM",
  "BMG",
  "DSP",
  "HSP",
  "SUPERVISOR",
  "supervisor",
];

const ROLE_HR_ADMIN = [
  ...ROLE_SUPER,
  "HRM",
  "HRO",
  "hr_admin",
  "HR_ADMIN",
];

const ROLE_WAREHOUSE = [
  ...ROLE_SUPER,
  "warehouse_controller",
  "WAREHOUSE_CONTROLLER",
  "HSC",
  "HSP",
  "data_entry",
  "DATA_ENTRY",
];

const ROLE_BRANCH = [
  ...ROLE_SUPER,
  "branch_manager",
  "branch_admin",
  "branch_supervisor",
  "branch_office",
  "BRANCH_MANAGER",
  "BRANCH_ADMIN",
  "BRANCH_SUPERVISOR",
  "BRANCH_OFFICE",
  "BMG",
  "ROM",
];

const ROLE_FINANCE = [
  ...ROLE_SUPER,
  "finance",
  "finance_admin",
  "finance_manager",
  "FINM",
  "BIL",
  "AR",
];

const ROLE_CUSTOMER_WALLET = [...ROLE_SUPER, "customer", "CUS"];

const ROLE_MERCHANT_WALLET = [
  ...ROLE_SUPER,
  "merchant",
  "MER",
  "merchant_admin",
  "MERCHANT_ADMIN",
  "merchant_manager",
  "MERCHANT_MANAGER",
];

const ROLE_RIDER_WALLET = [
  ...ROLE_SUPER,
  "rider",
  "driver",
  "helper",
  "CUR",
  "RIDER",
  "DRIVER",
  "HELPER",
];

function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="enterprise-shell flex h-screen w-full overflow-hidden">
        <Sidebar />
        <SidebarInset className="enterprise-main min-w-0 overflow-hidden">
          <header className="enterprise-topbar sticky top-0 z-20 flex h-16 items-center gap-3 px-4">
            <SidebarTrigger className="text-slate-700 hover:bg-slate-100 hover:text-slate-900" />
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Britium Express"
                className="h-9 w-9 rounded-xl object-contain"
              />
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-700">
                  Britium Express
                </div>
                <div className="text-sm font-bold text-slate-900">
                  Enterprise Operations Platform
                </div>
              </div>
            </div>
          </header>

          <main className="h-[calc(100vh-4rem)] overflow-y-auto p-4 md:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <AppLayout>
                  <ProfileDashboardPage />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route path="/profile/activity" element={<Navigate to="/profile" replace />} />

          <Route
            path="/create-delivery"
            element={
              <PrivateRoute>
                <AppLayout>
                  <CreateDelivery />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/way-management"
            element={
              <PrivateRoute>
                <AppLayout>
                  <WayManagement />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/customer-service"
            element={
              <PrivateRoute
                allowedRoles={[
                  ...ROLE_SUPER,
                  "customer_service",
                  "customer_service_agent",
                  "customer_service_manager",
                  "call_center",
                  "call_center_agent",
                  "ndr_agent",
                  "ndr_supervisor",
                  "CUSTOMER_SERVICE",
                  "CUSTOMER_SERVICE_AGENT",
                  "CUSTOMER_SERVICE_MANAGER",
                  "CALL_CENTER",
                  "CALL_CENTER_AGENT",
                  "NDR_AGENT",
                  "NDR_SUPERVISOR",
                  "CSA",
                  "CCA",
                  "CSH",
                  "DSP",
                  "HSP",
                  "BMG",
                  "ROM",
                ]}
              >
                <AppLayout>
                  <CustomerServicePortal />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/customer"
            element={
              <PrivateRoute>
                <AppLayout>
                  <CustomerPortal />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/supervisor"
            element={
              <PrivateRoute allowedRoles={[...ROLE_OPERATIONS, "supervisor"]}>
                <AppLayout>
                  <SupervisorPortal />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/data-entry"
            element={
              <PrivateRoute allowedRoles={[...ROLE_WAREHOUSE, "data_entry"]}>
                <AppLayout>
                  <DataEntryPortal />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/deliverymen"
            element={
              <PrivateRoute>
                <AppLayout>
                  <Deliverymen />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/merchants"
            element={
              <PrivateRoute>
                <AppLayout>
                  <Merchants />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/receipts"
            element={
              <PrivateRoute>
                <AppLayout>
                  <Receipts />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/reporting"
            element={
              <PrivateRoute>
                <AppLayout>
                  <Reporting />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route path="/reports" element={<Navigate to="/reporting" replace />} />

          <Route
            path="/wallet"
            element={
              <PrivateRoute>
                <AppLayout>
                  <WalletHubPage />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/wallet/customer"
            element={
              <PrivateRoute allowedRoles={ROLE_CUSTOMER_WALLET}>
                <AppLayout>
                  <CustomerWalletPage />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/wallet/merchant"
            element={
              <PrivateRoute allowedRoles={ROLE_MERCHANT_WALLET}>
                <AppLayout>
                  <MerchantWalletPage />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/wallet/finance"
            element={
              <PrivateRoute allowedRoles={ROLE_FINANCE}>
                <AppLayout>
                  <FinanceWalletPage />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/wallet/rider"
            element={
              <PrivateRoute allowedRoles={ROLE_RIDER_WALLET}>
                <AppLayout>
                  <RiderWalletPage />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/wallet/branch"
            element={
              <PrivateRoute allowedRoles={ROLE_BRANCH}>
                <AppLayout>
                  <BranchWalletPage />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/operations"
            element={
              <PrivateRoute allowedRoles={ROLE_OPERATIONS}>
                <AppLayout>
                  <AdminOperationsPortalPage />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/hr-admin"
            element={
              <PrivateRoute allowedRoles={ROLE_HR_ADMIN}>
                <AppLayout>
                  <HRAdminPortalPage />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/warehouse/controller"
            element={
              <PrivateRoute allowedRoles={ROLE_WAREHOUSE}>
                <AppLayout>
                  <WarehouseControllerPortalPage />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/branch-office"
            element={
              <PrivateRoute allowedRoles={ROLE_BRANCH}>
                <AppLayout>
                  <BranchOfficePortalPage />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <PrivateRoute allowedRoles={[...ROLE_SUPER, "FINM", "BMG", "ROM", "CAP", "AUD"]}>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/production/create-delivery"
            element={
              <PrivateRoute>
                <AppLayout>
                  <CreateDeliveryScreen />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/production/pickup-execution"
            element={
              <PrivateRoute>
                <AppLayout>
                  <PickupExecutionScreen />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/production/warehouse-execution"
            element={
              <PrivateRoute>
                <AppLayout>
                  <WarehouseExecutionScreen />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/production/delivery-execution"
            element={
              <PrivateRoute>
                <AppLayout>
                  <DeliveryExecutionScreen />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/production/way-management"
            element={
              <PrivateRoute>
                <AppLayout>
                  <WayManagementScreen />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/production/focused-way-list"
            element={
              <PrivateRoute>
                <AppLayout>
                  <FocusedWayListScreen />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/production/parcel-intake"
            element={
              <PrivateRoute>
                <AppLayout>
                  <ParcelIntakeScreen />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/production/ocr-workbench"
            element={
              <PrivateRoute>
                <AppLayout>
                  <OcrWorkbenchScreen />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/production/live-tracking"
            element={
              <PrivateRoute>
                <AppLayout>
                  <LiveTrackingScreen />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;