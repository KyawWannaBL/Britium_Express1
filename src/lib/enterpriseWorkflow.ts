export type PaymentMethod = "COD" | "Prepaid" | "Account" | "Collect" | "Internal";
export type OperationalStatus =
  | "Draft"
  | "Pending Pickup"
  | "Pickup Assigned"
  | "Picked Up"
  | "Received"
  | "In Warehouse"
  | "Sorting"
  | "Bagged"
  | "Dispatched"
  | "Out for Delivery"
  | "Delivered"
  | "Failed Attempt"
  | "Returned"
  | "Finance Pending"
  | "Closed";
export type HandoverStatus =
  | "Pending Collection"
  | "Collected"
  | "Awaiting Handover"
  | "Submitted"
  | "Under Verification"
  | "Handed Over"
  | "Shortage"
  | "Excess"
  | "Disputed"
  | "Locked";
export type InvoiceStatus = "Draft" | "Under Review" | "Issued" | "Partially Paid" | "Paid" | "On Hold" | "Cancelled" | "Adjusted" | "Closed";
export type SettlementStatus = "Pending" | "Ready for Settlement" | "Transferred" | "Partially Transferred" | "On Hold" | "Reconciled" | "Disputed" | "Closed";
export type ScanType = "Inbound Scan" | "Sorting Scan" | "Bag Scan" | "Dispatch Scan" | "Exception Scan";

export type MerchantMaster = {
  id: string;
  name: string;
  code: string;
  phone: string;
  contactPerson: string;
  pickupAddress: string;
  pickupTownship: string;
  pickupCity: string;
  defaultPickupTime: string;
  paymentMethod: PaymentMethod;
  tariffProfile: string;
  billingProfile: string;
};

export type OperationalIds = {
  pickupId: string;
  deliverId: string;
  invoiceNo: string;
  waybillNo: string;
};

export type EnterpriseShipment = OperationalIds & {
  id: string;
  trackingNo: string;
  merchantId: string;
  merchantName: string;
  merchantCode: string;
  receiverName: string;
  receiverPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  township: string;
  pickupDate: string;
  pickupTime: string;
  parcelCount: number;
  paymentMethod: PaymentMethod;
  codAmount: number;
  deliveryFee: number;
  extraWeightFee: number;
  prepaidAmount: number;
  discount: number;
  serviceType: string;
  priority: string;
  status: OperationalStatus;
  riderId?: string;
  riderName?: string;
  branch?: string;
  routeZone?: string;
  bagCode?: string;
  podStatus?: "Pending" | "Captured" | "Rejected";
  handoverStatus?: HandoverStatus;
  invoiceStatus?: InvoiceStatus;
  settlementStatus?: SettlementStatus;
  notes?: string;
};

export type RiderHandover = {
  settlementRef: string;
  riderId: string;
  riderName: string;
  shiftDate: string;
  routeZone: string;
  totalDeliveredParcels: number;
  totalCodExpected: number;
  totalCashReceived: number;
  digitalPaymentTotal: number;
  shortageOrExcess: number;
  verifiedBy: string;
  status: HandoverStatus;
  notes: string;
};

export type MerchantSettlement = {
  settlementBatch: string;
  merchantId: string;
  merchantCode: string;
  merchantName: string;
  codCollected: number;
  deliveryFees: number;
  codFees: number;
  extraWeightFees: number;
  returnFees: number;
  discounts: number;
  deductions: number;
  netPayable: number;
  status: SettlementStatus;
};

export type InvoiceRecord = OperationalIds & {
  merchantId: string;
  merchantCode: string;
  merchantName: string;
  billingPeriod: string;
  shipmentCount: number;
  deliveredCount: number;
  failedReturnedCount: number;
  codCollected: number;
  deliveryCharges: number;
  codFees: number;
  extraWeightFees: number;
  returnFees: number;
  discounts: number;
  deductions: number;
  netPayableOrReceivable: number;
  paymentStatus: InvoiceStatus;
  dueDate: string;
};

