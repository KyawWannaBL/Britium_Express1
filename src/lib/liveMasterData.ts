import { supabase } from "@/lib/supabase/client";
import { merchantMaster as fallbackMerchantMaster, type MerchantMaster, type PaymentMethod } from "@/lib/enterpriseWorkflow";

export type LiveMasterVehicle = {
  id: string;
  fleetId: string;
  label: string;
  type: string;
  licenseNo: string;
  capacityKg: number;
  assignedZone: string;
  status: "Available" | "Assigned" | "Maintenance";
};

export type LiveMasterPerson = {
  id: string;
  name: string;
  role: "Rider" | "Driver" | "Helper" | "Employee";
  assignedZone: string;
  status: "Available" | "Assigned";
};

export type LiveMasterSnapshot = {
  merchants: MerchantMaster[];
  vehicles: LiveMasterVehicle[];
  riders: LiveMasterPerson[];
  drivers: LiveMasterPerson[];
  helpers: LiveMasterPerson[];
  employees: LiveMasterPerson[];
  loadedFrom: string[];
};

export const fallbackVehicles: LiveMasterVehicle[] = [
  { id: "VEH-001", fleetId: "FLT-YGN-001", label: "Car", type: "Car", licenseNo: "YGN-2Q-6524", capacityKg: 350, assignedZone: "South Okkalapa", status: "Available" },
  { id: "VEH-002", fleetId: "FLT-YGN-002", label: "Mini Truck", type: "Mini Truck", licenseNo: "YGN-7B-6382", capacityKg: 1200, assignedZone: "East Dagon", status: "Available" },
  { id: "VEH-003", fleetId: "FLT-PARTNER-001", label: "Partner Vehicle", type: "Partner Vehicle", licenseNo: "YGN-5A-1745", capacityKg: 800, assignedZone: "Hlaing", status: "Available" },
];

export const fallbackPeople: LiveMasterPerson[] = [
  { id: "RD-001", name: "Rider Team 1", role: "Rider", assignedZone: "South Okkalapa", status: "Available" },
  { id: "DR-001", name: "Driver Team 1", role: "Driver", assignedZone: "East Dagon", status: "Available" },
  { id: "HP-001", name: "Helper Team 1", role: "Helper", assignedZone: "Hlaing", status: "Available" },
];

const SCHEMA_FIELD_NAMES = new Set([
  "merchant_id",
  "merchant_code",
  "merchant_name",
  "address_line_1",
  "phone_primary",
  "phone_secondary",
  "preferred_delivery_instruction",
  "capacity_kg",
  "assigned_zone",
  "license_no",
  "fleet_id",
  "status",
]);

function text(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function numberValue(...values: unknown[]) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function isSchemaField(value: string) {
  const normalized = value.trim().toLowerCase();
  return SCHEMA_FIELD_NAMES.has(normalized) || /^[a-z0-9]+(_[a-z0-9]+)+$/.test(normalized);
}

function asPaymentMethod(value: unknown): PaymentMethod {
  const normalized = text(value).toLowerCase();
  if (normalized.includes("prepaid")) return "Prepaid";
  if (normalized.includes("account")) return "Account";
  if (normalized.includes("collect") || normalized.includes("recipient")) return "Collect";
  if (normalized.includes("internal")) return "Internal";
  return "COD";
}

function asVehicleStatus(value: unknown): LiveMasterVehicle["status"] {
  const normalized = text(value).toLowerCase();
  if (normalized.includes("assign")) return "Assigned";
  if (normalized.includes("maint")) return "Maintenance";
  return "Available";
}

function asPersonStatus(value: unknown): LiveMasterPerson["status"] {
  return text(value).toLowerCase().includes("assign") ? "Assigned" : "Available";
}

function rowValue(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && text(row[key])) return row[key];
    const lower = key.toLowerCase();
    const foundKey = Object.keys(row).find((candidate) => candidate.toLowerCase() === lower);
    if (foundKey && text(row[foundKey])) return row[foundKey];
  }
  return "";
}

