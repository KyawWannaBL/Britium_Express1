import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Headset, 
  Search, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Filter 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

export default function CustomerServicePortal() {
  const tickets = [
    { id: "TKT-1024", customer: "U Hla Maung", issue: "Delayed Delivery", status: "Open", priority: "High" },
    { id: "TKT-1025", customer: "Daw Aye Aye", issue: "Address Correction", status: "In Progress", priority: "Medium" },
    { id: "TKT-1026", customer: "MK Hercules Co.", issue: "Bulk Pickup Request", status: "Resolved", priority: "Low" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Headset className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Customer Service</h1>
        </div>
        <Button className="gap-2">
          <MessageSquare className="w-4 h-4" /> New Ticket
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Response</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18m</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tickets, customers, or IDs..." className="pl-10" />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" /> Filter
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.id}</TableCell>
                <TableCell>{t.customer}</TableCell>
                <TableCell>{t.issue}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    t.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {t.priority}
                  </span>
                </TableCell>
                <TableCell>{t.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
