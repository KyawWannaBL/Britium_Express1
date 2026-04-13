import { ScreenCode, hasScreenAccess } from "@/lib/rbac";

export const PRODUCTION_DELIVERY_SCREENS = {
  CREATE_DELIVERY: "OPS-01",
  PICKUP_EXECUTION: "PUP-03",
  WAREHOUSE_EXECUTION: "HUB-02",
  DELIVERY_EXECUTION: "OPS-05",
  WAY_MANAGEMENT: "PUP-05",
  FOCUSED_WAY_LIST: "PUP-06",
  PARCEL_INTAKE: "HUB-01",
  OCR_WORKBENCH: "HUB-03",
  LIVE_TRACKING: "OPS-07",
} as const satisfies Record<string, ScreenCode>;

export function canUseProductionScreen(role: string | null | undefined, screen: ScreenCode) {
  return hasScreenAccess(role, screen);
}
