import { supabase } from "@/lib/supabase/client";

// Define supabaseUrl and supabaseAnonKey here if needed
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
import { createClient } from "@supabase/supabase-js";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Download,
  FileText,
  Globe2,
  MapPinned,
  Megaphone,
  RefreshCw,
  Search,
  Send,
  Store,
  Target,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type UiLanguage = "en" | "my" | "both";
type PortalView =
  | "OVERVIEW"
  | "REGISTRY"
  | "KPI"
  | "PLAN"
  | "REPORT"
  | "PROGRESS";

type ToastTone = "ok" | "warn" | "err";
type LeadSource =
  | "FIELD_VISIT"
  | "FACEBOOK"
  | "REFERRAL"
  | "CALL_CENTER"
  | "WALK_IN"
  | "OTHER";
type MerchantTier = "NEW" | "STANDARD" | "PRIORITY" | "ENTERPRISE";
type ReportStatus = "DRAFT" | "SUBMITTED" | "REVIEWED";

type AllowedRole =
  | "SYS"
  | "SUPER_ADMIN"
  | "ADMIN"
  | "SUPERVISOR"
  | "MARKETING"
  | "MARKETING_MANAGER"
  | "MARKETING_STAFF"
  | "MARKETING_LEAD"
  | "MKT"
  | "DATA_ENTRY"
  | "DATA_ENTRY_CLERK"
  | "SENIOR_DATA_ENTRY_REVIEWER"
  | "DATA_ENTRY_SUPERVISOR"
  | "GUEST";

type ProfileRow = {
  id: string;
  role: string | null;
  full_name: string | null;
  can_export_marketing: boolean | null;
};

type CustomerRecord = {
  id: string;
  name: string;
  phone: string;
  township: string;
  address: string;
  source: LeadSource;
  interested_service: string;
  created_at: string;
};

type MerchantRecord = {
  id: string;
  name: string;
  phone: string;
  township: string;
  address: string;
  category: string;
  tier: MerchantTier;
  assigned_marketing_staff: string;
  joined_at: string;
  status: string | null;
};

type MerchantKpiTarget = {
  id: string;
  merchant_id: string;
  month_label: string;
  target_parcels: number;
  target_revenue_mmk: number;
  set_by_name: string | null;
  created_at: string;
};

type MarketingPlan = {
  id: string;
  title: string;
  marketing_way: string;
  destination: string;
  objective: string;
  planned_date: string;
  estimated_leads: number;
  owner_name: string | null;
  note: string | null;
  status: string | null;
  created_at: string;
};

type DailyReport = {
  id: string;
  report_date: string;
  staff_name: string;
  visited_merchants: number;
  new_leads: number;
  converted_merchants: number;
  issues: string | null;
  actions: string | null;
  status: ReportStatus;
  created_at: string;
};

type ShipmentLite = {
  id: string;
  merchant_id: string | null;
  created_at: string;
  status: string | null;
  total_collectable_amount: number | null;
};

type RegistryForm = {
  type: "CUSTOMER" | "MERCHANT";
  name: string;
  phone: string;
  township: string;
  address: string;
  source: LeadSource;
  interestedService: string;
  category: string;
  tier: MerchantTier;
  assignedMarketingStaff: string;
};

type KpiForm = {
  merchantId: string;
  targetParcels: string;
  targetRevenueMmk: string;
  monthLabel: string;
};

type PlanForm = {
  title: string;
  marketingWay: string;
  destination: string;
  objective: string;
  plannedDate: string;
  estimatedLeads: string;
  note: string;
};

type ReportForm = {
  reportDate: string;
  visitedMerchants: string;
  newLeads: string;
  convertedMerchants: string;
  issues: string;
  actions: string;
};

type MerchantCompiledProgress = {
  merchantId: string;
  merchantName: string;
  township: string;
  category: string;
  tier: MerchantTier;
  assignedMarketingStaff: string;
  targetParcels: number;
  actualParcels: number;
  targetRevenueMmk: number;
  actualRevenueMmk: number;
  parcelHitRate: number;
  revenueHitRate: number;
};

type TeamPerformanceRow = {
  staffName: string;
  visitedMerchants: number;
  newLeads: number;
  convertedMerchants: number;
};

const ACCESS_ROLES = new Set<AllowedRole>([
  "SYS",
  "SUPER_ADMIN",
  "ADMIN",
  "SUPERVISOR",
  "MARKETING",
  "MARKETING_MANAGER",
  "MARKETING_STAFF",
  "MARKETING_LEAD",
  "MKT",
  "DATA_ENTRY",
  "DATA_ENTRY_CLERK",
  "SENIOR_DATA_ENTRY_REVIEWER",
  "DATA_ENTRY_SUPERVISOR",
  "GUEST",
]);

function bi(language: UiLanguage, en: string, my: string) {
  if (language === "en") return en;
  if (language === "my") return my;
  return `${en} / ${my}`;
}

function formatDate(input?: string) {
  if (!input) return "-";
  try {
    return new Date(input).toLocaleDateString();
  } catch {
    return input;
  }
}

function formatMMK(value: number) {
  return `${Number(value || 0).toLocaleString()} MMK`;
}

