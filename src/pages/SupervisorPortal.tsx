import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Activity, AlertTriangle, CheckCircle, RefreshCw, Truck } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type VehicleStatus = "Available" | "Assigned" | "Maintenance";

type VehicleMaster = {
  id: string;
  fleetId: string;
  label: string;
  type: string;
  licenseNo: string;
  capacityKg: number;
  assignedZone: string;
  status: VehicleStatus;
};

type HelperMaster = {
  id: string;
  name: string;
  assignedZone: string;
  status: "Available" | "Assigned";
};

const fallbackVehicles: VehicleMaster[] = [
  { id: "VEH-001", fleetId: "FLT-YGN-001", label: "Car", type: "Car", licenseNo: "YGN-2Q-6524", capacityKg: 350, assignedZone: "South Okkalapa", status: "Available" },
  { id: "VEH-002", fleetId: "FLT-YGN-002", label: "Mini Truck", type: "Mini Truck", licenseNo: "YGN-7B-6382", capacityKg: 1200, assignedZone: "East Dagon", status: "Available" },
  { id: "VEH-003", fleetId: "FLT-PARTNER-001", label: "Partner Vehicle", type: "Partner Vehicle", licenseNo: "YGN-5A-1745", capacityKg: 800, assignedZone: "Hlaing", status: "Available" },
];

const fallbackHelpers: HelperMaster[] = [
  { id: "HLP-001", name: "Helper Team 1", assignedZone: "South Okkalapa", status: "Available" },
  { id: "HLP-002", name: "Helper Team 2", assignedZone: "East Dagon", status: "Available" },
  { id: "HLP-003", name: "Helper Team 3", assignedZone: "Hlaing", status: "Available" },
];

function cleanText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function isSchemaOption(value: string) {
  const normalized = value.trim().toLowerCase();
  return /^[a-z0-9]+(_[a-z0-9]+)+$/.test(normalized) || ["merchant_id", "address_line_1", "phone_primary", "preferred_delivery_instruction", "capacity_kg", "assigned_zone", "license_no", "fleet_id", "status"].includes(normalized);
}

function asVehicleStatus(value: unknown): VehicleStatus {
  const text = cleanText(value).toLowerCase();
  if (text.includes("assign")) return "Assigned";
  if (text.includes("maint")) return "Maintenance";
  return "Available";
}

function normalizeVehicle(row: Record<string, unknown>): VehicleMaster | null {
  const id = cleanText(row.id, row.vehicle_id, row.vehicleId, row.fleet_id, row.fleetId);
  const fleetId = cleanText(row.fleet_id, row.fleetId, row.fleet_no, row.fleetNo, id);
  const licenseNo = cleanText(row.license_no, row.licenseNo, row.plate_no, row.plateNo, row.registration_no, row.registrationNo);
  const type = cleanText(row.vehicle_type, row.vehicleType, row.type, row.category, row.label, row.name);
  const label = cleanText(row.label, row.vehicle_name, row.vehicleName, row.name, type);
  const assignedZone = cleanText(row.assigned_zone, row.assignedZone, row.route_zone, row.routeZone, row.zone, row.region, "Unassigned Zone");
  const capacityKg = Number(cleanText(row.capacity_kg, row.capacityKg, row.capacity, 0)) || 0;

  if (!id || (!licenseNo && !fleetId && !type)) return null;
  if ([label, type, licenseNo, fleetId].some((value) => value && isSchemaOption(value)) && !licenseNo && !capacityKg) return null;

  return {
    id,
    fleetId: fleetId || id,
    label: label || type || fleetId || id,
    type: type || label || "Vehicle",
    licenseNo: licenseNo || "No license recorded",
    capacityKg,
    assignedZone,
    status: asVehicleStatus(row.status ?? row.availability_status ?? row.availability),
  };
}

async function loadVehiclesFromMasterData() {
  for (const table of ["vehicle_master", "vehicles", "fleet_vehicles", "transport_assets"]) {
    try {
      const { data, error } = await supabase.from(table).select("*").limit(200);
      if (error || !Array.isArray(data)) continue;
      const rows = data.map((row) => normalizeVehicle(row as Record<string, unknown>)).filter(Boolean) as VehicleMaster[];
      if (rows.length) return rows;
    } catch {
      // try the next possible master-data table name
    }
  }
  return [];
}

