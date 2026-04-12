
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/admin-supabase";
import { requireOpsAccess } from "../../../lib/api-guard";
import { buildRequestHash, getIdempotentResponse, saveIdempotentResponse } from "../../../lib/idempotency";
import {
  buildQrPayload,
  buildTrackingNumber,
  buildWaybillNumber,
  estimateCreateDeliveryQuote,
  inferBranchCode,
  normalizePhone,
  normalizeText,
  type AddressInput,
  type BookingInput
} from "../../../lib/create-delivery";

type BranchRow = { id: string; code: string };

const ROUTE_KEY = "create_delivery_v1";

function sanitizeAddress(address: AddressInput): AddressInput {
  return {
    ...address,
    label: address.label ? normalizeText(address.label) : undefined,
    contactName: normalizeText(address.contactName),
    phoneE164: normalizePhone(address.phoneE164),
    addressLine1: normalizeText(address.addressLine1),
    addressLine2: address.addressLine2 ? normalizeText(address.addressLine2) : undefined,
    ward: address.ward ? normalizeText(address.ward) : undefined,
    township: normalizeText(address.township),
    city: normalizeText(address.city),
    stateRegion: address.stateRegion ? normalizeText(address.stateRegion) : "Myanmar",
    postalCode: address.postalCode ? normalizeText(address.postalCode) : undefined,
    landmark: address.landmark ? normalizeText(address.landmark) : undefined
  };
}

function validateBooking(body: BookingInput) {
  const errors: string[] = [];
  if (!body.customer?.fullName) errors.push("Customer full name is required.");
  if (!body.customer?.phoneE164) errors.push("Customer phone is required.");
  if (!body.senderAddress?.contactName) errors.push("Sender contact name is required.");
  if (!body.recipientAddress?.contactName) errors.push("Recipient contact name is required.");
  if (!body.senderAddress?.addressLine1) errors.push("Sender address is required.");
  if (!body.recipientAddress?.addressLine1) errors.push("Recipient address is required.");
  if (!body.serviceType) errors.push("Service type is required.");
  if ((body.parcelWeightKg ?? 0) <= 0) errors.push("Parcel weight must be greater than zero.");
  return errors;
}

