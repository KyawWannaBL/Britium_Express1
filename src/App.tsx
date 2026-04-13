import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { PrivateRoute } from "@/components/auth/PrivateRoute";
import AppSidebar from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

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

const queryClient = new QueryClient();

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-3 border-b bg-background px-4">
          <SidebarTrigger />
          <div className="text-sm font-semibold text-muted-foreground">
            Britium Express Portal
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </SidebarInset>
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