function monthBounds(monthLabel: string) {
  const [year, month] = monthLabel.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function normalizeRole(role?: string | null): AllowedRole {
  const value = String(role ?? "GUEST").toUpperCase();
  if (ACCESS_ROLES.has(value as AllowedRole)) return value as AllowedRole;
  return "GUEST";
}

function hasAccess(role: AllowedRole) {
  return ACCESS_ROLES.has(role);
}

function canSetTargets(role: AllowedRole) {
  return role === "SYS" || role === "SUPER_ADMIN" || role === "ADMIN";
}

function canExport(role: AllowedRole, explicit?: boolean | null) {
  if (explicit) return true;
  return [
    "SYS",
    "SUPER_ADMIN",
    "ADMIN",
    "SUPERVISOR",
    "MARKETING_MANAGER",
    "DATA_ENTRY_SUPERVISOR",
    "SENIOR_DATA_ENTRY_REVIEWER",
  ].includes(role);
}

function tierClass(tier: MerchantTier) {
  if (tier === "ENTERPRISE") return "bg-violet-100 text-violet-700";
  if (tier === "PRIORITY") return "bg-amber-100 text-amber-700";
  if (tier === "STANDARD") return "bg-sky-100 text-sky-700";
  return "bg-emerald-100 text-emerald-700";
}

function reportStatusClass(status: ReportStatus) {
  if (status === "REVIEWED") return "bg-emerald-100 text-emerald-700";
  if (status === "SUBMITTED") return "bg-sky-100 text-sky-700";
  return "bg-slate-100 text-slate-700";
}

function toCsv(rows: Array<Array<string | number>>) {
  return rows
    .map((row) =>
      row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function emptyRegistryForm(): RegistryForm {
  return {
    type: "CUSTOMER",
    name: "",
    phone: "",
    township: "",
    address: "",
    source: "FIELD_VISIT",
    interestedService: "",
    category: "",
    tier: "NEW",
    assignedMarketingStaff: "",
  };
}

function emptyKpiForm(): KpiForm {
  return {
    merchantId: "",
    targetParcels: "",
    targetRevenueMmk: "",
    monthLabel: new Date().toISOString().slice(0, 7),
  };
}

function emptyPlanForm(): PlanForm {
  return {
    title: "",
    marketingWay: "",
    destination: "",
    objective: "",
    plannedDate: new Date().toISOString().slice(0, 10),
    estimatedLeads: "",
    note: "",
  };
}

function emptyReportForm(): ReportForm {
  return {
    reportDate: new Date().toISOString().slice(0, 10),
    visitedMerchants: "",
    newLeads: "",
    convertedMerchants: "",
    issues: "",
    actions: "",
  };
}

export default function MarketingPortalPage() {
  const supabase = useMemo(() => createClient(supabaseUrl, supabaseAnonKey), []);
  const [language, setLanguage] = useState<UiLanguage>("both");
  const [view, setView] = useState<PortalView>("OVERVIEW");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7),
  );

  const [role, setRole] = useState<AllowedRole>("GUEST");
  const [actorName, setActorName] = useState("Marketing Staff");
  const [explicitExport, setExplicitExport] = useState(false);

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [merchants, setMerchants] = useState<MerchantRecord[]>([]);
  const [kpiTargets, setKpiTargets] = useState<MerchantKpiTarget[]>([]);
  const [plans, setPlans] = useState<MarketingPlan[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [shipments, setShipments] = useState<ShipmentLite[]>([]);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ tone: ToastTone; message: string } | null>(
    null,
  );

  const [registryForm, setRegistryForm] = useState<RegistryForm>(emptyRegistryForm());
  const [kpiForm, setKpiForm] = useState<KpiForm>(emptyKpiForm());
  const [planForm, setPlanForm] = useState<PlanForm>(emptyPlanForm());
  const [reportForm, setReportForm] = useState<ReportForm>(emptyReportForm());

  const searchRef = useRef<HTMLInputElement | null>(null);

  const t = useCallback((en: string, my: string) => bi(language, en, my), [language]);

  const accessAllowed = hasAccess(role);
  const targetAllowed = canSetTargets(role);
  const exportAllowed = canExport(role, explicitExport);

  const loadPortal = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let activeRole: AllowedRole = "GUEST";
      let activeName = "Marketing Staff";
      let activeExport = false;

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, role, full_name, can_export_marketing")
          .eq("id", user.id)
          .maybeSingle<ProfileRow>();

        activeRole = normalizeRole(profile?.role);
        activeName = profile?.full_name || user.email || "Marketing Staff";
        activeExport = Boolean(profile?.can_export_marketing);
      }

      setRole(activeRole);
      setActorName(activeName);
      setExplicitExport(activeExport);

      const { start, end } = monthBounds(selectedMonth);

      const [
        customersRes,
        merchantsRes,
        kpiRes,
        plansRes,
        reportsRes,
        shipmentsRes,
      ] = await Promise.all([
        supabase
          .from("marketing_customers")
          .select(
            "id, name, merchant_name, phone, township, address, source, interested_service, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(300),
        supabase
          .from("merchants")
          .select(
            "id, name, phone, township, address, category, tier, assigned_marketing_staff, joined_at, status",
          )
          .order("joined_at", { ascending: false })
          .limit(300),
        supabase
          .from("marketing_kpi_targets")
          .select(
            "id, merchant_id, month_label, target_parcels, target_revenue_mmk, set_by_name, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("marketing_plans")
          .select(
            "id, title, marketing_way, destination, objective, planned_date, estimated_leads, owner_name, note, status, created_at",
          )
          .order("planned_date", { ascending: false })
          .limit(300),
        supabase
          .from("marketing_daily_reports")
          .select(
            "id, report_date, staff_name, visited_merchants, new_leads, converted_merchants, issues, actions, status, created_at",
          )
          .order("report_date", { ascending: false })
          .limit(300),
        supabase
          .from("shipments")
          .select("id, merchant_id, created_at, status, total_collectable_amount")
          .gte("created_at", start)
          .lte("created_at", end)
          .order("created_at", { ascending: false })
          .limit(5000),
      ]);

      if (customersRes.data) {
        const normalizedCustomers: CustomerRecord[] = customersRes.data.map((row: any) => ({
          id: row.id,
          name: row.name || row.merchant_name || "",
          phone: row.phone || "",
          township: row.township || "",
          address: row.address || "",
          source: (row.source || "FIELD_VISIT") as LeadSource,
          interested_service: row.interested_service || "",
          created_at: row.created_at || "",
        }));
        setCustomers(normalizedCustomers);
      }

      if (merchantsRes.data) setMerchants(merchantsRes.data as MerchantRecord[]);
      if (kpiRes.data) setKpiTargets(kpiRes.data as MerchantKpiTarget[]);
      if (plansRes.data) setPlans(plansRes.data as MarketingPlan[]);
      if (reportsRes.data) setReports(reportsRes.data as DailyReport[]);
      if (shipmentsRes.data) setShipments(shipmentsRes.data as ShipmentLite[]);
    } catch {
      setToast({
        tone: "err",
        message: t(
          "Unable to load marketing portal data from Supabase.",
          "Supabase မှ marketing portal data ကို မရယူနိုင်ပါ။",
        ),
      });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, supabase, t]);

  useEffect(() => {
    void loadPortal();
  }, [loadPortal]);

  useEffect(() => {
    searchRef.current?.focus();
  }, [view]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((item) => {
      if (!q) return true;
      return [
        item.name,
        item.phone,
        item.township,
        item.interested_service,
        item.source,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [customers, query]);

  const filteredMerchants = useMemo(() => {
    const q = query.trim().toLowerCase();
    return merchants.filter((item) => {
      if (!q) return true;
      return [
        item.name,
        item.phone,
        item.township,
        item.category,
        item.assigned_marketing_staff,
        item.tier,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [merchants, query]);

  const filteredPlans = useMemo(() => {
    const q = query.trim().toLowerCase();
    return plans.filter((item) => {
      if (!q) return true;
      return [
        item.title,
        item.marketing_way,
        item.destination,
        item.objective,
        item.owner_name ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [plans, query]);

  const filteredReports = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((item) => {
      if (!q) return true;
      return [item.staff_name, item.issues ?? "", item.actions ?? "", item.report_date]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [reports, query]);

  const compiledProgress = useMemo<MerchantCompiledProgress[]>(() => {
    const monthTargets = kpiTargets.filter((item) => item.month_label === selectedMonth);

    return merchants.map((merchant) => {
      const target = monthTargets.find((k) => k.merchant_id === merchant.id);
      const merchantShipments = shipments.filter((s) => s.merchant_id === merchant.id);

      const actualParcels = merchantShipments.length;
      const actualRevenueMmk = merchantShipments.reduce(
        (sum, row) => sum + Number(row.total_collectable_amount ?? 0),
        0,
      );

      const targetParcels = Number(target?.target_parcels ?? 0);
      const targetRevenueMmk = Number(target?.target_revenue_mmk ?? 0);

      const parcelHitRate =
        targetParcels > 0 ? Math.min(100, Math.round((actualParcels / targetParcels) * 100)) : 0;
      const revenueHitRate =
        targetRevenueMmk > 0
          ? Math.min(100, Math.round((actualRevenueMmk / targetRevenueMmk) * 100))
          : 0;

      return {
        merchantId: merchant.id,
        merchantName: merchant.name,
        township: merchant.township,
        category: merchant.category,
        tier: merchant.tier,
        assignedMarketingStaff: merchant.assigned_marketing_staff,
        targetParcels,
        actualParcels,
        targetRevenueMmk,
        actualRevenueMmk,
        parcelHitRate,
        revenueHitRate,
      };
    });
  }, [kpiTargets, merchants, selectedMonth, shipments]);

  const topMerchantChartData = useMemo(
    () =>
      [...compiledProgress]
        .sort((a, b) => b.targetParcels - a.targetParcels)
        .slice(0, 10)
        .map((item) => ({
          merchant: item.merchantName,
          targetParcels: item.targetParcels,
          actualParcels: item.actualParcels,
          targetRevenueMmk: item.targetRevenueMmk,
          actualRevenueMmk: item.actualRevenueMmk,
        })),
    [compiledProgress],
  );

  const teamPerformance = useMemo<TeamPerformanceRow[]>(() => {
    const monthReports = reports.filter((item) => item.report_date.startsWith(selectedMonth));
    const map = new Map<string, TeamPerformanceRow>();

    for (const row of monthReports) {
      const existing = map.get(row.staff_name) ?? {
        staffName: row.staff_name,
        visitedMerchants: 0,
        newLeads: 0,
        convertedMerchants: 0,
      };

      existing.visitedMerchants += Number(row.visited_merchants ?? 0);
      existing.newLeads += Number(row.new_leads ?? 0);
      existing.convertedMerchants += Number(row.converted_merchants ?? 0);

      map.set(row.staff_name, existing);
    }

    return [...map.values()].sort((a, b) => b.convertedMerchants - a.convertedMerchants);
  }, [reports, selectedMonth]);

  const monthlyTrendData = useMemo(() => {
    const monthMap = new Map<
      string,
      {
        month: string;
        targetParcels: number;
        actualParcels: number;
        targetRevenueMmk: number;
        actualRevenueMmk: number;
      }
    >();

    for (const target of kpiTargets) {
      const entry = monthMap.get(target.month_label) ?? {
        month: target.month_label,
        targetParcels: 0,
        actualParcels: 0,
        targetRevenueMmk: 0,
        actualRevenueMmk: 0,
      };
      entry.targetParcels += Number(target.target_parcels ?? 0);
      entry.targetRevenueMmk += Number(target.target_revenue_mmk ?? 0);
      monthMap.set(target.month_label, entry);
    }

    const shipmentByMonth = new Map<string, { count: number; revenue: number }>();
    for (const s of shipments) {
      const month = String(s.created_at).slice(0, 7);
      const current = shipmentByMonth.get(month) ?? { count: 0, revenue: 0 };
      current.count += 1;
      current.revenue += Number(s.total_collectable_amount ?? 0);
      shipmentByMonth.set(month, current);
    }

    for (const [month, actual] of shipmentByMonth.entries()) {
      const entry = monthMap.get(month) ?? {
        month,
        targetParcels: 0,
        actualParcels: 0,
        targetRevenueMmk: 0,
        actualRevenueMmk: 0,
      };
      entry.actualParcels = actual.count;
      entry.actualRevenueMmk = actual.revenue;
      monthMap.set(month, entry);
    }

    return [...monthMap.values()].sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [kpiTargets, shipments]);

  const overview = useMemo(() => {
    return {
      totalMerchants: merchants.length,
      totalCustomers: customers.length,
      totalTargetParcels: compiledProgress.reduce((sum, item) => sum + item.targetParcels, 0),
      totalActualParcels: compiledProgress.reduce((sum, item) => sum + item.actualParcels, 0),
      totalTargetRevenue: compiledProgress.reduce(
        (sum, item) => sum + item.targetRevenueMmk,
        0,
      ),
      totalActualRevenue: compiledProgress.reduce(
        (sum, item) => sum + item.actualRevenueMmk,
        0,
      ),
      reportCount: reports.filter((item) => item.report_date.startsWith(selectedMonth)).length,
    };
  }, [compiledProgress, customers.length, merchants.length, reports, selectedMonth]);

  const currentExportKind = useMemo(() => {
    if (view === "REGISTRY") {
      return registryForm.type === "CUSTOMER" ? "CUSTOMERS" : "MERCHANTS";
    }
    if (view === "PLAN") return "PLANS";
    if (view === "REPORT") return "REPORTS";
    return "KPIS";
  }, [registryForm.type, view]);

  const handleExport = useCallback(
    (kind: "MERCHANTS" | "CUSTOMERS" | "KPIS" | "PLANS" | "REPORTS") => {
      if (!exportAllowed) {
        setToast({
          tone: "err",
          message: t("You do not have export access.", "Export လုပ်ရန် ခွင့်ပြုချက်မရှိပါ။"),
        });
        return;
      }

      if (kind === "MERCHANTS") {
        downloadCsv("marketing-merchants.csv", [
          [
            "name",
            "phone",
            "township",
            "category",
            "tier",
            "assigned_marketing_staff",
            "joined_at",
          ],
          ...filteredMerchants.map((item) => [
            item.name,
            item.phone,
            item.township,
            item.category,
            item.tier,
            item.assigned_marketing_staff,
            item.joined_at,
          ]),
        ]);
      }

      if (kind === "CUSTOMERS") {
        downloadCsv("marketing-customers.csv", [
          ["name", "phone", "township", "source", "interested_service", "created_at"],
          ...filteredCustomers.map((item) => [
            item.name,
            item.phone,
            item.township,
            item.source,
            item.interested_service,
            item.created_at,
          ]),
        ]);
      }

      if (kind === "KPIS") {
        downloadCsv("marketing-kpi-monthly.csv", [
          [
            "merchant",
            "target_parcels",
            "actual_parcels",
            "target_revenue_mmk",
            "actual_revenue_mmk",
            "month",
            "assigned_staff",
          ],
          ...compiledProgress.map((item) => [
            item.merchantName,
            item.targetParcels,
            item.actualParcels,
            item.targetRevenueMmk,
            item.actualRevenueMmk,
            selectedMonth,
            item.assignedMarketingStaff,
          ]),
        ]);
      }

      if (kind === "PLANS") {
        downloadCsv("marketing-plans.csv", [
          [
            "title",
            "marketing_way",
            "destination",
            "objective",
            "planned_date",
            "estimated_leads",
            "owner_name",
            "note",
          ],
          ...filteredPlans.map((item) => [
            item.title,
            item.marketing_way,
            item.destination,
            item.objective,
            item.planned_date,
            item.estimated_leads,
            item.owner_name ?? "",
            item.note ?? "",
          ]),
        ]);
      }

      if (kind === "REPORTS") {
        downloadCsv("marketing-daily-reports.csv", [
          [
            "report_date",
            "staff_name",
            "visited_merchants",
            "new_leads",
            "converted_merchants",
            "issues",
            "actions",
            "status",
          ],
          ...filteredReports.map((item) => [
            item.report_date,
            item.staff_name,
            item.visited_merchants,
            item.new_leads,
            item.converted_merchants,
            item.issues ?? "",
            item.actions ?? "",
            item.status,
          ]),
        ]);
      }

      setToast({
        tone: "ok",
        message: t("Export generated.", "Export ဖိုင်ထုတ်ပြီးပါပြီ။"),
      });
    },
    [
      compiledProgress,
      exportAllowed,
      filteredCustomers,
      filteredMerchants,
      filteredPlans,
      filteredReports,
      selectedMonth,
      t,
    ],
  );

  const handleRegister = useCallback(async () => {
    if (
      !registryForm.name.trim() ||
      !registryForm.phone.trim() ||
      !registryForm.township.trim()
    ) {
      setToast({
        tone: "err",
        message: t(
          "Please complete required registry fields.",
          "လိုအပ်သော registry အကွက်များကို ဖြည့်ပါ။",
        ),
      });
      return;
    }

    try {
      if (registryForm.type === "CUSTOMER") {
        const { error } = await supabase.from("marketing_customers").insert([
          {
            name: registryForm.name.trim(),
            phone: registryForm.phone.trim(),
            township: registryForm.township.trim(),
            address: registryForm.address.trim(),
            source: registryForm.source,
            interested_service:
              registryForm.interestedService.trim() || "General Delivery",
          },
        ]);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("merchants").insert([
          {
            name: registryForm.name.trim(),
            phone: registryForm.phone.trim(),
            township: registryForm.township.trim(),
            address: registryForm.address.trim(),
            category: registryForm.category.trim() || "General",
            tier: registryForm.tier,
            assigned_marketing_staff:
              registryForm.assignedMarketingStaff.trim() || actorName,
            joined_at: new Date().toISOString(),
            status: "active",
          },
        ]);

        if (error) throw error;
      }

      setRegistryForm(emptyRegistryForm());
      setToast({
        tone: "ok",
        message: t("Registry entry saved.", "Registry entry ကို သိမ်းပြီးပါပြီ။"),
      });
      await loadPortal();
    } catch {
      setToast({
        tone: "err",
        message: t("Unable to save registry entry.", "Registry entry ကို မသိမ်းနိုင်ပါ။"),
      });
    }
  }, [actorName, loadPortal, registryForm, supabase, t]);

  const handleSaveKpi = useCallback(async () => {
    if (!targetAllowed) {
      setToast({
        tone: "err",
        message: t(
          "Only Super Admin and Admin can set merchant targets.",
          "Merchant target များကို Super Admin နှင့် Admin သာ သတ်မှတ်နိုင်သည်။",
        ),
      });
      return;
    }

    if (
      !kpiForm.merchantId ||
      !kpiForm.targetParcels ||
      !kpiForm.targetRevenueMmk ||
      !kpiForm.monthLabel
    ) {
      setToast({
        tone: "err",
        message: t(
          "Please select merchant and target fields.",
          "Merchant နှင့် target အချက်အလက်များကို ရွေးပါ။",
        ),
      });
      return;
    }

    try {
      const { error } = await supabase.from("marketing_kpi_targets").upsert(
        [
          {
            merchant_id: kpiForm.merchantId,
            month_label: kpiForm.monthLabel,
            target_parcels: Number(kpiForm.targetParcels),
            target_revenue_mmk: Number(kpiForm.targetRevenueMmk),
            set_by_name: actorName,
          },
        ],
        { onConflict: "merchant_id,month_label" },
      );

      if (error) throw error;

      setKpiForm(emptyKpiForm());
      setToast({
        tone: "ok",
        message: t("Merchant KPI target saved.", "Merchant KPI target ကို သိမ်းပြီးပါပြီ။"),
      });
      await loadPortal();
    } catch {
      setToast({
        tone: "err",
        message: t("Unable to save KPI.", "KPI ကို မသိမ်းနိုင်ပါ။"),
      });
    }
  }, [actorName, kpiForm, loadPortal, supabase, t, targetAllowed]);

  const handleSavePlan = useCallback(async () => {
    if (
      !planForm.title.trim() ||
      !planForm.marketingWay.trim() ||
      !planForm.destination.trim() ||
      !planForm.objective.trim()
    ) {
      setToast({
        tone: "err",
        message: t(
          "Please complete marketing plan fields.",
          "Marketing plan အကွက်များကို ဖြည့်ပါ။",
        ),
      });
      return;
    }

    try {
      const { error } = await supabase.from("marketing_plans").insert([
        {
          title: planForm.title.trim(),
          marketing_way: planForm.marketingWay.trim(),
          destination: planForm.destination.trim(),
          objective: planForm.objective.trim(),
          planned_date: planForm.plannedDate,
          estimated_leads: Number(planForm.estimatedLeads || 0),
          owner_name: actorName,
          note: planForm.note.trim(),
          status: "planned",
        },
      ]);

      if (error) throw error;

      setPlanForm(emptyPlanForm());
      setToast({
        tone: "ok",
        message: t("Marketing plan saved.", "Marketing plan ကို သိမ်းပြီးပါပြီ။"),
      });
      await loadPortal();
    } catch {
      setToast({
        tone: "err",
        message: t("Unable to save plan.", "Marketing plan ကို မသိမ်းနိုင်ပါ။"),
      });
    }
  }, [actorName, loadPortal, planForm, supabase, t]);

  const handleSubmitReport = useCallback(async () => {
    if (
      !reportForm.reportDate ||
      !reportForm.visitedMerchants ||
      !reportForm.newLeads ||
      !reportForm.convertedMerchants
    ) {
      setToast({
        tone: "err",
        message: t(
          "Please complete daily report numbers.",
          "နေ့စဉ် report ဂဏန်းအချက်အလက်များကို ဖြည့်ပါ။",
        ),
      });
      return;
    }

    try {
      const { error } = await supabase.from("marketing_daily_reports").insert([
        {
          report_date: reportForm.reportDate,
          staff_name: actorName,
          visited_merchants: Number(reportForm.visitedMerchants),
          new_leads: Number(reportForm.newLeads),
          converted_merchants: Number(reportForm.convertedMerchants),
          issues: reportForm.issues.trim() || null,
          actions: reportForm.actions.trim() || null,
          status: "SUBMITTED",
        },
      ]);

      if (error) throw error;

      setReportForm(emptyReportForm());
      setToast({
        tone: "ok",
        message: t("Daily report submitted.", "နေ့စဉ် report ကို တင်သွင်းပြီးပါပြီ။"),
      });
      await loadPortal();
    } catch {
      setToast({
        tone: "err",
        message: t("Unable to submit report.", "နေ့စဉ် report ကို မတင်နိုင်ပါ။"),
      });
    }
  }, [actorName, loadPortal, reportForm, supabase, t]);

  return (
    <div className="min-h-screen bg-[#f7f9fc] p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
            Growth & Acquisition
          </p>
          <h1 className="text-4xl font-black uppercase tracking-tight text-[#0d2c54]">
            Marketing Portal{" "}
            <span className="font-normal text-blue-500">
              / စျေးကွက်ဖွံ့ဖြိုးရေး ပေါ်တယ်
            </span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t(
              "Customer and merchant registration, monthly KPI tracking, marketing plans, daily reports, and comparison charts in one Supabase-powered workspace.",
              "Customer နှင့် merchant registration, monthly KPI စောင့်ကြည့်မှု, marketing plan, နေ့စဉ် report နှင့် comparison chart များကို Supabase workspace တစ်ခုတည်းတွင် စုစည်းထားသည်။",
            )}
          </p>
          {!accessAllowed ? (
            <p className="mt-2 text-sm font-semibold text-amber-700">
              {t(
                "Opened in guest mode. Sensitive actions remain restricted.",
                "Guest mode ဖြင့်ဖွင့်ထားပါသည်။ Sensitive action များကို ဆက်လက်ကန့်သတ်ထားသည်။",
              )}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <LanguageToggle value={language} onChange={setLanguage} />
          <button
            type="button"
            onClick={() => void loadPortal()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {t("Refresh", "ပြန်လည်ရယူ")}
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

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/cs/portal"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50"
          >
            {t("Previous: Customer Service", "ယခင်: Customer Service")}
          </Link>
          <Link
            href="/settings/portal"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50"
          >
            {t("Next: Settings", "နောက်တစ်ခု: Settings")}
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
            {t("Monthly KPI Window", "လစဉ် KPI Window")}
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
          />
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Store}
          title={t("Current Merchants", "လက်ရှိ Merchant များ")}
          value={String(overview.totalMerchants)}
        />
        <StatCard
          icon={Users}
          title={t("Registered Customers", "မှတ်ပုံတင်ထားသော Customer များ")}
          value={String(overview.totalCustomers)}
          accent="sky"
        />
        <StatCard
          icon={Target}
          title={t("Target Parcels", "Target Parcel")}
          value={overview.totalTargetParcels.toLocaleString()}
          accent="amber"
        />
        <StatCard
          icon={TrendingUp}
          title={t("Actual Parcels", "အမှန်တကယ် Parcel")}
          value={overview.totalActualParcels.toLocaleString()}
          accent="emerald"
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <ViewButton
          active={view === "OVERVIEW"}
          onClick={() => setView("OVERVIEW")}
          label={t("Overview", "အနှစ်ချုပ်")}
        />
        <ViewButton
          active={view === "REGISTRY"}
          onClick={() => setView("REGISTRY")}
          label={t("Customer & Merchant Registry", "Customer နှင့် Merchant Registry")}
        />
        <ViewButton
          active={view === "KPI"}
          onClick={() => setView("KPI")}
          label={t("Merchant KPI", "Merchant KPI")}
        />
        <ViewButton
          active={view === "PLAN"}
          onClick={() => setView("PLAN")}
          label={t("Marketing Plans", "Marketing Plan များ")}
        />
        <ViewButton
          active={view === "REPORT"}
          onClick={() => setView("REPORT")}
          label={t("Daily Reports", "နေ့စဉ် Report များ")}
        />
        <ViewButton
          active={view === "PROGRESS"}
          onClick={() => setView("PROGRESS")}
          label={t("Progress Board", "Progress Board")}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(
              "Search merchant, customer, township, plan, or report...",
              "merchant, customer, township, plan သို့မဟုတ် report ဖြင့်ရှာရန်...",
            )}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[#0d2c54]"
          />
        </div>

        {exportAllowed ? (
          <button
            type="button"
            onClick={() => handleExport(currentExportKind)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50"
          >
            <Download size={14} />
            {t("Export Current View", "လက်ရှိ View ကို Export ထုတ်မည်")}
          </button>
        ) : null}
      </div>

      {view === "OVERVIEW" ? (
        <div className="mt-8 grid gap-4 xl:grid-cols-[1fr_1fr]">
          <Panel title={t("Monthly KPI Snapshot", "လစဉ် KPI အနှစ်ချုပ်")}>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard
                title={t("Revenue Target", "ဝင်ငွေ Target")}
                value={formatMMK(overview.totalTargetRevenue)}
                icon={<BarChart3 size={16} className="text-[#0d2c54]" />}
              />
              <InfoCard
                title={t("Revenue Actual", "အမှန်တကယ် ဝင်ငွေ")}
                value={formatMMK(overview.totalActualRevenue)}
                icon={<TrendingUp size={16} className="text-[#0d2c54]" />}
              />
              <InfoCard
                title={t("Submitted Reports", "တင်သွင်းထားသော Report များ")}
                value={String(overview.reportCount)}
                icon={<FileText size={16} className="text-[#0d2c54]" />}
              />
              <InfoCard
                title={t("Active Plans", "အသုံးပြုနေသော Plan များ")}
                value={String(plans.length)}
                icon={<Megaphone size={16} className="text-[#0d2c54]" />}
              />
            </div>
          </Panel>

          <Panel title={t("Monthly Target vs Actual Trend", "လစဉ် Target နှင့် Actual Trend")}>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="targetParcels"
                    name={t("Target Parcels", "Target Parcel")}
                    stroke="#0d2c54"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="actualParcels"
                    name={t("Actual Parcels", "Actual Parcel")}
                    stroke="#16a34a"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={t("Merchant Parcel Comparison", "Merchant Parcel နှိုင်းယှဉ်မှု")}>
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topMerchantChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="merchant"
                    tick={{ fontSize: 11 }}
                    angle={-12}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="targetParcels"
                    name={t("Target", "Target")}
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="actualParcels"
                    name={t("Actual", "အမှန်တကယ်")}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={t("Marketing Staff Performance", "Marketing Staff လုပ်ဆောင်မှု")}>
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="staffName" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="visitedMerchants"
                    name={t("Visited", "တွေ့ဆုံမှု")}
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="newLeads"
                    name={t("New Leads", "Lead အသစ်")}
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="convertedMerchants"
                    name={t("Converted", "ပြောင်းလဲနိုင်မှု")}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      ) : null}

      {view === "REGISTRY" ? (
        <div className="mt-8 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel
            title={t("Register Customer / Merchant", "Customer / Merchant မှတ်ပုံတင်ရန်")}
            subtitle={t(
              "Marketing staff can register customers and merchants and keep lead information ready.",
              "Marketing staff များသည် customer နှင့် merchant များကို မှတ်ပုံတင်ပြီး lead အချက်အလက်များကို စနစ်တကျထားနိုင်သည်။",
            )}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {t("Record Type", "Record အမျိုးအစား")}
                </label>
                <select
                  value={registryForm.type}
                  onChange={(e) =>
                    setRegistryForm((prev) => ({
                      ...prev,
                      type: e.target.value as RegistryForm["type"],
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
                >
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="MERCHANT">MERCHANT</option>
                </select>
              </div>

              <Field
                label={t("Name *", "အမည် *")}
                value={registryForm.name}
                onChange={(value) => setRegistryForm((prev) => ({ ...prev, name: value }))}
              />
              <Field
                label={t("Phone *", "ဖုန်း *")}
                value={registryForm.phone}
                onChange={(value) => setRegistryForm((prev) => ({ ...prev, phone: value }))}
              />
              <Field
                label={t("Township *", "မြို့နယ် *")}
                value={registryForm.township}
                onChange={(value) =>
                  setRegistryForm((prev) => ({ ...prev, township: value }))
                }
              />
              <Field
                label={t("Address", "လိပ်စာ")}
                value={registryForm.address}
                onChange={(value) => setRegistryForm((prev) => ({ ...prev, address: value }))}
              />

              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {t("Lead Source", "Lead Source")}
                </label>
                <select
                  value={registryForm.source}
                  onChange={(e) =>
                    setRegistryForm((prev) => ({
                      ...prev,
                      source: e.target.value as LeadSource,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
                >
                  <option value="FIELD_VISIT">FIELD_VISIT</option>
                  <option value="FACEBOOK">FACEBOOK</option>
                  <option value="REFERRAL">REFERRAL</option>
                  <option value="CALL_CENTER">CALL_CENTER</option>
                  <option value="WALK_IN">WALK_IN</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              {registryForm.type === "CUSTOMER" ? (
                <Field
                  label={t("Interested Service", "စိတ်ဝင်စားသော Service")}
                  value={registryForm.interestedService}
                  onChange={(value) =>
                    setRegistryForm((prev) => ({ ...prev, interestedService: value }))
                  }
                />
              ) : (
                <>
                  <Field
                    label={t("Merchant Category", "Merchant Category")}
                    value={registryForm.category}
                    onChange={(value) =>
                      setRegistryForm((prev) => ({ ...prev, category: value }))
                    }
                  />
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                      {t("Merchant Tier", "Merchant Tier")}
                    </label>
                    <select
                      value={registryForm.tier}
                      onChange={(e) =>
                        setRegistryForm((prev) => ({
                          ...prev,
                          tier: e.target.value as MerchantTier,
                        }))
                      }
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
                    >
                      <option value="NEW">NEW</option>
                      <option value="STANDARD">STANDARD</option>
                      <option value="PRIORITY">PRIORITY</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                    </select>
                  </div>
                  <Field
                    label={t("Assigned Staff", "တာဝန်ပေးထားသော Staff")}
                    value={registryForm.assignedMarketingStaff}
                    onChange={(value) =>
                      setRegistryForm((prev) => ({
                        ...prev,
                        assignedMarketingStaff: value,
                      }))
                    }
                  />
                </>
              )}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleRegister}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#ffd700] px-6 py-3 text-sm font-black uppercase tracking-wider text-[#0d2c54]"
              >
                <UserPlus size={16} />
                {t("Save Registry", "Registry ကို သိမ်းမည်")}
              </button>
            </div>
          </Panel>

          <Panel
            title={t("Current Registry Information", "လက်ရှိ Registry အချက်အလက်များ")}
            subtitle={t(
              "Marketing team can quickly check customer and merchant information related to their tasks.",
              "Marketing team များသည် ၎င်းတို့၏လုပ်ငန်းနှင့်ဆက်စပ်သော customer နှင့် merchant အချက်အလက်များကို မြန်ဆန်စွာ စစ်ဆေးနိုင်သည်။",
            )}
          >
            <div className="space-y-6">
              <div>
                <div className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                  {t("Merchants", "Merchant များ")}
                </div>
                <div className="space-y-3">
                  {filteredMerchants.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-black text-[#0d2c54]">{item.name}</div>
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${tierClass(item.tier)}`}
                        >
                          {item.tier}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-slate-500">
                        {item.phone} • {item.township}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {item.category} • {item.assigned_marketing_staff}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                  {t("Customers", "Customer များ")}
                </div>
                <div className="space-y-3">
                  {filteredCustomers.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="font-black text-[#0d2c54]">{item.name}</div>
                      <div className="mt-2 text-sm text-slate-500">
                        {item.phone} • {item.township}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {item.interested_service} • {item.source}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      ) : null}

      {view === "KPI" ? (
        <div className="mt-8 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          <Panel
            title={t("Merchant KPI Target Form", "Merchant KPI Target ဖောင်")}
            subtitle={t(
              "Super Admin and Admin can set monthly merchant targets for marketing team progress tracking.",
              "Marketing team progress စောင့်ကြည့်ရန်အတွက် Super Admin နှင့် Admin တို့သည် merchant monthly target များ သတ်မှတ်နိုင်သည်။",
            )}
          >
            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {t("Merchant", "Merchant")}
                </label>
                <select
                  value={kpiForm.merchantId}
                  onChange={(e) =>
                    setKpiForm((prev) => ({ ...prev, merchantId: e.target.value }))
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
                >
                  <option value="">{t("Choose merchant", "Merchant ရွေးပါ")}</option>
                  {merchants.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <Field
                label={t("Target Parcels", "Target Parcel အရေအတွက်")}
                value={kpiForm.targetParcels}
                onChange={(value) =>
                  setKpiForm((prev) => ({ ...prev, targetParcels: value }))
                }
                type="number"
              />
              <Field
                label={t("Target Revenue (MMK)", "Target Revenue (MMK)")}
                value={kpiForm.targetRevenueMmk}
                onChange={(value) =>
                  setKpiForm((prev) => ({ ...prev, targetRevenueMmk: value }))
                }
                type="number"
              />
              <Field
                label={t("Month", "လ")}
                value={kpiForm.monthLabel}
                onChange={(value) => setKpiForm((prev) => ({ ...prev, monthLabel: value }))}
                type="month"
              />

              <button
                type="button"
                onClick={handleSaveKpi}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0d2c54] px-6 py-3 text-sm font-black uppercase tracking-wider text-white"
              >
                <Target size={16} />
                {t("Save Target", "Target ကို သိမ်းမည်")}
              </button>

              {!targetAllowed ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  {t(
                    "Target editing is limited to Super Admin and Admin.",
                    "Target ပြင်ဆင်ခွင့်ကို Super Admin နှင့် Admin တို့အတွက်သာ ကန့်သတ်ထားသည်။",
                  )}
                </div>
              ) : null}
            </div>
          </Panel>

          <Panel
            title={t("Monthly KPI Compilation", "လစဉ် KPI Compilation")}
            subtitle={t(
              "Targets are compared against actual shipment activity for the selected month.",
              "ရွေးချယ်ထားသောလအတွက် target များကို အမှန်တကယ် shipment activity နှင့် နှိုင်းယှဉ်ထားသည်။",
            )}
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-black">{t("Merchant", "Merchant")}</th>
                    <th className="px-4 py-3 font-black">
                      {t("Target Parcel", "Target Parcel")}
                    </th>
                    <th className="px-4 py-3 font-black">
                      {t("Actual Parcel", "Actual Parcel")}
                    </th>
                    <th className="px-4 py-3 font-black">{t("Hit Rate", "Hit Rate")}</th>
                    <th className="px-4 py-3 font-black">
                      {t("Target Revenue", "Target Revenue")}
                    </th>
                    <th className="px-4 py-3 font-black">
                      {t("Actual Revenue", "Actual Revenue")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {compiledProgress.map((item) => (
                    <tr key={item.merchantId} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-semibold text-[#0d2c54]">
                        {item.merchantName}
                      </td>
                      <td className="px-4 py-3">{item.targetParcels}</td>
                      <td className="px-4 py-3">{item.actualParcels}</td>
                      <td className="px-4 py-3">{item.parcelHitRate}%</td>
                      <td className="px-4 py-3">{formatMMK(item.targetRevenueMmk)}</td>
                      <td className="px-4 py-3">{formatMMK(item.actualRevenueMmk)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      ) : null}

      {view === "PLAN" ? (
        <div className="mt-8 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel
            title={t("Marketing Plan Form", "Marketing Plan ဖောင်")}
            subtitle={t(
              "Marketing team can plan marketing way, destination area, and objective for field execution.",
              "Marketing team သည် marketing way, destination area နှင့် objective တို့ကို field execution အတွက် စီစဉ်နိုင်သည်။",
            )}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label={t("Plan Title", "Plan ခေါင်းစဉ်")}
                value={planForm.title}
                onChange={(value) => setPlanForm((prev) => ({ ...prev, title: value }))}
              />
              <Field
                label={t("Planned Date", "စီစဉ်သည့်ရက်")}
                value={planForm.plannedDate}
                onChange={(value) =>
                  setPlanForm((prev) => ({ ...prev, plannedDate: value }))
                }
                type="date"
              />
              <Field
                label={t("Marketing Way", "Marketing လုပ်နည်း")}
                value={planForm.marketingWay}
                onChange={(value) =>
                  setPlanForm((prev) => ({ ...prev, marketingWay: value }))
                }
              />
              <Field
                label={t("Destination", "သွားရမည့်နေရာ")}
                value={planForm.destination}
                onChange={(value) =>
                  setPlanForm((prev) => ({ ...prev, destination: value }))
                }
              />
              <Field
                label={t("Estimated Leads", "ခန့်မှန်း Lead အရေအတွက်")}
                value={planForm.estimatedLeads}
                onChange={(value) =>
                  setPlanForm((prev) => ({ ...prev, estimatedLeads: value }))
                }
                type="number"
              />
              <Field
                label={t("Objective", "ရည်ရွယ်ချက်")}
                value={planForm.objective}
                onChange={(value) =>
                  setPlanForm((prev) => ({ ...prev, objective: value }))
                }
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                {t("Notes", "မှတ်ချက်")}
              </label>
              <textarea
                value={planForm.note}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, note: e.target.value }))}
                className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
              />
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleSavePlan}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#ffd700] px-6 py-3 text-sm font-black uppercase tracking-wider text-[#0d2c54]"
              >
                <MapPinned size={16} />
                {t("Save Plan", "Plan ကို သိမ်းမည်")}
              </button>
            </div>
          </Panel>

          <Panel
            title={t("Planned Marketing Ways", "စီစဉ်ထားသော Marketing Ways")}
            subtitle={t(
              "The team can review where to go, how to approach, and what the objective is for each plan.",
              "Plan တစ်ခုစီအတွက် ဘယ်နေရာသို့သွားမည်၊ ဘယ်လိုချဉ်းကပ်မည်၊ ဘာရည်ရွယ်ချက်ရှိသည်ကို အဖွဲ့က စစ်ဆေးနိုင်သည်။",
            )}
          >
            <div className="space-y-3">
              {filteredPlans.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="font-black text-[#0d2c54]">{item.title}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {item.marketing_way} • {item.destination}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-slate-700">
                        {item.objective}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {item.owner_name ?? "-"} • {formatDate(item.planned_date)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {t("Est. Leads", "ခန့်မှန်း Lead")}
                      </div>
                      <div className="mt-1 text-xl font-black text-[#0d2c54]">
                        {item.estimated_leads}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      ) : null}

      {view === "REPORT" ? (
        <div className="mt-8 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel
            title={t("Daily Marketing Report Form", "နေ့စဉ် Marketing Report ဖောင်")}
            subtitle={t(
              "Marketing staff can submit field reports every day for management review and arrangement.",
              "Marketing staff များသည် management review နှင့် arrangement အတွက် နေ့စဉ် field report တင်သွင်းနိုင်သည်။",
            )}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label={t("Report Date", "Report ရက်စွဲ")}
                value={reportForm.reportDate}
                onChange={(value) =>
                  setReportForm((prev) => ({ ...prev, reportDate: value }))
                }
                type="date"
              />
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {t("Reporting Staff", "Report တင်သည့် Staff")}
                </div>
                <div className="mt-2 font-black text-[#0d2c54]">{actorName}</div>
              </div>
              <Field
                label={t("Visited Merchants", "တွေ့ဆုံခဲ့သော Merchant များ")}
                value={reportForm.visitedMerchants}
                onChange={(value) =>
                  setReportForm((prev) => ({ ...prev, visitedMerchants: value }))
                }
                type="number"
              />
              <Field
                label={t("New Leads", "Lead အသစ်များ")}
                value={reportForm.newLeads}
                onChange={(value) =>
                  setReportForm((prev) => ({ ...prev, newLeads: value }))
                }
                type="number"
              />
              <Field
                label={t("Converted Merchants", "ပြောင်းလဲနိုင်ခဲ့သော Merchant များ")}
                value={reportForm.convertedMerchants}
                onChange={(value) =>
                  setReportForm((prev) => ({ ...prev, convertedMerchants: value }))
                }
                type="number"
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                {t("Issues / Blockers", "ပြဿနာများ / အတားအဆီးများ")}
              </label>
              <textarea
                value={reportForm.issues}
                onChange={(e) => setReportForm((prev) => ({ ...prev, issues: e.target.value }))}
                className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                {t("Actions Taken / Next Action", "ဆောင်ရွက်ပြီးသောအရာ / နောက်တစ်ဆင့်")}
              </label>
              <textarea
                value={reportForm.actions}
                onChange={(e) => setReportForm((prev) => ({ ...prev, actions: e.target.value }))}
                className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
              />
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleSubmitReport}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0d2c54] px-6 py-3 text-sm font-black uppercase tracking-wider text-white"
              >
                <Send size={16} />
                {t("Submit Report", "Report တင်သွင်းမည်")}
              </button>
            </div>
          </Panel>

          <Panel
            title={t("Submitted Daily Reports", "တင်သွင်းထားသော နေ့စဉ် Report များ")}
            subtitle={t(
              "Super Admin, Admin, and Supervisor can check and export reports from different users for proper arrangement.",
              "Super Admin, Admin နှင့် Supervisor တို့သည် user အမျိုးမျိုးမှ report များကို စစ်ဆေးပြီး export ထုတ်ကာ စီမံခန့်ခွဲနိုင်သည်။",
            )}
          >
            <div className="space-y-3">
              {filteredReports.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="font-black text-[#0d2c54]">{item.staff_name}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {formatDate(item.report_date)}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-slate-700">
                        {t("Visited", "တွေ့ဆုံခဲ့သော merchant များ")}{" "}
                        {item.visited_merchants} • {t("New Leads", "Lead အသစ်များ")}{" "}
                        {item.new_leads} • {t("Converted", "ပြောင်းလဲနိုင်ခဲ့သည်")}{" "}
                        {item.converted_merchants}
                      </div>
                      <div className="mt-2 text-sm text-slate-500">
                        {item.issues || t("No issues entered.", "ပြဿနာမထည့်ထားပါ။")}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${reportStatusClass(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      ) : null}

      {view === "PROGRESS" ? (
        <div className="mt-8 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel
            title={t("Merchant Parcel Progress Chart", "Merchant Parcel Progress Chart")}
            subtitle={t(
              "Current merchants and their parcel performance are compared against assigned monthly targets.",
              "လက်ရှိ merchant များ၏ parcel လုပ်ဆောင်မှုကို လစဉ် target များနှင့် နှိုင်းယှဉ်ထားသည်။",
            )}
          >
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topMerchantChartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="merchant"
                    angle={-15}
                    textAnchor="end"
                    height={70}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="targetParcels"
                    name={t("Target Parcels", "Target Parcel")}
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="actualParcels"
                    name={t("Actual Parcels", "Actual Parcel")}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel
            title={t("Merchant Progress Table", "Merchant Progress ဇယား")}
            subtitle={t(
              "This board helps marketing staff understand which merchants are behind target and require immediate action.",
              "ဤ board သည် ဘယ် merchant များက target နောက်ကျနေသည်၊ ဘယ်သူများအပေါ် ချက်ချင်းဆောင်ရွက်ရမည်ကို marketing staff များ နားလည်ရန် ကူညီပေးသည်။",
            )}
          >
            <div className="space-y-3">
              {compiledProgress.map((item) => (
                <div key={item.merchantId} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-black text-[#0d2c54]">{item.merchantName}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {item.assignedMarketingStaff} • {item.category}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${tierClass(item.tier)}`}
                    >
                      {item.tier}
                    </span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#0d2c54]"
                      style={{ width: `${item.parcelHitRate}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">
                      {item.actualParcels} / {item.targetParcels}
                    </span>
                    <span className="font-black text-[#0d2c54]">
                      {item.parcelHitRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      ) : null}

      {loading ? (
        <div className="pointer-events-none fixed bottom-6 right-6 rounded-full bg-[#0d2c54] px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-lg">
          {t("Syncing Supabase...", "Supabase နှင့် ချိတ်ဆက်နေသည်...")}
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
              active
                ? "bg-[#0d2c54] text-white shadow"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider transition ${
        active
          ? "bg-[#0d2c54] text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-black text-[#0d2c54]">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  accent = "default",
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  title: string;
  value: string;
  accent?: "default" | "sky" | "amber" | "emerald";
}) {
  const iconClass =
    accent === "sky"
      ? "text-sky-500"
      : accent === "amber"
        ? "text-amber-500"
        : accent === "emerald"
          ? "text-emerald-500"
          : "text-[#0d2c54]";
  const valueClass =
    accent === "sky"
      ? "text-sky-600"
      : accent === "amber"
        ? "text-amber-600"
        : accent === "emerald"
          ? "text-emerald-600"
          : "text-slate-800";

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <Icon size={24} className={iconClass} />
      <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
        {title}
      </p>
      <p className={`mt-4 text-3xl font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

function InfoCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          {title}
        </span>
      </div>
      <div className="mt-2 font-black text-[#0d2c54]">{value}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
      />
    </div>
  );
}