export default function SupervisorPortal() {
  const [vehicles, setVehicles] = useState<VehicleMaster[]>(fallbackVehicles);
  const [selectedVehicleId, setSelectedVehicleId] = useState(fallbackVehicles[0]?.id ?? "");
  const [selectedHelperId, setSelectedHelperId] = useState(fallbackHelpers[0]?.id ?? "");
  const [assignmentType, setAssignmentType] = useState("pickup");
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [notice, setNotice] = useState("Loading vehicle master data.");

  const availableVehicles = useMemo(() => vehicles.filter((vehicle) => vehicle.status === "Available"), [vehicles]);
  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? availableVehicles[0] ?? vehicles[0],
    [availableVehicles, selectedVehicleId, vehicles],
  );
  const zoneMatchedHelpers = useMemo(() => {
    const available = fallbackHelpers.filter((helper) => helper.status === "Available");
    const sameZone = available.filter((helper) => selectedVehicle && helper.assignedZone === selectedVehicle.assignedZone);
    return sameZone.length ? sameZone : available;
  }, [selectedVehicle]);
  const selectedHelper = useMemo(
    () => fallbackHelpers.find((helper) => helper.id === selectedHelperId) ?? zoneMatchedHelpers[0] ?? fallbackHelpers[0],
    [selectedHelperId, zoneMatchedHelpers],
  );

  async function refreshMasterData() {
    setLoadingMaster(true);
    const vehicleRows = await loadVehiclesFromMasterData();
    const nextVehicles = vehicleRows.length ? vehicleRows : fallbackVehicles;
    setVehicles(nextVehicles);
    setSelectedVehicleId((current) => nextVehicles.some((vehicle) => vehicle.id === current) ? current : nextVehicles[0]?.id ?? "");
    setNotice(vehicleRows.length ? "Vehicle master data synchronized." : "Using fallback vehicles because no live vehicle master table returned usable records.");
    setLoadingMaster(false);
  }

  useEffect(() => {
    void refreshMasterData();
  }, []);

  useEffect(() => {
    if (!selectedHelper || !zoneMatchedHelpers.some((helper) => helper.id === selectedHelper.id)) {
      setSelectedHelperId(zoneMatchedHelpers[0]?.id ?? "");
    }
  }, [selectedHelper, zoneMatchedHelpers]);

  const stats = [
    { title: "Active Projects", value: "Wartayar Phase 1", icon: Activity, color: "text-blue-600" },
    { title: "Pending Approvals", value: "12", icon: AlertTriangle, color: "text-amber-600" },
    { title: "Completed Today", value: "148", icon: CheckCircle, color: "text-green-600" },
  ];

  function confirmAssignment() {
    if (!selectedVehicle || !selectedHelper) return;
    setNotice(`${selectedVehicle.label} (${selectedVehicle.licenseNo}) assigned for ${assignmentType} with ${selectedHelper.name}. Fleet, capacity, zone, and license came from vehicle master data.`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Supervisor Control Hub</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />Pickup Assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">The vehicle dropdown reads live vehicle master-data rows and filters out raw schema-field records.</p>
            <button type="button" onClick={refreshMasterData} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-black hover:bg-slate-50"><RefreshCw size={16} className={loadingMaster ? "animate-spin" : ""} />Sync master data</button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-semibold">Assignment Type</span>
              <select value={assignmentType} onChange={(event) => setAssignmentType(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-semibold outline-none focus:border-blue-500">
                <option value="pickup">Pickup</option>
                <option value="delivery">Delivery</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Select vehicle</span>
              <select value={selectedVehicle?.id ?? ""} onChange={(event) => setSelectedVehicleId(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-semibold outline-none focus:border-blue-500">
                {availableVehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>{vehicle.label} - {vehicle.licenseNo} - {vehicle.assignedZone}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Select helper</span>
              <select value={selectedHelper?.id ?? ""} onChange={(event) => setSelectedHelperId(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-semibold outline-none focus:border-blue-500">
                {zoneMatchedHelpers.map((helper) => (
                  <option key={helper.id} value={helper.id}>{helper.name} - {helper.assignedZone}</option>
                ))}
              </select>
            </label>
          </div>

          {selectedVehicle ? <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-4">
            <Info label="Fleet ID" value={selectedVehicle.fleetId} />
            <Info label="Vehicle Type" value={selectedVehicle.type} />
            <Info label="Capacity" value={`${selectedVehicle.capacityKg} kg`} />
            <Info label="Assigned Zone" value={selectedVehicle.assignedZone} />
            <Info label="License No" value={selectedVehicle.licenseNo} />
            <Info label="Helper" value={selectedHelper?.name ?? "Not selected"} />
            <Info label="Helper Zone" value={selectedHelper?.assignedZone ?? "Not selected"} />
            <Info label="Status" value={selectedVehicle.status} />
          </div> : null}

          <button type="button" onClick={confirmAssignment} className="rounded-2xl bg-blue-700 px-6 py-3 font-black text-white hover:bg-blue-800">Confirm Assignment</button>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">{notice}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white p-3"><div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 text-sm font-black text-slate-700">{value}</div></div>;
}
