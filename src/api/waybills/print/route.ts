
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/admin-supabase";
import { requireOpsAccess } from "../../../../lib/api-guard";
import { buildRequestHash, getIdempotentResponse, saveIdempotentResponse } from "../../../../lib/idempotency";
import { printFormats } from "../../../_lib/waybill";

const ROUTE_KEY = "waybill_print_v1";

export async function POST(request: NextRequest) {
  const access = await requireOpsAccess();

  const body = await request.json();
  const format = String(body.format ?? "");
  const copies = Math.max(1, Number(body.copies ?? 1));
  const shipmentIds = Array.isArray(body.shipmentIds) ? body.shipmentIds.map(String) : [];
  const selectedFormat = printFormats.find((item) => item.code === format);

  if (!selectedFormat) {
    return NextResponse.json({ error: "Unsupported print format" }, { status: 400 });
  }

  if (shipmentIds.length === 0) {
    return NextResponse.json({ error: "At least one shipmentId is required" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const idempotencyKey = request.headers.get("idempotency-key") ?? body.idempotencyKey ?? "";
    const requestHash = buildRequestHash({ format, copies, shipmentIds, role: access.role, branch: access.branchCode });

    if (idempotencyKey) {
      const cached = await getIdempotentResponse(supabase, ROUTE_KEY, idempotencyKey, requestHash);
      if (cached) {
        return NextResponse.json(cached.response_json, { status: cached.status_code });
      }
    }

    let branchId: string | null = null;
    if (access.branchCode) {
      const { data: branch } = await supabase.from("branches").select("id").eq("code", access.branchCode).maybeSingle();
      branchId = branch?.id ?? null;
    }

    const shipmentsQuery = supabase
      .from("shipments")
      .select("id, branch_id, tracking_number")
      .in("id", shipmentIds);

    const { data: shipmentRows, error: shipmentError } = await shipmentsQuery;
    if (shipmentError) throw shipmentError;

    const eligibleShipmentIds = (shipmentRows ?? [])
      .filter((row) => !branchId || row.branch_id === branchId || access.role === "admin")
      .map((row) => row.id);

    if (eligibleShipmentIds.length === 0) {
      return NextResponse.json({ error: "No branch-eligible shipments for printing." }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("waybills")
      .select("id, shipment_id, waybill_number, qr_payload, printed_count, last_printed_at")
      .in("shipment_id", eligibleShipmentIds);

    if (error) {
      throw error;
    }

    const jobs = data ?? [];
    if (jobs.length === 0) {
      return NextResponse.json({ error: "No matching shipments for print" }, { status: 404 });
    }

    const timestamp = new Date().toISOString();
    for (const job of jobs) {
      const { error: updateError } = await supabase
        .from("waybills")
        .update({
          printed_count: (job.printed_count ?? 0) + copies,
          last_printed_at: timestamp
        })
        .eq("id", job.id);

      if (updateError) {
        throw updateError;
      }
    }

    const previewUrl = `/print/waybill?format=${encodeURIComponent(format)}&ids=${encodeURIComponent(eligibleShipmentIds.join(","))}`;
    const { data: printJob } = await supabase
      .from("print_jobs")
      .insert({
        created_by_profile_id: access.id,
        branch_id: branchId,
        job_type: "waybill",
        format_code: format,
        shipment_ids: eligibleShipmentIds,
        copies,
        status: "rendered",
        render_path: previewUrl,
        metadata: { branchCode: access.branchCode, operator: access.fullName }
      })
      .select("id, status")
      .maybeSingle();

    const response = {
      ok: true,
      queuedAt: timestamp,
      format,
      copies,
      operator: access.id,
      branchCode: access.branchCode,
      printJobId: printJob?.id ?? null,
      jobs: jobs.map((job) => ({
        shipmentId: job.shipment_id,
        waybillNumber: job.waybill_number,
        qrPayload: job.qr_payload
      })),
      previewUrl
    };

    if (idempotencyKey) {
      await saveIdempotentResponse(supabase, ROUTE_KEY, idempotencyKey, requestHash, 200, response);
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to queue print job" },
      { status: 500 }
    );
  }
}
