import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileSearch,
  Globe2,
  Headset,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Ticket,
  UserCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type UiLanguage = "en" | "my" | "both";
type ToastTone = "ok" | "warn" | "err";

type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "PENDING_CUSTOMER"
  | "PENDING_BRANCH"
  | "ESCALATED"
  | "RESOLVED"
  | "CLOSED";

type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type ActionType =
  | "CALL_CUSTOMER"
  | "RESCHEDULE_DELIVERY"
  | "RETURN_TO_SENDER"
  | "ESCALATE_TO_BRANCH"
  | "ESCALATE_TO_SUPERVISOR"
  | "UPDATE_ADDRESS"
  | "MARK_RESOLVED"
  | "CLOSE_TICKET";

type AuthUser = {
  id?: string;
  email?: string;
  role?: string;
  roleCode?: string;
  roles?: string[];
  permissions?: string[];
  branchType?: string;
  displayName?: string;
  name?: string;
  fullName?: string;
};

type TicketActivity = {
  id: string;
  type: string;
  note?: string;
  actorName?: string;
  createdAt: string;
};

type CustomerServiceTicket = {
  id: string;
  ticketNo: string;
  awbNo?: string;
  customerName: string;
  customerPhone: string;
  alternatePhone?: string;
  township?: string;
  city?: string;
  subject: string;
  category: string;
  reasonCode?: string;
  status: TicketStatus;
  priority: TicketPriority;
  branchName?: string;
  assignedAgent?: string;
  deliveryAttemptCount?: number;
  lastStatus?: string;
  lastUpdatedAt: string;
  createdAt: string;
  latestNote?: string;
  activities?: TicketActivity[];
};

type KnowledgeArticle = {
  id: string;
  title: string;
  category: string;
  body: string;
  updatedAt: string;
};

type CustomerLookupResult = {
  id: string;
  customerName: string;
  phone: string;
  alternatePhone?: string;
  township?: string;
  city?: string;
  latestAwbNo?: string;
  activeTicketCount?: number;
  lastDeliveryStatus?: string;
};

type DashboardStats = {
  openTickets: number;
  inProgressTickets: number;
  escalatedTickets: number;
  resolvedToday: number;
};

type ActionForm = {
  actionType: ActionType;
  note: string;
  nextContactAt: string;
};

const SUPERADMIN_EMAILS = new Set(["md@britiumexpress.com"]);

const ACCESS_ROLE_TOKENS = new Set<string>([
  "SYS",
  "SUPER_ADMIN",
  "ADMIN",
  "SUPERVISOR",
  "CUSTOMER_SERVICE",
  "CUSTOMER_SERVICE_AGENT",
  "CUSTOMER_SERVICE_MANAGER",
  "CUSTOMER_SUPPORT",
  "SUPPORT",
  "CALL_CENTER",
  "CALL_CENTER_AGENT",
  "NDR_AGENT",
  "NDR_SUPERVISOR",
  "CSA",
  "CCA",
  "CSH",
  "DSP",
  "HSP",
  "BMG",
  "ROM",
]);

const ACCESS_PERMISSION_TOKENS = new Set<string>([
  "CUSTOMER_SERVICE_ACCESS",
  "CUSTOMER_SERVICE_ALL",
  "NDR_ACCESS",
  "SUPPORT_ACCESS",
  "ALL",
  "SUPER_ADMIN",
]);

const PRIVILEGED_ACTION_ROLE_TOKENS = new Set<string>([
  "SYS",
  "SUPER_ADMIN",
  "ADMIN",
  "SUPERVISOR",
  "CUSTOMER_SERVICE_MANAGER",
  "NDR_SUPERVISOR",
  "DSP",
  "HSP",
  "BMG",
  "ROM",
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
      mergeUnique(asStringArray(obj.userRoles), mergeUnique(asStringArray(role), asStringArray(roleCode)))
    ),
    permissions: mergeUnique(
      asStringArray(obj.permissions),
      mergeUnique(asStringArray(obj.permission), mergeUnique(asStringArray(obj.scopes), asStringArray(obj.scope)))
    ),
    branchType: obj.branchType ?? obj.branch_type ?? obj.branch?.type ?? obj.officeType ?? obj.orgType,
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
    candidate.branchType ||
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
    branchType: patch.branchType ?? base.branchType,
    displayName: patch.displayName ?? base.displayName,
    name: patch.name ?? base.name,
    fullName: patch.fullName ?? base.fullName,
  };
}

