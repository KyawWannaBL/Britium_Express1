"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  Bell,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Globe2,
  HandCoins,
  History,
  Landmark,
  Layers3,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  SquarePen,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";

type UiLanguage = "en" | "my" | "both";
type PortalTab =
  | "dashboard"
  | "deliveryman"
  | "accounts"
  | "transactions"
  | "records"
  | "reports"
  | "approval"
  | "fraud"
  | "monitoring"
  | "audit"
  | "periods";

type AuthUser = {
  id?: string;
  email?: string;
  role?: string;
  roleCode?: string;
  roles?: string[];
  permissions?: string[];
  displayName?: string;
  fullName?: string;
  name?: string;
};

type FinanceProfile = {
  userId: string;
  fullName: string;
  employeeCode?: string | null;
  roleCode: string;
  roleLabel: string;
  branchScope: string[];
  zoneScope: string[];
  approvalLimit: number;
  canViewSensitive: boolean;
};

type SharedFilters = {
  dateFrom: string;
  dateTo: string;
  branch: string;
  zone: string;
  search: string;
};

type DashboardStats = {
  totalCashOnHand: number;
  totalCodOnHand: number;
  totalCodTransferred: number;
  pendingCodCollection: number;
  unpostedVouchers: number;
  pendingApprovals: number;
  suspiciousTransactions: number;
  currentRevenue: number;
  currentExpense: number;
  netProfit: number;
};

type DeliverymanAccountingRow = {
  id: string;
  deliverymanName: string;
  branch: string;
  zone: string;
  codOnHand: number;
  codTransferred: number;
  pendingCollection: number;
  prepaidOnHand: number;
  prepaidTransferred: number;
  outstandingDays: number;
  latestTransferDate?: string | null;
  historicalNorm?: number | null;
  exceptionStatus: string;
  riskLevel?: "low" | "medium" | "high" | "critical";
};

type AccountRow = {
  id: string;
  accountCode: string;
  titleEn: string;
  titleMy?: string | null;
  accountType: string;
  accountGroup: string;
  accountClass: string;
  normalBalance: "Debit" | "Credit";
  parentAccount?: string | null;
  active: boolean;
  protected: boolean;
  remark?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
};

type VoucherLine = {
  id?: string;
  accountCode: string;
  description: string;
  debit: number;
  credit: number;
};

type VoucherRow = {
  id: string;
  voucherNo: string;
  referenceNo?: string | null;
  voucherType: "simple" | "journal" | "cash" | "reversal";
  voucherDate: string;
  branch: string;
  zone: string;
  merchant?: string | null;
  customer?: string | null;
  narrative: string;
  amount: number;
  status: "draft" | "submitted" | "approved" | "posted" | "rejected" | "reversed";
  creatorId?: string | null;
  creatorName?: string | null;
  approverName?: string | null;
  riskScore?: number | null;
  attachmentCount?: number | null;
  reviewNotes?: string | null;
  postedAt?: string | null;
  rejectedReason?: string | null;
  lines: VoucherLine[];
};

type FraudAlertRow = {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  branch: string;
  zone: string;
  voucherNo?: string | null;
  rule: string;
  caseStatus: string;
  createdAt: string;
};

type MonitoringRow = {
  id: string;
  title: string;
  subtitle: string;
  branch?: string | null;
  zone?: string | null;
  tone: "blue" | "amber" | "green" | "rose";
  timestamp: string;
};

type AuditRow = {
  id: string;
  userName: string;
  roleCode: string;
  action: string;
  timestamp: string;
  reference?: string | null;
  beforeValue?: string | null;
  afterValue?: string | null;
  ipAddress?: string | null;
  device?: string | null;
  comment?: string | null;
};

type PeriodRow = {
  id: string;
  period: string;
  closed: boolean;
  outstandingApprovals: number;
  unresolvedExceptions: number;
  pendingReconciliations: number;
  notes?: string | null;
};

type ReportRow = {
  id: string;
  accountCode?: string | null;
  accountHead?: string | null;
  description: string;
  openingDebit?: number | null;
  openingCredit?: number | null;
  periodDebit?: number | null;
  periodCredit?: number | null;
  closingDebit?: number | null;
  closingCredit?: number | null;
  branch?: string | null;
  zone?: string | null;
  reportDate?: string | null;
};

type BootstrapPayload = {
  profile: FinanceProfile;
  stats: DashboardStats;
  availableBranches: string[];
  availableZones: string[];
  liveAlerts: MonitoringRow[];
  periods: PeriodRow[];
};

type AccountForm = {
  accountCode: string;
  titleEn: string;
  titleMy: string;
  accountType: string;
  accountGroup: string;
  accountClass: string;
  normalBalance: "Debit" | "Credit";
  parentAccount: string;
  remark: string;
};

type VoucherForm = {
  voucherType: "simple" | "journal" | "cash" | "reversal";
  voucherDate: string;
  branch: string;
  zone: string;
  referenceNo: string;
  merchant: string;
  customer: string;
  narrative: string;
  attachmentCount: string;
  reviewerAssignment: string;
  lines: VoucherLine[];
};

const ACCESS_ROLE_TOKENS = new Set<string>([
  "SYS",
  "SUPER_ADMIN",
  "ADMIN",
  "FINANCE",
  "FINANCE_TEAM",
  "FINANCE_MANAGER",
  "FINANCE_DATA_ENTRY",
  "ACCOUNTANT",
  "ACCOUNTING_MANAGER",
  "CFO",
  "AUDITOR",
]);

const ACCESS_PERMISSION_TOKENS = new Set<string>([
  "FINANCE_PORTAL_ACCESS",
  "FINANCE_ALL",
  "FINANCE_DASHBOARD",
  "FINANCE_VOUCHER_CREATE",
  "FINANCE_VOUCHER_APPROVE",
  "ALL",
  "SUPER_ADMIN",
]);

const MANAGER_ROLE_TOKENS = new Set<string>([
  "SYS",
  "SUPER_ADMIN",
  "ADMIN",
  "FINANCE_MANAGER",
  "ACCOUNTING_MANAGER",
  "CFO",
]);

const SENSITIVE_ROLE_TOKENS = new Set<string>([
  "SYS",
  "SUPER_ADMIN",
  "ADMIN",
  "FINANCE_MANAGER",
  "ACCOUNTING_MANAGER",
  "CFO",
  "AUDITOR",
]);

function t(language: UiLanguage, en: string, my: string) {
  if (language === "en") return en;
  if (language === "my") return my;
  return `${en} / ${my}`;
}

function normalizeToken(value?: string | null) {
  return (value ?? "").trim().replace(/[\s-]+/g, "_").toUpperCase();
}

