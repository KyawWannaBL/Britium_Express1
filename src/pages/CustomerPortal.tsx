import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  AlertCircle,
  Banknote,
  Building2,
  CalendarClock,
  CheckCircle2,
  Globe2,
  MapPin,
  Package2,
  Printer,
  RefreshCw,
  Save,
  ShieldCheck,
  Smartphone,
  Truck,
  User,
  WalletCards,
} from "lucide-react";

type UiLanguage = "en" | "my" | "both";
type DeliveryMode = "pickup_delivery" | "office_to_office";
type ActionType = "draft" | "submit" | "print";

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

type BranchOption = {
  code: string;
  name: string;
};

type ValueLabel = {
  value: string;
  label: string;
};

type VehicleOption = {
  value: string;
  label: string;
  allowedModes?: DeliveryMode[];
};

type DeliveryMeta = {
  branches: BranchOption[];
  serviceTypes: ValueLabel[];
  priorities: ValueLabel[];
  productCategories: ValueLabel[];
  paymentTerms: ValueLabel[];
  payerTypes: ValueLabel[];
  podTypes: ValueLabel[];
  dispatchModes: ValueLabel[];
  vehicles: VehicleOption[];
  cities: string[];
  townshipsByCity: Record<string, string[]>;
};

type FormState = {
  service_type: string;
  priority: string;
  branch_code: string;
  merchant_account_id: string;
  requested_date: string;

  sender_name: string;
  sender_phone: string;
  sender_alt_phone: string;
  sender_city: string;
  sender_township: string;
  sender_address: string;
  sender_landmark: string;
  pickup_time_from: string;
  pickup_time_to: string;

  recipient_name: string;
  recipient_phone: string;
  recipient_alt_phone: string;
  recipient_city: string;
  recipient_township: string;
  recipient_address: string;
  recipient_landmark: string;
  delivery_time_from: string;
  delivery_time_to: string;

  product_name: string;
  product_category: string;
  product_weight: string;
  product_qty: string;
  package_count: string;
  declared_value_mmks: string;
  fragile: boolean;
  special_handling: string;
  internal_remark: string;

  payment_term: string;
  payer_type: string;
  delivery_fee_mmks: string;
  extra_weight_charges: string;
  insurance_fee_mmks: string;
  discount_mmks: string;
  cod_amount_mmks: string;

  pod_type: string;
  contactless_ok: boolean;
  return_if_failed: boolean;
  dispatch_mode: string;
  preferred_vehicle: string;
  send_tracking_sms: boolean;
  print_label_after_create: boolean;
};

type FormErrors = Partial<Record<keyof FormState | "general", string>>;

type CreateDeliveryResult = {
  id: string;
  trackingNo: string;
  status: string;
  printUrl?: string | null;
  labelUrl?: string | null;
  message?: string | null;
};

type ToastTone = "ok" | "warn" | "err";

const ACCESS_ROLE_TOKENS = new Set<string>([
  "SYS",
  "SUPER_ADMIN",
  "ADMIN",
  "SUPERVISOR",
  "OPERATIONS",
  "OPERATIONS_MANAGER",
  "DISPATCH",
  "DISPATCH_SUPERVISOR",
  "CUSTOMER_SERVICE",
  "CUSTOMER_SERVICE_AGENT",
  "DATA_ENTRY",
  "DATA_ENTRY_CLERK",
  "DATA_ENTRY_SUPERVISOR",
  "BRANCH_OFFICE",
  "BRANCH_ADMIN",
  "MERCHANT",
  "MERCHANT_STAFF",
]);

const ACCESS_PERMISSION_TOKENS = new Set<string>([
  "CREATE_DELIVERY_ACCESS",
  "SHIPMENT_CREATE",
  "SHIPMENT_DRAFT_CREATE",
  "SHIPMENT_ALL",
  "ALL",
  "SUPER_ADMIN",
]);

const PRINT_ROLE_TOKENS = new Set<string>([
  "SYS",
  "SUPER_ADMIN",
  "ADMIN",
  "SUPERVISOR",
  "OPERATIONS_MANAGER",
  "DISPATCH_SUPERVISOR",
  "BRANCH_ADMIN",
]);

const EMPTY_META: DeliveryMeta = {
  branches: [],
  serviceTypes: [],
  priorities: [],
  productCategories: [],
  paymentTerms: [],
  payerTypes: [],
  podTypes: [],
  dispatchModes: [],
  vehicles: [],
  cities: [],
  townshipsByCity: {},
};

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
    branchType: obj.branchType ?? obj.branch_type ?? obj.branch?.type ?? obj.officeType ?? obj.orgType,
    displayName: obj.displayName ?? obj.display_name ?? obj.fullName ?? obj.full_name ?? obj.name ?? obj.email,
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
      .filter(Boolean),
  );
}

function getPermissionTokens(user: AuthUser) {
  return new Set(
    (user.permissions ?? [])
      .map((item) => normalizeToken(item))
      .filter(Boolean),
  );
}

function canAccessCreateDelivery(user: AuthUser) {
  const roleTokens = getRoleTokens(user);
  const permissionTokens = getPermissionTokens(user);

  if ([...roleTokens].some((token) => ACCESS_ROLE_TOKENS.has(token))) return true;
  if ([...permissionTokens].some((token) => ACCESS_PERMISSION_TOKENS.has(token))) return true;

  return false;
}

function canPrintCreateDelivery(user: AuthUser) {
  const roleTokens = getRoleTokens(user);
  return [...roleTokens].some((token) => PRINT_ROLE_TOKENS.has(token));
}

function toNumber(value: string | number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePhone(phone: string) {
  return phone.replace(/[\s-]/g, "");
}

function isValidMyanmarPhone(phone: string) {
  const normalized = normalizePhone(phone);
  return /^(09\d{7,11}|\+?959\d{7,11})$/.test(normalized);
}

function formatMoney(value: number, locale = "en-US") {
  return value.toLocaleString(locale);
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

function normalizeMeta(input: any): DeliveryMeta {
  const meta = input ?? {};

  const branches = Array.isArray(meta.branches)
    ? meta.branches
        .map((row: any) => ({
          code: String(row.code ?? ""),
          name: String(row.name ?? row.code ?? ""),
        }))
        .filter((row: BranchOption) => row.code)
    : [];

  const mapValueLabel = (rows: any[]): ValueLabel[] =>
    rows
      .map((row: any) =>
        typeof row === "string"
          ? { value: row, label: row }
          : {
              value: String(row.value ?? ""),
              label: String(row.label ?? row.value ?? ""),
            },
      )
      .filter((row: ValueLabel) => row.value);

  const vehicles = Array.isArray(meta.vehicles)
    ? meta.vehicles
        .map((row: any) => ({
          value: String(row.value ?? ""),
          label: String(row.label ?? row.value ?? ""),
          allowedModes: Array.isArray(row.allowedModes)
            ? row.allowedModes.filter((mode: string) =>
                mode === "pickup_delivery" || mode === "office_to_office",
              )
            : undefined,
        }))
        .filter((row: VehicleOption) => row.value)
    : [];

  const cities = Array.isArray(meta.cities) ? meta.cities.map((item: unknown) => String(item)) : [];
  const townshipsByCity =
    meta.townshipsByCity && typeof meta.townshipsByCity === "object"
      ? Object.fromEntries(
          Object.entries(meta.townshipsByCity).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.map((item) => String(item)) : [],
          ]),
        )
      : {};

  return {
    branches,
    serviceTypes: mapValueLabel(Array.isArray(meta.serviceTypes) ? meta.serviceTypes : []),
    priorities: mapValueLabel(Array.isArray(meta.priorities) ? meta.priorities : []),
    productCategories: mapValueLabel(
      Array.isArray(meta.productCategories) ? meta.productCategories : [],
    ),
    paymentTerms: mapValueLabel(Array.isArray(meta.paymentTerms) ? meta.paymentTerms : []),
    payerTypes: mapValueLabel(Array.isArray(meta.payerTypes) ? meta.payerTypes : []),
    podTypes: mapValueLabel(Array.isArray(meta.podTypes) ? meta.podTypes : []),
    dispatchModes: mapValueLabel(Array.isArray(meta.dispatchModes) ? meta.dispatchModes : []),
    vehicles,
    cities,
    townshipsByCity,
  };
}

