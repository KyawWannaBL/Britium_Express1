// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Truck,
  UserCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type AnyRow = Record<string, any>;
type WorkerRole = "RIDER" | "DRIVER" | "HELPER";

type PickupQueueItem = {
  id: string;
  pickup_id: string;
  request_code: string;
  pickup_way_id: string;
  waybill_no?: string;
  merchant_code?: string;
  merchant_name?: string;
  pickup_address?: string;
  pickup_township?: string;
  city?: string;
  branch_code?: string;
  parcel_count?: number;
  pickup_date?: string;
  vehicle_type?: string;
  status?: string;
  pickup_status?: string;
  workflow_stage?: string;
  supervisor_status?: string;
  rider_status?: string;
  assigned_rider_email?: string;
  assigned_driver_email?: string;
  assigned_helper_email?: string;
  assigned_rider_code?: string;
  assigned_driver_code?: string;
  assigned_helper_code?: string;
  assigned_vehicle_id?: string;
  has_unread_notification?: boolean;
  created_at?: string;
  raw: AnyRow;
};

type WorkforceOption = {
  id: string;
  code: string;
  email: string;
  name: string;
  role: WorkerRole;
  status?: string;
  branch_code?: string;
  zone?: string;
  phone?: string;
  raw: AnyRow;
};

type FleetOption = {
  id: string;
  vehicle_no: string;
  vehicle_type?: string;
  status?: string;
  branch_code?: string;
  raw: AnyRow;
};

type MasterData = {
  riders: WorkforceOption[];
  drivers: WorkforceOption[];
  helpers: WorkforceOption[];
  fleets: FleetOption[];
};

type Message = {
  tone: "info" | "success" | "warning" | "error";
  text: string;
};

const emptyMaster: MasterData = { riders: [], drivers: [], helpers: [], fleets: [] };
const NOTE_LIMIT = 500;
const ASSIGNABLE_STATUSES = new Set(["", "PENDING", "PICKUP_REQUESTED", "ASSIGNED_TO_SUPERVISOR", "PENDING_ASSIGNMENT"]);

function text(value: any, fallback = "") {
  const result = String(value ?? "").trim();
  return result || fallback;
}

function lower(value: any) {
  return text(value).toLowerCase();
}

function isUuid(value: any) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text(value));
}

function readRows(value: any): AnyRow[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.queue)) return value.queue;
  if (Array.isArray(value?.pickups)) return value.pickups;
  if (Array.isArray(value?.pickup_requests)) return value.pickup_requests;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

async function rpc<T = any>(name: string, params?: AnyRow): Promise<T> {
  const { data, error } = await (supabase as any).rpc(name, params || {});
  if (error) throw error;
  return data as T;
}

