create extension if not exists pgcrypto;

create or replace function public.current_user_email()
returns text
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'email'), '')
$$;

create or replace function public.current_role_token()
returns text
language sql
stable
as $$
  select upper(
    replace(
      replace(
        coalesce(
          auth.jwt() -> 'app_metadata' ->> 'role_code',
          auth.jwt() -> 'app_metadata' ->> 'role',
          auth.jwt() -> 'user_metadata' ->> 'role_code',
          auth.jwt() -> 'user_metadata' ->> 'role',
          ''
        ),
        '-',
        '_'
      ),
      ' ',
      '_'
    )
  )
$$;

create or replace function public.is_wallet_superuser()
returns boolean
language sql
stable
as $$
  select
    lower(public.current_user_email()) = 'md@britiumexpress.com'
    or public.current_role_token() in ('SYS','SUPER_ADMIN','ADMIN')
$$;

create or replace function public.is_finance_operator()
returns boolean
language sql
stable
as $$
  select
    public.is_wallet_superuser()
    or public.current_role_token() in ('FINM','BIL','AR','FINANCE','FINANCE_ADMIN','FINANCE_MANAGER')
$$;

create or replace function public.is_branch_operator()
returns boolean
language sql
stable
as $$
  select
    public.is_wallet_superuser()
    or public.current_role_token() in ('BMG','ROM','BRANCH_MANAGER','BRANCH_ADMIN','BRANCH_SUPERVISOR','BRANCH_OFFICE')
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.wallet_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid null,
  owner_email text null,
  account_type text not null check (account_type in ('CUSTOMER','MERCHANT','FINANCE','RIDER','HELPER','BRANCH','SYSTEM')),
  role_scope text null,
  currency_code text not null default 'MMK',
  status text not null default 'ACTIVE',
  available_balance numeric(14,2) not null default 0,
  pending_balance numeric(14,2) not null default 0,
  branch_code text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists wallet_accounts_owner_type_idx
on public.wallet_accounts (owner_user_id, account_type);

drop trigger if exists wallet_accounts_set_updated_at on public.wallet_accounts;
create trigger wallet_accounts_set_updated_at
before update on public.wallet_accounts
for each row execute function public.set_updated_at();

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_account_id uuid not null references public.wallet_accounts(id) on delete cascade,
  txn_type text not null,
  direction text not null check (direction in ('IN','OUT')),
  amount numeric(14,2) not null check (amount > 0),
  status text not null default 'PENDING',
  approval_status text not null default 'NOT_REQUIRED',
  reference_no text null,
  external_ref text null,
  submitted_by uuid null default auth.uid(),
  approved_by uuid null,
  approved_at timestamptz null,
  description text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists wallet_transactions_wallet_idx
on public.wallet_transactions(wallet_account_id, created_at desc);

create table if not exists public.payment_approvals (
  id uuid primary key default gen_random_uuid(),
  wallet_transaction_id uuid not null references public.wallet_transactions(id) on delete cascade,
  approval_type text not null,
  requested_by uuid null default auth.uid(),
  requested_role text null,
  reviewer_id uuid null,
  reviewer_role text null,
  status text not null default 'PENDING',
  note text null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null
);

