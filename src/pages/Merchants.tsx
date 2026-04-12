import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import {
  type LucideIcon,
  Activity,
  AlertTriangle,
  Bell,
  BookOpen,
  Boxes,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  CreditCard,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Globe2,
  Headphones,
  History,
  Home,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Package2,
  Phone,
  PieChart,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  Upload,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

type UiLanguage = "en" | "my" | "both";
type TabKey =
  | "dashboard"
  | "profile"
  | "booking"
  | "bulk"
  | "shipments"
  | "tracking"
  | "pickups"
  | "cod"
  | "billing"
  | "exceptions"
  | "reports"
  | "receivers"
  | "support"
  | "notifications";

type Tone = "blue" | "amber" | "green" | "rose" | "violet" | "slate";

type AuthUser = {
  id?: string;
  email?: string;
  role?: string;
  roleCode?: string;
  roles?: string[];
  permissions?: string[];
  displayName?: string;
  fullName?: string;
};

type MerchantProfile = {
  merchantId: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  registeredAddress: string;
  pickupAddress: string;
  township: string;
  city: string;
  region: string;
  businessType: string;
  preferredPaymentMethod: string;
  bankAccount: string;
  settlementPreference: string;
  memberSince: string;
  accountStatus: string;
  languagePreference: string;
  verified: boolean;
};

type MerchantStats = {
  todaysShipments: number;
  activeShipments: number;
  deliveredShipments: number;
  failedDeliveryAttempts: number;
  pendingPickups: number;
  codCollected: number;
  codPendingTransfer: number;
  codTransferred: number;
  returnShipments: number;
  openSupportTickets: number;
};

type ShipmentStatus =
  | "BOOKED"
  | "PICKUP_SCHEDULED"
  | "PICKED_UP"
  | "AT_HUB"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED_DELIVERY"
  | "RETURNED";

type ShipmentTimelineRow = {
  labelEn: string;
  labelMy?: string | null;
  time: string;
  done: boolean;
};

type ShipmentRow = {
  id: string;
  trackingNo: string;
  bookingDate: string;
  receiver: string;
  phone: string;
  destination: string;
  serviceType: string;
  codAmount: number;
  deliveryFee: number;
  pickupStatus: string;
  paymentStatus: string;
  returnStatus: string;
  status: ShipmentStatus;
  eta: string;
  location: string;
  rider?: string | null;
  proof?: string | null;
  failedReason?: string | null;
  returnReason?: string | null;
  timeline: ShipmentTimelineRow[];
};

type PickupRow = {
  id: string;
  pickupDate: string;
  timeWindow: string;
  parcelCount: number;
  address: string;
  contact: string;
  status: string;
  riderStatus: string;
};

type CodStatementRow = {
  id: string;
  shipmentId: string;
  deliveredDate: string;
  receiver: string;
  codAmount: number;
  serviceFee: number;
  deduction: number;
  netPayable: number;
  transferStatus: "PENDING" | "TRANSFERRED" | "ON_HOLD";
  settlementBatch: string;
  transferDate: string;
};

type InvoiceRow = {
  id: string;
  invoiceNo: string;
  billingPeriod: string;
  totalCharges: number;
  codFees: number;
  deductions: number;
  paymentStatus: string;
  dueDate: string;
};

type ExceptionRow = {
  id: string;
  trackingNo: string;
  receiver: string;
  issue: string;
  reason: string;
  status: string;
  updatedAt: string;
};

type ReceiverRow = {
  id: string;
  name: string;
  phone: string;
  address: string;
  township: string;
  city: string;
  note?: string | null;
  frequent?: boolean;
  recent?: boolean;
};

type TicketRow = {
  id: string;
  subject: string;
  issueType: string;
  relatedShipmentId?: string | null;
  priority: string;
  status: string;
  lastUpdated: string;
};

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  tone: Tone;
};

type ReportRow = {
  id: string;
  reportDate: string;
  metric: string;
  value: string;
  label?: string | null;
};

type MerchantBootstrapPayload = {
  profile: MerchantProfile;
  stats: MerchantStats;
  notifications: NotificationRow[];
  recentShipments: ShipmentRow[];
  recentTickets: TicketRow[];
};

type BookingForm = {
  merchantName: string;
  senderContact: string;
  pickupAddress: string;
  pickupTownship: string;
  pickupCity: string;
  pickupInstructions: string;
  receiverName: string;
  receiverPhone: string;
  receiverEmail: string;
  deliveryAddress: string;
  deliveryTownship: string;
  deliveryCity: string;
  deliveryRegion: string;
  landmark: string;
  parcelType: string;
  itemDescription: string;
  quantity: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  fragile: boolean;
  urgent: boolean;
  declaredValue: string;
  codAmount: string;
  deliveryNote: string;
  serviceType: string;
  pickupDate: string;
  deliverySlot: string;
  insurance: boolean;
  paymentResponsibility: string;
  specialHandling: string;
};

type PickupForm = {
  pickupDate: string;
  timeWindow: string;
  parcelCount: string;
  notes: string;
  contactPerson: string;
  pickupAddress: string;
};

type SupportForm = {
  subject: string;
  issueType: string;
  relatedShipmentId: string;
  priority: string;
  description: string;
};

const MERCHANT_ACCESS_ROLE_TOKENS = new Set<string>([
  "SYS",
  "SUPER_ADMIN",
  "ADMIN",
  "MERCHANT",
  "MERCHANT_ADMIN",
  "MERCHANT_OWNER",
  "MERCHANT_MANAGER",
  "MERCHANT_STAFF",
  "CUSTOMER_SERVICE",
  "CS",
]);

const MERCHANT_ACCESS_PERMISSION_TOKENS = new Set<string>([
  "MERCHANT_PORTAL_ACCESS",
  "MERCHANT_ALL",
  "ALL",
  "SUPER_ADMIN",
]);

const tabs: Array<{
  id: TabKey;
  labelEn: string;
  labelMy: string;
  icon: LucideIcon;
}> = [
  { id: "dashboard", labelEn: "Dashboard", labelMy: "ပင်မအနှစ်ချုပ်", icon: Home },
  { id: "profile", labelEn: "Business Profile", labelMy: "လုပ်ငန်းပရိုဖိုင်", icon: Store },
  { id: "booking", labelEn: "Create Shipment", labelMy: "Shipment ဖန်တီးမည်", icon: Package2 },
  { id: "bulk", labelEn: "Bulk Upload", labelMy: "အစုလိုက် upload", icon: Upload },
  { id: "shipments", labelEn: "Shipment Management", labelMy: "Shipment စီမံခန့်ခွဲမှု", icon: Boxes },
  { id: "tracking", labelEn: "Cargo Tracking", labelMy: "ကုန်ပစ္စည်းခြေရာခံမှု", icon: Truck },
  { id: "pickups", labelEn: "Pickup Requests", labelMy: "Pickup တောင်းဆိုချက်များ", icon: CalendarClock },
  { id: "cod", labelEn: "COD & Settlement", labelMy: "COD နှင့် စာရင်းရှင်းလင်းမှု", icon: Wallet },
  { id: "billing", labelEn: "Billing & Statements", labelMy: "ငွေတောင်းခံမှုနှင့် statement များ", icon: FileText },
  { id: "exceptions", labelEn: "Returns & Exceptions", labelMy: "Returns နှင့် Exception များ", icon: AlertTriangle },
  { id: "reports", labelEn: "Reports & Analytics", labelMy: "အစီရင်ခံစာနှင့် Analytics", icon: PieChart },
  { id: "receivers", labelEn: "Receiver Directory", labelMy: "လက်ခံသူစာရင်း", icon: Users },
  { id: "support", labelEn: "Support Center", labelMy: "အကူအညီစင်တာ", icon: Headphones },
  { id: "notifications", labelEn: "Notifications", labelMy: "အသိပေးချက်များ", icon: Bell },
];

function tt(language: UiLanguage, en: string, my: string) {
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
    fullName: patch.fullName ?? base.fullName,
  };
}

function getRoleTokens(user: AuthUser) {
  return new Set([user.role, user.roleCode, ...(user.roles ?? [])].map(normalizeToken).filter(Boolean));
}