async function tableRows(tableName: string, limit = 500): Promise<AnyRow[]> {
  try {
    const { data, error } = await (supabase as any).from(tableName).select("*").limit(limit);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function normalizePickup(row: AnyRow): PickupQueueItem {
  const pickupId = text(row.pickup_id || row.pickup_code || row.pickup_request_id || row.request_code || row.id);
  const requestCode = text(row.request_code || row.pickup_request_code || row.pickup_id || pickupId);
  const pickupWayId = text(row.pickup_way_id || row.pickup_waybill_id || row.waybill_no || pickupId);

  return {
    id: text(row.id || pickupId || requestCode),
    pickup_id: pickupId,
    request_code: requestCode,
    pickup_way_id: pickupWayId,
    waybill_no: text(row.waybill_no),
    merchant_code: text(row.merchant_code),
    merchant_name: text(row.merchant_name || row.customer_name || row.contact_person || row.sender_name),
    pickup_address: text(row.pickup_address || row.address || row.default_pickup_address || row.sender_address),
    pickup_township: text(row.pickup_township || row.township || row.zone),
    city: text(row.pickup_city || row.city),
    branch_code: text(row.branch_code || row.origin_branch_code),
    parcel_count: Number(row.parcel_count || row.expected_parcels || row.total_parcels || row.qty || 1),
    pickup_date: text(row.pickup_date || row.requested_pickup_date || row.created_at),
    vehicle_type: text(row.vehicle_type || row.vehicle_required),
    status: text(row.status || row.pickup_status || row.supervisor_status),
    pickup_status: text(row.pickup_status || row.status),
    workflow_stage: text(row.workflow_stage),
    supervisor_status: text(row.supervisor_status),
    rider_status: text(row.rider_status),
    assigned_rider_email: text(row.assigned_rider_email),
    assigned_driver_email: text(row.assigned_driver_email),
    assigned_helper_email: text(row.assigned_helper_email),
    assigned_rider_code: text(row.assigned_rider_code),
    assigned_driver_code: text(row.assigned_driver_code),
    assigned_helper_code: text(row.assigned_helper_code),
    assigned_vehicle_id: text(row.assigned_vehicle_id || row.assigned_fleet_id),
    has_unread_notification: Boolean(row.has_unread_notification),
    created_at: text(row.created_at),
    raw: row,
  };
}

function normalizeWorker(row: AnyRow, fallbackRole: WorkerRole = "RIDER"): WorkforceOption | null {
  const rawRole = text(row.role || row.workforce_role || row.employee_type || row.staff_type || fallbackRole).toUpperCase();
  const role: WorkerRole = rawRole.includes("DRIVER") ? "DRIVER" : rawRole.includes("HELPER") ? "HELPER" : "RIDER";
  const code = text(row.workforce_code || row.rider_code || row.driver_code || row.helper_code || row.employee_code || row.rider_id || row.driver_id || row.helper_id || row.code || row.id);
  const email = text(row.email || row.user_email || row.login_email || row.auth_email);
  const name = text(row.full_name || row.display_name || row.rider_name || row.driver_name || row.helper_name || row.employee_name || row.name || email || code);

  if (!code && !email) return null;

  return {
    id: text(row.id || row.profile_id || row.employee_id || code || email),
    code: code || email,
    email,
    name,
    role,
    status: text(row.status || row.record_status || row.availability_status || (row.is_active === false ? "Inactive" : "Active")),
    branch_code: text(row.branch_code),
    zone: text(row.assigned_zone || row.route_zone || row.zone),
    phone: text(row.phone_primary || row.phone || row.mobile),
    raw: row,
  };
}

function normalizeFleet(row: AnyRow): FleetOption | null {
  const id = text(row.id || row.fleet_id || row.vehicle_id || row.code || row.vehicle_no);
  const vehicleNo = text(row.vehicle_no || row.plate || row.plate_no || row.vehicle_plate || row.registration_no || row.license_no || id);

  if (!id && !vehicleNo) return null;

  return {
    id: id || vehicleNo,
    vehicle_no: vehicleNo,
    vehicle_type: text(row.vehicle_type || row.type || row.category),
    status: text(row.status || row.fleet_status || row.availability_status || (row.is_active === false ? "Inactive" : "Available")),
    branch_code: text(row.branch_code),
    raw: row,
  };
}

function isActive(status: any) {
  return !["INACTIVE", "SUSPENDED", "BLACKLISTED", "MAINTENANCE", "UNAVAILABLE", "DELETED", "TERMINATED"].includes(text(status).toUpperCase());
}

function dedupeBy<T>(rows: T[], keyFn: (row: T) => string) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = keyFn(row).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function workerValue(worker: WorkforceOption) {
  return worker.email || worker.code || worker.id;
}

function workerLabel(worker: WorkforceOption) {
  return [worker.code, worker.name, worker.email, worker.phone].filter(Boolean).join(" - ");
}

function fleetLabel(fleet: FleetOption) {
  return [fleet.vehicle_no, fleet.vehicle_type, fleet.branch_code].filter(Boolean).join(" - ");
}

function sameBranchOrAny(masterBranch?: string, pickupBranch?: string) {
  if (!masterBranch || !pickupBranch) return true;
  return masterBranch.toUpperCase() === pickupBranch.toUpperCase();
}

function pickupKey(row: PickupQueueItem | null) {
  return row?.pickup_id || row?.request_code || row?.id || "";
}

function statusText(row: PickupQueueItem) {
  return text(row.supervisor_status || row.pickup_status || row.status || row.workflow_stage || "PICKUP_REQUESTED").replace(/_/g, " ");
}

async function getActorEmail() {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.email || "supervisor@britiumexpress.com";
  } catch {
    return "supervisor@britiumexpress.com";
  }
}

async function loadQueue(): Promise<PickupQueueItem[]> {
  const loaders = [
    async () => readRows(await rpc("be_supervisor_assignment_snapshot")),
    async () => readRows(await rpc("be_supervisor_pending_pickup_requests")),
    async () => tableRows("be_v_supervisor_pickup_queue", 200),
    async () => tableRows("be_portal_pickup_requests", 200),
  ];

  for (const load of loaders) {
    try {
      const rows = await load();
      if (rows.length) return rows.map(normalizePickup);
    } catch {
      // Try the next supported production source.
    }
  }

  return [];
}

async function loadMasterData(): Promise<MasterData> {
  let workforceRows: AnyRow[] = [];
  let fleetRows: AnyRow[] = [];

  try {
    const snapshot: any = await rpc("be_operational_master_snapshot");
    workforceRows = [
      ...(snapshot?.workforce || []),
      ...(snapshot?.workforce_accounts || []),
      ...(snapshot?.riders || []).map((row: AnyRow) => ({ ...row, role: "RIDER" })),
      ...(snapshot?.drivers || []).map((row: AnyRow) => ({ ...row, role: "DRIVER" })),
      ...(snapshot?.helpers || []).map((row: AnyRow) => ({ ...row, role: "HELPER" })),
    ];
    fleetRows = [...(snapshot?.fleets || []), ...(snapshot?.vehicles || [])];
  } catch {
    // Older deployments may not have the consolidated master snapshot RPC.
  }

  if (!workforceRows.length) {
    workforceRows = await tableRows("be_mobile_workforce_accounts", 500);
  }

  if (!workforceRows.length) {
    try {
      const fallback: any = await rpc("be_master_data_page_snapshot");
      workforceRows = [
        ...(fallback?.workforce || []),
        ...(fallback?.workforce_accounts || []),
        ...(fallback?.riders || []).map((row: AnyRow) => ({ ...row, role: "RIDER" })),
        ...(fallback?.drivers || []).map((row: AnyRow) => ({ ...row, role: "DRIVER" })),
        ...(fallback?.helpers || []).map((row: AnyRow) => ({ ...row, role: "HELPER" })),
        ...(fallback?.Rider_Master || []).map((row: AnyRow) => ({ ...row, role: "RIDER" })),
        ...(fallback?.Driver_Master || []).map((row: AnyRow) => ({ ...row, role: "DRIVER" })),
        ...(fallback?.Helper_Master || []).map((row: AnyRow) => ({ ...row, role: "HELPER" })),
      ];
      fleetRows = fleetRows.length ? fleetRows : [...(fallback?.fleets || []), ...(fallback?.vehicles || []), ...(fallback?.Fleet_Master || [])];
    } catch {
      // Keep empty arrays. The UI will show a go-live check error for missing riders.
    }
  }

  if (!fleetRows.length) {
    for (const table of ["be_fleet_master", "be_fleet_vehicles", "fleet_master", "vehicle_master", "vehicles", "fleet_vehicles"]) {
      const rows = await tableRows(table, 500);
      if (rows.length) {
        fleetRows = rows;
        break;
      }
    }
  }

  const workers = dedupeBy(
    workforceRows.map((row) => normalizeWorker(row)).filter(Boolean) as WorkforceOption[],
    (row) => row.email || row.code || row.id,
  ).filter((row) => isActive(row.status));

  return {
    riders: workers.filter((row) => row.role === "RIDER"),
    drivers: workers.filter((row) => row.role === "DRIVER"),
    helpers: workers.filter((row) => row.role === "HELPER"),
    fleets: dedupeBy(fleetRows.map(normalizeFleet).filter(Boolean) as FleetOption[], (row) => row.id || row.vehicle_no).filter((row) => isActive(row.status)),
  };
}

async function assignPickup(params: {
  pickup: PickupQueueItem;
  rider: WorkforceOption;
  driver?: WorkforceOption | null;
  helper?: WorkforceOption | null;
  fleet?: FleetOption | null;
  note: string;
}) {
  const requestCode = params.pickup.request_code || params.pickup.pickup_id;
  const pickupId = params.pickup.pickup_id || params.pickup.id;
  const riderCode = params.rider.code;
  const riderId = params.rider.id;
  const vehicleId = params.fleet?.id && isUuid(params.fleet.id) ? params.fleet.id : null;
  const actorEmail = await getActorEmail();
  const note = params.note.trim() || null;

  if (riderCode) {
    try {
      return await rpc("be_assign_pickup_request_by_rider_code", {
        p_request_code: requestCode,
        p_rider_code: riderCode,
        p_assigned_vehicle_id: vehicleId,
        p_assignment_note: note,
        p_actor_registry_id: null,
      });
    } catch (error: any) {
      if (error?.code !== "42883" && !/does not exist/i.test(error?.message || "")) throw error;
    }
  }

  if (riderId && isUuid(riderId)) {
    try {
      return await rpc("be_assign_pickup_request_to_driver", {
        p_request_code: requestCode,
        p_assigned_rider_id: riderId,
        p_assigned_vehicle_id: vehicleId,
        p_assignment_note: note,
        p_actor_registry_id: null,
      });
    } catch (error: any) {
      if (error?.code !== "42883" && !/does not exist/i.test(error?.message || "")) throw error;
    }
  }

  try {
    return await rpc("be_supervisor_assign_pickup", {
      p_pickup_id: pickupId,
      p_rider_email: params.rider.email || params.rider.code,
      p_driver_email: params.driver?.email || params.driver?.code || null,
      p_helper_email: params.helper?.email || params.helper?.code || null,
      p_vehicle_id: params.fleet?.id || null,
      p_actor_email: actorEmail,
    });
  } catch (error: any) {
    if (error?.code !== "42883" && !/does not exist/i.test(error?.message || "")) throw error;
  }

  return await rpc("be_assign_pickup_field_team", {
    p_pickup_id: pickupId || requestCode,
    p_rider_code: riderCode || null,
    p_driver_code: params.driver?.code || null,
    p_helper_code: params.helper?.code || null,
    p_vehicle_plate: params.fleet?.vehicle_no || params.fleet?.id || null,
    p_supervisor_note: note,
  });
}

async function markNotificationRead(pickupId: string) {
  try {
    await (supabase as any)
      .from("be_app_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("recipient_role", "supervisor")
      .eq("notification_type", "PICKUP_REQUESTED")
      .eq("pickup_id", pickupId);
  } catch {
    // Notification acknowledgement must never block pickup assignment.
  }
}

function fieldIssue(label: string, ok: boolean, detail: string, warn = false) {
  return { label, detail, tone: ok ? "success" : warn ? "warning" : "error" } as const;
}

export default function SupervisorPortal() {
  const [queue, setQueue] = useState<PickupQueueItem[]>([]);
  const [master, setMaster] = useState<MasterData>(emptyMaster);
  const [selectedId, setSelectedId] = useState("");
  const [selectedRider, setSelectedRider] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedHelper, setSelectedHelper] = useState("");
  const [selectedFleet, setSelectedFleet] = useState("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [message, setMessage] = useState<Message>({ tone: "info", text: "Sync the live pickup queue to begin assignment." });

  const selectedPickup = useMemo(() => queue.find((item) => pickupKey(item) === selectedId || item.id === selectedId) || queue[0] || null, [queue, selectedId]);
  const selectedRiderRecord = useMemo(() => master.riders.find((row) => workerValue(row) === selectedRider) || null, [master.riders, selectedRider]);
  const selectedDriverRecord = useMemo(() => master.drivers.find((row) => workerValue(row) === selectedDriver) || null, [master.drivers, selectedDriver]);
  const selectedHelperRecord = useMemo(() => master.helpers.find((row) => workerValue(row) === selectedHelper) || null, [master.helpers, selectedHelper]);
  const selectedFleetRecord = useMemo(() => master.fleets.find((row) => row.id === selectedFleet || row.vehicle_no === selectedFleet) || null, [master.fleets, selectedFleet]);

  const eligibleRiders = useMemo(() => master.riders.filter((row) => sameBranchOrAny(row.branch_code, selectedPickup?.branch_code)), [master.riders, selectedPickup]);
  const eligibleDrivers = useMemo(() => master.drivers.filter((row) => sameBranchOrAny(row.branch_code, selectedPickup?.branch_code)), [master.drivers, selectedPickup]);
  const eligibleHelpers = useMemo(() => master.helpers.filter((row) => sameBranchOrAny(row.branch_code, selectedPickup?.branch_code)), [master.helpers, selectedPickup]);
  const eligibleFleets = useMemo(
    () => master.fleets.filter((row) => sameBranchOrAny(row.branch_code, selectedPickup?.branch_code) && (!selectedPickup?.vehicle_type || !row.vehicle_type || lower(row.vehicle_type) === lower(selectedPickup.vehicle_type))),
    [master.fleets, selectedPickup],
  );

  const filteredQueue = useMemo(() => {
    const q = lower(search);
    if (!q) return queue;
    return queue.filter((item) =>
      [
        item.pickup_id,
        item.request_code,
        item.pickup_way_id,
        item.waybill_no,
        item.merchant_code,
        item.merchant_name,
        item.pickup_address,
        item.pickup_township,
        item.city,
        item.branch_code,
        item.status,
        item.pickup_status,
        item.workflow_stage,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [queue, search]);

  const checks = useMemo(() => {
    const status = text(selectedPickup?.supervisor_status || selectedPickup?.pickup_status || selectedPickup?.status).toUpperCase();
    return [
      fieldIssue("Pickup selected", Boolean(selectedPickup?.pickup_id), selectedPickup?.pickup_id || "Select a pickup request."),
      fieldIssue("Request code", Boolean(selectedPickup?.request_code), selectedPickup?.request_code || "Missing request code; assignment RPC cannot identify the request."),
      fieldIssue("Rider selected", Boolean(selectedRiderRecord), selectedRiderRecord ? workerLabel(selectedRiderRecord) : "Rider is required for go-live assignment."),
      fieldIssue("Rider master", master.riders.length > 0, `${master.riders.length} active rider(s) loaded.`),
      fieldIssue("Fleet master", master.fleets.length > 0, master.fleets.length ? `${master.fleets.length} fleet record(s) loaded.` : "Fleet is optional, but no fleet master rows loaded.", true),
      fieldIssue("Note length", note.length <= NOTE_LIMIT, `${note.length}/${NOTE_LIMIT}`),
      fieldIssue("Assignable status", ASSIGNABLE_STATUSES.has(status), status ? `${status.replace(/_/g, " ")}` : "No status provided; treating as assignable.", !ASSIGNABLE_STATUSES.has(status)),
    ];
  }, [master.fleets.length, master.riders.length, note.length, selectedPickup, selectedRiderRecord]);

  const blockingError = checks.some((item) => item.tone === "error");
  const pendingCount = queue.filter((item) => ASSIGNABLE_STATUSES.has(text(item.supervisor_status || item.pickup_status || item.status).toUpperCase())).length;
  const assignedCount = queue.filter((item) => ["ASSIGNED", "RIDER_ASSIGNED", "ASSIGNED_TO_DRIVER"].includes(text(item.supervisor_status || item.pickup_status || item.status).toUpperCase())).length;
  const unreadCount = queue.filter((item) => item.has_unread_notification).length;

  const loadData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setMessage({ tone: "info", text: "Synchronizing supervisor pickup queue..." });

    try {
      const [nextQueue, nextMaster] = await Promise.all([loadQueue(), loadMasterData()]);
      setQueue(nextQueue);
      setMaster(nextMaster);
      setLastSyncAt(new Date());

      if (nextQueue.length) {
        setSelectedId((current) => (nextQueue.some((item) => pickupKey(item) === current || item.id === current) ? current : pickupKey(nextQueue[0])));
      } else {
        setSelectedId("");
      }

      setMessage({
        tone: "success",
        text: `Synced ${nextQueue.length} pickup(s), ${nextMaster.riders.length} rider(s), ${nextMaster.drivers.length} driver(s), ${nextMaster.helpers.length} helper(s), and ${nextMaster.fleets.length} fleet item(s).`,
      });
    } catch (error: any) {
      setMessage({ tone: "error", text: error?.message || error?.details || "Unable to synchronize supervisor portal." });
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();

    const reload = () => void loadData(false);
    const channel = supabase
      .channel("supervisor-portal-live-pickup-assignment")
      .on("postgres_changes", { event: "*", schema: "public", table: "be_portal_pickup_requests" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "be_app_notifications" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "be_mobile_workforce_accounts" }, reload)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  function selectPickup(item: PickupQueueItem) {
    setSelectedId(pickupKey(item));
    setSelectedRider(item.assigned_rider_email || item.assigned_rider_code || "");
    setSelectedDriver(item.assigned_driver_email || item.assigned_driver_code || "");
    setSelectedHelper(item.assigned_helper_email || item.assigned_helper_code || "");
    setSelectedFleet(item.assigned_vehicle_id || "");
    setNote("");
  }

  function smartSuggest() {
    if (!selectedPickup) return;
    const township = lower(selectedPickup.pickup_township || selectedPickup.pickup_address);
    const preferredRider = eligibleRiders.find((row) => lower(`${row.zone} ${row.branch_code} ${row.name}`).includes(township)) || eligibleRiders[0];
    const preferredFleet = eligibleFleets.find((row) => selectedPickup.vehicle_type && lower(row.vehicle_type) === lower(selectedPickup.vehicle_type)) || eligibleFleets[0];
    setSelectedRider(preferredRider ? workerValue(preferredRider) : "");
    setSelectedFleet(preferredFleet?.id || "");
    setMessage({ tone: "info", text: `Suggested ${preferredRider?.code || "rider"}${preferredFleet ? ` and ${preferredFleet.vehicle_no}` : ""} using branch, zone, and vehicle requirement.` });
  }

  async function confirmAssignment() {
    if (!selectedPickup) {
      setMessage({ tone: "error", text: "Please select a pickup request." });
      return;
    }
    if (!selectedRiderRecord) {
      setMessage({ tone: "error", text: "Please select a rider before confirming assignment." });
      return;
    }
    if (note.length > NOTE_LIMIT) {
      setMessage({ tone: "error", text: "Supervisor note must be 500 characters or fewer." });
      return;
    }
    if (blockingError) {
      setMessage({ tone: "error", text: checks.find((item) => item.tone === "error")?.detail || "Go-live validation failed." });
      return;
    }

    setAssigning(true);
    setMessage({ tone: "info", text: "Assigning pickup and sending job to rider/driver app..." });

    try {
      const result = await assignPickup({
        pickup: selectedPickup,
        rider: selectedRiderRecord,
        driver: selectedDriverRecord,
        helper: selectedHelperRecord,
        fleet: selectedFleetRecord,
        note,
      });

      await markNotificationRead(selectedPickup.pickup_id);
      setMessage({ tone: "success", text: `Assigned ${selectedPickup.pickup_id || selectedPickup.request_code}. Rider/Driver app job is now available.` });
      console.info("Supervisor assignment result", result);

      setSelectedRider("");
      setSelectedDriver("");
      setSelectedHelper("");
      setSelectedFleet("");
      setNote("");
      await loadData(false);
    } catch (error: any) {
      setMessage({ tone: "error", text: error?.message || error?.details || "Assignment failed." });
    } finally {
      setAssigning(false);
    }
  }

  const toneClass = {
    info: "border-sky-500/40 bg-sky-500/10 text-sky-200",
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
    warning: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    error: "border-rose-500/40 bg-rose-500/10 text-rose-200",
  }[message.tone];

  return (
    <div className="min-h-screen bg-[#061524] p-4 text-[#eef8ff] md:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="rounded-3xl border border-[#1a3a5c] bg-[#0b2236] p-6 shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-[#f6b84b]"><ShieldCheck size={15} /> Britium Express</div>
              <h1 className="m-0 text-3xl font-black tracking-tight text-white">Supervisor Pickup Assignment Portal</h1>
              <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-[#9bb7cc]">Live CS pickup queue, rider/driver/helper assignment, fleet selection, notification acknowledgement, and production RPC fallbacks are wired into this screen.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={smartSuggest} disabled={!selectedPickup || loading || assigning} className="rounded-xl border border-[#1a3a5c] bg-[#102b45] px-4 py-3 text-xs font-black uppercase tracking-wider text-[#eef8ff] hover:border-[#f6b84b] disabled:opacity-50">Smart Suggest</button>
              <button type="button" onClick={() => loadData()} disabled={loading || assigning} className="inline-flex items-center gap-2 rounded-xl bg-[#f6b84b] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#061524] hover:bg-[#e5a93a] disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Sync</button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <Metric label="Pending Queue" value={pendingCount} tone="text-[#f6b84b]" />
            <Metric label="Assigned" value={assignedCount} tone="text-[#22c55e]" />
            <Metric label="Unread CS Alerts" value={unreadCount} tone="text-[#ff4f93]" />
            <Metric label="Active Riders" value={master.riders.length} tone="text-[#38bdf8]" />
          </div>

          <div className={`mt-5 flex flex-wrap items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold ${toneClass}`}>
            {loading || assigning ? <Loader2 size={17} className="animate-spin" /> : message.tone === "error" ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
            <span>{message.text}</span>
            <span className="text-[#9bb7cc]">Last sync: {lastSyncAt ? lastSyncAt.toLocaleString() : "not yet"}</span>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(420px,0.8fr)]">
          <section className="min-h-[660px] overflow-hidden rounded-3xl border border-[#1a3a5c] bg-[#0b2236] shadow-xl">
            <div className="border-b border-[#1a3a5c] bg-[#081b2e] p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="m-0 flex items-center gap-2 text-lg font-black text-white"><ClipboardCheck size={19} className="text-[#38bdf8]" /> Live Pickup Queue</h2>
                <span className="text-xs font-bold text-[#4d7a9b]">{filteredQueue.length} record(s)</span>
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-4 top-3.5 text-[#4d7a9b]" size={18} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search pickup, waybill, merchant, township, address..." className="h-12 w-full rounded-xl border border-[#1a3a5c] bg-[#061524] py-3 pl-12 pr-4 text-sm font-bold text-white outline-none focus:border-[#f6b84b]" />
              </div>
            </div>

            <div className="max-h-[590px] space-y-3 overflow-auto bg-[#061524] p-4">
              {filteredQueue.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#1a3a5c] p-10 text-center font-bold text-[#4d7a9b]">{loading ? "Loading supervisor queue..." : "No pickup requests loaded from the supervisor queue."}</div>
              ) : (
                filteredQueue.map((item) => {
                  const key = pickupKey(item);
                  const active = selectedPickup && pickupKey(selectedPickup) === key;
                  const assigned = ["ASSIGNED", "RIDER_ASSIGNED", "ASSIGNED_TO_DRIVER"].includes(text(item.supervisor_status || item.pickup_status || item.status).toUpperCase());
                  return (
                    <button key={`${item.id}-${key}`} type="button" onClick={() => selectPickup(item)} className={`w-full rounded-2xl border p-4 text-left transition-all ${active ? "border-[#f6b84b] bg-[#1a3a5c]" : "border-[#1a3a5c] bg-[#081b2e] hover:border-[#4d7a9b]"}`}>
                      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 break-words font-mono text-sm font-black text-[#38bdf8]">{item.has_unread_notification && !assigned ? <Bell size={14} className="text-[#ff4f93]" /> : null}{item.pickup_id || item.request_code || item.id}</div>
                          <div className="mt-1 text-xs font-bold text-[#4d7a9b]">{item.waybill_no || item.pickup_way_id ? `Way: ${item.waybill_no || item.pickup_way_id}` : "No waybill yet"}</div>
                        </div>
                        <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${assigned ? "border-[#0d6b4c] bg-[#083927] text-[#22c55e]" : "border-[#f6b84b]/40 bg-[#2a1934] text-[#f6b84b]"}`}>{statusText(item)}</span>
                      </div>
                      <div className="mt-3 grid gap-3 text-xs md:grid-cols-3">
                        <Info label="Merchant" value={`${item.merchant_code ? `${item.merchant_code} - ` : ""}${item.merchant_name || "Merchant"}`} />
                        <Info label="Location" value={[item.pickup_township, item.city, item.branch_code].filter(Boolean).join(", ") || "-"} />
                        <Info label="Parcels / Vehicle" value={`${item.parcel_count || 1} / ${item.vehicle_type || "Any"}`} />
                      </div>
                      <div className="mt-3 break-words text-xs font-semibold leading-5 text-[#9bb7cc]">{item.pickup_address || "No pickup address available."}</div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-[#1a3a5c] bg-[#0b2236] p-6 shadow-xl">
              <h2 className="m-0 mb-5 flex items-center gap-2 border-b border-[#1a3a5c] pb-4 text-xl font-black text-white"><UserCheck size={20} className="text-[#f6b84b]" /> Assign Field Team</h2>
              <div className="space-y-4">
                <FormReadOnly label="Selected Pickup" value={selectedPickup?.pickup_id || "None selected"} />
                <SelectField label="Rider - required" value={selectedRider} onChange={setSelectedRider} placeholder="Select Rider..." options={eligibleRiders.map((item) => ({ value: workerValue(item), label: workerLabel(item) }))} />
                <SelectField label="Driver" value={selectedDriver} onChange={setSelectedDriver} placeholder="Select Driver..." options={eligibleDrivers.map((item) => ({ value: workerValue(item), label: workerLabel(item) }))} />
                <SelectField label="Helper" value={selectedHelper} onChange={setSelectedHelper} placeholder="Select Helper..." options={eligibleHelpers.map((item) => ({ value: workerValue(item), label: workerLabel(item) }))} />
                <SelectField label="Vehicle / Fleet" value={selectedFleet} onChange={setSelectedFleet} placeholder="Select Vehicle..." options={eligibleFleets.map((item) => ({ value: item.id, label: fleetLabel(item) }))} />
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-wider text-[#4d7a9b]">Supervisor Note ({note.length}/{NOTE_LIMIT})</span>
                  <textarea value={note} onChange={(event) => setNote(event.target.value.slice(0, NOTE_LIMIT + 50))} placeholder="Pickup timing, fragile item, route instruction..." className={`min-h-[96px] w-full rounded-xl border bg-[#061524] p-4 text-sm font-bold outline-none focus:border-[#f6b84b] ${note.length > NOTE_LIMIT ? "border-[#ff4f93] text-[#ff4f93]" : "border-[#1a3a5c] text-white"}`} />
                </label>
                <button type="button" onClick={confirmAssignment} disabled={loading || assigning || !selectedPickup || !selectedRiderRecord || blockingError} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#f6b84b] font-black uppercase tracking-wider text-[#061524] shadow-lg shadow-[#f6b84b]/10 transition-colors hover:bg-[#e5a93a] disabled:cursor-not-allowed disabled:opacity-50">
                  {assigning ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {assigning ? "Assigning..." : "Confirm Assignment + Send to App"}
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-[#1a3a5c] bg-[#0b2236] p-6 shadow-xl">
              <h2 className="m-0 mb-4 flex items-center gap-2 text-lg font-black text-white"><Truck size={19} className="text-[#ff4f93]" /> Go-Live Checks</h2>
              <div className={`mb-4 rounded-2xl border p-4 text-sm font-black ${blockingError ? "border-[#ff4f93] bg-[#28192d] text-[#ff4f93]" : "border-[#0d6b4c] bg-[#082f35] text-[#22c55e]"}`}>{blockingError ? "Fix required items before assignment." : "Ready to assign."}</div>
              <div className="space-y-3">
                {checks.map((check) => (
                  <div key={check.label} className={`rounded-2xl border p-4 ${check.tone === "error" ? "border-[#ff4f93] bg-[#1b2034]" : check.tone === "warning" ? "border-[#f6b84b] bg-[#1b2331]" : "border-[#0d6b4c] bg-[#082f35]"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="break-words text-sm font-black text-white">{check.label}</div>
                        <div className="mt-1 break-words text-xs font-semibold leading-5 text-[#9bb7cc]">{check.detail}</div>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase ${check.tone === "error" ? "bg-[#ff4f93] text-[#061524]" : check.tone === "warning" ? "bg-[#f6b84b] text-[#061524]" : "bg-[#22c55e] text-[#061524]"}`}>{check.tone}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className="rounded-2xl border border-[#1a3a5c] bg-[#061524] p-4"><div className="text-xs font-black uppercase tracking-wider text-[#4d7a9b]">{label}</div><div className={`mt-1 text-3xl font-black ${tone}`}>{Number(value || 0).toLocaleString()}</div></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><div className="text-[10px] font-black uppercase tracking-wider text-[#4d7a9b]">{label}</div><div className="mt-1 break-words font-bold text-[#eef8ff]">{value}</div></div>;
}

function FormReadOnly({ label, value }: { label: string; value: string }) {
  return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-[#4d7a9b]">{label}</span><div className="flex h-12 items-center rounded-xl border border-[#1a3a5c] bg-[#061524] px-4 font-mono text-sm font-black text-[#f6b84b]">{value}</div></label>;
}

function SelectField({ label, value, onChange, placeholder, options }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; options: Array<{ value: string; label: string }> }) {
  return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-[#4d7a9b]">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full cursor-pointer rounded-xl border border-[#1a3a5c] bg-[#061524] px-4 text-sm font-bold text-white outline-none focus:border-[#f6b84b]"><option value="">{placeholder}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
