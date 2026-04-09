import { UserSquare2, Package, Truck, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CustomerPortal() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-full bg-primary/10 mb-2">
          <UserSquare2 className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Track Your Shipment</h1>
        <p className="text-muted-foreground">Enter your Britium Express tracking number below.</p>
      </div>

      <div className="flex gap-2 max-w-lg mx-auto">
        <Input placeholder="BRT-XXXX-XXXX" className="text-lg h-12" />
        <Button size="lg" className="px-8">Track</Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" /> Shipment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between relative">
              <div className="flex flex-col items-center gap-2 z-10 bg-background px-2">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium">Order Placed</span>
              </div>
              <div className="flex flex-col items-center gap-2 z-10 bg-background px-2">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  <Truck className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium">In Transit</span>
              </div>
              <div className="flex flex-col items-center gap-2 z-10 bg-background px-2 opacity-40">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium">Delivered</span>
              </div>
              {/* Progress Line */}
              <div className="absolute top-5 left-0 w-full h-0.5 bg-muted -z-0">
                <div className="h-full bg-primary w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
