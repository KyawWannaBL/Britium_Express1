import { supabase } from "@/lib/supabase/client";
import type { AppScreen } from "@/lib/appScreens";

export type BackendApiStatus = "success" | "empty" | "error";

export type BackendApiResult = {
  status: BackendApiStatus;
  source: string;
  rows: Record<string, unknown>[];
  raw?: unknown;
  error?: string;
  checked: string[];
  updatedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (!isRecord(payload)) return [];

  const containers = [
    payload.rows,
    payload.data,
    payload.items,
    payload.records,
    payload.queue,
    payload.pickups,
    payload.pickup_requests,
    payload.wayplans,
    payload.way_plans,
    payload.invoices,
    payload.settlements,
    payload.metrics,
  ];

  for (const container of containers) {
    if (Array.isArray(container)) return container.filter(isRecord);
  }

  return Object.keys(payload).length ? [payload] : [];
}

function errorText(error: unknown) {
  if (!error) return "Unknown backend error";
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (isRecord(error)) return String(error.message || error.details || error.code || JSON.stringify(error));
  return String(error);
}

async function tryRpc(rpcName: string): Promise<{ rows: Record<string, unknown>[]; raw: unknown }> {
  const { data, error } = await (supabase as any).rpc(rpcName, {});
  if (error) throw error;
  return { rows: readRows(data), raw: data };
}

async function tryTable(tableName: string, limit: number): Promise<{ rows: Record<string, unknown>[]; raw: unknown }> {
  const { data, error } = await (supabase as any).from(tableName).select("*").limit(limit);
  if (error) throw error;
  return { rows: readRows(data), raw: data };
}

export async function loadScreenBackendData(screen: AppScreen, limit = 25): Promise<BackendApiResult> {
  const checked: string[] = [];
  let lastError = "";

  for (const rpcName of screen.backend.rpc) {
    checked.push(`rpc:${rpcName}`);
    try {
      const result = await tryRpc(rpcName);
      if (result.rows.length) {
        return {
          status: "success",
          source: `rpc:${rpcName}`,
          rows: result.rows,
          raw: result.raw,
          checked,
          updatedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      lastError = errorText(error);
    }
  }

  for (const tableName of screen.backend.tables) {
    checked.push(`table:${tableName}`);
    try {
      const result = await tryTable(tableName, limit);
      if (result.rows.length) {
        return {
          status: "success",
          source: `table:${tableName}`,
          rows: result.rows,
          raw: result.raw,
          checked,
          updatedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      lastError = errorText(error);
    }
  }

  return {
    status: lastError ? "error" : "empty",
    source: "no backend source returned rows",
    rows: [],
    error: lastError || undefined,
    checked,
    updatedAt: new Date().toISOString(),
  };
}

export function subscribeScreenBackend(screen: AppScreen, onChange: () => void) {
  const realtimeTables = Array.from(new Set([...(screen.backend.realtimeTables || []), ...screen.backend.tables])).filter(Boolean);

  if (!realtimeTables.length) return () => undefined;

  const channel = supabase.channel(`screen-sync-${screen.key.toLowerCase()}`);
  realtimeTables.forEach((table) => {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, onChange);
  });
  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function previewColumns(rows: Record<string, unknown>[], maxColumns = 6) {
  const columns = new Set<string>();
  rows.slice(0, 10).forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (columns.size < maxColumns) columns.add(key);
    });
  });
  return Array.from(columns);
}

export function previewValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value).slice(0, 120);
  return String(value);
}
