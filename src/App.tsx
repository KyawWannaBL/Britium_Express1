import { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Sidebar } from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import CreateDelivery from "./pages/CreateDelivery";
import WayManagement from "./pages/WayManagement";
import Deliverymen from "./pages/Deliverymen";
import Merchants from "./pages/Merchants";
import Waybill from "@/pages/Waybill";
import Reporting from "./pages/Reporting";
import Settings from "./pages/Settings";
import SupervisorPortal from "./pages/SupervisorPortal";
import SupervisorPickupPage from "./pages/SupervisorPickupPage";
import SupervisorWayplanPage from "./pages/SupervisorWayplanPage";
import DataEntryPortal from "./pages/DataEntryPortal";
import CustomerServicePortal from "./pages/CustomerServicePortal";
import CustomerPortal from "./pages/CustomerPortal";
import ProductionOperations from "./pages/ProductionOperations";
import LiveApiScreen from "./pages/LiveApiScreen";
import { appScreens, type AppScreen } from "@/lib/appScreens";

const queryClient = new QueryClient();

function normalizeInitialUrl() {
  if (typeof window === "undefined") return;
  const { search, hash } = window.location;
  if (!hash.startsWith("#/")) return;

  const hashPath = hash.slice(1).split("?")[0] || "/";
  const hashSearch = hash.includes("?") ? `?${hash.split("?").slice(1).join("?")}` : search;
  window.history.replaceState(null, "", `${hashPath}${hashSearch}`);
}

normalizeInitialUrl();

function LegacyRouteNormalizer() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!location.hash?.startsWith("#/")) return;
    const nextPath = location.hash.slice(1).split("?")[0] || "/";
    const nextSearch = location.hash.includes("?") ? `?${location.hash.split("?").slice(1).join("?")}` : location.search;
    navigate(`${nextPath}${nextSearch}`, { replace: true });
  }, [location.hash, location.search, navigate]);

  return null;
}

function renderScreen(screen: AppScreen) {
  switch (screen.key) {
    case "DASHBOARD":
      return <Dashboard />;
    case "CUSTOMER_SERVICE":
    case "CS_PORTAL":
      return <CustomerServicePortal />;
    case "DATA_ENTRY":
      return <DataEntryPortal />;
    case "WAYBILL_STUDIO":
      return <Waybill />;
    case "WAYPLAN_COMMAND":
      return <WayManagement />;
    case "SUPERVISOR":
      return <SupervisorPortal />;
    case "SUPERVISOR_PICKUP":
      return <SupervisorPickupPage />;
    case "SUPERVISOR_WAYPLAN":
      return <SupervisorWayplanPage />;
    case "MERCHANT_PORTAL":
      return <Merchants />;
    case "CUSTOMER_PORTAL":
      return <CustomerPortal />;
    case "RIDER_MANAGEMENT":
      return <Deliverymen />;
    case "SETTINGS":
      return <Settings />;
    default:
      return <LiveApiScreen screen={screen} />;
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LegacyRouteNormalizer />
        <SidebarProvider defaultOpen={true}>
          <div className="flex h-screen w-full overflow-hidden bg-background">
            <Sidebar />
            <SidebarInset>
              <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <Suspense fallback={<div className="flex h-full items-center justify-center">Loading Britium Express...</div>}>
                  <Routes>
                    {appScreens.map((screen) => (
                      <Route key={screen.key} path={screen.path} element={renderScreen(screen)} />
                    ))}

                    <Route path="/dashboard" element={<Navigate to="/" replace />} />
                    <Route path="/operations" element={<ProductionOperations />} />
                    <Route path="/create-delivery" element={<CreateDelivery />} />
                    <Route path="/way-management" element={<WayManagement />} />
                    <Route path="/customer-service/*" element={<CustomerServicePortal />} />
                    <Route path="/deliverymen" element={<Deliverymen />} />
                    <Route path="/rider/portal" element={<Deliverymen />} />
                    <Route path="/merchants" element={<Navigate to="/merchant-portal" replace />} />
                    <Route path="/waybill" element={<Navigate to="/waybill-studio" replace />} />
                    <Route path="/reporting" element={<Reporting />} />
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