export const merchantMaster: MerchantMaster[] = [
  {
    id: "MRC-001",
    name: "Baby Kyaw",
    code: "BBK",
    phone: "09 780 001 015",
    contactPerson: "Daw Baby Kyaw",
    pickupAddress: "No. 15, Thiri Mingalar Street, South Okkalapa",
    pickupTownship: "South Okkalapa",
    pickupCity: "Yangon",
    defaultPickupTime: "10:00 AM - 12:00 PM",
    paymentMethod: "COD",
    tariffProfile: "Same Day Zone A",
    billingProfile: "Daily COD settlement",
  },
  {
    id: "MRC-002",
    name: "Baby World",
    code: "BBW",
    phone: "09 450 220 015",
    contactPerson: "Ko Sai",
    pickupAddress: "No. 22, Bo Hmu Ba Htoo Road, Ward 6, East Dagon",
    pickupTownship: "East Dagon",
    pickupCity: "Yangon",
    defaultPickupTime: "01:00 PM - 03:00 PM",
    paymentMethod: "Account",
    tariffProfile: "Account Zone B",
    billingProfile: "Weekly invoice",
  },
  {
    id: "MRC-003",
    name: "City Fresh",
    code: "CTF",
    phone: "09 456 001 223",
    contactPerson: "Ko Thant Zin",
    pickupAddress: "Hlaing Industrial Block, Warehouse Lane 3",
    pickupTownship: "Hlaing",
    pickupCity: "Yangon",
    defaultPickupTime: "02:00 PM - 04:00 PM",
    paymentMethod: "Prepaid",
    tariffProfile: "Standard intercity",
    billingProfile: "Prepaid account",
  },
];

export const dataEntryTemplateFields = [
  "Row No",
  "Upload Action",
  "Requester Type",
  "Merchant ID",
  "Merchant Code",
  "Merchant / Sender Name",
  "Sender Phone",
  "Pickup Address",
  "Pickup Township",
  "Pickup City",
  "Pickup Date",
  "Pickup Time",
  "Pickup Parcel Count",
  "Weight KG",
  "Item Value",
  "Pickup ID",
  "Deliver ID",
  "Invoice No",
  "Waybill No",
  "Recipient Name",
  "Recipient Phone",
  "Delivery Township",
  "Delivery Address",
  "Delivery Fee",
  "Extra Weight Fee",
  "Prepaid Amount",
  "COD Amount",
  "Destination",
  "Payment Method",
  "Service Type",
  "Priority",
  "Pickup By 1",
  "Pickup By 2",
  "Remarks",
  "Upload Status",
  "API Message",
  "Source Row No",
];

export const warehouseTemplateFields = [
  "Scan Date",
  "Scan Time",
  "Warehouse Branch",
  "Operator",
  "Pickup ID",
  "Deliver ID",
  "Invoice No",
  "Waybill No",
  "Merchant ID",
  "Merchant Code",
  "Merchant Name",
  "Expected Parcel Count",
  "Scanned Parcel Count",
  "Remaining Count",
  "Tracking No / Waybill No",
  "Scan Type",
  "Current Status",
  "Next Status",
  "Bag Code",
  "Bag Destination",
  "Route / Zone",
  "Exception Reason",
  "Damage Note",
  "Missing Parcel Note",
  "Validation Status",
  "API Message",
];

function pad3(value: number) {
  return String(Math.max(0, Math.floor(Number(value) || 0))).padStart(3, "0");
}

function mmdd(date: string) {
  const [, month = "00", day = "00"] = (date || "").split("-");
  return `${month}${day}`;
}

export function generateOperationalIds(date: string, merchantCode: string, pickupParcelCount: number): OperationalIds {
  const code = (merchantCode || "XXX").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3).padEnd(3, "X");
  const count = Math.max(1, Number(pickupParcelCount) || 1);
  const day = mmdd(date);
  return {
    pickupId: `P${day}-${code}-${pad3(count)}`,
    deliverId: `D${day}-${code}-${pad3(count + 1)}`,
    invoiceNo: `I${day}-${code}-${pad3(count)}`,
    waybillNo: `W${day}-${code}-${pad3(count)}`,
  };
}

