import { supabase } from "@/lib/supabase/client";

export type CargoRow = {
  trackingNo: string;
  receiverName: string;
  receiverPhone: string;
  destination: string;
  codAmount?: number;
};

export type RoutePoint = {
  lat: number;
  lng: number;
  label?: string;
};

export async function createDeliveryJob(payload: {
  jobType: string;
  referenceNo?: string;
  cargoRows: CargoRow[];
  notes?: string;
}) {
  return supabase.from("delivery_jobs").insert({
    job_type: payload.jobType,
    reference_no: payload.referenceNo ?? null,
    cargo_rows: payload.cargoRows,
    notes: payload.notes ?? null,
    status: "draft",
  }).select().single();
}

export async function createParcelEvent(payload: {
  eventType: string;
  trackingNo?: string;
  metadata?: Record<string, unknown>;
}) {
  return supabase.from("parcel_events").insert({
    event_type: payload.eventType,
    tracking_no: payload.trackingNo ?? null,
    metadata: payload.metadata ?? {},
  }).select().single();
}

export async function saveDeliveryProof(payload: {
  trackingNo: string;
  signatureDataUrl?: string | null;
  evidenceUrls?: string[];
  exceptionReason?: string | null;
}) {
  return supabase.from("delivery_proofs").insert({
    tracking_no: payload.trackingNo,
    signature_data_url: payload.signatureDataUrl ?? null,
    evidence_urls: payload.evidenceUrls ?? [],
    exception_reason: payload.exceptionReason ?? null,
  }).select().single();
}

export async function listLiveTracking(limit = 50) {
  return supabase
    .from("parcel_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
}

export async function listWayJobs(limit = 25) {
  return supabase
    .from("delivery_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
}