function getPermissionTokens(user: AuthUser) {
  return new Set((user.permissions ?? []).map(normalizeToken).filter(Boolean));
}

function canAccessMerchantPortal(user: AuthUser) {
  const roles = getRoleTokens(user);
  const perms = getPermissionTokens(user);

  for (const token of MERCHANT_ACCESS_ROLE_TOKENS) {
    if (roles.has(normalizeToken(token))) return true;
  }

  for (const token of MERCHANT_ACCESS_PERMISSION_TOKENS) {
    if (perms.has(normalizeToken(token))) return true;
  }

  return Boolean(user?.id || user?.email);
}

async function fetchAuthUserFromProfiles(
  sb: typeof supabase,
  userId: string,
): Promise<Partial<AuthUser> | null> {
  const tables = ["profiles", "user_profiles", "merchant_profiles", "staff_profiles"];
  const idFields = ["id", "user_id", "auth_user_id"];
  const selectColumns = "id,email,role,role_code,roles,permissions,display_name,full_name";

  for (const table of tables) {
    for (const idField of idFields) {
      try {
        const { data, error } = await sb
          .from(table)
          .select(selectColumns)
          .eq(idField, userId)
          .maybeSingle();

        if (!error && data) {
          const extracted = extractAuthCandidate(data);
          if (extracted) return extracted;
        }
      } catch {
        // ignore lookup failures
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
      const fromProfiles = await fetchAuthUserFromProfiles(supabase, user.id);
      resolved = mergeAuthUser(resolved, fromProfiles);
    }

    return resolved;
  } catch {
    return resolved;
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
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

function formatMMK(value?: number | null) {
  return `${Number(value ?? 0).toLocaleString()} MMK`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function statusTone(status?: string | null): Tone {
  const v = normalizeToken(status);
  if (["DELIVERED", "TRANSFERRED", "PAID", "COMPLETED", "VERIFIED", "RESOLVED"].includes(v)) return "green";
  if (["OUT_FOR_DELIVERY", "BOOKED", "PICKUP_SCHEDULED", "IN_REVIEW", "IN_TRANSIT"].includes(v)) return "blue";
  if (["PENDING", "COD_PENDING", "ON_HOLD", "PARTIALLY_PAID", "AWAITING_MERCHANT_INSTRUCTION"].includes(v)) {
    return "amber";
  }
  if (["FAILED_DELIVERY", "RETURNED", "OPEN", "REJECTED"].includes(v)) return "rose";
  return "slate";
}

function buildQuery(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && value.trim()) query.set(key, value.trim());
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

function emptyBookingForm(profile?: MerchantProfile | null): BookingForm {
  return {
    merchantName: profile?.businessName || "",
    senderContact: profile?.ownerName || "",
    pickupAddress: profile?.pickupAddress || "",
    pickupTownship: profile?.township || "",
    pickupCity: profile?.city || "",
    pickupInstructions: "",
    receiverName: "",
    receiverPhone: "",
    receiverEmail: "",
    deliveryAddress: "",
    deliveryTownship: "",
    deliveryCity: "",
    deliveryRegion: "",
    landmark: "",
    parcelType: "Parcel",
    itemDescription: "",
    quantity: "1",
    weight: "",
    length: "",
    width: "",
    height: "",
    fragile: false,
    urgent: false,
    declaredValue: "0",
    codAmount: "",
    deliveryNote: "",
    serviceType: "standard",
    pickupDate: "",
    deliverySlot: "",
    insurance: false,
    paymentResponsibility: "merchant",
    specialHandling: "",
  };
}

function emptyPickupForm(profile?: MerchantProfile | null): PickupForm {
  return {
    pickupDate: "",
    timeWindow: "10:00 AM - 12:00 PM",
    parcelCount: "1",
    notes: "",
    contactPerson: profile?.ownerName || "",
    pickupAddress: profile?.pickupAddress || "",
  };
}

function emptySupportForm(): SupportForm {
  return {
    subject: "",
    issueType: "shipment",
    relatedShipmentId: "",
    priority: "normal",
    description: "",
  };
}

export default function MerchantPortalPage() {
  const [authUser, setAuthUser] = useState<AuthUser>({});
  const [authReady, setAuthReady] = useState(false);

  const [language, setLanguage] = useState<UiLanguage>("both");
  const [tab, setTab] = useState<TabKey>("dashboard");

  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [stats, setStats] = useState<MerchantStats | null>(null);

  const [recentShipments, setRecentShipments] = useState<ShipmentRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [recentTickets, setRecentTickets] = useState<TicketRow[]>([]);

  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [pickups, setPickups] = useState<PickupRow[]>([]);
  const [codStatements, setCodStatements] = useState<CodStatementRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [receivers, setReceivers] = useState<ReceiverRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);

  const [trackingNo, setTrackingNo] = useState("");
  const [shipmentSearch, setShipmentSearch] = useState("");
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [reportType, setReportType] = useState("shipment_volume");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [bookingForm, setBookingForm] = useState<BookingForm>(emptyBookingForm());
  const [pickupForm, setPickupForm] = useState<PickupForm>(emptyPickupForm());
  const [supportForm, setSupportForm] = useState<SupportForm>(emptySupportForm());

  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ tone: "ok" | "warn" | "err"; message: string } | null>(null);

  const trackingInputRef = useRef<HTMLInputElement | null>(null);

  const accessAllowed = authReady && canAccessMerchantPortal(authUser);

  const selectedShipment = useMemo(
    () => shipments.find((item) => item.id === selectedShipmentId) ?? null,
    [selectedShipmentId, shipments],
  );

  const searchedTrackingShipment = useMemo(
    () =>
      shipments.find((item) => item.trackingNo.trim().toLowerCase() === trackingNo.trim().toLowerCase()) ?? null,
    [shipments, trackingNo],
  );

  const filteredShipments = useMemo(() => {
    const q = shipmentSearch.trim().toLowerCase();
    return shipments.filter((item) => {
      if (!q) return true;
      return [
        item.trackingNo,
        item.receiver,
        item.destination,
        item.phone,
        item.serviceType,
        item.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [shipmentSearch, shipments]);

  const bookingEstimate = useMemo(() => {
    const baseRate =
      bookingForm.serviceType === "same_day"
        ? 4200
        : bookingForm.serviceType === "next_day"
          ? 3600
          : 3000;
    const weightCharge = Math.max(0, (parseFloat(bookingForm.weight) || 0) - 1) * 600;
    const codFee = bookingForm.codAmount ? 700 : 0;
    const insuranceFee = bookingForm.insurance ? 800 : 0;
    const urgentFee = bookingForm.urgent ? 900 : 0;
    const total = baseRate + weightCharge + codFee + insuranceFee + urgentFee;
    return { baseRate, weightCharge, codFee, insuranceFee, urgentFee, total };
  }, [bookingForm]);

  const refreshBootstrap = useCallback(async () => {
    if (!accessAllowed) return;

    setLoadingMap((prev) => ({ ...prev, bootstrap: true }));
    try {
      const payload = await fetchJson<MerchantBootstrapPayload>("/api/v1/merchant-portal/bootstrap");
      setProfile(payload.profile);
      setStats(payload.stats);
      setNotifications(payload.notifications ?? []);
      setRecentShipments(payload.recentShipments ?? []);
      setRecentTickets(payload.recentTickets ?? []);
      setBookingForm((prev) => {
        if (prev.merchantName || prev.senderContact || prev.pickupAddress) return prev;
        return emptyBookingForm(payload.profile);
      });
      setPickupForm((prev) => {
        if (prev.contactPerson || prev.pickupAddress) return prev;
        return emptyPickupForm(payload.profile);
      });
    } catch (e) {
      setToast({
        tone: "err",
        message: e instanceof Error ? e.message : "Unable to load merchant portal bootstrap.",
      });
    } finally {
      setLoadingMap((prev) => ({ ...prev, bootstrap: false }));
    }
  }, [accessAllowed]);

  const loadTabData = useCallback(
    async (targetTab: TabKey) => {
      if (!accessAllowed) return;

      setLoadingMap((prev) => ({ ...prev, [targetTab]: true }));
      try {
        if (targetTab === "shipments" || targetTab === "tracking") {
          const rows = await fetchJson<ShipmentRow[]>(
            `/api/v1/merchant-portal/shipments${buildQuery({ search: shipmentSearch || undefined })}`,
          );
          setShipments(rows);
          if (!selectedShipmentId && rows[0]) setSelectedShipmentId(rows[0].id);
        }

        if (targetTab === "pickups") {
          const rows = await fetchJson<PickupRow[]>("/api/v1/merchant-portal/pickups");
          setPickups(rows);
        }

        if (targetTab === "cod") {
          const rows = await fetchJson<CodStatementRow[]>("/api/v1/merchant-portal/cod-statements");
          setCodStatements(rows);
        }

        if (targetTab === "billing") {
          const rows = await fetchJson<InvoiceRow[]>("/api/v1/merchant-portal/invoices");
          setInvoices(rows);
        }

        if (targetTab === "exceptions") {
          const rows = await fetchJson<ExceptionRow[]>("/api/v1/merchant-portal/exceptions");
          setExceptions(rows);
        }

        if (targetTab === "reports") {
          const rows = await fetchJson<ReportRow[]>(
            `/api/v1/merchant-portal/reports${buildQuery({ type: reportType })}`,
          );
          setReports(rows);
        }

        if (targetTab === "receivers") {
          const rows = await fetchJson<ReceiverRow[]>("/api/v1/merchant-portal/receivers");
          setReceivers(rows);
        }

        if (targetTab === "support") {
          const rows = await fetchJson<TicketRow[]>("/api/v1/merchant-portal/tickets");
          setTickets(rows);
        }

        if (targetTab === "notifications") {
          const rows = await fetchJson<NotificationRow[]>("/api/v1/merchant-portal/notifications");
          setNotifications(rows);
        }
      } catch (e) {
        setToast({
          tone: "err",
          message: e instanceof Error ? e.message : `Unable to load ${targetTab}.`,
        });
      } finally {
        setLoadingMap((prev) => ({ ...prev, [targetTab]: false }));
      }
    },
    [accessAllowed, reportType, selectedShipmentId, shipmentSearch],
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

    void loadAuth();

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
      void refreshBootstrap();
    }
  }, [accessAllowed, refreshBootstrap]);

  useEffect(() => {
    if (!accessAllowed) return;
    if (tab === "dashboard" || tab === "profile" || tab === "booking" || tab === "bulk") return;
    void loadTabData(tab);
  }, [accessAllowed, loadTabData, tab]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (tab === "tracking") {
      trackingInputRef.current?.focus();
    }
  }, [tab]);

  const handleBookingSubmit = useCallback(async () => {
    if (!bookingForm.receiverName.trim() || !bookingForm.receiverPhone.trim() || !bookingForm.deliveryAddress.trim()) {
      setToast({ tone: "warn", message: "Receiver name, phone, and delivery address are required." });
      return;
    }

    try {
      await fetchJson("/api/v1/merchant-portal/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingForm),
      });

      setToast({ tone: "ok", message: "Shipment booking submitted successfully." });
      setBookingForm(emptyBookingForm(profile));
      await refreshBootstrap();
      if (tab !== "shipments") {
        setTab("shipments");
      }
    } catch (e) {
      setToast({
        tone: "err",
        message: e instanceof Error ? e.message : "Unable to submit booking.",
      });
    }
  }, [bookingForm, profile, refreshBootstrap, tab]);

  const handlePickupSubmit = useCallback(async () => {
    if (!pickupForm.pickupDate || !pickupForm.pickupAddress.trim() || !pickupForm.contactPerson.trim()) {
      setToast({ tone: "warn", message: "Pickup date, address, and contact person are required." });
      return;
    }

    try {
      const created = await fetchJson<PickupRow>("/api/v1/merchant-portal/pickups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...pickupForm,
          parcelCount: Number(pickupForm.parcelCount || 0),
        }),
      });

      setPickups((prev) => [created, ...prev]);
      setPickupForm(emptyPickupForm(profile));
      setToast({ tone: "ok", message: "Pickup request submitted successfully." });
      await refreshBootstrap();
    } catch (e) {
      setToast({
        tone: "err",
        message: e instanceof Error ? e.message : "Unable to submit pickup request.",
      });
    }
  }, [pickupForm, profile, refreshBootstrap]);

  const handleSupportSubmit = useCallback(async () => {
    if (!supportForm.subject.trim() || !supportForm.description.trim()) {
      setToast({ tone: "warn", message: "Subject and description are required." });
      return;
    }

    try {
      const created = await fetchJson<TicketRow>("/api/v1/merchant-portal/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supportForm),
      });

      setTickets((prev) => [created, ...prev]);
      setSupportForm(emptySupportForm());
      setToast({ tone: "ok", message: "Support ticket submitted successfully." });
      await refreshBootstrap();
    } catch (e) {
      setToast({
        tone: "err",
        message: e instanceof Error ? e.message : "Unable to submit support ticket.",
      });
    }
  }, [supportForm, refreshBootstrap]);

  const handleBulkUpload = useCallback(async () => {
    if (!uploadFile) {
      setToast({ tone: "warn", message: "Please choose a CSV or XLSX file first." });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      await fetchJson("/api/v1/merchant-portal/imports/shipments", {
        method: "POST",
        body: formData,
      });

      setUploadFile(null);
      setToast({ tone: "ok", message: "Bulk shipment file uploaded successfully." });
      setTab("shipments");
    } catch (e) {
      setToast({
        tone: "err",
        message: e instanceof Error ? e.message : "Unable to upload bulk shipment file.",
      });
    }
  }, [uploadFile]);

  const handleReportExport = useCallback(async () => {
    try {
      const payload = await fetchJson<{ url: string }>(
        `/api/v1/merchant-portal/reports/export${buildQuery({ type: reportType })}`,
      );
      window.open(payload.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setToast({
        tone: "err",
        message: e instanceof Error ? e.message : "Unable to export report.",
      });
    }
  }, [reportType]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_54%,#f8fafc_100%)] p-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm text-sm text-slate-500">
          Checking merchant access...
        </div>
      </div>
    );
  }

  if (!accessAllowed) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_54%,#f8fafc_100%)] p-8">
        <div className="max-w-2xl rounded-[32px] border border-rose-200 bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#0d2c54]">
                Merchant Sign-in Required
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Please sign in to continue using the merchant portal.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(13,44,84,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_20%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_54%,#f8fafc_100%)] px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/76 p-6 shadow-[0_24px_56px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-7"
        >
          <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute left-0 top-0 h-32 w-32 rounded-full bg-[#ffd700]/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-3 py-1.5 shadow-sm">
                <Sparkles size={14} className="text-[#0d2c54]" />
                <span className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
                  Merchant Portal
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-[#0d2c54] md:text-5xl">
                Britium Express Merchant Workspace
              </h1>
              <p className="mt-4 text-sm font-medium leading-6 text-slate-500 md:text-[15px]">
                {tt(
                  language,
                  "A production merchant portal for shipments, pickups, tracking, COD, billing, receivers, support, and analytics.",
                  "Shipment, pickup, tracking, COD, billing, receiver, support နှင့် analytics များအတွက် production merchant portal ဖြစ်သည်။",
                )}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:w-[560px]">
              <Panel className="p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {tt(language, "Merchant Account", "merchant account")}
                </div>
                <div className="mt-3 text-base font-black text-[#0d2c54]">
                  {profile?.businessName || authUser.displayName || authUser.email || "-"}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-500">
                  {profile?.ownerName || authUser.fullName || "-"} • {profile?.merchantId || "-"}
                </div>
              </Panel>

              <Panel className="p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {tt(language, "Language Mode", "ဘာသာစကား mode")}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    ["en", "EN"],
                    ["my", "မြန်မာ"],
                    ["both", "EN + မြန်မာ"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setLanguage(value as UiLanguage)}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        language === value
                          ? "bg-[#0d2c54] text-white shadow"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Panel>
            </div>
          </div>

          <div className="relative z-10 mt-6 flex flex-wrap gap-3">
            <ActionButton onClick={() => setTab("booking")}>
              <Package2 size={15} />
              {tt(language, "Create Shipment", "Shipment ဖန်တီးမည်")}
            </ActionButton>
            <ActionButton tone="secondary" onClick={() => setTab("bulk")}>
              <Upload size={15} />
              {tt(language, "Bulk Upload", "အစုလိုက် upload")}
            </ActionButton>
            <ActionButton tone="secondary" onClick={() => setTab("pickups")}>
              <CalendarClock size={15} />
              {tt(language, "Request Pickup", "Pickup တောင်းဆိုမည်")}
            </ActionButton>
            <ActionButton tone="secondary" onClick={() => setTab("cod")}>
              <Wallet size={15} />
              {tt(language, "COD Statement", "COD statement")}
            </ActionButton>
          </div>
        </motion.header>

        {toast ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:sticky xl:top-6 xl:self-start"
          >
            <Panel className="p-3">
              <div className="mb-3 px-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                {tt(language, "Portal Navigation", "Portal လမ်းညွှန်")}
              </div>
              <nav className="flex flex-row flex-wrap gap-2 xl:flex-col">
                {tabs.map((item) => {
                  const Icon = item.icon;
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                        active
                          ? "bg-[#0d2c54] text-white shadow-[0_16px_30px_rgba(13,44,84,0.22)]"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon size={17} />
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-[0.16em]">
                          {item.labelEn}
                        </div>
                        <div className={`mt-1 text-xs font-semibold ${active ? "text-white/70" : "text-slate-400"}`}>
                          {item.labelMy}
                        </div>
                      </div>
                      <ChevronRight size={14} className="ml-auto" />
                    </button>
                  );
                })}
              </nav>
            </Panel>
          </motion.aside>

          <main>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                {tab === "dashboard" ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                      <MetricCard language={language} titleEn="Today’s Shipments" titleMy="ယနေ့ shipment များ" value={String(stats?.todaysShipments ?? 0)} icon={<Package2 size={18} />} />
                      <MetricCard language={language} titleEn="Active Shipments" titleMy="လက်ရှိ shipment များ" value={String(stats?.activeShipments ?? 0)} icon={<Truck size={18} />} />
                      <MetricCard language={language} titleEn="Delivered Shipments" titleMy="ပို့ဆောင်ပြီး shipment များ" value={String(stats?.deliveredShipments ?? 0)} icon={<CheckCircle2 size={18} />} />
                      <MetricCard language={language} titleEn="Pending Pickups" titleMy="pickup စောင့်ဆိုင်းမှုများ" value={String(stats?.pendingPickups ?? 0)} icon={<CalendarClock size={18} />} />
                      <MetricCard language={language} titleEn="COD Pending Transfer" titleMy="လွှဲပြောင်းရန်ကျန် COD" value={formatMMK(stats?.codPendingTransfer)} icon={<Wallet size={18} />} />
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                      <Panel className="xl:col-span-8">
                        <SectionTitle
                          language={language}
                          icon={<Truck size={18} />}
                          titleEn="Recent Shipments"
                          titleMy="မကြာသေးမီ shipment များ"
                          subtitleEn="Latest merchant shipment activity."
                          subtitleMy="နောက်ဆုံး shipment activity များ။"
                        />
                        <SimpleTable
                          loading={loadingMap.bootstrap}
                          columns={["Tracking", "Receiver", "Destination", "Status", "ETA", "Action"]}
                          rows={recentShipments.map((row) => [
                            row.trackingNo,
                            row.receiver,
                            row.destination,
                            <StatusBadge key={`${row.id}-status`} label={row.status} tone={statusTone(row.status)} />,
                            row.eta,
                            <button
                              key={`${row.id}-open`}
                              type="button"
                              onClick={() => {
                                setTab("tracking");
                                setTrackingNo(row.trackingNo);
                              }}
                              className="font-black text-[#0d2c54]"
                            >
                              Track
                            </button>,
                          ])}
                        />
                      </Panel>

                      <Panel className="xl:col-span-4">
                        <SectionTitle
                          language={language}
                          icon={<Bell size={18} />}
                          titleEn="Notifications"
                          titleMy="အသိပေးချက်များ"
                          subtitleEn="Latest merchant alerts."
                          subtitleMy="နောက်ဆုံး merchant alert များ။"
                        />
                        <div className="space-y-3">
                          {notifications.length === 0 ? (
                            <EmptyState title={tt(language, "No notifications", "အသိပေးချက်မရှိပါ")} />
                          ) : (
                            notifications.slice(0, 5).map((item) => (
                              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="font-black text-[#0d2c54]">{item.title}</div>
                                  <StatusBadge label={item.time} tone={item.tone} />
                                </div>
                                <div className="mt-2 text-sm text-slate-600">{item.body}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </Panel>
                    </div>
                  </div>
                ) : null}

                {tab === "profile" ? (
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                    <Panel className="xl:col-span-4">
                      <SectionTitle
                        language={language}
                        icon={<Store size={18} />}
                        titleEn="Business Profile"
                        titleMy="လုပ်ငန်းပရိုဖိုင်"
                        subtitleEn="Merchant identity and verified account details."
                        subtitleMy="merchant အခြေခံအချက်အလက်နှင့် verified account အသေးစိတ်။"
                      />
                      <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-inner">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-slate-200 bg-white text-xl font-black text-[#0d2c54] shadow-sm">
                            {profile?.businessName?.slice(0, 2).toUpperCase() || "MP"}
                          </div>
                          <StatusBadge label={profile?.accountStatus || "ACTIVE"} tone={profile?.verified ? "green" : "amber"} />
                        </div>
                        <div className="mt-4 text-xl font-black text-[#0d2c54]">{profile?.businessName || "-"}</div>
                        <div className="mt-2 text-sm font-semibold text-slate-500">
                          {profile?.ownerName || "-"} • {profile?.merchantId || "-"}
                        </div>
                        <div className="mt-5 space-y-3 text-sm font-semibold text-slate-600">
                          <div className="flex items-center gap-3"><Phone size={15} /> {profile?.phone || "-"}</div>
                          <div className="flex items-center gap-3"><Mail size={15} /> {profile?.email || "-"}</div>
                          <div className="flex items-center gap-3"><MapPin size={15} /> {profile?.registeredAddress || "-"}</div>
                          <div className="flex items-center gap-3"><CalendarClock size={15} /> {profile?.memberSince || "-"}</div>
                        </div>
                      </div>
                    </Panel>

                    <Panel className="xl:col-span-8">
                      <SectionTitle
                        language={language}
                        icon={<Settings2 size={18} />}
                        titleEn="Merchant Settings"
                        titleMy="merchant setting များ"
                        subtitleEn="Live merchant profile information."
                        subtitleMy="live merchant profile information ကိုပြထားသည်။"
                      />
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <ReadField label={tt(language, "Business Name", "လုပ်ငန်းအမည်")} value={profile?.businessName || "-"} />
                        <ReadField label={tt(language, "Owner Name", "ပိုင်ရှင်အမည်")} value={profile?.ownerName || "-"} />
                        <ReadField label={tt(language, "Phone", "ဖုန်း")} value={profile?.phone || "-"} />
                        <ReadField label={tt(language, "Email", "အီးမေးလ်")} value={profile?.email || "-"} />
                        <ReadField label={tt(language, "Pickup Address", "pickup လိပ်စာ")} value={profile?.pickupAddress || "-"} />
                        <ReadField label={tt(language, "Business Type", "လုပ်ငန်းအမျိုးအစား")} value={profile?.businessType || "-"} />
                        <ReadField label={tt(language, "Settlement Preference", "COD စာရင်းရှင်းလင်းမှုပုံစံ")} value={profile?.settlementPreference || "-"} />
                        <ReadField label={tt(language, "Preferred Payment Method", "ဦးစားပေးငွေပေးချေမှုပုံစံ")} value={profile?.preferredPaymentMethod || "-"} />
                      </div>
                    </Panel>
                  </div>
                ) : null}

                {tab === "booking" ? (
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                    <Panel className="xl:col-span-8">
                      <SectionTitle
                        language={language}
                        icon={<Package2 size={18} />}
                        titleEn="Create Shipment / Booking"
                        titleMy="Shipment / Booking ဖန်တီးမည်"
                        subtitleEn="Production merchant booking form."
                        subtitleMy="production merchant booking form ဖြစ်သည်။"
                      />

                      <div className="space-y-6">
                        <div>
                          <div className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                            Sender / Merchant Info
                          </div>
                          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <InputGroup label={tt(language, "Merchant Name", "merchant အမည်")}>
                              <input value={bookingForm.merchantName} onChange={(e) => setBookingForm((prev) => ({ ...prev, merchantName: e.target.value }))} className="field-input" />
                            </InputGroup>
                            <InputGroup label={tt(language, "Sender Contact", "ပေးပို့သူဆက်သွယ်ရန်")}>
                              <input value={bookingForm.senderContact} onChange={(e) => setBookingForm((prev) => ({ ...prev, senderContact: e.target.value }))} className="field-input" />
                            </InputGroup>
                            <InputGroup label={tt(language, "Pickup Address", "pickup လိပ်စာ")} className="md:col-span-2">
                              <textarea value={bookingForm.pickupAddress} onChange={(e) => setBookingForm((prev) => ({ ...prev, pickupAddress: e.target.value }))} className="field-textarea" />
                            </InputGroup>
                            <InputGroup label={tt(language, "Pickup Township", "pickup မြို့နယ်")}>
                              <input value={bookingForm.pickupTownship} onChange={(e) => setBookingForm((prev) => ({ ...prev, pickupTownship: e.target.value }))} className="field-input" />
                            </InputGroup>
                            <InputGroup label={tt(language, "Pickup City", "pickup မြို့")}>
                              <input value={bookingForm.pickupCity} onChange={(e) => setBookingForm((prev) => ({ ...prev, pickupCity: e.target.value }))} className="field-input" />
                            </InputGroup>
                          </div>
                        </div>

                        <div>
                          <div className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                            Receiver Info
                          </div>
                          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <InputGroup label={tt(language, "Receiver Name", "လက်ခံသူအမည်")}>
                              <input value={bookingForm.receiverName} onChange={(e) => setBookingForm((prev) => ({ ...prev, receiverName: e.target.value }))} className="field-input" />
                            </InputGroup>
                            <InputGroup label={tt(language, "Receiver Phone", "လက်ခံသူဖုန်း")}>
                              <input value={bookingForm.receiverPhone} onChange={(e) => setBookingForm((prev) => ({ ...prev, receiverPhone: e.target.value }))} className="field-input" />
                            </InputGroup>
                            <InputGroup label={tt(language, "Receiver Email", "လက်ခံသူအီးမေးလ်")}>
                              <input value={bookingForm.receiverEmail} onChange={(e) => setBookingForm((prev) => ({ ...prev, receiverEmail: e.target.value }))} className="field-input" />
                            </InputGroup>
                            <InputGroup label={tt(language, "Delivery Township", "ပို့ဆောင်မြို့နယ်")}>
                              <input value={bookingForm.deliveryTownship} onChange={(e) => setBookingForm((prev) => ({ ...prev, deliveryTownship: e.target.value }))} className="field-input" />
                            </InputGroup>
                            <InputGroup label={tt(language, "Delivery Address", "ပို့ဆောင်လိပ်စာ")} className="md:col-span-2">
                              <textarea value={bookingForm.deliveryAddress} onChange={(e) => setBookingForm((prev) => ({ ...prev, deliveryAddress: e.target.value }))} className="field-textarea" />
                            </InputGroup>
                          </div>
                        </div>

                        <div>
                          <div className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                            Parcel / Service Info
                          </div>
                          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            <InputGroup label={tt(language, "Parcel Type", "parcel အမျိုးအစား")}>
                              <select value={bookingForm.parcelType} onChange={(e) => setBookingForm((prev) => ({ ...prev, parcelType: e.target.value }))} className="field-input">
                                <option>Parcel</option>
                                <option>Document</option>
                                <option>Fragile Item</option>
                              </select>
                            </InputGroup>
                            <InputGroup label={tt(language, "Weight (kg)", "အလေးချိန် (kg)")}>
                              <input type="number" value={bookingForm.weight} onChange={(e) => setBookingForm((prev) => ({ ...prev, weight: e.target.value }))} className="field-input" />
                            </InputGroup>
                            <InputGroup label={tt(language, "COD Amount", "COD ငွေပမာဏ")}>
                              <input type="number" value={bookingForm.codAmount} onChange={(e) => setBookingForm((prev) => ({ ...prev, codAmount: e.target.value }))} className="field-input" />
                            </InputGroup>
                            <InputGroup label={tt(language, "Service Type", "ဝန်ဆောင်မှုအမျိုးအစား")}>
                              <select value={bookingForm.serviceType} onChange={(e) => setBookingForm((prev) => ({ ...prev, serviceType: e.target.value }))} className="field-input">
                                <option value="standard">standard</option>
                                <option value="next_day">next_day</option>
                                <option value="same_day">same_day</option>
                              </select>
                            </InputGroup>
                            <InputGroup label={tt(language, "Pickup Date", "pickup ရက်")}>
                              <input type="date" value={bookingForm.pickupDate} onChange={(e) => setBookingForm((prev) => ({ ...prev, pickupDate: e.target.value }))} className="field-input" />
                            </InputGroup>
                            <InputGroup label={tt(language, "Payment Responsibility", "ပို့ခပေးမည့်သူ")}>
                              <select value={bookingForm.paymentResponsibility} onChange={(e) => setBookingForm((prev) => ({ ...prev, paymentResponsibility: e.target.value }))} className="field-input">
                                <option value="merchant">merchant</option>
                                <option value="receiver">receiver</option>
                              </select>
                            </InputGroup>
                            <InputGroup label={tt(language, "Item Description", "ပစ္စည်းအမည်")} className="xl:col-span-3">
                              <input value={bookingForm.itemDescription} onChange={(e) => setBookingForm((prev) => ({ ...prev, itemDescription: e.target.value }))} className="field-input" />
                            </InputGroup>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <ActionButton onClick={() => void handleBookingSubmit()}>
                            <Send size={15} />
                            {tt(language, "Submit Booking", "booking အတည်ပြုမည်")}
                          </ActionButton>
                          <ActionButton tone="secondary" onClick={() => setBookingForm(emptyBookingForm(profile))}>
                            <XCircle size={15} />
                            {tt(language, "Reset", "ပြန်စမည်")}
                          </ActionButton>
                        </div>
                      </div>
                    </Panel>

                    <DarkPanel className="xl:col-span-4">
                      <div className="text-2xl font-black text-white">
                        {tt(language, "Booking Summary", "booking အနှစ်ချုပ်")}
                      </div>
                      <div className="mt-5 space-y-3 rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
                        <SummaryLine label={tt(language, "Base Delivery Fee", "မူလပို့ဆောင်ခ")} value={bookingEstimate.baseRate} />
                        <SummaryLine label={tt(language, "Weight Surcharge", "အလေးချိန်ပိုကြေး")} value={bookingEstimate.weightCharge} />
                        <SummaryLine label={tt(language, "COD Handling Fee", "COD ဝန်ဆောင်မှုကြေး")} value={bookingEstimate.codFee} />
                        <SummaryLine label={tt(language, "Insurance Fee", "အာမခံကြေး")} value={bookingEstimate.insuranceFee} />
                        <SummaryLine label={tt(language, "Urgent Surcharge", "အရေးပေါ်ဝန်ဆောင်မှုကြေး")} value={bookingEstimate.urgentFee} />
                        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-base font-black text-[#ffd700]">
                          <span>{tt(language, "Total Estimated Charge", "ခန့်မှန်းစုစုပေါင်းကျသင့်ငွေ")}</span>
                          <span>{bookingEstimate.total.toLocaleString()} Ks</span>
                        </div>
                      </div>
                    </DarkPanel>
                  </div>
                ) : null}

                {tab === "bulk" ? (
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                    <Panel className="xl:col-span-8">
                      <SectionTitle
                        language={language}
                        icon={<Upload size={18} />}
                        titleEn="Bulk Shipment Upload"
                        titleMy="shipment များကိုအစုလိုက် upload လုပ်မည်"
                        subtitleEn="Upload CSV or XLSX shipment files."
                        subtitleMy="CSV သို့မဟုတ် XLSX shipment ဖိုင်များတင်သွင်းနိုင်သည်။"
                      />

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <ActionButton tone="secondary" onClick={() => window.open("/api/v1/merchant-portal/imports/template", "_blank")}>
                          <Download size={15} />
                          {tt(language, "Download Template", "template download")}
                        </ActionButton>
                        <ActionButton tone="secondary">
                          <FileSpreadsheet size={15} />
                          CSV / XLSX
                        </ActionButton>
                        <ActionButton onClick={() => void handleBulkUpload()}>
                          <Send size={15} />
                          {tt(language, "Upload File", "ဖိုင်တင်မည်")}
                        </ActionButton>
                      </div>

                      <div className="mt-5 flex min-h-[180px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50/80 px-8 text-center">
                        <Upload size={28} className="text-slate-400" />
                        <div className="mt-4 text-base font-black text-[#0d2c54]">
                          {tt(language, "Choose CSV/XLSX file", "CSV/XLSX ဖိုင်ရွေးချယ်ပါ")}
                        </div>
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                          className="mt-4"
                        />
                        <div className="mt-2 text-sm text-slate-500">{uploadFile?.name || "-"}</div>
                      </div>
                    </Panel>

                    <DarkPanel className="xl:col-span-4">
                      <div className="text-xl font-black text-white">
                        {tt(language, "Bulk Upload Guide", "bulk upload လမ်းညွှန်")}
                      </div>
                      <div className="mt-5 space-y-3 text-sm font-semibold text-white/75">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          {tt(language, "Download the latest merchant template.", "merchant template နောက်ဆုံးဗားရှင်းကို download လုပ်ပါ။")}
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          {tt(language, "Validate required columns before upload.", "upload မလုပ်မီ လိုအပ်သော column များကိုစစ်ဆေးပါ။")}
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          {tt(language, "Use import results to fix failed rows.", "failed row များကို import result ဖြင့်ပြင်ဆင်ပါ။")}
                        </div>
                      </div>
                    </DarkPanel>
                  </div>
                ) : null}

                {tab === "shipments" ? (
                  <Panel>
                    <SectionTitle
                      language={language}
                      icon={<Boxes size={18} />}
                      titleEn="Shipment Management"
                      titleMy="shipment စီမံခန့်ခွဲမှု"
                      subtitleEn="Searchable merchant shipment list."
                      subtitleMy="ရှာဖွေနိုင်သော merchant shipment list ဖြစ်သည်။"
                    />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <InputGroup label={tt(language, "Search", "ရှာဖွေမှု")}>
                        <div className="relative">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            value={shipmentSearch}
                            onChange={(e) => setShipmentSearch(e.target.value)}
                            className="field-input pl-10"
                            placeholder={tt(language, "Tracking / receiver / destination", "tracking / လက်ခံသူ / destination")}
                          />
                        </div>
                      </InputGroup>
                      <div className="flex items-end">
                        <ActionButton tone="secondary" onClick={() => void loadTabData("shipments")}>
                          <Filter size={15} />
                          {tt(language, "Reload", "ပြန်လည်ရယူ")}
                        </ActionButton>
                      </div>
                    </div>

                    <div className="mt-5">
                      <SimpleTable
                        loading={loadingMap.shipments}
                        columns={[
                          "Tracking",
                          "Booking Date",
                          "Receiver",
                          "Destination",
                          "Service",
                          "COD",
                          "Fee",
                          "Status",
                          "Action",
                        ]}
                        rows={filteredShipments.map((row) => [
                          row.trackingNo,
                          row.bookingDate,
                          row.receiver,
                          row.destination,
                          row.serviceType,
                          formatMMK(row.codAmount),
                          formatMMK(row.deliveryFee),
                          <StatusBadge key={`${row.id}-status`} label={row.status} tone={statusTone(row.status)} />,
                          <div key={`${row.id}-actions`} className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedShipmentId(row.id);
                                setTab("tracking");
                                setTrackingNo(row.trackingNo);
                              }}
                              className="font-black text-[#0d2c54]"
                            >
                              Track
                            </button>
                          </div>,
                        ])}
                      />
                    </div>
                  </Panel>
                ) : null}

                {tab === "tracking" ? (
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                    <Panel className="xl:col-span-4">
                      <SectionTitle
                        language={language}
                        icon={<Search size={18} />}
                        titleEn="Track Shipment"
                        titleMy="shipment ခြေရာခံမည်"
                        subtitleEn="Search by tracking number."
                        subtitleMy="tracking number ဖြင့်ရှာဖွေပါ။"
                      />
                      <InputGroup label={tt(language, "Tracking Number / AWB", "Tracking Number / AWB")}>
                        <div className="relative">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            ref={trackingInputRef}
                            value={trackingNo}
                            onChange={(e) => setTrackingNo(e.target.value)}
                            className="field-input pl-10"
                          />
                        </div>
                      </InputGroup>

                      <div className="mt-4">
                        <ActionButton tone="secondary" onClick={() => void loadTabData("tracking")}>
                          <Search size={15} />
                          {tt(language, "Refresh Tracking Data", "tracking data ပြန်ရယူမည်")}
                        </ActionButton>
                      </div>
                    </Panel>

                    <Panel className="xl:col-span-8">
                      <SectionTitle
                        language={language}
                        icon={<Truck size={18} />}
                        titleEn="Tracking Result"
                        titleMy="tracking ရလဒ်"
                        subtitleEn="Live shipment status and timeline."
                        subtitleMy="live shipment status နှင့် timeline ဖြစ်သည်။"
                      />

                      {!searchedTrackingShipment ? (
                        <EmptyState title={tt(language, "No shipment found for this tracking number.", "ဤ tracking number အတွက် shipment မတွေ့ရှိပါ။")} />
                      ) : (
                        <div className="space-y-5">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="text-lg font-black text-[#0d2c54]">{searchedTrackingShipment.trackingNo}</div>
                              <StatusBadge label={searchedTrackingShipment.status} tone={statusTone(searchedTrackingShipment.status)} />
                            </div>
                            <div className="mt-3 text-sm font-semibold text-slate-600">
                              {searchedTrackingShipment.receiver} • {searchedTrackingShipment.phone}
                            </div>
                            <div className="mt-2 text-sm font-medium text-slate-500">
                              {searchedTrackingShipment.destination}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <ReadField label={tt(language, "Current Status", "လက်ရှိအခြေအနေ")} value={searchedTrackingShipment.status} />
                            <ReadField label={tt(language, "Current Location", "လက်ရှိတည်နေရာ")} value={searchedTrackingShipment.location} />
                            <ReadField label={tt(language, "Estimated Delivery", "ခန့်မှန်းပို့ဆောင်ချိန်")} value={searchedTrackingShipment.eta} />
                            <ReadField label={tt(language, "Assigned Rider", "တာဝန်ခံ rider")} value={searchedTrackingShipment.rider || "-"} />
                          </div>

                          <TimelineBlock timeline={searchedTrackingShipment.timeline} />
                        </div>
                      )}
                    </Panel>
                  </div>
                ) : null}

                {tab === "pickups" ? (
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                    <Panel className="xl:col-span-5">
                      <SectionTitle
                        language={language}
                        icon={<CalendarClock size={18} />}
                        titleEn="New Pickup Request"
                        titleMy="pickup တောင်းဆိုချက်အသစ်"
                        subtitleEn="Submit merchant pickup requests."
                        subtitleMy="merchant pickup request များတင်သွင်းနိုင်သည်။"
                      />
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <InputGroup label={tt(language, "Pickup Date", "pickup ရက်")}>
                          <input type="date" value={pickupForm.pickupDate} onChange={(e) => setPickupForm((prev) => ({ ...prev, pickupDate: e.target.value }))} className="field-input" />
                        </InputGroup>
                        <InputGroup label={tt(language, "Pickup Time Window", "pickup အချိန်အပိုင်းအခြား")}>
                          <select value={pickupForm.timeWindow} onChange={(e) => setPickupForm((prev) => ({ ...prev, timeWindow: e.target.value }))} className="field-input">
                            <option>10:00 AM - 12:00 PM</option>
                            <option>01:00 PM - 03:00 PM</option>
                            <option>03:00 PM - 05:00 PM</option>
                          </select>
                        </InputGroup>
                        <InputGroup label={tt(language, "Estimated Parcel Count", "ခန့်မှန်း parcel အရေအတွက်")}>
                          <input type="number" value={pickupForm.parcelCount} onChange={(e) => setPickupForm((prev) => ({ ...prev, parcelCount: e.target.value }))} className="field-input" />
                        </InputGroup>
                        <InputGroup label={tt(language, "Contact Person", "ဆက်သွယ်ရန်ပုဂ္ဂိုလ်")}>
                          <input value={pickupForm.contactPerson} onChange={(e) => setPickupForm((prev) => ({ ...prev, contactPerson: e.target.value }))} className="field-input" />
                        </InputGroup>
                        <InputGroup label={tt(language, "Pickup Address", "pickup လိပ်စာ")} className="md:col-span-2">
                          <textarea value={pickupForm.pickupAddress} onChange={(e) => setPickupForm((prev) => ({ ...prev, pickupAddress: e.target.value }))} className="field-textarea" />
                        </InputGroup>
                        <InputGroup label={tt(language, "Notes", "မှတ်ချက်")} className="md:col-span-2">
                          <textarea value={pickupForm.notes} onChange={(e) => setPickupForm((prev) => ({ ...prev, notes: e.target.value }))} className="field-textarea" />
                        </InputGroup>
                      </div>
                      <div className="mt-5">
                        <ActionButton onClick={() => void handlePickupSubmit()}>
                          <Send size={15} />
                          {tt(language, "Request Pickup", "pickup တောင်းဆိုမည်")}
                        </ActionButton>
                      </div>
                    </Panel>

                    <Panel className="xl:col-span-7">
                      <SectionTitle
                        language={language}
                        icon={<ClipboardList size={18} />}
                        titleEn="Pickup Schedules & History"
                        titleMy="pickup schedule နှင့် မှတ်တမ်း"
                        subtitleEn="Live pickup request list."
                        subtitleMy="live pickup request list ဖြစ်သည်။"
                      />
                      <SimpleTable
                        loading={loadingMap.pickups}
                        columns={["Pickup ID", "Date", "Window", "Parcel Count", "Address", "Status", "Rider Status"]}
                        rows={pickups.map((row) => [
                          row.id,
                          row.pickupDate,
                          row.timeWindow,
                          String(row.parcelCount),
                          row.address,
                          <StatusBadge key={`${row.id}-status`} label={row.status} tone={statusTone(row.status)} />,
                          row.riderStatus,
                        ])}
                      />
                    </Panel>
                  </div>
                ) : null}

                {tab === "cod" ? (
                  <Panel>
                    <SectionTitle
                      language={language}
                      icon={<Wallet size={18} />}
                      titleEn="COD Statement Table"
                      titleMy="COD statement ဇယား"
                      subtitleEn="Shipment-level COD statements."
                      subtitleMy="shipment အလိုက် COD statement များ။"
                    />
                    <SimpleTable
                      loading={loadingMap.cod}
                      columns={["Shipment", "Delivered", "Receiver", "COD", "Fee", "Deduction", "Net", "Transfer", "Batch"]}
                      rows={codStatements.map((row) => [
                        row.shipmentId,
                        row.deliveredDate,
                        row.receiver,
                        formatMMK(row.codAmount),
                        formatMMK(row.serviceFee),
                        formatMMK(row.deduction),
                        formatMMK(row.netPayable),
                        <StatusBadge key={`${row.id}-transfer`} label={row.transferStatus} tone={statusTone(row.transferStatus)} />,
                        row.settlementBatch,
                      ])}
                    />
                  </Panel>
                ) : null}

                {tab === "billing" ? (
                  <Panel>
                    <SectionTitle
                      language={language}
                      icon={<FileText size={18} />}
                      titleEn="Billing, Invoices & Statements"
                      titleMy="ငွေတောင်းခံမှု၊ invoice နှင့် statement များ"
                      subtitleEn="Live merchant billing records."
                      subtitleMy="live merchant billing record များ။"
                    />
                    <SimpleTable
                      loading={loadingMap.billing}
                      columns={["Invoice", "Period", "Total", "COD Fees", "Deductions", "Status", "Due Date"]}
                      rows={invoices.map((row) => [
                        row.invoiceNo,
                        row.billingPeriod,
                        formatMMK(row.totalCharges),
                        formatMMK(row.codFees),
                        formatMMK(row.deductions),
                        <StatusBadge key={`${row.id}-pay`} label={row.paymentStatus} tone={statusTone(row.paymentStatus)} />,
                        row.dueDate,
                      ])}
                    />
                  </Panel>
                ) : null}

                {tab === "exceptions" ? (
                  <Panel>
                    <SectionTitle
                      language={language}
                      icon={<AlertTriangle size={18} />}
                      titleEn="Returns, Failed Deliveries & Exceptions"
                      titleMy="return၊ failed delivery နှင့် exception များ"
                      subtitleEn="Live merchant exception queue."
                      subtitleMy="live merchant exception queue ဖြစ်သည်။"
                    />
                    <SimpleTable
                      loading={loadingMap.exceptions}
                      columns={["Tracking", "Receiver", "Issue", "Reason", "Status", "Updated"]}
                      rows={exceptions.map((row) => [
                        row.trackingNo,
                        row.receiver,
                        row.issue,
                        row.reason,
                        <StatusBadge key={`${row.id}-status`} label={row.status} tone={statusTone(row.status)} />,
                        row.updatedAt,
                      ])}
                    />
                  </Panel>
                ) : null}

                {tab === "reports" ? (
                  <Panel>
                    <SectionTitle
                      language={language}
                      icon={<PieChart size={18} />}
                      titleEn="Merchant Reports & Analytics"
                      titleMy="merchant အစီရင်ခံစာနှင့် analytics"
                      subtitleEn="Live merchant analytics and exports."
                      subtitleMy="live merchant analytics နှင့် export များ။"
                    />
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="field-input max-w-[260px]"
                      >
                        <option value="shipment_volume">shipment_volume</option>
                        <option value="delivery_success">delivery_success</option>
                        <option value="cod_history">cod_history</option>
                        <option value="destination_breakdown">destination_breakdown</option>
                        <option value="fee_summary">fee_summary</option>
                      </select>
                      <ActionButton tone="secondary" onClick={() => void loadTabData("reports")}>
                        <Filter size={15} />
                        {tt(language, "Reload", "ပြန်လည်ရယူ")}
                      </ActionButton>
                      <ActionButton onClick={() => void handleReportExport()}>
                        <Download size={15} />
                        {tt(language, "Export", "ထုတ်ယူမည်")}
                      </ActionButton>
                    </div>

                    <SimpleTable
                      loading={loadingMap.reports}
                      columns={["Date", "Metric", "Value", "Label"]}
                      rows={reports.map((row) => [
                        row.reportDate,
                        row.metric,
                        row.value,
                        row.label || "-",
                      ])}
                    />
                  </Panel>
                ) : null}

                {tab === "receivers" ? (
                  <Panel>
                    <SectionTitle
                      language={language}
                      icon={<Users size={18} />}
                      titleEn="Receiver Directory"
                      titleMy="လက်ခံသူစာရင်း"
                      subtitleEn="Saved merchant receiver directory."
                      subtitleMy="saved merchant receiver directory ဖြစ်သည်။"
                    />
                    <SimpleTable
                      loading={loadingMap.receivers}
                      columns={["Name", "Phone", "Address", "Township", "City", "Note"]}
                      rows={receivers.map((row) => [
                        row.name,
                        row.phone,
                        row.address,
                        row.township,
                        row.city,
                        row.note || "-",
                      ])}
                    />
                  </Panel>
                ) : null}

                {tab === "support" ? (
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                    <Panel className="xl:col-span-7">
                      <SectionTitle
                        language={language}
                        icon={<Headphones size={18} />}
                        titleEn="Merchant Support Center"
                        titleMy="merchant support center"
                        subtitleEn="Submit support tickets and track responses."
                        subtitleMy="support ticket များတင်သွင်းပြီး response များကိုစောင့်ကြည့်နိုင်သည်။"
                      />

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <InputGroup label={tt(language, "Subject", "အကြောင်းအရာ")} className="md:col-span-2">
                          <input value={supportForm.subject} onChange={(e) => setSupportForm((prev) => ({ ...prev, subject: e.target.value }))} className="field-input" />
                        </InputGroup>
                        <InputGroup label={tt(language, "Issue Type", "ပြဿနာအမျိုးအစား")}>
                          <select value={supportForm.issueType} onChange={(e) => setSupportForm((prev) => ({ ...prev, issueType: e.target.value }))} className="field-input">
                            <option value="shipment">shipment</option>
                            <option value="cod">cod</option>
                            <option value="billing">billing</option>
                            <option value="pickup">pickup</option>
                          </select>
                        </InputGroup>
                        <InputGroup label={tt(language, "Priority", "ဦးစားပေးအဆင့်")}>
                          <select value={supportForm.priority} onChange={(e) => setSupportForm((prev) => ({ ...prev, priority: e.target.value }))} className="field-input">
                            <option value="low">low</option>
                            <option value="normal">normal</option>
                            <option value="high">high</option>
                          </select>
                        </InputGroup>
                        <InputGroup label={tt(language, "Related Shipment ID", "ဆက်စပ် shipment ID")} className="md:col-span-2">
                          <input value={supportForm.relatedShipmentId} onChange={(e) => setSupportForm((prev) => ({ ...prev, relatedShipmentId: e.target.value }))} className="field-input" />
                        </InputGroup>
                        <InputGroup label={tt(language, "Description", "ဖော်ပြချက်")} className="md:col-span-2">
                          <textarea value={supportForm.description} onChange={(e) => setSupportForm((prev) => ({ ...prev, description: e.target.value }))} className="field-textarea" />
                        </InputGroup>
                      </div>

                      <div className="mt-5">
                        <ActionButton onClick={() => void handleSupportSubmit()}>
                          <Send size={15} />
                          {tt(language, "Submit Ticket", "ticket တင်မည်")}
                        </ActionButton>
                      </div>
                    </Panel>

                    <Panel className="xl:col-span-5">
                      <SectionTitle
                        language={language}
                        icon={<History size={18} />}
                        titleEn="Support Ticket List"
                        titleMy="support ticket စာရင်း"
                        subtitleEn="Current and historical merchant tickets."
                        subtitleMy="လက်ရှိနှင့်အတိတ် merchant ticket များ။"
                      />
                      <SimpleTable
                        loading={loadingMap.support}
                        columns={["Ticket", "Subject", "Issue", "Priority", "Status", "Updated"]}
                        rows={tickets.map((row) => [
                          row.id,
                          row.subject,
                          row.issueType,
                          row.priority,
                          <StatusBadge key={`${row.id}-status`} label={row.status} tone={statusTone(row.status)} />,
                          row.lastUpdated,
                        ])}
                      />
                    </Panel>
                  </div>
                ) : null}

                {tab === "notifications" ? (
                  <Panel>
                    <SectionTitle
                      language={language}
                      icon={<Bell size={18} />}
                      titleEn="Notifications & Activity Feed"
                      titleMy="အသိပေးချက်များနှင့် activity feed"
                      subtitleEn="Latest merchant alerts and events."
                      subtitleMy="နောက်ဆုံး merchant alert နှင့် event များ။"
                    />
                    <div className="space-y-4">
                      {loadingMap.notifications ? (
                        <LoadingState />
                      ) : notifications.length === 0 ? (
                        <EmptyState title={tt(language, "No notifications", "အသိပေးချက်မရှိပါ")} />
                      ) : (
                        notifications.map((item) => (
                          <div key={item.id} className={`rounded-[24px] border bg-white p-5 shadow-sm ${item.unread ? "border-sky-200" : "border-slate-200"}`}>
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <div className="text-base font-black text-[#0d2c54]">{item.title}</div>
                                <div className="mt-3 text-sm font-medium leading-6 text-slate-600">{item.body}</div>
                              </div>
                              <div className="flex items-center gap-3">
                                {item.unread ? <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> : null}
                                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{item.time}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Panel>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {(loadingMap.bootstrap || loadingMap[tab]) ? (
          <div className="pointer-events-none fixed bottom-6 right-6 rounded-full bg-[#0d2c54] px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-lg">
            Syncing merchant portal...
          </div>
        ) : null}
      </div>

      <style>{`
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

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl ${className}`}
    >
      {children}
    </motion.section>
  );
}

function DarkPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-[30px] border border-[#17375f] bg-[linear-gradient(180deg,#0d2c54_0%,#0a2343_100%)] p-6 text-white shadow-[0_24px_64px_rgba(13,44,84,0.36)] ${className}`}
    >
      <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-[#ffd700]/10 blur-3xl" />
      <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-sky-400/10 blur-3xl" />
      <div className="relative z-10">{children}</div>
    </motion.section>
  );
}

function SectionTitle({
  language,
  icon,
  titleEn,
  titleMy,
  subtitleEn,
  subtitleMy,
}: {
  language: UiLanguage;
  icon: React.ReactNode;
  titleEn: string;
  titleMy: string;
  subtitleEn?: string;
  subtitleMy?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3 border-b border-slate-200/80 pb-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-[#0d2c54] shadow-inner">
        {icon}
      </div>
      <div>
        <div className="text-lg font-black tracking-tight text-[#0d2c54]">
          {tt(language, titleEn, titleMy)}
        </div>
        {subtitleEn ? (
          <div className="mt-3 text-sm font-medium leading-6 text-slate-500">
            {tt(language, subtitleEn, subtitleMy || subtitleEn)}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ActionButton({
  children,
  tone = "primary",
  onClick,
}: {
  children: React.ReactNode;
  tone?: "primary" | "secondary";
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.16em] ${
        tone === "primary"
          ? "bg-[#0d2c54] text-white shadow-[0_18px_36px_rgba(13,44,84,0.2)]"
          : "border border-slate-200 bg-white text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
      }`}
    >
      {children}
    </motion.button>
  );
}

function MetricCard({
  language,
  titleEn,
  titleMy,
  value,
  icon,
}: {
  language: UiLanguage;
  titleEn: string;
  titleMy: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Panel className="relative overflow-hidden p-5">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#0d2c54]/[0.04] blur-2xl" />
      <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-[#0d2c54] shadow-inner">
        {icon}
      </div>
      <div className="mt-5 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
        {tt(language, titleEn, titleMy)}
      </div>
      <div className="mt-3 text-3xl font-black tracking-tight text-[#0d2c54]">{value}</div>
    </Panel>
  );
}

function InputGroup({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
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
  tone?: Tone;
}) {
  const palette = {
    blue: "bg-sky-50 text-sky-700 border-sky-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
  }[tone];

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] ${palette}`}>
      {label}
    </span>
  );
}

function ReadField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-[#0d2c54] shadow-sm">
        {value}
      </div>
    </div>
  );
}

function SummaryLine({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between text-sm font-semibold text-white/75">
      <span>{label}</span>
      <span>{value.toLocaleString()} Ks</span>
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
      {title}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
      <div className="inline-flex items-center gap-2">
        <Loader2 size={16} className="animate-spin" />
        Loading...
      </div>
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
  if (loading) return <LoadingState />;
  if (!rows.length) return <EmptyState title="No records found." />;

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

function TimelineBlock({
  timeline,
}: {
  timeline: ShipmentTimelineRow[];
}) {
  return (
    <div className="space-y-4">
      {timeline.map((step, index) => (
        <div key={`${step.labelEn}-${index}`} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black ${
                step.done
                  ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                  : "border-slate-200 bg-white text-slate-400"
              }`}
            >
              {step.done ? <CheckCircle2 size={16} /> : index + 1}
            </div>
            {index < timeline.length - 1 ? (
              <div className={`mt-2 h-10 w-px ${step.done ? "bg-emerald-200" : "bg-slate-200"}`} />
            ) : null}
          </div>
          <div className="pb-4">
            <div className="text-sm font-black text-[#0d2c54]">{step.labelEn}</div>
            {step.labelMy ? <div className="mt-1 text-sm font-semibold text-slate-500">{step.labelMy}</div> : null}
            <div className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
              {step.time}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}