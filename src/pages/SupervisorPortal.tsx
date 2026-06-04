import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Activity, AlertTriangle, CheckCircle, Truck } from "lucide-react";

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

const vehicleMaster: VehicleMaster[] = [
  { id: "VEH-001", fleetId: "FLT-YGN-001", label: "Car", type: "Car", licenseNo: "YGN-2Q-6524", capacityKg: 350, assignedZone: "South Okkalapa", status: "Available" },
  { id: "VEH-002", fleetId: "FLT-YGN-002", label: "Mini Truck", type: "Mini Truck", licenseNo: "YGN-7B-6382", capacityKg: 1200, assignedZone: "East Dagon", status: "Available" },
  { id: "VEH-003", fleetId: "FLT-PARTNER-001", label: "Partner Vehicle", type: "Partner Vehicle", licenseNo: "YGN-5A-1745", capacityKg: 800, assignedZone: "Hlaing", status: "Available" },
];

const helperMaster: HelperMaster[] = [
  { id: "HLP-001", name: "Helper 1", assignedZone: "South Okkalapa", status: "Available" },
  { id: "HLP-002", name: "Helper 2", assignedZone: "East Dagon", status: "Available" },
  { id: "HLP-003", name: "Helper 3", assignedZone: "Hlaing", status: "Available" },
];

export default function SupervisorPortal() {
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicleMaster[0]?.id ?? "");
  const [selectedHelperId, setSelectedHelperId] = useState(helperMaster[0]?.id ?? "");
  const [assignmentType, setAssignmentType] = useState("pickup");
  const [notice, setNotice] = useState("Vehicle and helper selections are synchronized with master data.");

  const selectedVehicle = useMemo(
    () => vehicleMaster.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicleMaster[0],
    [selectedVehicleId],
  );
  const selectedHelper = useMemo(
    () => helperMaster.find((helper) => helper.id === selectedHelperId) ?? helperMaster[0],
    [selectedHelperId],
  );

  const stats = [
    { title: "Active Projects", value: "Wartayar Phase 1", icon: Activity, color: "text-blue-600" },
    { title: "Pending Approvals", value: "12", icon: AlertTriangle, color: "text-amber-600" },
    { title: "Completed Today", value: "148", icon: CheckCircle, color: "text-green-600" },
  ];

  function confirmAssignment() {
    setNotice(`${selectedVehicle.label} (${selectedVehicle.licenseNo}) assigned for ${assignmentType} with ${selectedHelper.name}.`);
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
          <p className="text-sm text-muted-foreground">Select vehicle and helper from master data only. UUIDs and raw column names are not shown in the dropdown.</p>
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
              <select value={selectedVehicleId} onChange={(event) => setSelectedVehicleId(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-semibold outline-none focus:border-blue-500">
                {vehicleMaster.filter((vehicle) => vehicle.status === "Available").map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>{vehicle.label} - {vehicle.licenseNo} - {vehicle.assignedZone}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Select helper</span>
              <select value={selectedHelperId} onChange={(event) => setSelectedHelperId(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-semibold outline-none focus:border-blue-500">
                {helperMaster.filter((helper) => helper.status === "Available").map((helper) => (
                  <option key={helper.id} value={helper.id}>{helper.name} - {helper.assignedZone}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-4">
            <Info label="Fleet ID" value={selectedVehicle.fleetId} />
            <Info label="Vehicle Type" value={selectedVehicle.type} />
            <Info label="Capacity" value={`${selectedVehicle.capacityKg} kg`} />
            <Info label="Assigned Zone" value={selectedVehicle.assignedZone} />
            <Info label="License No" value={selectedVehicle.licenseNo} />
            <Info label="Helper Zone" value={selectedHelper.assignedZone} />
            <Info label="Status" value={selectedVehicle.status} />
          </div>

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