function normalizeMerchant(row: Record<string, unknown>): MerchantMaster | null {
  const code = text(rowValue(row, "merchant_code", "MERCHANT_CODE", "code", "merchantCode", "customer_code")).toUpperCase();
  const id = text(rowValue(row, "merchant_id", "MERCHANT_ID", "id", "account_id", "customer_id"), code);
  const name = text(rowValue(row, "merchant_name", "MERCHANT_NAME", "name", "business_name", "account_name"));
  const phone = text(rowValue(row, "phone_primary", "PHONE_PRIMARY", "phone", "primary_phone", "sender_phone"));
  const contactPerson = text(rowValue(row, "contact_person", "CONTACT_PERSON", "contact", "contactPerson"));
  const pickupAddress = text(rowValue(row, "address_line_1", "ADDRESS_LINE_1", "address_mm", "ADDRESS_MM", "pickup_address", "address"));
  const pickupTownship = text(rowValue(row, "township", "TOWNSHIP", "pickup_township"));
  const pickupCity = text(rowValue(row, "city", "CITY", "pickup_city"), "Yangon");

  if (!id || !code || !name) return null;
  if ([id, code, name].some(isSchemaField)) return null;

  return {
    id,
    name,
    code: code.slice(0, 3).padEnd(3, "X"),
    phone,
    contactPerson: contactPerson || name,
    pickupAddress,
    pickupTownship,
    pickupCity,
    defaultPickupTime: text(rowValue(row, "pickup_time", "default_pickup_time", "defaultPickupTime", "preferred_pickup_time"), "10:00 AM - 12:00 PM"),
    paymentMethod: asPaymentMethod(rowValue(row, "payment_method", "paymentMethod", "payment_profile")),
    tariffProfile: text(rowValue(row, "tariff_profile", "tariff", "service_profile"), "Master tariff"),
    billingProfile: text(rowValue(row, "billing_profile", "billingProfile", "payment_profile"), "Master billing"),
  };
}

function normalizeVehicle(row: Record<string, unknown>): LiveMasterVehicle | null {
  const id = text(rowValue(row, "id", "vehicle_id", "fleet_id", "fleetId"));
  const fleetId = text(rowValue(row, "fleet_id", "fleetId", "fleet_no"), id);
  const licenseNo = text(rowValue(row, "license_no", "licenseNo", "plate_no", "registration_no"));
  const type = text(rowValue(row, "vehicle_type", "vehicleType", "type", "category", "label", "name"));
  const label = text(rowValue(row, "label", "vehicle_name", "vehicleName", "name"), type, fleetId, id);
  const assignedZone = text(rowValue(row, "assigned_zone", "assignedZone", "route_zone", "zone", "region"), "Unassigned Zone");

  if (!id || (!label && !licenseNo && !fleetId)) return null;
  if ([id, fleetId, licenseNo, type, label].filter(Boolean).some(isSchemaField) && !licenseNo) return null;

  return {
    id,
    fleetId,
    label,
    type: type || label || "Vehicle",
    licenseNo: licenseNo || "No license recorded",
    capacityKg: numberValue(rowValue(row, "capacity_kg", "capacityKg", "capacity")),
    assignedZone,
    status: asVehicleStatus(rowValue(row, "status", "availability_status", "availability")),
  };
}

function normalizePerson(row: Record<string, unknown>, role: LiveMasterPerson["role"]): LiveMasterPerson | null {
  const id = text(rowValue(row, "id", "profile_id", "employee_id", "staff_id", "user_id", "rider_id", "driver_id", "helper_id"));
  const name = text(rowValue(row, "full_name", "fullName", "display_name", "displayName", "name", "employee_name"));
  const assignedZone = text(rowValue(row, "assigned_zone", "assignedZone", "route_zone", "routeZone", "zone"), "Unassigned Zone");

  if (!id || !name || isSchemaField(name)) return null;
  return { id, name, role, assignedZone, status: asPersonStatus(rowValue(row, "status", "availability")) };
}

function arraysFromStorageValue(value: unknown, keyHint = ""): Array<{ key: string; rows: Record<string, unknown>[] }> {
  const found: Array<{ key: string; rows: Record<string, unknown>[] }> = [];
  if (Array.isArray(value)) {
    if (value.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
      found.push({ key: keyHint, rows: value as Record<string, unknown>[] });
    }
    return found;
  }

  if (!value || typeof value !== "object") return found;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    found.push(...arraysFromStorageValue(child, key));
  }
  return found;
}