export function generateRiderHandoverRef(date: string, riderId: string, merchantCode: string, sequence = 1) {
  return `RH${mmdd(date)}-${riderId}-${merchantCode.toUpperCase().slice(0, 3)}-${pad3(sequence)}`;
}

export function generateFinanceSettlementBatch(date: string, merchantCode: string, sequence = 1) {
  return `SET${mmdd(date)}-${merchantCode.toUpperCase().slice(0, 3)}-${pad3(sequence)}`;
}

export function findMerchant(search: string) {
  const q = search.trim().toLowerCase();
  return merchantMaster.find((merchant) => [merchant.id, merchant.name, merchant.code, merchant.phone].join(" ").toLowerCase().includes(q));
}

export function createShipmentFromMerchant(input: {
  merchant: MerchantMaster;
  pickupDate: string;
  pickupTime?: string;
  parcelCount: number;
  receiverName?: string;
  receiverPhone?: string;
  deliveryAddress?: string;
  township?: string;
  codAmount?: number;
  deliveryFee?: number;
  extraWeightFee?: number;
  prepaidAmount?: number;
  discount?: number;
  serviceType?: string;
  priority?: string;
}): EnterpriseShipment {
  const ids = generateOperationalIds(input.pickupDate, input.merchant.code, input.parcelCount);
  return {
    id: ids.pickupId,
    trackingNo: ids.waybillNo,
    ...ids,
    merchantId: input.merchant.id,
    merchantName: input.merchant.name,
    merchantCode: input.merchant.code,
    receiverName: input.receiverName || "Data Entry Queue",
    receiverPhone: input.receiverPhone || "Pending",
    pickupAddress: input.merchant.pickupAddress,
    deliveryAddress: input.deliveryAddress || "Pending receiver address",
    township: input.township || input.merchant.pickupTownship,
    pickupDate: input.pickupDate,
    pickupTime: input.pickupTime || input.merchant.defaultPickupTime,
    parcelCount: input.parcelCount,
    paymentMethod: input.merchant.paymentMethod,
    codAmount: Number(input.codAmount || 0),
    deliveryFee: Number(input.deliveryFee || 0),
    extraWeightFee: Number(input.extraWeightFee || 0),
    prepaidAmount: Number(input.prepaidAmount || 0),
    discount: Number(input.discount || 0),
    serviceType: input.serviceType || "Standard",
    priority: input.priority || "Normal",
    status: "Pending Pickup",
    podStatus: "Pending",
    handoverStatus: input.merchant.paymentMethod === "COD" ? "Pending Collection" : "Locked",
    invoiceStatus: "Draft",
    settlementStatus: "Pending",
    branch: "YGN-HQ",
    routeZone: `${input.merchant.pickupTownship} Zone`,
  };
}

export const workflowTransitions: Record<OperationalStatus, OperationalStatus[]> = {
  Draft: ["Pending Pickup"],
  "Pending Pickup": ["Pickup Assigned", "Returned"],
  "Pickup Assigned": ["Picked Up", "Failed Attempt"],
  "Picked Up": ["Received"],
  Received: ["In Warehouse"],
  "In Warehouse": ["Sorting", "Failed Attempt"],
  Sorting: ["Bagged", "Failed Attempt"],
  Bagged: ["Dispatched"],
  Dispatched: ["Out for Delivery"],
  "Out for Delivery": ["Delivered", "Failed Attempt"],
  Delivered: ["Finance Pending"],
  "Failed Attempt": ["Out for Delivery", "Returned", "Finance Pending"],
  Returned: ["Finance Pending"],
  "Finance Pending": ["Closed"],
  Closed: [],
};

export function canTransition(from: OperationalStatus, to: OperationalStatus) {
  return workflowTransitions[from]?.includes(to) ?? false;
}

