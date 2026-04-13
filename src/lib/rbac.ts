export type AuthorityLevel = "L0" | "L1" | "L2" | "L3" | "L4" | "L5";
export type DataScope = "S1" | "S2" | "S3" | "S4" | "S5";

export const SCREEN_GROUPS = {
  EXTERNAL: [
    "EXT-01","EXT-02","EXT-03","EXT-04","EXT-05","EXT-06","EXT-07","EXT-08","EXT-09",
  ],
  OPS: [
    "OPS-01","OPS-02","OPS-03","OPS-04","OPS-05","OPS-06","OPS-07",
  ],
  PUP: [
    "PUP-01","PUP-02","PUP-03","PUP-04","PUP-05","PUP-06",
  ],
  HUB: [
    "HUB-01","HUB-02","HUB-03","HUB-04","HUB-05","HUB-06","HUB-07",
  ],
  FIN: [
    "FIN-01","FIN-02","FIN-03","FIN-04","FIN-05","FIN-06",
  ],
  BILL: [
    "BILL-01","BILL-02","BILL-03","BILL-04","BILL-05","BILL-06",
  ],
  CLM: [
    "CLM-01","CLM-02","CLM-03","CLM-04",
  ],
  HR: [
    "HR-01","HR-02","HR-03","HR-04","HR-05","HR-06","HR-07",
  ],
  ADM: [
    "ADM-01","ADM-02","ADM-03","ADM-04","ADM-05","ADM-06",
  ],
} as const;

export const ALL_SCREENS = [
  ...SCREEN_GROUPS.EXTERNAL,
  ...SCREEN_GROUPS.OPS,
  ...SCREEN_GROUPS.PUP,
  ...SCREEN_GROUPS.HUB,
  ...SCREEN_GROUPS.FIN,
  ...SCREEN_GROUPS.BILL,
  ...SCREEN_GROUPS.CLM,
  ...SCREEN_GROUPS.HR,
  ...SCREEN_GROUPS.ADM,
] as const;

export type ScreenCode = typeof ALL_SCREENS[number];

export const API_SCOPES = [
  "shipment.read",
  "shipment.write",
  "pickup.read",
  "pickup.write",
  "delivery.read",
  "delivery.write",
  "warehouse.read",
  "warehouse.write",
  "finance.read",
  "finance.write",
  "billing.read",
  "billing.write",
  "claims.read",
  "claims.write",
  "hr.read",
  "hr.write",
  "admin.read",
  "admin.write",
  "audit.read",
  "audit.write",
] as const;

export type ApiScope = typeof API_SCOPES[number];

export type RoleDefinition = {
  code: string;
  label: string;
  level: AuthorityLevel;
  scopes: DataScope[];
  screens: ScreenCode[];
  api: ApiScope[];
};

const OPS_PLUS = [
  ...SCREEN_GROUPS.EXTERNAL,
  ...SCREEN_GROUPS.OPS,
  ...SCREEN_GROUPS.PUP,
  ...SCREEN_GROUPS.HUB,
] as ScreenCode[];

const FIN_PLUS = [
  ...SCREEN_GROUPS.FIN,
  ...SCREEN_GROUPS.BILL,
  ...SCREEN_GROUPS.CLM,
] as ScreenCode[];

const HR_PLUS = [
  ...SCREEN_GROUPS.HR,
] as ScreenCode[];

const ADMIN_PLUS = [
  ...ALL_SCREENS,
] as ScreenCode[];

