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

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen w-full overflow-hidden bg-background">
    <Sidebar />
    <main className="flex-1 overflow-y-auto p-8">{children}</main>
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
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/create-delivery" element={<Layout><CreateDelivery /></Layout>} />
          <Route path="/way-management" element={<Layout><WayManagement /></Layout>} />
          <Route path="/customer-service" element={<Layout><CustomerServicePortal /></Layout>} />
          <Route path="/customer" element={<Layout><CustomerPortal /></Layout>} />
          <Route path="/supervisor" element={<Layout><SupervisorPortal /></Layout>} />
          <Route path="/data-entry" element={<Layout><DataEntryPortal /></Layout>} />
          <Route path="/deliverymen" element={<Layout><Deliverymen /></Layout>} />
          <Route path="/merchants" element={<Layout><Merchants /></Layout>} />
          <Route path="/receipts" element={<Layout><Receipts /></Layout>} />
          <Route path="/reporting" element={<Layout><Reporting /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