function readBrowserRows() {
  const empty: Record<string, Record<string, unknown>[]> = {};
  if (typeof window === "undefined" || !window.localStorage) return empty;

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const storageKey = window.localStorage.key(index);
    if (!storageKey) continue;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw || (!storageKey.toLowerCase().includes("master") && !raw.toLowerCase().includes("merchant"))) continue;
      const parsed = JSON.parse(raw);
      for (const item of arraysFromStorageValue(parsed, storageKey)) {
        const key = item.key.toLowerCase();
        empty[key] = [...(empty[key] ?? []), ...item.rows];
      }
    } catch {
      // Ignore unrelated storage values.
    }
  }
  return empty;
}

async function tableRows(table: string) {
  try {
    const { data, error } = await supabase.from(table).select("*").limit(1000);
    return !error && Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

function uniqueBy<T>(rows: T[], getKey: (row: T) => string) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = getKey(row).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function pickRows(bucket: Record<string, Record<string, unknown>[]>, words: string[]) {
  return Object.entries(bucket)
    .filter(([key]) => words.some((word) => key.includes(word)))
    .flatMap(([, rows]) => rows);
}

export async function loadLiveMasterDataSnapshot(): Promise<LiveMasterSnapshot> {
  const browser = readBrowserRows();
  const backend = {
    merchant: [
      ...(await tableRows("merchant_master")),
      ...(await tableRows("merchants")),
      ...(await tableRows("customers")),
    ],
    vehicle: [
      ...(await tableRows("vehicle_master")),
      ...(await tableRows("vehicles")),
      ...(await tableRows("fleet_vehicles")),
    ],
    rider: [
      ...(await tableRows("rider_master")),
      ...(await tableRows("riders")),
      ...(await tableRows("deliverymen")),
    ],
    driver: [
      ...(await tableRows("driver_master")),
      ...(await tableRows("drivers")),
    ],
    helper: [
      ...(await tableRows("helper_master")),
      ...(await tableRows("helpers")),
    ],
    employee: [
      ...(await tableRows("employee_master")),
      ...(await tableRows("employees")),
      ...(await tableRows("staff_profiles")),
    ],
  };

  const merchants = uniqueBy([
    ...pickRows(browser, ["merchant"]),
    ...backend.merchant,
  ].map(normalizeMerchant).filter(Boolean) as MerchantMaster[], (row) => row.id || row.code);

  const vehicles = uniqueBy([
    ...pickRows(browser, ["vehicle", "fleet"]),
    ...backend.vehicle,
  ].map(normalizeVehicle).filter(Boolean) as LiveMasterVehicle[], (row) => row.id || row.fleetId);

  const riders = uniqueBy([
    ...pickRows(browser, ["rider"]),
    ...backend.rider,
  ].map((row) => normalizePerson(row, "Rider")).filter(Boolean) as LiveMasterPerson[], (row) => row.id);

  const drivers = uniqueBy([
    ...pickRows(browser, ["driver"]),
    ...backend.driver,
  ].map((row) => normalizePerson(row, "Driver")).filter(Boolean) as LiveMasterPerson[], (row) => row.id);

  const helpers = uniqueBy([
    ...pickRows(browser, ["helper"]),
    ...backend.helper,
  ].map((row) => normalizePerson(row, "Helper")).filter(Boolean) as LiveMasterPerson[], (row) => row.id);

  const employees = uniqueBy([
    ...pickRows(browser, ["employee", "staff"]),
    ...backend.employee,
  ].map((row) => normalizePerson(row, "Employee")).filter(Boolean) as LiveMasterPerson[], (row) => row.id);

  return {
    merchants: merchants.length ? merchants : fallbackMerchantMaster,
    vehicles: vehicles.length ? vehicles : fallbackVehicles,
    riders,
    drivers,
    helpers: helpers.length ? helpers : fallbackPeople.filter((person) => person.role === "Helper"),
    employees,
    loadedFrom: [
      ...Object.keys(browser).map((key) => `browser:${key}`),
      "backend:merchant_master",
      "backend:vehicle_master",
      "backend:rider_master",
      "backend:driver_master",
      "backend:helper_master",
      "backend:employee_master",
    ],
  };
}