async function fetchAuthUserFromProfiles(
  supabase: any,
  userId: string,
): Promise<Partial<AuthUser> | null> {
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
        // ignore
      }
    }
  }

  return null;
}

async function resolveAuthUserFromSupabase(): Promise<AuthUser> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

function emptyForm(meta: DeliveryMeta): FormState {
  return {
    service_type: meta.serviceTypes[0]?.value ?? "",
    priority: meta.priorities[0]?.value ?? "",
    branch_code: meta.branches[0]?.code ?? "",
    merchant_account_id: "",
    requested_date: new Date().toISOString().slice(0, 10),

    sender_name: "",
    sender_phone: "",
    sender_alt_phone: "",
    sender_city: "",
    sender_township: "",
    sender_address: "",
    sender_landmark: "",
    pickup_time_from: "",
    pickup_time_to: "",

    recipient_name: "",
    recipient_phone: "",
    recipient_alt_phone: "",
    recipient_city: "",
    recipient_township: "",
    recipient_address: "",
    recipient_landmark: "",
    delivery_time_from: "",
    delivery_time_to: "",

    product_name: "",
    product_category: meta.productCategories[0]?.value ?? "",
    product_weight: "",
    product_qty: "1",
    package_count: "1",
    declared_value_mmks: "0",
    fragile: false,
    special_handling: "",
    internal_remark: "",

    payment_term: meta.paymentTerms[0]?.value ?? "",
    payer_type: meta.payerTypes[0]?.value ?? "",
    delivery_fee_mmks: "",
    extra_weight_charges: "0",
    insurance_fee_mmks: "0",
    discount_mmks: "0",
    cod_amount_mmks: "",

    pod_type: meta.podTypes[0]?.value ?? "",
    contactless_ok: false,
    return_if_failed: true,
    dispatch_mode: meta.dispatchModes[0]?.value ?? "",
    preferred_vehicle: meta.vehicles[0]?.value ?? "",
    send_tracking_sms: true,
    print_label_after_create: true,
  };
}

