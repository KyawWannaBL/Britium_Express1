import React from "react";
import { Map, Route } from "lucide-react";

type RoutePoint = {
  lat: number;
  lng: number;
  label?: string;
};

type Props = {
  points?: RoutePoint[];
};

export default function LeafletRoutePanel({ points = [] }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
        <Map className="h-4 w-4" />
        Live Route Map Panel
      </div>

      <div className="grid h-72 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
        <div>
          <Route className="mx-auto h-6 w-6 text-slate-400" />
          <div className="mt-2 text-sm font-semibold text-slate-600">
            Leaflet-ready placeholder
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Keep this compile-safe now, then upgrade to real react-leaflet after base stabilization.
          </div>
        </div>
      </div>

      {points.length ? (
        <div className="mt-4 space-y-2 text-xs text-slate-600">
          {points.map((point, index) => (
            <div key={`${point.lat}-${point.lng}-${index}`} className="rounded-lg bg-slate-50 px-3 py-2">
              {point.label || `Point ${index + 1}`}: {point.lat}, {point.lng}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