function getRoleTokens(user: AuthUser) {
  return new Set(
    [user.role, user.roleCode, ...(user.roles ?? [])]
      .map((item) => normalizeToken(item))
      .filter(Boolean)
  );
}

function getPermissionTokens(user: AuthUser) {
  return new Set((user.permissions ?? []).map((item) => normalizeToken(item)).filter(Boolean));
}

function isSuperadminEmail(email?: string | null) {
  return SUPERADMIN_EMAILS.has((email ?? "").toLowerCase());
}

function canAccessCustomerService(user: AuthUser) {
  if (isSuperadminEmail(user.email)) return true;

  const roleTokens = getRoleTokens(user);
  const permissionTokens = getPermissionTokens(user);

  if ([...roleTokens].some((token) => ACCESS_ROLE_TOKENS.has(token))) return true;
  if ([...permissionTokens].some((token) => ACCESS_PERMISSION_TOKENS.has(token))) return true;

  return false;
}

function canRunPrivilegedAction(user: AuthUser) {
  if (isSuperadminEmail(user.email)) return true;
  const roleTokens = getRoleTokens(user);
  return [...roleTokens].some((token) => PRIVILEGED_ACTION_ROLE_TOKENS.has(token));
}

function formatDateTime(input?: string) {
  if (!input) return "-";
  try {
    return new Date(input).toLocaleString();
  } catch {
    return input;
  }
}

function statusClass(status: TicketStatus) {
  if (status === "RESOLVED" || status === "CLOSED") return "bg-emerald-100 text-emerald-700";
  if (status === "ESCALATED") return "bg-rose-100 text-rose-700";
  if (status === "PENDING_CUSTOMER" || status === "PENDING_BRANCH") return "bg-amber-100 text-amber-700";
  return "bg-sky-100 text-sky-700";
}

function priorityClass(priority: TicketPriority) {
  if (priority === "CRITICAL") return "bg-rose-100 text-rose-700";
  if (priority === "HIGH") return "bg-amber-100 text-amber-700";
  if (priority === "MEDIUM") return "bg-sky-100 text-sky-700";
  return "bg-slate-100 text-slate-700";
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

async function fetchAuthUserFromProfiles(userId: string): Promise<Partial<AuthUser> | null> {
  const tables = ["profiles", "user_profiles", "staff_profiles", "employees"];
  const idFields = ["id", "user_id", "auth_user_id"];
  const selectColumns =
    "id, email, role, role_code, roles, permissions, branch_type, display_name, full_name";

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
        // ignore table drift
      }
    }
  }

  return null;
}

async function resolveAuthUserFromSupabase(): Promise<AuthUser> {
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
      const fromProfiles = await fetchAuthUserFromProfiles(user.id);
      resolved = mergeAuthUser(resolved, fromProfiles);
    }

    if (isSuperadminEmail(resolved.email)) {
      resolved = mergeAuthUser(resolved, {
        role: "SYS",
        roleCode: "SYS",
        roles: ["SYS", "SUPER_ADMIN", ...(resolved.roles ?? [])],
        permissions: ["ALL", "CUSTOMER_SERVICE_ALL", ...(resolved.permissions ?? [])],
      });
    }

    return resolved;
  } catch {
    return resolved;
  }
}

function emptyActionForm(): ActionForm {
  return {
    actionType: "CALL_CUSTOMER",
    note: "",
    nextContactAt: "",
  };
}