function mergeUnique(left: string[] = [], right: string[] = []) {
  return Array.from(new Set([...left, ...right].filter(Boolean)));
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function toAuthUserCandidate(raw: unknown): Partial<AuthUser> | null {
  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Record<string, any>;
  const role = obj.role ?? obj.roleCode ?? obj.role_code ?? obj.userType ?? obj.type;
  const roleCode = obj.roleCode ?? obj.role_code ?? obj.role;

  const candidate: Partial<AuthUser> = {
    id: obj.id,
    email: obj.email,
    role: typeof role === "string" ? role : undefined,
    roleCode: typeof roleCode === "string" ? roleCode : undefined,
    roles: mergeUnique(
      asStringArray(obj.roles),
      mergeUnique(asStringArray(obj.userRoles), mergeUnique(asStringArray(role), asStringArray(roleCode))),
    ),
    permissions: mergeUnique(
      asStringArray(obj.permissions),
      mergeUnique(asStringArray(obj.permission), mergeUnique(asStringArray(obj.scopes), asStringArray(obj.scope))),
    ),
    displayName:
      obj.displayName ?? obj.display_name ?? obj.fullName ?? obj.full_name ?? obj.name ?? obj.email,
    name: obj.name,
    fullName: obj.fullName ?? obj.full_name,
  };

  const useful =
    candidate.id ||
    candidate.email ||
    candidate.role ||
    candidate.roleCode ||
    (candidate.roles && candidate.roles.length > 0) ||
    (candidate.permissions && candidate.permissions.length > 0);

  return useful ? candidate : null;
}

function extractAuthCandidate(source: unknown): Partial<AuthUser> | null {
  if (!source || typeof source !== "object") return null;

  const obj = source as Record<string, any>;
  const candidates = [
    obj,
    obj.user,
    obj.currentUser,
    obj.profile,
    obj.session,
    obj.session?.user,
    obj.currentSession,
    obj.currentSession?.user,
    obj.data,
    obj.data?.user,
    obj.data?.session,
    obj.data?.session?.user,
    obj.auth,
    obj.auth?.user,
    obj.me,
    obj.account,
  ];

  for (const candidate of candidates) {
    const mapped = toAuthUserCandidate(candidate);
    if (mapped) return mapped;
  }

  return null;
}

function mergeAuthUser(base: AuthUser, patch?: Partial<AuthUser> | null): AuthUser {
  if (!patch) return base;

  return {
    id: patch.id ?? base.id,
    email: patch.email ?? base.email,
    role: patch.role ?? base.role,
    roleCode: patch.roleCode ?? base.roleCode,
    roles: mergeUnique(base.roles ?? [], patch.roles ?? []),
    permissions: mergeUnique(base.permissions ?? [], patch.permissions ?? []),
    displayName: patch.displayName ?? base.displayName,
    name: patch.name ?? base.name,
    fullName: patch.fullName ?? base.fullName,
  };
}

function getRoleTokens(user: AuthUser) {
  return new Set([user.role, user.roleCode, ...(user.roles ?? [])].map(normalizeToken).filter(Boolean));
}

function getPermissionTokens(user: AuthUser) {
  return new Set((user.permissions ?? []).map(normalizeToken).filter(Boolean));
}

function canAccessFinance(user: AuthUser) {
  const roles = getRoleTokens(user);
  const perms = getPermissionTokens(user);
  if ([...roles].some((token) => ACCESS_ROLE_TOKENS.has(token))) return true;
  if ([...perms].some((token) => ACCESS_PERMISSION_TOKENS.has(token))) return true;
  return false;
}

function canManageFinance(user: AuthUser) {
  const roles = getRoleTokens(user);
  return [...roles].some((token) => MANAGER_ROLE_TOKENS.has(token));
}

function canViewSensitive(user: AuthUser) {
  const roles = getRoleTokens(user);
  return [...roles].some((token) => SENSITIVE_ROLE_TOKENS.has(token));
}

function formatDateTime(input?: string | null) {
  if (!input) return "-";
  try {
    return new Date(input).toLocaleString();
  } catch {
    return input;
  }
}

function formatMMK(value?: number | null) {
  return `${Number(value ?? 0).toLocaleString()} MMK`;
}

function severityTone(
  value?: string | null,
): "blue" | "amber" | "green" | "rose" | "violet" | "slate" {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized.includes("critical") || normalized.includes("rejected")) return "rose";
  if (normalized.includes("high") || normalized.includes("submitted") || normalized.includes("open"))
    return "amber";
  if (normalized.includes("approved") || normalized.includes("posted") || normalized.includes("closed"))
    return "green";
  if (normalized.includes("draft")) return "slate";
  return "blue";
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const raw = await res.text();
  const parsed = raw ? JSON.parse(raw) : {};
  if (!res.ok) {
    throw new Error(parsed?.message || parsed?.error || `Request failed: ${res.status}`);
  }
  return (parsed?.data ?? parsed) as T;
}

function buildFilterQuery(filters: SharedFilters) {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);
  if (filters.branch && filters.branch !== "ALL") params.set("branch", filters.branch);
  if (filters.zone && filters.zone !== "ALL") params.set("zone", filters.zone);
  if (filters.search.trim()) params.set("search", filters.search.trim());
  return params.toString();
}

async function fetchAuthUserFromProfiles(
  supabase: any,
  userId: string,
): Promise<Partial<AuthUser> | null> {
  const tables = ["profiles", "user_profiles", "staff_profiles", "employees"];
  const idFields = ["id", "user_id", "auth_user_id"];
  const selectColumns = "id,email,role,role_code,roles,permissions,display_name,full_name";

  for (const table of tables) {
    for (const idField of idFields) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select(selectColumns)
          .eq(idField, userId)
          .maybeSingle();

        if (!error && data) {
          const extracted = extractAuthCandidate(data);
          if (extracted) return extracted;
        }
      } catch {
        // ignore
      }
    }
  }

  return null;
}

async function resolveAuthUserFromSupabase(): Promise<AuthUser> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return {};

  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
  let resolved: AuthUser = {};

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return {};

    resolved = mergeAuthUser(resolved, extractAuthCandidate(user));

    if (
      (!(resolved.role || resolved.roleCode || (resolved.roles && resolved.roles.length > 0)) ||
        !(resolved.permissions && resolved.permissions.length > 0)) &&
      user.id
    ) {
      const fromProfiles = await fetchAuthUserFromProfiles(supabase, user.id);
      resolved = mergeAuthUser(resolved, fromProfiles);
    }

    return resolved;
  } catch {
    return resolved;
  }
}

function emptyAccountForm(): AccountForm {
  return {
    accountCode: "",
    titleEn: "",
    titleMy: "",
    accountType: "Asset",
    accountGroup: "Current Asset",
    accountClass: "Cash",
    normalBalance: "Debit",
    parentAccount: "",
    remark: "",
  };
}

function emptyVoucherForm(defaultBranch = "", defaultZone = ""): VoucherForm {
  return {
    voucherType: "simple",
    voucherDate: new Date().toISOString().slice(0, 10),
    branch: defaultBranch,
    zone: defaultZone,
    referenceNo: "",
    merchant: "",
    customer: "",
    narrative: "",
    attachmentCount: "0",
    reviewerAssignment: "",
    lines: [
      {
        id: crypto.randomUUID(),
        accountCode: "",
        description: "",
        debit: 0,
        credit: 0,
      },
    ],
  };
}