export function nextWarehouseStatus(scanType: ScanType): OperationalStatus {
  if (scanType === "Inbound Scan") return "In Warehouse";
  if (scanType === "Sorting Scan") return "Sorting";
  if (scanType === "Bag Scan") return "Bagged";
  if (scanType === "Dispatch Scan") return "Dispatched";
  return "Failed Attempt";
}

export function calculateTotalCollectable(shipment: Pick<EnterpriseShipment, "codAmount" | "deliveryFee" | "extraWeightFee" | "prepaidAmount" | "discount" | "paymentMethod">) {
  const receiverCharges = shipment.paymentMethod === "Collect" ? shipment.deliveryFee + shipment.extraWeightFee : 0;
  const cod = shipment.paymentMethod === "COD" ? shipment.codAmount : 0;
  return Math.max(0, cod + receiverCharges - shipment.prepaidAmount - shipment.discount);
}

export function calculateMerchantSettlement(shipments: EnterpriseShipment[], merchant: MerchantMaster): MerchantSettlement {
  const merchantShipments = shipments.filter((shipment) => shipment.merchantId === merchant.id);
  const codCollected = merchantShipments.filter((shipment) => shipment.status === "Delivered").reduce((sum, shipment) => sum + shipment.codAmount, 0);
  const deliveryFees = merchantShipments.reduce((sum, shipment) => sum + shipment.deliveryFee, 0);
  const extraWeightFees = merchantShipments.reduce((sum, shipment) => sum + shipment.extraWeightFee, 0);
  const discounts = merchantShipments.reduce((sum, shipment) => sum + shipment.discount, 0);
  const codFees = Math.round(codCollected * 0.01);
  const returnFees = merchantShipments.filter((shipment) => shipment.status === "Returned").length * 1000;
  const deductions = deliveryFees + codFees + extraWeightFees + returnFees - discounts;
  return {
    settlementBatch: generateFinanceSettlementBatch(merchantShipments[0]?.pickupDate || new Date().toISOString().slice(0, 10), merchant.code, 1),
    merchantId: merchant.id,
    merchantCode: merchant.code,
    merchantName: merchant.name,
    codCollected,
    deliveryFees,
    codFees,
    extraWeightFees,
    returnFees,
    discounts,
    deductions,
    netPayable: Math.max(0, codCollected - deductions),
    status: codCollected > 0 ? "Ready for Settlement" : "Pending",
  };
}

export function createRiderHandover(input: {
  riderId: string;
  riderName: string;
  shiftDate: string;
  routeZone: string;
  shipments: EnterpriseShipment[];
  cashReceived: number;
  digitalPaymentTotal?: number;
  verifiedBy?: string;
}): RiderHandover {
  const deliveredCodShipments = input.shipments.filter((shipment) => shipment.status === "Delivered" && shipment.codAmount > 0);
  const totalCodExpected = deliveredCodShipments.reduce((sum, shipment) => sum + shipment.codAmount, 0);
  const digitalPaymentTotal = Number(input.digitalPaymentTotal || 0);
  const totalReceived = Number(input.cashReceived || 0) + digitalPaymentTotal;
  const difference = totalReceived - totalCodExpected;
  const merchantCode = deliveredCodShipments[0]?.merchantCode || "OPS";
  return {
    settlementRef: generateRiderHandoverRef(input.shiftDate, input.riderId, merchantCode, 1),
    riderId: input.riderId,
    riderName: input.riderName,
    shiftDate: input.shiftDate,
    routeZone: input.routeZone,
    totalDeliveredParcels: deliveredCodShipments.length,
    totalCodExpected,
    totalCashReceived: Number(input.cashReceived || 0),
    digitalPaymentTotal,
    shortageOrExcess: difference,
    verifiedBy: input.verifiedBy || "Operations Cashier",
    status: difference === 0 ? "Handed Over" : difference < 0 ? "Shortage" : "Excess",
    notes: difference === 0 ? "COD handover matched completed jobs." : "COD mismatch requires supervisor review.",
  };
}

