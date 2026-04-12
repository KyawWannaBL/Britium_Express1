
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/admin-supabase";
import { requireOpsAccess } from "../../../../lib/api-guard";
import { buildRequestHash, getIdempotentResponse, saveIdempotentResponse } from "../../../../lib/idempotency";

const ROUTE_KEY = "bulk_pickup_register_v1";

export async function POST(request: NextRequest) {
  const access = await requireOpsAccess();

  const body = await request.json();
  const filename = String(body.filename ?? "");
  const rows = Number(body.rows ?? 0);
  const customerId = body.customerId ? String(body.customerId) : null;
  const uploadedByProfileId = body.uploadedByProfileId ? String(body.uploadedByProfileId) : (access.id ?? null);
  const storageObjectPath = body.storageObjectPath ? String(body.storageObjectPath) : null;

  if (!filename || rows <= 0) {
    return NextResponse.json(
      { error: "filename and rows are required for bulk intake registration" },
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminClient();
    const idempotencyKey = request.headers.get("idempotency-key") ?? "";
    const acceptedRows = Number(body.acceptedRows ?? rows);
    const rejectedRows = Math.max(0, rows - acceptedRows);
    const requestHash = buildRequestHash({ filename, rows, acceptedRows, customerId, uploadedByProfileId, storageObjectPath });

    if (idempotencyKey) {
      const cached = await getIdempotentResponse(supabase, ROUTE_KEY, idempotencyKey, requestHash);
      if (cached) {
        return NextResponse.json(cached.response_json, { status: cached.status_code });
      }
    }

    const { data, error } = await supabase
      .from("bulk_upload_jobs")
      .insert({
        uploaded_by_profile_id: uploadedByProfileId,
        customer_id: customerId,
        filename,
        storage_object_path: storageObjectPath,
        status: rejectedRows > 0 ? "partially_accepted" : "accepted",
        total_rows: rows,
        accepted_rows: acceptedRows,
        rejected_rows: rejectedRows,
        error_summary: body.errorSummary ?? []
      })
      .select("id, job_number, status, total_rows, accepted_rows, rejected_rows, template_version")
      .single();

    if (error) throw error;

    const response = {
      ok: true,
      operator: (access.id ?? null),
      job: data
    };

    if (idempotencyKey) {
      await saveIdempotentResponse(supabase, ROUTE_KEY, idempotencyKey, requestHash, 200, response);
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to register bulk pickup job" },
      { status: 500 }
    );
  }
}
