/**
 * Synchronized Route Definitions for Britium Express
 * Aligned with Next.js AppRouter Metadata
 */
export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  CREATE_DELIVERY: "/create-delivery",
  WAY_MANAGEMENT: "/way-management",
  
  // Portals
  CUSTOMER_SERVICE: "/customer-service",
  CUSTOMER_PORTAL: "/customer",
  SUPERVISOR: "/supervisor",
  DATA_ENTRY: "/data-entry",
  
  // Admin & Settings
  DELIVERYMEN: "/deliverymen",
  MERCHANTS: "/merchants",
  SETTINGS: "/settings",
  REPORTING: "/reporting",
} as const;

export type AppRoute = keyof typeof ROUTES;
