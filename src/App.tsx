import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Sidebar } from "./components/Sidebar";

// Page Imports
import Dashboard from "./pages/Dashboard";
import CreateDelivery from "./pages/CreateDelivery";
import WayManagement from "./pages/WayManagement";
import Deliverymen from "./pages/Deliverymen";
import Merchants from "./pages/Merchants";
import Waybill from "@/pages/Waybill";
import Reporting from "./pages/Reporting";
import Settings from "./pages/Settings";
import SupervisorPortal from "./pages/SupervisorPortal";
import DataEntryPortal from "./pages/DataEntryPortal";
import CustomerServicePortal from "./pages/CustomerServicePortal";
import CustomerPortal from "./pages/CustomerPortal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider defaultOpen={true}>
          <div className="flex h-screen w-full overflow-hidden bg-background">
            <Sidebar />
            <SidebarInset>
              <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <Suspense
                  fallback={
                    <div className="flex h-full items-center justify-center">
                      Loading Britium Express...
                    </div>
                  }
                >
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Navigate to="/" replace />} />
                    <Route path="/create-delivery" element={<CreateDelivery />} />
                    <Route path="/way-management" element={<WayManagement />} />
                    <Route path="/supervisor" element={<SupervisorPortal />} />
                    <Route path="/data-entry" element={<DataEntryPortal />} />
                    <Route path="/customer-service" element={<CustomerServicePortal />} />
                    <Route path="/customer" element={<CustomerPortal />} />
                    <Route path="/deliverymen" element={<Deliverymen />} />
                    <Route path="/merchants" element={<Merchants />} />
                    <Route path="/waybill" element={<Waybill />} />
                    <Route path="/reporting" element={<Reporting />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;