export function createInvoice(shipments: EnterpriseShipment[], merchant: MerchantMaster, billingPeriod: string): InvoiceRecord {
  const merchantShipments = shipments.filter((shipment) => shipment.merchantId === merchant.id);
  const first = merchantShipments[0] || createShipmentFromMerchant({ merchant, pickupDate: new Date().toISOString().slice(0, 10), parcelCount: 1 });
  const delivered = merchantShipments.filter((shipment) => shipment.status === "Delivered" || shipment.status === "Finance Pending" || shipment.status === "Closed");
  const failedReturned = merchantShipments.filter((shipment) => shipment.status === "Failed Attempt" || shipment.status === "Returned");
  const codCollected = delivered.reduce((sum, shipment) => sum + shipment.codAmount, 0);
  const deliveryCharges = merchantShipments.reduce((sum, shipment) => sum + shipment.deliveryFee, 0);
  const extraWeightFees = merchantShipments.reduce((sum, shipment) => sum + shipment.extraWeightFee, 0);
  const discounts = merchantShipments.reduce((sum, shipment) => sum + shipment.discount, 0);
  const codFees = Math.round(codCollected * 0.01);
  const returnFees = failedReturned.length * 1000;
  const deductions = deliveryCharges + codFees + extraWeightFees + returnFees - discounts;
  return {
    pickupId: first.pickupId,
    deliverId: first.deliverId,
    invoiceNo: first.invoiceNo,
    waybillNo: first.waybillNo,
    merchantId: merchant.id,
    merchantCode: merchant.code,
    merchantName: merchant.name,
    billingPeriod,
    shipmentCount: merchantShipments.length,
    deliveredCount: delivered.length,
    failedReturnedCount: failedReturned.length,
    codCollected,
    deliveryCharges,
    codFees,
    extraWeightFees,
    returnFees,
    discounts,
    deductions,
    netPayableOrReceivable: Math.max(0, codCollected - deductions),
    paymentStatus: "Under Review",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  };
}

export const sampleShipments: EnterpriseShipment[] = [
  {
    ...createShipmentFromMerchant({ merchant: merchantMaster[0], pickupDate: "2026-05-25", parcelCount: 15, receiverName: "Daw Ei Ei", receiverPhone: "09 785 552 114", deliveryAddress: "Sanchaung, Yangon", township: "Sanchaung", codAmount: 35000, deliveryFee: 3500, serviceType: "Same Day", priority: "High" }),
    status: "Delivered",
    riderId: "RD009",
    riderName: "Ko Zaw Min",
    podStatus: "Captured",
    handoverStatus: "Awaiting Handover",
  },
  {
    ...createShipmentFromMerchant({ merchant: merchantMaster[1], pickupDate: "2026-05-25", parcelCount: 15, receiverName: "Data Entry Queue", receiverPhone: "Pending", deliveryAddress: "Pending receiver details", township: "East Dagon", codAmount: 0, deliveryFee: 5200, serviceType: "Standard", priority: "Medium" }),
    status: "Picked Up",
    riderId: "RD010",
    riderName: "Ma Hnin",
  },
  {
    ...createShipmentFromMerchant({ merchant: merchantMaster[2], pickupDate: "2026-05-26", parcelCount: 7, receiverName: "Ko Thant Zin", receiverPhone: "09 456 001 223", deliveryAddress: "Chanmyathazi, Mandalay", township: "Chanmyathazi", codAmount: 0, deliveryFee: 7200, serviceType: "Next Day", priority: "Normal" }),
    status: "In Warehouse",
    riderId: "RD011",
    riderName: "Ko Min Thu",
  },
];

export const financialDashboardMetrics = [
  "COD Collected Today",
  "Pending Rider Handover",
  "Awaiting Operation Verification",
  "Shortage / Excess",
  "On-Hold Settlement",
  "Ready for Merchant Settlement",
  "Merchant Paid Today",
  "Pending Invoices",
  "Overdue Invoices",
  "Waybills Finance Pending",
  "COD Dispute Count",
  "Rider Deduction Total",
  "Branch Cash Balance",
];
