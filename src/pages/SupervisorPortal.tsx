import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Activity, AlertTriangle, CheckCircle } from "lucide-react";

export default function SupervisorPortal() {
  const stats = [
    { title: "Active Projects", value: "Wartayar Phase 1", icon: Activity, color: "text-blue-600" },
    { title: "Pending Approvals", value: "12", icon: AlertTriangle, color: "text-amber-600" },
    { title: "Completed Today", value: "148", icon: CheckCircle, color: "text-green-600" },
  ];

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
          <CardTitle>Logistics Oversight</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Monitoring live manifests and personnel assignments for Britium Express.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
