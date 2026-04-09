import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
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

// Layout Wrapper to keep Sidebar consistent
const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen w-full overflow-hidden bg-background">
    <Sidebar />
    <main className="flex-1 overflow-y-auto p-8">
      {children}
    </main>
  </div>
);

// Stub components for the new portals
const Placeholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-full">
    <h1 className="text-2xl font-bold">{title} Portal</h1>
    <p className="text-muted-foreground">This module is currently being initialized.</p>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Core Dashboard Routes */}
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/create-delivery" element={<Layout><CreateDelivery /></Layout>} />
          <Route path="/way-management" element={<Layout><WayManagement /></Layout>} />
          
          {/* New Portal Routes requested for Britium Express */}
          <Route path="/customer-service" element={<Layout><CustomerServicePortal /></Layout>} />
          <Route path="/customer" element={<Layout><CustomerPortal /></Layout>} />
          <Route path="/supervisor" element={<Layout><SupervisorPortal /></Layout>} />
          <Route path="/data-entry" element={<Layout><DataEntryPortal /></Layout>} />
          
          {/* Management Routes */}
          <Route path="/deliverymen" element={<Layout><Deliverymen /></Layout>} />
          <Route path="/merchants" element={<Layout><Merchants /></Layout>} />
          <Route path="/receipts" element={<Layout><Receipts /></Layout>} />
          <Route path="/reporting" element={<Layout><Reporting /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