create table if not exists public.commission_runs (
  id uuid primary key default gen_random_uuid(),
  run_code text not null unique,
  beneficiary_type text not null,
  period_start date not null,
  period_end date not null,
  status text not null default 'DRAFT',
  total_amount numeric(14,2) not null default 0,
  created_by uuid null default auth.uid(),
  approved_by uuid null,
  approved_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.commission_items (
  id uuid primary key default gen_random_uuid(),
  commission_run_id uuid not null references public.commission_runs(id) on delete cascade,
  wallet_account_id uuid null references public.wallet_accounts(id) on delete set null,
  beneficiary_user_id uuid null,
  beneficiary_name text null,
  role_scope text null,
  trip_count integer not null default 0,
  base_amount numeric(14,2) not null default 0,
  bonus_amount numeric(14,2) not null default 0,
  deduction_amount numeric(14,2) not null default 0,
  net_amount numeric(14,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.branch_settlements (
  id uuid primary key default gen_random_uuid(),
  branch_code text not null,
  settlement_date date not null default current_date,
  cod_collected numeric(14,2) not null default 0,
  expenses numeric(14,2) not null default 0,
  office_commission numeric(14,2) not null default 0,
  rider_commission numeric(14,2) not null default 0,
  helper_commission numeric(14,2) not null default 0,
  net_payable numeric(14,2) not null default 0,
  status text not null default 'PENDING',
  prepared_by uuid null default auth.uid(),
  approved_by uuid null,
  approved_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.wallet_accounts enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.payment_approvals enable row level security;
alter table public.commission_runs enable row level security;
alter table public.commission_items enable row level security;
alter table public.branch_settlements enable row level security;

drop policy if exists "wallet_accounts_select" on public.wallet_accounts;
create policy "wallet_accounts_select"
on public.wallet_accounts
for select
to authenticated
using (
  public.is_wallet_superuser()
  or public.is_finance_operator()
  or owner_user_id = auth.uid()
  or lower(coalesce(owner_email, '')) = lower(public.current_user_email())
  or (public.is_branch_operator() and account_type = 'BRANCH')
);

drop policy if exists "wallet_accounts_insert" on public.wallet_accounts;
create policy "wallet_accounts_insert"
on public.wallet_accounts
for insert
to authenticated
with check (
  public.is_wallet_superuser()
  or public.is_finance_operator()
  or owner_user_id = auth.uid()
  or lower(coalesce(owner_email, '')) = lower(public.current_user_email())
);

drop policy if exists "wallet_accounts_update" on public.wallet_accounts;
create policy "wallet_accounts_update"
on public.wallet_accounts
for update
to authenticated
using (
  public.is_wallet_superuser()
  or public.is_finance_operator()
  or owner_user_id = auth.uid()
)
with check (
  public.is_wallet_superuser()
  or public.is_finance_operator()
  or owner_user_id = auth.uid()
);

drop policy if exists "wallet_transactions_select" on public.wallet_transactions;
create policy "wallet_transactions_select"
on public.wallet_transactions
for select
to authenticated
using (
  public.is_wallet_superuser()
  or public.is_finance_operator()
  or exists (
    select 1
    from public.wallet_accounts wa
    where wa.id = wallet_transactions.wallet_account_id
      and (
        wa.owner_user_id = auth.uid()
        or lower(coalesce(wa.owner_email, '')) = lower(public.current_user_email())
        or (public.is_branch_operator() and wa.account_type = 'BRANCH')
      )
  )
);

drop policy if exists "wallet_transactions_insert" on public.wallet_transactions;
create policy "wallet_transactions_insert"
on public.wallet_transactions
for insert
to authenticated
with check (
  public.is_wallet_superuser()
  or public.is_finance_operator()
  or exists (
    select 1
    from public.wallet_accounts wa
    where wa.id = wallet_transactions.wallet_account_id
      and (
        wa.owner_user_id = auth.uid()
        or lower(coalesce(wa.owner_email, '')) = lower(public.current_user_email())
        or (public.is_branch_operator() and wa.account_type = 'BRANCH')
      )
  )
);

drop policy if exists "wallet_transactions_update" on public.wallet_transactions;
create policy "wallet_transactions_update"
on public.wallet_transactions
for update
to authenticated
using (
  public.is_wallet_superuser()
  or public.is_finance_operator()
)
with check (
  public.is_wallet_superuser()
  or public.is_finance_operator()
);

drop policy if exists "payment_approvals_select" on public.payment_approvals;
create policy "payment_approvals_select"
on public.payment_approvals
for select
to authenticated
using (
  public.is_wallet_superuser()
  or public.is_finance_operator()
);

drop policy if exists "payment_approvals_insert" on public.payment_approvals;
create policy "payment_approvals_insert"
on public.payment_approvals
for insert
to authenticated
with check (
  public.is_wallet_superuser()
  or public.is_finance_operator()
);

drop policy if exists "payment_approvals_update" on public.payment_approvals;
create policy "payment_approvals_update"
on public.payment_approvals
for update
to authenticated
using (
  public.is_wallet_superuser()
  or public.is_finance_operator()
)
with check (
  public.is_wallet_superuser()
  or public.is_finance_operator()
);

drop policy if exists "commission_runs_select" on public.commission_runs;
create policy "commission_runs_select"
on public.commission_runs
for select
to authenticated
using (
  public.is_wallet_superuser()
  or public.is_finance_operator()
  or public.is_branch_operator()
);

drop policy if exists "commission_runs_insert" on public.commission_runs;
create policy "commission_runs_insert"
on public.commission_runs
for insert
to authenticated
with check (
  public.is_wallet_superuser()
  or public.is_finance_operator()
);

drop policy if exists "commission_runs_update" on public.commission_runs;
create policy "commission_runs_update"
on public.commission_runs
for update
to authenticated
using (
  public.is_wallet_superuser()
  or public.is_finance_operator()
)
with check (
  public.is_wallet_superuser()
  or public.is_finance_operator()
);

drop policy if exists "commission_items_select" on public.commission_items;
create policy "commission_items_select"
on public.commission_items
for select
to authenticated
using (
  public.is_wallet_superuser()
  or public.is_finance_operator()
  or exists (
    select 1
    from public.wallet_accounts wa
    where wa.id = commission_items.wallet_account_id
      and (
        wa.owner_user_id = auth.uid()
        or lower(coalesce(wa.owner_email, '')) = lower(public.current_user_email())
        or (public.is_branch_operator() and wa.account_type = 'BRANCH')
      )
  )
);

drop policy if exists "commission_items_insert" on public.commission_items;
create policy "commission_items_insert"
on public.commission_items
for insert
to authenticated
with check (
  public.is_wallet_superuser()
  or public.is_finance_operator()
);

drop policy if exists "branch_settlements_select" on public.branch_settlements;
create policy "branch_settlements_select"
on public.branch_settlements
for select
to authenticated
using (
  public.is_wallet_superuser()
  or public.is_finance_operator()
  or public.is_branch_operator()
);

drop policy if exists "branch_settlements_insert" on public.branch_settlements;
create policy "branch_settlements_insert"
on public.branch_settlements
for insert
to authenticated
with check (
  public.is_wallet_superuser()
  or public.is_finance_operator()
  or public.is_branch_operator()
);

drop policy if exists "branch_settlements_update" on public.branch_settlements;
create policy "branch_settlements_update"
on public.branch_settlements
for update
to authenticated
using (
  public.is_wallet_superuser()
  or public.is_finance_operator()
  or public.is_branch_operator()
)
with check (
  public.is_wallet_superuser()
  or public.is_finance_operator()
  or public.is_branch_operator()
);
