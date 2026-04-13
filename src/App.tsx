import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Sidebar } from "./components/Sidebar";

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

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="app-shell-bg flex min-h-screen w-full overflow-hidden">
        <Sidebar />
        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/10 bg-[#07111f]/80 px-4 backdrop-blur">
            <SidebarTrigger className="text-white hover:bg-white/10 hover:text-white" />
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Britium Express"
                className="h-9 w-9 rounded-xl object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <div>
                <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  Enterprise Delivery
                </div>
                <div className="text-sm font-bold text-white">
                  Britium Express Operations
                </div>
              </div>
            </div>
          </header>

          <main className="min-h-[calc(100vh-4rem)] p-4 md:p-8">
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
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />

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
              <PrivateRoute>
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
              <PrivateRoute allowedRoles={["super_admin", "admin", "supervisor"]}>
                <AppLayout>
                  <SupervisorPortal />
                </AppLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/data-entry"
            element={
              <PrivateRoute allowedRoles={["super_admin", "admin", "data_entry"]}>
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

          <Route
            path="/settings"
            element={
              <PrivateRoute allowedRoles={["super_admin", "admin"]}>
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

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