export const ROLE_DEFINITIONS: Record<string, RoleDefinition> = {
  CUS: {
    code: "CUS",
    label: "Customer",
    level: "L0",
    scopes: ["S1"],
    screens: ["EXT-01", "EXT-02", "EXT-03"],
    api: ["shipment.read"],
  },
  MER: {
    code: "MER",
    label: "Merchant",
    level: "L0",
    scopes: ["S1"],
    screens: ["EXT-04", "EXT-05", "EXT-06", "EXT-07", "EXT-08", "EXT-09"],
    api: ["shipment.read", "shipment.write", "billing.read"],
  },
  INT: {
    code: "INT",
    label: "Internal Guest",
    level: "L0",
    scopes: ["S1"],
    screens: ["EXT-09"],
    api: ["shipment.read"],
  },
  CSA: {
    code: "CSA",
    label: "Customer Service Agent",
    level: "L1",
    scopes: ["S1", "S2", "S3"],
    screens: [...SCREEN_GROUPS.EXTERNAL, "OPS-07", "CLM-01"],
    api: ["shipment.read", "claims.read"],
  },
  CCA: {
    code: "CCA",
    label: "Call Center Agent",
    level: "L1",
    scopes: ["S1", "S2", "S3"],
    screens: [...SCREEN_GROUPS.EXTERNAL],
    api: ["shipment.read"],
  },
  CUR: {
    code: "CUR",
    label: "Courier",
    level: "L1",
    scopes: ["S1", "S2", "S3"],
    screens: ["OPS-04", "OPS-05", "OPS-06", "PUP-03", "PUP-04"],
    api: ["delivery.read", "delivery.write"],
  },
  HSC: {
    code: "HSC",
    label: "Hub Scanner",
    level: "L1",
    scopes: ["S2", "S3"],
    screens: ["HUB-01", "HUB-02", "HUB-03", "HUB-04"],
    api: ["warehouse.read", "warehouse.write"],
  },
  CSH: {
    code: "CSH",
    label: "Customer Service Head",
    level: "L1",
    scopes: ["S2", "S3"],
    screens: [...SCREEN_GROUPS.EXTERNAL, "OPS-07", "CLM-01", "CLM-02"],
    api: ["shipment.read", "claims.read", "claims.write"],
  },
  DSP: {
    code: "DSP",
    label: "Dispatch Supervisor",
    level: "L2",
    scopes: ["S3", "S4"],
    screens: [...SCREEN_GROUPS.PUP, "OPS-04", "OPS-05"],
    api: ["pickup.read", "pickup.write", "delivery.read"],
  },
  HSP: {
    code: "HSP",
    label: "Hub Supervisor",
    level: "L2",
    scopes: ["S3", "S4"],
    screens: [...SCREEN_GROUPS.HUB],
    api: ["warehouse.read", "warehouse.write"],
  },
  FLM: {
    code: "FLM",
    label: "Fleet Manager",
    level: "L2",
    scopes: ["S3", "S4"],
    screens: ["PUP-04", "PUP-05", "PUP-06", "OPS-05"],
    api: ["pickup.read", "pickup.write", "delivery.read", "delivery.write"],
  },
  BIL: {
    code: "BIL",
    label: "Billing Officer",
    level: "L2",
    scopes: ["S3", "S4"],
    screens: [...SCREEN_GROUPS.BILL],
    api: ["billing.read", "billing.write"],
  },
  AR: {
    code: "AR",
    label: "Accounts Receivable",
    level: "L2",
    scopes: ["S3", "S4"],
    screens: ["FIN-01", "FIN-02", "FIN-03", ...SCREEN_GROUPS.BILL],
    api: ["finance.read", "finance.write", "billing.read", "billing.write"],
  },
  CLM: {
    code: "CLM",
    label: "Claims Officer",
    level: "L2",
    scopes: ["S3", "S4"],
    screens: [...SCREEN_GROUPS.CLM],
    api: ["claims.read", "claims.write"],
  },
  HRO: {
    code: "HRO",
    label: "HR Officer",
    level: "L2",
    scopes: ["S3", "S4"],
    screens: [...SCREEN_GROUPS.HR],
    api: ["hr.read", "hr.write"],
  },
  BMG: {
    code: "BMG",
    label: "Branch Manager",
    level: "L3",
    scopes: ["S3", "S4"],
    screens: [...OPS_PLUS, ...FIN_PLUS],
    api: ["shipment.read", "pickup.read", "delivery.read", "warehouse.read", "finance.read", "billing.read"],
  },
  ROM: {
    code: "ROM",
    label: "Regional Operations Manager",
    level: "L3",
    scopes: ["S3", "S4"],
    screens: [...OPS_PLUS, "CLM-01", "CLM-02"],
    api: ["shipment.read", "pickup.read", "delivery.read", "warehouse.read", "claims.read"],
  },
  FINM: {
    code: "FINM",
    label: "Finance Manager",
    level: "L4",
    scopes: ["S5"],
    screens: [...FIN_PLUS],
    api: ["finance.read", "finance.write", "billing.read", "billing.write", "claims.read"],
  },
  CAP: {
    code: "CAP",
    label: "Chief Accounts / Compliance",
    level: "L4",
    scopes: ["S5"],
    screens: [...FIN_PLUS, ...SCREEN_GROUPS.ADM],
    api: ["finance.read", "finance.write", "billing.read", "billing.write", "audit.read"],
  },
  HRM: {
    code: "HRM",
    label: "HR Manager",
    level: "L4",
    scopes: ["S5"],
    screens: [...HR_PLUS],
    api: ["hr.read", "hr.write"],
  },
  AUD: {
    code: "AUD",
    label: "Auditor",
    level: "L5",
    scopes: ["S5"],
    screens: [...ALL_SCREENS],
    api: [...API_SCOPES],
  },
  SYS: {
    code: "SYS",
    label: "System Super Admin",
    level: "L5",
    scopes: ["S5"],
    screens: [...ADMIN_PLUS],
    api: [...API_SCOPES],
  },
};

export const ROLE_ALIASES: Record<string, string> = {
  customer: "CUS",
  merchant: "MER",
  customer_service: "CSA",
  cs: "CSA",
  courier: "CUR",
  supervisor: "DSP",
  data_entry: "HSC",
  admin: "SYS",
  super_admin: "SYS",
  sys: "SYS",
  app_owner: "SYS",
  manager: "BMG",
  merchant_admin: "MER",
  merchant_owner: "MER",
  merchant_manager: "MER",
};

export function normalizeRole(value?: string | null) {
  return (value ?? "").trim().replace(/[\s-]+/g, "_").toLowerCase();
}

export function resolveRoleCode(value?: string | null) {
  const raw = normalizeRole(value);
  if (!raw) return "INT";
  const direct = raw.toUpperCase();
  if (ROLE_DEFINITIONS[direct]) return direct;
  const alias = ROLE_ALIASES[raw];
  return alias || "INT";
}

export function getRoleDefinition(value?: string | null) {
  return ROLE_DEFINITIONS[resolveRoleCode(value)];
}

export function getGrantedScreens(value?: string | null) {
  return getRoleDefinition(value).screens;
}

export function getGrantedApiScopes(value?: string | null) {
  return getRoleDefinition(value).api;
}

export function hasScreenAccess(value: string | null | undefined, screen: ScreenCode) {
  return getGrantedScreens(value).includes(screen);
}

export function hasApiPermission(value: string | null | undefined, scope: ApiScope) {
  return getGrantedApiScopes(value).includes(scope);
}

export function canAccessScope(value: string | null | undefined, scope: DataScope) {
  return getRoleDefinition(value).scopes.includes(scope) || getRoleDefinition(value).level === "L5";
}

export function isSuperAdminEmail(email?: string | null) {
  return (email ?? "").trim().toLowerCase() === "md@britiumexpress.com";
}