async function insertAddress(supabase: ReturnType<typeof createAdminClient>, address: AddressInput) {
  const { data, error } = await supabase
    .from("addresses")
    .insert({
      label: address.label ?? null,
      contact_name: address.contactName,
      phone_e164: address.phoneE164,
      address_line_1: address.addressLine1,
      address_line_2: address.addressLine2 ?? null,
      ward: address.ward ?? null,
      township: address.township,
      city: address.city,
      state_region: address.stateRegion ?? "Myanmar",
      postal_code: address.postalCode ?? null,
      landmark: address.landmark ?? null,
      latitude: address.latitude ?? null,
      longitude: address.longitude ?? null,
      serviceable: true,
      validation_status: "validated"
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function GET(request: NextRequest) {
  const access = await requireOpsAccess(request);
  if (access instanceof NextResponse) {
    return access;
  }

  try {
    const supabase = createAdminClient();
    const limit = Math.min(100, Number(request.nextUrl.searchParams.get("limit") ?? 25));
    const { data, error } = await supabase
      .from("shipments")
      .select("id, tracking_number, recipient_name, recipient_phone_e164, service_type, status, quoted_fee_mmks, cod_amount_mmks, booked_at")
      .order("booked_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ items: data ?? [], limit });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load deliveries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const access = await requireOpsAccess(request);
  if (access instanceof NextResponse) {
    return access;
  }

  const body = (await request.json()) as BookingInput;
  const validationErrors = validateBooking(body);
  if (validationErrors.length > 0) {
    return NextResponse.json({ error: "Invalid booking payload", details: validationErrors }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const idempotencyKey = request.headers.get("idempotency-key") ?? "";
    const requestHash = buildRequestHash(body);

    if (idempotencyKey) {
      const cached = await getIdempotentResponse(supabase, ROUTE_KEY, idempotencyKey, requestHash);
      if (cached) {
        return NextResponse.json(cached.response_json, { status: cached.status_code });
      }
    }

    const customerPhone = normalizePhone(body.customer.phoneE164);
    const preferredLanguage = body.customer.preferredLanguage ?? "en";
    const customerType = body.customer.customerType ?? "individual";
    const senderAddress = sanitizeAddress(body.senderAddress);
    const recipientAddress = sanitizeAddress(body.recipientAddress);
    const quote = estimateCreateDeliveryQuote({
      senderAddress,
      recipientAddress,
      serviceType: body.serviceType,
      parcelWeightKg: body.parcelWeightKg,
      pieces: body.pieces,
      codAmountMmks: body.codAmountMmks,
      declaredValueMmks: body.declaredValueMmks
    });
    const branchCode = body.branchCode?.trim().toUpperCase() || inferBranchCode(senderAddress.city);

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .upsert(
        {
          customer_code: `CUS-${customerPhone.replace(/\D/g, "").slice(-8)}`,
          customer_type: customerType,
          full_name: normalizeText(body.customer.fullName),
          company_name: body.customer.companyName ? normalizeText(body.customer.companyName) : null,
          phone_e164: customerPhone,
          email: body.customer.email?.trim() || null,
          preferred_language: preferredLanguage,
          notes: body.customer.notes?.trim() || null
        },
        { onConflict: "phone_e164" }
      )
      .select("id, customer_code, full_name, phone_e164")
      .single();

    if (customerError) throw customerError;

    const senderAddressId = await insertAddress(supabase, senderAddress);
    const recipientAddressId = await insertAddress(supabase, recipientAddress);

    const { data: quoteRequest, error: quoteError } = await supabase
      .from("quote_requests")
      .insert({
        customer_id: customer.id,
        sender_address_id: senderAddressId,
        recipient_address_id: recipientAddressId,
        service_type: body.serviceType,
        parcel_weight_kg: body.parcelWeightKg,
        pieces: body.pieces ?? 1,
        parcel_type: body.parcelType ?? "parcel",
        cod_amount_mmks: body.codAmountMmks ?? 0,
        declared_value_mmks: body.declaredValueMmks ?? 0,
        fragile: body.fragile ?? false,
        estimated_fee_mmks: ((quote as any).estimatedFeeMmks ?? (quote as any).totalFeeMmks ?? 0),
        estimated_eta_days: ((quote as any).estimatedEtaDays ?? (quote as any).etaDays ?? null),
        pricing_breakdown: ((quote as any).breakdown ?? (quote as any))
      })
      .select("id, estimated_fee_mmks, estimated_eta_days")
      .single();

    if (quoteError) throw quoteError;

    const { data: pickupRequest, error: pickupError } = await supabase
      .from("pickup_requests")
      .insert({
        customer_id: customer.id,
        requested_by_customer_id: customer.id,
        quote_request_id: quoteRequest.id,
        sender_address_id: senderAddressId,
        recipient_address_id: recipientAddressId,
        pickup_date: body.preferredPickupDate ?? null,
        time_slot: body.preferredTimeSlot ?? null,
        service_type: body.serviceType,
        status: "booked",
        special_instructions: body.specialInstructions ?? null
      })
      .select("id, pickup_number")
      .single();

    if (pickupError) throw pickupError;

    const { data: branch, error: branchError } = await supabase
      .from("branches")
      .select("id, code")
      .eq("code", branchCode)
      .maybeSingle<BranchRow>();

    if (branchError && !branchError.message.includes("Results contain 0 rows")) {
      throw branchError;
    }

    const trackingNumber = buildTrackingNumber(branchCode);
    const waybillNumber = buildWaybillNumber(branchCode);
    const createdByProfileId = body.createdByProfileId ?? (access.legacyProfileId ?? null);

    const { data: shipment, error: shipmentError } = await supabase
      .from("shipments")
      .insert({
        tracking_number: trackingNumber,
        customer_id: customer.id,
        sender_address_id: senderAddressId,
        recipient_address_id: recipientAddressId,
        recipient_name: recipientAddress.contactName,
        recipient_phone_e164: recipientAddress.phoneE164,
        service_type: body.serviceType,
        parcel_type: body.parcelType ?? "parcel",
        declared_value_mmks: body.declaredValueMmks ?? 0,
        cod_amount_mmks: body.codAmountMmks ?? 0,
        weight_grams: Math.round(body.parcelWeightKg * 1000),
        dimensions_json: { pieces: body.pieces ?? 1, fragile: body.fragile ?? false },
        status: "booked",
        current_branch_id: branch?.id ?? null,
        quoted_fee_mmks: ((quote as any).estimatedFeeMmks ?? (quote as any).totalFeeMmks ?? 0),
        final_fee_mmks: ((quote as any).estimatedFeeMmks ?? (quote as any).totalFeeMmks ?? 0),
        eta_promised_at: ((quote as any).promisedAt ?? (quote as any).expiresAt ?? null),
        booked_at: new Date().toISOString(),
        metadata: {
          branch_code: branchCode,
          pickup_request_id: pickupRequest.id,
          quote_request_id: quoteRequest.id,
          created_by_profile_id: createdByProfileId
        }
      })
      .select("id, tracking_number, status, quoted_fee_mmks, cod_amount_mmks")
      .single();

    if (shipmentError) throw shipmentError;

    const { data: waybill, error: waybillError } = await supabase
      .from("waybills")
      .insert({
        shipment_id: shipment.id,
        waybill_number: waybillNumber,
        qr_payload: buildQrPayload({
          trackingNumber,
          waybillNumber,
          shipmentId: shipment.id
        }),
        barcode_payload: trackingNumber,
        label_template_version: "britium_v1",
        printed_count: 0
      })
      .select("id, waybill_number, qr_payload")
      .single();

    if (waybillError) throw waybillError;

    const { error: scanError } = await supabase.from("scan_events").insert({
      shipment_id: shipment.id,
      waybill_id: waybill.id,
      scan_type: "booking_created",
      scanner_type: "mobile_camera",
      actor_type: "operator",
      actor_id: createdByProfileId,
      location: { city: senderAddress.city, township: senderAddress.township, branch_code: branchCode },
      device_metadata: { source: "create-delivery-console", operator_role: access.role, branch_code: access.branchCode },
      scanned_at: new Date().toISOString(),
      idempotency_key: `${trackingNumber}-booking-created`
    });

    if (scanError) throw scanError;

    const response = {
      ok: true,
      operator: (access.legacyProfileId ?? null),
      branchCode,
      customer: {
        id: customer.id,
        code: customer.customer_code,
        fullName: customer.full_name,
        phoneE164: customer.phone_e164
      },
      quote: {
        id: quoteRequest.id,
        estimatedFeeMmks: quoteRequest.estimated_fee_mmks,
        estimatedEtaDays: quoteRequest.estimated_eta_days
      },
      pickupRequest: {
        id: pickupRequest.id,
        pickupNumber: pickupRequest.pickup_number
      },
      shipment: {
        id: shipment.id,
        trackingNumber: shipment.tracking_number,
        status: shipment.status,
        quotedFeeMmks: shipment.quoted_fee_mmks,
        codAmountMmks: shipment.cod_amount_mmks
      },
      waybill: {
        id: waybill.id,
        waybillNumber: waybill.waybill_number,
        qrPayload: waybill.qr_payload,
        previewUrl: `/print/waybill?format=4x6_single&shipmentId=${shipment.id}`
      }
    };

    if (idempotencyKey) {
      await saveIdempotentResponse(supabase, ROUTE_KEY, idempotencyKey, requestHash, 200, response);
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create delivery" },
      { status: 500 }
    );
  }
}