export default function FinanceAccountingPortalPage() {
  const [authUser, setAuthUser] = useState<AuthUser>({});
  const [authReady, setAuthReady] = useState(false);

  const [language, setLanguage] = useState<UiLanguage>("both");
  const [tab, setTab] = useState<PortalTab>("dashboard");

  const [profile, setProfile] = useState<FinanceProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [availableBranches, setAvailableBranches] = useState<string[]>(["ALL"]);
  const [availableZones, setAvailableZones] = useState<string[]>(["ALL"]);

  const [filters, setFilters] = useState<SharedFilters>({
    dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    dateTo: new Date().toISOString().slice(0, 10),
    branch: "ALL",
    zone: "ALL",
    search: "",
  });

  const [deliverymanRows, setDeliverymanRows] = useState<DeliverymanAccountingRow[]>([]);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlertRow[]>([]);
  const [monitoringRows, setMonitoringRows] = useState<MonitoringRow[]>([]);
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [periods, setPeriods] = useState<PeriodRow[]>([]);

  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);
  const [reportType, setReportType] = useState<string>("trial_balance");
  const [moduleLoading, setModuleLoading] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ tone: "ok" | "warn" | "err"; message: string } | null>(null);

  const [accountForm, setAccountForm] = useState<AccountForm>(emptyAccountForm());
  const [voucherForm, setVoucherForm] = useState<VoucherForm>(emptyVoucherForm());

  const searchRef = useRef<HTMLInputElement | null>(null);

  const accessAllowed = authReady && canAccessFinance(authUser);
  const managerAllowed = canManageFinance(authUser);
  const sensitiveAllowed = canViewSensitive(authUser) || profile?.canViewSensitive === true;

  const selectedVoucher = useMemo(
    () => vouchers.find((item) => item.id === selectedVoucherId) ?? null,
    [selectedVoucherId, vouchers],
  );

  const pendingApprovals = useMemo(
    () => vouchers.filter((item) => item.status === "submitted"),
    [vouchers],
  );

  const unpostedVouchers = useMemo(
    () => vouchers.filter((item) => item.status === "approved"),
    [vouchers],
  );

  const filteredVoucherRows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return vouchers.filter((item) => {
      if (!q) return true;
      return [
        item.voucherNo,
        item.referenceNo ?? "",
        item.narrative,
        item.creatorName ?? "",
        item.merchant ?? "",
        item.customer ?? "",
        item.branch,
        item.zone,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [filters.search, vouchers]);

  const refreshBootstrap = useCallback(async () => {
    if (!accessAllowed) return;

    setModuleLoading((prev) => ({ ...prev, bootstrap: true }));
    try {
      const payload = await fetchJson<BootstrapPayload>("/api/v1/finance-portal/bootstrap");
      setProfile(payload.profile);
      setStats(payload.stats);
      setAvailableBranches(["ALL", ...payload.availableBranches]);
      setAvailableZones(["ALL", ...payload.availableZones]);
      setMonitoringRows(payload.liveAlerts ?? []);
      setPeriods(payload.periods ?? []);
      setVoucherForm((prev) => ({
        ...prev,
        branch: prev.branch || payload.profile.branchScope?.[0] || "",
        zone: prev.zone || payload.profile.zoneScope?.[0] || "",
      }));
    } catch (e) {
      setToast({
        tone: "err",
        message: e instanceof Error ? e.message : "Unable to load finance portal bootstrap.",
      });
    } finally {
      setModuleLoading((prev) => ({ ...prev, bootstrap: false }));
    }
  }, [accessAllowed]);

  const loadModule = useCallback(
    async (module: PortalTab) => {
      if (!accessAllowed) return;

      const query = buildFilterQuery(filters);
      const suffix = query ? `?${query}` : "";

      setModuleLoading((prev) => ({ ...prev, [module]: true }));
      try {
        if (module === "deliveryman") {
          const rows = await fetchJson<DeliverymanAccountingRow[]>(
            `/api/v1/finance-portal/deliveryman-accounting${suffix}`,
          );
          setDeliverymanRows(rows);
        }

        if (module === "accounts") {
          const rows = await fetchJson<AccountRow[]>(`/api/v1/finance-portal/accounts${suffix}`);
          setAccounts(rows);
        }

        if (module === "transactions" || module === "records" || module === "approval") {
          const rows = await fetchJson<VoucherRow[]>(`/api/v1/finance-portal/vouchers${suffix}`);
          setVouchers(rows);
        }

        if (module === "reports") {
          const typeQuery = `${suffix ? `${suffix}&` : "?"}report_type=${encodeURIComponent(reportType)}`;
          const rows = await fetchJson<ReportRow[]>(`/api/v1/finance-portal/reports${typeQuery}`);
          setReports(rows);
        }

        if (module === "fraud") {
          const rows = await fetchJson<FraudAlertRow[]>(`/api/v1/finance-portal/fraud-alerts${suffix}`);
          setFraudAlerts(rows);
        }

        if (module === "monitoring") {
          const rows = await fetchJson<MonitoringRow[]>(`/api/v1/finance-portal/monitoring${suffix}`);
          setMonitoringRows(rows);
        }

        if (module === "audit") {
          const rows = await fetchJson<AuditRow[]>(`/api/v1/finance-portal/audit${suffix}`);
          setAuditRows(rows);
        }

        if (module === "periods") {
          const rows = await fetchJson<PeriodRow[]>(`/api/v1/finance-portal/periods${suffix}`);
          setPeriods(rows);
        }
      } catch (e) {
        setToast({
          tone: "err",
          message: e instanceof Error ? e.message : `Unable to load ${module}.`,
        });
      } finally {
        setModuleLoading((prev) => ({ ...prev, [module]: false }));
      }
    },
    [accessAllowed, filters, reportType],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadAuth() {
      try {
        const user = await resolveAuthUserFromSupabase();
        if (!cancelled) setAuthUser(user);
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    }

    loadAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) return;

    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      const nextUser = await resolveAuthUserFromSupabase();
      setAuthUser(nextUser);
      setAuthReady(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (accessAllowed) {
      void refreshBootstrap();
    }
  }, [accessAllowed, refreshBootstrap]);

  useEffect(() => {
    if (!accessAllowed) return;
    void loadModule(tab);
  }, [accessAllowed, loadModule, tab]);

  useEffect(() => {
    searchRef.current?.focus();
  }, [tab]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleCreateAccount = useCallback(async () => {
    if (!managerAllowed) {
      setToast({ tone: "err", message: "Only finance managers can manage accounts." });
      return;
    }

    if (!accountForm.accountCode.trim() || !accountForm.titleEn.trim()) {
      setToast({ tone: "warn", message: "Account code and title are required." });
      return;
    }

    try {
      const created = await fetchJson<AccountRow>("/api/v1/finance-portal/accounts", {
        method: "POST",
        body: JSON.stringify(accountForm),
      });

      setAccounts((prev) => [created, ...prev]);
      setAccountForm(emptyAccountForm());
      setToast({ tone: "ok", message: "Account created successfully." });
    } catch (e) {
      setToast({
        tone: "err",
        message: e instanceof Error ? e.message : "Unable to create account.",
      });
    }
  }, [accountForm, managerAllowed]);

  const handleVoucherLineChange = useCallback(
    (index: number, patch: Partial<VoucherLine>) => {
      setVoucherForm((prev) => ({
        ...prev,
        lines: prev.lines.map((line, idx) => (idx === index ? { ...line, ...patch } : line)),
      }));
    },
    [],
  );

  const handleAddVoucherLine = useCallback(() => {
    setVoucherForm((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        { id: crypto.randomUUID(), accountCode: "", description: "", debit: 0, credit: 0 },
      ],
    }));
  }, []);

  const handleRemoveVoucherLine = useCallback((index: number) => {
    setVoucherForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, idx) => idx !== index),
    }));
  }, []);

  const validateVoucherForm = useCallback(() => {
    if (!voucherForm.voucherDate || !voucherForm.branch || !voucherForm.zone || !voucherForm.narrative.trim()) {
      return "Voucher header fields are incomplete.";
    }

    if (!voucherForm.lines.length) {
      return "At least one voucher line is required.";
    }

    const hasEmptyLine = voucherForm.lines.some((line) => !line.accountCode.trim());
    if (hasEmptyLine) return "Each voucher line must have an account code.";

    if (voucherForm.voucherType !== "simple") {
      const totalDebit = voucherForm.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
      const totalCredit = voucherForm.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
      if (totalDebit !== totalCredit) return "Debit and credit must balance.";
    }

    return null;
  }, [voucherForm]);

  const handleSaveVoucher = useCallback(
    async (status: "draft" | "submitted") => {
      const validation = validateVoucherForm();
      if (status !== "draft" && validation) {
        setToast({ tone: "warn", message: validation });
        return;
      }

      try {
        const payload = {
          ...voucherForm,
          status,
          attachmentCount: Number(voucherForm.attachmentCount || 0),
        };

        const saved = await fetchJson<VoucherRow>("/api/v1/finance-portal/vouchers", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setVouchers((prev) => [saved, ...prev]);
        setVoucherForm(emptyVoucherForm(profile?.branchScope?.[0] || "", profile?.zoneScope?.[0] || ""));
        setToast({
          tone: "ok",
          message: status === "draft" ? "Draft saved." : "Voucher submitted.",
        });
      } catch (e) {
        setToast({
          tone: "err",
          message: e instanceof Error ? e.message : "Unable to save voucher.",
        });
      }
    },
    [profile?.branchScope, profile?.zoneScope, validateVoucherForm, voucherForm],
  );

  const handleVoucherAction = useCallback(
    async (voucherId: string, action: "approve" | "reject" | "post" | "reopen", comment?: string) => {
      try {
        const updated = await fetchJson<VoucherRow>(
          `/api/v1/finance-portal/vouchers/${voucherId}/actions`,
          {
            method: "POST",
            body: JSON.stringify({ action, comment: comment ?? "" }),
          },
        );

        setVouchers((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
        setToast({ tone: "ok", message: `Voucher ${action} successful.` });
      } catch (e) {
        setToast({
          tone: "err",
          message: e instanceof Error ? e.message : `Unable to ${action} voucher.`,
        });
      }
    },
    [],
  );

  const handleExportReport = useCallback(async () => {
    try {
      const query = buildFilterQuery(filters);
      const url = `/api/v1/finance-portal/reports/export?report_type=${encodeURIComponent(reportType)}${query ? `&${query}` : ""}`;
      const payload = await fetchJson<{ url: string }>(url);
      window.open(payload.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setToast({
        tone: "err",
        message: e instanceof Error ? e.message : "Unable to export report.",
      });
    }
  }, [filters, reportType]);

  const handlePeriodAction = useCallback(
    async (periodId: string, action: "close" | "reopen") => {
      try {
        const updated = await fetchJson<PeriodRow>(
          `/api/v1/finance-portal/periods/${periodId}/actions`,
          {
            method: "POST",
            body: JSON.stringify({ action }),
          },
        );

        setPeriods((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
        setToast({ tone: "ok", message: `Period ${action} successful.` });
      } catch (e) {
        setToast({
          tone: "err",
          message: e instanceof Error ? e.message : `Unable to ${action} period.`,
        });
      }
    },
    [],
  );

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] p-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm text-sm text-slate-500">
          Checking access...
        </div>
      </div>
    );
  }

  if (!accessAllowed) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] p-8">
        <div className="max-w-2xl rounded-[32px] border border-rose-200 bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#0d2c54]">
                Finance Portal Access Restricted
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                This portal is only for authorized finance, accounting, audit, admin, and system users.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
            Finance Suite
          </p>
          <h1 className="text-4xl font-black uppercase tracking-tight text-[#0d2c54]">
            Finance & Accounting Portal{" "}
            <span className="font-normal text-blue-500">
              / ငွေကြေးနှင့်စာရင်းကိုင်ပေါ်တယ်
            </span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t(
              language,
              "Production finance workspace with real approvals, fraud monitoring, reports, audit, and controlled posting.",
              "Real approval, fraud monitoring, report, audit နှင့် controlled posting ပါသော production finance workspace ဖြစ်သည်။",
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <LanguageToggle value={language} onChange={setLanguage} />
          <button
            type="button"
            onClick={() => {
              void refreshBootstrap();
              void loadModule(tab);
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={14} className={moduleLoading.bootstrap ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {toast ? (
        <div
          className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${
            toast.tone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : toast.tone === "warn"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={<Wallet size={18} />}
          title={t(language, "Total Cash on Hand", "လက်ဝယ်ငွေသားစုစုပေါင်း")}
          value={formatMMK(stats?.totalCashOnHand)}
        />
        <MetricCard
          icon={<HandCoins size={18} />}
          title={t(language, "COD on Hand", "COD လက်ဝယ်")}
          value={formatMMK(stats?.totalCodOnHand)}
          accent="amber"
        />
        <MetricCard
          icon={<ArrowLeftRight size={18} />}
          title={t(language, "COD Transferred", "လွှဲပြောင်းပြီး COD")}
          value={formatMMK(stats?.totalCodTransferred)}
          accent="sky"
        />
        <MetricCard
          icon={<CheckCircle2 size={18} />}
          title={t(language, "Pending Approvals", "အတည်ပြုရန်စောင့်ဆိုင်းမှု")}
          value={String(stats?.pendingApprovals ?? 0)}
          accent="emerald"
        />
        <MetricCard
          icon={<ShieldAlert size={18} />}
          title={t(language, "Suspicious Transactions", "မူမမှန် transaction များ")}
          value={String(stats?.suspiciousTransactions ?? 0)}
          accent="rose"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <Panel>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                {t(language, "Signed In As", "လက်ရှိအသုံးပြုသူ")}
              </div>
              <div className="mt-2 font-black text-[#0d2c54]">
                {profile?.fullName || authUser.displayName || authUser.email || "-"}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {profile?.roleLabel || authUser.role || authUser.roleCode || "-"}
              </div>
              <div className="mt-3 text-xs text-slate-400">
                {t(language, "Approval Limit", "အတည်ပြုနိုင်သည့်ကန့်သတ်ချက်")}:{" "}
                {formatMMK(profile?.approvalLimit ?? 0)}
              </div>
            </div>
          </Panel>

          <Panel>
            <div className="space-y-2">
              <TabButton active={tab === "dashboard"} onClick={() => setTab("dashboard")} icon={<Activity size={16} />} label={t(language, "Dashboard", "ဒက်ရှ်ဘုတ်")} />
              <TabButton active={tab === "deliveryman"} onClick={() => setTab("deliveryman")} icon={<HandCoins size={16} />} label={t(language, "Deliveryman Accounting", "ပို့ဆောင်သူငွေစာရင်း")} />
              <TabButton active={tab === "accounts"} onClick={() => setTab("accounts")} icon={<Layers3 size={16} />} label={t(language, "Chart of Accounts", "စာရင်းခေါင်းစဉ်များ")} />
              <TabButton active={tab === "transactions"} onClick={() => setTab("transactions")} icon={<SquarePen size={16} />} label={t(language, "Transactions", "လုပ်ငန်းသွင်းငွေစာရင်း")} />
              <TabButton active={tab === "records"} onClick={() => setTab("records")} icon={<BookOpen size={16} />} label={t(language, "Voucher Records", "Voucher မှတ်တမ်းများ")} />
              <TabButton active={tab === "reports"} onClick={() => setTab("reports")} icon={<FileSpreadsheet size={16} />} label={t(language, "Financial Reports", "ငွေကြေးအစီရင်ခံစာများ")} />
              <TabButton active={tab === "approval"} onClick={() => setTab("approval")} icon={<CheckCircle2 size={16} />} label={t(language, "Approval Queue", "အတည်ပြုရန်ဇယား")} />
              <TabButton active={tab === "fraud"} onClick={() => setTab("fraud")} icon={<ShieldAlert size={16} />} label={t(language, "Fraud Center", "လိမ်လည်မှုစင်တာ")} />
              <TabButton active={tab === "monitoring"} onClick={() => setTab("monitoring")} icon={<Bell size={16} />} label={t(language, "Real-Time Monitoring", "တိုက်ရိုက်စောင့်ကြည့်မှု")} />
              <TabButton active={tab === "audit"} onClick={() => setTab("audit")} icon={<History size={16} />} label={t(language, "Audit Trail", "စစ်ဆေးမှုမှတ်တမ်း")} />
              <TabButton active={tab === "periods"} onClick={() => setTab("periods")} icon={<Lock size={16} />} label={t(language, "Period Closing", "လအပိတ်စီမံခန့်ခွဲမှု")} />
            </div>
          </Panel>
        </aside>

        <main className="space-y-6">
          <Panel>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <InputGroup label={t(language, "Date From", "စတင်ရက်")}>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                  className="field-input"
                />
              </InputGroup>

              <InputGroup label={t(language, "Date To", "ပြီးဆုံးရက်")}>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                  className="field-input"
                />
              </InputGroup>

              <InputGroup label={t(language, "Branch", "ရုံးခွဲ")}>
                <select
                  value={filters.branch}
                  onChange={(e) => setFilters((prev) => ({ ...prev, branch: e.target.value }))}
                  className="field-input"
                >
                  {availableBranches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </InputGroup>

              <InputGroup label={t(language, "Zone", "ဇုန်")}>
                <select
                  value={filters.zone}
                  onChange={(e) => setFilters((prev) => ({ ...prev, zone: e.target.value }))}
                  className="field-input"
                >
                  {availableZones.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </InputGroup>

              <InputGroup label={t(language, "Search", "ရှာဖွေမှု")}>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchRef}
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    placeholder={t(language, "Voucher, reference, merchant...", "Voucher, reference, merchant...")}
                    className="field-input pl-10"
                  />
                </div>
              </InputGroup>
            </div>
          </Panel>

          {tab === "dashboard" ? (
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Panel>
                <SectionTitle
                  icon={<TrendingUp size={18} />}
                  title={t(language, "Operational Summary", "လုပ်ငန်းအနှစ်ချုပ်")}
                  subtitle={t(language, "Live finance status only.", "Live finance status ကိုသာပြထားသည်။")}
                />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <InfoCard label={t(language, "Current Revenue", "လက်ရှိဝင်ငွေ")} value={formatMMK(stats?.currentRevenue)} />
                  <InfoCard label={t(language, "Current Expense", "လက်ရှိအသုံးစရိတ်")} value={formatMMK(stats?.currentExpense)} />
                  <InfoCard label={t(language, "Net Profit", "အမြတ်စစ်စစ်")} value={formatMMK(stats?.netProfit)} />
                  <InfoCard label={t(language, "Pending COD", "စောင့်ဆိုင်း COD")} value={formatMMK(stats?.pendingCodCollection)} />
                  <InfoCard label={t(language, "Unposted Vouchers", "မတင်သွင်းရသေးသော voucher")} value={String(stats?.unpostedVouchers ?? 0)} />
                  <InfoCard label={t(language, "Finance Scope", "finance scope")} value={`${profile?.branchScope?.join(", ") || "-"}`} />
                </div>
              </Panel>

              <Panel>
                <SectionTitle
                  icon={<Bell size={18} />}
                  title={t(language, "Live Alerts", "Live သတိပေးချက်များ")}
                  subtitle={t(language, "Latest monitoring signals.", "နောက်ဆုံးစောင့်ကြည့်မှု signal များ။")}
                />
                <div className="space-y-3">
                  {monitoringRows.length === 0 ? (
                    <EmptyState title={t(language, "No live alerts", "Live alert မရှိပါ")} />
                  ) : (
                    monitoringRows.slice(0, 6).map((row) => (
                      <div key={row.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-black text-[#0d2c54]">{row.title}</div>
                          <StatusBadge label={row.timestamp} tone={row.tone} />
                        </div>
                        <div className="mt-2 text-sm text-slate-600">{row.subtitle}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {[row.branch, row.zone].filter(Boolean).join(" • ")}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Panel>
            </div>
          ) : null}

          {tab === "deliveryman" ? (
            <Panel>
              <SectionTitle
                icon={<HandCoins size={18} />}
                title={t(language, "Deliveryman Accounting", "ပို့ဆောင်သူငွေစာရင်း")}
                subtitle={t(language, "Live COD and prepaid accounting by branch and zone.", "Branch နှင့် zone အလိုက် live COD နှင့် prepaid accounting ကိုပြထားသည်။")}
              />
              <SimpleTable
                columns={[
                  "Deliveryman",
                  "Branch",
                  "Zone",
                  "COD on Hand",
                  "Transferred",
                  "Pending",
                  "Prepaid",
                  "Aging",
                  "Status",
                ]}
                rows={deliverymanRows.map((row) => [
                  row.deliverymanName,
                  row.branch,
                  row.zone,
                  formatMMK(row.codOnHand),
                  formatMMK(row.codTransferred),
                  formatMMK(row.pendingCollection),
                  formatMMK(row.prepaidOnHand),
                  `${row.outstandingDays} d`,
                  <StatusBadge key={`${row.id}-status`} label={row.exceptionStatus} tone={severityTone(row.riskLevel || row.exceptionStatus)} />,
                ])}
                loading={moduleLoading.deliveryman}
              />
            </Panel>
          ) : null}

          {tab === "accounts" ? (
            <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
              <Panel>
                <SectionTitle
                  icon={<Layers3 size={18} />}
                  title={t(language, "Chart of Accounts", "စာရင်းခေါင်းစဉ်များ")}
                  subtitle={t(language, "Live account master data.", "Live account master data ကိုပြထားသည်။")}
                />
                <SimpleTable
                  columns={["Code", "Title", "Type", "Group", "Class", "Normal", "Status", "Updated"]}
                  rows={accounts.map((row) => [
                    row.accountCode,
                    row.titleEn,
                    row.accountType,
                    row.accountGroup,
                    row.accountClass,
                    row.normalBalance,
                    <StatusBadge key={`${row.id}-active`} label={row.active ? "ACTIVE" : "INACTIVE"} tone={row.active ? "green" : "rose"} />,
                    formatDateTime(row.updatedAt),
                  ])}
                  loading={moduleLoading.accounts}
                />
              </Panel>

              <Panel>
                <SectionTitle
                  icon={<Plus size={18} />}
                  title={t(language, "Manage Account", "account စီမံမည်")}
                  subtitle={t(language, "Manager-only account maintenance.", "Manager-only account maintenance ဖြစ်သည်။")}
                />
                <div className="space-y-4">
                  <InputGroup label={t(language, "Account Code", "account code")}>
                    <input
                      value={accountForm.accountCode}
                      onChange={(e) => setAccountForm((prev) => ({ ...prev, accountCode: e.target.value }))}
                      className="field-input"
                    />
                  </InputGroup>
                  <InputGroup label={t(language, "Title EN", "Title EN")}>
                    <input
                      value={accountForm.titleEn}
                      onChange={(e) => setAccountForm((prev) => ({ ...prev, titleEn: e.target.value }))}
                      className="field-input"
                    />
                  </InputGroup>
                  <InputGroup label={t(language, "Title MY", "Title MY")}>
                    <input
                      value={accountForm.titleMy}
                      onChange={(e) => setAccountForm((prev) => ({ ...prev, titleMy: e.target.value }))}
                      className="field-input"
                    />
                  </InputGroup>
                  <InputGroup label={t(language, "Type", "အမျိုးအစား")}>
                    <select
                      value={accountForm.accountType}
                      onChange={(e) => setAccountForm((prev) => ({ ...prev, accountType: e.target.value }))}
                      className="field-input"
                    >
                      <option>Asset</option>
                      <option>Liability</option>
                      <option>Income</option>
                      <option>Expense</option>
                      <option>Equity</option>
                    </select>
                  </InputGroup>
                  <InputGroup label={t(language, "Normal Balance", "မူလ balance")}>
                    <select
                      value={accountForm.normalBalance}
                      onChange={(e) =>
                        setAccountForm((prev) => ({
                          ...prev,
                          normalBalance: e.target.value as "Debit" | "Credit",
                        }))
                      }
                      className="field-input"
                    >
                      <option value="Debit">Debit</option>
                      <option value="Credit">Credit</option>
                    </select>
                  </InputGroup>
                  <InputGroup label={t(language, "Remark", "မှတ်ချက်")}>
                    <textarea
                      value={accountForm.remark}
                      onChange={(e) => setAccountForm((prev) => ({ ...prev, remark: e.target.value }))}
                      className="field-textarea"
                    />
                  </InputGroup>
                  <button
                    type="button"
                    disabled={!managerAllowed}
                    onClick={() => void handleCreateAccount()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0d2c54] px-5 py-3 text-sm font-black uppercase tracking-wider text-white disabled:opacity-50"
                  >
                    <Send size={16} />
                    {t(language, "Create Account", "account ဖန်တီးမည်")}
                  </button>
                </div>
              </Panel>
            </div>
          ) : null}

          {tab === "transactions" ? (
            <Panel>
              <SectionTitle
                icon={<SquarePen size={18} />}
                title={t(language, "Transaction Entry", "transaction ဖြည့်သွင်းခြင်း")}
                subtitle={t(language, "Simple, journal, cash, and reversal workflows.", "Simple, journal, cash နှင့် reversal workflow များ။")}
              />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <InputGroup label={t(language, "Voucher Type", "voucher အမျိုးအစား")}>
                  <select
                    value={voucherForm.voucherType}
                    onChange={(e) =>
                      setVoucherForm((prev) => ({
                        ...prev,
                        voucherType: e.target.value as VoucherForm["voucherType"],
                      }))
                    }
                    className="field-input"
                  >
                    <option value="simple">simple</option>
                    <option value="journal">journal</option>
                    <option value="cash">cash</option>
                    <option value="reversal">reversal</option>
                  </select>
                </InputGroup>
                <InputGroup label={t(language, "Voucher Date", "voucher ရက်စွဲ")}>
                  <input
                    type="date"
                    value={voucherForm.voucherDate}
                    onChange={(e) => setVoucherForm((prev) => ({ ...prev, voucherDate: e.target.value }))}
                    className="field-input"
                  />
                </InputGroup>
                <InputGroup label={t(language, "Branch", "ရုံးခွဲ")}>
                  <select
                    value={voucherForm.branch}
                    onChange={(e) => setVoucherForm((prev) => ({ ...prev, branch: e.target.value }))}
                    className="field-input"
                  >
                    <option value="">Select</option>
                    {availableBranches.filter((x) => x !== "ALL").map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </InputGroup>
                <InputGroup label={t(language, "Zone", "ဇုန်")}>
                  <select
                    value={voucherForm.zone}
                    onChange={(e) => setVoucherForm((prev) => ({ ...prev, zone: e.target.value }))}
                    className="field-input"
                  >
                    <option value="">Select</option>
                    {availableZones.filter((x) => x !== "ALL").map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </InputGroup>
                <InputGroup label={t(language, "Reference No", "reference number")}>
                  <input
                    value={voucherForm.referenceNo}
                    onChange={(e) => setVoucherForm((prev) => ({ ...prev, referenceNo: e.target.value }))}
                    className="field-input"
                  />
                </InputGroup>
                <InputGroup label={t(language, "Merchant", "ကုန်သည်")}>
                  <input
                    value={voucherForm.merchant}
                    onChange={(e) => setVoucherForm((prev) => ({ ...prev, merchant: e.target.value }))}
                    className="field-input"
                  />
                </InputGroup>
                <InputGroup label={t(language, "Customer", "ဖောက်သည်")}>
                  <input
                    value={voucherForm.customer}
                    onChange={(e) => setVoucherForm((prev) => ({ ...prev, customer: e.target.value }))}
                    className="field-input"
                  />
                </InputGroup>
                <InputGroup label={t(language, "Attachment Count", "attachment အရေအတွက်")}>
                  <input
                    type="number"
                    min="0"
                    value={voucherForm.attachmentCount}
                    onChange={(e) => setVoucherForm((prev) => ({ ...prev, attachmentCount: e.target.value }))}
                    className="field-input"
                  />
                </InputGroup>
              </div>

              <div className="mt-4">
                <InputGroup label={t(language, "Narrative", "ဖော်ပြချက်")}>
                  <textarea
                    value={voucherForm.narrative}
                    onChange={(e) => setVoucherForm((prev) => ({ ...prev, narrative: e.target.value }))}
                    className="field-textarea"
                  />
                </InputGroup>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-black text-[#0d2c54]">
                    {t(language, "Voucher Lines", "voucher line များ")}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVoucherLine}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-700"
                  >
                    + Add Line
                  </button>
                </div>

                <div className="space-y-3">
                  {voucherForm.lines.map((line, index) => (
                    <div key={line.id || index} className="grid gap-3 md:grid-cols-[1.4fr_1.6fr_1fr_1fr_auto]">
                      <input
                        value={line.accountCode}
                        onChange={(e) => handleVoucherLineChange(index, { accountCode: e.target.value })}
                        placeholder="Account code"
                        className="field-input"
                      />
                      <input
                        value={line.description}
                        onChange={(e) => handleVoucherLineChange(index, { description: e.target.value })}
                        placeholder="Description"
                        className="field-input"
                      />
                      <input
                        type="number"
                        min="0"
                        value={line.debit}
                        onChange={(e) => handleVoucherLineChange(index, { debit: Number(e.target.value || 0) })}
                        className="field-input"
                      />
                      <input
                        type="number"
                        min="0"
                        value={line.credit}
                        onChange={(e) => handleVoucherLineChange(index, { credit: Number(e.target.value || 0) })}
                        className="field-input"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveVoucherLine(index)}
                        className="rounded-xl bg-rose-600 px-4 py-3 text-xs font-black uppercase tracking-wider text-white"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleSaveVoucher("draft")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-700"
                >
                  <FileText size={15} />
                  {t(language, "Save Draft", "draft သိမ်းမည်")}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveVoucher("submitted")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#0d2c54] px-5 py-3 text-xs font-black uppercase tracking-wider text-white"
                >
                  <Send size={15} />
                  {t(language, "Submit Voucher", "voucher တင်သွင်းမည်")}
                </button>
              </div>
            </Panel>
          ) : null}

          {tab === "records" ? (
            <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
              <Panel>
                <SectionTitle
                  icon={<BookOpen size={18} />}
                  title={t(language, "Voucher Records", "Voucher မှတ်တမ်းများ")}
                  subtitle={t(language, "Live voucher list and browsing.", "Live voucher list နှင့် browsing ကိုပြထားသည်။")}
                />
                <SimpleTable
                  columns={["Voucher", "Type", "Date", "Branch", "Amount", "Status", "Approver", "Action"]}
                  rows={filteredVoucherRows.map((row) => [
                    row.voucherNo,
                    row.voucherType,
                    row.voucherDate,
                    row.branch,
                    formatMMK(row.amount),
                    <StatusBadge key={`${row.id}-status`} label={row.status} tone={severityTone(row.status)} />,
                    row.approverName || "-",
                    <button
                      key={`${row.id}-open`}
                      type="button"
                      onClick={() => setSelectedVoucherId(row.id)}
                      className="font-black text-[#0d2c54]"
                    >
                      Open
                    </button>,
                  ])}
                  loading={moduleLoading.records}
                />
              </Panel>

              <Panel>
                <SectionTitle
                  icon={<Eye size={18} />}
                  title={t(language, "Detail Drawer", "အသေးစိတ် drawer")}
                  subtitle={t(language, "Selected voucher details.", "ရွေးချယ်ထားသော voucher အသေးစိတ်။")}
                />
                {selectedVoucher ? (
                  <div className="space-y-4">
                    <InfoCard label="Voucher" value={selectedVoucher.voucherNo} />
                    <InfoCard label="Narrative" value={selectedVoucher.narrative} />
                    <InfoCard label="Reference" value={selectedVoucher.referenceNo || "-"} />
                    <InfoCard label="Status" value={selectedVoucher.status} />
                    <InfoCard label="Risk Score" value={String(selectedVoucher.riskScore ?? 0)} />
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 text-sm font-black text-[#0d2c54]">Ledger Impact Preview</div>
                      <div className="space-y-2">
                        {selectedVoucher.lines.map((line, idx) => (
                          <div key={`${line.accountCode}-${idx}`} className="rounded-xl bg-white p-3 text-sm text-slate-700">
                            {line.accountCode} • {line.description} • D {line.debit.toLocaleString()} / C{" "}
                            {line.credit.toLocaleString()}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState title={t(language, "No voucher selected", "voucher မရွေးရသေးပါ")} />
                )}
              </Panel>
            </div>
          ) : null}

          {tab === "reports" ? (
            <Panel>
              <SectionTitle
                icon={<FileSpreadsheet size={18} />}
                title={t(language, "Financial Reports", "ငွေကြေးအစီရင်ခံစာများ")}
                subtitle={t(language, "Live reporting only.", "Live reporting ကိုသာပြထားသည်။")}
              />
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="field-input max-w-[260px]"
                >
                  <option value="cash_book">cash_book</option>
                  <option value="journal_summary">journal_summary</option>
                  <option value="trial_balance">trial_balance</option>
                  <option value="income_statement">income_statement</option>
                  <option value="balance_sheet">balance_sheet</option>
                  <option value="profit_loss">profit_loss</option>
                </select>
                <button
                  type="button"
                  onClick={() => void loadModule("reports")}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-700"
                >
                  Reload
                </button>
                {sensitiveAllowed ? (
                  <button
                    type="button"
                    onClick={() => void handleExportReport()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#0d2c54] px-4 py-3 text-xs font-black uppercase tracking-wider text-white"
                  >
                    <Download size={14} />
                    Export
                  </button>
                ) : null}
              </div>
              <SimpleTable
                columns={[
                  "Account",
                  "Head",
                  "Description",
                  "Opening D/C",
                  "Period D/C",
                  "Closing D/C",
                ]}
                rows={reports.map((row) => [
                  row.accountCode || "-",
                  row.accountHead || "-",
                  row.description,
                  `${Number(row.openingDebit ?? 0).toLocaleString()} / ${Number(row.openingCredit ?? 0).toLocaleString()}`,
                  `${Number(row.periodDebit ?? 0).toLocaleString()} / ${Number(row.periodCredit ?? 0).toLocaleString()}`,
                  `${Number(row.closingDebit ?? 0).toLocaleString()} / ${Number(row.closingCredit ?? 0).toLocaleString()}`,
                ])}
                loading={moduleLoading.reports}
              />
            </Panel>
          ) : null}

          {tab === "approval" ? (
            <Panel>
              <SectionTitle
                icon={<CheckCircle2 size={18} />}
                title={t(language, "Approval Queue", "အတည်ပြုရန်ဇယား")}
                subtitle={t(language, "Maker-checker controlled approvals.", "Maker-checker controlled approval များ။")}
              />
              <div className="space-y-4">
                {pendingApprovals.length === 0 ? (
                  <EmptyState title={t(language, "No pending approvals", "စောင့်ဆိုင်း approval မရှိပါ")} />
                ) : (
                  pendingApprovals.map((voucher) => (
                    <div key={voucher.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="font-black text-[#0d2c54]">{voucher.voucherNo}</div>
                          <div className="mt-1 text-sm text-slate-600">
                            {voucher.branch} • {voucher.zone} • {voucher.creatorName || "-"}
                          </div>
                          <div className="mt-2 text-sm text-slate-500">{voucher.narrative}</div>
                        </div>
                        <div className="rounded-xl bg-white px-4 py-3 font-black text-[#0d2c54]">
                          {formatMMK(voucher.amount)}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={!managerAllowed}
                          onClick={() => void handleVoucherAction(voucher.id, "approve")}
                          className="rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black uppercase tracking-wider text-white disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={!managerAllowed}
                          onClick={() => void handleVoucherAction(voucher.id, "reject", "Returned by reviewer")}
                          className="rounded-2xl bg-rose-600 px-4 py-3 text-xs font-black uppercase tracking-wider text-white disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={!managerAllowed}
                          onClick={() => void handleVoucherAction(voucher.id, "post")}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-700 disabled:opacity-50"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          ) : null}

          {tab === "fraud" ? (
            <Panel>
              <SectionTitle
                icon={<ShieldAlert size={18} />}
                title={t(language, "Fraud Center", "လိမ်လည်မှုစင်တာ")}
                subtitle={t(language, "Live fraud and control alerts.", "Live fraud နှင့် control alert များ။")}
              />
              <div className="space-y-4">
                {fraudAlerts.length === 0 ? (
                  <EmptyState title={t(language, "No fraud alerts", "fraud alert မရှိပါ")} />
                ) : (
                  fraudAlerts.map((alert) => (
                    <div key={alert.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-black text-[#0d2c54]">{alert.title}</div>
                        <StatusBadge label={alert.severity.toUpperCase()} tone={severityTone(alert.severity)} />
                      </div>
                      <div className="mt-2 text-sm text-slate-600">{alert.description}</div>
                      <div className="mt-2 text-xs text-slate-400">
                        {alert.rule} • {alert.branch} • {alert.zone} • {formatDateTime(alert.createdAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          ) : null}

          {tab === "monitoring" ? (
            <Panel>
              <SectionTitle
                icon={<Bell size={18} />}
                title={t(language, "Real-Time Monitoring", "တိုက်ရိုက်စောင့်ကြည့်မှု")}
                subtitle={t(language, "Live finance monitoring feed.", "Live finance monitoring feed ကိုပြထားသည်။")}
              />
              <div className="space-y-4">
                {monitoringRows.length === 0 ? (
                  <EmptyState title={t(language, "No monitoring rows", "monitoring row မရှိပါ")} />
                ) : (
                  monitoringRows.map((row) => (
                    <div key={row.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-black text-[#0d2c54]">{row.title}</div>
                        <StatusBadge label={row.timestamp} tone={row.tone} />
                      </div>
                      <div className="mt-2 text-sm text-slate-600">{row.subtitle}</div>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          ) : null}

          {tab === "audit" ? (
            <Panel>
              <SectionTitle
                icon={<History size={18} />}
                title={t(language, "Audit Trail", "စစ်ဆေးမှုမှတ်တမ်း")}
                subtitle={t(language, "Immutable operational audit history.", "Immutable operational audit history ကိုပြထားသည်။")}
              />
              <SimpleTable
                columns={["User", "Role", "Action", "Timestamp", "Reference", "IP / Device"]}
                rows={auditRows.map((row) => [
                  row.userName,
                  row.roleCode,
                  row.action,
                  formatDateTime(row.timestamp),
                  row.reference || "-",
                  `${row.ipAddress || "-"} • ${row.device || "-"}`,
                ])}
                loading={moduleLoading.audit}
              />
            </Panel>
          ) : null}

          {tab === "periods" ? (
            <Panel>
              <SectionTitle
                icon={<Lock size={18} />}
                title={t(language, "Period Closing", "လအပိတ်စီမံခန့်ခွဲမှု")}
                subtitle={t(language, "Open and closed accounting periods.", "ဖွင့်ထားသောနှင့်ပိတ်ပြီးသော accounting period များ။")}
              />
              <div className="space-y-4">
                {periods.length === 0 ? (
                  <EmptyState title={t(language, "No periods found", "period မတွေ့ပါ")} />
                ) : (
                  periods.map((row) => (
                    <div key={row.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="font-black text-[#0d2c54]">{row.period}</div>
                          <div className="mt-1 text-sm text-slate-600">
                            {t(language, "Outstanding Approvals", "စောင့်ဆိုင်း approval")}: {row.outstandingApprovals}
                          </div>
                          <div className="mt-1 text-sm text-slate-600">
                            {t(language, "Unresolved Exceptions", "မဖြေရှင်းရသေးသော exception")}: {row.unresolvedExceptions}
                          </div>
                          <div className="mt-1 text-sm text-slate-600">
                            {t(language, "Pending Reconciliations", "စောင့်ဆိုင်း reconciliation")}: {row.pendingReconciliations}
                          </div>
                          <div className="mt-2 text-sm text-slate-500">{row.notes || "-"}</div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <StatusBadge label={row.closed ? "CLOSED" : "OPEN"} tone={row.closed ? "green" : "amber"} />
                          <button
                            type="button"
                            disabled={!managerAllowed}
                            onClick={() => void handlePeriodAction(row.id, row.closed ? "reopen" : "close")}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-700 disabled:opacity-50"
                          >
                            {row.closed ? "Reopen" : "Close"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          ) : null}
        </main>
      </div>

      {(moduleLoading.bootstrap || moduleLoading[tab]) ? (
        <div className="pointer-events-none fixed bottom-6 right-6 rounded-full bg-[#0d2c54] px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-lg">
          Syncing finance portal...
        </div>
      ) : null}

      <style jsx>{`
        .field-input {
          width: 100%;
          height: 48px;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: rgb(248 250 252);
          padding: 0 1rem;
          font-size: 0.875rem;
          color: rgb(15 23 42);
          outline: none;
        }

        .field-input:focus {
          border-color: rgba(13, 44, 84, 0.45);
          box-shadow: 0 0 0 4px rgba(13, 44, 84, 0.08);
          background: white;
        }

        .field-textarea {
          width: 100%;
          min-height: 110px;
          resize: none;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: rgb(248 250 252);
          padding: 0.875rem 1rem;
          font-size: 0.875rem;
          color: rgb(15 23 42);
          outline: none;
        }

        .field-textarea:focus {
          border-color: rgba(13, 44, 84, 0.45);
          box-shadow: 0 0 0 4px rgba(13, 44, 84, 0.08);
          background: white;
        }
      `}</style>
    </div>
  );
}

function LanguageToggle({
  value,
  onChange,
}: {
  value: UiLanguage;
  onChange: (value: UiLanguage) => void;
}) {
  const items: Array<{ value: UiLanguage; label: string }> = [
    { value: "en", label: "EN" },
    { value: "my", label: "မြန်မာ" },
    { value: "both", label: "EN + မြန်မာ" },
  ];

  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
        <Globe2 size={14} />
        <span>Language</span>
      </div>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              active ? "bg-[#0d2c54] text-white shadow" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function Panel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
    >
      {children}
    </motion.section>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-4 border-b border-slate-200 pb-4">
      <div className="rounded-2xl bg-slate-50 p-3 text-[#0d2c54]">{icon}</div>
      <div>
        <h2 className="text-lg font-black text-[#0d2c54]">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
        active ? "bg-[#0d2c54] text-white" : "bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {icon}
      <span>{label}</span>
      <ChevronRight size={14} className="ml-auto" />
    </button>
  );
}

function MetricCard({
  icon,
  title,
  value,
  accent = "default",
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  accent?: "default" | "amber" | "emerald" | "rose" | "sky";
}) {
  const iconClass =
    accent === "amber"
      ? "text-amber-500"
      : accent === "emerald"
        ? "text-emerald-500"
        : accent === "rose"
          ? "text-rose-500"
          : accent === "sky"
            ? "text-sky-500"
            : "text-[#0d2c54]";

  const valueClass =
    accent === "amber"
      ? "text-amber-600"
      : accent === "emerald"
        ? "text-emerald-600"
        : accent === "rose"
          ? "text-rose-600"
          : accent === "sky"
            ? "text-sky-600"
            : "text-slate-800";

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className={iconClass}>{icon}</div>
      <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className={`mt-4 text-3xl font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-2 font-black text-[#0d2c54]">{value}</div>
    </div>
  );
}

function InputGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function StatusBadge({
  label,
  tone = "blue",
}: {
  label: string;
  tone?: "blue" | "amber" | "green" | "rose" | "violet" | "slate";
}) {
  const palette = {
    blue: "bg-sky-100 text-sky-700",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-emerald-100 text-emerald-700",
    rose: "bg-rose-100 text-rose-700",
    violet: "bg-violet-100 text-violet-700",
    slate: "bg-slate-100 text-slate-700",
  }[tone];

  return (
    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${palette}`}>
      {label}
    </span>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
      {title}
    </div>
  );
}

function SimpleTable({
  columns,
  rows,
  loading,
}: {
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        Loading...
      </div>
    );
  }

  if (!rows.length) {
    return <EmptyState title="No records found." />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-4 py-3 font-black">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-t border-slate-100">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-4 py-3 align-top text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}