import { Database, PlusCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DataEntryPortal() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Data Entry Portal</h1>
        </div>
        <Button className="gap-2">
          <Save className="w-4 h-4" /> Save All Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-muted/50 p-4 rounded-lg border border-dashed">
        <Input placeholder="Tracking ID" className="bg-background" />
        <Input placeholder="Merchant Name" className="bg-background" />
        <Input placeholder="Weight (kg)" type="number" className="bg-background" />
        <Button variant="secondary" className="gap-2">
          <PlusCircle className="w-4 h-4" /> Add Row
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking ID</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-mono">BRT-99201</TableCell>
              <TableCell>Myanmar MK Hercules</TableCell>
              <TableCell>Yangon Hub</TableCell>
              <TableCell>
                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">Ready</span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
