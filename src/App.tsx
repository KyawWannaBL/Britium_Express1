import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </div>
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

          <Route path="/" element={<AppShell><Dashboard /></AppShell>} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/create-delivery" element={<AppShell><CreateDelivery /></AppShell>} />
          <Route path="/way-management" element={<AppShell><WayManagement /></AppShell>} />
          <Route path="/customer-service" element={<AppShell><CustomerServicePortal /></AppShell>} />
          <Route path="/customer" element={<AppShell><CustomerPortal /></AppShell>} />
          <Route path="/supervisor" element={<AppShell><SupervisorPortal /></AppShell>} />
          <Route path="/data-entry" element={<AppShell><DataEntryPortal /></AppShell>} />
          <Route path="/deliverymen" element={<AppShell><Deliverymen /></AppShell>} />
          <Route path="/merchants" element={<AppShell><Merchants /></AppShell>} />
          <Route path="/receipts" element={<AppShell><Receipts /></AppShell>} />
          <Route path="/reporting" element={<AppShell><Reporting /></AppShell>} />
          <Route path="/settings" element={<AppShell><Settings /></AppShell>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
