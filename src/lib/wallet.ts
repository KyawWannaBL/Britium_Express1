import { supabase } from "@/lib/supabase/client";

export type WalletAccountType =
  | "CUSTOMER"
  | "MERCHANT"
  | "FINANCE"
  | "RIDER"
  | "HELPER"
  | "BRANCH"
  | "SYSTEM";

export type WalletAccount = {
  id: string;
  owner_user_id: string | null;
  owner_email: string | null;
  account_type: WalletAccountType;
  role_scope: string | null;
  currency_code: string;
  status: string;
  available_balance: number;
  pending_balance: number;
  branch_code: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type WalletTransaction = {
  id: string;
  wallet_account_id: string;
  txn_type: string;
  direction: "IN" | "OUT";
  amount: number;
  status: string;
  approval_status: string;
  reference_no: string | null;
  external_ref: string | null;
  submitted_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type PaymentApproval = {
  id: string;
  wallet_transaction_id: string;
  approval_type: string;
  requested_by: string | null;
  requested_role: string | null;
  reviewer_id: string | null;
  reviewer_role: string | null;
  status: string;
  note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export type CommissionRun = {
  id: string;
  run_code: string;
  beneficiary_type: string;
  period_start: string;
  period_end: string;
  status: string;
  total_amount: number;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type BranchSettlement = {
  id: string;
  branch_code: string;
  settlement_date: string;
  cod_collected: number;
  expenses: number;
  office_commission: number;
  rider_commission: number;
  helper_commission: number;
  net_payable: number;
  status: string;
  prepared_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function getCurrentSessionUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  return user;
}

export async function getMyWalletAccounts(accountType?: WalletAccountType) {
  const user = await getCurrentSessionUser();
  if (!user) return [];

  let query = supabase
    .from("wallet_accounts")
    .select("*")
    .or(`owner_user_id.eq.${user.id},owner_email.eq.${user.email ?? ""}`)
    .order("created_at", { ascending: false });

  if (accountType) {
    query = query.eq("account_type", accountType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as WalletAccount[];
}

export async function getMyProfileActivities(limit = 10) {
  const user = await getCurrentSessionUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, status, created_at")
    .eq("actor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getWalletTransactions(walletAccountId: string, limit = 20) {
  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("wallet_account_id", walletAccountId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as WalletTransaction[];
}

export async function createWalletTransaction(input: {
  wallet_account_id: string;
  txn_type: string;
  direction: "IN" | "OUT";
  amount: number;
  status?: string;
  approval_status?: string;
  reference_no?: string | null;
  external_ref?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabase
    .from("wallet_transactions")
    .insert({
      wallet_account_id: input.wallet_account_id,
      txn_type: input.txn_type,
      direction: input.direction,
      amount: input.amount,
      status: input.status ?? "PENDING",
      approval_status: input.approval_status ?? "NOT_REQUIRED",
      reference_no: input.reference_no ?? null,
      external_ref: input.external_ref ?? null,
      description: input.description ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as WalletTransaction;
}

export async function submitPaymentApproval(input: {
  wallet_transaction_id: string;
  approval_type: string;
  requested_role?: string | null;
  reviewer_role?: string | null;
  note?: string | null;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("payment_approvals")
    .insert({
      wallet_transaction_id: input.wallet_transaction_id,
      approval_type: input.approval_type,
      requested_by: user?.id ?? null,
      requested_role: input.requested_role ?? null,
      reviewer_role: input.reviewer_role ?? null,
      note: input.note ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as PaymentApproval;
}

export async function listCommissionRuns(limit = 20) {
  const { data, error } = await supabase
    .from("commission_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as CommissionRun[];
}

export async function listBranchSettlements(limit = 20) {
  const { data, error } = await supabase
    .from("branch_settlements")
    .select("*")
    .order("settlement_date", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as BranchSettlement[];
}
