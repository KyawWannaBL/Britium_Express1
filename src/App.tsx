import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
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

const queryClient = new QueryClient();

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="app-shell-bg flex min-h-screen w-full overflow-hidden bg-background">
    <div className="shrink-0">
      <Sidebar />
    </div>
    <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-8">
      {children}
    </main>
  </div>
);

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
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route
            path="/create-delivery"
            element={
              <PrivateRoute>
                <Layout>
                  <CreateDelivery />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/way-management"
            element={
              <PrivateRoute>
                <Layout>
                  <WayManagement />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/customer-service"
            element={
              <PrivateRoute>
                <Layout>
                  <CustomerServicePortal />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/customer"
            element={
              <PrivateRoute>
                <Layout>
                  <CustomerPortal />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/supervisor"
            element={
              <PrivateRoute allowedRoles={["super_admin", "admin", "supervisor"]}>
                <Layout>
                  <SupervisorPortal />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/data-entry"
            element={
              <PrivateRoute allowedRoles={["super_admin", "admin", "data_entry"]}>
                <Layout>
                  <DataEntryPortal />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/deliverymen"
            element={
              <PrivateRoute>
                <Layout>
                  <Deliverymen />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/merchants"
            element={
              <PrivateRoute>
                <Layout>
                  <Merchants />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/receipts"
            element={
              <PrivateRoute>
                <Layout>
                  <Receipts />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/reporting"
            element={
              <PrivateRoute>
                <Layout>
                  <Reporting />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute allowedRoles={["super_admin", "admin"]}>
                <Layout>
                  <Settings />
                </Layout>
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