export default function CustomerServicePortal() {
  const [authUser, setAuthUser] = useState<AuthUser>({});
  const [authReady, setAuthReady] = useState(false);

  const [language, setLanguage] = useState<UiLanguage>("both");
  const [stats, setStats] = useState<DashboardStats>({
    openTickets: 0,
    inProgressTickets: 0,
    escalatedTickets: 0,
    resolvedToday: 0,
  });
  const [tickets, setTickets] = useState<CustomerServiceTicket[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [lookupResults, setLookupResults] = useState<CustomerLookupResult[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [lookupQuery, setLookupQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "ALL">("ALL");
  const [ticketLoading, setTicketLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [savingAction, setSavingAction] = useState(false);
  const [toast, setToast] = useState<{ tone: ToastTone; message: string } | null>(null);
  const [actionForm, setActionForm] = useState<ActionForm>(emptyActionForm());

  const searchRef = useRef<HTMLInputElement | null>(null);

  const accessAllowed = authReady && canAccessCustomerService(authUser);
  const privilegedAllowed = canRunPrivilegedAction(authUser);

  const actorName =
    authUser.displayName ||
    authUser.fullName ||
    authUser.name ||
    authUser.email ||
    "Customer Service";

  const refreshPortal = useCallback(async () => {
    if (!accessAllowed) return;

    setTicketLoading(true);
    try {
      const [statsRes, ticketRes, articleRes] = await Promise.all([
        fetchJson<DashboardStats>("/api/v1/customer-service/stats"),
        fetchJson<CustomerServiceTicket[]>("/api/v1/customer-service/tickets"),
        fetchJson<KnowledgeArticle[]>("/api/v1/customer-service/knowledge-base"),
      ]);

      setStats(statsRes);
      setTickets(ticketRes);
      setArticles(articleRes);
      setSelectedTicketId((prev) => prev ?? ticketRes[0]?.id ?? null);
    } catch (e) {
      setToast({
        tone: "err",
        message: e instanceof Error ? e.message : "Unable to load customer service data.",
      });
    } finally {
      setTicketLoading(false);
    }
  }, [accessAllowed]);

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
      void refreshPortal();
    }
  }, [accessAllowed, refreshPortal]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredTickets = useMemo(() => {
    const q = query.trim().toLowerCase();

    return tickets.filter((ticket) => {
      if (statusFilter !== "ALL" && ticket.status !== statusFilter) return false;
      if (priorityFilter !== "ALL" && ticket.priority !== priorityFilter) return false;
      if (!q) return true;

      return [
        ticket.ticketNo,
        ticket.awbNo ?? "",
        ticket.customerName,
        ticket.customerPhone,
        ticket.subject,
        ticket.category,
        ticket.township ?? "",
        ticket.city ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [priorityFilter, query, statusFilter, tickets]);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [selectedTicketId, tickets]
  );

  const filteredArticles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return articles.slice(0, 6);

    return articles.filter((article) =>
      [article.title, article.category, article.body].join(" ").toLowerCase().includes(q)
    );
  }, [articles, query]);

  const handleLookup = useCallback(async () => {
    if (!lookupQuery.trim()) {
      setToast({
        tone: "warn",
        message: "Enter AWB, phone, or customer name to search.",
      });
      return;
    }

    setLookupLoading(true);
    try {
      const results = await fetchJson<CustomerLookupResult[]>(
        `/api/v1/customer-service/customer-lookup?query=${encodeURIComponent(lookupQuery.trim())}`
      );
      setLookupResults(results);
    } catch (e) {
      setLookupResults([]);
      setToast({
        tone: "err",
        message: e instanceof Error ? e.message : "Unable to search customer records.",
      });
    } finally {
      setLookupLoading(false);
    }
  }, [lookupQuery]);

  const handleTicketAction = useCallback(async () => {
    if (!selectedTicket) {
      setToast({ tone: "warn", message: "Select a ticket first." });
      return;
    }

    if (!actionForm.note.trim()) {
      setToast({ tone: "warn", message: "Action note is required." });
      return;
    }

    if (
      ["RETURN_TO_SENDER", "ESCALATE_TO_SUPERVISOR", "CLOSE_TICKET"].includes(actionForm.actionType) &&
      !privilegedAllowed
    ) {
      setToast({
        tone: "err",
        message: "This action requires supervisor or manager authority.",
      });
      return;
    }

    setSavingAction(true);

    try {
      const updated = await fetchJson<CustomerServiceTicket>(
        `/api/v1/customer-service/tickets/${selectedTicket.id}/actions`,
        {
          method: "POST",
          body: JSON.stringify({
            actionType: actionForm.actionType,
            note: actionForm.note.trim(),
            nextContactAt: actionForm.nextContactAt || null,
            actorName,
          }),
        }
      );

      setTickets((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setActionForm(emptyActionForm());
      setToast({ tone: "ok", message: "Ticket action saved successfully." });
      await refreshPortal();
    } catch (e) {
      setToast({
        tone: "err",
        message: e instanceof Error ? e.message : "Unable to save ticket action.",
      });
    } finally {
      setSavingAction(false);
    }
  }, [actionForm, actorName, privilegedAllowed, refreshPortal, selectedTicket]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] p-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
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
                Customer Service Portal Access Restricted
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                This portal is only for authorized customer service, call center, NDR,
                supervisor, admin, and system users.
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Signed in as: {authUser.email || "unknown"} · role: {authUser.roleCode || authUser.role || "unknown"}
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
            Customer Care & NDR
          </p>
          <h1 className="text-4xl font-black uppercase tracking-tight text-[#0d2c54]">
            Customer Service Portal{" "}
            <span className="font-normal text-blue-500">/ ဖောက်သည်ဝန်ဆောင်မှု ပေါ်တယ်</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t(
              language,
              "Live customer support queue, NDR handling, customer lookup, and resolution actions using real operational data.",
              "Live customer support queue, NDR handling, customer lookup နှင့် ဖြေရှင်းဆောင်ရွက်မှုများကို တကယ့်လုပ်ငန်း data ဖြင့် အသုံးပြုနိုင်သော portal ဖြစ်သည်။"
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <LanguageToggle value={language} onChange={setLanguage} />
          <button
            type="button"
            onClick={() => void refreshPortal()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={14} className={ticketLoading ? "animate-spin" : ""} />
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

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Ticket} title={t(language, "Open Tickets", "ဖွင့်ထားသော Ticket များ")} value={String(stats.openTickets)} />
        <StatCard icon={Clock3} title={t(language, "In Progress", "လုပ်ဆောင်နေဆဲ")} value={String(stats.inProgressTickets)} accent="amber" />
        <StatCard icon={AlertTriangle} title={t(language, "Escalated", "Escalate လုပ်ထားသော")} value={String(stats.escalatedTickets)} accent="rose" />
        <StatCard icon={CheckCircle2} title={t(language, "Resolved Today", "ယနေ့ ဖြေရှင်းပြီး")} value={String(stats.resolvedToday)} accent="emerald" />
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black text-[#0d2c54]">
                {t(language, "Support Queue", "Support Queue")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t(language, "Live tickets only.", "Live ticket များသာ ပြထားသည်။")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="sr-only" htmlFor="statusFilterSelect">Status Filter</label>
              <select
                id="statusFilterSelect"
                title="Status Filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TicketStatus | "ALL")}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
              >
                <option value="ALL">ALL STATUS</option>
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="PENDING_CUSTOMER">PENDING CUSTOMER</option>
                <option value="PENDING_BRANCH">PENDING BRANCH</option>
                <option value="ESCALATED">ESCALATED</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>

              <label className="sr-only" htmlFor="priorityFilterSelect">Priority Filter</label>
              <select
                id="priorityFilterSelect"
                title="Priority Filter"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | "ALL")}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
              >
                <option value="ALL">ALL PRIORITY</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <div className="relative mt-4">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(language, "Search AWB, phone, customer, subject...", "AWB, phone, customer, subject ဖြင့်ရှာရန်...")}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#0d2c54] focus:bg-white"
            />
          </div>

          <div className="mt-4 space-y-3">
            {filteredTickets.length === 0 ? (
              <EmptyState
                icon={<Ticket size={20} />}
                title={t(language, "No live tickets found", "Live ticket မတွေ့ပါ")}
                body={t(language, "Change search or filters.", "ရှာဖွေမှု သို့မဟုတ် filter များပြောင်းပါ။")}
              />
            ) : (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedTicket?.id === ticket.id
                      ? "border-[#0d2c54] bg-slate-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-black text-[#0d2c54]">{ticket.ticketNo}</div>
                      <div className="mt-1 text-sm text-slate-600">
                        {ticket.customerName} • {ticket.customerPhone}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {ticket.awbNo ? `${ticket.awbNo} • ` : ""}
                        {ticket.category} • {formatDateTime(ticket.lastUpdatedAt)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${statusClass(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${priorityClass(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Headset size={20} className="text-[#0d2c54]" />
              <div>
                <h2 className="text-lg font-black text-[#0d2c54]">
                  {t(language, "Active Ticket Detail", "ရွေးထားသော Ticket အသေးစိတ်")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t(language, "Review customer, AWB, and action timeline.", "Customer, AWB နှင့် ဆောင်ရွက်မှု timeline ကိုကြည့်ရှုပါ။")}
                </p>
              </div>
            </div>

            {selectedTicket ? (
              <div className="mt-5 space-y-4">
                <InfoGrid
                  items={[
                    { label: t(language, "Ticket No", "Ticket No"), value: selectedTicket.ticketNo },
                    { label: t(language, "AWB", "AWB"), value: selectedTicket.awbNo ?? "-" },
                    { label: t(language, "Customer", "Customer"), value: selectedTicket.customerName },
                    { label: t(language, "Phone", "ဖုန်း"), value: selectedTicket.customerPhone },
                    { label: t(language, "Alternate Phone", "အခြားဖုန်း"), value: selectedTicket.alternatePhone ?? "-" },
                    {
                      label: t(language, "Location", "တည်နေရာ"),
                      value: [selectedTicket.city, selectedTicket.township].filter(Boolean).join(" / ") || "-",
                    },
                    { label: t(language, "Branch", "ဌာနခွဲ"), value: selectedTicket.branchName ?? "-" },
                    { label: t(language, "Assigned Agent", "တာဝန်ပေးထားသော Agent"), value: selectedTicket.assignedAgent ?? "-" },
                    { label: t(language, "Subject", "ခေါင်းစဉ်"), value: selectedTicket.subject },
                    { label: t(language, "Reason Code", "အကြောင်းပြချက်ကုဒ်"), value: selectedTicket.reasonCode ?? "-" },
                    { label: t(language, "Last Status", "နောက်ဆုံးအခြေအနေ"), value: selectedTicket.lastStatus ?? "-" },
                    {
                      label: t(language, "Delivery Attempts", "ပို့ဆောင်ကြိမ်"),
                      value: String(selectedTicket.deliveryAttemptCount ?? 0),
                    },
                  ]}
                />

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {t(language, "Latest Note", "နောက်ဆုံးမှတ်ချက်")}
                  </div>
                  <div className="mt-2 text-sm text-slate-600">{selectedTicket.latestNote || "-"}</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-black text-[#0d2c54]">
                    <MessageSquare size={16} />
                    {t(language, "Activity Timeline", "ဆောင်ရွက်မှု Timeline")}
                  </div>
                  <div className="space-y-3">
                    {(selectedTicket.activities ?? []).length === 0 ? (
                      <div className="text-sm text-slate-500">
                        {t(language, "No activity yet.", "ဆောင်ရွက်မှုမရှိသေးပါ။")}
                      </div>
                    ) : (
                      (selectedTicket.activities ?? []).map((activity) => (
                        <div key={activity.id} className="rounded-2xl bg-slate-50 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-semibold text-slate-700">{activity.type}</div>
                            <div className="text-xs text-slate-400">{formatDateTime(activity.createdAt)}</div>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">{activity.actorName || "-"}</div>
                          <div className="mt-2 text-sm text-slate-600">{activity.note || "-"}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<Headset size={20} />}
                title={t(language, "No selected ticket", "Ticket မရွေးရသေးပါ")}
                body={t(language, "Select a ticket from the queue.", "Queue မှ ticket တစ်ခုရွေးပါ။")}
              />
            )}
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-[#0d2c54]" />
              <div>
                <h2 className="text-lg font-black text-[#0d2c54]">
                  {t(language, "Resolution Actions", "ဖြေရှင်းဆောင်ရွက်မှုများ")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t(language, "All actions are saved to live operational records.", "ဆောင်ရွက်မှုအားလုံးကို live operational record များထဲသို့သိမ်းဆည်းမည်။")}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500" htmlFor="actionTypeSelect">
                  {t(language, "Action Type", "ဆောင်ရွက်မှုအမျိုးအစား")}
                </label>
                <select
                  id="actionTypeSelect"
                  title="Action Type"
                  value={actionForm.actionType}
                  onChange={(e) =>
                    setActionForm((prev) => ({
                      ...prev,
                      actionType: e.target.value as ActionType,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-[#0d2c54] focus:bg-white"
                >
                  <option value="CALL_CUSTOMER">CALL_CUSTOMER</option>
                  <option value="RESCHEDULE_DELIVERY">RESCHEDULE_DELIVERY</option>
                  <option value="RETURN_TO_SENDER">RETURN_TO_SENDER</option>
                  <option value="ESCALATE_TO_BRANCH">ESCALATE_TO_BRANCH</option>
                  <option value="ESCALATE_TO_SUPERVISOR">ESCALATE_TO_SUPERVISOR</option>
                  <option value="UPDATE_ADDRESS">UPDATE_ADDRESS</option>
                  <option value="MARK_RESOLVED">MARK_RESOLVED</option>
                  <option value="CLOSE_TICKET">CLOSE_TICKET</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500" htmlFor="nextContactAtInput">
                  {t(language, "Next Contact Time", "နောက်တစ်ကြိမ်ဆက်သွယ်မည့်အချိန်")}
                </label>
                <input
                  id="nextContactAtInput"
                  title="Next Contact Time"
                  type="datetime-local"
                  value={actionForm.nextContactAt}
                  onChange={(e) =>
                    setActionForm((prev) => ({ ...prev, nextContactAt: e.target.value }))
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-[#0d2c54] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500" htmlFor="actionNoteTextarea">
                  {t(language, "Action Note", "ဆောင်ရွက်မှုမှတ်ချက်")}
                </label>
                <textarea
                  id="actionNoteTextarea"
                  value={actionForm.note}
                  onChange={(e) =>
                    setActionForm((prev) => ({ ...prev, note: e.target.value }))
                  }
                  className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#0d2c54] focus:bg-white"
                  placeholder={t(language, "What happened, what was confirmed, what is next?", "ဘာဖြစ်ခဲ့သည်၊ ဘာအတည်ပြုခဲ့သည်၊ နောက်တစ်ဆင့်ဘာလဲ။")}
                />
              </div>

              <button
                type="button"
                disabled={savingAction}
                onClick={() => void handleTicketAction()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0d2c54] px-6 py-3 text-sm font-black uppercase tracking-wider text-white hover:opacity-95 disabled:opacity-50"
              >
                <Send size={16} />
                {t(language, "Save Action", "ဆောင်ရွက်မှုကို သိမ်းမည်")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <FileSearch size={20} className="text-[#0d2c54]" />
            <div>
              <h2 className="text-lg font-black text-[#0d2c54]">
                {t(language, "Customer Lookup", "Customer Lookup")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t(language, "Search customer, phone, or AWB against live data.", "Customer, phone, AWB ကို live data ဖြင့်ရှာဖွေပါ။")}
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <input
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder={t(language, "Search customer / phone / AWB...", "customer / phone / AWB ဖြင့်ရှာရန်...")}
              className="h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-[#0d2c54] focus:bg-white"
            />
            <button
              type="button"
              onClick={() => void handleLookup()}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50"
            >
              {lookupLoading ? "..." : "Search"}
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {lookupResults.length === 0 ? (
              <EmptyState
                icon={<UserCircle2 size={20} />}
                title={t(language, "No customer lookup yet", "Customer lookup မလုပ်ရသေးပါ")}
                body={t(language, "Search by customer name, phone, or AWB.", "Customer name, phone, AWB ဖြင့်ရှာဖွေပါ။")}
              />
            ) : (
              lookupResults.map((row) => (
                <div key={row.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="font-black text-[#0d2c54]">{row.customerName}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {row.phone} {row.alternatePhone ? `• ${row.alternatePhone}` : ""}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {[row.city, row.township].filter(Boolean).join(" / ") || "-"}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <MiniInfo label={t(language, "Latest AWB", "နောက်ဆုံး AWB")} value={row.latestAwbNo ?? "-"} />
                    <MiniInfo label={t(language, "Active Tickets", "ဖွင့်ထားသော ticket")} value={String(row.activeTicketCount ?? 0)} />
                    <MiniInfo label={t(language, "Last Delivery", "နောက်ဆုံးပို့ဆောင်မှု")} value={row.lastDeliveryStatus ?? "-"} />
                    <MiniInfo label={t(language, "Phone", "ဖုန်း")} value={row.phone} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <BookOpen size={20} className="text-[#0d2c54]" />
            <div>
              <h2 className="text-lg font-black text-[#0d2c54]">
                {t(language, "Knowledge Base", "Knowledge Base")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t(language, "Live articles for scripts, FAQs, and standard handling.", "Script, FAQ နှင့် standard handling များအတွက် live article များကိုပြထားသည်။")}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {filteredArticles.length === 0 ? (
              <EmptyState
                icon={<BookOpen size={20} />}
                title={t(language, "No live knowledge articles found", "Live knowledge article မတွေ့ပါ")}
                body={t(language, "Adjust search terms.", "ရှာဖွေမှုစကားလုံးများပြောင်းပါ။")}
              />
            ) : (
              filteredArticles.map((article) => (
                <div key={article.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-black text-[#0d2c54]">{article.title}</div>
                      <div className="mt-1 text-xs uppercase tracking-wider text-slate-400">{article.category}</div>
                    </div>
                    <div className="text-xs text-slate-400">{formatDateTime(article.updatedAt)}</div>
                  </div>
                  <div className="mt-3 line-clamp-4 text-sm text-slate-600">{article.body}</div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <ContactCard icon={Phone} title={t(language, "Hotline", "ဖုန်းလိုင်း")} value="+95-XXX-XXX-XXX" />
            <ContactCard icon={Mail} title={t(language, "Email", "အီးမေးလ်")} value="support@britium.example" />
            <ContactCard icon={MapPin} title={t(language, "Ops Desk", "လုပ်ငန်းဆောင်တာဌာန")} value={actorName} />
          </div>
        </div>
      </div>

      {ticketLoading ? (
        <div className="pointer-events-none fixed bottom-6 right-6 rounded-full bg-[#0d2c54] px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-lg">
          Syncing customer service API...
        </div>
      ) : null}
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

function StatCard({
  icon: Icon,
  title,
  value,
  accent = "default",
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  accent?: "default" | "amber" | "emerald" | "rose";
}) {
  const iconClass =
    accent === "amber"
      ? "text-amber-500"
      : accent === "emerald"
        ? "text-emerald-500"
        : accent === "rose"
          ? "text-rose-500"
          : "text-[#0d2c54]";

  const valueClass =
    accent === "amber"
      ? "text-amber-600"
      : accent === "emerald"
        ? "text-emerald-600"
        : accent === "rose"
          ? "text-rose-600"
          : "text-slate-800";

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <Icon size={24} className={iconClass} />
      <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className={`mt-4 text-3xl font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

function InfoGrid({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {item.label}
          </div>
          <div className="mt-2 font-black text-[#0d2c54]">{item.value || "-"}</div>
        </div>
      ))}
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-700">{value}</div>
    </div>
  );
}

function ContactCard({
  icon: Icon,
  title,
  value,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-white p-2">
          <Icon size={16} className="text-[#0d2c54]" />
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</div>
          <div className="mt-1 text-sm font-semibold text-slate-700">{value}</div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-500">
        {icon}
      </div>
      <div className="mt-3 text-base font-black text-[#0d2c54]">{title}</div>
      <div className="mt-2 text-sm text-slate-500">{body}</div>
    </div>
  );
}