export default function CreateDeliveryPortalPage() {
  const [authUser, setAuthUser] = useState<AuthUser>({});
  const [authReady, setAuthReady] = useState(false);

  const [language, setLanguage] = useState<UiLanguage>("both");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("pickup_delivery");
  const [meta, setMeta] = useState<DeliveryMeta>(EMPTY_META);
  const [form, setForm] = useState<FormState>(emptyForm(EMPTY_META));
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [loadingAction, setLoadingAction] = useState<ActionType | null>(null);
  const [toast, setToast] = useState<{ tone: ToastTone; message: string } | null>(null);
  const [successResult, setSuccessResult] = useState<CreateDeliveryResult | null>(null);

  const searchRef = useRef<HTMLSelectElement | null>(null);

  const accessAllowed = authReady && canAccessCreateDelivery(authUser);
  const printAllowed = canPrintCreateDelivery(authUser);
  const loading = loadingAction !== null;
  const locale = language === "my" ? "my-MM" : "en-US";

  const actorName =
    authUser.displayName ||
    authUser.fullName ||
    authUser.name ||
    authUser.email ||
    "Operations Staff";

  const senderTownships = useMemo(
    () => meta.townshipsByCity[form.sender_city] ?? [],
    [form.sender_city, meta.townshipsByCity],
  );

  const recipientTownships = useMemo(
    () => meta.townshipsByCity[form.recipient_city] ?? [],
    [form.recipient_city, meta.townshipsByCity],
  );

  const availableVehicles = useMemo(
    () =>
      meta.vehicles.filter((vehicle) => {
        if (!vehicle.allowedModes || vehicle.allowedModes.length === 0) return true;
        return vehicle.allowedModes.includes(deliveryMode);
      }),
    [deliveryMode, meta.vehicles],
  );

  const chargeSubtotal = useMemo(() => {
    return Math.max(
      0,
      toNumber(form.delivery_fee_mmks) +
        toNumber(form.extra_weight_charges) +
        toNumber(form.insurance_fee_mmks) -
        toNumber(form.discount_mmks),
    );
  }, [
    form.delivery_fee_mmks,
    form.discount_mmks,
    form.extra_weight_charges,
    form.insurance_fee_mmks,
  ]);

  const totalToCollect = useMemo(() => {
    const cod = form.payment_term === "COD" ? toNumber(form.cod_amount_mmks) : 0;
    const deliveryCollectable = form.payer_type === "recipient" ? chargeSubtotal : 0;
    return Math.max(0, cod + deliveryCollectable);
  }, [chargeSubtotal, form.cod_amount_mmks, form.payer_type, form.payment_term]);

  const refreshMeta = useCallback(async () => {
    if (!accessAllowed) return;

    setLoadingMeta(true);
    try {
      const response = await fetchJson<DeliveryMeta | any>("/api/v1/create-delivery/meta");
      const normalized = normalizeMeta(response);

      setMeta(normalized);
      setForm((prev) => {
        const seeded = emptyForm(normalized);
        return {
          ...seeded,
          ...prev,
          service_type: prev.service_type || seeded.service_type,
          priority: prev.priority || seeded.priority,
          branch_code: prev.branch_code || seeded.branch_code,
          product_category: prev.product_category || seeded.product_category,
          payment_term: prev.payment_term || seeded.payment_term,
          payer_type: prev.payer_type || seeded.payer_type,
          pod_type: prev.pod_type || seeded.pod_type,
          dispatch_mode: prev.dispatch_mode || seeded.dispatch_mode,
          preferred_vehicle: prev.preferred_vehicle || seeded.preferred_vehicle,
        };
      });
    } catch (e) {
      setToast({
        tone: "err",
        message: e instanceof Error ? e.message : "Unable to load create-delivery metadata.",
      });
    } finally {
      setLoadingMeta(false);
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
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
      void refreshMeta();
    }
  }, [accessAllowed, refreshMeta]);

  useEffect(() => {
    if (!meta.paymentTerms.length) return;

    if (form.payment_term !== "COD" && form.cod_amount_mmks !== "") {
      setForm((prev) => ({ ...prev, cod_amount_mmks: "" }));
    }
  }, [form.cod_amount_mmks, form.payment_term, meta.paymentTerms.length]);

  useEffect(() => {
    if (!availableVehicles.length) return;

    const currentStillValid = availableVehicles.some((item) => item.value === form.preferred_vehicle);
    if (!currentStillValid) {
      setForm((prev) => ({ ...prev, preferred_vehicle: availableVehicles[0]?.value ?? "" }));
    }
  }, [availableVehicles, form.preferred_vehicle]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key] && !prev.general) return prev;
      const next = { ...prev };
      delete next[key];
      delete next.general;
      return next;
    });
  }, []);

  const resetForm = useCallback(() => {
    setForm((prev) => {
      const seeded = emptyForm(meta);
      return {
        ...seeded,
        branch_code: prev.branch_code || seeded.branch_code,
        service_type: prev.service_type || seeded.service_type,
        priority: prev.priority || seeded.priority,
      };
    });
    setFieldErrors({});
  }, [meta]);

  const validate = useCallback((): FormErrors => {
    const errors: FormErrors = {};

    const setError = (key: keyof FormErrors, message: string) => {
      if (!errors[key]) errors[key] = message;
    };

    if (!form.service_type) setError("service_type", "Required");
    if (!form.priority) setError("priority", "Required");
    if (!form.branch_code.trim()) setError("branch_code", "Required");
    if (!form.requested_date) setError("requested_date", "Required");

    if (!form.sender_name.trim()) setError("sender_name", "Required");
    if (!isValidMyanmarPhone(form.sender_phone)) setError("sender_phone", "Invalid");
    if (form.sender_alt_phone.trim() && !isValidMyanmarPhone(form.sender_alt_phone)) {
      setError("sender_alt_phone", "Invalid");
    }
    if (!form.sender_city.trim()) setError("sender_city", "Required");
    if (!form.sender_township.trim()) setError("sender_township", "Required");
    if (!form.sender_address.trim()) setError("sender_address", "Required");
    if (form.pickup_time_from && form.pickup_time_to && form.pickup_time_from > form.pickup_time_to) {
      setError("pickup_time_to", "Invalid range");
    }

    if (!form.recipient_name.trim()) setError("recipient_name", "Required");
    if (!isValidMyanmarPhone(form.recipient_phone)) setError("recipient_phone", "Invalid");
    if (form.recipient_alt_phone.trim() && !isValidMyanmarPhone(form.recipient_alt_phone)) {
      setError("recipient_alt_phone", "Invalid");
    }
    if (!form.recipient_city.trim()) setError("recipient_city", "Required");
    if (!form.recipient_township.trim()) setError("recipient_township", "Required");
    if (!form.recipient_address.trim()) setError("recipient_address", "Required");
    if (
      form.delivery_time_from &&
      form.delivery_time_to &&
      form.delivery_time_from > form.delivery_time_to
    ) {
      setError("delivery_time_to", "Invalid range");
    }

    if (!form.product_name.trim()) setError("product_name", "Required");
    if (!form.product_category.trim()) setError("product_category", "Required");
    if (toNumber(form.product_weight) <= 0) setError("product_weight", "> 0");
    if (toNumber(form.product_qty) < 1) setError("product_qty", ">= 1");
    if (toNumber(form.package_count) < 1) setError("package_count", ">= 1");
    if (toNumber(form.declared_value_mmks) < 0) setError("declared_value_mmks", "Invalid");

    if (!form.payment_term) setError("payment_term", "Required");
    if (!form.payer_type) setError("payer_type", "Required");
    if (toNumber(form.delivery_fee_mmks) < 0) setError("delivery_fee_mmks", "Invalid");
    if (toNumber(form.extra_weight_charges) < 0) setError("extra_weight_charges", "Invalid");
    if (toNumber(form.insurance_fee_mmks) < 0) setError("insurance_fee_mmks", "Invalid");
    if (toNumber(form.discount_mmks) < 0) setError("discount_mmks", "Invalid");
    if (form.payment_term === "COD" && toNumber(form.cod_amount_mmks) <= 0) {
      setError("cod_amount_mmks", "Required");
    }
    if (form.payment_term !== "COD" && toNumber(form.cod_amount_mmks) !== 0) {
      setError("cod_amount_mmks", "Must be 0");
    }

    if (!form.pod_type) setError("pod_type", "Required");
    if (!form.dispatch_mode) setError("dispatch_mode", "Required");
    if (!form.preferred_vehicle) setError("preferred_vehicle", "Required");

    if (
      form.sender_phone.trim() &&
      form.recipient_phone.trim() &&
      normalizePhone(form.sender_phone) === normalizePhone(form.recipient_phone)
    ) {
      setError("general", "Sender and recipient phone numbers should not be identical.");
    }

    return errors;
  }, [form]);

  const buildPayload = useCallback(() => {
    return {
      actionType: loadingAction,
      delivery_mode: deliveryMode,
      requested_date: form.requested_date,

      service_type: form.service_type,
      priority: form.priority,
      branch_code: form.branch_code.trim(),
      merchant_account_id: form.merchant_account_id.trim() || null,

      sender: {
        name: form.sender_name.trim(),
        phone: normalizePhone(form.sender_phone),
        alt_phone: form.sender_alt_phone.trim() ? normalizePhone(form.sender_alt_phone) : null,
        city: form.sender_city.trim(),
        township: form.sender_township.trim(),
        address: form.sender_address.trim(),
        landmark: form.sender_landmark.trim() || null,
        pickup_time_from: form.pickup_time_from || null,
        pickup_time_to: form.pickup_time_to || null,
      },

      recipient: {
        name: form.recipient_name.trim(),
        phone: normalizePhone(form.recipient_phone),
        alt_phone: form.recipient_alt_phone.trim()
          ? normalizePhone(form.recipient_alt_phone)
          : null,
        city: form.recipient_city.trim(),
        township: form.recipient_township.trim(),
        address: form.recipient_address.trim(),
        landmark: form.recipient_landmark.trim() || null,
        delivery_time_from: form.delivery_time_from || null,
        delivery_time_to: form.delivery_time_to || null,
      },

      parcel: {
        product_name: form.product_name.trim(),
        product_category: form.product_category,
        product_weight: toNumber(form.product_weight),
        product_qty: toNumber(form.product_qty),
        package_count: toNumber(form.package_count),
        declared_value_mmks: toNumber(form.declared_value_mmks),
        fragile: form.fragile,
        special_handling: form.special_handling.trim() || null,
        internal_remark: form.internal_remark.trim() || null,
      },

      billing: {
        payment_term: form.payment_term,
        payer_type: form.payer_type,
        delivery_fee_mmks: toNumber(form.delivery_fee_mmks),
        extra_weight_charges: toNumber(form.extra_weight_charges),
        insurance_fee_mmks: toNumber(form.insurance_fee_mmks),
        discount_mmks: toNumber(form.discount_mmks),
        cod_amount_mmks: form.payment_term === "COD" ? toNumber(form.cod_amount_mmks) : 0,
        charge_subtotal_mmks: chargeSubtotal,
        total_collectable_amount: totalToCollect,
      },

      dispatch: {
        pod_type: form.pod_type,
        contactless_ok: form.contactless_ok,
        return_if_failed: form.return_if_failed,
        dispatch_mode: form.dispatch_mode,
        preferred_vehicle: form.preferred_vehicle,
        send_tracking_sms: form.send_tracking_sms,
        print_label_after_create: form.print_label_after_create,
      },

      created_from: "create_delivery_portal",
      actor_name: actorName,
    };
  }, [actorName, chargeSubtotal, deliveryMode, form, loadingAction, totalToCollect]);

  const handleAction = useCallback(
    async (actionType: ActionType) => {
      setLoadingAction(actionType);
      setSuccessResult(null);
      setToast(null);

      try {
        if (actionType !== "draft") {
          const errors = validate();
          if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setToast({
              tone: "err",
              message: t(
                language,
                "Please review the highlighted fields before submitting.",
                "Submit မလုပ်မီ မီးပြထားသော field များကို စစ်ဆေးပါ။",
              ),
            });
            return;
          }
        }

        const payload = { ...buildPayload(), actionType };

        const endpoint =
          actionType === "draft"
            ? "/api/v1/create-delivery/drafts"
            : "/api/v1/create-delivery/orders";

        const result = await fetchJson<CreateDeliveryResult>(endpoint, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setSuccessResult(result);
        setToast({
          tone: "ok",
          message:
            result.message ||
            t(
              language,
              `Success: ${result.trackingNo} created successfully.`,
              `အောင်မြင်ပါသည် - ${result.trackingNo} ဖန်တီးပြီးပါပြီ။`,
            ),
        });

        const printUrl = result.printUrl || result.labelUrl;
        if ((actionType === "print" || form.print_label_after_create) && printUrl && printAllowed) {
          window.open(printUrl, "_blank", "noopener,noreferrer");
        }

        resetForm();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e) {
        setToast({
          tone: "err",
          message: e instanceof Error ? e.message : "Unable to save create-delivery order.",
        });
      } finally {
        setLoadingAction(null);
      }
    },
    [buildPayload, form.print_label_after_create, language, printAllowed, resetForm, validate],
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
                Create Delivery Access Restricted
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                This portal is only for authorized operations, dispatch, branch, merchant,
                customer-service, admin, and data-entry users.
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
            Shipment Intake
          </p>
          <h1 className="text-4xl font-black uppercase tracking-tight text-[#0d2c54]">
            Create Delivery{" "}
            <span className="font-normal text-blue-500">/ ပို့ဆောင်မှုဖန်တီးခြင်း</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t(
              language,
              "Production shipment creation portal with live metadata, controlled validation, and backend-generated orders.",
              "Live metadata, controlled validation နှင့် backend-generated order များဖြင့် production shipment creation portal ဖြစ်သည်။",
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <LanguageToggle value={language} onChange={setLanguage} />
          <SegmentedMode value={deliveryMode} onChange={setDeliveryMode} language={language} />
          <button
            type="button"
            onClick={() => void refreshMeta()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={14} className={loadingMeta ? "animate-spin" : ""} />
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

      {successResult ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="mt-0.5 text-emerald-600" />
            <div>
              <div className="font-black text-emerald-700">
                {t(language, "Shipment created successfully", "Shipment ဖန်တီးပြီးပါပြီ")}
              </div>
              <div className="mt-1 text-emerald-700">
                {t(language, "Tracking No", "Tracking No")}:{" "}
                <span className="font-black">{successResult.trackingNo}</span>
              </div>
              <div className="mt-1 text-emerald-700">
                {t(language, "Status", "အခြေအနေ")}: {successResult.status}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Package2}
          title={t(language, "Charge Subtotal", "စုစုပေါင်းပို့ခ")}
          value={`${formatMoney(chargeSubtotal, locale)} Ks`}
        />
        <StatCard
          icon={WalletCards}
          title={t(language, "Total Collectable", "စုစုပေါင်းကောက်ခံရန်")}
          value={`${formatMoney(totalToCollect, locale)} Ks`}
          accent="amber"
        />
        <StatCard
          icon={Truck}
          title={t(language, "Dispatch Vehicle", "ပို့ဆောင်ယာဉ်")}
          value={form.preferred_vehicle || "-"}
          accent="sky"
        />
        <StatCard
          icon={Building2}
          title={t(language, "Branch", "ရုံးခွဲ")}
          value={form.branch_code || "-"}
          accent="emerald"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <SectionCard
          title={t(language, "Booking Setup", "Booking အခြေခံအချက်အလက်")}
          icon={<CalendarClock size={18} />}
          description={t(
            language,
            "Live-configured service, branch, priority, and requested delivery date.",
            "Live-configured service, branch, priority နှင့် requested delivery date များကို အသုံးပြုပါ။",
          )}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FieldBox label={t(language, "Service Type", "ဝန်ဆောင်မှုအမျိုးအစား")} error={fieldErrors.service_type}>
              <select
                value={form.service_type}
                onChange={(e) => setField("service_type", e.target.value)}
                className="field-input"
                title={t(language, "Service Type", "ဝန်ဆောင်မှုအမျိုးအစား")}
              >
                <option value="">{t(language, "Select", "ရွေးပါ")}</option>
                {meta.serviceTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FieldBox>

            <FieldBox label={t(language, "Priority", "ဦးစားပေးအဆင့်")} error={fieldErrors.priority}>
              <select
                value={form.priority}
                onChange={(e) => setField("priority", e.target.value)}
                className="field-input"
                title={t(language, "Priority", "ဦးစားပေးအဆင့်")}
              >
                <option value="">{t(language, "Select", "ရွေးပါ")}</option>
                {meta.priorities.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FieldBox>

            <FieldBox label={t(language, "Branch", "ရုံးခွဲ")} error={fieldErrors.branch_code}>
              <select
                value={form.branch_code}
                onChange={(e) => setField("branch_code", e.target.value)}
                className="field-input"
                ref={searchRef}
                title={t(language, "Branch", "ရုံးခွဲ")}
              >
                <option value="">{t(language, "Select branch", "ရုံးခွဲရွေးပါ")}</option>
                {meta.branches.map((branch) => (
                  <option key={branch.code} value={branch.code}>
                    {branch.code} - {branch.name}
                  </option>
                ))}
              </select>
            </FieldBox>

            <FieldBox label={t(language, "Requested Date", "တောင်းဆိုသည့်ရက်")} error={fieldErrors.requested_date}>
              <input
                type="date"
                value={form.requested_date}
                onChange={(e) => setField("requested_date", e.target.value)}
                className="field-input"
                placeholder={t(language, "Requested Date", "တောင်းဆိုသည့်ရက်")}
                title={t(language, "Requested Date", "တောင်းဆိုသည့်ရက်")}
              />
            </FieldBox>

            <div className="md:col-span-2 xl:col-span-4">
              <FieldBox
                label={t(language, "Merchant Account", "Merchant အကောင့်")}
                error={fieldErrors.merchant_account_id}
              >
                <InputWithIcon
                  value={form.merchant_account_id}
                  onChange={(value) => setField("merchant_account_id", value)}
                  placeholder={t(language, "Optional merchant / account reference", "ရွေးချယ်ထည့်နိုင်သော merchant / account reference")}
                  icon={<User size={16} className="text-slate-400" />}
                />
              </FieldBox>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={t(language, "Sender & Pickup", "ပေးပို့သူ နှင့် လာယူမည့်နေရာ")}
          icon={<MapPin size={18} />}
          description={t(
            language,
            "Validated pickup contact and location using live cities and townships.",
            "Live city နှင့် township data ကို အသုံးပြုထားသော validated pickup contact နှင့် location ဖြစ်သည်။",
          )}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FieldBox label={t(language, "Sender Name", "ပေးပို့သူအမည်")} error={fieldErrors.sender_name}>
              <InputWithIcon
                value={form.sender_name}
                onChange={(value) => setField("sender_name", value)}
                placeholder={t(language, "Sender / company", "ပေးပို့သူ / ကုမ္ပဏီ")}
                icon={<User size={16} className="text-slate-400" />}
              />
            </FieldBox>

            <FieldBox label={t(language, "Sender Phone", "ပေးပို့သူဖုန်း")} error={fieldErrors.sender_phone}>
              <InputWithIcon
                value={form.sender_phone}
                onChange={(value) => setField("sender_phone", value)}
                placeholder="09xxxxxxxxx"
                icon={<Smartphone size={16} className="text-slate-400" />}
              />
            </FieldBox>

            <FieldBox label={t(language, "Alt Phone", "အပိုဖုန်း")} error={fieldErrors.sender_alt_phone}>
              <input
                value={form.sender_alt_phone}
                onChange={(e) => setField("sender_alt_phone", e.target.value)}
                className="field-input"
                placeholder={t(language, "Optional", "ရွေးချယ်ထည့်နိုင်သည်")}
                title={t(language, "Alt Phone", "အပိုဖုန်း")}
              />
            </FieldBox>

            <FieldBox label={t(language, "City", "မြို့")} error={fieldErrors.sender_city}>
              <select
                value={form.sender_city}
                onChange={(e) => {
                  setField("sender_city", e.target.value);
                  setField("sender_township", "");
                }}
                className="field-input"
                title={t(language, "City", "မြို့")}
              >
                <option value="">{t(language, "Select city", "မြို့ရွေးပါ")}</option>
                {meta.cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </FieldBox>

            <FieldBox label={t(language, "Township", "မြို့နယ်")} error={fieldErrors.sender_township}>
              <select
                value={form.sender_township}
                onChange={(e) => setField("sender_township", e.target.value)}
                className="field-input"
                disabled={!form.sender_city}
                title={t(language, "Township", "မြို့နယ်")}
              >
                <option value="">{t(language, "Select township", "မြို့နယ်ရွေးပါ")}</option>
                {senderTownships.map((township) => (
                  <option key={township} value={township}>
                    {township}
                  </option>
                ))}
              </select>
            </FieldBox>

            <FieldBox label={t(language, "Pickup Window From", "လာယူချိန် မှ")} error={fieldErrors.pickup_time_from}>
              <input
                type="time"
                value={form.pickup_time_from}
                onChange={(e) => setField("pickup_time_from", e.target.value)}
                className="field-input"
                placeholder={t(language, "Pickup Window From", "လာယူချိန် မှ")}
                title={t(language, "Pickup Window From", "လာယူချိန် မှ")}
              />
            </FieldBox>

            <div className="md:col-span-2">
              <FieldBox label={t(language, "Pickup Address", "လာယူမည့်လိပ်စာ")} error={fieldErrors.sender_address}>
                <textarea
                  value={form.sender_address}
                  onChange={(e) => setField("sender_address", e.target.value)}
                  className="field-textarea"
                  placeholder={t(language, "Building, street, ward, landmark", "အဆောက်အဦ၊ လမ်း၊ ရပ်ကွက်၊ မှတ်တိုင်")}
                />
              </FieldBox>
            </div>

            <FieldBox label={t(language, "Landmark", "မှတ်တိုင်")} error={fieldErrors.sender_landmark}>
              <input
                value={form.sender_landmark}
                onChange={(e) => setField("sender_landmark", e.target.value)}
                className="field-input"
                placeholder={t(language, "Optional landmark", "ရွေးချယ်ထည့်နိုင်သောမှတ်တိုင်")}
                title={t(language, "Landmark", "မှတ်တိုင်")}
              />
            </FieldBox>

            <FieldBox label={t(language, "Pickup Window To", "လာယူချိန် ထိ")} error={fieldErrors.pickup_time_to}>
              <input
                type="time"
                value={form.pickup_time_to}
                onChange={(e) => setField("pickup_time_to", e.target.value)}
                className="field-input"
                placeholder={t(language, "Pickup Window To", "လာယူချိန် ထိ")}
                title={t(language, "Pickup Window To", "လာယူချိန် ထိ")}
              />
            </FieldBox>
          </div>
        </SectionCard>

        <SectionCard
          title={t(language, "Recipient & Delivery", "လက်ခံသူ နှင့် ပို့မည့်နေရာ")}
          icon={<Truck size={18} />}
          description={t(
            language,
            "Validated destination contact and address for dispatch and delivery accuracy.",
            "Dispatch နှင့် delivery တိကျမှုအတွက် validated destination contact နှင့် address ဖြစ်သည်။",
          )}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FieldBox label={t(language, "Recipient Name", "လက်ခံသူအမည်")} error={fieldErrors.recipient_name}>
              <InputWithIcon
                value={form.recipient_name}
                onChange={(value) => setField("recipient_name", value)}
                placeholder={t(language, "Recipient / company", "လက်ခံသူ / ကုမ္ပဏီ")}
                icon={<User size={16} className="text-slate-400" />}
              />
            </FieldBox>

            <FieldBox label={t(language, "Recipient Phone", "လက်ခံသူဖုန်း")} error={fieldErrors.recipient_phone}>
              <InputWithIcon
                value={form.recipient_phone}
                onChange={(value) => setField("recipient_phone", value)}
                placeholder="09xxxxxxxxx"
                icon={<Smartphone size={16} className="text-slate-400" />}
              />
            </FieldBox>

            <FieldBox label={t(language, "Alt Phone", "အပိုဖုန်း")} error={fieldErrors.recipient_alt_phone}>
              <input
                value={form.recipient_alt_phone}
                onChange={(e) => setField("recipient_alt_phone", e.target.value)}
                className="field-input"
                placeholder={t(language, "Optional", "ရွေးချယ်ထည့်နိုင်သည်")}
                title={t(language, "Alt Phone", "အပိုဖုန်း")}
              />
            </FieldBox>

            <FieldBox label={t(language, "City", "မြို့")} error={fieldErrors.recipient_city}>
              <select
                value={form.recipient_city}
                onChange={(e) => {
                  setField("recipient_city", e.target.value);
                  setField("recipient_township", "");
                }}
                className="field-input"
                title={t(language, "City", "မြို့")}
              >
                <option value="">{t(language, "Select city", "မြို့ရွေးပါ")}</option>
                {meta.cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </FieldBox>

            <FieldBox label={t(language, "Township", "မြို့နယ်")} error={fieldErrors.recipient_township}>
              <select
                value={form.recipient_township}
                onChange={(e) => setField("recipient_township", e.target.value)}
                className="field-input"
                disabled={!form.recipient_city}
                title={t(language, "Township", "မြို့နယ်")}
              >
                <option value="">{t(language, "Select township", "မြို့နယ်ရွေးပါ")}</option>
                {recipientTownships.map((township) => (
                  <option key={township} value={township}>
                    {township}
                  </option>
                ))}
              </select>
            </FieldBox>

            <FieldBox label={t(language, "Delivery Window From", "ပို့ချိန် မှ")} error={fieldErrors.delivery_time_from}>
              <input
                type="time"
                value={form.delivery_time_from}
                onChange={(e) => setField("delivery_time_from", e.target.value)}
                className="field-input"
                placeholder={t(language, "Delivery Window From", "ပို့ချိန် မှ")}
                title={t(language, "Delivery Window From", "ပို့ချိန် မှ")}
              />
            </FieldBox>

            <div className="md:col-span-2">
              <FieldBox label={t(language, "Delivery Address", "ပို့မည့်လိပ်စာ")} error={fieldErrors.recipient_address}>
                <textarea
                  value={form.recipient_address}
                  onChange={(e) => setField("recipient_address", e.target.value)}
                  className="field-textarea"
                  placeholder={t(language, "Building, street, ward, landmark", "အဆောက်အဦ၊ လမ်း၊ ရပ်ကွက်၊ မှတ်တိုင်")}
                />
              </FieldBox>
            </div>

            <FieldBox label={t(language, "Landmark", "မှတ်တိုင်")} error={fieldErrors.recipient_landmark}>
              <input
                value={form.recipient_landmark}
                onChange={(e) => setField("recipient_landmark", e.target.value)}
                className="field-input"
                placeholder={t(language, "Optional landmark", "ရွေးချယ်ထည့်နိုင်သောမှတ်တိုင်")}
                title={t(language, "Landmark", "မှတ်တိုင်")}
              />
            </FieldBox>

            <FieldBox label={t(language, "Delivery Window To", "ပို့ချိန် ထိ")} error={fieldErrors.delivery_time_to}>
              <input
                type="time"
                value={form.delivery_time_to}
                onChange={(e) => setField("delivery_time_to", e.target.value)}
                className="field-input"
                placeholder={t(language, "Delivery Window To", "ပို့ချိန် ထိ")}
                title={t(language, "Delivery Window To", "ပို့ချိန် ထိ")}
              />
            </FieldBox>
          </div>
        </SectionCard>

        <SectionCard
          title={t(language, "Parcel Details", "ပစ္စည်းအချက်အလက်")}
          icon={<Package2 size={18} />}
          description={t(
            language,
            "Weight, package count, declared value, fragile handling, and category from live configuration.",
            "Weight, package count, declared value, fragile handling နှင့် category ကို live config ဖြင့်အသုံးပြုပါ။",
          )}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <FieldBox label={t(language, "Product Name", "ပစ္စည်းအမည်")} error={fieldErrors.product_name}>
                <input
                  value={form.product_name}
                  onChange={(e) => setField("product_name", e.target.value)}
                  className="field-input"
                  placeholder={t(language, "Ex: Clothing, cosmetics, documents", "ဥပမာ - အဝတ်အထည်၊ အလှကုန်၊ စာရွက်စာတမ်း")}
                  title={t(language, "Product Name", "ပစ္စည်းအမည်")}
                />
              </FieldBox>
            </div>

            <FieldBox label={t(language, "Category", "အမျိုးအစား")} error={fieldErrors.product_category}>
              <select
                value={form.product_category}
                onChange={(e) => setField("product_category", e.target.value)}
                className="field-input"
                title={t(language, "Category", "အမျိုးအစား")}
              >
                <option value="">{t(language, "Select category", "အမျိုးအစားရွေးပါ")}</option>
                {meta.productCategories.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FieldBox>

            <FieldBox label={t(language, "Weight (kg)", "အလေးချိန် (kg)")} error={fieldErrors.product_weight}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.product_weight}
                onChange={(e) => setField("product_weight", e.target.value)}
                className="field-input"
                placeholder={t(language, "Weight (kg)", "အလေးချိန် (kg)")}
                title={t(language, "Weight (kg)", "အလေးချိန် (kg)")}
              />
            </FieldBox>

            <FieldBox label={t(language, "Units", "အရေအတွက်")} error={fieldErrors.product_qty}>
              <input
                type="number"
                min="1"
                value={form.product_qty}
                onChange={(e) => setField("product_qty", e.target.value)}
                className="field-input"
                placeholder={t(language, "Units", "အရေအတွက်")}
                title={t(language, "Units", "အရေအတွက်")}
              />
            </FieldBox>

            <FieldBox label={t(language, "Packages", "အထုပ်အရေအတွက်")} error={fieldErrors.package_count}>
              <input
                type="number"
                min="1"
                value={form.package_count}
                onChange={(e) => setField("package_count", e.target.value)}
                className="field-input"
                placeholder={t(language, "Packages", "အထုပ်အရေအတွက်")}
                title={t(language, "Packages", "အထုပ်အရေအတွက်")}
              />
            </FieldBox>

            <FieldBox label={t(language, "Declared Value (MMK)", "ပစ္စည်းတန်ဖိုး (MMK)")} error={fieldErrors.declared_value_mmks}>
              <input
                type="number"
                min="0"
                value={form.declared_value_mmks}
                onChange={(e) => setField("declared_value_mmks", e.target.value)}
                className="field-input"
                placeholder={t(language, "Declared Value (MMK)", "ပစ္စည်းတန်ဖိုး (MMK)")}
                title={t(language, "Declared Value (MMK)", "ပစ္စည်းတန်ဖိုး (MMK)")}
              />
            </FieldBox>

            <div className="md:col-span-2 xl:col-span-4">
              <FieldBox label={t(language, "Special Handling", "အထူးကိုင်တွယ်ရန်")} error={fieldErrors.special_handling}>
                <textarea
                  value={form.special_handling}
                  onChange={(e) => setField("special_handling", e.target.value)}
                  className="field-textarea"
                  placeholder={t(language, "Fragile, keep upright, do not stack, cold chain, etc.", "Fragile, upright, do not stack, cold chain စသည်")}
                />
              </FieldBox>
            </div>

            <div className="md:col-span-2 xl:col-span-4">
              <ToggleRow
                label={t(language, "Fragile Shipment", "ကွဲလွယ်သောပစ္စည်း")}
                description={t(language, "Mark this parcel for careful handling.", "ဂရုတစိုက်ကိုင်တွယ်ရန် မှတ်သားပါ။")}
                checked={form.fragile}
                onChange={(next) => setField("fragile", next)}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={t(language, "Billing & Collection", "ငွေတောင်းခံမှု နှင့် ကောက်ခံမှု")}
          icon={<Banknote size={18} />}
          description={t(
            language,
            "Production billing fields only. Totals are calculated from real entered values.",
            "Production billing field များသာပါရှိပြီး total များကို တကယ့်တန်ဖိုးများမှတွက်ချက်သည်။",
          )}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FieldBox label={t(language, "Payment Term", "ငွေချေစနစ်")} error={fieldErrors.payment_term}>
              <select
                value={form.payment_term}
                onChange={(e) => setField("payment_term", e.target.value)}
                className="field-input"
                title={t(language, "Payment Term", "ငွေချေစနစ်")}
              >
                <option value="">{t(language, "Select", "ရွေးပါ")}</option>
                {meta.paymentTerms.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FieldBox>

            <FieldBox label={t(language, "Payer", "ပေးမည့်သူ")} error={fieldErrors.payer_type}>
              <select
                value={form.payer_type}
                onChange={(e) => setField("payer_type", e.target.value)}
                className="field-input"
                title={t(language, "Payer", "ပေးမည့်သူ")}
              >
                <option value="">{t(language, "Select", "ရွေးပါ")}</option>
                {meta.payerTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FieldBox>

            <FieldBox label={t(language, "Delivery Fee", "ပို့ဆောင်ခ")} error={fieldErrors.delivery_fee_mmks}>
              <input
                type="number"
                min="0"
                value={form.delivery_fee_mmks}
                onChange={(e) => setField("delivery_fee_mmks", e.target.value)}
                className="field-input"
                placeholder={t(language, "Delivery Fee", "ပို့ဆောင်ခ")}
                title={t(language, "Delivery Fee", "ပို့ဆောင်ခ")}
              />
            </FieldBox>

            <FieldBox label={t(language, "Extra Weight", "အလေးချိန်ပိုကြေး")} error={fieldErrors.extra_weight_charges}>
              <input
                type="number"
                min="0"
                value={form.extra_weight_charges}
                onChange={(e) => setField("extra_weight_charges", e.target.value)}
                className="field-input"
                placeholder={t(language, "Extra Weight", "အလေးချိန်ပိုကြေး")}
                title={t(language, "Extra Weight", "အလေးချိန်ပိုကြေး")}
              />
            </FieldBox>

            <FieldBox label={t(language, "Insurance", "အာမခံ")} error={fieldErrors.insurance_fee_mmks}>
              <input
                type="number"
                min="0"
                value={form.insurance_fee_mmks}
                onChange={(e) => setField("insurance_fee_mmks", e.target.value)}
                className="field-input"
                placeholder={t(language, "Insurance", "အာမခံ")}
                title={t(language, "Insurance", "အာမခံ")}
              />
            </FieldBox>

            <FieldBox label={t(language, "Discount", "လျှော့ပေးငွေ")} error={fieldErrors.discount_mmks}>
              <input
                type="number"
                min="0"
                value={form.discount_mmks}
                onChange={(e) => setField("discount_mmks", e.target.value)}
                className="field-input"
                placeholder={t(language, "Discount", "လျှော့ပေးငွေ")}
                title={t(language, "Discount", "လျှော့ပေးငွေ")}
              />
            </FieldBox>

            <FieldBox label={t(language, "COD Amount", "COD ငွေပမာဏ")} error={fieldErrors.cod_amount_mmks}>
              <input
                type="number"
                min="0"
                value={form.cod_amount_mmks}
                onChange={(e) => setField("cod_amount_mmks", e.target.value)}
                className="field-input"
                disabled={form.payment_term !== "COD"}
                placeholder={t(language, "COD Amount", "COD ငွေပမာဏ")}
                title={t(language, "COD Amount", "COD ငွေပမာဏ")}
              />
            </FieldBox>

            <FieldBox label={t(language, "Internal Remark", "အတွင်းရေးမှတ်ချက်")} error={fieldErrors.internal_remark}>
              <input
                value={form.internal_remark}
                onChange={(e) => setField("internal_remark", e.target.value)}
                className="field-input"
                placeholder={t(language, "Optional operations note", "ရွေးချယ်ထည့်နိုင်သော operations note")}
                title={t(language, "Internal Remark", "အတွင်းရေးမှတ်ချက်")}
              />
            </FieldBox>
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <SectionCard
          title={t(language, "Dispatch & POD", "Dispatch နှင့် POD")}
          icon={<Printer size={18} />}
          description={t(
            language,
            "POD, vehicle, dispatch mode, SMS, and return behavior from managed config.",
            "POD, vehicle, dispatch mode, SMS နှင့် return behavior များကို managed config ဖြင့်အသုံးပြုပါ။",
          )}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FieldBox label={t(language, "POD Type", "POD အမျိုးအစား")} error={fieldErrors.pod_type}>
              <select
                value={form.pod_type}
                onChange={(e) => setField("pod_type", e.target.value)}
                className="field-input"
                title={t(language, "POD Type", "POD အမျိုးအစား")}
              >
                <option value="">{t(language, "Select", "ရွေးပါ")}</option>
                {meta.podTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FieldBox>

            <FieldBox label={t(language, "Dispatch Mode", "Dispatch Mode")} error={fieldErrors.dispatch_mode}>
              <select
                value={form.dispatch_mode}
                onChange={(e) => setField("dispatch_mode", e.target.value)}
                className="field-input"
                title={t(language, "Dispatch Mode", "Dispatch Mode")}
              >
                <option value="">{t(language, "Select", "ရွေးပါ")}</option>
                {meta.dispatchModes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FieldBox>

            <FieldBox label={t(language, "Preferred Vehicle", "ယာဉ်အမျိုးအစား")} error={fieldErrors.preferred_vehicle}>
              <select
                value={form.preferred_vehicle}
                onChange={(e) => setField("preferred_vehicle", e.target.value)}
                className="field-input"
                title={t(language, "Preferred Vehicle", "ယာဉ်အမျိုးအစား")}
              >
                <option value="">{t(language, "Select", "ရွေးပါ")}</option>
                {availableVehicles.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FieldBox>

            <div className="md:col-span-2 xl:col-span-3 grid gap-3">
              <ToggleRow
                label={t(language, "Contactless Delivery", "လူမတွေ့ဘဲပို့ဆောင်နိုင်သည်")}
                description={t(language, "Allow contactless delivery when appropriate.", "လိုအပ်သည့်အခါ contactless delivery ခွင့်ပြုပါ။")}
                checked={form.contactless_ok}
                onChange={(next) => setField("contactless_ok", next)}
              />
              <ToggleRow
                label={t(language, "Return If Failed", "မအောင်မြင်လျှင် ပြန်ပို့မည်")}
                description={t(language, "Trigger return workflow if delivery fails.", "ပို့ဆောင်မှုမအောင်မြင်လျှင် return workflow စတင်ပါ။")}
                checked={form.return_if_failed}
                onChange={(next) => setField("return_if_failed", next)}
              />
              <ToggleRow
                label={t(language, "Send Tracking SMS", "Tracking SMS ပို့မည်")}
                description={t(language, "Notify sender and recipient after creation.", "ဖန်တီးပြီးနောက် sender နှင့် recipient ကို အသိပေးပါ။")}
                checked={form.send_tracking_sms}
                onChange={(next) => setField("send_tracking_sms", next)}
              />
              <ToggleRow
                label={t(language, "Print Label After Create", "ဖန်တီးပြီးနောက် Label ထုတ်မည်")}
                description={t(language, "Open label/print URL after successful creation.", "ဖန်တီးပြီးနောက် label/print URL ကိုဖွင့်ပါ။")}
                checked={form.print_label_after_create}
                onChange={(next) => setField("print_label_after_create", next)}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={t(language, "Review & Save", "စစ်ဆေးပြီး သိမ်းဆည်းမည်")}
          icon={<AlertCircle size={18} />}
          description={t(
            language,
            "No demo fallback. Orders and drafts only succeed if the backend accepts them.",
            "Demo fallback မရှိပါ။ Backend လက်ခံမှသာ order နှင့် draft များ အောင်မြင်မည်။",
          )}
        >
          {fieldErrors.general ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {fieldErrors.general}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryTile
              label={t(language, "Service", "ဝန်ဆောင်မှု")}
              value={form.service_type || "-"}
            />
            <SummaryTile
              label={t(language, "Mode", "Mode")}
              value={deliveryMode}
            />
            <SummaryTile
              label={t(language, "Subtotal", "စုစုပေါင်းပို့ခ")}
              value={`${formatMoney(chargeSubtotal, locale)} Ks`}
            />
            <SummaryTile
              label={t(language, "Collectable", "ကောက်ခံရန်")}
              value={`${formatMoney(totalToCollect, locale)} Ks`}
            />
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            {t(
              language,
              "This page expects live backend endpoints: /api/v1/create-delivery/meta, /api/v1/create-delivery/drafts, and /api/v1/create-delivery/orders.",
              "ဤ page သည် live backend endpoint များဖြစ်သော /api/v1/create-delivery/meta, /api/v1/create-delivery/drafts, /api/v1/create-delivery/orders ကို မျှော်လင့်သည်။",
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <ActionButton
              onClick={() => void handleAction("draft")}
              disabled={loading}
              tone="secondary"
              icon={<Save size={16} />}
              label={
                loadingAction === "draft"
                  ? t(language, "Saving...", "သိမ်းနေသည်...")
                  : t(language, "Save Draft", "Draft သိမ်းမည်")
              }
            />
            <ActionButton
              onClick={() => void handleAction("submit")}
              disabled={loading}
              tone="primary"
              icon={<Truck size={16} />}
              label={
                loadingAction === "submit"
                  ? t(language, "Creating...", "ဖန်တီးနေသည်...")
                  : t(language, "Create Order", "Order ဖန်တီးမည်")
              }
            />
            {printAllowed ? (
              <ActionButton
                onClick={() => void handleAction("print")}
                disabled={loading}
                tone="secondary"
                icon={<Printer size={16} />}
                label={
                  loadingAction === "print"
                    ? t(language, "Creating...", "ဖန်တီးနေသည်...")
                    : t(language, "Create & Print", "ဖန်တီးပြီး ထုတ်မည်")
                }
              />
            ) : null}
          </div>
        </SectionCard>
      </div>

      {(loadingMeta || loading) ? (
        <div className="pointer-events-none fixed bottom-6 right-6 rounded-full bg-[#0d2c54] px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-lg">
          {loading ? "Saving create-delivery..." : "Syncing create-delivery metadata..."}
        </div>
      ) : null}

      <style>{`
        .field-input {
          width: 100%;
          height: 48px;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0 1rem;
          font-size: 0.875rem;
          color: rgb(15 23 42);
          outline: none;
        }

        .field-input:focus {
          border-color: rgba(13, 44, 84, 0.45);
          box-shadow: 0 0 0 4px rgba(13, 44, 84, 0.08);
        }

        .field-input:disabled {
          background: rgb(241 245 249);
          color: rgb(148 163 184);
          cursor: not-allowed;
        }

        .field-textarea {
          width: 100%;
          min-height: 96px;
          resize: none;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.875rem 1rem;
          font-size: 0.875rem;
          color: rgb(15 23 42);
          outline: none;
        }

        .field-textarea:focus {
          border-color: rgba(13, 44, 84, 0.45);
          box-shadow: 0 0 0 4px rgba(13, 44, 84, 0.08);
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

function SegmentedMode({
  value,
  onChange,
  language,
}: {
  value: DeliveryMode;
  onChange: (value: DeliveryMode) => void;
  language: UiLanguage;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <button
        type="button"
        onClick={() => onChange("pickup_delivery")}
        className={`rounded-xl px-3 py-2 text-sm font-semibold ${
          value === "pickup_delivery"
            ? "bg-[#0d2c54] text-white"
            : "bg-slate-50 text-slate-600 hover:bg-slate-100"
        }`}
      >
        {t(language, "Pickup & Delivery", "လာယူပို့ဆောင်ခြင်း")}
      </button>
      <button
        type="button"
        onClick={() => onChange("office_to_office")}
        className={`rounded-xl px-3 py-2 text-sm font-semibold ${
          value === "office_to_office"
            ? "bg-[#0d2c54] text-white"
            : "bg-slate-50 text-slate-600 hover:bg-slate-100"
        }`}
      >
        {t(language, "Office to Office", "ရုံးမှရုံးသို့")}
      </button>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-4 border-b border-slate-200 pb-4">
        <div className="rounded-2xl bg-slate-50 p-3 text-[#0d2c54]">{icon}</div>
        <div>
          <h2 className="text-lg font-black text-[#0d2c54]">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function FieldBox({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
          {label}
        </label>
        {error ? <span className="text-xs font-bold text-rose-500">{error}</span> : null}
      </div>
      {children}
    </div>
  );
}

function InputWithIcon({
  value,
  onChange,
  placeholder,
  icon,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      {icon ? <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">{icon}</div> : null}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`field-input ${icon ? "pl-11" : ""}`}
      />
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left hover:bg-slate-100"
    >
      <div>
        <div className="font-bold text-[#0d2c54]">{label}</div>
        <div className="mt-1 text-sm text-slate-500">{description}</div>
      </div>
      <span
        className={`relative flex h-7 w-12 items-center rounded-full p-1 transition ${
          checked ? "bg-[#ffd700]" : "bg-slate-300"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </span>
    </button>
  );
}

function StatCard({
  icon,
  title,
  value,
  accent = "default",
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  accent?: "default" | "amber" | "sky" | "emerald";
}) {
  const iconClass =
    accent === "amber"
      ? "text-amber-500"
      : accent === "sky"
        ? "text-sky-500"
        : accent === "emerald"
          ? "text-emerald-500"
          : "text-[#0d2c54]";

  const valueClass =
    accent === "amber"
      ? "text-amber-600"
      : accent === "sky"
        ? "text-sky-600"
        : accent === "emerald"
          ? "text-emerald-600"
          : "text-slate-800";

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      {React.createElement(icon, { size: 24, className: iconClass })}
      <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className={`mt-4 text-3xl font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

function SummaryTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 font-black text-[#0d2c54]">{value}</div>
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  tone,
  icon,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  tone: "primary" | "secondary";
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50 ${
        tone === "primary"
          ? "bg-[#ffd700] text-[#0d2c54] shadow-[0_18px_40px_rgba(255,215,0,0.26)]"
          : "border border-slate-200 bg-white text-slate-700 shadow-sm"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}