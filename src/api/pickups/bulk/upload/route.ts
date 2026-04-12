import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../../lib/admin-supabase";
import { requireOpsAccess } from "../../../../../lib/api-guard";
import { buildRequestHash, getIdempotentResponse, saveIdempotentResponse } from "../../../../../lib/idempotency";

const ROUTE_KEY = "bulk_pickup_upload_v1";
const BUCKET = "bulk-imports";
const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

function extensionFor(filename: string) {
  const normalized = filename.toLowerCase();
  return ALLOWED_EXTENSIONS.find((suffix) => normalized.endsWith(suffix)) ?? "";
}

export async function POST(request: NextRequest) {
  const access = await requireOpsAccess();

  const formData = await request.formData();
  const file = formData.get("file");
  const customerId = String(formData.get("customerId") ?? "") || null;
  const branchCode = String(formData.get("branchCode") ?? access.branchCode ?? "").toUpperCase();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const extension = extensionFor(file.name);
  if (!extension) {
    return NextResponse.json({ error: "Only .xlsx, .xls, and .csv files are supported." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const requestHash = buildRequestHash({
    filename: file.name,
    size: bytes.length,
    contentType: file.type,
    customerId,
    branchCode
  });

  try {
    const supabase = createAdminClient();
    const idempotencyKey = request.headers.get("idempotency-key") ?? "";

    if (idempotencyKey) {
      const cached = await getIdempotentResponse(supabase, ROUTE_KEY, idempotencyKey, requestHash);
      if (cached) {
        return NextResponse.json(cached.response_json, { status: cached.status_code });
      }
    }

    const objectPath = `${branchCode || "OPS"}/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: job, error: jobError } = await supabase
      .from("bulk_upload_jobs")
      .insert({
        uploaded_by_profile_id: access.id,
        customer_id: customerId,
        filename: file.name,
        storage_object_path: objectPath,
        status: "queued",
        total_rows: 0,
        accepted_rows: 0,
        rejected_rows: 0,
        template_version: "2026.03",
        parser_status: "queued",
        metadata: {
          branchCode,
          fileSize: bytes.length,
          contentType: file.type,
          originalFilename: file.name
        }
      })
      .select("id, job_number, status, parser_status, storage_object_path, created_at")
      .single();

    if (jobError) throw jobError;

    let workerStatus = "queued";
    let workerError: string | null = null;

    const invoke = await supabase.functions.invoke("bulk-pickup-parser", {
      body: { jobId: job.id }
    });

    if (invoke.error) {
      workerStatus = "queued";
      workerError = invoke.error.message;
    } else {
      workerStatus = "processing";
      await supabase.from("bulk_upload_jobs").update({ parser_status: "processing" }).eq("id", job.id);
    }

    const response = {
      ok: true,
      operator: access.fullName,
      authUserId: access.id,
      job: {
        ...job,
        parser_status: workerStatus
      },
      worker: {
        functionName: "bulk-pickup-parser",
        status: workerStatus,
        error: workerError
      }
    };

    if (idempotencyKey) {
      await saveIdempotentResponse(supabase, ROUTE_KEY, idempotencyKey, requestHash, 200, response);
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to upload bulk pickup file." },
      { status: 500 }
    );
  }
}
