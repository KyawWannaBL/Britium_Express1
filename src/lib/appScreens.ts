export type AppScreenCategory =
  | "Overview"
  | "Customer Service"
  | "Data Entry & Forms"
  | "Warehouse"
  | "Dispatch & Routing"
  | "Management"
  | "Finance & Accounts"
  | "Client Portals"
  | "Branch Office"
  | "Growth & Master Data"
  | "Field Operations"
  | "System & HR";

export type ScreenBackendBinding = {
  rpc: string[];
  tables: string[];
  realtimeTables?: string[];
};

export type AppScreen = {
  key: string;
  title: string;
  path: string;
  category: AppScreenCategory;
  description: string;
  backend: ScreenBackendBinding;
};

function backend(moduleName: string, tables: string[] = [], realtimeTables: string[] = tables): ScreenBackendBinding {
  const slug = moduleName.replace(/-/g, "_");
  return {
    rpc: [`be_${slug}_snapshot`, `be_${slug}_page_snapshot`, `be_${slug}_summary`],
    tables: [`be_v_${slug}`, `be_${slug}`, ...tables],
    realtimeTables,
  };
}

export const appScreens: AppScreen[] = [
  {
    key: "DASHBOARD",
    title: "Dashboard",
    path: "/",
    category: "Overview",
    description: "Executive operating dashboard with live order, pickup, dispatch, delivery, finance, and exception KPIs.",
    backend: backend("dashboard", ["be_portal_pickup_requests", "be_way_plans", "be_app_notifications"]),
  },
  {
    key: "GO_LIVE_READINESS",
    title: "Go-Live Readiness",
    path: "/go-live-readiness",
    category: "Overview",
    description: "Operational readiness checklist for launch blockers, master data health, API health, and workflow coverage.",
    backend: backend("go_live_readiness", ["be_app_notifications", "be_mobile_workforce_accounts", "be_portal_pickup_requests"]),
  },
  {
    key: "ANALYTICS",
    title: "Analytics",
    path: "/analytics",
    category: "Overview",
    description: "Business analytics workspace for performance, pickup conversion, branch throughput, and settlement visibility.",
    backend: backend("analytics", ["be_portal_pickup_requests", "be_way_plans", "be_finance_transactions"]),
  },

  {
    key: "CUSTOMER_SERVICE",
    title: "Customer Service",
    path: "/customer-service",
    category: "Customer Service",
    description: "Customer service portal for support agents and shipment service workflows.",
    backend: backend("customer_service", ["be_portal_pickup_requests", "be_app_notifications"]),
  },
  {
    key: "CS_COMMAND",
    title: "CS Command",
    path: "/cs-command",
    category: "Customer Service",
    description: "Command center for CS escalations, live customer requests, pickup SLA, and service exceptions.",
    backend: backend("cs_command", ["be_app_notifications", "be_portal_pickup_requests"]),
  },
  {
    key: "CS_PORTAL",
    title: "CS Portal",
    path: "/cs-portal",
    category: "Customer Service",
    description: "Customer service portal workspace for daily queue handling, ticket triage, and support follow-up.",
    backend: backend("cs_portal", ["be_portal_pickup_requests", "be_app_notifications"]),
  },
  {
    key: "EXCEPTIONS",
    title: "Exceptions",
    path: "/exceptions",
    category: "Customer Service",
    description: "Exception management board for failed pickups, failed delivery attempts, SLA breaches, and issue resolution.",
    backend: backend("exceptions", ["be_app_notifications", "be_portal_pickup_requests", "be_way_plans"]),
  },

  {
    key: "DATA_ENTRY",
    title: "Data Entry",
    path: "/data-entry",
    category: "Data Entry & Forms",
    description: "Data entry workspace for operations documents, waybills, and manual record correction.",
    backend: backend("data_entry", ["be_portal_pickup_requests"]),
  },
  {
    key: "WAYBILL_STUDIO",
    title: "Waybill Studio",
    path: "/waybill-studio",
    category: "Data Entry & Forms",
    description: "Waybill studio for creating, reviewing, printing, and correcting waybill records.",
    backend: backend("waybill_studio", ["be_waybills", "be_portal_pickup_requests"]),
  },
  {
    key: "PICKUP_FORM",
    title: "Pickup Form",
    path: "/pickup-form",
    category: "Data Entry & Forms",
    description: "Pickup request form connected to pickup queue, CS requests, supervisor assignment, and mobile dispatch workflows.",
    backend: backend("pickup_form", ["be_portal_pickup_requests"]),
  },
  {
    key: "DOC_PRINT",
    title: "Doc Print",
    path: "/doc-print",
    category: "Data Entry & Forms",
    description: "Document printing workspace for waybills, manifests, invoices, labels, and pickup paperwork.",
    backend: backend("doc_print", ["be_waybills", "be_portal_pickup_requests"]),
  },

  {
    key: "WAREHOUSE",
    title: "Warehouse",
    path: "/warehouse",
    category: "Warehouse",
    description: "Warehouse overview for inbound, outbound, sorting, holding, and stock movement visibility.",
    backend: backend("warehouse", ["be_warehouse_jobs", "be_waybills"]),
  },
  {
    key: "WAREHOUSE_OPS",
    title: "Warehouse Ops",
    path: "/warehouse-ops",
    category: "Warehouse",
    description: "Warehouse operations command page for receiving, sorting, scanning, dispatch handover, and exception handling.",
    backend: backend("warehouse_ops", ["be_warehouse_jobs", "be_waybills"]),
  },

  {
    key: "DISPATCH_COMMAND",
    title: "Dispatch Command",
    path: "/dispatch-command",
    category: "Dispatch & Routing",
    description: "Dispatch command center for assigning vehicles, riders, drivers, helpers, branches, and route work.",
    backend: backend("dispatch_command", ["be_way_plans", "be_way_management", "be_mobile_workforce_accounts"]),
  },
  {
    key: "WAYPLAN_COMMAND",
    title: "Wayplan Command",
    path: "/wayplan-command",
    category: "Dispatch & Routing",
    description: "Wayplan command board connected to wayplan, pickup assignment, branch route, and mobile workforce data.",
    backend: backend("wayplan_command", ["be_way_plans", "be_way_management", "be_portal_pickup_requests"]),
  },

  {
    key: "SUPERVISOR",
    title: "Supervisor",
    path: "/supervisor",
    category: "Management",
    description: "Supervisor hub for live pickup, field assignment, wayplan, and go-live control.",
    backend: backend("supervisor", ["be_portal_pickup_requests", "be_way_plans", "be_mobile_workforce_accounts"]),
  },
  {
    key: "SUPERVISOR_PICKUP",
    title: "Supervisor Pickup",
    path: "/supervisor-pickup",
    category: "Management",
    description: "Supervisor pickup assignment board synchronized with CS pickup requests and mobile rider/driver jobs.",
    backend: backend("supervisor_pickup", ["be_portal_pickup_requests", "be_app_notifications", "be_mobile_workforce_accounts"]),
  },
  {
    key: "SUPERVISOR_WAYPLAN",
    title: "Supervisor Wayplan",
    path: "/supervisor-wayplan",
    category: "Management",
    description: "Supervisor wayplan board synchronized with pickup queue, assignment status, and way management data.",
    backend: backend("supervisor_wayplan", ["be_way_plans", "be_way_management", "be_portal_pickup_requests"]),
  },

  {
    key: "FINANCE_PORTAL",
    title: "Finance Portal",
    path: "/finance",
    category: "Finance & Accounts",
    description: "Finance portal for receivables, payables, COD, invoicing, commission, settlements, and finance controls.",
    backend: backend("finance_portal", ["be_finance_transactions", "be_invoices", "be_cod_settlements"]),
  },
  {
    key: "INVOICE_STUDIO",
    title: "Invoice Studio",
    path: "/invoice-studio",
    category: "Finance & Accounts",
    description: "Invoice studio for invoice generation, review, posting, and customer billing visibility.",
    backend: backend("invoice_studio", ["be_invoices", "be_finance_transactions"]),
  },
  {
    key: "COD_SETTLEMENT",
    title: "COD Settlement",
    path: "/cod-settlement",
    category: "Finance & Accounts",
    description: "COD settlement page for cash collection, reconciliation, payout preparation, and settlement exceptions.",
    backend: backend("cod_settlement", ["be_cod_settlements", "be_finance_transactions"]),
  },
  {
    key: "WORKFORCE_COMMISSION",
    title: "Workforce Commission",
    path: "/workforce-commission",
    category: "Finance & Accounts",
    description: "Commission workspace for workforce payout rules, pickup/delivery performance, and commission statements.",
    backend: backend("workforce_commission", ["be_mobile_workforce_accounts", "be_commissions"]),
  },
  {
    key: "RIDER_SETTLEMENT",
    title: "Rider Settlement",
    path: "/rider-settlement",
    category: "Finance & Accounts",
    description: "Rider settlement page for delivery earnings, COD handover, deductions, payouts, and settlement status.",
    backend: backend("rider_settlement", ["be_mobile_workforce_accounts", "be_rider_settlements", "be_cod_settlements"]),
  },

  {
    key: "MERCHANT_PORTAL",
    title: "Merchant Portal",
    path: "/merchant-portal",
    category: "Client Portals",
    description: "Merchant self-service portal for pickup creation, shipment tracking, invoices, claims, and account data.",
    backend: backend("merchant_portal", ["be_merchants", "be_portal_pickup_requests", "be_invoices"]),
  },
  {
    key: "CUSTOMER_PORTAL",
    title: "Customer Portal",
    path: "/customer",
    category: "Client Portals",
    description: "Customer portal for shipment tracking, pickup visibility, account service, and support requests.",
    backend: backend("customer_portal", ["be_portal_pickup_requests", "be_app_notifications"]),
  },

  {
    key: "BRANCH_ADMIN",
    title: "Branch Admin",
    path: "/branch-admin",
    category: "Branch Office",
    description: "Branch admin workspace for branch-level users, operational controls, route areas, and branch performance.",
    backend: backend("branch_admin", ["be_branches", "be_mobile_workforce_accounts", "be_portal_pickup_requests"]),
  },

  {
    key: "MASTER_DATA",
    title: "Master Data",
    path: "/master-data",
    category: "Growth & Master Data",
    description: "Master data control center for branch, township, workforce, merchant, fleet, tariff, and customer records.",
    backend: backend("master_data", ["be_mobile_workforce_accounts", "be_fleet_master", "be_merchants"]),
  },
  {
    key: "BIZ_DEV",
    title: "Biz Dev",
    path: "/biz-dev",
    category: "Growth & Master Data",
    description: "Business development pipeline page for leads, merchants, campaigns, visits, and conversion tracking.",
    backend: backend("biz_dev", ["be_business_development", "be_merchants"]),
  },
  {
    key: "BUSINESS_DEVELOPMENT_MANAGER",
    title: "Business Development Manager",
    path: "/business-development-manager",
    category: "Growth & Master Data",
    description: "BD manager dashboard for lead ownership, pipeline health, merchant onboarding, and conversion performance.",
    backend: backend("business_development_manager", ["be_business_development", "be_merchants"]),
  },
  {
    key: "MARKETING",
    title: "Marketing",
    path: "/marketing",
    category: "Growth & Master Data",
    description: "Marketing workspace for campaigns, promotion performance, audience activity, and growth reporting.",
    backend: backend("marketing", ["be_marketing_campaigns", "be_merchants"]),
  },
  {
    key: "MARKETING_PORTAL",
    title: "Marketing Portal",
    path: "/marketing-portal",
    category: "Growth & Master Data",
    description: "Marketing portal for campaign execution, creative requests, promo tracking, and lead source visibility.",
    backend: backend("marketing_portal", ["be_marketing_campaigns", "be_business_development"]),
  },
  {
    key: "TARIFF",
    title: "Tariff",
    path: "/tariff",
    category: "Growth & Master Data",
    description: "Tariff management for pricing zones, rate cards, merchant tariffs, service charges, and branch pricing rules.",
    backend: backend("tariff", ["be_tariffs", "be_merchants"]),
  },

  {
    key: "RIDER_MANAGEMENT",
    title: "Rider Management",
    path: "/rider-management",
    category: "Field Operations",
    description: "Rider management page for onboarding, availability, branch assignment, performance, and mobile app status.",
    backend: backend("rider_management", ["be_mobile_workforce_accounts", "be_portal_pickup_requests"]),
  },
  {
    key: "MOBILE_SANDBOX",
    title: "Mobile Sandbox",
    path: "/mobile-sandbox",
    category: "Field Operations",
    description: "Mobile sandbox for testing rider and driver mobile workflows, notifications, and assigned job payloads.",
    backend: backend("mobile_sandbox", ["be_app_notifications", "be_mobile_workforce_accounts", "be_portal_pickup_requests"]),
  },
  {
    key: "DRIVER_MANAGEMENT",
    title: "Driver Management",
    path: "/driver-management",
    category: "Field Operations",
    description: "Driver management page for driver onboarding, vehicle pairing, route availability, and performance tracking.",
    backend: backend("driver_management", ["be_mobile_workforce_accounts", "be_fleet_master", "be_way_plans"]),
  },

  {
    key: "ADMIN_HR",
    title: "Admin / HR",
    path: "/admin-hr",
    category: "System & HR",
    description: "Admin and HR workspace for users, roles, teams, permissions, employee records, and workspace controls.",
    backend: backend("admin_hr", ["be_user_profiles", "be_mobile_workforce_accounts"]),
  },
  {
    key: "ACCOUNTS",
    title: "Accounts",
    path: "/accounts",
    category: "System & HR",
    description: "Accounts page for internal user accounts, role assignment, access status, and operational identity controls.",
    backend: backend("accounts", ["be_user_profiles", "be_mobile_workforce_accounts"]),
  },
  {
    key: "PROFILE",
    title: "Profile",
    path: "/profile",
    category: "System & HR",
    description: "User profile page connected to authenticated account details and workspace role data.",
    backend: backend("profile", ["be_user_profiles"]),
  },
  {
    key: "AUDIT_LOGS",
    title: "Audit Logs",
    path: "/audit-logs",
    category: "System & HR",
    description: "Audit log page for system changes, assignment actions, finance activity, and operational history.",
    backend: backend("audit_logs", ["be_audit_logs", "be_app_notifications"]),
  },
  {
    key: "TEMPLATES",
    title: "Templates",
    path: "/templates",
    category: "System & HR",
    description: "Templates page for message templates, document templates, print templates, and notification content.",
    backend: backend("templates", ["be_templates", "be_app_notifications"]),
  },
  {
    key: "SETTINGS",
    title: "Settings",
    path: "/settings",
    category: "System & HR",
    description: "Workspace settings for app configuration, integrations, appearance, and system preferences.",
    backend: backend("settings", ["be_app_settings", "be_user_profiles"]),
  },
];

export const appScreenCategories: AppScreenCategory[] = [
  "Overview",
  "Customer Service",
  "Data Entry & Forms",
  "Warehouse",
  "Dispatch & Routing",
  "Management",
  "Finance & Accounts",
  "Client Portals",
  "Branch Office",
  "Growth & Master Data",
  "Field Operations",
  "System & HR",
];

export function findAppScreen(pathname: string) {
  return appScreens.find((screen) => screen.path === pathname || (screen.path !== "/" && pathname.startsWith(`${screen.path}/`)));
}
