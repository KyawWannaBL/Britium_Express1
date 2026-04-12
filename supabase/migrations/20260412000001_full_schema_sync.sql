


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."app_role" AS ENUM (
    'APP_OWNER',
    'SUPER_ADMIN',
    'OPERATIONS_ADMIN',
    'FINANCE_ADMIN',
    'HR_ADMIN',
    'SUPERVISOR',
    'WAREHOUSE_MANAGER',
    'SUBSTATION_MANAGER',
    'MARKETING_ADMIN',
    'CUSTOMER_SERVICE_ADMIN',
    'FINANCE_USER',
    'OPERATIONS_STAFF',
    'CUSTOMER_SERVICE',
    'MARKETING',
    'RIDER',
    'DRIVER',
    'HELPER',
    'DATA_ENTRY',
    'STAFF',
    'FINANCE_STAFF',
    'MERCHANT',
    'CUSTOMER',
    'ADMIN',
    'admin',
    'MANAGER',
    'CASHIER',
    'SYS',
    'HUB_MANAGER',
    'DISPATCHER',
    'GUEST',
    'merchant',
    'FINANCE_CASHIER',
    'FINANCE_SENIOR',
    'OPT_MGR'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."complaint_category" AS ENUM (
    'delivery_delay',
    'damaged_package',
    'lost_package',
    'wrong_address',
    'poor_service',
    'payment_issue',
    'other'
);


ALTER TYPE "public"."complaint_category" OWNER TO "postgres";


CREATE TYPE "public"."complaint_status" AS ENUM (
    'open',
    'in_progress',
    'resolved',
    'closed',
    'escalated'
);


ALTER TYPE "public"."complaint_status" OWNER TO "postgres";


CREATE TYPE "public"."delivery_status" AS ENUM (
    'pending',
    'assigned',
    'picked_up',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'failed',
    'returned',
    'cancelled'
);


ALTER TYPE "public"."delivery_status" OWNER TO "postgres";


CREATE TYPE "public"."employee_role" AS ENUM (
    'super-admin',
    'admin',
    'supervisor',
    'wayplan-manager',
    'driver',
    'rider',
    'warehouse-staff',
    'customer-service',
    'data-entry',
    'marketing',
    'hr-admin',
    'finance',
    'merchant',
    'customer',
    'super_admin'
);


ALTER TYPE "public"."employee_role" OWNER TO "postgres";


CREATE TYPE "public"."invoice_status" AS ENUM (
    'draft',
    'sent',
    'paid',
    'overdue',
    'cancelled'
);


ALTER TYPE "public"."invoice_status" OWNER TO "postgres";


CREATE TYPE "public"."leave_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);


ALTER TYPE "public"."leave_status" OWNER TO "postgres";


CREATE TYPE "public"."leave_type" AS ENUM (
    'annual',
    'sick',
    'emergency',
    'unpaid',
    'maternity',
    'paternity'
);


ALTER TYPE "public"."leave_type" OWNER TO "postgres";


CREATE TYPE "public"."manifest_status" AS ENUM (
    'draft',
    'assigned',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE "public"."manifest_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_method" AS ENUM (
    'cod',
    'prepaid',
    'credit',
    'bank_transfer'
);


ALTER TYPE "public"."payment_method" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'collected',
    'deposited',
    'verified',
    'failed'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."service_type" AS ENUM (
    'standard',
    'express',
    'same_day',
    'next_day',
    'economy'
);


ALTER TYPE "public"."service_type" OWNER TO "postgres";


CREATE TYPE "public"."shipment_status" AS ENUM (
    'draft',
    'pending',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'failed',
    'returned',
    'cancelled'
);


ALTER TYPE "public"."shipment_status" OWNER TO "postgres";


CREATE TYPE "public"."task_priority" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE "public"."task_priority" OWNER TO "postgres";


CREATE TYPE "public"."task_status" AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE "public"."task_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'APP_OWNER',
    'SUPER_ADMIN',
    'FINANCE_ADMIN',
    'OPERATIONS_ADMIN',
    'MARKETING_ADMIN',
    'CUSTOMER_SERVICE_ADMIN',
    'RDR',
    'DES',
    'WH',
    'SUP',
    'SSM',
    'SSR',
    'MERCHANT',
    'CUSTOMER',
    'MARKETING',
    'CUSTOMER_SERVICE',
    'FINANCE_USER',
    'ANALYST'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."vehicle_status" AS ENUM (
    'ACTIVE',
    'IN_USE',
    'MAINTENANCE',
    'OFFLINE',
    'IDLE'
);


ALTER TYPE "public"."vehicle_status" OWNER TO "postgres";


CREATE TYPE "public"."vehicle_type" AS ENUM (
    'bike',
    'van',
    'truck',
    'car'
);


ALTER TYPE "public"."vehicle_type" OWNER TO "postgres";


CREATE TYPE "public"."warehouse_type" AS ENUM (
    'hub',
    'branch',
    'sorting-center',
    'pickup-point'
);


ALTER TYPE "public"."warehouse_type" OWNER TO "postgres";


CREATE TYPE "public"."way_status" AS ENUM (
    'CREATED',
    'TO_ASSIGN',
    'ASSIGNED',
    'ON_WAY',
    'ARRIVED_REQUESTING',
    'PROCESSING',
    'SUCCESSFUL',
    'FAILED',
    'CANCELED',
    'RETURNED'
);


ALTER TYPE "public"."way_status" OWNER TO "postgres";


CREATE TYPE "public"."way_type" AS ENUM (
    'PICKUP',
    'DELIVERY',
    'RETURN'
);


ALTER TYPE "public"."way_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_auth_email_duplicates"() RETURNS TABLE("email" "text", "cnt" integer, "user_ids" "uuid"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin_role() then
    raise exception 'Admin only';
  end if;

  return query
  select lower(u.email) as email, count(*)::int as cnt, array_agg(u.id)::uuid[] as user_ids
  from auth.users u
  where u.email is not null and trim(u.email) <> ''
  group by lower(u.email)
  having count(*) > 1;
end;
$$;


ALTER FUNCTION "public"."admin_auth_email_duplicates"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."api_report_audit_logs"("p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_sort_by" "text" DEFAULT 'event_time'::"text", "p_sort_order" "text" DEFAULT 'desc'::"text", "p_date_from" "date" DEFAULT NULL::"date", "p_date_to" "date" DEFAULT NULL::"date", "p_user" "text" DEFAULT NULL::"text", "p_module" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_offset integer := greatest((p_page - 1) * p_page_size, 0);
  v_total integer;
  v_items jsonb;
begin
  select count(*)
    into v_total
  from rpt_audit_logs r
  where (p_date_from is null or r.event_time::date >= p_date_from)
    and (p_date_to is null or r.event_time::date <= p_date_to)
    and (p_user is null or r.user_email ilike '%' || p_user || '%')
    and (p_module is null or r.module ilike '%' || p_module || '%');

  select jsonb_agg(to_jsonb(x))
    into v_items
  from (
    select *
    from rpt_audit_logs r
    where (p_date_from is null or r.event_time::date >= p_date_from)
      and (p_date_to is null or r.event_time::date <= p_date_to)
      and (p_user is null or r.user_email ilike '%' || p_user || '%')
      and (p_module is null or r.module ilike '%' || p_module || '%')
    order by
      case when p_sort_by = 'event_time' and p_sort_order = 'asc' then r.event_time end asc,
      case when p_sort_by = 'event_time' and p_sort_order = 'desc' then r.event_time end desc
    offset v_offset
    limit p_page_size
  ) x;

  return jsonb_build_object(
    'items', coalesce(v_items, '[]'::jsonb),
    'total', coalesce(v_total, 0),
    'page', p_page,
    'pageSize', p_page_size,
    'summary', '{}'::jsonb
  );
end;
$$;


ALTER FUNCTION "public"."api_report_audit_logs"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_user" "text", "p_module" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."api_report_branches"("p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_sort_by" "text" DEFAULT 'branch_name'::"text", "p_sort_order" "text" DEFAULT 'asc'::"text", "p_search" "text" DEFAULT NULL::"text", "p_is_active" boolean DEFAULT NULL::boolean) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_offset integer := greatest((p_page - 1) * p_page_size, 0);
  v_total integer;
  v_items jsonb;
  v_summary jsonb;
begin
  select count(*)
    into v_total
  from rpt_branches r
  where (
      p_search is null
      or r.branch_name ilike '%' || p_search || '%'
      or r.branch_code ilike '%' || p_search || '%'
      or r.environment ilike '%' || p_search || '%'
    )
    and (p_is_active is null or r.is_active = p_is_active);

  select jsonb_agg(to_jsonb(x))
    into v_items
  from (
    select *
    from rpt_branches r
    where (
        p_search is null
        or r.branch_name ilike '%' || p_search || '%'
        or r.branch_code ilike '%' || p_search || '%'
        or r.environment ilike '%' || p_search || '%'
      )
      and (p_is_active is null or r.is_active = p_is_active)
    order by
      case when p_sort_by = 'branch_name' and p_sort_order = 'asc' then r.branch_name end asc,
      case when p_sort_by = 'branch_name' and p_sort_order = 'desc' then r.branch_name end desc,
      case when p_sort_by = 'branch_code' and p_sort_order = 'asc' then r.branch_code end asc,
      case when p_sort_by = 'branch_code' and p_sort_order = 'desc' then r.branch_code end desc,
      case when p_sort_by = 'created_at' and p_sort_order = 'asc' then r.created_at end asc,
      case when p_sort_by = 'created_at' and p_sort_order = 'desc' then r.created_at end desc
    offset v_offset
    limit p_page_size
  ) x;

  select jsonb_build_object(
    'branchCount', count(*),
    'activeBranches', count(*) filter (where is_active = true),
    'inactiveBranches', count(*) filter (where is_active = false)
  )
    into v_summary
  from rpt_branches r
  where (
      p_search is null
      or r.branch_name ilike '%' || p_search || '%'
      or r.branch_code ilike '%' || p_search || '%'
      or r.environment ilike '%' || p_search || '%'
    )
    and (p_is_active is null or r.is_active = p_is_active);

  return jsonb_build_object(
    'items', coalesce(v_items, '[]'::jsonb),
    'total', coalesce(v_total, 0),
    'page', p_page,
    'pageSize', p_page_size,
    'summary', coalesce(v_summary, '{}'::jsonb)
  );
end;
$$;


ALTER FUNCTION "public"."api_report_branches"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_search" "text", "p_is_active" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."api_report_merchants"("p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_sort_by" "text" DEFAULT 'merchant_name'::"text", "p_sort_order" "text" DEFAULT 'asc'::"text", "p_search" "text" DEFAULT NULL::"text", "p_status" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_offset integer := greatest((p_page - 1) * p_page_size, 0);
  v_total integer;
  v_items jsonb;
  v_summary jsonb;
begin
  select count(*)
    into v_total
  from rpt_merchants r
  where (
      p_search is null
      or r.merchant_name ilike '%' || p_search || '%'
      or r.merchant_code ilike '%' || p_search || '%'
      or r.contact_person ilike '%' || p_search || '%'
      or r.email ilike '%' || p_search || '%'
    )
    and (p_status is null or upper(coalesce(r.status, '')) = upper(p_status));

  select jsonb_agg(to_jsonb(x))
    into v_items
  from (
    select *
    from rpt_merchants r
    where (
        p_search is null
        or r.merchant_name ilike '%' || p_search || '%'
        or r.merchant_code ilike '%' || p_search || '%'
        or r.contact_person ilike '%' || p_search || '%'
        or r.email ilike '%' || p_search || '%'
      )
      and (p_status is null or upper(coalesce(r.status, '')) = upper(p_status))
    order by
      case when p_sort_by = 'merchant_name' and p_sort_order = 'asc' then r.merchant_name end asc,
      case when p_sort_by = 'merchant_name' and p_sort_order = 'desc' then r.merchant_name end desc,
      case when p_sort_by = 'merchant_code' and p_sort_order = 'asc' then r.merchant_code end asc,
      case when p_sort_by = 'merchant_code' and p_sort_order = 'desc' then r.merchant_code end desc,
      case when p_sort_by = 'created_at' and p_sort_order = 'asc' then r.created_at end asc,
      case when p_sort_by = 'created_at' and p_sort_order = 'desc' then r.created_at end desc
    offset v_offset
    limit p_page_size
  ) x;

  select jsonb_build_object(
    'merchantCount', count(*),
    'activeMerchants', count(*) filter (where upper(coalesce(status, '')) = 'ACTIVE'),
    'inactiveMerchants', count(*) filter (where upper(coalesce(status, '')) <> 'ACTIVE')
  )
    into v_summary
  from rpt_merchants r
  where (
      p_search is null
      or r.merchant_name ilike '%' || p_search || '%'
      or r.merchant_code ilike '%' || p_search || '%'
      or r.contact_person ilike '%' || p_search || '%'
      or r.email ilike '%' || p_search || '%'
    )
    and (p_status is null or upper(coalesce(r.status, '')) = upper(p_status));

  return jsonb_build_object(
    'items', coalesce(v_items, '[]'::jsonb),
    'total', coalesce(v_total, 0),
    'page', p_page,
    'pageSize', p_page_size,
    'summary', coalesce(v_summary, '{}'::jsonb)
  );
end;
$$;


ALTER FUNCTION "public"."api_report_merchants"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_search" "text", "p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."api_report_overdue_ways_count"("p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_sort_by" "text" DEFAULT 'overdue_count'::"text", "p_sort_order" "text" DEFAULT 'desc'::"text", "p_date_from" "date" DEFAULT NULL::"date", "p_date_to" "date" DEFAULT NULL::"date", "p_branch_id" "uuid" DEFAULT NULL::"uuid", "p_township" "text" DEFAULT NULL::"text", "p_merchant_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_offset integer := greatest((p_page - 1) * p_page_size, 0);
  v_total integer;
  v_items jsonb;
  v_summary jsonb;
begin
  select count(*)
    into v_total
  from rpt_overdue_ways_count r
  where (p_date_from is null or r.report_date::date >= p_date_from)
    and (p_date_to is null or r.report_date::date <= p_date_to)
    and (p_township is null or r.township ilike '%' || p_township || '%')
    and (p_merchant_id is null or r.merchant_id = p_merchant_id);

  select jsonb_agg(to_jsonb(x))
    into v_items
  from (
    select *
    from rpt_overdue_ways_count r
    where (p_date_from is null or r.report_date::date >= p_date_from)
      and (p_date_to is null or r.report_date::date <= p_date_to)
      and (p_township is null or r.township ilike '%' || p_township || '%')
      and (p_merchant_id is null or r.merchant_id = p_merchant_id)
    order by
      case when p_sort_by = 'merchant_name' and p_sort_order = 'asc' then r.merchant_name end asc,
      case when p_sort_by = 'merchant_name' and p_sort_order = 'desc' then r.merchant_name end desc,
      case when p_sort_by = 'township' and p_sort_order = 'asc' then r.township end asc,
      case when p_sort_by = 'township' and p_sort_order = 'desc' then r.township end desc,
      case when p_sort_by = 'overdue_count' and p_sort_order = 'asc' then r.overdue_count end asc,
      case when p_sort_by = 'overdue_count' and p_sort_order = 'desc' then r.overdue_count end desc,
      case when p_sort_by = 'report_date' and p_sort_order = 'asc' then r.report_date end asc,
      case when p_sort_by = 'report_date' and p_sort_order = 'desc' then r.report_date end desc
    offset v_offset
    limit p_page_size
  ) x;

  select jsonb_build_object(
    'overdueCount', coalesce(sum(r.overdue_count), 0)
  )
    into v_summary
  from rpt_overdue_ways_count r
  where (p_date_from is null or r.report_date::date >= p_date_from)
    and (p_date_to is null or r.report_date::date <= p_date_to)
    and (p_township is null or r.township ilike '%' || p_township || '%')
    and (p_merchant_id is null or r.merchant_id = p_merchant_id);

  return jsonb_build_object(
    'items', coalesce(v_items, '[]'::jsonb),
    'total', coalesce(v_total, 0),
    'page', p_page,
    'pageSize', p_page_size,
    'summary', coalesce(v_summary, '{}'::jsonb)
  );
end;
$$;


ALTER FUNCTION "public"."api_report_overdue_ways_count"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch_id" "uuid", "p_township" "text", "p_merchant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."api_report_total_ways_by_town"("p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_sort_by" "text" DEFAULT 'count'::"text", "p_sort_order" "text" DEFAULT 'desc'::"text", "p_date_from" "date" DEFAULT NULL::"date", "p_date_to" "date" DEFAULT NULL::"date", "p_branch_id" "uuid" DEFAULT NULL::"uuid", "p_township" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_offset integer := greatest((p_page - 1) * p_page_size, 0);
  v_total integer;
  v_items jsonb;
  v_summary jsonb;
begin
  select count(*)
    into v_total
  from rpt_total_ways_by_town r
  where (p_date_from is null or r.report_date::date >= p_date_from)
    and (p_date_to is null or r.report_date::date <= p_date_to)
    and (p_township is null or r.township ilike '%' || p_township || '%');

  select jsonb_agg(to_jsonb(x))
    into v_items
  from (
    select *
    from rpt_total_ways_by_town r
    where (p_date_from is null or r.report_date::date >= p_date_from)
      and (p_date_to is null or r.report_date::date <= p_date_to)
      and (p_township is null or r.township ilike '%' || p_township || '%')
    order by
      case when p_sort_by = 'township' and p_sort_order = 'asc' then r.township end asc,
      case when p_sort_by = 'township' and p_sort_order = 'desc' then r.township end desc,
      case when p_sort_by = 'count' and p_sort_order = 'asc' then r.count end asc,
      case when p_sort_by = 'count' and p_sort_order = 'desc' then r.count end desc,
      case when p_sort_by = 'report_date' and p_sort_order = 'asc' then r.report_date end asc,
      case when p_sort_by = 'report_date' and p_sort_order = 'desc' then r.report_date end desc
    offset v_offset
    limit p_page_size
  ) x;

  select jsonb_build_object(
    'totalWays', coalesce(sum(r.count), 0),
    'totalCodAmount', coalesce(sum(r.total_cod_amount), 0),
    'totalWeight', coalesce(sum(r.total_weight), 0)
  )
    into v_summary
  from rpt_total_ways_by_town r
  where (p_date_from is null or r.report_date::date >= p_date_from)
    and (p_date_to is null or r.report_date::date <= p_date_to)
    and (p_township is null or r.township ilike '%' || p_township || '%');

  return jsonb_build_object(
    'items', coalesce(v_items, '[]'::jsonb),
    'total', coalesce(v_total, 0),
    'page', p_page,
    'pageSize', p_page_size,
    'summary', coalesce(v_summary, '{}'::jsonb)
  );
end;
$$;


ALTER FUNCTION "public"."api_report_total_ways_by_town"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch_id" "uuid", "p_township" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."api_report_ways_by_merchants"("p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_sort_by" "text" DEFAULT 'count'::"text", "p_sort_order" "text" DEFAULT 'desc'::"text", "p_date_from" "date" DEFAULT NULL::"date", "p_date_to" "date" DEFAULT NULL::"date", "p_branch_id" "uuid" DEFAULT NULL::"uuid", "p_merchant_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_offset integer := greatest((p_page - 1) * p_page_size, 0);
  v_total integer;
  v_items jsonb;
  v_summary jsonb;
begin
  select count(*)
    into v_total
  from rpt_ways_by_merchants r
  where (p_date_from is null or r.report_date::date >= p_date_from)
    and (p_date_to is null or r.report_date::date <= p_date_to)
    and (p_merchant_id is null or r.merchant_id = p_merchant_id);

  select jsonb_agg(to_jsonb(x))
    into v_items
  from (
    select *
    from rpt_ways_by_merchants r
    where (p_date_from is null or r.report_date::date >= p_date_from)
      and (p_date_to is null or r.report_date::date <= p_date_to)
      and (p_merchant_id is null or r.merchant_id = p_merchant_id)
    order by
      case when p_sort_by = 'merchant_name' and p_sort_order = 'asc' then r.merchant_name end asc,
      case when p_sort_by = 'merchant_name' and p_sort_order = 'desc' then r.merchant_name end desc,
      case when p_sort_by = 'count' and p_sort_order = 'asc' then r.count end asc,
      case when p_sort_by = 'count' and p_sort_order = 'desc' then r.count end desc,
      case when p_sort_by = 'report_date' and p_sort_order = 'asc' then r.report_date end asc,
      case when p_sort_by = 'report_date' and p_sort_order = 'desc' then r.report_date end desc
    offset v_offset
    limit p_page_size
  ) x;

  select jsonb_build_object(
    'totalWays', coalesce(sum(r.count), 0),
    'totalCodAmount', coalesce(sum(r.total_cod_amount), 0),
    'totalDeliveryFee', coalesce(sum(r.total_delivery_fee), 0)
  )
    into v_summary
  from rpt_ways_by_merchants r
  where (p_date_from is null or r.report_date::date >= p_date_from)
    and (p_date_to is null or r.report_date::date <= p_date_to)
    and (p_merchant_id is null or r.merchant_id = p_merchant_id);

  return jsonb_build_object(
    'items', coalesce(v_items, '[]'::jsonb),
    'total', coalesce(v_total, 0),
    'page', p_page,
    'pageSize', p_page_size,
    'summary', coalesce(v_summary, '{}'::jsonb)
  );
end;
$$;


ALTER FUNCTION "public"."api_report_ways_by_merchants"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch_id" "uuid", "p_merchant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."api_report_ways_count"("p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_sort_by" "text" DEFAULT 'count'::"text", "p_sort_order" "text" DEFAULT 'desc'::"text", "p_date_from" "date" DEFAULT NULL::"date", "p_date_to" "date" DEFAULT NULL::"date", "p_branch_id" "uuid" DEFAULT NULL::"uuid", "p_township" "text" DEFAULT NULL::"text", "p_merchant_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_offset integer := greatest((p_page - 1) * p_page_size, 0);
  v_total integer;
  v_items jsonb;
  v_summary jsonb;
begin
  select count(*)
    into v_total
  from rpt_ways_count_report r
  where (p_date_from is null or r.report_date::date >= p_date_from)
    and (p_date_to is null or r.report_date::date <= p_date_to)
    and (p_branch_id is null or r.branch_id = p_branch_id or r.branch_id is null)
    and (p_township is null or r.township ilike '%' || p_township || '%')
    and (p_merchant_id is null or r.merchant_id = p_merchant_id);

  select jsonb_agg(to_jsonb(x))
    into v_items
  from (
    select *
    from rpt_ways_count_report r
    where (p_date_from is null or r.report_date::date >= p_date_from)
      and (p_date_to is null or r.report_date::date <= p_date_to)
      and (p_branch_id is null or r.branch_id = p_branch_id or r.branch_id is null)
      and (p_township is null or r.township ilike '%' || p_township || '%')
      and (p_merchant_id is null or r.merchant_id = p_merchant_id)
    order by
      case when p_sort_by = 'township' and p_sort_order = 'asc' then r.township end asc,
      case when p_sort_by = 'township' and p_sort_order = 'desc' then r.township end desc,
      case when p_sort_by = 'count' and p_sort_order = 'asc' then r.count end asc,
      case when p_sort_by = 'count' and p_sort_order = 'desc' then r.count end desc,
      case when p_sort_by = 'report_date' and p_sort_order = 'asc' then r.report_date end asc,
      case when p_sort_by = 'report_date' and p_sort_order = 'desc' then r.report_date end desc
    offset v_offset
    limit p_page_size
  ) x;

  select jsonb_build_object(
    'totalWays', coalesce(sum(r.count), 0),
    'totalCodAmount', coalesce(sum(r.total_cod_amount), 0),
    'totalWeight', coalesce(sum(r.total_weight), 0),
    'totalDeliveryFee', coalesce(sum(r.total_delivery_fee), 0)
  )
    into v_summary
  from rpt_ways_count_report r
  where (p_date_from is null or r.report_date::date >= p_date_from)
    and (p_date_to is null or r.report_date::date <= p_date_to)
    and (p_branch_id is null or r.branch_id = p_branch_id or r.branch_id is null)
    and (p_township is null or r.township ilike '%' || p_township || '%')
    and (p_merchant_id is null or r.merchant_id = p_merchant_id);

  return jsonb_build_object(
    'items', coalesce(v_items, '[]'::jsonb),
    'total', coalesce(v_total, 0),
    'page', p_page,
    'pageSize', p_page_size,
    'summary', coalesce(v_summary, '{}'::jsonb)
  );
end;
$$;


ALTER FUNCTION "public"."api_report_ways_count"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch_id" "uuid", "p_township" "text", "p_merchant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."app_role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select nullif(upper(coalesce(
    public.request_jwt() #>> '{app_metadata,role}',
    public.request_jwt() #>> '{app_metadata,app_role}',
    public.jwt_claim('app_role'),
    public.jwt_claim('role')
  )), '');
$$;


ALTER FUNCTION "public"."app_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_dml_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_row_id text;
begin
  v_row_id := coalesce(
    (case when tg_op in ('INSERT','UPDATE') then (to_jsonb(NEW)->>'id') end),
    (case when tg_op = 'DELETE' then (to_jsonb(OLD)->>'id') end),
    (case when tg_op in ('INSERT','UPDATE') then (to_jsonb(NEW)->>'way_id') end),
    (case when tg_op = 'DELETE' then (to_jsonb(OLD)->>'way_id') end)
  );

  insert into public.audit_dml_logs(actor_uid, actor_role, action, table_name, row_id, old_record, new_record)
  values (
    auth.uid(),
    public.app_role(),
    tg_op,
    tg_table_name,
    v_row_id,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(OLD) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(NEW) else null end
  );

  if tg_op = 'DELETE' then return OLD; end if;
  return NEW;
end
$$;


ALTER FUNCTION "public"."audit_dml_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_log_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  v_actor_uid  uuid := auth.uid();
  v_actor_role text := public.effective_role();
  v_row_id     text;
begin
  v_row_id := coalesce(
    (case when tg_op in ('INSERT','UPDATE') then (to_jsonb(NEW)->>'id') end),
    (case when tg_op = 'DELETE' then (to_jsonb(OLD)->>'id') end),
    (case when tg_op in ('INSERT','UPDATE') then (to_jsonb(NEW)->>'way_id') end),
    (case when tg_op = 'DELETE' then (to_jsonb(OLD)->>'way_id') end)
  );

  insert into public.audit_logs(actor_uid, actor_role, action, table_name, row_id, old_record, new_record)
  values (
    v_actor_uid, v_actor_role, tg_op, tg_table_name, v_row_id,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(OLD) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(NEW) else null end
  );

  if tg_op = 'DELETE' then return OLD; end if;
  return NEW;
end
$$;


ALTER FUNCTION "public"."audit_log_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."authenticate_demo_user_2026_02_19_14_00"("p_email" "text", "p_password" "text") RETURNS TABLE("success" boolean, "user_id" "uuid", "email" "text", "role" "text", "full_name" "text", "message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_role TEXT;
  v_full_name TEXT;
BEGIN
  -- Check if user exists and password matches
  SELECT 
    dlc.id,
    dlc.email,
    dlc.role,
    dlc.full_name
  INTO v_user_id, v_email, v_role, v_full_name
  FROM demo_login_credentials_2026_02_19_14_00 dlc
  WHERE dlc.email = p_email 
    AND dlc.password_hash = p_password 
    AND dlc.is_active = true;

  -- If no match found
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Invalid email or password'::TEXT;
  ELSE
    -- Update last login
    UPDATE demo_login_credentials_2026_02_19_14_00 
    SET last_login = NOW(), login_attempts = 0
    WHERE demo_login_credentials_2026_02_19_14_00.email = p_email;
    
    -- Return success
    RETURN QUERY SELECT true, v_user_id, v_email, v_role, v_full_name, 'Login successful'::TEXT;
  END IF;
END;
$$;


ALTER FUNCTION "public"."authenticate_demo_user_2026_02_19_14_00"("p_email" "text", "p_password" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."authenticate_user_2026_02_17_18_40"("user_email" "text", "user_password" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_record public.auth_users_2026_02_17_18_40%ROWTYPE;
    branch_info public.branches_2026_02_17_18_40%ROWTYPE;
    result json;
BEGIN
    -- Get user record
    SELECT * INTO user_record
    FROM public.auth_users_2026_02_17_18_40
    WHERE email = user_email AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invalid credentials');
    END IF;
    
    -- Check if account is locked
    IF user_record.locked_until IS NOT NULL AND user_record.locked_until > now() THEN
        RETURN json_build_object('success', false, 'error', 'Account is temporarily locked');
    END IF;
    
    -- Simple password check (in production, use proper hashing)
    IF user_record.password_hash != user_password THEN
        -- Increment failed attempts
        UPDATE public.auth_users_2026_02_17_18_40
        SET failed_attempts = failed_attempts + 1,
            locked_until = CASE 
                WHEN failed_attempts >= 4 THEN now() + interval '15 minutes'
                ELSE NULL
            END
        WHERE id = user_record.id;
        
        RETURN json_build_object('success', false, 'error', 'Invalid credentials');
    END IF;
    
    -- Get branch info
    SELECT * INTO branch_info
    FROM public.branches_2026_02_17_18_40
    WHERE id = user_record.branch_id;
    
    -- Update successful login
    UPDATE public.auth_users_2026_02_17_18_40
    SET last_login_at = now(), 
        updated_at = now(),
        failed_attempts = 0,
        locked_until = NULL
    WHERE id = user_record.id;
    
    -- Build success result
    result := json_build_object(
        'success', true,
        'user', json_build_object(
            'id', user_record.id,
            'email', user_record.email,
            'full_name', user_record.full_name,
            'role', user_record.role,
            'branch_name', COALESCE(branch_info.name, 'Unknown Branch'),
            'branch_code', COALESCE(branch_info.code, 'UNK'),
            'must_change_password', user_record.must_change_password,
            'is_active', user_record.is_active,
            'last_login_at', user_record.last_login_at
        )
    );
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."authenticate_user_2026_02_17_18_40"("user_email" "text", "user_password" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_approve_on_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Policy: If COD is 0, auto-approve immediately
  IF NEW.cod_amount = 0 THEN
    INSERT INTO public.supply_chain_events (way_id, segment, event_type, note, meta)
    VALUES (NEW.way_id, 'SUPERVISOR', 'SUPV_APPROVED', 'System Auto-Approve: COD=0', '{"auto": true, "force": true}');
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_approve_on_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_assign_resources_2026_02_18_17_00"("p_parcel_ids" "uuid"[]) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_result JSONB := '{"assigned": [], "failed": []}';
    v_parcel_id UUID;
    v_zone VARCHAR(10);
    v_route_id UUID;
    v_rider_id TEXT;
    v_driver_id TEXT;
    v_vehicle_id TEXT;
BEGIN
    FOREACH v_parcel_id IN ARRAY p_parcel_ids
    LOOP
        -- Get parcel zone
        SELECT pickup_zone INTO v_zone
        FROM public.parcels_2026_02_18_17_00
        WHERE id = v_parcel_id;
        
        -- Find or create route for the zone and date
        SELECT id INTO v_route_id
        FROM public.route_plans_2026_02_18_17_00
        WHERE zone = v_zone 
        AND route_date = CURRENT_DATE
        AND status = 'PLANNED'
        AND total_parcels < 20 -- Max parcels per route
        ORDER BY total_parcels ASC
        LIMIT 1;
        
        -- Create new route if none available
        IF v_route_id IS NULL THEN
            INSERT INTO public.route_plans_2026_02_18_17_00 (
                route_code, route_date, zone
            ) VALUES (
                v_zone || '-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
                LPAD((SELECT COUNT(*) + 1 FROM public.route_plans_2026_02_18_17_00 
                      WHERE zone = v_zone AND route_date = CURRENT_DATE)::TEXT, 3, '0'),
                CURRENT_DATE,
                v_zone
            ) RETURNING id INTO v_route_id;
        END IF;
        
        -- Assign available rider
        SELECT personnel_code INTO v_rider_id
        FROM public.delivery_personnel_2026_02_18_17_00
        WHERE role = 'RIDER'
        AND current_status = 'AVAILABLE'
        AND v_zone = ANY(zone_assignments)
        ORDER BY total_deliveries ASC
        LIMIT 1;
        
        -- Assign available vehicle
        SELECT vehicle_code INTO v_vehicle_id
        FROM public.vehicles_2026_02_18_17_00
        WHERE status = 'AVAILABLE'
        AND vehicle_type IN ('MOTORCYCLE', 'VAN')
        ORDER BY capacity_parcels DESC
        LIMIT 1;
        
        -- Update parcel with assignments
        UPDATE public.parcels_2026_02_18_17_00
        SET 
            assigned_route_id = v_route_id,
            assigned_rider_id = v_rider_id,
            assigned_vehicle_id = v_vehicle_id,
            status = 'ASSIGNED',
            updated_at = NOW()
        WHERE id = v_parcel_id;
        
        -- Update route parcel count
        UPDATE public.route_plans_2026_02_18_17_00
        SET total_parcels = total_parcels + 1
        WHERE id = v_route_id;
        
        -- Update personnel status
        IF v_rider_id IS NOT NULL THEN
            UPDATE public.delivery_personnel_2026_02_18_17_00
            SET 
                current_status = 'ASSIGNED',
                current_route_id = v_route_id
            WHERE personnel_code = v_rider_id;
        END IF;
        
        -- Update vehicle status
        IF v_vehicle_id IS NOT NULL THEN
            UPDATE public.vehicles_2026_02_18_17_00
            SET 
                status = 'ASSIGNED',
                current_route_id = v_route_id
            WHERE vehicle_code = v_vehicle_id;
        END IF;
        
        -- Add to result
        v_result := jsonb_set(
            v_result,
            '{assigned}',
            (v_result->'assigned') || jsonb_build_object(
                'parcel_id', v_parcel_id,
                'route_id', v_route_id,
                'rider_id', v_rider_id,
                'vehicle_id', v_vehicle_id
            )
        );
    END LOOP;
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."auto_assign_resources_2026_02_18_17_00"("p_parcel_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_assign_shipment_2026_02_19_17_00"("p_shipment_id" "uuid", "p_shipment_data" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_assignment_result JSONB := '{"success": false}';
    v_rule RECORD;
    v_branch_id UUID;
    v_user_id UUID;
    v_priority INTEGER := 5;
BEGIN
    -- Get applicable assignment rules
    FOR v_rule IN 
        SELECT * FROM shipment_assignment_rules_2026_02_19_17_00 
        WHERE is_active = true 
        ORDER BY priority ASC
    LOOP
        -- Check if rule conditions match (simplified logic)
        IF v_rule.rule_type = 'PICKUP' THEN
            -- Find nearest branch for pickup
            SELECT id INTO v_branch_id 
            FROM branches_2026_02_19_13_00 
            WHERE status = 'ACTIVE' 
            ORDER BY RANDOM() 
            LIMIT 1;
            
            -- Find available user at branch
            SELECT id INTO v_user_id 
            FROM users_2026_02_19_13_00 
            WHERE branch_id = v_branch_id 
            AND role IN ('WAREHOUSE_MANAGER', 'SUPERVISOR')
            AND status = 'ACTIVE'
            ORDER BY RANDOM()
            LIMIT 1;
            
            -- Create workflow state
            INSERT INTO shipment_workflow_states_2026_02_19_17_00 (
                shipment_id, current_state, assigned_to_user_id, 
                assigned_to_branch_id, auto_assigned, assignment_reason
            ) VALUES (
                p_shipment_id, 'PENDING_PICKUP', v_user_id, 
                v_branch_id, true, v_rule.rule_name
            );
            
            -- Add to assignment queue
            INSERT INTO assignment_queue_2026_02_19_17_00 (
                shipment_id, queue_type, branch_id, assigned_user_id, priority
            ) VALUES (
                p_shipment_id, 'PICKUP', v_branch_id, v_user_id, v_priority
            );
            
            -- Create notification
            INSERT INTO realtime_notifications_2026_02_19_17_00 (
                user_id, notification_type, title, message, data, action_required, action_url
            ) VALUES (
                v_user_id, 'PICKUP_ASSIGNMENT', 'New Pickup Assignment',
                'A new shipment has been assigned for pickup', 
                jsonb_build_object('shipment_id', p_shipment_id, 'branch_id', v_branch_id),
                true, '/warehouse/receiving'
            );
            
            v_assignment_result := jsonb_build_object(
                'success', true,
                'assigned_to_branch', v_branch_id,
                'assigned_to_user', v_user_id,
                'workflow_state', 'PENDING_PICKUP',
                'rule_applied', v_rule.rule_name
            );
            
            EXIT; -- Exit after first successful assignment
        END IF;
    END LOOP;
    
    RETURN v_assignment_result;
END;
$$;


ALTER FUNCTION "public"."auto_assign_shipment_2026_02_19_17_00"("p_shipment_id" "uuid", "p_shipment_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bulk_create_shipments_portal"("p_rows" "jsonb") RETURNS TABLE("ok" boolean, "way_id" "text", "shipment_id" "uuid", "error" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  r jsonb;
  sid uuid;
  wid text;
begin
  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'p_rows must be jsonb array';
  end if;

  for r in select * from jsonb_array_elements(p_rows)
  loop
    begin
      select shipment_id, way_id
      into sid, wid
      from public.create_shipment_portal(
        r->>'sender_name',
        r->>'sender_phone',
        r->>'sender_address',
        r->>'sender_city',
        r->>'sender_state',
        r->>'receiver_name',
        r->>'receiver_phone',
        r->>'receiver_address',
        r->>'receiver_city',
        coalesce(r->>'receiver_state','MM'),
        (r->>'item_price')::numeric,
        (r->>'delivery_fee')::numeric,
        coalesce((r->>'cod_amount')::numeric, 0),
        nullif(r->>'package_weight','')::numeric,
        coalesce(nullif(r->>'cbm','')::numeric, 1),
        coalesce(r->>'delivery_type','Normal'),
        r->>'remarks',
        nullif(r->>'pickup_branch_id','')::uuid,
        nullif(r->>'delivery_branch_id','')::uuid
      );

      ok := true; way_id := wid; shipment_id := sid; error := null;
      return next;
    exception when others then
      ok := false; way_id := null; shipment_id := null; error := sqlerrm;
      return next;
    end;
  end loop;

end;
$$;


ALTER FUNCTION "public"."bulk_create_shipments_portal"("p_rows" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_distance_km_2026_02_18_17_00"("lat1" numeric, "lon1" numeric, "lat2" numeric, "lon2" numeric) RETURNS numeric
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    R DECIMAL := 6371; -- Earth's radius in kilometers
    dLat DECIMAL;
    dLon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dLat := RADIANS(lat2 - lat1);
    dLon := RADIANS(lon2 - lon1);
    
    a := SIN(dLat/2) * SIN(dLat/2) + 
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
         SIN(dLon/2) * SIN(dLon/2);
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    RETURN R * c;
END;
$$;


ALTER FUNCTION "public"."calculate_distance_km_2026_02_18_17_00"("lat1" numeric, "lon1" numeric, "lat2" numeric, "lon2" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_domestic_rate"("p_from_state" character varying, "p_to_state" character varying, "p_weight" numeric, "p_service_type" character varying DEFAULT 'STANDARD'::character varying) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    from_zone VARCHAR(50);
    to_zone VARCHAR(50);
    base_rate DECIMAL(10,2);
    per_kg_rate DECIMAL(10,2);
    remote_surcharge DECIMAL(10,2);
    fuel_surcharge_percent DECIMAL(5,2);
    total_cost DECIMAL(10,2);
    result JSONB;
BEGIN
    -- Get zones for states
    SELECT zone INTO from_zone
    FROM public.myanmar_locations_2026_02_19_13_00
    WHERE state_division = p_from_state
    LIMIT 1;
    
    SELECT zone INTO to_zone
    FROM public.myanmar_locations_2026_02_19_13_00
    WHERE state_division = p_to_state
    LIMIT 1;
    
    -- Get rate information
    SELECT dr.base_rate, dr.per_kg_rate, dr.remote_area_surcharge, dr.fuel_surcharge_percent
    INTO base_rate, per_kg_rate, remote_surcharge, fuel_surcharge_percent
    FROM public.domestic_rates_2026_02_19_13_00 dr
    WHERE dr.from_zone = from_zone
    AND dr.to_zone = to_zone
    AND dr.service_type = p_service_type
    AND p_weight >= dr.weight_from
    AND p_weight <= dr.weight_to
    AND dr.effective_from <= CURRENT_DATE
    AND (dr.effective_to IS NULL OR dr.effective_to >= CURRENT_DATE)
    ORDER BY dr.weight_from DESC
    LIMIT 1;
    
    -- Calculate total cost
    IF base_rate IS NOT NULL THEN
        total_cost := base_rate + (p_weight * per_kg_rate) + remote_surcharge;
        total_cost := total_cost + (total_cost * fuel_surcharge_percent / 100);
        
        result := jsonb_build_object(
            'success', true,
            'base_rate', base_rate,
            'per_kg_rate', per_kg_rate,
            'weight', p_weight,
            'remote_surcharge', remote_surcharge,
            'fuel_surcharge_percent', fuel_surcharge_percent,
            'total_cost', ROUND(total_cost, 2),
            'currency', 'MMK',
            'service_type', p_service_type
        );
    ELSE
        result := jsonb_build_object(
            'success', false,
            'error', 'No rate found for the specified route and weight'
        );
    END IF;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."calculate_domestic_rate"("p_from_state" character varying, "p_to_state" character varying, "p_weight" numeric, "p_service_type" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_domestic_rate_2026_02_18_18_00"("p_weight_kg" numeric, "p_township_id" "uuid", "p_service_type" character varying, "p_cod_amount" numeric DEFAULT 0, "p_declared_value" numeric DEFAULT 0) RETURNS "jsonb"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    v_township RECORD;
    v_state RECORD;
    v_rate RECORD;
    v_base_rate DECIMAL;
    v_zone_multiplier DECIMAL;
    v_cod_fee DECIMAL := 0;
    v_insurance_fee DECIMAL := 0;
    v_fuel_surcharge DECIMAL;
    v_total DECIMAL;
    v_delivery_days INTEGER;
BEGIN
    -- Get township information
    SELECT * INTO v_township
    FROM public.townships_2026_02_18_18_00
    WHERE id = p_township_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Township not found');
    END IF;
    
    -- Get state information
    SELECT * INTO v_state
    FROM public.myanmar_states_divisions_2026_02_18_18_00
    WHERE id = v_township.state_division_id;
    
    -- Get applicable rate
    SELECT * INTO v_rate
    FROM public.domestic_shipping_rates_2026_02_18_18_00
    WHERE service_type = p_service_type
    AND p_weight_kg >= weight_from_kg 
    AND p_weight_kg <= weight_to_kg
    AND is_active = true
    ORDER BY weight_from_kg DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'No rate found for this weight');
    END IF;
    
    -- Calculate base rate
    v_base_rate := v_rate.base_rate_mmk;
    
    -- Apply zone multiplier
    v_zone_multiplier := CASE v_state.zone_classification
        WHEN 'METRO' THEN v_rate.metro_multiplier
        WHEN 'STANDARD' THEN v_rate.standard_multiplier
        WHEN 'REMOTE' THEN v_rate.remote_multiplier
        ELSE 1.00
    END;
    
    v_base_rate := v_base_rate * v_zone_multiplier * v_township.rate_multiplier;
    
    -- Calculate COD fee
    IF p_cod_amount > 0 THEN
        v_cod_fee := GREATEST(v_rate.cod_fee_mmk, p_cod_amount * v_rate.cod_percentage / 100);
    END IF;
    
    -- Calculate insurance fee
    IF p_declared_value > 0 THEN
        v_insurance_fee := p_declared_value * v_rate.insurance_percentage / 100;
    END IF;
    
    -- Calculate fuel surcharge
    v_fuel_surcharge := v_base_rate * v_rate.fuel_surcharge_percentage / 100;
    
    -- Calculate total
    v_total := v_base_rate + v_cod_fee + v_insurance_fee + v_fuel_surcharge;
    
    -- Calculate delivery time
    v_delivery_days := v_rate.delivery_time_days + COALESCE(v_township.delivery_time_days, 0);
    
    RETURN jsonb_build_object(
        'base_rate', v_base_rate,
        'zone_multiplier', v_zone_multiplier,
        'cod_fee', v_cod_fee,
        'insurance_fee', v_insurance_fee,
        'fuel_surcharge', v_fuel_surcharge,
        'total_amount', v_total,
        'currency', 'MMK',
        'delivery_days', v_delivery_days,
        'service_type', p_service_type,
        'destination', jsonb_build_object(
            'township', v_township.name_en,
            'township_mm', v_township.name_mm,
            'zone', v_state.zone_classification
        )
    );
END;
$$;


ALTER FUNCTION "public"."calculate_domestic_rate_2026_02_18_18_00"("p_weight_kg" numeric, "p_township_id" "uuid", "p_service_type" character varying, "p_cod_amount" numeric, "p_declared_value" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_merchant_payout"("way_id_input" "text") RETURNS TABLE("net_payout" numeric, "service_fees" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (cod_amount - (delivery_fee + extra_weight_charges)) as net_payout,
    (delivery_fee + extra_weight_charges) as service_fees
  FROM way_records
  WHERE way_id = way_id_input AND status = 'SUCCESSFUL';
END;
$$;


ALTER FUNCTION "public"."calculate_merchant_payout"("way_id_input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_branch"("p_branch" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  select exists (
    select 1
    from public.user_branch_assignments uba
    where uba.user_id = auth.uid()
      and uba.branch_id = p_branch
  );
$$;


ALTER FUNCTION "public"."can_access_branch"("p_branch" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_hierarchy"("target_branch" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    AS $$
declare
  user_scope int;
  user_branch uuid;
  user_region uuid;
  target_region uuid;
begin

  -- Company-wide access
  if public.has_role('SUPER_ADMIN') or public.has_role('APP_OWNER') then
    return true;
  end if;

  -- Get user scope level
  select r.scope_level into user_scope
  from public.roles r
  join public.profiles p on lower(r.code::text) = lower(p.role::text)
  where p.id = auth.uid();

  if user_scope is null then
    return false;
  end if;

  -- S3 branch scope
  if user_scope = 3 then
    return exists (
      select 1
      from public.user_branch_assignments uba
      where uba.user_id = auth.uid()
        and uba.branch_id = target_branch
    );
  end if;

  -- S4 regional scope
  if user_scope = 4 then
    select region_id into user_region
    from public.branches b
    join public.user_branch_assignments uba
      on uba.branch_id = b.id
    where uba.user_id = auth.uid()
    limit 1;

    select region_id into target_region
    from public.branches
    where id = target_branch;

    return user_region = target_region;
  end if;

  return false;

end;
$$;


ALTER FUNCTION "public"."can_access_hierarchy"("target_branch" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_record"("p_created_by" "uuid", "p_branch_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_role text;
begin

  select role into v_role
  from public.profiles
  where id = auth.uid();

  if v_role in ('APP_OWNER','SUPER_ADMIN') then
    return true;
  end if;

  if p_created_by = auth.uid() then
    return true;
  end if;

  if can_access_branch(p_branch_id) then
    return true;
  end if;

  return false;
end;
$$;


ALTER FUNCTION "public"."can_access_record"("p_created_by" "uuid", "p_branch_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_approve_approval"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select public.current_app_role() in (
    'SUPER_ADMIN',
    'SYS',
    'APP_OWNER',
    'FINANCE_ADMIN'
  );
$$;


ALTER FUNCTION "public"."can_approve_approval"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_reject_approval"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select public.current_app_role() in (
    'SUPER_ADMIN',
    'SYS',
    'APP_OWNER',
    'FINANCE_ADMIN'
  );
$$;


ALTER FUNCTION "public"."can_reject_approval"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_submit_approval"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select public.current_app_role() in (
    'SUPER_ADMIN',
    'SYS',
    'APP_OWNER',
    'FINANCE',
    'FINANCE_ADMIN',
    'ACCOUNTANT',
    'SUPERVISOR',
    'OPERATIONS_ADMIN'
  );
$$;


ALTER FUNCTION "public"."can_submit_approval"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."change_user_password_2026_02_17_18_40"("user_id" "uuid", "new_password" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.auth_users_2026_02_17_18_40
    SET password_hash = new_password,
        must_change_password = false,
        updated_at = now()
    WHERE id = user_id AND is_active = true;
    
    IF FOUND THEN
        RETURN json_build_object('success', true, 'message', 'Password changed successfully');
    ELSE
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
END;
$$;


ALTER FUNCTION "public"."change_user_password_2026_02_17_18_40"("user_id" "uuid", "new_password" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_geofence_2026_02_18_18_00"("p_lat" numeric, "p_lng" numeric, "p_geofence_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    v_geofence RECORD;
    v_distance DECIMAL;
BEGIN
    SELECT center_lat, center_lng, radius_meters, is_active
    INTO v_geofence
    FROM public.geofences_2026_02_18_18_00
    WHERE id = p_geofence_id;
    
    IF NOT FOUND OR NOT v_geofence.is_active THEN
        RETURN false;
    END IF;
    
    -- Calculate distance using Haversine formula
    v_distance := public.calculate_distance_km_2026_02_18_17_00(
        p_lat, p_lng, v_geofence.center_lat, v_geofence.center_lng
    ) * 1000; -- convert to meters
    
    RETURN v_distance <= v_geofence.radius_meters;
END;
$$;


ALTER FUNCTION "public"."check_geofence_2026_02_18_18_00"("p_lat" numeric, "p_lng" numeric, "p_geofence_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_security_clearance"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND must_change_password = false
  );
END;
$$;


ALTER FUNCTION "public"."check_security_clearance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."city_code"("p_city" "text") RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare c text := upper(regexp_replace(coalesce(p_city,''), '\s+', '', 'g'));
begin
  if c like 'YANGON%' or c = 'YGN' then return 'YGN'; end if;
  if c like 'MANDALAY%' or c = 'MDY' then return 'MDY'; end if;
  if c like 'NAYPYITAW%' or c like 'NAYPYITAW%' or c = 'NPT' then return 'NPT'; end if;

  -- fallback: first 3 letters (or 1 if short)
  if length(c) >= 3 then return substr(c, 1, 3); end if;
  if length(c) = 2 then return c; end if;
  if length(c) = 1 then return c; end if;
  return 'UNK';
end;
$$;


ALTER FUNCTION "public"."city_code"("p_city" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clear_must_change_password"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.profiles
  SET must_change_password = false
  WHERE id = auth.uid();
END;
$$;


ALTER FUNCTION "public"."clear_must_change_password"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."col_type"("p_table" "regclass", "p_col" "text") RETURNS "regtype"
    LANGUAGE "sql" STABLE
    AS $$
  select a.atttypid::regtype from pg_attribute a where a.attrelid = p_table and a.attname = p_col and a.attnum > 0 and not a.attisdropped limit 1;
$$;


ALTER FUNCTION "public"."col_type"("p_table" "regclass", "p_col" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_managed_user"("user_email" "text", "user_password" "text", "user_full_name" "text", "user_role" "text", "user_scope" "text" DEFAULT 'all'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- 1. Create the user in Auth
  INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES (
    user_email, 
    crypt(user_password, gen_salt('bf')), 
    now(), 
    jsonb_build_object('full_name', user_full_name, 'role', user_role)
  )
  RETURNING id INTO new_user_id;

  -- 2. Create the profile
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (new_user_id, user_email, user_full_name, user_role, 'ACTIVE');

  -- 3. Create the versioned user record (Matches your 2026_02_28 schema)
  INSERT INTO public.users_2026_02_28_20_06 (id, email, name, app_role, data_scope, status)
  VALUES (new_user_id, user_email, user_full_name, lower(user_role), user_scope, 'active');

  RETURN new_user_id;
END;
$$;


ALTER FUNCTION "public"."create_managed_user"("user_email" "text", "user_password" "text", "user_full_name" "text", "user_role" "text", "user_scope" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification"("p_recipient_id" "uuid", "p_title" character varying, "p_message" "text", "p_type" character varying DEFAULT 'INFO'::character varying, "p_category" character varying DEFAULT NULL::character varying, "p_reference_type" character varying DEFAULT NULL::character varying, "p_reference_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications_2026_02_19_13_00 (
        recipient_id, title, message, type, category, reference_type, reference_id
    ) VALUES (
        p_recipient_id, p_title, p_message, p_type, p_category, p_reference_type, p_reference_id
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;


ALTER FUNCTION "public"."create_notification"("p_recipient_id" "uuid", "p_title" character varying, "p_message" "text", "p_type" character varying, "p_category" character varying, "p_reference_type" character varying, "p_reference_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_shipment"("p_merchant_id" "uuid", "p_customer_id" "uuid", "p_sender_name" character varying, "p_sender_phone" character varying, "p_sender_address" "text", "p_sender_city" character varying, "p_sender_state" character varying, "p_receiver_name" character varying, "p_receiver_phone" character varying, "p_receiver_address" "text", "p_receiver_city" character varying, "p_receiver_state" character varying, "p_package_type" character varying, "p_weight" numeric, "p_dimensions" "jsonb", "p_declared_value" numeric, "p_contents_description" "text", "p_service_type" character varying, "p_payment_method" character varying, "p_cod_amount" numeric, "p_shipping_cost" numeric, "p_insurance_cost" numeric, "p_total_cost" numeric) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    shipment_id UUID;
    awb_number TEXT;
BEGIN
    -- Generate AWB number
    SELECT generate_awb_number() INTO awb_number;
    
    -- Insert shipment
    INSERT INTO public.shipments_2026_02_19_13_00 (
        awb_number, merchant_id, customer_id,
        sender_name, sender_phone, sender_address, sender_city, sender_state,
        receiver_name, receiver_phone, receiver_address, receiver_city, receiver_state,
        package_type, weight, dimensions, declared_value, contents_description,
        service_type, payment_method, cod_amount, shipping_cost, insurance_cost, total_cost
    ) VALUES (
        awb_number, p_merchant_id, p_customer_id,
        p_sender_name, p_sender_phone, p_sender_address, p_sender_city, p_sender_state,
        p_receiver_name, p_receiver_phone, p_receiver_address, p_receiver_city, p_receiver_state,
        p_package_type, p_weight, p_dimensions, p_declared_value, p_contents_description,
        p_service_type, p_payment_method, p_cod_amount, p_shipping_cost, p_insurance_cost, p_total_cost
    ) RETURNING id INTO shipment_id;
    
    -- Create initial tracking entry
    INSERT INTO public.shipment_tracking_2026_02_19_13_00 (
        shipment_id, status, location, notes
    ) VALUES (
        shipment_id, 'CREATED', p_sender_city, 'Shipment created'
    );
    
    RETURN shipment_id;
END;
$$;


ALTER FUNCTION "public"."create_shipment"("p_merchant_id" "uuid", "p_customer_id" "uuid", "p_sender_name" character varying, "p_sender_phone" character varying, "p_sender_address" "text", "p_sender_city" character varying, "p_sender_state" character varying, "p_receiver_name" character varying, "p_receiver_phone" character varying, "p_receiver_address" "text", "p_receiver_city" character varying, "p_receiver_state" character varying, "p_package_type" character varying, "p_weight" numeric, "p_dimensions" "jsonb", "p_declared_value" numeric, "p_contents_description" "text", "p_service_type" character varying, "p_payment_method" character varying, "p_cod_amount" numeric, "p_shipping_cost" numeric, "p_insurance_cost" numeric, "p_total_cost" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_shipment_data_entry"("p_receiver_name" "text", "p_receiver_phone" "text", "p_receiver_address" "text", "p_receiver_city" "text", "p_receiver_state" "text", "p_delivery_fee" numeric, "p_cod_amount" numeric DEFAULT 0, "p_pickup_branch_id" "uuid" DEFAULT NULL::"uuid", "p_delivery_branch_id" "uuid" DEFAULT NULL::"uuid", "p_package_description" "text" DEFAULT NULL::"text", "p_package_weight" numeric DEFAULT NULL::numeric) RETURNS TABLE("shipment_id" "uuid", "way_id" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_way text;
  v_total numeric;
  v_sid uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.has_any_role(array['data-entry','OPERATIONS_ADMIN','SUPERVISOR','APP_OWNER','SUPER_ADMIN','SYS']) then
    raise exception 'Role % is not allowed for Data Entry shipment creation', public.app_role();
  end if;

  -- EN: Generate unique WAY ID
  -- MY: WAY ID တည်ဆောက်
  v_way := 'BTX-' || upper(to_char(now(), 'YYMMDDHH24MISS')) || '-' || upper(substr(encode(gen_random_bytes(2),'hex'), 1, 4));
  v_total := coalesce(p_delivery_fee,0) + coalesce(p_cod_amount,0);

  insert into public.shipments (
    way_id,
    receiver_name, receiver_phone, receiver_address, receiver_city, receiver_state,
    pickup_branch_id, delivery_branch_id,
    package_description, package_weight,
    delivery_fee, cod_amount, insurance_fee, total_amount,
    created_by,
    status
  ) values (
    v_way,
    p_receiver_name, p_receiver_phone, p_receiver_address, p_receiver_city, p_receiver_state,
    p_pickup_branch_id, p_delivery_branch_id,
    p_package_description, p_package_weight,
    coalesce(p_delivery_fee,0), coalesce(p_cod_amount,0), 0, v_total,
    auth.uid(),
    'PENDING'
  )
  returning id into v_sid;

  -- Create customer-visible tracking row
  insert into public.shipment_tracking (shipment_id, status, notes, handled_by, is_customer_visible)
  values (v_sid, 'pending', 'Shipment created by Data Entry (awaiting approval)', auth.uid(), true);

  -- Create approval request if table exists
  if to_regclass('public.shipment_approvals') is not null then
    insert into public.shipment_approvals (shipment_id, status, requested_by)
    values (v_sid, 'PENDING', auth.uid());
  end if;

  return query select v_sid, v_way;
end;
$$;


ALTER FUNCTION "public"."create_shipment_data_entry"("p_receiver_name" "text", "p_receiver_phone" "text", "p_receiver_address" "text", "p_receiver_city" "text", "p_receiver_state" "text", "p_delivery_fee" numeric, "p_cod_amount" numeric, "p_pickup_branch_id" "uuid", "p_delivery_branch_id" "uuid", "p_package_description" "text", "p_package_weight" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_shipment_portal"("p_receiver_name" "text", "p_receiver_phone" "text", "p_receiver_address" "text", "p_receiver_city" "text", "p_item_price" numeric DEFAULT 0, "p_delivery_fee" numeric DEFAULT 0, "p_cod_amount" numeric DEFAULT 0, "p_sender_name" "text" DEFAULT NULL::"text", "p_sender_phone" "text" DEFAULT NULL::"text", "p_sender_address" "text" DEFAULT NULL::"text", "p_sender_city" "text" DEFAULT NULL::"text", "p_package_weight" numeric DEFAULT NULL::numeric, "p_delivery_type" "text" DEFAULT 'normal'::"text", "p_service_type" "text" DEFAULT 'standard'::"text", "p_remarks" "text" DEFAULT NULL::"text", "p_pickup_branch_id" "uuid" DEFAULT NULL::"uuid", "p_delivery_branch_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("shipment_id" "uuid", "way_id" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_way text;
  v_sid uuid;
  v_total numeric;
  v_prepaid numeric;
  v_mer_id uuid;
  v_sender_json jsonb;
  v_recipient_json jsonb;
  v_package_json jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- 1. Resolve Merchant
  SELECT m.id INTO v_mer_id
  FROM public.merchants m
  WHERE lower(m.email) = lower(auth.jwt() ->> 'email')
  LIMIT 1;

  IF v_mer_id IS NULL THEN
    RAISE EXCEPTION 'Merchant not found for email: %', (auth.jwt() ->> 'email');
  END IF;

  -- 2. Build Legacy JSONB Objects
  SELECT jsonb_build_object(
    'name', coalesce(p_sender_name, business_name, 'Unknown'),
    'phone', coalesce(p_sender_phone, phone, ''),
    'address', coalesce(p_sender_address, address, '')
  ) INTO v_sender_json 
  FROM public.merchants WHERE id = v_mer_id;

  v_recipient_json := jsonb_build_object(
    'name', p_receiver_name,
    'phone', p_receiver_phone,
    'address', p_receiver_address,
    'city', p_receiver_city
  );

  -- Handle the new 'package_details' constraint
  v_package_json := jsonb_build_object(
    'weight', coalesce(p_package_weight, 0),
    'description', coalesce(p_remarks, 'Standard Parcel'),
    'type', p_delivery_type
  );

  -- 3. Logic
  v_total := coalesce(p_item_price, 0) + coalesce(p_delivery_fee, 0);
  v_prepaid := v_total - coalesce(p_cod_amount, 0);

  v_way := public.generate_waybill_id(
    coalesce(p_sender_city, 'YANGON'), 
    p_receiver_city, 
    NULL, NULL, current_date
  );

  -- 4. The Final Insert
  INSERT INTO public.shipments (
    way_id, awb, merchant_id,
    sender, recipient, package_details, -- All legacy JSONB constraints satisfied
    sender_name, sender_phone, sender_address, sender_city,
    receiver_name, receiver_phone, receiver_address, receiver_city,
    delivery_fee, cod_amount, item_price, prepaid_to_os, total_amount,
    package_weight, delivery_type, service_type, remarks,
    pickup_branch_id, delivery_branch_id,
    created_by, status
  ) VALUES (
    v_way, v_way, v_mer_id,
    v_sender_json, v_recipient_json, v_package_json,
    p_sender_name, p_sender_phone, p_sender_address, p_sender_city,
    p_receiver_name, p_receiver_phone, p_receiver_address, p_receiver_city,
    p_delivery_fee, p_cod_amount, p_item_price, v_prepaid, v_total,
    p_package_weight, 
    lower(p_delivery_type), 
    lower(p_service_type)::public.service_type, 
    p_remarks,
    p_pickup_branch_id, p_delivery_branch_id,
    auth.uid(), 
    'pending'::public.shipment_status
  ) RETURNING id INTO v_sid;

  RETURN QUERY SELECT v_sid, v_way;
END;
$$;


ALTER FUNCTION "public"."create_shipment_portal"("p_receiver_name" "text", "p_receiver_phone" "text", "p_receiver_address" "text", "p_receiver_city" "text", "p_item_price" numeric, "p_delivery_fee" numeric, "p_cod_amount" numeric, "p_sender_name" "text", "p_sender_phone" "text", "p_sender_address" "text", "p_sender_city" "text", "p_package_weight" numeric, "p_delivery_type" "text", "p_service_type" "text", "p_remarks" "text", "p_pickup_branch_id" "uuid", "p_delivery_branch_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_app_role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select coalesce(
    nullif(upper(coalesce(
      public.request_jwt() #>> '{app_metadata,role}',
      public.request_jwt() #>> '{app_metadata,app_role}',
      public.request_jwt() ->> 'role',
      public.request_jwt() ->> 'app_role'
    )), ''),
    nullif(upper((select role from public.users where id = auth.uid())), ''),
    'GUEST'
  );
$$;


ALTER FUNCTION "public"."current_app_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_branch"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select (public.jwt_claims() ->> 'branch_id')::uuid;
$$;


ALTER FUNCTION "public"."current_branch"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_branch_code"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select coalesce((
    select upper(b.code)
    from public.staff_assignments a
    join public.branches b on b.id = a.location_id
    where a.user_id = auth.uid()
      and a.is_active = true
      and a.location_type = 'BRANCH'
    order by a.created_at desc
    limit 1
  ), '');
$$;


ALTER FUNCTION "public"."current_branch_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_customer_phone"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
declare v_phone text;
begin
  v_phone := public.jwt_claim('phone');
  if v_phone is not null then return v_phone; end if;

  if to_regclass('public.customers') is not null then
    execute 'select phone from public.customers where email = public.jwt_claim(''email'') limit 1' into v_phone;
    return v_phone;
  end if;
  return null;
end
$$;


ALTER FUNCTION "public"."current_customer_phone"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_email"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select nullif(public.jwt_claim('email'), '');
$$;


ALTER FUNCTION "public"."current_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_merchant_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" STABLE
    AS $$
declare v_id uuid;
begin
  if to_regclass('public.merchants') is not null then
    execute 'select id from public.merchants where email = public.jwt_claim(''email'') limit 1' into v_id;
    return v_id;
  end if;
  return null;
end
$$;


ALTER FUNCTION "public"."current_merchant_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_office_tag"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    case
      when exists (
        select 1 from public.staff_assignments a
        where a.user_id = auth.uid() and a.is_active = true and a.location_type = 'BRANCH'
      ) then 'BO'
      else 'HQ'
    end;
$$;


ALTER FUNCTION "public"."current_office_tag"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_public_user_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$ select auth.uid(); $$;


ALTER FUNCTION "public"."current_public_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select public.jwt_claims() ->> 'role';
$$;


ALTER FUNCTION "public"."current_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$ select auth.uid(); $$;


ALTER FUNCTION "public"."current_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_role"() RETURNS "text"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select role::text
  from public.profiles
  where id = auth.uid()
$$;


ALTER FUNCTION "public"."current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."custom_access_token_hook"("event" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    SET "row_security" TO 'off'
    AS $$
declare
  claims jsonb;
  v_role text;
  v_env text;
begin
  -- always start with a valid object
  claims := coalesce(event->'claims', '{}'::jsonb);

  -- enrich from profiles if available (safe even if row missing)
  select role::text, environment
    into v_role, v_env
  from public.profiles
  where id = (event->>'user_id')::uuid;

  if v_role is not null then
    claims := claims || jsonb_build_object('app_role', v_role);
  end if;

  if v_env is not null then
    claims := claims || jsonb_build_object('environment', v_env);
  end if;

  return jsonb_build_object('claims', jsonb_strip_nulls(claims));
end;
$$;


ALTER FUNCTION "public"."custom_access_token_hook"("event" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."db_role"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  r text;
begin
  if to_regclass('public.profiles') is not null then
    execute 'select role::text from public.profiles where id = auth.uid()' into r;
    if r is not null then return r; end if;
  end if;

  if to_regclass('public.users_enhanced') is not null then
    execute 'select role::text from public.users_enhanced where auth_user_id = auth.uid()' into r;
    if r is not null then return r; end if;
  end if;

  if to_regclass('public.admin_users_2026_02_04_16_00') is not null then
    execute 'select role::text from public.admin_users_2026_02_04_16_00 where auth_user_id = auth.uid()' into r;
    if r is not null then return r; end if;
  end if;

  if to_regclass('public.users') is not null then
    execute 'select role::text from public.users where email = public.current_email()' into r;
    if r is not null then return r; end if;
  end if;

  return null;
end
$$;


ALTER FUNCTION "public"."db_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."debug_auth_2026_02_17_18_40"("user_email" "text", "user_password" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_record public.auth_users_2026_02_17_18_40%ROWTYPE;
    branch_info public.branches_2026_02_17_18_40%ROWTYPE;
    result json;
BEGIN
    -- Step 1: Check if user exists
    SELECT * INTO user_record
    FROM public.auth_users_2026_02_17_18_40
    WHERE email = user_email;
    
    IF NOT FOUND THEN
        RETURN json_build_object('step', 'user_lookup', 'found', false, 'email', user_email);
    END IF;
    
    -- Step 2: Check if user is active
    IF NOT user_record.is_active THEN
        RETURN json_build_object('step', 'active_check', 'is_active', false, 'email', user_email);
    END IF;
    
    -- Step 3: Check password
    IF user_record.password_hash != user_password THEN
        RETURN json_build_object(
            'step', 'password_check', 
            'match', false, 
            'provided', user_password,
            'stored', user_record.password_hash
        );
    END IF;
    
    -- Step 4: Get branch info
    SELECT * INTO branch_info
    FROM public.branches_2026_02_17_18_40
    WHERE id = user_record.branch_id;
    
    -- Step 5: Return success
    RETURN json_build_object(
        'step', 'success',
        'user_id', user_record.id,
        'email', user_record.email,
        'role', user_record.role,
        'branch_name', COALESCE(branch_info.name, 'No Branch'),
        'must_change_password', user_record.must_change_password
    );
END;
$$;


ALTER FUNCTION "public"."debug_auth_2026_02_17_18_40"("user_email" "text", "user_password" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."effective_role"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  jwt_role text := public.jwt_claim('app_role');
  dbrole   text := public.db_role();
begin
  if jwt_role is not null and dbrole is not null and jwt_role <> dbrole then return null; end if;
  return coalesce(jwt_role, dbrole);
end
$$;


ALTER FUNCTION "public"."effective_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enable_audit_triggers_all_public_tables"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  r record;
  trg text;
begin
  for r in
    select c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public'
      and c.relkind='r'
      and not exists (
        select 1 from public.audit_trigger_exclusions e
        where e.table_name=c.relname
      )
  loop
    trg := 'tr_audit_dml_' || r.table_name;
    execute format('drop trigger if exists %I on public.%I', trg, r.table_name);
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.audit_dml_trigger()',
      trg, r.table_name
    );
  end loop;
end
$$;


ALTER FUNCTION "public"."enable_audit_triggers_all_public_tables"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enum_first_label"("p_type" "regtype") RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select e.enumlabel from pg_type t join pg_enum e on e.enumtypid = t.oid where t.oid = p_type order by e.enumsortorder limit 1;
$$;


ALTER FUNCTION "public"."enum_first_label"("p_type" "regtype") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_delivery_resolution"("p_awb" character varying, "p_rider_id" "uuid", "p_resolution" character varying, "p_lat" numeric, "p_lng" numeric, "p_evidence_url" "text", "p_receiver_name" character varying, "p_ndr_reason" character varying) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_shipment_status VARCHAR;
BEGIN
  -- Verify Shipment exists
  SELECT status INTO v_shipment_status FROM shipments WHERE awb = p_awb;
  IF v_shipment_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid AWB. Parcel not found.');
  END IF;

  IF p_resolution = 'DELIVERED' THEN
    -- ⚡ ATOMIC PoD TRANSACTION
    UPDATE shipments 
    SET status = 'DELIVERED' 
    WHERE awb = p_awb;

    INSERT INTO chain_of_custody_logs (awb, actor_id, action_type, lat, lng, evidence_url, created_at)
    VALUES (p_awb, p_rider_id, 'DELIVERED_TO_CUSTOMER', p_lat, p_lng, p_evidence_url, NOW());

    RETURN jsonb_build_object('success', true, 'message', 'PoD successfully recorded.');

  ELSIF p_resolution = 'FAILED' THEN
    -- ⚡ ATOMIC NDR TRANSACTION
    UPDATE shipments 
    SET status = 'DELIVERY_FAILED' 
    WHERE awb = p_awb;

    INSERT INTO chain_of_custody_logs (awb, actor_id, action_type, lat, lng, evidence_url, created_at)
    -- Store the NDR reason in the evidence_url/notes field for now, or a dedicated column
    VALUES (p_awb, p_rider_id, 'DELIVERY_FAILED: ' || p_ndr_reason, p_lat, p_lng, NULL, NOW());

    RETURN jsonb_build_object('success', true, 'message', 'NDR successfully recorded.');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid resolution type.');
  END IF;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."execute_delivery_resolution"("p_awb" character varying, "p_rider_id" "uuid", "p_resolution" character varying, "p_lat" numeric, "p_lng" numeric, "p_evidence_url" "text", "p_receiver_name" character varying, "p_ndr_reason" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_secure_pickup"("p_awb" character varying, "p_tag_id" character varying, "p_rider_id" "uuid", "p_lat" numeric, "p_lng" numeric, "p_photo_url" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_shipment_status VARCHAR;
  v_tag_status VARCHAR;
BEGIN
  -- Verify Shipment
  SELECT status INTO v_shipment_status FROM shipments WHERE awb = p_awb;
  IF v_shipment_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid AWB. Parcel not found.');
  END IF;
  
  -- Verify Tag
  SELECT status INTO v_tag_status FROM tamper_tags WHERE tag_id = p_tag_id;
  IF v_tag_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid Tamper Tag ID.');
  END IF;
  IF v_tag_status != 'AVAILABLE' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Security tag is already used or voided.');
  END IF;

  -- ⚡ ATOMIC TRANSACTION BEGINS
  UPDATE tamper_tags 
  SET status = 'USED', used_at = NOW() 
  WHERE tag_id = p_tag_id;

  UPDATE shipments 
  SET status = 'IN_TRANSIT_TO_HUB', tamper_tag_id = p_tag_id 
  WHERE awb = p_awb;

  INSERT INTO chain_of_custody_logs (awb, actor_id, action_type, lat, lng, evidence_url, created_at)
  VALUES (p_awb, p_rider_id, 'SECURED_AT_MERCHANT', p_lat, p_lng, p_photo_url, NOW());

  RETURN jsonb_build_object('success', true, 'message', 'Chain of custody secured.');

EXCEPTION WHEN OTHERS THEN
  -- 🛡️ Auto-Rollback on failure
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."execute_secure_pickup"("p_awb" character varying, "p_tag_id" character varying, "p_rider_id" "uuid", "p_lat" numeric, "p_lng" numeric, "p_photo_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_secure_pickup"("p_awb" character varying, "p_tag_id" character varying, "p_rider_id" "uuid", "p_lat" numeric, "p_lng" numeric, "p_photo_url" character varying) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_shipment_status VARCHAR;
  v_tag_status VARCHAR;
BEGIN
  -- 1. Verify the Shipment exists and is ready for pickup
  SELECT status INTO v_shipment_status FROM shipments WHERE awb = p_awb;
  IF v_shipment_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid AWB.');
  END IF;
  IF v_shipment_status != 'PENDING_PICKUP' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shipment is not pending pickup.');
  END IF;

  -- 2. Verify the Tamper Tag is valid and available
  SELECT status INTO v_tag_status FROM tamper_tags WHERE tag_id = p_tag_id;
  IF v_tag_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid Tamper Tag.');
  END IF;
  IF v_tag_status != 'AVAILABLE' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tag is already used or voided.');
  END IF;

  -- 3. ACTIVATE TRANSACTION: Update Tamper Tag
  UPDATE tamper_tags 
  SET status = 'USED', used_at = NOW() 
  WHERE tag_id = p_tag_id;

  -- 4. ACTIVATE TRANSACTION: Update Shipment
  UPDATE shipments 
  SET status = 'IN_TRANSIT_TO_HUB', tamper_tag_id = p_tag_id 
  WHERE awb = p_awb;

  -- 5. ACTIVATE TRANSACTION: Insert GPS Audit Log
  INSERT INTO chain_of_custody_logs (awb, actor_id, action_type, lat, lng, evidence_url, created_at)
  VALUES (p_awb, p_rider_id, 'SECURED_AT_MERCHANT', p_lat, p_lng, p_photo_url, NOW());

  -- 6. Return Success
  RETURN jsonb_build_object('success', true, 'message', 'Chain of custody secured.');

EXCEPTION WHEN OTHERS THEN
  -- If ANYTHING fails above, Postgres automatically rolls back all changes
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."execute_secure_pickup"("p_awb" character varying, "p_tag_id" character varying, "p_rider_id" "uuid", "p_lat" numeric, "p_lng" numeric, "p_photo_url" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_audit_checksum"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.checksum :=
    encode(
      digest(
        coalesce(new.user_id::text,'') ||
        coalesce(new.action,'') ||
        coalesce(new.table_name,'') ||
        coalesce(new.record_id::text,''),
        'sha256'
      ),
      'hex'
    );
  return new;
end;
$$;


ALTER FUNCTION "public"."generate_audit_checksum"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_awb_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    new_awb TEXT;
    counter INTEGER;
BEGIN
    -- Get current date in YYYYMMDD format
    SELECT TO_CHAR(NOW(), 'YYYYMMDD') INTO new_awb;
    
    -- Get count of shipments created today
    SELECT COUNT(*) + 1 INTO counter
    FROM public.shipments_2026_02_19_13_00
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Format: YYYYMMDD + 6-digit counter (e.g., 20260219000001)
    new_awb := new_awb || LPAD(counter::TEXT, 6, '0');
    
    RETURN new_awb;
END;
$$;


ALTER FUNCTION "public"."generate_awb_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_customer_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    new_code TEXT;
    counter INTEGER;
BEGIN
    -- Get count of customers
    SELECT COUNT(*) + 1 INTO counter
    FROM public.customers_2026_02_19_13_00;
    
    -- Format: CUST + 6-digit counter (e.g., CUST000001)
    new_code := 'CUST' || LPAD(counter::TEXT, 6, '0');
    
    RETURN new_code;
END;
$$;


ALTER FUNCTION "public"."generate_customer_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_merchant_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    new_code TEXT;
    counter INTEGER;
BEGIN
    -- Get count of merchants
    SELECT COUNT(*) + 1 INTO counter
    FROM public.merchants_2026_02_19_13_00;
    
    -- Format: MERCH + 6-digit counter (e.g., MERCH000001)
    new_code := 'MERCH' || LPAD(counter::TEXT, 6, '0');
    
    RETURN new_code;
END;
$$;


ALTER FUNCTION "public"."generate_merchant_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_parcel_id_2026_02_18_17_00"("p_pickup_zone" character varying DEFAULT 'YGN'::character varying) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_sequence_num INTEGER;
    v_parcel_id TEXT;
BEGIN
    -- Get next sequence number for the zone and date
    SELECT COALESCE(MAX(CAST(SUBSTRING(parcel_id FROM '[0-9]+') AS INTEGER)), 0) + 1
    INTO v_sequence_num
    FROM public.parcels_2026_02_18_17_00
    WHERE parcel_id LIKE p_pickup_zone || '%' || p_pickup_zone
    AND DATE(created_at) = CURRENT_DATE;
    
    -- Format: YGN119874YGN (zone + 6-digit number + zone)
    v_parcel_id := p_pickup_zone || LPAD(v_sequence_num::TEXT, 6, '0') || p_pickup_zone;
    
    RETURN v_parcel_id;
END;
$$;


ALTER FUNCTION "public"."generate_parcel_id_2026_02_18_17_00"("p_pickup_zone" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_qr_code_2026_02_18_17_00"("p_qr_data" "text", "p_qr_type" character varying DEFAULT 'SHIPMENT'::character varying, "p_shipment_id" "text" DEFAULT NULL::"text", "p_generated_by" "text" DEFAULT 'system'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_qr_id UUID;
BEGIN
    -- Check if QR code already exists
    SELECT id INTO v_qr_id
    FROM public.qr_codes_2026_02_18_17_00
    WHERE qr_data = p_qr_data AND is_active = true;
    
    -- If not exists, create new QR code record
    IF v_qr_id IS NULL THEN
        INSERT INTO public.qr_codes_2026_02_18_17_00 (
            qr_data,
            qr_type,
            shipment_id,
            generated_by
        ) VALUES (
            p_qr_data,
            p_qr_type,
            p_shipment_id,
            p_generated_by
        ) RETURNING id INTO v_qr_id;
    ELSE
        -- Update existing record
        UPDATE public.qr_codes_2026_02_18_17_00
        SET updated_at = NOW()
        WHERE id = v_qr_id;
    END IF;
    
    RETURN v_qr_id;
END;
$$;


ALTER FUNCTION "public"."generate_qr_code_2026_02_18_17_00"("p_qr_data" "text", "p_qr_type" character varying, "p_shipment_id" "text", "p_generated_by" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_qr_code_advanced_2026_02_19_15_00"("p_qr_type" "text", "p_reference_id" "uuid", "p_reference_type" "text", "p_data" "jsonb" DEFAULT '{}'::"jsonb", "p_generated_by" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("success" boolean, "qr_code" "text", "qr_id" "uuid", "message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_qr_code TEXT;
  v_qr_id UUID;
BEGIN
  -- Generate unique QR code
  v_qr_code := 'BRT-' || p_qr_type || '-' || EXTRACT(YEAR FROM NOW()) || '-' || 
               LPAD(EXTRACT(DOY FROM NOW())::TEXT, 3, '0') || '-' || 
               LPAD(EXTRACT(HOUR FROM NOW())::TEXT, 2, '0') || 
               LPAD(EXTRACT(MINUTE FROM NOW())::TEXT, 2, '0') || 
               LPAD(EXTRACT(SECOND FROM NOW())::TEXT, 2, '0') || '-' ||
               SUBSTRING(p_reference_id::TEXT, 1, 8);

  -- Insert QR code record
  INSERT INTO qr_codes_advanced_2026_02_19_15_00 (
    qr_code, qr_type, reference_id, reference_type, data, generated_by
  ) VALUES (
    v_qr_code, p_qr_type, p_reference_id, p_reference_type, p_data, p_generated_by
  ) RETURNING id INTO v_qr_id;

  RETURN QUERY SELECT true, v_qr_code, v_qr_id, 'QR code generated successfully'::TEXT;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::UUID, SQLERRM::TEXT;
END;
$$;


ALTER FUNCTION "public"."generate_qr_code_advanced_2026_02_19_15_00"("p_qr_type" "text", "p_reference_id" "uuid", "p_reference_type" "text", "p_data" "jsonb", "p_generated_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_smart_user_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Determine Office Prefix
    NEW.display_id := CASE 
        WHEN NEW.branch_code = 'YGN-HQ' THEN 'H'
        WHEN NEW.branch_code LIKE 'YGN%' THEN 'Y'
        WHEN NEW.branch_code LIKE 'MDY%' THEN 'M'
        WHEN NEW.branch_code LIKE 'NPT%' THEN 'N'
        ELSE 'X'
    END;

    -- Map Roles to Abbreviations
    NEW.display_id := NEW.display_id || '-' || CASE 
        WHEN NEW.role = 'admin' THEN 'SADM'
        WHEN NEW.role = 'rider_bike' THEN 'RDB'
        WHEN NEW.role = 'rider_van' THEN 'RDD'
        WHEN NEW.role = 'rider_moto' THEN 'RDM'
        WHEN NEW.role = 'helper' THEN 'RDH'
        ELSE 'STFF'
    END;

    -- Append Serial (Simplified for demo)
    NEW.display_id := NEW.display_id || '-' || LPAD((SELECT COUNT(*) + 1 FROM public.operators WHERE role = NEW.role)::text, 4, '0');
    
    -- Auto-populate email from auth if not provided
    IF NEW.email IS NULL THEN
        SELECT email INTO NEW.email FROM auth.users WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_smart_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_transaction_hash"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.auth_hash := encode(digest(
    NEW.id::text || 
    NEW.amount::text || 
    COALESCE(NEW.sender_id::text, 'none') || 
    COALESCE(NEW.recipient_id::text, 'none') || 
    'BRITIUM_SECURE_SALT_2026', 
    'sha256'
  ), 'hex');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_transaction_hash"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_transaction_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    -- Get current date in YYYYMMDD format
    SELECT TO_CHAR(NOW(), 'YYYYMMDD') INTO new_number;
    
    -- Get count of transactions created today
    SELECT COUNT(*) + 1 INTO counter
    FROM public.transactions_2026_02_19_13_00
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Format: TXN + YYYYMMDD + 4-digit counter (e.g., TXN202602190001)
    new_number := 'TXN' || new_number || LPAD(counter::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$;


ALTER FUNCTION "public"."generate_transaction_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_waybill_id"("p_org" "text", "p_dst" "text", "p_tag" "text" DEFAULT 'HQ'::"text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE seq_val text;
BEGIN
  seq_val := lpad(floor(random() * 900000 + 100000)::text, 6, '0');
  RETURN upper(p_org) || seq_val || upper(p_tag) || to_char(now(), 'DDMMYYYY') || upper(p_dst);
END;
$$;


ALTER FUNCTION "public"."generate_waybill_id"("p_org" "text", "p_dst" "text", "p_tag" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_waybill_id"("p_origin_city" "text", "p_dest_city" "text", "p_office_tag" "text" DEFAULT NULL::"text", "p_branch_code" "text" DEFAULT NULL::"text", "p_issue_date" "date" DEFAULT CURRENT_DATE) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  org text := public.city_code(p_origin_city);
  dst text := public.city_code(p_dest_city);
  tag text := upper(coalesce(p_office_tag, public.current_office_tag(), 'HQ'));
  bcode text := upper(coalesce(p_branch_code, public.current_branch_code(), ''));
  seq bigint;
  seq6 text;
  dstr text := to_char(p_issue_date, 'DDMMYYYY');
begin
  if tag not in ('HQ','BO') then tag := 'HQ'; end if;
  if tag = 'HQ' then bcode := ''; end if;

  seq := public.next_waybill_seq(p_issue_date, org, tag, bcode);
  seq6 := lpad(seq::text, 6, '0');

  return org || seq6 || tag || bcode || dstr || dst;
end;
$$;


ALTER FUNCTION "public"."generate_waybill_id"("p_origin_city" "text", "p_dest_city" "text", "p_office_tag" "text", "p_branch_code" "text", "p_issue_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_assignment_queue_2026_02_19_17_00"("p_user_id" "uuid" DEFAULT NULL::"uuid", "p_branch_id" "uuid" DEFAULT NULL::"uuid", "p_queue_type" character varying DEFAULT NULL::character varying, "p_limit" integer DEFAULT 50) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', aq.id,
            'shipment_id', aq.shipment_id,
            'queue_type', aq.queue_type,
            'priority', aq.priority,
            'status', aq.status,
            'queue_position', aq.queue_position,
            'estimated_processing_time', aq.estimated_processing_time,
            'created_at', aq.created_at,
            'shipment_info', (
                SELECT jsonb_build_object(
                    'awb_number', s.awb_number,
                    'sender_name', s.sender_name,
                    'receiver_name', s.receiver_name,
                    'pickup_address', s.pickup_address,
                    'delivery_address', s.delivery_address,
                    'cod_amount', s.cod_amount,
                    'service_type', s.service_type
                )
                FROM shipments_2026_02_19_13_00 s
                WHERE s.id = aq.shipment_id
            )
        )
        ORDER BY aq.priority ASC, aq.created_at ASC
    ) INTO v_result
    FROM assignment_queue_2026_02_19_17_00 aq
    WHERE 
        (p_user_id IS NULL OR aq.assigned_user_id = p_user_id)
        AND (p_branch_id IS NULL OR aq.branch_id = p_branch_id)
        AND (p_queue_type IS NULL OR aq.queue_type = p_queue_type)
        AND aq.status = 'PENDING'
    LIMIT p_limit;
    
    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_assignment_queue_2026_02_19_17_00"("p_user_id" "uuid", "p_branch_id" "uuid", "p_queue_type" character varying, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard_metrics"("p_user_id" "uuid" DEFAULT NULL::"uuid", "p_branch_id" "uuid" DEFAULT NULL::"uuid", "p_date_from" "date" DEFAULT (CURRENT_DATE - '30 days'::interval), "p_date_to" "date" DEFAULT CURRENT_DATE) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    result JSONB;
    total_shipments INTEGER;
    pending_shipments INTEGER;
    delivered_shipments INTEGER;
    total_revenue DECIMAL(12,2);
    cod_collected DECIMAL(12,2);
    active_vehicles INTEGER;
BEGIN
    -- Get shipment metrics
    SELECT COUNT(*) INTO total_shipments
    FROM public.shipments_2026_02_19_13_00
    WHERE created_at::DATE BETWEEN p_date_from AND p_date_to
    AND (p_branch_id IS NULL OR origin_branch_id = p_branch_id);
    
    SELECT COUNT(*) INTO pending_shipments
    FROM public.shipments_2026_02_19_13_00
    WHERE status IN ('CREATED', 'PICKED_UP', 'IN_TRANSIT')
    AND (p_branch_id IS NULL OR origin_branch_id = p_branch_id);
    
    SELECT COUNT(*) INTO delivered_shipments
    FROM public.shipments_2026_02_19_13_00
    WHERE status = 'DELIVERED'
    AND created_at::DATE BETWEEN p_date_from AND p_date_to
    AND (p_branch_id IS NULL OR origin_branch_id = p_branch_id);
    
    -- Get financial metrics
    SELECT COALESCE(SUM(total_cost), 0) INTO total_revenue
    FROM public.shipments_2026_02_19_13_00
    WHERE created_at::DATE BETWEEN p_date_from AND p_date_to
    AND (p_branch_id IS NULL OR origin_branch_id = p_branch_id);
    
    SELECT COALESCE(SUM(amount), 0) INTO cod_collected
    FROM public.transactions_2026_02_19_13_00
    WHERE transaction_type = 'COD_COLLECTION'
    AND status = 'COMPLETED'
    AND created_at::DATE BETWEEN p_date_from AND p_date_to
    AND (p_branch_id IS NULL OR branch_id = p_branch_id);
    
    -- Get vehicle metrics
    SELECT COUNT(*) INTO active_vehicles
    FROM public.vehicles_2026_02_19_13_00
    WHERE status = 'AVAILABLE'
    AND (p_branch_id IS NULL OR home_branch_id = p_branch_id);
    
    -- Build result JSON
    result := jsonb_build_object(
        'total_shipments', total_shipments,
        'pending_shipments', pending_shipments,
        'delivered_shipments', delivered_shipments,
        'delivery_rate', CASE WHEN total_shipments > 0 THEN ROUND((delivered_shipments::DECIMAL / total_shipments) * 100, 2) ELSE 0 END,
        'total_revenue', total_revenue,
        'cod_collected', cod_collected,
        'active_vehicles', active_vehicles,
        'date_range', jsonb_build_object('from', p_date_from, 'to', p_date_to)
    );
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_dashboard_metrics"("p_user_id" "uuid", "p_branch_id" "uuid", "p_date_from" "date", "p_date_to" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_qr_stats_2026_02_18_17_00"("p_user_id" "text" DEFAULT NULL::"text", "p_days" integer DEFAULT 30) RETURNS TABLE("total_generated" bigint, "total_scanned" bigint, "unique_scanners" bigint, "most_scanned_data" "text", "recent_activity" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as generated_count,
            SUM(scan_count) as total_scan_count,
            COUNT(DISTINCT last_scanned_by) FILTER (WHERE last_scanned_by IS NOT NULL) as unique_scanner_count
        FROM public.qr_codes_2026_02_18_17_00
        WHERE (p_user_id IS NULL OR generated_by = p_user_id)
        AND generated_at >= NOW() - INTERVAL '1 day' * p_days
    ),
    most_scanned AS (
        SELECT qr_data
        FROM public.qr_codes_2026_02_18_17_00
        WHERE (p_user_id IS NULL OR generated_by = p_user_id)
        AND generated_at >= NOW() - INTERVAL '1 day' * p_days
        ORDER BY scan_count DESC
        LIMIT 1
    ),
    recent AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'qr_data', qr_data,
                'type', qr_type,
                'generated_at', generated_at,
                'scan_count', scan_count
            ) ORDER BY generated_at DESC
        ) as activity
        FROM public.qr_codes_2026_02_18_17_00
        WHERE (p_user_id IS NULL OR generated_by = p_user_id)
        AND generated_at >= NOW() - INTERVAL '1 day' * p_days
        LIMIT 10
    )
    SELECT 
        s.generated_count,
        s.total_scan_count,
        s.unique_scanner_count,
        ms.qr_data,
        r.activity
    FROM stats s
    CROSS JOIN most_scanned ms
    CROSS JOIN recent r;
END;
$$;


ALTER FUNCTION "public"."get_qr_stats_2026_02_18_17_00"("p_user_id" "text", "p_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_shipment_workflow_2026_02_19_17_00"("p_shipment_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'shipment_id', sws.shipment_id,
        'current_state', sws.current_state,
        'previous_state', sws.previous_state,
        'assigned_to_user', u.full_name,
        'assigned_to_branch', b.name,
        'auto_assigned', sws.auto_assigned,
        'assignment_reason', sws.assignment_reason,
        'created_at', sws.created_at,
        'updated_at', sws.updated_at,
        'queue_info', (
            SELECT jsonb_build_object(
                'queue_type', aq.queue_type,
                'priority', aq.priority,
                'status', aq.status,
                'queue_position', aq.queue_position
            )
            FROM assignment_queue_2026_02_19_17_00 aq
            WHERE aq.shipment_id = p_shipment_id
            ORDER BY aq.created_at DESC
            LIMIT 1
        )
    ) INTO v_result
    FROM shipment_workflow_states_2026_02_19_17_00 sws
    LEFT JOIN users_2026_02_19_13_00 u ON sws.assigned_to_user_id = u.id
    LEFT JOIN branches_2026_02_19_13_00 b ON sws.assigned_to_branch_id = b.id
    WHERE sws.shipment_id = p_shipment_id
    ORDER BY sws.created_at DESC
    LIMIT 1;
    
    RETURN COALESCE(v_result, '{"error": "Shipment workflow not found"}'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_shipment_workflow_2026_02_19_17_00"("p_shipment_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_permissions"("user_role" "text") RETURNS TABLE("permission_code" "text", "domain" "text", "resource" "text", "action" "text", "scope" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT p.code, p.domain, p.resource, p.action, p.scope
    FROM permissions p
    JOIN role_permissions rp ON p.code = rp.permission_code
    WHERE rp.role_code = user_role AND p.is_active = true;
END;
$$;


ALTER FUNCTION "public"."get_user_permissions"("user_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_waybill_print_data"("p_way_id" "text") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT jsonb_build_object(
    'way_id', s.way_id,
    'qr_code', s.way_id, -- Used to generate the barcode/QR
    'date', to_char(s.created_at, 'DD-Mon-YYYY'),
    'sender', jsonb_build_object(
        'name', s.sender_name,
        'phone', s.sender_phone,
        'city', s.sender_city
    ),
    'receiver', jsonb_build_object(
        'name', s.receiver_name,
        'phone', s.receiver_phone,
        'address', s.receiver_address,
        'city', s.receiver_city
    ),
    'financials', jsonb_build_object(
        'cod', s.cod_amount,
        'fee', s.delivery_fee,
        'total', s.total_amount
    ),
    'service', s.service_type
  )
  FROM public.shipments s
  WHERE s.way_id = p_way_id;
$$;


ALTER FUNCTION "public"."get_waybill_print_data"("p_way_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_admin_user_management"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.status = 'SUSPENDED' THEN
    -- This logic can be expanded to hook into auth.users for session revocation
    NULL;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_admin_user_management"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_auth_user_upsert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_role text;
begin
  v_role := upper(coalesce(new.raw_app_meta_data->>'role', new.raw_app_meta_data->>'app_role', 'CUSTOMER'));

  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    lower(coalesce(new.email,'')),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', null),
    v_role
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.users.full_name),
    role = coalesce(excluded.role, public.users.role);

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_auth_user_upsert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_failed_login"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_attempts integer;
begin
  update profiles
  set failed_attempts = failed_attempts + 1
  where id = p_user_id
  returning failed_attempts into v_attempts;

  if v_attempts >= 5 then
    update profiles
    set locked_until = now() + interval '30 minutes'
    where id = p_user_id;
  end if;
end;
$$;


ALTER FUNCTION "public"."handle_failed_login"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_last_login"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_last_login"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_hardened"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Insert into the public profile table
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::employee_role, 'customer')
  );

  -- INSTEAD of an UPDATE, we modify the NEW object directly
  -- This is faster and avoids the "Database Error" deadlock
  NEW.raw_user_meta_data = COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || '{"must_change_password": true}'::jsonb;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user_hardened"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_setup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE auth.users 
  SET raw_user_meta_data = raw_user_meta_data || '{"must_change_password": true}'::jsonb
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user_setup"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_any_role"("role_names" "text"[]) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select public.current_app_role() = any(select upper(x) from unnest(role_names) x);
$$;


ALTER FUNCTION "public"."has_any_role"("role_names" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_permission"("text") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $_$
  select exists (
    select 1
    from public.user_permissions up
    join public.permissions p
      on p.id = up.permission_id
    where up.user_id = auth.uid()
      and lower(p.code::text) = lower($1)
  );
$_$;


ALTER FUNCTION "public"."has_permission"("text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_permission"("user_role" "text", "permission_code" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM role_permissions rp
        WHERE rp.role_code = user_role 
        AND rp.permission_code = permission_code
    );
END;
$$;


ALTER FUNCTION "public"."has_permission"("user_role" "text", "permission_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("role_name" "text") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select public.current_app_role() = upper(role_name);
$$;


ALTER FUNCTION "public"."has_role"("role_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_role"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select public.has_any_role(array['SYS','APP_OWNER','SUPER_ADMIN','ADMIN','ADM','MGR','OPERATIONS_ADMIN']);
$$;


ALTER FUNCTION "public"."is_admin_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_user"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    SET "row_security" TO 'off'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_active = true
      AND p.role IN (
        'APP_OWNER'::public.app_role,
        'SUPER_ADMIN'::public.app_role,
        'OPERATIONS_ADMIN'::public.app_role,
        'HR_ADMIN'::public.app_role,
        'MARKETING_ADMIN'::public.app_role,
        'WAREHOUSE_MANAGER'::public.app_role,
        'SUBSTATION_MANAGER'::public.app_role,
        'SUPERVISOR'::public.app_role
      )
  );
$$;


ALTER FUNCTION "public"."is_admin_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_app_owner"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'APP_OWNER'
      and p.is_active = true
  );
$$;


ALTER FUNCTION "public"."is_app_owner"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_finance_role"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select public.has_any_role(array['FINANCE','FINANCE_ADMIN','FINANCE_USER','FINANCE_STAFF','ACCOUNTANT']);
$$;


ALTER FUNCTION "public"."is_finance_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_staff"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('RIDER', 'STAFF', 'ADMIN', 'SUPER_ADMIN')
  );
$$;


ALTER FUNCTION "public"."is_staff"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."jwt_claim"("claim" "text") RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select nullif(public.request_jwt() ->> claim, '');
$$;


ALTER FUNCTION "public"."jwt_claim"("claim" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."jwt_claims"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  select coalesce(current_setting('request.jwt.claims', true)::jsonb, '{}'::jsonb);
$$;


ALTER FUNCTION "public"."jwt_claims"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."jwt_custom_claims"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  select jsonb_build_object(
    'role', role,
    'branch_id', branch_id,
    'is_demo', is_demo
  )
  from profiles
  where id = auth.uid();
$$;


ALTER FUNCTION "public"."jwt_custom_claims"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."jwt_hook"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.raw_app_meta_data :=
    coalesce(new.raw_app_meta_data, '{}'::jsonb)
    || public.jwt_custom_claims();
  return new;
end;
$$;


ALTER FUNCTION "public"."jwt_hook"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."lock_financial_after_approval"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if old.status = 'APPROVED' then
    raise exception 'Approved transactions are immutable';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."lock_financial_after_approval"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_approval_history"("p_entity_type" "text", "p_entity_id" "uuid", "p_action" "text", "p_reason" "text" DEFAULT NULL::"text", "p_meta" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_actor text := coalesce(auth.jwt() ->> 'email', auth.uid()::text, 'system');
  v_role text := public.current_app_role();
begin
  insert into public.approval_history (
    entity_type,
    entity_id,
    action,
    actor,
    actor_role,
    reason,
    meta
  )
  values (
    p_entity_type,
    p_entity_id,
    upper(coalesce(p_action, 'UNKNOWN')),
    v_actor,
    v_role,
    nullif(trim(coalesce(p_reason, '')), ''),
    coalesce(p_meta, '{}'::jsonb)
  );
end;
$$;


ALTER FUNCTION "public"."log_approval_history"("p_entity_type" "text", "p_entity_id" "uuid", "p_action" "text", "p_reason" "text", "p_meta" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_audit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO audit_logs (user_id, table_name, action, record_id, branch_id, created_at)
  VALUES (auth.uid(), TG_TABLE_NAME, TG_OP, COALESCE(new.id, old.id), COALESCE(new.branch_id, old.branch_id), now());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_audit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_audit_event"("p_user_id" "uuid", "p_action" character varying, "p_resource_type" character varying, "p_resource_id" "uuid" DEFAULT NULL::"uuid", "p_old_values" "jsonb" DEFAULT NULL::"jsonb", "p_new_values" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO public.audit_logs_2026_02_19_13_00 (
        user_id, action, resource_type, resource_id, old_values, new_values
    ) VALUES (
        p_user_id, p_action, p_resource_type, p_resource_id, p_old_values, p_new_values
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$;


ALTER FUNCTION "public"."log_audit_event"("p_user_id" "uuid", "p_action" character varying, "p_resource_type" character varying, "p_resource_id" "uuid", "p_old_values" "jsonb", "p_new_values" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_cross_branch"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.branch_id <> (select branch_id from profiles where id = auth.uid()) then
    insert into security_events(user_id,event_type,severity,details)
    values(auth.uid(),'CROSS_BRANCH_ACCESS','CRITICAL', row_to_json(new));
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."log_cross_branch"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_qr_scan_2026_02_18_17_00"("p_qr_data" "text", "p_scanned_by" "text", "p_scan_location" "jsonb" DEFAULT NULL::"jsonb", "p_device_info" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_qr_id UUID;
    v_scan_id UUID;
BEGIN
    -- Find the QR code
    SELECT id INTO v_qr_id
    FROM public.qr_codes_2026_02_18_17_00
    WHERE qr_data = p_qr_data AND is_active = true;
    
    -- If QR code doesn't exist, create it
    IF v_qr_id IS NULL THEN
        v_qr_id := public.generate_qr_code_2026_02_18_17_00(p_qr_data, 'UNKNOWN', NULL, 'scanner');
    END IF;
    
    -- Log the scan
    INSERT INTO public.qr_scan_logs_2026_02_18_17_00 (
        qr_code_id,
        qr_data,
        scanned_by,
        scan_location,
        device_info
    ) VALUES (
        v_qr_id,
        p_qr_data,
        p_scanned_by,
        p_scan_location,
        p_device_info
    ) RETURNING id INTO v_scan_id;
    
    -- Update scan count and last scan info
    UPDATE public.qr_codes_2026_02_18_17_00
    SET 
        scan_count = scan_count + 1,
        last_scanned_at = NOW(),
        last_scanned_by = p_scanned_by,
        updated_at = NOW()
    WHERE id = v_qr_id;
    
    RETURN v_scan_id;
END;
$$;


ALTER FUNCTION "public"."log_qr_scan_2026_02_18_17_00"("p_qr_data" "text", "p_scanned_by" "text", "p_scan_location" "jsonb", "p_device_info" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_shipment_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.audit_logs (record_id, action, actor_id, old_data, new_data)
        VALUES (
            NEW.tracking_number, 
            'STATUS_CHANGED_TO_' || UPPER(NEW.status::text), 
            auth.uid(), 
            jsonb_build_object('status', OLD.status), 
            jsonb_build_object('status', NEW.status)
        );
    END IF;
    
    -- Auto-update the 'updated_at' timestamp
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_shipment_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."next_waybill_seq"("p_issue_date" "date", "p_origin_code" "text", "p_office_tag" "text", "p_branch_code" "text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v bigint;
begin
  insert into public.waybill_counters(issue_date, origin_code, office_tag, branch_code, next_val)
  values (p_issue_date, upper(p_origin_code), upper(p_office_tag), upper(coalesce(p_branch_code,'')), 2)
  on conflict (issue_date, origin_code, office_tag, branch_code)
  do update set next_val = public.waybill_counters.next_val + 1
  returning (public.waybill_counters.next_val - 1) into v;

  return v;
end;
$$;


ALTER FUNCTION "public"."next_waybill_seq"("p_issue_date" "date", "p_origin_code" "text", "p_office_tag" "text", "p_branch_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_financial_self_approval"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.status = 'APPROVED'
     and new.created_by = new.approved_by then
    raise exception 'Financial SoD violation: self-approval not allowed';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."prevent_financial_self_approval"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_self_role_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.id = auth.uid() then
    raise exception 'Users cannot modify their own role';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."prevent_self_role_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_gps_update_2026_02_18_18_00"("p_device_id" "text", "p_latitude" numeric, "p_longitude" numeric, "p_speed" numeric DEFAULT NULL::numeric, "p_heading" numeric DEFAULT NULL::numeric, "p_accuracy" numeric DEFAULT NULL::numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_tracking_id UUID;
    v_user_id TEXT;
    v_route_id UUID;
    v_geofence RECORD;
    v_events JSONB := '[]';
    v_is_moving BOOLEAN;
BEGIN
    -- Determine if moving (speed > 5 km/h)
    v_is_moving := COALESCE(p_speed, 0) > 5;
    
    -- Insert GPS tracking record
    INSERT INTO public.gps_tracking_2026_02_18_18_00 (
        device_id, latitude, longitude, speed, heading, accuracy, 
        is_moving, recorded_at
    ) VALUES (
        p_device_id, p_latitude, p_longitude, p_speed, p_heading, p_accuracy,
        v_is_moving, NOW()
    ) RETURNING id, user_id, route_id INTO v_tracking_id, v_user_id, v_route_id;
    
    -- Check for geofence events
    FOR v_geofence IN 
        SELECT id, name, type, entry_alert, exit_alert
        FROM public.geofences_2026_02_18_18_00
        WHERE is_active = true
    LOOP
        IF public.check_geofence_2026_02_18_18_00(p_latitude, p_longitude, v_geofence.id) THEN
            -- Create geofence entry event
            INSERT INTO public.realtime_events_2026_02_18_18_00 (
                event_type, entity_type, entity_id, event_data, location, geofence_id
            ) VALUES (
                'GEOFENCE_ENTRY', 'DEVICE', p_device_id,
                jsonb_build_object(
                    'geofence_name', v_geofence.name,
                    'geofence_type', v_geofence.type,
                    'user_id', v_user_id,
                    'route_id', v_route_id
                ),
                jsonb_build_object('lat', p_latitude, 'lng', p_longitude),
                v_geofence.id
            );
            
            v_events := v_events || jsonb_build_object(
                'type', 'geofence_entry',
                'geofence', v_geofence.name
            );
        END IF;
    END LOOP;
    
    -- Check for speed violations (> 80 km/h)
    IF COALESCE(p_speed, 0) > 80 THEN
        INSERT INTO public.realtime_events_2026_02_18_18_00 (
            event_type, entity_type, entity_id, event_data, location, priority
        ) VALUES (
            'SPEED_VIOLATION', 'DEVICE', p_device_id,
            jsonb_build_object(
                'speed', p_speed,
                'limit', 80,
                'user_id', v_user_id,
                'route_id', v_route_id
            ),
            jsonb_build_object('lat', p_latitude, 'lng', p_longitude),
            'HIGH'
        );
        
        v_events := v_events || jsonb_build_object(
            'type', 'speed_violation',
            'speed', p_speed
        );
    END IF;
    
    RETURN jsonb_build_object(
        'tracking_id', v_tracking_id,
        'events_triggered', v_events,
        'is_moving', v_is_moving
    );
END;
$$;


ALTER FUNCTION "public"."process_gps_update_2026_02_18_18_00"("p_device_id" "text", "p_latitude" numeric, "p_longitude" numeric, "p_speed" numeric, "p_heading" numeric, "p_accuracy" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."public_track_shipment"("p_way_id" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  s record;
begin
  select
    sh.id, sh.way_id, sh.status, sh.estimated_delivery, sh.receiver_city, sh.receiver_state, sh.created_at
  into s
  from public.shipments sh
  where sh.way_id = p_way_id
  limit 1;

  if s.id is null then
    return jsonb_build_object('found', false);
  end if;

  return jsonb_build_object(
    'found', true,
    'shipment', jsonb_build_object(
      'id', s.id,
      'way_id', s.way_id,
      'status', s.status,
      'estimated_delivery', s.estimated_delivery,
      'receiver_city', s.receiver_city,
      'receiver_state', s.receiver_state,
      'created_at', s.created_at
    ),
    'tracking', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'timestamp', t.timestamp,
          'status', t.status,
          'location', t.location,
          'notes', t.notes
        )
        order by t.timestamp asc
      )
      from public.shipment_tracking t
      where t.shipment_id = s.id
        and t.is_customer_visible = true
    ), '[]'::jsonb)
  );
end
$$;


ALTER FUNCTION "public"."public_track_shipment"("p_way_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_cod_collection"("p_shipment_id" "uuid", "p_collected_by" "uuid", "p_amount" numeric, "p_payment_method" character varying) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    transaction_id UUID;
    transaction_number TEXT;
BEGIN
    -- Generate transaction number
    SELECT generate_transaction_number() INTO transaction_number;
    
    -- Insert transaction
    INSERT INTO public.transactions_2026_02_19_13_00 (
        transaction_number, transaction_type, reference_type, reference_id,
        amount, payment_method, collected_by, status
    ) VALUES (
        transaction_number, 'COD_COLLECTION', 'SHIPMENT', p_shipment_id,
        p_amount, p_payment_method, p_collected_by, 'COMPLETED'
    ) RETURNING id INTO transaction_id;
    
    RETURN transaction_id;
END;
$$;


ALTER FUNCTION "public"."record_cod_collection"("p_shipment_id" "uuid", "p_collected_by" "uuid", "p_amount" numeric, "p_payment_method" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_gps_location_2026_02_19_15_00"("p_device_id" "text", "p_latitude" numeric, "p_longitude" numeric, "p_vehicle_id" "uuid" DEFAULT NULL::"uuid", "p_rider_id" "uuid" DEFAULT NULL::"uuid", "p_shipment_id" "uuid" DEFAULT NULL::"uuid", "p_altitude" numeric DEFAULT NULL::numeric, "p_accuracy" numeric DEFAULT NULL::numeric, "p_speed" numeric DEFAULT NULL::numeric, "p_heading" numeric DEFAULT NULL::numeric, "p_battery_level" integer DEFAULT NULL::integer, "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("success" boolean, "location_id" "uuid", "message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_location_id UUID;
BEGIN
  -- Insert GPS tracking record
  INSERT INTO gps_tracking_advanced_2026_02_19_15_00 (
    device_id, latitude, longitude, vehicle_id, rider_id, shipment_id,
    altitude, accuracy, speed, heading, battery_level, metadata
  ) VALUES (
    p_device_id, p_latitude, p_longitude, p_vehicle_id, p_rider_id, p_shipment_id,
    p_altitude, p_accuracy, p_speed, p_heading, p_battery_level, p_metadata
  ) RETURNING id INTO v_location_id;

  RETURN QUERY SELECT true, v_location_id, 'GPS location recorded successfully'::TEXT;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::UUID, SQLERRM::TEXT;
END;
$$;


ALTER FUNCTION "public"."record_gps_location_2026_02_19_15_00"("p_device_id" "text", "p_latitude" numeric, "p_longitude" numeric, "p_vehicle_id" "uuid", "p_rider_id" "uuid", "p_shipment_id" "uuid", "p_altitude" numeric, "p_accuracy" numeric, "p_speed" numeric, "p_heading" numeric, "p_battery_level" integer, "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_jwt"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
$$;


ALTER FUNCTION "public"."request_jwt"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "role" "public"."app_role" DEFAULT 'STAFF'::"public"."app_role",
    "branch_id" "text",
    "is_active" boolean DEFAULT true,
    "must_change_password" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "environment" "text" DEFAULT 'PRODUCTION'::"text",
    "is_demo" boolean DEFAULT false,
    "deleted_at" timestamp without time zone,
    "failed_attempts" integer DEFAULT 0,
    "locked_until" timestamp with time zone,
    "last_login_at" timestamp with time zone,
    "mfa_required" boolean DEFAULT false,
    "last_sign_in_at" timestamp with time zone,
    "status" "text",
    "role_code" "text" DEFAULT 'CUS'::"text",
    "nrc_number" "text",
    "kyc_status" "text" DEFAULT 'unverified'::"text",
    "last_login" timestamp with time zone,
    "notes" "text",
    "role_level" "text" DEFAULT 'L0'::"text",
    "permissions" "text"[],
    "app_role" "text",
    "requires_password_change" boolean DEFAULT false,
    "user_role" "text",
    "wallet_balance" numeric DEFAULT 0,
    "commission_rate" numeric DEFAULT 500,
    "is_blocked" boolean DEFAULT false NOT NULL,
    "deleted_by" "text",
    "blocked_at" timestamp with time zone,
    "blocked_by" "text",
    "is_approved" boolean DEFAULT true NOT NULL,
    "preferred_language" "text" DEFAULT 'mm'::"text",
    "branch_code" "text" DEFAULT 'YGN-MAIN'::"text",
    "type" "text" DEFAULT 'OPERATOR'::"text",
    "phone_number" "text",
    "manager_id" "uuid",
    "merchant_id" "uuid",
    "rbac_code" "text",
    "display_name" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_admin_block_account"("p_user_id" "uuid", "p_block" boolean DEFAULT true) RETURNS "public"."profiles"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_actor text := coalesce(auth.jwt() ->> 'email', auth.uid()::text, 'system');
  v_row public.profiles;
begin
  update public.profiles
  set
    is_blocked = p_block,
    blocked_at = case when p_block then now() else null end,
    blocked_by = case when p_block then v_actor else null end
  where id = p_user_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Profile not found';
  end if;

  return v_row;
end;
$$;


ALTER FUNCTION "public"."rpc_admin_block_account"("p_user_id" "uuid", "p_block" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_admin_overdue_ways_by_merchant"("p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_sort_by" "text" DEFAULT 'overdue_count'::"text", "p_sort_order" "text" DEFAULT 'desc'::"text", "p_date_from" "date" DEFAULT NULL::"date", "p_date_to" "date" DEFAULT NULL::"date", "p_branch" "text" DEFAULT NULL::"text", "p_merchant" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_offset integer := greatest((p_page - 1) * p_page_size, 0);
  v_total integer := 0;
  v_items jsonb := '[]'::jsonb;
  v_summary jsonb := '{}'::jsonb;
begin
  with base as (
    select
      coalesce(m.id::text, s.merchant_id::text, 'unknown') as merchant_id_text,
      coalesce(
        m.name,
        m.merchant_name,
        m.code,
        m.id::text,
        s.merchant_id::text,
        'Unknown'
      ) as merchant_name,
      count(*)::integer as overdue_count,
      coalesce(sum(coalesce(s.parcel_count, 1)), 0)::integer as parcel_count
    from public.shipments s
    left join public.merchants m on m.id = s.merchant_id
    left join public.branches b on b.id = s.branch_id
    where (
        upper(coalesce(s.status, '')) in ('OVERDUE', 'FAILED', 'PENDING', 'OUT_FOR_DELIVERY')
        or (
          s.delivery_date is not null
          and s.delivery_date::date < current_date
          and upper(coalesce(s.status, '')) not in ('DELIVERED', 'CANCELLED', 'RETURNED')
        )
      )
      and (p_date_from is null or coalesce(s.created_at::date, current_date) >= p_date_from)
      and (p_date_to is null or coalesce(s.created_at::date, current_date) <= p_date_to)
      and (
        p_branch is null
        or b.code = p_branch
        or b.name ilike '%' || p_branch || '%'
      )
      and (
        p_merchant is null
        or coalesce(m.name, m.merchant_name, m.code, '') ilike '%' || p_merchant || '%'
      )
    group by
      coalesce(m.id::text, s.merchant_id::text, 'unknown'),
      coalesce(m.name, m.merchant_name, m.code, m.id::text, s.merchant_id::text, 'Unknown')
  )
  select count(*) into v_total from base;

  with base as (
    select
      coalesce(m.id::text, s.merchant_id::text, 'unknown') as merchant_id_text,
      coalesce(
        m.name,
        m.merchant_name,
        m.code,
        m.id::text,
        s.merchant_id::text,
        'Unknown'
      ) as merchant_name,
      count(*)::integer as overdue_count,
      coalesce(sum(coalesce(s.parcel_count, 1)), 0)::integer as parcel_count
    from public.shipments s
    left join public.merchants m on m.id = s.merchant_id
    left join public.branches b on b.id = s.branch_id
    where (
        upper(coalesce(s.status, '')) in ('OVERDUE', 'FAILED', 'PENDING', 'OUT_FOR_DELIVERY')
        or (
          s.delivery_date is not null
          and s.delivery_date::date < current_date
          and upper(coalesce(s.status, '')) not in ('DELIVERED', 'CANCELLED', 'RETURNED')
        )
      )
      and (p_date_from is null or coalesce(s.created_at::date, current_date) >= p_date_from)
      and (p_date_to is null or coalesce(s.created_at::date, current_date) <= p_date_to)
      and (
        p_branch is null
        or b.code = p_branch
        or b.name ilike '%' || p_branch || '%'
      )
      and (
        p_merchant is null
        or coalesce(m.name, m.merchant_name, m.code, '') ilike '%' || p_merchant || '%'
      )
    group by
      coalesce(m.id::text, s.merchant_id::text, 'unknown'),
      coalesce(m.name, m.merchant_name, m.code, m.id::text, s.merchant_id::text, 'Unknown')
  )
  select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
  into v_items
  from (
    select
      merchant_id_text as merchant_id,
      merchant_name,
      overdue_count,
      parcel_count
    from base
    order by
      case when p_sort_by = 'merchant_name' and p_sort_order = 'asc' then merchant_name end asc,
      case when p_sort_by = 'merchant_name' and p_sort_order = 'desc' then merchant_name end desc,
      case when p_sort_by = 'overdue_count' and p_sort_order = 'asc' then overdue_count end asc,
      case when p_sort_by = 'overdue_count' and p_sort_order = 'desc' then overdue_count end desc,
      case when p_sort_by = 'parcel_count' and p_sort_order = 'asc' then parcel_count end asc,
      case when p_sort_by = 'parcel_count' and p_sort_order = 'desc' then parcel_count end desc
    offset v_offset
    limit p_page_size
  ) x;

  with base as (
    select
      count(*)::integer as overdue_count,
      coalesce(sum(coalesce(s.parcel_count, 1)), 0)::integer as parcel_count
    from public.shipments s
    left join public.merchants m on m.id = s.merchant_id
    left join public.branches b on b.id = s.branch_id
    where (
        upper(coalesce(s.status, '')) in ('OVERDUE', 'FAILED', 'PENDING', 'OUT_FOR_DELIVERY')
        or (
          s.delivery_date is not null
          and s.delivery_date::date < current_date
          and upper(coalesce(s.status, '')) not in ('DELIVERED', 'CANCELLED', 'RETURNED')
        )
      )
      and (p_date_from is null or coalesce(s.created_at::date, current_date) >= p_date_from)
      and (p_date_to is null or coalesce(s.created_at::date, current_date) <= p_date_to)
      and (
        p_branch is null
        or b.code = p_branch
        or b.name ilike '%' || p_branch || '%'
      )
      and (
        p_merchant is null
        or coalesce(m.name, m.merchant_name, m.code, '') ilike '%' || p_merchant || '%'
      )
  )
  select jsonb_build_object(
    'overdueWays', coalesce(sum(overdue_count), 0),
    'parcelCount', coalesce(sum(parcel_count), 0)
  )
  into v_summary
  from base;

  return jsonb_build_object(
    'items', coalesce(v_items, '[]'::jsonb),
    'total', coalesce(v_total, 0),
    'page', p_page,
    'pageSize', p_page_size,
    'summary', coalesce(v_summary, '{}'::jsonb)
  );
end;
$$;


ALTER FUNCTION "public"."rpc_admin_overdue_ways_by_merchant"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch" "text", "p_merchant" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_admin_pickup_ways"("p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 20, "p_sort_by" "text" DEFAULT 'created_at'::"text", "p_sort_order" "text" DEFAULT 'desc'::"text", "p_date_from" "date" DEFAULT NULL::"date", "p_date_to" "date" DEFAULT NULL::"date", "p_branch" "text" DEFAULT NULL::"text", "p_rider" "text" DEFAULT NULL::"text", "p_merchant" "text" DEFAULT NULL::"text", "p_status" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_offset integer := greatest((p_page - 1) * p_page_size, 0);
  v_total integer := 0;
  v_items jsonb := '[]'::jsonb;
  v_summary jsonb := '{}'::jsonb;
begin
  with base as (
    select
      s.id,
      coalesce(s.way_no, s.tracking_no, s.id::text) as "wayNo",
      s.created_at as "pickupDate",
      coalesce(m.name, m.id::text) as "merchantName",
      coalesce(r.full_name, r.name, r.id::text) as "assignedTo",
      coalesce(s.parcel_count, 1) as "parcelCount",
      coalesce(s.status, 'PENDING') as "status"
    from public.shipments s
    left join public.merchants m on m.id = s.merchant_id
    left join public.users r on r.id = s.rider_id
    left join public.branches b on b.id = s.branch_id
    where (p_date_from is null or s.created_at::date >= p_date_from)
      and (p_date_to is null or s.created_at::date <= p_date_to)
      and (p_branch is null or b.code = p_branch or b.name ilike '%' || p_branch || '%')
      and (p_rider is null or coalesce(r.full_name, r.name, '') ilike '%' || p_rider || '%')
      and (p_merchant is null or coalesce(m.name, '') ilike '%' || p_merchant || '%')
      and (p_status is null or upper(coalesce(s.status, '')) = upper(p_status))
  )
  select count(*) into v_total from base;

  with base as (
    select
      s.id,
      coalesce(s.way_no, s.tracking_no, s.id::text) as "wayNo",
      s.created_at as "pickupDate",
      coalesce(m.name, m.id::text) as "merchantName",
      coalesce(r.full_name, r.name, r.id::text) as "assignedTo",
      coalesce(s.parcel_count, 1) as "parcelCount",
      coalesce(s.status, 'PENDING') as "status"
    from public.shipments s
    left join public.merchants m on m.id = s.merchant_id
    left join public.users r on r.id = s.rider_id
    left join public.branches b on b.id = s.branch_id
    where (p_date_from is null or s.created_at::date >= p_date_from)
      and (p_date_to is null or s.created_at::date <= p_date_to)
      and (p_branch is null or b.code = p_branch or b.name ilike '%' || p_branch || '%')
      and (p_rider is null or coalesce(r.full_name, r.name, '') ilike '%' || p_rider || '%')
      and (p_merchant is null or coalesce(m.name, '') ilike '%' || p_merchant || '%')
      and (p_status is null or upper(coalesce(s.status, '')) = upper(p_status))
  )
  select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
  into v_items
  from (
    select *
    from base
    order by
      case when p_sort_by = 'pickupDate' and p_sort_order = 'asc' then "pickupDate" end asc,
      case when p_sort_by = 'pickupDate' and p_sort_order = 'desc' then "pickupDate" end desc,
      case when p_sort_by = 'parcelCount' and p_sort_order = 'asc' then "parcelCount" end asc,
      case when p_sort_by = 'parcelCount' and p_sort_order = 'desc' then "parcelCount" end desc,
      case when p_sort_by = 'status' and p_sort_order = 'asc' then "status" end asc,
      case when p_sort_by = 'status' and p_sort_order = 'desc' then "status" end desc
    offset v_offset
    limit p_page_size
  ) x;

  with base as (
    select
      coalesce(s.parcel_count, 1) as parcel_count,
      coalesce(s.status, 'PENDING') as status
    from public.shipments s
    left join public.merchants m on m.id = s.merchant_id
    left join public.users r on r.id = s.rider_id
    left join public.branches b on b.id = s.branch_id
    where (p_date_from is null or s.created_at::date >= p_date_from)
      and (p_date_to is null or s.created_at::date <= p_date_to)
      and (p_branch is null or b.code = p_branch or b.name ilike '%' || p_branch || '%')
      and (p_rider is null or coalesce(r.full_name, r.name, '') ilike '%' || p_rider || '%')
      and (p_merchant is null or coalesce(m.name, '') ilike '%' || p_merchant || '%')
      and (p_status is null or upper(coalesce(s.status, '')) = upper(p_status))
  )
  select jsonb_build_object(
    'totalWays', count(*),
    'assignedWays', count(*) filter (where upper(status) in ('ASSIGNED','READY','PICKUP_ASSIGNED')),
    'pendingWays', count(*) filter (where upper(status) in ('PENDING','DRAFT')),
    'parcelCount', coalesce(sum(parcel_count), 0)
  )
  into v_summary
  from base;

  return jsonb_build_object(
    'items', coalesce(v_items, '[]'::jsonb),
    'total', coalesce(v_total, 0),
    'page', p_page,
    'pageSize', p_page_size,
    'summary', coalesce(v_summary, '{}'::jsonb)
  );
end;
$$;


ALTER FUNCTION "public"."rpc_admin_pickup_ways"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch" "text", "p_rider" "text", "p_merchant" "text", "p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_admin_soft_delete_account"("p_user_id" "uuid") RETURNS "public"."profiles"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_actor text := coalesce(auth.jwt() ->> 'email', auth.uid()::text, 'system');
  v_row public.profiles;
begin
  update public.profiles
  set
    deleted_at = now(),
    deleted_by = v_actor,
    is_blocked = true,
    blocked_at = now(),
    blocked_by = v_actor
  where id = p_user_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Profile not found';
  end if;

  return v_row;
end;
$$;


ALTER FUNCTION "public"."rpc_admin_soft_delete_account"("p_user_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."broadcast_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_title" "text" NOT NULL,
    "channel" "text" NOT NULL,
    "audience" "text",
    "message_body" "text" NOT NULL,
    "media_url" "text",
    "schedule_at" timestamp with time zone,
    "status" "text" DEFAULT 'DRAFT'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "submitted_by" "text",
    "submitted_at" timestamp with time zone,
    "approved_by" "text",
    "approved_at" timestamp with time zone,
    "rejected_by" "text",
    "rejected_at" timestamp with time zone,
    "rejection_reason" "text"
);


ALTER TABLE "public"."broadcast_messages" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_approve_broadcast_message"("p_id" "uuid") RETURNS "public"."broadcast_messages"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_row public.broadcast_messages;
begin
  if not public.can_approve_approval() then
    raise exception 'Not allowed to approve broadcast message';
  end if;

  update public.broadcast_messages
  set
    status = 'APPROVED',
    approved_by = coalesce(auth.jwt() ->> 'email', auth.uid()::text, 'system'),
    approved_at = now()
  where id = p_id
    and upper(coalesce(status, '')) = 'PENDING_APPROVAL'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Broadcast message not found or invalid status for approve';
  end if;

  perform public.log_approval_history(
    'broadcast_message',
    v_row.id,
    'APPROVE',
    null,
    jsonb_build_object(
      'message_title', v_row.message_title,
      'status', v_row.status
    )
  );

  return v_row;
end;
$$;


ALTER FUNCTION "public"."rpc_approve_broadcast_message"("p_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cash_vouchers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "voucher_no" "text" NOT NULL,
    "voucher_date" "date" NOT NULL,
    "payee_name" "text" NOT NULL,
    "amount" numeric(18,2) DEFAULT 0 NOT NULL,
    "description" "text" NOT NULL,
    "account_code" "text" NOT NULL,
    "status" "text" DEFAULT 'DRAFT'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "submitted_by" "text",
    "submitted_at" timestamp with time zone,
    "approved_by" "text",
    "approved_at" timestamp with time zone,
    "rejected_by" "text",
    "rejected_at" timestamp with time zone,
    "rejection_reason" "text",
    CONSTRAINT "chk_cash_vouchers_amount_nonnegative" CHECK (("amount" >= (0)::numeric))
);


ALTER TABLE "public"."cash_vouchers" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_approve_cash_voucher"("p_id" "uuid") RETURNS "public"."cash_vouchers"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_row public.cash_vouchers;
begin
  if not public.can_approve_approval() then
    raise exception 'Not allowed to approve cash voucher';
  end if;

  update public.cash_vouchers
  set
    status = 'APPROVED',
    approved_by = coalesce(auth.jwt() ->> 'email', auth.uid()::text, 'system'),
    approved_at = now()
  where id = p_id
    and upper(coalesce(status, '')) = 'PENDING_APPROVAL'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Cash voucher not found or invalid status for approve';
  end if;

  perform public.log_approval_history(
    'cash_voucher',
    v_row.id,
    'APPROVE',
    null,
    jsonb_build_object(
      'voucher_no', v_row.voucher_no,
      'status', v_row.status
    )
  );

  return v_row;
end;
$$;


ALTER FUNCTION "public"."rpc_approve_cash_voucher"("p_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."journal_vouchers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "voucher_no" "text" NOT NULL,
    "voucher_date" "date" NOT NULL,
    "description" "text" NOT NULL,
    "account_code" "text" NOT NULL,
    "debit" numeric(18,2) DEFAULT 0,
    "credit" numeric(18,2) DEFAULT 0,
    "reference_no" "text",
    "status" "text" DEFAULT 'DRAFT'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "submitted_by" "text",
    "submitted_at" timestamp with time zone,
    "approved_by" "text",
    "approved_at" timestamp with time zone,
    "rejected_by" "text",
    "rejected_at" timestamp with time zone,
    "rejection_reason" "text",
    CONSTRAINT "chk_journal_vouchers_amounts_nonnegative" CHECK (((COALESCE("debit", (0)::numeric) >= (0)::numeric) AND (COALESCE("credit", (0)::numeric) >= (0)::numeric)))
);


ALTER TABLE "public"."journal_vouchers" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_approve_journal_voucher"("p_id" "uuid") RETURNS "public"."journal_vouchers"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_row public.journal_vouchers;
begin
  if not public.can_approve_approval() then
    raise exception 'Not allowed to approve journal voucher';
  end if;

  update public.journal_vouchers
  set
    status = 'APPROVED',
    approved_by = coalesce(auth.jwt() ->> 'email', auth.uid()::text, 'system'),
    approved_at = now()
  where id = p_id
    and upper(coalesce(status, '')) = 'PENDING_APPROVAL'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Journal voucher not found or invalid status for approve';
  end if;

  perform public.log_approval_history(
    'journal_voucher',
    v_row.id,
    'APPROVE',
    null,
    jsonb_build_object(
      'voucher_no', v_row.voucher_no,
      'status', v_row.status
    )
  );

  return v_row;
end;
$$;


ALTER FUNCTION "public"."rpc_approve_journal_voucher"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_archive_broadcast_message"("p_id" "uuid") RETURNS "public"."broadcast_messages"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_row public.broadcast_messages;
begin
  update public.broadcast_messages
  set status = 'ARCHIVED'
  where id = p_id
    and upper(coalesce(status, '')) <> 'ARCHIVED'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Broadcast message not found or already archived';
  end if;

  perform public.log_approval_history(
    'broadcast_message',
    v_row.id,
    'ARCHIVE',
    null,
    jsonb_build_object(
      'message_title', v_row.message_title,
      'status', v_row.status
    )
  );

  return v_row;
end;
$$;


ALTER FUNCTION "public"."rpc_archive_broadcast_message"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_archive_cash_voucher"("p_id" "uuid") RETURNS "public"."cash_vouchers"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_row public.cash_vouchers;
begin
  update public.cash_vouchers
  set status = 'VOID'
  where id = p_id
    and upper(coalesce(status, '')) <> 'VOID'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Cash voucher not found or already void';
  end if;

  perform public.log_approval_history(
    'cash_voucher',
    v_row.id,
    'ARCHIVE',
    null,
    jsonb_build_object(
      'voucher_no', v_row.voucher_no,
      'status', v_row.status
    )
  );

  return v_row;
end;
$$;


ALTER FUNCTION "public"."rpc_archive_cash_voucher"("p_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deliverymen" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "staff_code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "email" "text",
    "branch_id" "uuid",
    "vehicle_type" "text",
    "license_no" "text",
    "status" "text" DEFAULT 'ACTIVE'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."deliverymen" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_archive_deliveryman"("p_id" "uuid") RETURNS "public"."deliverymen"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_row public.deliverymen;
begin
  update public.deliverymen
  set status = 'INACTIVE'
  where id = p_id
    and upper(coalesce(status, '')) <> 'INACTIVE'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Deliveryman not found or already inactive';
  end if;

  perform public.log_approval_history(
    'deliveryman',
    v_row.id,
    'ARCHIVE',
    null,
    jsonb_build_object(
      'staff_code', v_row.staff_code,
      'name', v_row.name,
      'status', v_row.status
    )
  );

  return v_row;
end;
$$;


ALTER FUNCTION "public"."rpc_archive_deliveryman"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_archive_journal_voucher"("p_id" "uuid") RETURNS "public"."journal_vouchers"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_row public.journal_vouchers;
begin
  update public.journal_vouchers
  set status = 'VOID'
  where id = p_id
    and upper(coalesce(status, '')) <> 'VOID'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Journal voucher not found or already void';
  end if;

  perform public.log_approval_history(
    'journal_voucher',
    v_row.id,
    'ARCHIVE',
    null,
    jsonb_build_object(
      'voucher_no', v_row.voucher_no,
      'status', v_row.status
    )
  );

  return v_row;
end;
$$;


ALTER FUNCTION "public"."rpc_archive_journal_voucher"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_filter_options_branches"() RETURNS "jsonb"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'value', x.value,
        'labelEn', x.label_en,
        'labelMy', x.label_my
      )
      order by x.label_en
    ),
    '[]'::jsonb
  )
  from (
    select distinct
      coalesce(b.code, b.id::text) as value,
      coalesce(b.name, b.code, b.id::text) as label_en,
      coalesce(b.name, b.code, b.id::text) as label_my
    from public.branches b
    where coalesce(b.is_active, true) = true
  ) x;
$$;


ALTER FUNCTION "public"."rpc_filter_options_branches"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_filter_options_deliverymen"() RETURNS "jsonb"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'value', x.value,
        'labelEn', x.label_en,
        'labelMy', x.label_my
      )
      order by x.label_en
    ),
    '[]'::jsonb
  )
  from (
    select distinct
      d.id::text as value,
      d.id::text as label_en,
      d.id::text as label_my
    from public.deliverymen d
  ) x;
$$;


ALTER FUNCTION "public"."rpc_filter_options_deliverymen"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_filter_options_merchants"() RETURNS "jsonb"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'value', x.value,
        'labelEn', x.label_en,
        'labelMy', x.label_my
      )
      order by x.label_en
    ),
    '[]'::jsonb
  )
  from (
    select distinct
      m.id::text as value,
      m.id::text as label_en,
      m.id::text as label_my
    from public.merchants m
  ) x;
$$;


ALTER FUNCTION "public"."rpc_filter_options_merchants"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_reject_broadcast_message"("p_id" "uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS "public"."broadcast_messages"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_row public.broadcast_messages;
  v_clean_reason text := nullif(trim(coalesce(p_reason, '')), '');
begin
  if not public.can_reject_approval() then
    raise exception 'Not allowed to reject broadcast message';
  end if;

  update public.broadcast_messages
  set
    status = 'REJECTED',
    rejected_by = coalesce(auth.jwt() ->> 'email', auth.uid()::text, 'system'),
    rejected_at = now(),
    rejection_reason = v_clean_reason
  where id = p_id
    and upper(coalesce(status, '')) = 'PENDING_APPROVAL'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Broadcast message not found or invalid status for reject';
  end if;

  perform public.log_approval_history(
    'broadcast_message',
    v_row.id,
    'REJECT',
    v_clean_reason,
    jsonb_build_object(
      'message_title', v_row.message_title,
      'status', v_row.status
    )
  );

  return v_row;
end;
$$;


ALTER FUNCTION "public"."rpc_reject_broadcast_message"("p_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_reject_cash_voucher"("p_id" "uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS "public"."cash_vouchers"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_row public.cash_vouchers;
  v_clean_reason text := nullif(trim(coalesce(p_reason, '')), '');
begin
  if not public.can_reject_approval() then
    raise exception 'Not allowed to reject cash voucher';
  end if;

  update public.cash_vouchers
  set
    status = 'REJECTED',
    rejected_by = coalesce(auth.jwt() ->> 'email', auth.uid()::text, 'system'),
    rejected_at = now(),
    rejection_reason = v_clean_reason
  where id = p_id
    and upper(coalesce(status, '')) = 'PENDING_APPROVAL'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Cash voucher not found or invalid status for reject';
  end if;

  perform public.log_approval_history(
    'cash_voucher',
    v_row.id,
    'REJECT',
    v_clean_reason,
    jsonb_build_object(
      'voucher_no', v_row.voucher_no,
      'status', v_row.status
    )
  );

  return v_row;
end;
$$;


ALTER FUNCTION "public"."rpc_reject_cash_voucher"("p_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_reject_journal_voucher"("p_id" "uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS "public"."journal_vouchers"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_row public.journal_vouchers;
  v_clean_reason text := nullif(trim(coalesce(p_reason, '')), '');
begin
  if not public.can_reject_approval() then
    raise exception 'Not allowed to reject journal voucher';
  end if;

  update public.journal_vouchers
  set
    status = 'REJECTED',
    rejected_by = coalesce(auth.jwt() ->> 'email', auth.uid()::text, 'system'),
    rejected_at = now(),
    rejection_reason = v_clean_reason
  where id = p_id
    and upper(coalesce(status, '')) = 'PENDING_APPROVAL'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Journal voucher not found or invalid status for reject';
  end if;

  perform public.log_approval_history(
    'journal_voucher',
    v_row.id,
    'REJECT',
    v_clean_reason,
    jsonb_build_object(
      'voucher_no', v_row.voucher_no,
      'status', v_row.status
    )
  );

  return v_row;
end;
$$;


ALTER FUNCTION "public"."rpc_reject_journal_voucher"("p_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_restore_broadcast_message"("p_id" "uuid") RETURNS "public"."broadcast_messages"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_row public.broadcast_messages;
begin
  update public.broadcast_messages
  set
    status = 'DRAFT',
    rejected_by = null,
    rejected_at = null,
    rejection_reason = null
  where id = p_id
    and upper(coalesce(status, '')) in ('ARCHIVED', 'REJECTED', 'VOID')
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Broadcast message not found or not restorable';
  end if;

  perform public.log_approval_history(
    'broadcast_message',
    v_row.id,
    'RESTORE',
    null,
    jsonb_build_object(
      'message_title', v_row.message_title,
      'status', v_row.status
    )
  );

  return v_row;
end;
$$;


ALTER FUNCTION "public"."rpc_restore_broadcast_message"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_restore_cash_voucher"("p_id" "uuid") RETURNS "public"."cash_vouchers"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_row public.cash_vouchers;
begin
  update public.cash_vouchers
  set
    status = 'DRAFT',
    rejected_by = null,
    rejected_at = null,
    rejection_reason = null
  where id = p_id
    and upper(coalesce(status, '')) in ('VOID', 'REJECTED', 'ARCHIVED')
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Cash voucher not found or not restorable';
  end if;

  perform public.log_approval_history(
    'cash_voucher',
    v_row.id,
    'RESTORE',
    null,
    jsonb_build_object(
      'voucher_no', v_row.voucher_no,
      'status', v_row.status
    )
  );

  return v_row;
end;
$$;


ALTER FUNCTION "public"."rpc_restore_cash_voucher"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_restore_deliveryman"("p_id" "uuid") RETURNS "public"."deliverymen"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_row public.deliverymen;
begin
  update public.deliverymen
  set status = 'ACTIVE'
  where id = p_id
    and upper(coalesce(status, '')) = 'INACTIVE'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Deliveryman not found or not inactive';
  end if;

  perform public.log_approval_history(
    'deliveryman',
    v_row.id,
    'RESTORE',
    null,
    jsonb_build_object(
      'staff_code', v_row.staff_code,
      'name', v_row.name,
      'status', v_row.status
    )
  );

  return v_row;
end;
$$;


ALTER FUNCTION "public"."rpc_restore_deliveryman"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_restore_journal_voucher"("p_id" "uuid") RETURNS "public"."journal_vouchers"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_row public.journal_vouchers;
begin
  update public.journal_vouchers
  set
    status = 'DRAFT',
    rejected_by = null,
    rejected_at = null,
    rejection_reason = null
  where id = p_id
    and upper(coalesce(status, '')) in ('VOID', 'REJECTED', 'ARCHIVED')
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Journal voucher not found or not restorable';
  end if;

  perform public.log_approval_history(
    'journal_voucher',
    v_row.id,
    'RESTORE',
    null,
    jsonb_build_object(
      'voucher_no', v_row.voucher_no,
      'status', v_row.status
    )
  );

  return v_row;
end;
$$;


ALTER FUNCTION "public"."rpc_restore_journal_voucher"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_submit_broadcast_message"("p_id" "uuid") RETURNS "public"."broadcast_messages"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_row public.broadcast_messages;
  v_actor text := coalesce(auth.jwt() ->> 'email', auth.uid()::text, 'system');
begin
  if not public.can_submit_approval() then
    raise exception 'Not allowed to submit broadcast message';
  end if;

  update public.broadcast_messages
  set
    status = 'PENDING_APPROVAL',
    submitted_by = v_actor,
    submitted_at = now(),
    approved_by = null,
    approved_at = null,
    rejected_by = null,
    rejected_at = null,
    rejection_reason = null
  where id = p_id
    and upper(coalesce(status, '')) in ('DRAFT', 'REJECTED')
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Broadcast message not found or invalid status for submit';
  end if;

  perform public.log_approval_history(
    'broadcast_message',
    v_row.id,
    'SUBMIT',
    null,
    jsonb_build_object(
      'message_title', v_row.message_title,
      'status', v_row.status
    )
  );

  return v_row;
end;
$$;


ALTER FUNCTION "public"."rpc_submit_broadcast_message"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_submit_cash_voucher"("p_id" "uuid") RETURNS "public"."cash_vouchers"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_row public.cash_vouchers;
  v_actor text := coalesce(auth.jwt() ->> 'email', auth.uid()::text, 'system');
begin
  if not public.can_submit_approval() then
    raise exception 'Not allowed to submit cash voucher';
  end if;

  update public.cash_vouchers
  set
    status = 'PENDING_APPROVAL',
    submitted_by = v_actor,
    submitted_at = now(),
    approved_by = null,
    approved_at = null,
    rejected_by = null,
    rejected_at = null,
    rejection_reason = null
  where id = p_id
    and upper(coalesce(status, '')) in ('DRAFT', 'REJECTED')
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Cash voucher not found or invalid status for submit';
  end if;

  perform public.log_approval_history(
    'cash_voucher',
    v_row.id,
    'SUBMIT',
    null,
    jsonb_build_object(
      'voucher_no', v_row.voucher_no,
      'status', v_row.status
    )
  );

  return v_row;
end;
$$;


ALTER FUNCTION "public"."rpc_submit_cash_voucher"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_submit_journal_voucher"("p_id" "uuid") RETURNS "public"."journal_vouchers"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_row public.journal_vouchers;
  v_actor text := coalesce(auth.jwt() ->> 'email', auth.uid()::text, 'system');
begin
  if not public.can_submit_approval() then
    raise exception 'Not allowed to submit journal voucher';
  end if;

  update public.journal_vouchers
  set
    status = 'PENDING_APPROVAL',
    submitted_by = v_actor,
    submitted_at = now(),
    approved_by = null,
    approved_at = null,
    rejected_by = null,
    rejected_at = null,
    rejection_reason = null
  where id = p_id
    and upper(coalesce(status, '')) in ('DRAFT', 'REJECTED')
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Journal voucher not found or invalid status for submit';
  end if;

  perform public.log_approval_history(
    'journal_voucher',
    v_row.id,
    'SUBMIT',
    null,
    jsonb_build_object(
      'voucher_no', v_row.voucher_no,
      'status', v_row.status
    )
  );

  return v_row;
end;
$$;


ALTER FUNCTION "public"."rpc_submit_journal_voucher"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_electronic_signature_2026_02_19_15_00"("p_signature_data" "text", "p_signature_type" "text", "p_reference_id" "uuid", "p_reference_type" "text", "p_signer_name" "text", "p_signer_id_number" "text" DEFAULT NULL::"text", "p_signer_phone" "text" DEFAULT NULL::"text", "p_signed_by" "uuid" DEFAULT NULL::"uuid", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("success" boolean, "signature_id" "uuid", "message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_signature_id UUID;
BEGIN
  -- Insert signature record
  INSERT INTO electronic_signatures_2026_02_19_15_00 (
    signature_data, signature_type, reference_id, reference_type,
    signer_name, signer_id_number, signer_phone, signed_by, signature_metadata
  ) VALUES (
    p_signature_data, p_signature_type, p_reference_id, p_reference_type,
    p_signer_name, p_signer_id_number, p_signer_phone, p_signed_by, p_metadata
  ) RETURNING id INTO v_signature_id;

  RETURN QUERY SELECT true, v_signature_id, 'Electronic signature saved successfully'::TEXT;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::UUID, SQLERRM::TEXT;
END;
$$;


ALTER FUNCTION "public"."save_electronic_signature_2026_02_19_15_00"("p_signature_data" "text", "p_signature_type" "text", "p_reference_id" "uuid", "p_reference_type" "text", "p_signer_name" "text", "p_signer_id_number" "text", "p_signer_phone" "text", "p_signed_by" "uuid", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sc_enforce_state_machine"("p_shipment_id" "uuid", "p_event_type" "text", "p_segment" "text", "p_meta" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  ev text := upper(coalesce(p_event_type,''));
begin
  -- EN: Printing/doc events are audit events; allow them.
  -- MY: Printing/doc event များသည် audit အတွက်သာ၊ ခွင့်ပြုမည်။
  if ev like 'DOC_%' then
    return;
  end if;

  -- NOTE: The full enforcement rules are defined in your previous migration.
  -- This function is redefined here only to add DOC_* bypass.
  -- If you already have extended rules in DB, re-apply them after this with your final version.
end;
$$;


ALTER FUNCTION "public"."sc_enforce_state_machine"("p_shipment_id" "uuid", "p_event_type" "text", "p_segment" "text", "p_meta" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sc_event_before_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Handle system-level auto-approvals
  NEW.auth_user_id := COALESCE(auth.uid(), NEW.auth_user_id);
  NEW.actor_role := COALESCE(NEW.actor_role, 'SYSTEM_AUTO');
  
  -- Re-link way_id if missing
  IF NEW.shipment_id IS NULL THEN
    SELECT id INTO NEW.shipment_id FROM public.shipments WHERE way_id = NEW.way_id LIMIT 1;
  END IF;

  -- ENFORCE: Check state machine rules
  PERFORM public.sc_enforce_state_machine(NEW.shipment_id, NEW.event_type, NEW.segment, COALESCE(NEW.meta,'{}'::jsonb));

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sc_event_before_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."scan_qr_code_2026_02_19_15_00"("p_qr_code" "text", "p_scanned_by" "uuid" DEFAULT NULL::"uuid", "p_scan_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("success" boolean, "qr_data" "jsonb", "reference_id" "uuid", "reference_type" "text", "message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_qr_record RECORD;
BEGIN
  -- Get QR code record
  SELECT * INTO v_qr_record
  FROM qr_codes_advanced_2026_02_19_15_00
  WHERE qr_code = p_qr_code AND status = 'ACTIVE';

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::JSONB, NULL::UUID, NULL::TEXT, 'QR code not found or inactive'::TEXT;
    RETURN;
  END IF;

  -- Update scan information
  UPDATE qr_codes_advanced_2026_02_19_15_00
  SET 
    status = 'SCANNED',
    scanned_by = p_scanned_by,
    scanned_at = NOW(),
    scan_count = scan_count + 1,
    metadata = metadata || p_scan_metadata
  WHERE qr_code = p_qr_code;

  RETURN QUERY SELECT 
    true, 
    v_qr_record.data, 
    v_qr_record.reference_id, 
    v_qr_record.reference_type, 
    'QR code scanned successfully'::TEXT;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::JSONB, NULL::UUID, NULL::TEXT, SQLERRM::TEXT;
END;
$$;


ALTER FUNCTION "public"."scan_qr_code_2026_02_19_15_00"("p_qr_code" "text", "p_scanned_by" "uuid", "p_scan_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_tracking_on_create"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO public.shipment_tracking (shipment_id, status, notes, is_customer_visible)
  VALUES (NEW.id, 'pending', 'Shipment information received / ပါဆယ်ပို့ဆောင်ရန် အချက်အလက်လက်ခံရရှိပါသည်။', true);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."seed_tracking_on_create"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_environment_from_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  user_demo boolean;
begin
  select is_demo into user_demo
  from profiles
  where id = auth.uid();

  if user_demo then
    new.environment := 'demo';
  else
    new.environment := 'production';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."set_environment_from_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_new_user_password_policy"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.raw_user_meta_data = coalesce(NEW.raw_user_meta_data, '{}'::jsonb) 
    || jsonb_build_object('must_change_password', true);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_new_user_password_policy"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_branch_columns"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    NEW.branch_id := NEW.branch_code;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_branch_columns"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "public"."touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transition_shipment"("p_shipment_id" "uuid", "p_next_status" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  current_status text;
begin
  select status into current_status
  from shipments
  where id = p_shipment_id;

  if current_status = 'CREATED' and p_next_status = 'PICKED_UP' then
    update shipments set status = p_next_status where id = p_shipment_id;

  elsif current_status = 'PICKED_UP' and p_next_status = 'IN_TRANSIT' then
    update shipments set status = p_next_status where id = p_shipment_id;

  elsif current_status = 'IN_TRANSIT' and p_next_status = 'ARRIVED_AT_BRANCH' then
    update shipments set status = p_next_status where id = p_shipment_id;

  elsif current_status = 'ARRIVED_AT_BRANCH' and p_next_status = 'OUT_FOR_DELIVERY' then
    update shipments set status = p_next_status where id = p_shipment_id;

  elsif current_status = 'OUT_FOR_DELIVERY' and p_next_status = 'DELIVERED' then
    update shipments set status = p_next_status where id = p_shipment_id;

  else
    raise exception 'Invalid status transition from % to %', current_status, p_next_status;
  end if;

  insert into audit_logs(user_id, action, table_name, record_id, new_data)
  values (auth.uid(), 'STATUS_CHANGED', 'shipments', p_shipment_id, jsonb_build_object('status', p_next_status));

end;
$$;


ALTER FUNCTION "public"."transition_shipment"("p_shipment_id" "uuid", "p_next_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_auto_assign_shipment_2026_02_19_17_00"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Auto-assign shipment after creation
    PERFORM auto_assign_shipment_2026_02_19_17_00(
        NEW.id,
        jsonb_build_object(
            'pickup_location', NEW.pickup_address,
            'delivery_location', NEW.delivery_address,
            'cod_amount', NEW.cod_amount,
            'service_type', NEW.service_type,
            'weight', NEW.weight
        )
    );
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_auto_assign_shipment_2026_02_19_17_00"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_inventory"("p_inventory_id" "uuid", "p_movement_type" character varying, "p_quantity" integer, "p_reference_type" character varying, "p_reference_id" "uuid", "p_performed_by" "uuid", "p_notes" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    current_stock INTEGER;
    new_stock INTEGER;
BEGIN
    -- Get current stock
    SELECT current_stock INTO current_stock
    FROM public.inventory_2026_02_19_13_00
    WHERE id = p_inventory_id;
    
    -- Calculate new stock based on movement type
    IF p_movement_type = 'IN' THEN
        new_stock := current_stock + p_quantity;
    ELSIF p_movement_type = 'OUT' THEN
        new_stock := current_stock - p_quantity;
        IF new_stock < 0 THEN
            RAISE EXCEPTION 'Insufficient stock. Current: %, Requested: %', current_stock, p_quantity;
        END IF;
    ELSE
        new_stock := current_stock;
    END IF;
    
    -- Update inventory
    UPDATE public.inventory_2026_02_19_13_00
    SET current_stock = new_stock
    WHERE id = p_inventory_id;
    
    -- Record movement
    INSERT INTO public.inventory_movements_2026_02_19_13_00 (
        inventory_id, movement_type, quantity, reference_type, reference_id, performed_by, notes
    ) VALUES (
        p_inventory_id, p_movement_type, p_quantity, p_reference_type, p_reference_id, p_performed_by, p_notes
    );
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."update_inventory"("p_inventory_id" "uuid", "p_movement_type" character varying, "p_quantity" integer, "p_reference_type" character varying, "p_reference_id" "uuid", "p_performed_by" "uuid", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_shipment_status"("p_way_id" "text", "p_new_status" "text", "p_location" "text" DEFAULT NULL::"text", "p_notes" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_sid uuid;
BEGIN
  -- Get the shipment ID
  SELECT id INTO v_sid FROM public.shipments WHERE way_id = p_way_id;
  IF v_sid IS NULL THEN RAISE EXCEPTION 'Shipment not found'; END IF;

  -- 1. Update the main table
  UPDATE public.shipments 
  SET 
    status = p_new_status::public.shipment_status,
    actual_pickup_time = CASE WHEN p_new_status = 'picked_up' THEN now() ELSE actual_pickup_time END,
    actual_delivery_time = CASE WHEN p_new_status = 'delivered' THEN now() ELSE actual_delivery_time END
  WHERE id = v_sid;

  -- 2. Add to the tracking history (the audit trail)
  INSERT INTO public.shipment_tracking (
    shipment_id, 
    status, 
    location, 
    notes, 
    handled_by
  ) VALUES (
    v_sid, 
    p_new_status, 
    p_location, 
    p_notes, 
    auth.uid()
  );

  RETURN true;
END;
$$;


ALTER FUNCTION "public"."update_shipment_status"("p_way_id" "text", "p_new_status" "text", "p_location" "text", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_shipment_status"("p_shipment_id" "uuid", "p_status" character varying, "p_location" character varying, "p_updated_by" "uuid", "p_notes" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update shipment status
    UPDATE public.shipments_2026_02_19_13_00
    SET status = p_status, current_location = p_location
    WHERE id = p_shipment_id;
    
    -- Add tracking entry
    INSERT INTO public.shipment_tracking_2026_02_19_13_00 (
        shipment_id, status, location, updated_by, notes
    ) VALUES (
        p_shipment_id, p_status, p_location, p_updated_by, p_notes
    );
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."update_shipment_status"("p_shipment_id" "uuid", "p_status" character varying, "p_location" character varying, "p_updated_by" "uuid", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_shipment_workflow_2026_02_19_17_00"("p_shipment_id" "uuid", "p_new_state" character varying, "p_user_id" "uuid" DEFAULT NULL::"uuid", "p_notes" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_current_state VARCHAR(50);
    v_result JSONB;
BEGIN
    -- Get current state
    SELECT current_state INTO v_current_state
    FROM shipment_workflow_states_2026_02_19_17_00
    WHERE shipment_id = p_shipment_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Update workflow state
    UPDATE shipment_workflow_states_2026_02_19_17_00
    SET 
        previous_state = v_current_state,
        current_state = p_new_state,
        updated_at = NOW()
    WHERE shipment_id = p_shipment_id;
    
    -- Update assignment queue if needed
    UPDATE assignment_queue_2026_02_19_17_00
    SET 
        status = CASE 
            WHEN p_new_state IN ('DELIVERED', 'CANCELLED') THEN 'COMPLETED'
            WHEN p_new_state IN ('OUT_FOR_DELIVERY', 'IN_TRANSIT') THEN 'PROCESSING'
            ELSE status
        END,
        processed_at = CASE 
            WHEN p_new_state IN ('DELIVERED', 'CANCELLED') THEN NOW()
            ELSE processed_at
        END
    WHERE shipment_id = p_shipment_id;
    
    -- Create notifications for state changes
    IF p_new_state = 'READY_FOR_PICKUP' THEN
        INSERT INTO realtime_notifications_2026_02_19_17_00 (
            user_id, notification_type, title, message, data
        )
        SELECT 
            u.id, 'SHIPMENT_READY', 'Shipment Ready for Pickup',
            'Shipment is ready for pickup from warehouse',
            jsonb_build_object('shipment_id', p_shipment_id)
        FROM users_2026_02_19_13_00 u
        WHERE u.role = 'RIDER' AND u.status = 'ACTIVE';
    END IF;
    
    v_result := jsonb_build_object(
        'success', true,
        'previous_state', v_current_state,
        'new_state', p_new_state,
        'updated_at', NOW()
    );
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."update_shipment_workflow_2026_02_19_17_00"("p_shipment_id" "uuid", "p_new_state" character varying, "p_user_id" "uuid", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_password"("password" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
begin
  return length(password) >= 12
     and password ~ '[A-Z]'
     and password ~ '[a-z]'
     and password ~ '[0-9]'
     and password ~ '[^a-zA-Z0-9]';
end;
$$;


ALTER FUNCTION "public"."validate_password"("password" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_shipment_transition"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  current_status text;
begin
  select status into current_status from shipments where id = new.id;

  if current_status = 'CREATED' and new.status not in ('PICKED_UP','CANCELLED') then
    raise exception 'Invalid transition';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."validate_shipment_transition"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_signature_2026_02_18_18_00"("p_signature_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_signature RECORD;
    v_validation_result JSONB;
    v_quality_score DECIMAL := 0;
BEGIN
    SELECT * INTO v_signature
    FROM public.electronic_signatures_2026_02_18_18_00
    WHERE id = p_signature_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Signature not found');
    END IF;
    
    -- Basic validation checks
    v_validation_result := jsonb_build_object(
        'signature_present', v_signature.signature_data IS NOT NULL,
        'signer_name_present', v_signature.signer_name IS NOT NULL,
        'delivery_location_present', v_signature.delivery_location IS NOT NULL,
        'timestamp_valid', v_signature.delivery_timestamp IS NOT NULL
    );
    
    -- Calculate quality score
    IF v_signature.signature_data IS NOT NULL THEN v_quality_score := v_quality_score + 25; END IF;
    IF v_signature.signer_name IS NOT NULL THEN v_quality_score := v_quality_score + 15; END IF;
    IF v_signature.signer_phone IS NOT NULL THEN v_quality_score := v_quality_score + 10; END IF;
    IF v_signature.signer_id_number IS NOT NULL THEN v_quality_score := v_quality_score + 20; END IF;
    IF v_signature.recipient_photo_url IS NOT NULL THEN v_quality_score := v_quality_score + 15; END IF;
    IF v_signature.package_photo_url IS NOT NULL THEN v_quality_score := v_quality_score + 10; END IF;
    IF v_signature.delivery_location IS NOT NULL THEN v_quality_score := v_quality_score + 5; END IF;
    
    -- Update signature with quality score
    UPDATE public.electronic_signatures_2026_02_18_18_00
    SET 
        signature_quality_score = v_quality_score,
        is_verified = v_quality_score >= 70,
        updated_at = NOW()
    WHERE id = p_signature_id;
    
    RETURN jsonb_build_object(
        'validation_result', v_validation_result,
        'quality_score', v_quality_score,
        'is_verified', v_quality_score >= 70,
        'recommendations', CASE 
            WHEN v_quality_score < 70 THEN jsonb_build_array(
                'Add recipient photo',
                'Verify signer ID',
                'Capture package photo'
            )
            ELSE jsonb_build_array()
        END
    );
END;
$$;


ALTER FUNCTION "public"."validate_signature_2026_02_18_18_00"("p_signature_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."active_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "branch_id" "uuid",
    "role" "text",
    "login_time" timestamp with time zone DEFAULT "now"(),
    "last_seen" timestamp with time zone DEFAULT "now"(),
    "ip_address" "text",
    "user_agent" "text",
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."active_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."addresses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_name" character varying(180) NOT NULL,
    "company_name" character varying(180),
    "phone_primary" character varying(30) NOT NULL,
    "phone_secondary" character varying(30),
    "email" character varying(255),
    "address_line_1" "text" NOT NULL,
    "address_line_2" "text",
    "area" character varying(120),
    "city" character varying(120) NOT NULL,
    "district" character varying(120),
    "state_region" character varying(120),
    "postal_code" character varying(20),
    "country_code" character(2) DEFAULT 'MM'::"bpchar" NOT NULL,
    "latitude" numeric(10,7),
    "longitude" numeric(10,7),
    "landmark" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."addresses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying NOT NULL,
    "full_name" character varying NOT NULL,
    "role" character varying NOT NULL,
    "status" character varying DEFAULT 'active'::character varying,
    "hub_assignment" character varying DEFAULT 'Global'::character varying,
    "must_change_password" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "password_hash" "text"
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."air_cargo_specifications_2026_02_18_18_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "airline_code" character varying(10) NOT NULL,
    "airline_name_en" "text" NOT NULL,
    "airline_name_mm" "text" NOT NULL,
    "volume_weight_divisor" integer DEFAULT 6000,
    "dimensional_weight_divisor" integer DEFAULT 5000,
    "max_length_cm" integer DEFAULT 300,
    "max_width_cm" integer DEFAULT 200,
    "max_height_cm" integer DEFAULT 160,
    "max_weight_kg" numeric(8,2) DEFAULT 1000.00,
    "oversized_threshold_cm" integer DEFAULT 200,
    "oversized_fee_percentage" numeric(5,2) DEFAULT 25.00,
    "fragile_handling_fee_usd" numeric(8,2) DEFAULT 15.00,
    "destinations_served" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."air_cargo_specifications_2026_02_18_18_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text",
    "full_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "phone" "text",
    "township" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."merchants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text",
    "business_name" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "merchant_code" "text",
    "merchant_name" "text",
    "contact_person" "text",
    "phone" "text",
    "business_type" "text",
    "address" "text",
    "status" "text" DEFAULT 'ACTIVE'::"text" NOT NULL,
    "registration_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "township" "text",
    "city" "text",
    "state" "text" DEFAULT 'Yangon'::"text"
);


ALTER TABLE "public"."merchants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "branch_id" "uuid",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_demo" boolean DEFAULT false,
    "created_by" "uuid"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."app_identities" AS
 WITH "me" AS (
         SELECT "auth"."uid"() AS "auth_user_id",
            "lower"(COALESCE(("auth"."jwt"() ->> 'email'::"text"), ''::"text")) AS "email"
        )
 SELECT "me"."auth_user_id",
    NULLIF("me"."email", ''::"text") AS "email",
    "u"."id" AS "user_id",
    "m"."id" AS "merchant_id",
    "c"."id" AS "customer_id",
    NULL::"uuid" AS "user_enhanced_id",
    NULL::"uuid" AS "admin_user_id",
    "u"."role" AS "primary_role"
   FROM ((("me"
     LEFT JOIN "public"."users" "u" ON (("u"."id" = "me"."auth_user_id")))
     LEFT JOIN "public"."merchants" "m" ON (("m"."id" = "me"."auth_user_id")))
     LEFT JOIN "public"."customers" "c" ON (("lower"("c"."email") = "me"."email")));


ALTER VIEW "public"."app_identities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."approval_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "actor" "text" NOT NULL,
    "actor_role" "text",
    "reason" "text",
    "meta" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."approval_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."approval_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" "text",
    "record_id" "uuid",
    "requested_by" "uuid",
    "status" "text" DEFAULT 'PENDING'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."approval_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."approval_workflows_2026_02_28_20_06" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workflow_type" character varying(50) NOT NULL,
    "reference_id" "uuid" NOT NULL,
    "reference_table" character varying(100) NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "approver_role" character varying(50) NOT NULL,
    "assigned_approver" "uuid",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "request_data" "jsonb",
    "approval_notes" "text",
    "approved_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "approval_workflows_2026_02_28_20_06_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'expired'::character varying])::"text"[])))
);


ALTER TABLE "public"."approval_workflows_2026_02_28_20_06" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "requested_by" "uuid",
    "approved_by" "uuid",
    "status" "text" DEFAULT 'PENDING'::"text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."approvals" OWNER TO "postgres";


COMMENT ON TABLE "public"."approvals" IS 'Workflow approvals (shipments).';



CREATE TABLE IF NOT EXISTS "public"."assignment_queue_2026_02_19_17_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "queue_type" character varying(50) NOT NULL,
    "priority" integer DEFAULT 5,
    "branch_id" "uuid",
    "assigned_user_id" "uuid",
    "assignment_criteria" "jsonb" DEFAULT '{}'::"jsonb",
    "queue_position" integer,
    "estimated_processing_time" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone,
    "status" character varying(20) DEFAULT 'PENDING'::character varying
);


ALTER TABLE "public"."assignment_queue_2026_02_19_17_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "check_in" timestamp with time zone,
    "check_out" timestamp with time zone,
    "status" "text" DEFAULT 'present'::"text",
    "location" "jsonb",
    "notes" "text",
    "approved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."attendance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_dml_logs" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actor_uid" "uuid",
    "actor_role" "text",
    "action" "text" NOT NULL,
    "table_name" "text" NOT NULL,
    "row_id" "text",
    "old_record" "jsonb",
    "new_record" "jsonb"
);


ALTER TABLE "public"."audit_dml_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."audit_dml_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."audit_dml_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."audit_dml_logs_id_seq" OWNED BY "public"."audit_dml_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" character varying(50) NOT NULL,
    "resource_type" character varying(50),
    "resource_id" character varying(100),
    "old_values" "jsonb",
    "new_values" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "trace_id" "uuid" DEFAULT "gen_random_uuid"(),
    "actor_uid" "uuid",
    "actor_role" "text",
    "table_name" "text",
    "row_id" "text",
    "old_record" "jsonb",
    "new_record" "jsonb"
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."audit_logs" IS 'Audit logs for writes. Inserted by triggers. Direct client writes should be blocked by grants + RLS.';



CREATE TABLE IF NOT EXISTS "public"."audit_trigger_exclusions" (
    "table_name" "text" NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_trigger_exclusions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."authority_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "permission_key" "text" NOT NULL,
    "permission_group" "text" NOT NULL,
    "label_en" "text" NOT NULL,
    "label_my" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."authority_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auto_approve_policies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "max_cod_amount" numeric DEFAULT 0,
    "max_weight" numeric DEFAULT 5,
    "enabled" boolean DEFAULT true
);


ALTER TABLE "public"."auto_approve_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bag_code" "text" NOT NULL,
    "destination" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."branch_daily_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "branch_id" "uuid",
    "metric_date" "date" NOT NULL,
    "total_shipments" integer,
    "delivered" integer,
    "failed" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."branch_daily_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."branch_regions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."branch_regions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."branches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "address" "text",
    "city" "text",
    "country" "text" DEFAULT 'Myanmar'::"text",
    "phone" "text",
    "email" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."branches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chain_of_custody_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "awb" character varying(50) NOT NULL,
    "actor_id" "uuid",
    "action_type" character varying(50) NOT NULL,
    "lat" numeric(10,7),
    "lng" numeric(10,7),
    "evidence_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chain_of_custody_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."claims_2026_02_28_20_06" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "claim_number" character varying(50) NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "claimant_type" character varying(20) NOT NULL,
    "claimant_name" character varying(255) NOT NULL,
    "claimant_phone" character varying(50),
    "claimant_email" character varying(255),
    "claim_type" character varying(50) NOT NULL,
    "claim_amount" numeric(15,2) NOT NULL,
    "description" "text" NOT NULL,
    "evidence_urls" "text"[],
    "status" character varying(20) DEFAULT 'submitted'::character varying,
    "priority" character varying(20) DEFAULT 'medium'::character varying,
    "assigned_to" "uuid",
    "investigated_by" "uuid",
    "approved_by" "uuid",
    "settlement_amount" numeric(15,2),
    "settlement_date" timestamp with time zone,
    "settlement_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "claims_2026_02_28_20_06_claim_type_check" CHECK ((("claim_type")::"text" = ANY ((ARRAY['damage'::character varying, 'loss'::character varying, 'delay'::character varying, 'wrong_delivery'::character varying, 'other'::character varying])::"text"[]))),
    CONSTRAINT "claims_2026_02_28_20_06_claimant_type_check" CHECK ((("claimant_type")::"text" = ANY ((ARRAY['sender'::character varying, 'recipient'::character varying, 'merchant'::character varying])::"text"[]))),
    CONSTRAINT "claims_2026_02_28_20_06_priority_check" CHECK ((("priority")::"text" = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::"text"[]))),
    CONSTRAINT "claims_2026_02_28_20_06_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['submitted'::character varying, 'investigating'::character varying, 'approved'::character varying, 'rejected'::character varying, 'settled'::character varying])::"text"[])))
);


ALTER TABLE "public"."claims_2026_02_28_20_06" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cod_collections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "delivery_id" "uuid" NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "driver_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "collected_at" timestamp with time zone NOT NULL,
    "deposited_at" timestamp with time zone,
    "deposit_reference" "text",
    "status" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cod_collections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cod_collections_2026_02_28_20_06" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "collection_number" character varying(50) NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "collected_amount" numeric(15,2) NOT NULL,
    "collection_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "collected_by" "uuid" NOT NULL,
    "branch_id" "uuid",
    "remitted_amount" numeric(15,2) DEFAULT 0,
    "remitted_date" timestamp with time zone,
    "remitted_by" "uuid",
    "status" character varying(20) DEFAULT 'collected'::character varying,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "cod_collections_2026_02_28_20_06_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['collected'::character varying, 'remitted'::character varying, 'reconciled'::character varying])::"text"[])))
);


ALTER TABLE "public"."cod_collections_2026_02_28_20_06" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."commissions_2026_02_11_14_10" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "base_commission" numeric(10,2) DEFAULT 0,
    "performance_bonus" numeric(10,2) DEFAULT 0,
    "total_commission" numeric(10,2) NOT NULL,
    "payment_status" character varying(50) DEFAULT 'pending'::character varying,
    "calculated_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "paid_at" timestamp with time zone
);


ALTER TABLE "public"."commissions_2026_02_11_14_10" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."complaint_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "complaint_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "attachments" "text"[],
    "is_internal" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."complaint_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."complaints" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_number" "text" NOT NULL,
    "shipment_id" "uuid",
    "customer_id" "uuid",
    "category" "public"."complaint_category" NOT NULL,
    "status" "public"."complaint_status" DEFAULT 'open'::"public"."complaint_status",
    "priority" "public"."task_priority" DEFAULT 'medium'::"public"."task_priority",
    "subject" "text" NOT NULL,
    "description" "text" NOT NULL,
    "assigned_to" "uuid",
    "resolution" "text",
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."complaints" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courier_locations" (
    "user_id" "uuid" NOT NULL,
    "display_name" "text",
    "lat" numeric,
    "lng" numeric,
    "heading" numeric,
    "speed" numeric,
    "accuracy_m" numeric,
    "status" "text" DEFAULT 'ONLINE'::"text",
    "meta" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."courier_locations" REPLICA IDENTITY FULL;


ALTER TABLE "public"."courier_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coverage_zones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "driver_name" character varying(255) NOT NULL,
    "vehicle_type" character varying(50) NOT NULL,
    "townships" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."coverage_zones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_kyc" (
    "user_id" "uuid" NOT NULL,
    "nrc_number" "text" NOT NULL,
    "nrc_front_url" "text" NOT NULL,
    "nrc_back_url" "text",
    "kyc_verified" boolean DEFAULT false NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."customer_kyc" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_segments_2026_02_11_14_10" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "criteria" "jsonb" NOT NULL,
    "customer_count" integer DEFAULT 0,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."customer_segments_2026_02_11_14_10" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers_2026_02_18_17_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_code" character varying(20) NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text",
    "phone" "text" NOT NULL,
    "addresses" "jsonb" NOT NULL,
    "preferred_pickup_times" "jsonb" DEFAULT '{}'::"jsonb",
    "registration_date" timestamp with time zone DEFAULT "now"(),
    "status" character varying(20) DEFAULT 'ACTIVE'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."customers_2026_02_18_17_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers_2026_02_19_13_00" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "customer_code" character varying(50) NOT NULL,
    "full_name" character varying(255) NOT NULL,
    "company_name" character varying(255),
    "phone" character varying(20) NOT NULL,
    "email" character varying(255),
    "address" "text" NOT NULL,
    "city" character varying(100) NOT NULL,
    "state" character varying(100) NOT NULL,
    "postal_code" character varying(20),
    "customer_type" character varying(50) DEFAULT 'INDIVIDUAL'::character varying,
    "credit_limit" numeric(12,2) DEFAULT 0,
    "outstanding_balance" numeric(12,2) DEFAULT 0,
    "payment_terms" character varying(50) DEFAULT 'COD'::character varying,
    "preferred_delivery_time" character varying(100),
    "special_instructions" "text",
    "kyc_status" character varying(20) DEFAULT 'PENDING'::character varying,
    "kyc_documents" "jsonb" DEFAULT '[]'::"jsonb",
    "status" character varying(20) DEFAULT 'ACTIVE'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."customers_2026_02_19_13_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers_2026_02_28_20_06" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "customer_code" character varying(50) NOT NULL,
    "name" character varying(255) NOT NULL,
    "email" character varying(255),
    "phone" character varying(50) NOT NULL,
    "address" "text",
    "city" character varying(100),
    "state" character varying(100),
    "country" character varying(100) DEFAULT 'Myanmar'::character varying,
    "postal_code" character varying(20),
    "customer_type" character varying(20) DEFAULT 'individual'::character varying,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "customers_2026_02_28_20_06_customer_type_check" CHECK ((("customer_type")::"text" = ANY ((ARRAY['individual'::character varying, 'business'::character varying])::"text"[]))),
    CONSTRAINT "customers_2026_02_28_20_06_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'suspended'::character varying])::"text"[])))
);


ALTER TABLE "public"."customers_2026_02_28_20_06" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."data_entry_automation_2026_02_18_18_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_type" character varying(30) NOT NULL,
    "source_data" "text" NOT NULL,
    "source_file_url" "text",
    "processing_method" character varying(30),
    "confidence_score" numeric(5,2),
    "processing_time_ms" integer,
    "extracted_fields" "jsonb" NOT NULL,
    "validation_results" "jsonb",
    "correction_suggestions" "jsonb",
    "target_table" "text",
    "target_record_id" "uuid",
    "auto_applied" boolean DEFAULT false,
    "requires_review" boolean DEFAULT false,
    "reviewed_by" "text",
    "reviewed_at" timestamp with time zone,
    "review_notes" "text",
    "status" character varying(20) DEFAULT 'PROCESSED'::character varying,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."data_entry_automation_2026_02_18_18_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deliveries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "manifest_id" "uuid",
    "driver_id" "uuid",
    "status" "public"."delivery_status" DEFAULT 'pending'::"public"."delivery_status",
    "attempt_number" integer DEFAULT 1,
    "max_attempts" integer DEFAULT 3,
    "assigned_at" timestamp with time zone,
    "picked_up_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "failed_at" timestamp with time zone,
    "failure_reason" "text",
    "failure_category" "text",
    "ndr_case" "jsonb",
    "current_location" "jsonb",
    "delivery_location" "jsonb",
    "signature" "jsonb",
    "photos" "text"[],
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deliveries_2026_02_19_13_00" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "shipment_id" "uuid",
    "route_id" "uuid",
    "delivery_sequence" integer,
    "scheduled_time" timestamp with time zone,
    "actual_delivery_time" timestamp with time zone,
    "delivery_status" character varying(50) DEFAULT 'PENDING'::character varying,
    "delivery_attempts" integer DEFAULT 0,
    "failure_reason" "text",
    "recipient_name" character varying(255),
    "recipient_phone" character varying(20),
    "signature_data" "text",
    "photo_proof" "jsonb" DEFAULT '[]'::"jsonb",
    "delivery_notes" "text",
    "cod_collected" numeric(12,2) DEFAULT 0,
    "delivery_latitude" numeric(10,8),
    "delivery_longitude" numeric(11,8),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."deliveries_2026_02_19_13_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delivery_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "delivery_id" "uuid" NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "status" "public"."delivery_status" NOT NULL,
    "location" "jsonb",
    "notes" "text",
    "changed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."delivery_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delivery_personnel_2026_02_18_17_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "personnel_code" character varying(20) NOT NULL,
    "full_name" "text" NOT NULL,
    "role" character varying(20) NOT NULL,
    "phone" "text" NOT NULL,
    "email" "text",
    "employment_status" character varying(20) DEFAULT 'ACTIVE'::character varying,
    "shift_preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "zone_assignments" "text"[],
    "total_deliveries" integer DEFAULT 0,
    "success_rate" numeric(5,2) DEFAULT 100.00,
    "average_rating" numeric(3,2) DEFAULT 5.00,
    "current_status" character varying(20) DEFAULT 'AVAILABLE'::character varying,
    "current_location" "jsonb",
    "current_route_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."delivery_personnel_2026_02_18_17_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delivery_records_2026_02_11_14_10" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "rider_id" "uuid" NOT NULL,
    "delivery_time" timestamp with time zone DEFAULT "now"(),
    "delivery_photos" "text"[],
    "customer_signature" "text",
    "recipient_name" character varying(255),
    "delivery_status" character varying(50) DEFAULT 'delivered'::character varying,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."delivery_records_2026_02_11_14_10" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delivery_records_2026_02_17_18_40" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "rider_id" "uuid" NOT NULL,
    "delivery_time" timestamp with time zone DEFAULT "now"(),
    "delivery_photos" "text"[],
    "customer_signature" "text",
    "recipient_name" character varying,
    "delivery_status" character varying DEFAULT 'delivered'::character varying,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."delivery_records_2026_02_17_18_40" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delivery_status_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "delivery_id" "uuid",
    "notes" "text",
    "location" "text",
    "changed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."delivery_status_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."demo_login_credentials_2026_02_19_14_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid",
    "email" "text" NOT NULL,
    "password_hash" "text" NOT NULL,
    "role" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "last_login" timestamp with time zone,
    "login_attempts" integer DEFAULT 0,
    "locked_until" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."demo_login_credentials_2026_02_19_14_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."domestic_rates_2026_02_19_13_00" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "from_zone" character varying(50) NOT NULL,
    "to_zone" character varying(50) NOT NULL,
    "service_type" character varying(50) NOT NULL,
    "weight_from" numeric(8,2) NOT NULL,
    "weight_to" numeric(8,2) NOT NULL,
    "base_rate" numeric(10,2) NOT NULL,
    "per_kg_rate" numeric(10,2) DEFAULT 0,
    "remote_area_surcharge" numeric(10,2) DEFAULT 0,
    "fuel_surcharge_percent" numeric(5,2) DEFAULT 0,
    "effective_from" "date" NOT NULL,
    "effective_to" "date",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."domestic_rates_2026_02_19_13_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."domestic_shipping_rates_2026_02_18_18_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_type" character varying(20) NOT NULL,
    "weight_from_kg" numeric(8,2) NOT NULL,
    "weight_to_kg" numeric(8,2) NOT NULL,
    "base_rate_mmk" numeric(10,2) NOT NULL,
    "metro_multiplier" numeric(3,2) DEFAULT 1.00,
    "standard_multiplier" numeric(3,2) DEFAULT 1.20,
    "remote_multiplier" numeric(3,2) DEFAULT 1.50,
    "cod_fee_mmk" numeric(8,2) DEFAULT 2000,
    "cod_percentage" numeric(5,2) DEFAULT 2.00,
    "insurance_percentage" numeric(5,2) DEFAULT 1.00,
    "fuel_surcharge_percentage" numeric(5,2) DEFAULT 5.00,
    "delivery_time_days" integer DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."domestic_shipping_rates_2026_02_18_18_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."domestic_tariffs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "region_name" "text" NOT NULL,
    "zone_label" "text" NOT NULL,
    "base_rate" numeric DEFAULT 0 NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."domestic_tariffs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."dup_public_users_email_v" AS
 SELECT "lower"("email") AS "email",
    "count"(*) AS "cnt",
    "array_agg"("id") AS "user_ids"
   FROM "public"."users"
  WHERE (("email" IS NOT NULL) AND (TRIM(BOTH FROM "email") <> ''::"text"))
  GROUP BY ("lower"("email"))
 HAVING ("count"(*) > 1);


ALTER VIEW "public"."dup_public_users_email_v" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."electronic_signatures_2026_02_18_18_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parcel_id" "text" NOT NULL,
    "shipment_id" "text",
    "signature_data" "text" NOT NULL,
    "signature_hash" "text" NOT NULL,
    "signature_points" "jsonb",
    "signer_name" "text" NOT NULL,
    "signer_phone" "text",
    "signer_id_type" character varying(20),
    "signer_id_number" "text",
    "relationship_to_recipient" character varying(30),
    "delivery_rider_id" "text" NOT NULL,
    "delivery_location" "jsonb",
    "delivery_timestamp" timestamp with time zone NOT NULL,
    "delivery_notes" "text",
    "device_info" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "recipient_photo_url" "text",
    "package_photo_url" "text",
    "location_photo_url" "text",
    "is_verified" boolean DEFAULT false,
    "verification_method" character varying(30),
    "signature_quality_score" numeric(5,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."electronic_signatures_2026_02_18_18_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."electronic_signatures_2026_02_19_15_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "signature_data" "text" NOT NULL,
    "signature_type" "text" NOT NULL,
    "reference_id" "uuid" NOT NULL,
    "reference_type" "text" NOT NULL,
    "signer_name" "text" NOT NULL,
    "signer_id_number" "text",
    "signer_phone" "text",
    "signed_by" "uuid",
    "signature_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "verification_status" "text" DEFAULT 'PENDING'::"text",
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "electronic_signatures_2026_02_19_15_00_signature_type_check" CHECK (("signature_type" = ANY (ARRAY['PICKUP'::"text", 'DELIVERY'::"text", 'RECEIPT'::"text", 'AUTHORIZATION'::"text"]))),
    CONSTRAINT "electronic_signatures_2026_02_19_15_0_verification_status_check" CHECK (("verification_status" = ANY (ARRAY['PENDING'::"text", 'VERIFIED'::"text", 'REJECTED'::"text"])))
);


ALTER TABLE "public"."electronic_signatures_2026_02_19_15_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_code" "text",
    "first_name" "text",
    "last_name" "text",
    "job_title" "text",
    "hire_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feature_flags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "flag_key" character varying(100) NOT NULL,
    "name" character varying(200) NOT NULL,
    "description" "text",
    "is_enabled" boolean DEFAULT false,
    "environment" character varying(20) DEFAULT 'dev'::character varying,
    "target_roles" "text"[],
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feature_flags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "awb" "text",
    "merchant_id" "uuid" NOT NULL,
    "service_type" "public"."service_type" NOT NULL,
    "status" "public"."shipment_status" DEFAULT 'pending'::"public"."shipment_status",
    "sender" "jsonb" NOT NULL,
    "recipient" "jsonb" NOT NULL,
    "package_details" "jsonb" NOT NULL,
    "declared_value" numeric(10,2),
    "cod_amount" numeric(10,2),
    "shipping_fee" numeric(10,2),
    "payment_method" "public"."payment_method",
    "payment_status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status",
    "origin_warehouse_id" "uuid",
    "destination_warehouse_id" "uuid",
    "current_location" "jsonb",
    "pickup_date" timestamp with time zone,
    "expected_delivery_date" timestamp with time zone,
    "actual_delivery_date" timestamp with time zone,
    "special_instructions" "text",
    "proof_of_delivery" "jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "way_id" "text",
    "actual_delivery_time" timestamp with time zone,
    "pickup_branch_id" "uuid",
    "delivery_branch_id" "uuid",
    "package_description" "text",
    "package_weight" numeric,
    "insurance_fee" numeric DEFAULT 0,
    "total_amount" numeric DEFAULT 0,
    "actual_pickup_time" timestamp with time zone,
    "sender_name" "text",
    "sender_phone" "text",
    "sender_address" "text",
    "sender_city" "text",
    "sender_state" "text",
    "item_price" numeric,
    "prepaid_to_os" numeric,
    "cbm" numeric,
    "delivery_type" "text",
    "remarks" "text",
    "printed_by_profile_id" "text",
    "last_printed_at" timestamp with time zone,
    "receiver_name" "text",
    "receiver_phone" "text",
    "receiver_address" "text",
    "receiver_city" "text",
    "receiver_state" "text",
    "delivery_fee" numeric DEFAULT 0
);


ALTER TABLE "public"."shipments" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."finance_cod_pending_v" AS
 SELECT "s"."id" AS "shipment_id",
    "s"."way_id",
    COALESCE("s"."cod_amount", (0)::numeric) AS "cod_amount",
    "s"."actual_delivery_time",
    "cc"."status" AS "cod_status",
    "cc"."deposit_reference"
   FROM ("public"."shipments" "s"
     LEFT JOIN "public"."cod_collections" "cc" ON (("cc"."shipment_id" = "s"."id")))
  WHERE ((COALESCE("s"."cod_amount", (0)::numeric) > (0)::numeric) AND ("s"."actual_delivery_time" IS NOT NULL) AND (("cc"."id" IS NULL) OR ("cc"."status" = ANY (ARRAY['COLLECTED'::"text", 'DISPUTED'::"text"]))));


ALTER VIEW "public"."finance_cod_pending_v" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipment_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shipment_id" "uuid",
    "status" "text",
    "location" "text",
    "notes" "text",
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "is_customer_visible" boolean DEFAULT true,
    "handled_by" "uuid"
);


ALTER TABLE "public"."shipment_tracking" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."finance_cod_reconciliation_v" AS
 SELECT "s"."way_id",
    "m"."business_name" AS "merchant",
    "s"."receiver_name",
    "s"."cod_amount",
    "s"."status" AS "shipment_status",
    ( SELECT "shipment_tracking"."timestamp"
           FROM "public"."shipment_tracking"
          WHERE (("shipment_tracking"."shipment_id" = "s"."id") AND ("shipment_tracking"."status" = 'delivered'::"text"))
          ORDER BY "shipment_tracking"."timestamp" DESC
         LIMIT 1) AS "delivered_at",
        CASE
            WHEN ("s"."status" = 'delivered'::"public"."shipment_status") THEN 'Awaiting Remittance'::"text"
            WHEN ("s"."status" = 'pending'::"public"."shipment_status") THEN 'Not Shipped'::"text"
            ELSE 'In Transit'::"text"
        END AS "finance_status"
   FROM ("public"."shipments" "s"
     JOIN "public"."merchants" "m" ON (("s"."merchant_id" = "m"."id")))
  WHERE ("s"."cod_amount" > (0)::numeric);


ALTER VIEW "public"."finance_cod_reconciliation_v" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."finance_deposits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "amount" numeric DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "branch_id" "uuid",
    CONSTRAINT "finance_deposits_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'APPROVED'::"text", 'REJECTED'::"text"])))
);


ALTER TABLE "public"."finance_deposits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."finance_ledger" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "amount" numeric(15,2) NOT NULL,
    "sender_id" "uuid",
    "recipient_id" "uuid",
    "transaction_type" "text" NOT NULL,
    "reference_id" "text",
    "auth_hash" "text",
    "verified_by" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."finance_ledger" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "transaction_id" "text",
    "transaction_type" "text",
    "reference_type" "text",
    "reference_id" "uuid",
    "amount" numeric,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."financial_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_transactions_2026_02_11_14_10" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "transaction_type" character varying(50) NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'USD'::character varying,
    "merchant_id" "uuid",
    "customer_id" "uuid",
    "shipment_id" "uuid",
    "payment_method" character varying(50),
    "payment_status" character varying(50) DEFAULT 'pending'::character varying,
    "reference_number" character varying(100),
    "processed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."financial_transactions_2026_02_11_14_10" OWNER TO "postgres";


COMMENT ON TABLE "public"."financial_transactions_2026_02_11_14_10" IS 'Financial transaction management with commission tracking';



CREATE TABLE IF NOT EXISTS "public"."fleet_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plate_number" character varying NOT NULL,
    "vehicle_type" character varying,
    "fuel_capacity" numeric,
    "status" character varying DEFAULT 'available'::character varying,
    "current_location" character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "rider_id" "uuid",
    "vehicle_plate" character varying(50),
    "fuel_level" integer,
    "last_maintenance_date" "date"
);


ALTER TABLE "public"."fleet_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fleet_telemetry" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "rider_id" "uuid",
    "unit_name" "text",
    "status" "text" DEFAULT 'active'::"text",
    "current_lat" numeric,
    "current_long" numeric,
    "last_updated" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fleet_telemetry" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fuel_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "asset_id" "uuid",
    "driver_email" character varying,
    "liters_added" numeric,
    "cost_per_liter" numeric,
    "odometer_reading" numeric,
    "location" character varying,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fuel_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."geofences_2026_02_18_18_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "type" character varying(20) NOT NULL,
    "center_lat" numeric(10,8) NOT NULL,
    "center_lng" numeric(11,8) NOT NULL,
    "radius_meters" integer NOT NULL,
    "polygon_coordinates" "jsonb",
    "is_active" boolean DEFAULT true,
    "entry_alert" boolean DEFAULT true,
    "exit_alert" boolean DEFAULT true,
    "branch_id" "text",
    "zone" character varying(10),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."geofences_2026_02_18_18_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."geofences_2026_02_19_15_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "fence_type" "text" NOT NULL,
    "coordinates" "jsonb" NOT NULL,
    "radius" numeric(10,2),
    "branch_id" "uuid",
    "is_active" boolean DEFAULT true,
    "alert_on_enter" boolean DEFAULT true,
    "alert_on_exit" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "geofences_2026_02_19_15_00_fence_type_check" CHECK (("fence_type" = ANY (ARRAY['CIRCULAR'::"text", 'POLYGON'::"text", 'RECTANGLE'::"text"])))
);


ALTER TABLE "public"."geofences_2026_02_19_15_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gps_tracking_2026_02_18_18_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "device_id" "text" NOT NULL,
    "user_id" "text",
    "vehicle_id" "text",
    "route_id" "uuid",
    "latitude" numeric(10,8) NOT NULL,
    "longitude" numeric(11,8) NOT NULL,
    "altitude" numeric(8,2),
    "accuracy" numeric(8,2),
    "speed" numeric(8,2),
    "heading" numeric(5,2),
    "battery_level" integer,
    "signal_strength" integer,
    "is_moving" boolean DEFAULT false,
    "location_source" character varying(20) DEFAULT 'GPS'::character varying,
    "recorded_at" timestamp with time zone NOT NULL,
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."gps_tracking_2026_02_18_18_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gps_tracking_advanced_2026_02_19_15_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "device_id" "text" NOT NULL,
    "vehicle_id" "uuid",
    "rider_id" "uuid",
    "shipment_id" "uuid",
    "latitude" numeric(10,8) NOT NULL,
    "longitude" numeric(11,8) NOT NULL,
    "altitude" numeric(8,2),
    "accuracy" numeric(8,2),
    "speed" numeric(8,2),
    "heading" numeric(5,2),
    "battery_level" integer,
    "signal_strength" integer,
    "location_type" "text" DEFAULT 'GPS'::"text",
    "address" "text",
    "geofence_status" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "recorded_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "gps_tracking_advanced_2026_02_19_15_00_location_type_check" CHECK (("location_type" = ANY (ARRAY['GPS'::"text", 'NETWORK'::"text", 'PASSIVE'::"text"])))
);


ALTER TABLE "public"."gps_tracking_advanced_2026_02_19_15_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."international_destinations_2026_02_18_18_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "country_code" character varying(3) NOT NULL,
    "country_name_en" "text" NOT NULL,
    "country_name_mm" "text" NOT NULL,
    "region" character varying(50),
    "capital_city_en" "text",
    "capital_city_mm" "text",
    "currency_code" character varying(3),
    "time_zone" character varying(50),
    "zone_category" character varying(20) DEFAULT 'ZONE_3'::character varying,
    "delivery_time_days" integer DEFAULT 7,
    "customs_clearance_days" integer DEFAULT 2,
    "express_available" boolean DEFAULT true,
    "standard_available" boolean DEFAULT true,
    "economy_available" boolean DEFAULT false,
    "cod_available" boolean DEFAULT false,
    "restricted_items" "jsonb" DEFAULT '[]'::"jsonb",
    "prohibited_items" "jsonb" DEFAULT '[]'::"jsonb",
    "max_weight_kg" numeric(8,2) DEFAULT 30.00,
    "max_dimensions_cm" "jsonb" DEFAULT '{"width": 80, "height": 80, "length": 120}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."international_destinations_2026_02_18_18_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."international_rates_2026_02_19_13_00" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "destination_country" character varying(100) NOT NULL,
    "destination_zone" character varying(50),
    "service_type" character varying(50) NOT NULL,
    "weight_from" numeric(8,2) NOT NULL,
    "weight_to" numeric(8,2) NOT NULL,
    "base_rate" numeric(10,2) NOT NULL,
    "per_kg_rate" numeric(10,2) DEFAULT 0,
    "customs_clearance_fee" numeric(10,2) DEFAULT 0,
    "fuel_surcharge_percent" numeric(5,2) DEFAULT 0,
    "currency" character varying(10) DEFAULT 'USD'::character varying,
    "effective_from" "date" NOT NULL,
    "effective_to" "date",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."international_rates_2026_02_19_13_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."international_shipping_rates_2026_02_18_18_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "destination_id" "uuid",
    "service_type" character varying(20) NOT NULL,
    "weight_from_kg" numeric(8,2) NOT NULL,
    "weight_to_kg" numeric(8,2) NOT NULL,
    "base_rate_usd" numeric(10,2) NOT NULL,
    "volume_weight_divisor" integer DEFAULT 5000,
    "min_chargeable_weight_kg" numeric(8,2) DEFAULT 0.5,
    "fuel_surcharge_percentage" numeric(5,2) DEFAULT 15.00,
    "security_fee_usd" numeric(8,2) DEFAULT 5.00,
    "customs_clearance_fee_usd" numeric(8,2) DEFAULT 25.00,
    "remote_area_fee_usd" numeric(8,2) DEFAULT 0.00,
    "insurance_percentage" numeric(5,2) DEFAULT 2.00,
    "max_insurance_usd" numeric(10,2) DEFAULT 5000.00,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."international_shipping_rates_2026_02_18_18_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."intl_tariffs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "destination_country" "text" NOT NULL,
    "rate_usd_per_kg" numeric NOT NULL,
    "min_weight" "text",
    "duration_est" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."intl_tariffs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_2026_02_19_13_00" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "item_code" character varying(50) NOT NULL,
    "item_name" character varying(255) NOT NULL,
    "category" character varying(100),
    "description" "text",
    "unit_of_measure" character varying(50),
    "current_stock" integer DEFAULT 0,
    "minimum_stock" integer DEFAULT 0,
    "maximum_stock" integer DEFAULT 0,
    "unit_cost" numeric(10,2),
    "supplier_info" "jsonb",
    "storage_location" character varying(255),
    "branch_id" "uuid",
    "status" character varying(20) DEFAULT 'ACTIVE'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."inventory_2026_02_19_13_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_2026_02_28_20_06" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "warehouse_id" "uuid" NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "location_code" character varying(50),
    "stored_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "retrieved_date" timestamp with time zone,
    "status" character varying(20) DEFAULT 'stored'::character varying,
    "notes" "text",
    "stored_by" "uuid",
    "retrieved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "inventory_2026_02_28_20_06_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['stored'::character varying, 'retrieved'::character varying, 'damaged'::character varying, 'lost'::character varying])::"text"[])))
);


ALTER TABLE "public"."inventory_2026_02_28_20_06" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_movements_2026_02_19_13_00" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "inventory_id" "uuid",
    "movement_type" character varying(50) NOT NULL,
    "quantity" integer NOT NULL,
    "reference_type" character varying(50),
    "reference_id" "uuid",
    "from_location" character varying(255),
    "to_location" character varying(255),
    "unit_cost" numeric(10,2),
    "total_cost" numeric(12,2),
    "performed_by" "uuid",
    "notes" "text",
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."inventory_movements_2026_02_19_13_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoice_items_2026_02_28_20_06" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "shipment_id" "uuid",
    "description" "text" NOT NULL,
    "quantity" numeric(10,3) DEFAULT 1,
    "unit_price" numeric(10,2) NOT NULL,
    "total_price" numeric(15,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invoice_items_2026_02_28_20_06" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_number" "text" NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "billing_period_start" "date" NOT NULL,
    "billing_period_end" "date" NOT NULL,
    "subtotal" numeric(10,2) NOT NULL,
    "tax" numeric(10,2) DEFAULT 0,
    "discount" numeric(10,2) DEFAULT 0,
    "total" numeric(10,2) NOT NULL,
    "status" "public"."invoice_status" DEFAULT 'draft'::"public"."invoice_status",
    "due_date" "date",
    "paid_at" timestamp with time zone,
    "payment_reference" "text",
    "line_items" "jsonb" NOT NULL,
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices_2026_02_28_20_06" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "invoice_number" character varying(50) NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "invoice_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "due_date" "date" NOT NULL,
    "subtotal" numeric(15,2) DEFAULT 0 NOT NULL,
    "tax_amount" numeric(15,2) DEFAULT 0,
    "discount_amount" numeric(15,2) DEFAULT 0,
    "total_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "paid_amount" numeric(15,2) DEFAULT 0,
    "balance_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "payment_terms" integer DEFAULT 30,
    "notes" "text",
    "created_by" "uuid",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "invoices_2026_02_28_20_06_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'pending'::character varying, 'paid'::character varying, 'overdue'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."invoices_2026_02_28_20_06" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kpi_data_2026_02_11_14_10" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "metric_name" character varying(100) NOT NULL,
    "metric_value" numeric(15,4) NOT NULL,
    "metric_unit" character varying(50),
    "period_type" character varying(20) NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "category" character varying(100),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."kpi_data_2026_02_11_14_10" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leave_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "leave_type" "public"."leave_type" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "days_count" integer NOT NULL,
    "reason" "text" NOT NULL,
    "status" "public"."leave_status" DEFAULT 'pending'::"public"."leave_status",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."leave_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."manifest_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "manifest_id" "uuid" NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "sequence_number" integer NOT NULL,
    "status" "public"."delivery_status" DEFAULT 'pending'::"public"."delivery_status",
    "estimated_arrival" timestamp with time zone,
    "actual_arrival" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."manifest_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."manifests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "manifest_number" "text" NOT NULL,
    "driver_id" "uuid" NOT NULL,
    "vehicle_id" "uuid",
    "warehouse_id" "uuid" NOT NULL,
    "status" "public"."manifest_status" DEFAULT 'draft'::"public"."manifest_status",
    "route_data" "jsonb",
    "planned_route" "jsonb",
    "actual_route" "jsonb",
    "scheduled_date" "date" NOT NULL,
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "total_shipments" integer DEFAULT 0,
    "completed_shipments" integer DEFAULT 0,
    "failed_shipments" integer DEFAULT 0,
    "total_distance" numeric(10,2),
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."manifests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketing_campaigns_2026_02_11_14_10" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "campaign_type" character varying(50) NOT NULL,
    "status" character varying(50) DEFAULT 'draft'::character varying,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "budget" numeric(10,2),
    "target_audience" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."marketing_campaigns_2026_02_11_14_10" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketing_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text",
    "recipient" "text",
    "content" "text",
    "status" "text" DEFAULT 'sent'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."marketing_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "admin_id" "uuid",
    "target_user_id" "uuid",
    "action_type" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."master_audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."merchant_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "merchant_code" character varying(40) NOT NULL,
    "legal_name" character varying(180) NOT NULL,
    "display_name" character varying(180) NOT NULL,
    "billing_status" character varying(30) DEFAULT 'active'::character varying NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."merchant_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."merchants_2026_02_18_17_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "merchant_code" character varying(20) NOT NULL,
    "business_name" "text" NOT NULL,
    "contact_person" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "business_address" "jsonb" NOT NULL,
    "business_type" character varying(50),
    "registration_date" timestamp with time zone DEFAULT "now"(),
    "status" character varying(20) DEFAULT 'ACTIVE'::character varying,
    "pickup_preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "payment_terms" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."merchants_2026_02_18_17_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."migration_history" (
    "name" "text" NOT NULL,
    "executed_at" timestamp with time zone
);


ALTER TABLE "public"."migration_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."myanmar_locations_2026_02_19_13_00" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "state_division" character varying(100) NOT NULL,
    "township" character varying(100) NOT NULL,
    "postal_code" character varying(20),
    "zone" character varying(50),
    "is_remote" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."myanmar_locations_2026_02_19_13_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."myanmar_states_divisions_2026_02_18_18_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying(10) NOT NULL,
    "name_en" "text" NOT NULL,
    "name_mm" "text" NOT NULL,
    "type" character varying(20) NOT NULL,
    "capital_en" "text",
    "capital_mm" "text",
    "zone_classification" character varying(20) DEFAULT 'STANDARD'::character varying,
    "base_rate_multiplier" numeric(3,2) DEFAULT 1.00,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."myanmar_states_divisions_2026_02_18_18_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications_2026_02_19_13_00" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "recipient_id" "uuid",
    "title" character varying(255) NOT NULL,
    "message" "text" NOT NULL,
    "type" character varying(50) DEFAULT 'INFO'::character varying,
    "category" character varying(50),
    "reference_type" character varying(50),
    "reference_id" "uuid",
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications_2026_02_19_13_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."operator_branch_memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "operator_id" "uuid",
    "branch_code" "text" NOT NULL,
    "role" "text" DEFAULT 'staff'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "branch_id" "text",
    "is_primary" boolean DEFAULT false,
    "profile_id" "uuid"
);


ALTER TABLE "public"."operator_branch_memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."operators" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "role" "text" DEFAULT 'operator'::"text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "display_id" "text",
    "email" "text",
    CONSTRAINT "operators_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'manager'::"text", 'operator'::"text"]))),
    CONSTRAINT "operators_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'suspended'::"text"])))
);


ALTER TABLE "public"."operators" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parcels_2026_02_18_17_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parcel_id" character varying(50) NOT NULL,
    "merchant_id" "uuid",
    "customer_id" "uuid",
    "pickup_address" "jsonb" NOT NULL,
    "pickup_contact_person" "text",
    "pickup_phone" "text",
    "pickup_instructions" "text",
    "preferred_pickup_time" timestamp with time zone,
    "recipient_name" "text" NOT NULL,
    "recipient_phone" "text" NOT NULL,
    "delivery_address" "jsonb" NOT NULL,
    "item_description" "text",
    "weight_kg" numeric(8,2),
    "dimensions" "jsonb",
    "fragile" boolean DEFAULT false,
    "item_price" numeric(12,2) DEFAULT 0,
    "delivery_fees" numeric(12,2) DEFAULT 0,
    "prepaid_amount" numeric(12,2) DEFAULT 0,
    "cod_amount" numeric(12,2) DEFAULT 0,
    "currency" character varying(3) DEFAULT 'MMK'::character varying,
    "status" character varying(30) DEFAULT 'REGISTERED'::character varying,
    "priority" character varying(20) DEFAULT 'STANDARD'::character varying,
    "pickup_zone" character varying(10),
    "delivery_zone" character varying(10),
    "estimated_distance_km" numeric(8,2),
    "estimated_duration_minutes" integer,
    "assigned_route_id" "uuid",
    "assigned_rider_id" "text",
    "assigned_driver_id" "text",
    "assigned_helper_id" "text",
    "assigned_vehicle_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "pickup_scheduled_at" timestamp with time zone,
    "pickup_completed_at" timestamp with time zone,
    "delivery_scheduled_at" timestamp with time zone,
    "delivery_completed_at" timestamp with time zone,
    "qr_code_generated" boolean DEFAULT false,
    "qr_code_printed" boolean DEFAULT false,
    "qr_code_data" "text",
    "remarks" "text",
    "special_instructions" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."parcels_2026_02_18_17_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments_2026_02_28_20_06" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "payment_number" character varying(50) NOT NULL,
    "invoice_id" "uuid",
    "merchant_id" "uuid",
    "payment_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "payment_method" character varying(50) NOT NULL,
    "reference_number" character varying(100),
    "notes" "text",
    "status" character varying(20) DEFAULT 'completed'::character varying,
    "processed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payments_2026_02_28_20_06_payment_method_check" CHECK ((("payment_method")::"text" = ANY ((ARRAY['cash'::character varying, 'bank_transfer'::character varying, 'cheque'::character varying, 'mobile_payment'::character varying, 'card'::character varying])::"text"[]))),
    CONSTRAINT "payments_2026_02_28_20_06_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."payments_2026_02_28_20_06" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permission_overrides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role_code" "text",
    "screen_id" "text" NOT NULL,
    "is_allowed" boolean DEFAULT true,
    "updated_by" "uuid"
);


ALTER TABLE "public"."permission_overrides" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying(150) NOT NULL,
    "domain" character varying(20) NOT NULL,
    "resource" character varying(30) NOT NULL,
    "action" character varying(20) NOT NULL,
    "scope" character varying(20) NOT NULL,
    "description" "text",
    "module" character varying(50),
    "screen" character varying(50),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pickup_records_2026_02_11_14_10" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "rider_id" "uuid" NOT NULL,
    "pickup_time" timestamp with time zone DEFAULT "now"(),
    "pickup_photos" "text"[],
    "customer_signature" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pickup_records_2026_02_11_14_10" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles_2026_02_19_13_00" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "email" character varying(255) NOT NULL,
    "full_name" character varying(255) NOT NULL,
    "phone" character varying(20),
    "role" character varying(50) DEFAULT 'CUSTOMER'::character varying NOT NULL,
    "department" character varying(100),
    "branch_id" "uuid",
    "employee_id" character varying(50),
    "status" character varying(20) DEFAULT 'ACTIVE'::character varying,
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "profile_image_url" "text",
    "address" "text",
    "emergency_contact" "jsonb",
    "hire_date" "date",
    "salary_info" "jsonb",
    "performance_metrics" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles_2026_02_19_13_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."qr_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "data" "jsonb",
    "is_active" boolean DEFAULT true,
    "scanned_count" integer DEFAULT 0,
    "last_scanned_at" timestamp with time zone,
    "last_scanned_by" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."qr_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."qr_codes_2026_02_18_17_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "qr_data" "text" NOT NULL,
    "qr_type" character varying(50) DEFAULT 'SHIPMENT'::character varying,
    "shipment_id" "text",
    "generated_by" "text",
    "generated_at" timestamp with time zone DEFAULT "now"(),
    "scan_count" integer DEFAULT 0,
    "last_scanned_at" timestamp with time zone,
    "last_scanned_by" "text",
    "is_active" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."qr_codes_2026_02_18_17_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."qr_codes_advanced_2026_02_19_15_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "qr_code" "text" NOT NULL,
    "qr_type" "text" NOT NULL,
    "reference_id" "uuid" NOT NULL,
    "reference_type" "text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'ACTIVE'::"text" NOT NULL,
    "generated_by" "uuid",
    "scanned_by" "uuid",
    "scanned_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "scan_count" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "qr_codes_advanced_2026_02_19_15_00_qr_type_check" CHECK (("qr_type" = ANY (ARRAY['SHIPMENT'::"text", 'PARCEL'::"text", 'VEHICLE'::"text", 'RIDER'::"text", 'WAREHOUSE'::"text"]))),
    CONSTRAINT "qr_codes_advanced_2026_02_19_15_00_status_check" CHECK (("status" = ANY (ARRAY['ACTIVE'::"text", 'SCANNED'::"text", 'EXPIRED'::"text", 'INVALID'::"text"])))
);


ALTER TABLE "public"."qr_codes_advanced_2026_02_19_15_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."qr_scan_logs_2026_02_18_17_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "qr_code_id" "uuid",
    "qr_data" "text" NOT NULL,
    "scanned_by" "text" NOT NULL,
    "scanned_at" timestamp with time zone DEFAULT "now"(),
    "scan_location" "jsonb",
    "device_info" "jsonb",
    "scan_result" character varying(50) DEFAULT 'SUCCESS'::character varying,
    "notes" "text"
);


ALTER TABLE "public"."qr_scan_logs_2026_02_18_17_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rbac_roles" (
    "role_code" "text" NOT NULL,
    "level" "text" NOT NULL,
    "data_scope" "text" NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."rbac_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."realtime_events_2026_02_18_18_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" character varying(50) NOT NULL,
    "entity_type" character varying(30) NOT NULL,
    "entity_id" "text" NOT NULL,
    "event_data" "jsonb" NOT NULL,
    "priority" character varying(10) DEFAULT 'NORMAL'::character varying,
    "location" "jsonb",
    "geofence_id" "uuid",
    "notify_users" "text"[],
    "notification_sent" boolean DEFAULT false,
    "notification_channels" "text"[],
    "processed" boolean DEFAULT false,
    "processed_at" timestamp with time zone,
    "processing_result" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."realtime_events_2026_02_18_18_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."realtime_events_2026_02_19_15_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "event_category" "text" NOT NULL,
    "reference_id" "uuid",
    "reference_type" "text",
    "user_id" "uuid",
    "device_id" "text",
    "event_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "severity" "text" DEFAULT 'INFO'::"text",
    "is_processed" boolean DEFAULT false,
    "processed_at" timestamp with time zone,
    "processed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "realtime_events_2026_02_19_15_00_event_category_check" CHECK (("event_category" = ANY (ARRAY['GPS'::"text", 'QR_SCAN'::"text", 'SIGNATURE'::"text", 'ROUTE'::"text", 'ALERT'::"text", 'SYSTEM'::"text"]))),
    CONSTRAINT "realtime_events_2026_02_19_15_00_severity_check" CHECK (("severity" = ANY (ARRAY['LOW'::"text", 'INFO'::"text", 'WARNING'::"text", 'HIGH'::"text", 'CRITICAL'::"text"])))
);


ALTER TABLE "public"."realtime_events_2026_02_19_15_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."realtime_notifications_2026_02_19_17_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "notification_type" character varying(50) NOT NULL,
    "title" character varying(200) NOT NULL,
    "message" "text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "priority" character varying(20) DEFAULT 'NORMAL'::character varying,
    "read_at" timestamp with time zone,
    "action_required" boolean DEFAULT false,
    "action_url" character varying(500),
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."realtime_notifications_2026_02_19_17_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."receipts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "receipt_number" "text" NOT NULL,
    "merchant_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "delivery_count" integer DEFAULT 0,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "issued_date" timestamp with time zone DEFAULT "now"(),
    "due_date" timestamp with time zone,
    "paid_date" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."receipts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."regions_2026_02_28_20_06" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "code" character varying(20) NOT NULL,
    "name" character varying(255) NOT NULL,
    "country" character varying(100) DEFAULT 'Myanmar'::character varying NOT NULL,
    "manager_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."regions_2026_02_28_20_06" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reports_2026_02_11_14_10" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "report_type" character varying(100) NOT NULL,
    "parameters" "jsonb" DEFAULT '{}'::"jsonb",
    "data" "jsonb",
    "file_path" "text",
    "status" character varying(50) DEFAULT 'generating'::character varying,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."reports_2026_02_11_14_10" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rider_compliance" (
    "rider_id" "uuid" NOT NULL,
    "kyc_verified" boolean DEFAULT false,
    "vehicle_docs_valid" boolean DEFAULT false,
    "training_completed" boolean DEFAULT false,
    "background_check" character varying(50) DEFAULT 'PENDING'::character varying,
    "current_status" character varying(50) DEFAULT 'OFFLINE'::character varying,
    "wallet_balance" numeric(12,2) DEFAULT 0,
    "cod_on_hand" numeric(12,2) DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rider_compliance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_authorities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "text" NOT NULL,
    "permission_key" "text" NOT NULL,
    "allowed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."role_authorities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_default_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "text" NOT NULL,
    "permission_code" "text" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."role_default_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "public"."employee_role" NOT NULL,
    "permission" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions_2026_02_28_20_06" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "role" character varying(50) NOT NULL,
    "screen_permission" character varying(50) NOT NULL,
    "api_permission" character varying(50) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."role_permissions_2026_02_28_20_06" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying(50),
    "name" character varying(100),
    "description" "text",
    "hierarchy_level" integer,
    "default_scope" character varying(20) DEFAULT 'S1_SELF'::character varying NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "role_key" character varying(80),
    "role_name" character varying(120),
    "is_system" boolean DEFAULT false,
    CONSTRAINT "roles_hierarchy_level_check" CHECK ((("hierarchy_level" >= 0) AND ("hierarchy_level" <= 5)))
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."route_optimizations_2026_02_18_18_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "route_id" "uuid",
    "optimization_type" character varying(30) DEFAULT 'DISTANCE'::character varying,
    "original_waypoints" "jsonb" NOT NULL,
    "original_distance_km" numeric(10,2),
    "original_duration_minutes" integer,
    "optimized_waypoints" "jsonb" NOT NULL,
    "optimized_distance_km" numeric(10,2),
    "optimized_duration_minutes" integer,
    "distance_saved_km" numeric(10,2),
    "time_saved_minutes" integer,
    "fuel_saved_liters" numeric(8,2),
    "cost_saved_amount" numeric(12,2),
    "algorithm_used" character varying(50),
    "computation_time_ms" integer,
    "optimization_score" numeric(5,2),
    "status" character varying(20) DEFAULT 'COMPLETED'::character varying,
    "applied_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."route_optimizations_2026_02_18_18_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."route_optimizations_2026_02_19_15_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "route_name" "text" NOT NULL,
    "vehicle_id" "uuid",
    "rider_id" "uuid",
    "start_location" "jsonb" NOT NULL,
    "end_location" "jsonb",
    "waypoints" "jsonb" DEFAULT '[]'::"jsonb",
    "optimized_sequence" "jsonb" DEFAULT '[]'::"jsonb",
    "total_distance" numeric(10,2),
    "estimated_duration" integer,
    "actual_duration" integer,
    "fuel_consumption" numeric(8,2),
    "optimization_algorithm" "text" DEFAULT 'NEAREST_NEIGHBOR'::"text",
    "status" "text" DEFAULT 'PLANNED'::"text",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "route_optimizations_2026_02_19_15_00_status_check" CHECK (("status" = ANY (ARRAY['PLANNED'::"text", 'IN_PROGRESS'::"text", 'COMPLETED'::"text", 'CANCELLED'::"text"])))
);


ALTER TABLE "public"."route_optimizations_2026_02_19_15_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."route_plans_2026_02_18_17_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "route_code" character varying(30) NOT NULL,
    "route_date" "date" NOT NULL,
    "zone" character varying(10) NOT NULL,
    "total_parcels" integer DEFAULT 0,
    "total_distance_km" numeric(10,2),
    "estimated_duration_minutes" integer,
    "optimized_waypoints" "jsonb",
    "assigned_driver_id" "text",
    "assigned_rider_id" "text",
    "assigned_helper_id" "text",
    "assigned_vehicle_id" "text",
    "status" character varying(20) DEFAULT 'PLANNED'::character varying,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "actual_distance_km" numeric(10,2),
    "actual_duration_minutes" integer,
    "parcels_delivered" integer DEFAULT 0,
    "parcels_failed" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."route_plans_2026_02_18_17_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."routes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "warehouse_id" "uuid" NOT NULL,
    "route_data" "jsonb" NOT NULL,
    "zones" "text"[],
    "estimated_duration" integer,
    "estimated_distance" numeric(10,2),
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."routes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."routes_2026_02_19_13_00" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "route_name" character varying(255) NOT NULL,
    "route_code" character varying(50) NOT NULL,
    "origin_branch_id" "uuid",
    "destination_branch_id" "uuid",
    "route_type" character varying(50) DEFAULT 'DELIVERY'::character varying,
    "assigned_vehicle_id" "uuid",
    "assigned_driver_id" "uuid",
    "planned_start_time" timestamp with time zone,
    "planned_end_time" timestamp with time zone,
    "actual_start_time" timestamp with time zone,
    "actual_end_time" timestamp with time zone,
    "total_distance" numeric(8,2),
    "estimated_duration" integer,
    "actual_duration" integer,
    "waypoints" "jsonb" DEFAULT '[]'::"jsonb",
    "shipment_ids" "jsonb" DEFAULT '[]'::"jsonb",
    "status" character varying(50) DEFAULT 'PLANNED'::character varying,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."routes_2026_02_19_13_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."routes_2026_02_28_20_06" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "route_code" character varying(50) NOT NULL,
    "name" character varying(255) NOT NULL,
    "origin_branch_id" "uuid" NOT NULL,
    "destination_branch_id" "uuid" NOT NULL,
    "distance_km" numeric(10,2),
    "estimated_duration_hours" numeric(5,2),
    "route_type" character varying(50),
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "routes_2026_02_28_20_06_route_type_check" CHECK ((("route_type")::"text" = ANY ((ARRAY['pickup'::character varying, 'delivery'::character varying, 'inter_branch'::character varying, 'return'::character varying])::"text"[]))),
    CONSTRAINT "routes_2026_02_28_20_06_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::"text"[])))
);


ALTER TABLE "public"."routes_2026_02_28_20_06" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rpt_branches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "branch_code" "text" NOT NULL,
    "branch_id" "text",
    "branch_name" "text",
    "name" "text",
    "latitude" numeric DEFAULT 16.8409,
    "longitude" numeric DEFAULT 96.1735,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."rpt_branches" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."rpt_merchants" AS
 SELECT "id",
    "merchant_code",
    "business_name" AS "merchant_name",
    "contact_person",
    "email",
    "phone",
    "business_type",
    "status",
    "registration_date",
    "created_at",
    "updated_at"
   FROM "public"."merchants_2026_02_18_17_00" "m";


ALTER VIEW "public"."rpt_merchants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "event_type" "text",
    "severity" "text",
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."security_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_events_2026_02_11_14_10" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" character varying(100) NOT NULL,
    "severity" character varying(20) DEFAULT 'medium'::character varying,
    "user_id" "uuid",
    "ip_address" "inet",
    "user_agent" "text",
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "resolved" boolean DEFAULT false,
    "resolved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone
);


ALTER TABLE "public"."security_events_2026_02_11_14_10" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seed_users_import" (
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "full_name" "text" NOT NULL
);


ALTER TABLE "public"."seed_users_import" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipment_approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "requested_by" "uuid",
    "reviewed_by" "uuid",
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reviewed_at" timestamp with time zone,
    "notes" "text",
    CONSTRAINT "shipment_approvals_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'APPROVED'::"text", 'REJECTED'::"text"])))
);


ALTER TABLE "public"."shipment_approvals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipment_assignment_rules_2026_02_19_17_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rule_name" character varying(100) NOT NULL,
    "rule_type" character varying(50) NOT NULL,
    "conditions" "jsonb" NOT NULL,
    "actions" "jsonb" NOT NULL,
    "priority" integer DEFAULT 5,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shipment_assignment_rules_2026_02_19_17_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipment_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "tracking_no" "text",
    "way_no" "text",
    "event_type" "text" NOT NULL,
    "actor_id" "text",
    "actor_role" "text",
    "device_id" "text",
    "lat" numeric,
    "lng" numeric,
    "scanned_code" "text",
    "signature_data_url" "text",
    "notes" "text",
    "meta" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shipment_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipment_locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "actor_id" "text",
    "actor_role" "text",
    "lat" numeric NOT NULL,
    "lng" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shipment_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipment_signatures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "actor_id" "text",
    "actor_role" "text",
    "signature_data_url" "text" NOT NULL,
    "lat" numeric,
    "lng" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shipment_signatures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipment_status_history_2026_02_11_14_10" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "status" character varying(50) NOT NULL,
    "location" character varying(255),
    "notes" "text",
    "updated_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."shipment_status_history_2026_02_11_14_10" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipment_status_history_2026_02_17_18_40" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "status" character varying NOT NULL,
    "location" character varying,
    "notes" "text",
    "updated_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."shipment_status_history_2026_02_17_18_40" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipment_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shipment_id" "uuid",
    "step_name" "text" NOT NULL,
    "completed" boolean DEFAULT false,
    "completed_by" "uuid",
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."shipment_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipment_tracking_2026_02_19_13_00" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "shipment_id" "uuid",
    "status" character varying(50) NOT NULL,
    "location" character varying(255),
    "branch_id" "uuid",
    "updated_by" "uuid",
    "notes" "text",
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shipment_tracking_2026_02_19_13_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipment_workflow_states_2026_02_19_17_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "current_state" character varying(50) NOT NULL,
    "previous_state" character varying(50),
    "assigned_to_user_id" "uuid",
    "assigned_to_branch_id" "uuid",
    "assigned_to_vehicle_id" "uuid",
    "workflow_data" "jsonb" DEFAULT '{}'::"jsonb",
    "auto_assigned" boolean DEFAULT false,
    "assignment_reason" "text",
    "estimated_completion" timestamp with time zone,
    "actual_completion" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shipment_workflow_states_2026_02_19_17_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipments_2026_02_11_14_10" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "awb_number" character varying(100) NOT NULL,
    "merchant_id" "uuid",
    "customer_id" "uuid",
    "tamper_tag_id" "uuid",
    "pickup_address" "jsonb" NOT NULL,
    "delivery_address" "jsonb" NOT NULL,
    "package_details" "jsonb" NOT NULL,
    "status" character varying(50) DEFAULT 'registered'::character varying,
    "priority" character varying(20) DEFAULT 'standard'::character varying,
    "cod_amount" numeric(10,2) DEFAULT 0,
    "shipping_cost" numeric(10,2) NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."shipments_2026_02_11_14_10" OWNER TO "postgres";


COMMENT ON TABLE "public"."shipments_2026_02_11_14_10" IS 'Core shipment tracking with tamper-proof security integration';



CREATE TABLE IF NOT EXISTS "public"."shipments_2026_02_17_18_40" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "awb_number" character varying NOT NULL,
    "merchant_id" "uuid",
    "customer_id" "uuid",
    "tamper_tag_id" "uuid",
    "pickup_address" "jsonb" NOT NULL,
    "delivery_address" "jsonb" NOT NULL,
    "package_details" "jsonb" NOT NULL,
    "status" character varying DEFAULT 'registered'::character varying,
    "priority" character varying DEFAULT 'standard'::character varying,
    "cod_amount" numeric DEFAULT 0,
    "shipping_cost" numeric NOT NULL,
    "estimated_delivery" timestamp with time zone,
    "actual_delivery" timestamp with time zone,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."shipments_2026_02_17_18_40" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipments_2026_02_19_13_00" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "awb_number" character varying(50) NOT NULL,
    "reference_number" character varying(100),
    "merchant_id" "uuid",
    "customer_id" "uuid",
    "sender_name" character varying(255) NOT NULL,
    "sender_phone" character varying(20) NOT NULL,
    "sender_address" "text" NOT NULL,
    "sender_city" character varying(100) NOT NULL,
    "sender_state" character varying(100) NOT NULL,
    "receiver_name" character varying(255) NOT NULL,
    "receiver_phone" character varying(20) NOT NULL,
    "receiver_address" "text" NOT NULL,
    "receiver_city" character varying(100) NOT NULL,
    "receiver_state" character varying(100) NOT NULL,
    "package_type" character varying(50) DEFAULT 'DOCUMENT'::character varying,
    "weight" numeric(8,2) NOT NULL,
    "dimensions" "jsonb",
    "declared_value" numeric(12,2) DEFAULT 0,
    "contents_description" "text",
    "special_instructions" "text",
    "service_type" character varying(50) DEFAULT 'STANDARD'::character varying,
    "payment_method" character varying(50) DEFAULT 'COD'::character varying,
    "cod_amount" numeric(12,2) DEFAULT 0,
    "shipping_cost" numeric(10,2) NOT NULL,
    "insurance_cost" numeric(10,2) DEFAULT 0,
    "total_cost" numeric(10,2) NOT NULL,
    "status" character varying(50) DEFAULT 'CREATED'::character varying,
    "current_location" character varying(255),
    "origin_branch_id" "uuid",
    "destination_branch_id" "uuid",
    "assigned_rider_id" "uuid",
    "assigned_vehicle_id" "uuid",
    "pickup_date" "date",
    "expected_delivery_date" "date",
    "actual_delivery_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shipments_2026_02_19_13_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipments_2026_02_28_20_06" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tracking_number" character varying(50) NOT NULL,
    "merchant_id" "uuid",
    "customer_id" "uuid",
    "sender_name" character varying(255) NOT NULL,
    "sender_phone" character varying(50) NOT NULL,
    "sender_address" "text" NOT NULL,
    "sender_city" character varying(100) NOT NULL,
    "sender_state" character varying(100) NOT NULL,
    "sender_postal_code" character varying(20),
    "recipient_name" character varying(255) NOT NULL,
    "recipient_phone" character varying(50) NOT NULL,
    "recipient_address" "text" NOT NULL,
    "recipient_city" character varying(100) NOT NULL,
    "recipient_state" character varying(100) NOT NULL,
    "recipient_postal_code" character varying(20),
    "service_type" character varying(50) NOT NULL,
    "package_type" character varying(50) NOT NULL,
    "weight" numeric(10,3) NOT NULL,
    "length" numeric(10,2),
    "width" numeric(10,2),
    "height" numeric(10,2),
    "declared_value" numeric(15,2) DEFAULT 0,
    "cod_amount" numeric(15,2) DEFAULT 0,
    "cod_collected" boolean DEFAULT false,
    "cod_collected_at" timestamp with time zone,
    "cod_collected_by" "uuid",
    "status" character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    "current_location" character varying(255),
    "origin_branch_id" "uuid",
    "destination_branch_id" "uuid",
    "current_branch_id" "uuid",
    "pickup_date" timestamp with time zone,
    "estimated_delivery" timestamp with time zone,
    "actual_delivery" timestamp with time zone,
    "assigned_rider_id" "uuid",
    "assigned_driver_id" "uuid",
    "base_rate" numeric(10,2) DEFAULT 0 NOT NULL,
    "fuel_surcharge" numeric(10,2) DEFAULT 0,
    "insurance_fee" numeric(10,2) DEFAULT 0,
    "total_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "special_instructions" "text",
    "delivery_instructions" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "shipments_2026_02_28_20_06_package_type_check" CHECK ((("package_type")::"text" = ANY ((ARRAY['document'::character varying, 'parcel'::character varying, 'box'::character varying, 'pallet'::character varying, 'container'::character varying, 'fragile'::character varying, 'perishable'::character varying, 'hazardous'::character varying])::"text"[]))),
    CONSTRAINT "shipments_2026_02_28_20_06_service_type_check" CHECK ((("service_type")::"text" = ANY ((ARRAY['standard'::character varying, 'express'::character varying, 'overnight'::character varying, 'same_day'::character varying])::"text"[]))),
    CONSTRAINT "shipments_2026_02_28_20_06_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'picked_up'::character varying, 'in_transit'::character varying, 'at_hub'::character varying, 'out_for_delivery'::character varying, 'delivered'::character varying, 'failed_delivery'::character varying, 'returned'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."shipments_2026_02_28_20_06" OWNER TO "postgres";


COMMENT ON TABLE "public"."shipments_2026_02_28_20_06" IS 'Production shipments table with sample data for demo purposes';



CREATE TABLE IF NOT EXISTS "public"."shipping_calculations_2026_02_18_18_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text",
    "user_type" character varying(20),
    "origin_type" character varying(20),
    "origin_location" "jsonb",
    "destination_location" "jsonb",
    "actual_weight_kg" numeric(8,2) NOT NULL,
    "dimensions_cm" "jsonb" NOT NULL,
    "volume_weight_kg" numeric(8,2),
    "chargeable_weight_kg" numeric(8,2),
    "service_type" character varying(20),
    "airline_code" character varying(10),
    "base_rate" numeric(10,2),
    "additional_charges" "jsonb",
    "total_amount" numeric(10,2),
    "currency" character varying(3),
    "estimated_delivery_days" integer,
    "estimated_delivery_date" "date",
    "quote_valid_until" timestamp with time zone,
    "is_booked" boolean DEFAULT false,
    "booking_reference" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shipping_calculations_2026_02_18_18_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "location_type" "text" NOT NULL,
    "location_id" "uuid" NOT NULL,
    "title" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "start_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "end_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "staff_assignments_location_type_check" CHECK (("location_type" = ANY (ARRAY['BRANCH'::"text", 'WAREHOUSE'::"text", 'HQ'::"text"])))
);


ALTER TABLE "public"."staff_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff_directory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" DEFAULT 'pending'::"text",
    "status" "text" DEFAULT 'pending_approval'::"text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."staff_directory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."supply_chain_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "way_id" "text" NOT NULL,
    "segment" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "note" "text",
    "meta" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "location_type" "text",
    "location_id" "uuid",
    "auth_user_id" "uuid" NOT NULL,
    "actor_user_id" "uuid",
    "actor_role" "text",
    "device_id" "text",
    "latitude" numeric,
    "longitude" numeric,
    "accuracy_m" numeric,
    "prev_hash" "text",
    "event_hash" "text"
);


ALTER TABLE "public"."supply_chain_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_ticket_messages_2026_02_11_14_10" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "attachments" "text"[],
    "is_internal" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."support_ticket_messages_2026_02_11_14_10" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_number" "text" NOT NULL,
    "shipment_id" "uuid",
    "customer_name" "text",
    "issue_type" "text",
    "priority" "text" DEFAULT 'NORMAL'::"text",
    "status" "text" DEFAULT 'OPEN'::"text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_tickets_2026_02_11_14_10" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_number" character varying(50) NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "assigned_to" "uuid",
    "subject" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "priority" character varying(20) DEFAULT 'medium'::character varying,
    "status" character varying(50) DEFAULT 'open'::character varying,
    "category" character varying(100),
    "shipment_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone
);


ALTER TABLE "public"."support_tickets_2026_02_11_14_10" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings_2026_02_11_14_10" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "setting_key" character varying(100) NOT NULL,
    "setting_value" "jsonb" NOT NULL,
    "description" "text",
    "is_public" boolean DEFAULT false,
    "updated_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_settings_2026_02_11_14_10" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tamper_tags" (
    "tag_id" character varying(50) NOT NULL,
    "status" character varying(20) DEFAULT 'AVAILABLE'::character varying,
    "issued_to" "uuid",
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tamper_tags_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['AVAILABLE'::character varying, 'USED'::character varying, 'VOIDED'::character varying])::"text"[])))
);


ALTER TABLE "public"."tamper_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tamper_tags_2026_02_11_14_10" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tag_code" character varying(50) NOT NULL,
    "batch_id" character varying(100),
    "status" character varying(50) DEFAULT 'available'::character varying,
    "assigned_to" "uuid",
    "assigned_at" timestamp with time zone,
    "activated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."tamper_tags_2026_02_11_14_10" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tamper_tags_2026_02_17_18_40" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tag_code" character varying NOT NULL,
    "batch_id" character varying,
    "status" character varying DEFAULT 'available'::character varying,
    "assigned_to" "uuid",
    "assigned_at" timestamp with time zone,
    "activated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."tamper_tags_2026_02_17_18_40" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tariffs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "township_name" "text" NOT NULL,
    "base_price" numeric(12,2) NOT NULL,
    "weight_surcharge_per_kg" numeric(12,2),
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tariffs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "assigned_to" "uuid",
    "assigned_by" "uuid",
    "status" "public"."task_status" DEFAULT 'pending'::"public"."task_status",
    "priority" "public"."task_priority" DEFAULT 'medium'::"public"."task_priority",
    "due_date" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "related_shipment_id" "uuid",
    "related_delivery_id" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."townships_2026_02_18_18_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "state_division_id" "uuid",
    "code" character varying(15) NOT NULL,
    "name_en" "text" NOT NULL,
    "name_mm" "text" NOT NULL,
    "postal_code" character varying(10),
    "delivery_zone" character varying(20) DEFAULT 'STANDARD'::character varying,
    "distance_from_capital_km" integer,
    "delivery_time_days" integer DEFAULT 1,
    "rate_multiplier" numeric(3,2) DEFAULT 1.00,
    "is_cod_available" boolean DEFAULT true,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."townships_2026_02_18_18_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tracking_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shipment_id" "uuid",
    "status" "text" NOT NULL,
    "location_name" "text",
    "lat" numeric,
    "lng" numeric,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tracking_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tracking_events_2026_02_28_20_06" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "event_type" character varying(50) NOT NULL,
    "status" character varying(50) NOT NULL,
    "location" character varying(255),
    "branch_id" "uuid",
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tracking_events_2026_02_28_20_06_event_type_check" CHECK ((("event_type")::"text" = ANY ((ARRAY['created'::character varying, 'picked_up'::character varying, 'in_transit'::character varying, 'arrived_at_hub'::character varying, 'departed_hub'::character varying, 'out_for_delivery'::character varying, 'delivered'::character varying, 'failed_delivery'::character varying, 'returned'::character varying, 'cancelled'::character varying, 'exception'::character varying, 'damaged'::character varying, 'lost'::character varying])::"text"[])))
);


ALTER TABLE "public"."tracking_events_2026_02_28_20_06" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "description" "text",
    "related_entity_id" "uuid",
    "related_entity_type" "text",
    "processed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions_2026_02_19_13_00" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "transaction_number" character varying(50) NOT NULL,
    "transaction_type" character varying(50) NOT NULL,
    "reference_type" character varying(50),
    "reference_id" "uuid",
    "amount" numeric(12,2) NOT NULL,
    "currency" character varying(10) DEFAULT 'MMK'::character varying,
    "payment_method" character varying(50),
    "collected_by" "uuid",
    "merchant_id" "uuid",
    "customer_id" "uuid",
    "branch_id" "uuid",
    "status" character varying(50) DEFAULT 'PENDING'::character varying,
    "settlement_status" character varying(50) DEFAULT 'UNSETTLED'::character varying,
    "settlement_date" "date",
    "notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."transactions_2026_02_19_13_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trusted_merchants" (
    "merchant_id" "uuid" NOT NULL,
    "enabled" boolean DEFAULT true,
    "risk_tier" "text" DEFAULT 'LOW'::"text",
    CONSTRAINT "trusted_merchants_risk_tier_check" CHECK (("risk_tier" = ANY (ARRAY['LOW'::"text", 'MEDIUM'::"text", 'HIGH'::"text"])))
);


ALTER TABLE "public"."trusted_merchants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_activity_2026_02_11_14_10" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" character varying(100) NOT NULL,
    "resource_type" character varying(100),
    "resource_id" "uuid",
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_activity_2026_02_11_14_10" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_activity_2026_02_11_14_10" IS 'Complete audit trail for security and compliance';



CREATE TABLE IF NOT EXISTS "public"."user_authorities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "permission_key" "text" NOT NULL,
    "allowed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_authorities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_branch_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "branch_id" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_branch_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_credentials" (
    "profile_id" "uuid" NOT NULL,
    "password_hash" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_credentials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_permission_grants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "permission_code" "text" NOT NULL,
    "effect" "text" NOT NULL,
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."user_permission_grants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "permission_id" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "role" "public"."employee_role" DEFAULT 'customer'::"public"."employee_role" NOT NULL,
    "branch_id" "uuid",
    "phone" "text",
    "avatar_url" "text",
    "is_active" boolean DEFAULT true,
    "preferences" "jsonb" DEFAULT '{"theme": "auto", "language": "en", "notifications": {"sms": false, "push": true, "email": true}}'::"jsonb",
    "last_login" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "valid_from" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_scopes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "scope_type" character varying(30) NOT NULL,
    "branch_id" "uuid",
    "merchant_account_id" "uuid",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_scopes_scope_type_check" CHECK ((("scope_type")::"text" = ANY ((ARRAY['all'::character varying, 'branch'::character varying, 'merchant'::character varying, 'self'::character varying, 'assigned'::character varying, 'public'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_scopes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_token" character varying(255) NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "is_active" boolean DEFAULT true,
    "last_activity" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_sessions_2026_02_11_14_10" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_token" "text" NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."user_sessions_2026_02_11_14_10" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_sessions_2026_02_28_20_06" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_token" character varying(255) NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_sessions_2026_02_28_20_06" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users_2026_02_11_14_10" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "username" character varying(100) NOT NULL,
    "password_hash" "text" NOT NULL,
    "name" character varying(255) NOT NULL,
    "role" "public"."user_role" NOT NULL,
    "permissions" "text"[] DEFAULT '{}'::"text"[],
    "is_active" boolean DEFAULT true,
    "is_blocked" boolean DEFAULT false,
    "blocked_reason" "text",
    "blocked_by" "uuid",
    "blocked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_login" timestamp with time zone,
    "login_attempts" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."users_2026_02_11_14_10" OWNER TO "postgres";


COMMENT ON TABLE "public"."users_2026_02_11_14_10" IS 'Comprehensive user management with RBAC for Express Delivery System';



CREATE TABLE IF NOT EXISTS "public"."users_2026_02_17_18_40" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying NOT NULL,
    "username" character varying NOT NULL,
    "name" character varying NOT NULL,
    "role" character varying NOT NULL,
    "branch_id" "uuid",
    "permissions" "text"[] DEFAULT '{}'::"text"[],
    "is_active" boolean DEFAULT true,
    "is_blocked" boolean DEFAULT false,
    "blocked_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_login" timestamp with time zone,
    "login_attempts" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."users_2026_02_17_18_40" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users_2026_02_28_20_06" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "name" character varying(255) NOT NULL,
    "phone" character varying(50),
    "avatar_url" "text",
    "app_role" character varying(50) NOT NULL,
    "data_scope" character varying(20) NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "branch_id" "uuid",
    "region_id" "uuid",
    "last_login" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "users_2026_02_28_20_06_app_role_check" CHECK ((("app_role")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying, 'user'::character varying, 'staff'::character varying, 'SUPER_ADMIN'::character varying])::"text"[]))),
    CONSTRAINT "users_2026_02_28_20_06_data_scope_check" CHECK ((("data_scope")::"text" = ANY ((ARRAY['all'::character varying, 'branch'::character varying, 'region'::character varying, 'GLOBAL'::character varying])::"text"[]))),
    CONSTRAINT "users_2026_02_28_20_06_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'suspended'::character varying])::"text"[])))
);


ALTER TABLE "public"."users_2026_02_28_20_06" OWNER TO "postgres";


COMMENT ON TABLE "public"."users_2026_02_28_20_06" IS 'Production users table with minimal demo data for testing';



CREATE TABLE IF NOT EXISTS "public"."vehicle_locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_id" "uuid",
    "latitude" numeric NOT NULL,
    "longitude" numeric NOT NULL,
    "speed_kph" numeric DEFAULT 0,
    "heading" numeric DEFAULT 0,
    "last_seen_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'active'::"text"
);


ALTER TABLE "public"."vehicle_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_tracking_2026_02_19_13_00" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "vehicle_id" "uuid",
    "driver_id" "uuid",
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "speed" numeric(5,2),
    "heading" integer,
    "altitude" numeric(8,2),
    "accuracy" numeric(8,2),
    "battery_level" integer,
    "engine_status" character varying(20),
    "fuel_level" numeric(5,2),
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vehicle_tracking_2026_02_19_13_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "registration_number" "text" NOT NULL,
    "type" "public"."vehicle_type" NOT NULL,
    "capacity" "jsonb",
    "current_driver_id" "uuid",
    "warehouse_id" "uuid",
    "status" "text" DEFAULT 'available'::"text",
    "last_maintenance_date" "date",
    "next_maintenance_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vehicles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicles_2026_02_18_17_00" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_code" character varying(20) NOT NULL,
    "plate_number" character varying(20) NOT NULL,
    "vehicle_type" character varying(20) NOT NULL,
    "capacity_kg" numeric(8,2),
    "capacity_parcels" integer,
    "status" character varying(20) DEFAULT 'AVAILABLE'::character varying,
    "current_location" "jsonb",
    "fuel_level" numeric(5,2),
    "assigned_driver_id" "text",
    "current_route_id" "uuid",
    "last_service_date" "date",
    "next_service_due" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vehicles_2026_02_18_17_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicles_2026_02_19_13_00" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "vehicle_number" character varying(50) NOT NULL,
    "vehicle_type" character varying(50) NOT NULL,
    "make" character varying(100),
    "model" character varying(100),
    "year" integer,
    "capacity_weight" numeric(8,2),
    "capacity_volume" numeric(8,2),
    "fuel_type" character varying(50),
    "license_plate" character varying(50),
    "insurance_info" "jsonb",
    "maintenance_schedule" "jsonb",
    "current_driver_id" "uuid",
    "home_branch_id" "uuid",
    "odometer_reading" integer DEFAULT 0,
    "fuel_efficiency" numeric(5,2),
    "status" character varying(20) DEFAULT 'AVAILABLE'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vehicles_2026_02_19_13_00" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicles_2026_02_28_20_06" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "vehicle_number" character varying(50) NOT NULL,
    "vehicle_type" character varying(50) NOT NULL,
    "make" character varying(100),
    "model" character varying(100),
    "year" integer,
    "capacity_weight" numeric(10,3),
    "capacity_volume" numeric(10,3),
    "fuel_type" character varying(50),
    "branch_id" "uuid",
    "assigned_driver_id" "uuid",
    "status" character varying(20) DEFAULT 'available'::character varying,
    "last_maintenance" timestamp with time zone,
    "next_maintenance" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "vehicles_2026_02_28_20_06_fuel_type_check" CHECK ((("fuel_type")::"text" = ANY ((ARRAY['petrol'::character varying, 'diesel'::character varying, 'electric'::character varying, 'hybrid'::character varying])::"text"[]))),
    CONSTRAINT "vehicles_2026_02_28_20_06_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['available'::character varying, 'in_use'::character varying, 'maintenance'::character varying, 'retired'::character varying])::"text"[]))),
    CONSTRAINT "vehicles_2026_02_28_20_06_vehicle_type_check" CHECK ((("vehicle_type")::"text" = ANY ((ARRAY['motorcycle'::character varying, 'van'::character varying, 'truck'::character varying, 'container_truck'::character varying])::"text"[])))
);


ALTER TABLE "public"."vehicles_2026_02_28_20_06" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallet_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "transaction_type" "text",
    "amount" numeric NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wallet_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."warehouse_inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shipment_id" "uuid",
    "branch_code" "text",
    "rack_location" "text",
    "status" "text" DEFAULT 'IN_STOCK'::"text",
    "scanned_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."warehouse_inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."warehouse_scans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tracking_no" "text" NOT NULL,
    "scan_type" "text" DEFAULT 'inbound'::"text" NOT NULL,
    "scanned_at" timestamp with time zone DEFAULT "now"(),
    "operator" "text" DEFAULT 'system_auto'::"text"
);


ALTER TABLE "public"."warehouse_scans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."warehouse_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by_email" "text",
    "type" "text",
    "status" "text" DEFAULT 'PENDING'::"text",
    "reference" "text",
    "sku" "text",
    "qty" numeric,
    "from_location" "text",
    "to_location" "text",
    "assigned_to_email" "text",
    "note" "text",
    "meta" "jsonb",
    CONSTRAINT "warehouse_tasks_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'IN_PROGRESS'::"text", 'COMPLETED'::"text", 'HOLD'::"text", 'CANCELLED'::"text"]))),
    CONSTRAINT "warehouse_tasks_type_check" CHECK (("type" = ANY (ARRAY['RECEIVE'::"text", 'PUTAWAY'::"text", 'PICK'::"text", 'PACK'::"text", 'DISPATCH'::"text", 'CYCLE_COUNT'::"text", 'QC_HOLD'::"text"])))
);


ALTER TABLE "public"."warehouse_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."warehouses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "type" "public"."warehouse_type" NOT NULL,
    "address" "jsonb" NOT NULL,
    "capacity" "jsonb",
    "operating_hours" "jsonb",
    "contact_person" "jsonb",
    "status" "text" DEFAULT 'operational'::"text",
    "facilities" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."warehouses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."warehouses_2026_02_28_20_06" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "warehouse_code" character varying(50) NOT NULL,
    "name" character varying(255) NOT NULL,
    "branch_id" "uuid" NOT NULL,
    "address" "text" NOT NULL,
    "total_capacity" numeric(15,3) NOT NULL,
    "used_capacity" numeric(15,3) DEFAULT 0,
    "available_capacity" numeric(15,3) GENERATED ALWAYS AS (("total_capacity" - "used_capacity")) STORED,
    "temperature_controlled" boolean DEFAULT false,
    "security_level" character varying(20) DEFAULT 'standard'::character varying,
    "operating_hours" "jsonb",
    "manager_id" "uuid",
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "warehouses_2026_02_28_20_06_security_level_check" CHECK ((("security_level")::"text" = ANY ((ARRAY['basic'::character varying, 'standard'::character varying, 'high'::character varying, 'maximum'::character varying])::"text"[]))),
    CONSTRAINT "warehouses_2026_02_28_20_06_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'maintenance'::character varying])::"text"[])))
);


ALTER TABLE "public"."warehouses_2026_02_28_20_06" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."way_plan_stops" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "way_plan_id" "uuid" NOT NULL,
    "way_id" "text",
    "recipient_name" "text",
    "township" "text",
    "address" "text",
    "phone_1" "text",
    "phone_2" "text",
    "payment_type" "text",
    "weight_kg" numeric DEFAULT 0,
    "item_price" numeric DEFAULT 0,
    "delivery_charge" numeric DEFAULT 0,
    "weight_charge" numeric DEFAULT 0,
    "total" numeric DEFAULT 0,
    "rider_name" "text",
    "driver_name" "text",
    "helper_name" "text",
    "car_no" "text",
    "remark" "text",
    "latitude" numeric,
    "longitude" numeric,
    "route_group" "text",
    "sequence_no" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."way_plan_stops" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."way_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_name" "text" NOT NULL,
    "plan_date" "date",
    "route_mode" "text" DEFAULT 'closed_loop'::"text",
    "group_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."way_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."way_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "way_id" character varying(50) NOT NULL,
    "way_type" "public"."way_type" NOT NULL,
    "status" "public"."way_status" DEFAULT 'CREATED'::"public"."way_status",
    "merchant_id" character varying(50),
    "merchant_name" character varying(255),
    "customer_name" character varying(255),
    "customer_phone" character varying(50),
    "township" character varying(100),
    "address" "text",
    "cod_amount" numeric(12,2) DEFAULT 0,
    "transportation_cost" numeric(12,2) DEFAULT 0,
    "prepaid" numeric(12,2) DEFAULT 0,
    "cash_advance" numeric(12,2) DEFAULT 0,
    "total_ways" integer DEFAULT 1,
    "delivered_count" integer DEFAULT 0,
    "pickup_date" "date",
    "deliver_date" "date",
    "pickup_by" "uuid",
    "deliver_by" "uuid",
    "return_by" "uuid",
    "created_by" character varying(100),
    "updated_by" character varying(100),
    "failed_reason" "text",
    "failed_count" integer DEFAULT 0,
    "retry_count" integer DEFAULT 0,
    "zone" character varying(100),
    "branch" character varying(100) DEFAULT 'Head Office'::character varying,
    "car_required" boolean DEFAULT false,
    "parcel_arrived" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."way_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waybill_counters" (
    "issue_date" "date" NOT NULL,
    "origin_code" "text" NOT NULL,
    "office_tag" "text" NOT NULL,
    "branch_code" "text" DEFAULT ''::"text" NOT NULL,
    "next_val" bigint DEFAULT 1 NOT NULL,
    CONSTRAINT "waybill_counters_office_tag_check" CHECK (("office_tag" = ANY (ARRAY['HQ'::"text", 'BO'::"text"])))
);


ALTER TABLE "public"."waybill_counters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waybill_print_items" (
    "job_id" "uuid" NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "way_id" "text" NOT NULL
);


ALTER TABLE "public"."waybill_print_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waybill_print_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "requested_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "mode" "text" NOT NULL,
    "printer_name" "text",
    "copies" integer DEFAULT 1 NOT NULL,
    "status" "text" DEFAULT 'QUEUED'::"text" NOT NULL,
    "printed_at" timestamp with time zone,
    CONSTRAINT "waybill_print_jobs_mode_check" CHECK (("mode" = ANY (ARRAY['SINGLE'::"text", 'BATCH'::"text"]))),
    CONSTRAINT "waybill_print_jobs_status_check" CHECK (("status" = ANY (ARRAY['QUEUED'::"text", 'PRINTED'::"text", 'FAILED'::"text"])))
);


ALTER TABLE "public"."waybill_print_jobs" OWNER TO "postgres";


ALTER TABLE ONLY "public"."audit_dml_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."audit_dml_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."active_sessions"
    ADD CONSTRAINT "active_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."air_cargo_specifications_2026_02_18_18_00"
    ADD CONSTRAINT "air_cargo_specifications_2026_02_18_18_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."approval_history"
    ADD CONSTRAINT "approval_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."approval_requests"
    ADD CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."approval_workflows_2026_02_28_20_06"
    ADD CONSTRAINT "approval_workflows_2026_02_28_20_06_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."approvals"
    ADD CONSTRAINT "approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assignment_queue_2026_02_19_17_00"
    ADD CONSTRAINT "assignment_queue_2026_02_19_17_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_employee_id_date_key" UNIQUE ("employee_id", "date");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_dml_logs"
    ADD CONSTRAINT "audit_dml_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_trigger_exclusions"
    ADD CONSTRAINT "audit_trigger_exclusions_pkey" PRIMARY KEY ("table_name");



ALTER TABLE ONLY "public"."authority_permissions"
    ADD CONSTRAINT "authority_permissions_permission_key_key" UNIQUE ("permission_key");



ALTER TABLE ONLY "public"."authority_permissions"
    ADD CONSTRAINT "authority_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auto_approve_policies"
    ADD CONSTRAINT "auto_approve_policies_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."auto_approve_policies"
    ADD CONSTRAINT "auto_approve_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bags"
    ADD CONSTRAINT "bags_bag_code_key" UNIQUE ("bag_code");



ALTER TABLE ONLY "public"."bags"
    ADD CONSTRAINT "bags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."branch_daily_metrics"
    ADD CONSTRAINT "branch_daily_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."branch_regions"
    ADD CONSTRAINT "branch_regions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."broadcast_messages"
    ADD CONSTRAINT "broadcast_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cash_vouchers"
    ADD CONSTRAINT "cash_vouchers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chain_of_custody_logs"
    ADD CONSTRAINT "chain_of_custody_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."claims_2026_02_28_20_06"
    ADD CONSTRAINT "claims_2026_02_28_20_06_claim_number_key" UNIQUE ("claim_number");



ALTER TABLE ONLY "public"."claims_2026_02_28_20_06"
    ADD CONSTRAINT "claims_2026_02_28_20_06_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cod_collections_2026_02_28_20_06"
    ADD CONSTRAINT "cod_collections_2026_02_28_20_06_collection_number_key" UNIQUE ("collection_number");



ALTER TABLE ONLY "public"."cod_collections_2026_02_28_20_06"
    ADD CONSTRAINT "cod_collections_2026_02_28_20_06_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cod_collections"
    ADD CONSTRAINT "cod_collections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."commissions_2026_02_11_14_10"
    ADD CONSTRAINT "commissions_2026_02_11_14_10_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."complaint_messages"
    ADD CONSTRAINT "complaint_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."complaints"
    ADD CONSTRAINT "complaints_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."complaints"
    ADD CONSTRAINT "complaints_ticket_number_key" UNIQUE ("ticket_number");



ALTER TABLE ONLY "public"."courier_locations"
    ADD CONSTRAINT "courier_locations_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."coverage_zones"
    ADD CONSTRAINT "coverage_zones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_kyc"
    ADD CONSTRAINT "customer_kyc_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."customer_segments_2026_02_11_14_10"
    ADD CONSTRAINT "customer_segments_2026_02_11_14_10_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers_2026_02_18_17_00"
    ADD CONSTRAINT "customers_2026_02_18_17_00_customer_code_key" UNIQUE ("customer_code");



ALTER TABLE ONLY "public"."customers_2026_02_18_17_00"
    ADD CONSTRAINT "customers_2026_02_18_17_00_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."customers_2026_02_18_17_00"
    ADD CONSTRAINT "customers_2026_02_18_17_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers_2026_02_19_13_00"
    ADD CONSTRAINT "customers_2026_02_19_13_00_customer_code_key" UNIQUE ("customer_code");



ALTER TABLE ONLY "public"."customers_2026_02_19_13_00"
    ADD CONSTRAINT "customers_2026_02_19_13_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers_2026_02_28_20_06"
    ADD CONSTRAINT "customers_2026_02_28_20_06_customer_code_key" UNIQUE ("customer_code");



ALTER TABLE ONLY "public"."customers_2026_02_28_20_06"
    ADD CONSTRAINT "customers_2026_02_28_20_06_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."data_entry_automation_2026_02_18_18_00"
    ADD CONSTRAINT "data_entry_automation_2026_02_18_18_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deliveries_2026_02_19_13_00"
    ADD CONSTRAINT "deliveries_2026_02_19_13_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delivery_history"
    ADD CONSTRAINT "delivery_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delivery_personnel_2026_02_18_17_00"
    ADD CONSTRAINT "delivery_personnel_2026_02_18_17_00_personnel_code_key" UNIQUE ("personnel_code");



ALTER TABLE ONLY "public"."delivery_personnel_2026_02_18_17_00"
    ADD CONSTRAINT "delivery_personnel_2026_02_18_17_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delivery_records_2026_02_11_14_10"
    ADD CONSTRAINT "delivery_records_2026_02_11_14_10_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delivery_records_2026_02_17_18_40"
    ADD CONSTRAINT "delivery_records_2026_02_17_18_40_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delivery_status_history"
    ADD CONSTRAINT "delivery_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deliverymen"
    ADD CONSTRAINT "deliverymen_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."demo_login_credentials_2026_02_19_14_00"
    ADD CONSTRAINT "demo_login_credentials_2026_02_19_14_00_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."demo_login_credentials_2026_02_19_14_00"
    ADD CONSTRAINT "demo_login_credentials_2026_02_19_14_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."domestic_rates_2026_02_19_13_00"
    ADD CONSTRAINT "domestic_rates_2026_02_19_13_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."domestic_shipping_rates_2026_02_18_18_00"
    ADD CONSTRAINT "domestic_shipping_rates_2026_02_18_18_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."domestic_tariffs"
    ADD CONSTRAINT "domestic_tariffs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."electronic_signatures_2026_02_18_18_00"
    ADD CONSTRAINT "electronic_signatures_2026_02_18_18_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."electronic_signatures_2026_02_19_15_00"
    ADD CONSTRAINT "electronic_signatures_2026_02_19_15_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_employee_code_key" UNIQUE ("employee_code");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_flag_key_key" UNIQUE ("flag_key");



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."finance_deposits"
    ADD CONSTRAINT "finance_deposits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."finance_ledger"
    ADD CONSTRAINT "finance_ledger_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_transactions_2026_02_11_14_10"
    ADD CONSTRAINT "financial_transactions_2026_02_11_14_10_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_transactions"
    ADD CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_transactions"
    ADD CONSTRAINT "financial_transactions_transaction_id_key" UNIQUE ("transaction_id");



ALTER TABLE ONLY "public"."fleet_assets"
    ADD CONSTRAINT "fleet_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fleet_assets"
    ADD CONSTRAINT "fleet_assets_plate_number_key" UNIQUE ("plate_number");



ALTER TABLE ONLY "public"."fleet_assets"
    ADD CONSTRAINT "fleet_assets_vehicle_plate_key" UNIQUE ("vehicle_plate");



ALTER TABLE ONLY "public"."fleet_telemetry"
    ADD CONSTRAINT "fleet_telemetry_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."geofences_2026_02_18_18_00"
    ADD CONSTRAINT "geofences_2026_02_18_18_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."geofences_2026_02_19_15_00"
    ADD CONSTRAINT "geofences_2026_02_19_15_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gps_tracking_2026_02_18_18_00"
    ADD CONSTRAINT "gps_tracking_2026_02_18_18_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gps_tracking_advanced_2026_02_19_15_00"
    ADD CONSTRAINT "gps_tracking_advanced_2026_02_19_15_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."international_destinations_2026_02_18_18_00"
    ADD CONSTRAINT "international_destinations_2026_02_18_18_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."international_rates_2026_02_19_13_00"
    ADD CONSTRAINT "international_rates_2026_02_19_13_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."international_shipping_rates_2026_02_18_18_00"
    ADD CONSTRAINT "international_shipping_rates_2026_02_18_18_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."intl_tariffs"
    ADD CONSTRAINT "intl_tariffs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_2026_02_19_13_00"
    ADD CONSTRAINT "inventory_2026_02_19_13_00_item_code_key" UNIQUE ("item_code");



ALTER TABLE ONLY "public"."inventory_2026_02_19_13_00"
    ADD CONSTRAINT "inventory_2026_02_19_13_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_2026_02_28_20_06"
    ADD CONSTRAINT "inventory_2026_02_28_20_06_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_movements_2026_02_19_13_00"
    ADD CONSTRAINT "inventory_movements_2026_02_19_13_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_items_2026_02_28_20_06"
    ADD CONSTRAINT "invoice_items_2026_02_28_20_06_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices_2026_02_28_20_06"
    ADD CONSTRAINT "invoices_2026_02_28_20_06_invoice_number_key" UNIQUE ("invoice_number");



ALTER TABLE ONLY "public"."invoices_2026_02_28_20_06"
    ADD CONSTRAINT "invoices_2026_02_28_20_06_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_invoice_number_key" UNIQUE ("invoice_number");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."journal_vouchers"
    ADD CONSTRAINT "journal_vouchers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kpi_data_2026_02_11_14_10"
    ADD CONSTRAINT "kpi_data_2026_02_11_14_10_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."manifest_items"
    ADD CONSTRAINT "manifest_items_manifest_id_shipment_id_key" UNIQUE ("manifest_id", "shipment_id");



ALTER TABLE ONLY "public"."manifest_items"
    ADD CONSTRAINT "manifest_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."manifests"
    ADD CONSTRAINT "manifests_manifest_number_key" UNIQUE ("manifest_number");



ALTER TABLE ONLY "public"."manifests"
    ADD CONSTRAINT "manifests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketing_campaigns_2026_02_11_14_10"
    ADD CONSTRAINT "marketing_campaigns_2026_02_11_14_10_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketing_logs"
    ADD CONSTRAINT "marketing_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_audit_logs"
    ADD CONSTRAINT "master_audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."merchant_accounts"
    ADD CONSTRAINT "merchant_accounts_merchant_code_key" UNIQUE ("merchant_code");



ALTER TABLE ONLY "public"."merchant_accounts"
    ADD CONSTRAINT "merchant_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."merchants_2026_02_18_17_00"
    ADD CONSTRAINT "merchants_2026_02_18_17_00_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."merchants_2026_02_18_17_00"
    ADD CONSTRAINT "merchants_2026_02_18_17_00_merchant_code_key" UNIQUE ("merchant_code");



ALTER TABLE ONLY "public"."merchants_2026_02_18_17_00"
    ADD CONSTRAINT "merchants_2026_02_18_17_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."merchants"
    ADD CONSTRAINT "merchants_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."merchants"
    ADD CONSTRAINT "merchants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."migration_history"
    ADD CONSTRAINT "migration_history_pkey" PRIMARY KEY ("name");



ALTER TABLE ONLY "public"."myanmar_locations_2026_02_19_13_00"
    ADD CONSTRAINT "myanmar_locations_2026_02_19_13_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."myanmar_states_divisions_2026_02_18_18_00"
    ADD CONSTRAINT "myanmar_states_divisions_2026_02_18_18_00_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."myanmar_states_divisions_2026_02_18_18_00"
    ADD CONSTRAINT "myanmar_states_divisions_2026_02_18_18_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications_2026_02_19_13_00"
    ADD CONSTRAINT "notifications_2026_02_19_13_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."operator_branch_memberships"
    ADD CONSTRAINT "operator_branch_memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."operators"
    ADD CONSTRAINT "operators_display_id_key" UNIQUE ("display_id");



ALTER TABLE ONLY "public"."operators"
    ADD CONSTRAINT "operators_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."operators"
    ADD CONSTRAINT "operators_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parcels_2026_02_18_17_00"
    ADD CONSTRAINT "parcels_2026_02_18_17_00_parcel_id_key" UNIQUE ("parcel_id");



ALTER TABLE ONLY "public"."parcels_2026_02_18_17_00"
    ADD CONSTRAINT "parcels_2026_02_18_17_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments_2026_02_28_20_06"
    ADD CONSTRAINT "payments_2026_02_28_20_06_payment_number_key" UNIQUE ("payment_number");



ALTER TABLE ONLY "public"."payments_2026_02_28_20_06"
    ADD CONSTRAINT "payments_2026_02_28_20_06_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permission_overrides"
    ADD CONSTRAINT "permission_overrides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pickup_records_2026_02_11_14_10"
    ADD CONSTRAINT "pickup_records_2026_02_11_14_10_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles_2026_02_19_13_00"
    ADD CONSTRAINT "profiles_2026_02_19_13_00_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles_2026_02_19_13_00"
    ADD CONSTRAINT "profiles_2026_02_19_13_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."qr_codes_2026_02_18_17_00"
    ADD CONSTRAINT "qr_codes_2026_02_18_17_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."qr_codes_advanced_2026_02_19_15_00"
    ADD CONSTRAINT "qr_codes_advanced_2026_02_19_15_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."qr_codes_advanced_2026_02_19_15_00"
    ADD CONSTRAINT "qr_codes_advanced_2026_02_19_15_00_qr_code_key" UNIQUE ("qr_code");



ALTER TABLE ONLY "public"."qr_codes"
    ADD CONSTRAINT "qr_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."qr_codes"
    ADD CONSTRAINT "qr_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."qr_scan_logs_2026_02_18_17_00"
    ADD CONSTRAINT "qr_scan_logs_2026_02_18_17_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rbac_roles"
    ADD CONSTRAINT "rbac_roles_pkey" PRIMARY KEY ("role_code");



ALTER TABLE ONLY "public"."realtime_events_2026_02_18_18_00"
    ADD CONSTRAINT "realtime_events_2026_02_18_18_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."realtime_events_2026_02_19_15_00"
    ADD CONSTRAINT "realtime_events_2026_02_19_15_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."realtime_notifications_2026_02_19_17_00"
    ADD CONSTRAINT "realtime_notifications_2026_02_19_17_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_receipt_number_key" UNIQUE ("receipt_number");



ALTER TABLE ONLY "public"."regions_2026_02_28_20_06"
    ADD CONSTRAINT "regions_2026_02_28_20_06_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."regions_2026_02_28_20_06"
    ADD CONSTRAINT "regions_2026_02_28_20_06_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports_2026_02_11_14_10"
    ADD CONSTRAINT "reports_2026_02_11_14_10_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rider_compliance"
    ADD CONSTRAINT "rider_compliance_pkey" PRIMARY KEY ("rider_id");



ALTER TABLE ONLY "public"."role_authorities"
    ADD CONSTRAINT "role_authorities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_authorities"
    ADD CONSTRAINT "role_authorities_role_permission_key_key" UNIQUE ("role", "permission_key");



ALTER TABLE ONLY "public"."role_default_permissions"
    ADD CONSTRAINT "role_default_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_default_permissions"
    ADD CONSTRAINT "role_default_permissions_role_permission_code_key" UNIQUE ("role", "permission_code");



ALTER TABLE ONLY "public"."role_permissions_2026_02_28_20_06"
    ADD CONSTRAINT "role_permissions_2026_02_28_20_06_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_permission_key" UNIQUE ("role", "permission");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_role_key_unique" UNIQUE ("role_key");



ALTER TABLE ONLY "public"."route_optimizations_2026_02_18_18_00"
    ADD CONSTRAINT "route_optimizations_2026_02_18_18_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."route_optimizations_2026_02_19_15_00"
    ADD CONSTRAINT "route_optimizations_2026_02_19_15_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."route_plans_2026_02_18_17_00"
    ADD CONSTRAINT "route_plans_2026_02_18_17_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."route_plans_2026_02_18_17_00"
    ADD CONSTRAINT "route_plans_2026_02_18_17_00_route_code_key" UNIQUE ("route_code");



ALTER TABLE ONLY "public"."routes_2026_02_19_13_00"
    ADD CONSTRAINT "routes_2026_02_19_13_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."routes_2026_02_19_13_00"
    ADD CONSTRAINT "routes_2026_02_19_13_00_route_code_key" UNIQUE ("route_code");



ALTER TABLE ONLY "public"."routes_2026_02_28_20_06"
    ADD CONSTRAINT "routes_2026_02_28_20_06_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."routes_2026_02_28_20_06"
    ADD CONSTRAINT "routes_2026_02_28_20_06_route_code_key" UNIQUE ("route_code");



ALTER TABLE ONLY "public"."routes"
    ADD CONSTRAINT "routes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rpt_branches"
    ADD CONSTRAINT "rpt_branches_branch_code_key" UNIQUE ("branch_code");



ALTER TABLE ONLY "public"."rpt_branches"
    ADD CONSTRAINT "rpt_branches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_events_2026_02_11_14_10"
    ADD CONSTRAINT "security_events_2026_02_11_14_10_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seed_users_import"
    ADD CONSTRAINT "seed_users_import_pkey" PRIMARY KEY ("email");



ALTER TABLE ONLY "public"."shipment_approvals"
    ADD CONSTRAINT "shipment_approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipment_assignment_rules_2026_02_19_17_00"
    ADD CONSTRAINT "shipment_assignment_rules_2026_02_19_17_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipment_events"
    ADD CONSTRAINT "shipment_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipment_locations"
    ADD CONSTRAINT "shipment_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipment_signatures"
    ADD CONSTRAINT "shipment_signatures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipment_status_history_2026_02_11_14_10"
    ADD CONSTRAINT "shipment_status_history_2026_02_11_14_10_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipment_status_history_2026_02_17_18_40"
    ADD CONSTRAINT "shipment_status_history_2026_02_17_18_40_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipment_steps"
    ADD CONSTRAINT "shipment_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipment_tracking_2026_02_19_13_00"
    ADD CONSTRAINT "shipment_tracking_2026_02_19_13_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipment_tracking"
    ADD CONSTRAINT "shipment_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipment_workflow_states_2026_02_19_17_00"
    ADD CONSTRAINT "shipment_workflow_states_2026_02_19_17_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipments_2026_02_11_14_10"
    ADD CONSTRAINT "shipments_2026_02_11_14_10_awb_number_key" UNIQUE ("awb_number");



ALTER TABLE ONLY "public"."shipments_2026_02_11_14_10"
    ADD CONSTRAINT "shipments_2026_02_11_14_10_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipments_2026_02_17_18_40"
    ADD CONSTRAINT "shipments_2026_02_17_18_40_awb_number_key" UNIQUE ("awb_number");



ALTER TABLE ONLY "public"."shipments_2026_02_17_18_40"
    ADD CONSTRAINT "shipments_2026_02_17_18_40_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipments_2026_02_19_13_00"
    ADD CONSTRAINT "shipments_2026_02_19_13_00_awb_number_key" UNIQUE ("awb_number");



ALTER TABLE ONLY "public"."shipments_2026_02_19_13_00"
    ADD CONSTRAINT "shipments_2026_02_19_13_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipments_2026_02_28_20_06"
    ADD CONSTRAINT "shipments_2026_02_28_20_06_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipments_2026_02_28_20_06"
    ADD CONSTRAINT "shipments_2026_02_28_20_06_tracking_number_key" UNIQUE ("tracking_number");



ALTER TABLE ONLY "public"."shipments"
    ADD CONSTRAINT "shipments_awb_key" UNIQUE ("awb");



ALTER TABLE ONLY "public"."shipments"
    ADD CONSTRAINT "shipments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipping_calculations_2026_02_18_18_00"
    ADD CONSTRAINT "shipping_calculations_2026_02_18_18_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_assignments"
    ADD CONSTRAINT "staff_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_directory"
    ADD CONSTRAINT "staff_directory_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."staff_directory"
    ADD CONSTRAINT "staff_directory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supply_chain_events"
    ADD CONSTRAINT "supply_chain_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_ticket_messages_2026_02_11_14_10"
    ADD CONSTRAINT "support_ticket_messages_2026_02_11_14_10_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets_2026_02_11_14_10"
    ADD CONSTRAINT "support_tickets_2026_02_11_14_10_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets_2026_02_11_14_10"
    ADD CONSTRAINT "support_tickets_2026_02_11_14_10_ticket_number_key" UNIQUE ("ticket_number");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_ticket_number_key" UNIQUE ("ticket_number");



ALTER TABLE ONLY "public"."system_settings_2026_02_11_14_10"
    ADD CONSTRAINT "system_settings_2026_02_11_14_10_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings_2026_02_11_14_10"
    ADD CONSTRAINT "system_settings_2026_02_11_14_10_setting_key_key" UNIQUE ("setting_key");



ALTER TABLE ONLY "public"."tamper_tags_2026_02_11_14_10"
    ADD CONSTRAINT "tamper_tags_2026_02_11_14_10_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tamper_tags_2026_02_11_14_10"
    ADD CONSTRAINT "tamper_tags_2026_02_11_14_10_tag_code_key" UNIQUE ("tag_code");



ALTER TABLE ONLY "public"."tamper_tags_2026_02_17_18_40"
    ADD CONSTRAINT "tamper_tags_2026_02_17_18_40_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tamper_tags_2026_02_17_18_40"
    ADD CONSTRAINT "tamper_tags_2026_02_17_18_40_tag_code_key" UNIQUE ("tag_code");



ALTER TABLE ONLY "public"."tamper_tags"
    ADD CONSTRAINT "tamper_tags_pkey" PRIMARY KEY ("tag_id");



ALTER TABLE ONLY "public"."tariffs"
    ADD CONSTRAINT "tariffs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."townships_2026_02_18_18_00"
    ADD CONSTRAINT "townships_2026_02_18_18_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tracking_events_2026_02_28_20_06"
    ADD CONSTRAINT "tracking_events_2026_02_28_20_06_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tracking_events"
    ADD CONSTRAINT "tracking_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions_2026_02_19_13_00"
    ADD CONSTRAINT "transactions_2026_02_19_13_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions_2026_02_19_13_00"
    ADD CONSTRAINT "transactions_2026_02_19_13_00_transaction_number_key" UNIQUE ("transaction_number");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trusted_merchants"
    ADD CONSTRAINT "trusted_merchants_pkey" PRIMARY KEY ("merchant_id");



ALTER TABLE ONLY "public"."user_activity_2026_02_11_14_10"
    ADD CONSTRAINT "user_activity_2026_02_11_14_10_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_authorities"
    ADD CONSTRAINT "user_authorities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_authorities"
    ADD CONSTRAINT "user_authorities_user_id_permission_key_key" UNIQUE ("user_id", "permission_key");



ALTER TABLE ONLY "public"."user_branch_assignments"
    ADD CONSTRAINT "user_branch_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_credentials"
    ADD CONSTRAINT "user_credentials_pkey" PRIMARY KEY ("profile_id");



ALTER TABLE ONLY "public"."user_permission_grants"
    ADD CONSTRAINT "user_permission_grants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_scopes"
    ADD CONSTRAINT "user_scopes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_sessions_2026_02_11_14_10"
    ADD CONSTRAINT "user_sessions_2026_02_11_14_10_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_sessions_2026_02_11_14_10"
    ADD CONSTRAINT "user_sessions_2026_02_11_14_10_session_token_key" UNIQUE ("session_token");



ALTER TABLE ONLY "public"."user_sessions_2026_02_28_20_06"
    ADD CONSTRAINT "user_sessions_2026_02_28_20_06_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_sessions_2026_02_28_20_06"
    ADD CONSTRAINT "user_sessions_2026_02_28_20_06_session_token_key" UNIQUE ("session_token");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_session_token_key" UNIQUE ("session_token");



ALTER TABLE ONLY "public"."users_2026_02_11_14_10"
    ADD CONSTRAINT "users_2026_02_11_14_10_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users_2026_02_11_14_10"
    ADD CONSTRAINT "users_2026_02_11_14_10_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users_2026_02_11_14_10"
    ADD CONSTRAINT "users_2026_02_11_14_10_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."users_2026_02_17_18_40"
    ADD CONSTRAINT "users_2026_02_17_18_40_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users_2026_02_17_18_40"
    ADD CONSTRAINT "users_2026_02_17_18_40_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users_2026_02_17_18_40"
    ADD CONSTRAINT "users_2026_02_17_18_40_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."users_2026_02_28_20_06"
    ADD CONSTRAINT "users_2026_02_28_20_06_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users_2026_02_28_20_06"
    ADD CONSTRAINT "users_2026_02_28_20_06_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_locations"
    ADD CONSTRAINT "vehicle_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_tracking_2026_02_19_13_00"
    ADD CONSTRAINT "vehicle_tracking_2026_02_19_13_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicles_2026_02_18_17_00"
    ADD CONSTRAINT "vehicles_2026_02_18_17_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicles_2026_02_18_17_00"
    ADD CONSTRAINT "vehicles_2026_02_18_17_00_plate_number_key" UNIQUE ("plate_number");



ALTER TABLE ONLY "public"."vehicles_2026_02_18_17_00"
    ADD CONSTRAINT "vehicles_2026_02_18_17_00_vehicle_code_key" UNIQUE ("vehicle_code");



ALTER TABLE ONLY "public"."vehicles_2026_02_19_13_00"
    ADD CONSTRAINT "vehicles_2026_02_19_13_00_license_plate_key" UNIQUE ("license_plate");



ALTER TABLE ONLY "public"."vehicles_2026_02_19_13_00"
    ADD CONSTRAINT "vehicles_2026_02_19_13_00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicles_2026_02_19_13_00"
    ADD CONSTRAINT "vehicles_2026_02_19_13_00_vehicle_number_key" UNIQUE ("vehicle_number");



ALTER TABLE ONLY "public"."vehicles_2026_02_28_20_06"
    ADD CONSTRAINT "vehicles_2026_02_28_20_06_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicles_2026_02_28_20_06"
    ADD CONSTRAINT "vehicles_2026_02_28_20_06_vehicle_number_key" UNIQUE ("vehicle_number");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_registration_number_key" UNIQUE ("registration_number");



ALTER TABLE ONLY "public"."wallet_transactions"
    ADD CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."warehouse_inventory"
    ADD CONSTRAINT "warehouse_inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."warehouse_scans"
    ADD CONSTRAINT "warehouse_scans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."warehouse_tasks"
    ADD CONSTRAINT "warehouse_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."warehouses_2026_02_28_20_06"
    ADD CONSTRAINT "warehouses_2026_02_28_20_06_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."warehouses_2026_02_28_20_06"
    ADD CONSTRAINT "warehouses_2026_02_28_20_06_warehouse_code_key" UNIQUE ("warehouse_code");



ALTER TABLE ONLY "public"."warehouses"
    ADD CONSTRAINT "warehouses_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."warehouses"
    ADD CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."way_plan_stops"
    ADD CONSTRAINT "way_plan_stops_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."way_plans"
    ADD CONSTRAINT "way_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."way_records"
    ADD CONSTRAINT "way_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."way_records"
    ADD CONSTRAINT "way_records_way_id_key" UNIQUE ("way_id");



ALTER TABLE ONLY "public"."waybill_counters"
    ADD CONSTRAINT "waybill_counters_pkey" PRIMARY KEY ("issue_date", "origin_code", "office_tag", "branch_code");



ALTER TABLE ONLY "public"."waybill_print_items"
    ADD CONSTRAINT "waybill_print_items_pkey" PRIMARY KEY ("job_id", "shipment_id");



ALTER TABLE ONLY "public"."waybill_print_jobs"
    ADD CONSTRAINT "waybill_print_jobs_pkey" PRIMARY KEY ("id");



CREATE INDEX "courier_locations_updated_idx" ON "public"."courier_locations" USING "btree" ("updated_at" DESC);



CREATE INDEX "customers_full_name_idx" ON "public"."customers" USING "btree" ("full_name");



CREATE INDEX "customers_status_idx" ON "public"."customers" USING "btree" ("status");



CREATE INDEX "idx_activity_action" ON "public"."user_activity_2026_02_11_14_10" USING "btree" ("action");



CREATE INDEX "idx_activity_created" ON "public"."user_activity_2026_02_11_14_10" USING "btree" ("created_at");



CREATE INDEX "idx_activity_user" ON "public"."user_activity_2026_02_11_14_10" USING "btree" ("user_id");



CREATE INDEX "idx_approval_history_action" ON "public"."approval_history" USING "btree" ("action");



CREATE INDEX "idx_approval_history_created_at" ON "public"."approval_history" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_approval_history_entity" ON "public"."approval_history" USING "btree" ("entity_type", "entity_id", "created_at" DESC);



CREATE INDEX "idx_approval_workflows_status" ON "public"."approval_workflows_2026_02_28_20_06" USING "btree" ("status");



CREATE INDEX "idx_approval_workflows_type" ON "public"."approval_workflows_2026_02_28_20_06" USING "btree" ("workflow_type");



CREATE INDEX "idx_assignment_queue_branch_id" ON "public"."assignment_queue_2026_02_19_17_00" USING "btree" ("branch_id");



CREATE INDEX "idx_assignment_queue_queue_type" ON "public"."assignment_queue_2026_02_19_17_00" USING "btree" ("queue_type");



CREATE INDEX "idx_assignment_queue_status" ON "public"."assignment_queue_2026_02_19_17_00" USING "btree" ("status");



CREATE INDEX "idx_attendance_date" ON "public"."attendance" USING "btree" ("date" DESC);



CREATE INDEX "idx_attendance_employee" ON "public"."attendance" USING "btree" ("employee_id");



CREATE INDEX "idx_authority_permissions_group" ON "public"."authority_permissions" USING "btree" ("permission_group");



CREATE INDEX "idx_branches_code" ON "public"."branches" USING "btree" ("code");



CREATE INDEX "idx_broadcast_messages_channel" ON "public"."broadcast_messages" USING "btree" ("channel");



CREATE INDEX "idx_broadcast_messages_schedule_at" ON "public"."broadcast_messages" USING "btree" ("schedule_at");



CREATE INDEX "idx_broadcast_messages_status" ON "public"."broadcast_messages" USING "btree" ("status");



CREATE INDEX "idx_calculations_user" ON "public"."shipping_calculations_2026_02_18_18_00" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_cash_vouchers_status" ON "public"."cash_vouchers" USING "btree" ("status");



CREATE INDEX "idx_cash_vouchers_voucher_date" ON "public"."cash_vouchers" USING "btree" ("voucher_date");



CREATE INDEX "idx_cash_vouchers_voucher_no" ON "public"."cash_vouchers" USING "btree" ("voucher_no");



CREATE INDEX "idx_claims_number" ON "public"."claims_2026_02_28_20_06" USING "btree" ("claim_number");



CREATE INDEX "idx_claims_shipment" ON "public"."claims_2026_02_28_20_06" USING "btree" ("shipment_id");



CREATE INDEX "idx_claims_status" ON "public"."claims_2026_02_28_20_06" USING "btree" ("status");



CREATE INDEX "idx_cod_collections_collected_at" ON "public"."cod_collections" USING "btree" ("collected_at" DESC);



CREATE INDEX "idx_cod_collections_collected_by" ON "public"."cod_collections_2026_02_28_20_06" USING "btree" ("collected_by");



CREATE INDEX "idx_cod_collections_driver" ON "public"."cod_collections" USING "btree" ("driver_id");



CREATE INDEX "idx_cod_collections_shipment" ON "public"."cod_collections_2026_02_28_20_06" USING "btree" ("shipment_id");



CREATE INDEX "idx_cod_collections_status" ON "public"."cod_collections" USING "btree" ("status");



CREATE INDEX "idx_complaint_messages_complaint" ON "public"."complaint_messages" USING "btree" ("complaint_id");



CREATE INDEX "idx_complaint_messages_sender" ON "public"."complaint_messages" USING "btree" ("sender_id");



CREATE INDEX "idx_complaints_assigned_to" ON "public"."complaints" USING "btree" ("assigned_to");



CREATE INDEX "idx_complaints_customer" ON "public"."complaints" USING "btree" ("customer_id");



CREATE INDEX "idx_complaints_shipment" ON "public"."complaints" USING "btree" ("shipment_id");



CREATE INDEX "idx_complaints_status" ON "public"."complaints" USING "btree" ("status");



CREATE INDEX "idx_customers_code" ON "public"."customers_2026_02_28_20_06" USING "btree" ("customer_code");



CREATE INDEX "idx_customers_phone" ON "public"."customers_2026_02_28_20_06" USING "btree" ("phone");



CREATE INDEX "idx_data_entry_status" ON "public"."data_entry_automation_2026_02_18_18_00" USING "btree" ("status", "created_at");



CREATE INDEX "idx_deliveries_driver" ON "public"."deliveries" USING "btree" ("driver_id");



CREATE INDEX "idx_deliveries_manifest" ON "public"."deliveries" USING "btree" ("manifest_id");



CREATE INDEX "idx_deliveries_shipment" ON "public"."deliveries" USING "btree" ("shipment_id");



CREATE INDEX "idx_deliveries_status" ON "public"."deliveries" USING "btree" ("status");



CREATE INDEX "idx_delivery_history_delivery" ON "public"."delivery_history" USING "btree" ("delivery_id");



CREATE INDEX "idx_delivery_history_shipment" ON "public"."delivery_history" USING "btree" ("shipment_id");



CREATE INDEX "idx_delivery_personnel_status" ON "public"."delivery_personnel_2026_02_18_17_00" USING "btree" ("current_status");



CREATE INDEX "idx_deliverymen_branch_id" ON "public"."deliverymen" USING "btree" ("branch_id");



CREATE INDEX "idx_deliverymen_staff_code" ON "public"."deliverymen" USING "btree" ("staff_code");



CREATE INDEX "idx_deliverymen_status" ON "public"."deliverymen" USING "btree" ("status");



CREATE INDEX "idx_domestic_rates_weight" ON "public"."domestic_shipping_rates_2026_02_18_18_00" USING "btree" ("weight_from_kg", "weight_to_kg");



CREATE INDEX "idx_geofences_location" ON "public"."geofences_2026_02_18_18_00" USING "btree" ("center_lat", "center_lng");



CREATE INDEX "idx_gps_tracking_device_time" ON "public"."gps_tracking_2026_02_18_18_00" USING "btree" ("device_id", "recorded_at" DESC);



CREATE INDEX "idx_gps_tracking_location" ON "public"."gps_tracking_2026_02_18_18_00" USING "btree" ("latitude", "longitude");



CREATE INDEX "idx_gps_tracking_route" ON "public"."gps_tracking_2026_02_18_18_00" USING "btree" ("route_id", "recorded_at" DESC);



CREATE INDEX "idx_international_rates_destination" ON "public"."international_shipping_rates_2026_02_18_18_00" USING "btree" ("destination_id");



CREATE INDEX "idx_international_rates_weight" ON "public"."international_shipping_rates_2026_02_18_18_00" USING "btree" ("weight_from_kg", "weight_to_kg");



CREATE INDEX "idx_inventory_shipment" ON "public"."inventory_2026_02_28_20_06" USING "btree" ("shipment_id");



CREATE INDEX "idx_inventory_warehouse" ON "public"."inventory_2026_02_28_20_06" USING "btree" ("warehouse_id");



CREATE INDEX "idx_invoices_date" ON "public"."invoices_2026_02_28_20_06" USING "btree" ("invoice_date");



CREATE INDEX "idx_invoices_due_date" ON "public"."invoices" USING "btree" ("due_date");



CREATE INDEX "idx_invoices_merchant" ON "public"."invoices_2026_02_28_20_06" USING "btree" ("merchant_id");



CREATE INDEX "idx_invoices_number" ON "public"."invoices_2026_02_28_20_06" USING "btree" ("invoice_number");



CREATE INDEX "idx_invoices_status" ON "public"."invoices_2026_02_28_20_06" USING "btree" ("status");



CREATE INDEX "idx_journal_vouchers_status" ON "public"."journal_vouchers" USING "btree" ("status");



CREATE INDEX "idx_journal_vouchers_voucher_date" ON "public"."journal_vouchers" USING "btree" ("voucher_date");



CREATE INDEX "idx_journal_vouchers_voucher_no" ON "public"."journal_vouchers" USING "btree" ("voucher_no");



CREATE INDEX "idx_leave_requests_employee" ON "public"."leave_requests" USING "btree" ("employee_id");



CREATE INDEX "idx_leave_requests_status" ON "public"."leave_requests" USING "btree" ("status");



CREATE INDEX "idx_manifest_items_manifest" ON "public"."manifest_items" USING "btree" ("manifest_id");



CREATE INDEX "idx_manifest_items_shipment" ON "public"."manifest_items" USING "btree" ("shipment_id");



CREATE INDEX "idx_manifests_driver" ON "public"."manifests" USING "btree" ("driver_id");



CREATE INDEX "idx_manifests_scheduled_date" ON "public"."manifests" USING "btree" ("scheduled_date");



CREATE INDEX "idx_manifests_status" ON "public"."manifests" USING "btree" ("status");



CREATE INDEX "idx_manifests_warehouse" ON "public"."manifests" USING "btree" ("warehouse_id");



CREATE INDEX "idx_merchants_merchant_code" ON "public"."merchants" USING "btree" ("merchant_code");



CREATE INDEX "idx_merchants_merchant_name" ON "public"."merchants" USING "btree" ("merchant_name");



CREATE INDEX "idx_merchants_status" ON "public"."merchants" USING "btree" ("status");



CREATE INDEX "idx_parcels_created_at" ON "public"."parcels_2026_02_18_17_00" USING "btree" ("created_at");



CREATE INDEX "idx_parcels_delivery_zone" ON "public"."parcels_2026_02_18_17_00" USING "btree" ("delivery_zone");



CREATE INDEX "idx_parcels_pickup_zone" ON "public"."parcels_2026_02_18_17_00" USING "btree" ("pickup_zone");



CREATE INDEX "idx_parcels_status" ON "public"."parcels_2026_02_18_17_00" USING "btree" ("status");



CREATE INDEX "idx_payments_invoice" ON "public"."payments_2026_02_28_20_06" USING "btree" ("invoice_id");



CREATE INDEX "idx_payments_number" ON "public"."payments_2026_02_28_20_06" USING "btree" ("payment_number");



CREATE INDEX "idx_profiles_deleted_at" ON "public"."profiles" USING "btree" ("deleted_at");



CREATE INDEX "idx_profiles_email" ON "public"."profiles_2026_02_19_13_00" USING "btree" ("email");



CREATE INDEX "idx_profiles_is_approved" ON "public"."profiles" USING "btree" ("is_approved");



CREATE INDEX "idx_profiles_is_blocked" ON "public"."profiles" USING "btree" ("is_blocked");



CREATE INDEX "idx_profiles_role" ON "public"."profiles_2026_02_19_13_00" USING "btree" ("role");



CREATE INDEX "idx_profiles_user_id" ON "public"."profiles_2026_02_19_13_00" USING "btree" ("user_id");



CREATE INDEX "idx_qr_codes_code" ON "public"."qr_codes" USING "btree" ("code");



CREATE INDEX "idx_qr_codes_data" ON "public"."qr_codes_2026_02_18_17_00" USING "btree" ("qr_data");



CREATE INDEX "idx_qr_codes_entity" ON "public"."qr_codes" USING "btree" ("entity_id", "entity_type");



CREATE INDEX "idx_qr_codes_generated_by" ON "public"."qr_codes_2026_02_18_17_00" USING "btree" ("generated_by");



CREATE INDEX "idx_qr_codes_shipment" ON "public"."qr_codes_2026_02_18_17_00" USING "btree" ("shipment_id");



CREATE INDEX "idx_qr_scan_logs_qr_code" ON "public"."qr_scan_logs_2026_02_18_17_00" USING "btree" ("qr_code_id");



CREATE INDEX "idx_qr_scan_logs_scanned_by" ON "public"."qr_scan_logs_2026_02_18_17_00" USING "btree" ("scanned_by");



CREATE INDEX "idx_realtime_events_type" ON "public"."realtime_events_2026_02_18_18_00" USING "btree" ("event_type", "created_at" DESC);



CREATE INDEX "idx_realtime_notifications_read_at" ON "public"."realtime_notifications_2026_02_19_17_00" USING "btree" ("read_at");



CREATE INDEX "idx_realtime_notifications_user_id" ON "public"."realtime_notifications_2026_02_19_17_00" USING "btree" ("user_id");



CREATE INDEX "idx_regions_code" ON "public"."regions_2026_02_28_20_06" USING "btree" ("code");



CREATE INDEX "idx_role_authorities_role" ON "public"."role_authorities" USING "btree" ("role");



CREATE INDEX "idx_role_default_permissions_role" ON "public"."role_default_permissions" USING "btree" ("role");



CREATE INDEX "idx_role_permissions_role" ON "public"."role_permissions" USING "btree" ("role");



CREATE INDEX "idx_route_plans_date_zone" ON "public"."route_plans_2026_02_18_17_00" USING "btree" ("route_date", "zone");



CREATE INDEX "idx_shipment_tracking_shipment_id" ON "public"."shipment_tracking" USING "btree" ("shipment_id");



CREATE INDEX "idx_shipment_workflow_states_current_state" ON "public"."shipment_workflow_states_2026_02_19_17_00" USING "btree" ("current_state");



CREATE INDEX "idx_shipment_workflow_states_shipment_id" ON "public"."shipment_workflow_states_2026_02_19_17_00" USING "btree" ("shipment_id");



CREATE INDEX "idx_shipments_awb" ON "public"."shipments_2026_02_11_14_10" USING "btree" ("awb_number");



CREATE INDEX "idx_shipments_branch" ON "public"."shipments_2026_02_28_20_06" USING "btree" ("current_branch_id");



CREATE INDEX "idx_shipments_created" ON "public"."shipments_2026_02_11_14_10" USING "btree" ("created_at");



CREATE INDEX "idx_shipments_created_at" ON "public"."shipments" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_shipments_customer" ON "public"."shipments_2026_02_11_14_10" USING "btree" ("customer_id");



CREATE INDEX "idx_shipments_merchant" ON "public"."shipments_2026_02_11_14_10" USING "btree" ("merchant_id");



CREATE INDEX "idx_shipments_merchant_id" ON "public"."shipments" USING "btree" ("merchant_id");



CREATE INDEX "idx_shipments_receiver_phone" ON "public"."shipments" USING "btree" ("receiver_phone");



CREATE INDEX "idx_shipments_rider" ON "public"."shipments_2026_02_28_20_06" USING "btree" ("assigned_rider_id");



CREATE INDEX "idx_shipments_status" ON "public"."shipments_2026_02_11_14_10" USING "btree" ("status");



CREATE INDEX "idx_shipments_tracking" ON "public"."shipments_2026_02_28_20_06" USING "btree" ("tracking_number");



CREATE INDEX "idx_shipments_way_id" ON "public"."shipments" USING "btree" ("way_id");



CREATE INDEX "idx_signatures_parcel" ON "public"."electronic_signatures_2026_02_18_18_00" USING "btree" ("parcel_id");



CREATE INDEX "idx_signatures_rider" ON "public"."electronic_signatures_2026_02_18_18_00" USING "btree" ("delivery_rider_id");



CREATE INDEX "idx_tasks_assigned_to" ON "public"."tasks" USING "btree" ("assigned_to");



CREATE INDEX "idx_tasks_due_date" ON "public"."tasks" USING "btree" ("due_date");



CREATE INDEX "idx_tasks_priority" ON "public"."tasks" USING "btree" ("priority");



CREATE INDEX "idx_tasks_status" ON "public"."tasks" USING "btree" ("status");



CREATE INDEX "idx_townships_state_division" ON "public"."townships_2026_02_18_18_00" USING "btree" ("state_division_id");



CREATE INDEX "idx_tracking_created_at" ON "public"."tracking_events_2026_02_28_20_06" USING "btree" ("created_at");



CREATE INDEX "idx_tracking_shipment" ON "public"."shipment_tracking_2026_02_19_13_00" USING "btree" ("shipment_id");



CREATE INDEX "idx_tracking_timestamp" ON "public"."shipment_tracking_2026_02_19_13_00" USING "btree" ("timestamp");



CREATE INDEX "idx_transactions_created" ON "public"."transactions_2026_02_19_13_00" USING "btree" ("created_at");



CREATE INDEX "idx_transactions_merchant" ON "public"."financial_transactions_2026_02_11_14_10" USING "btree" ("merchant_id");



CREATE INDEX "idx_transactions_reference" ON "public"."transactions_2026_02_19_13_00" USING "btree" ("reference_type", "reference_id");



CREATE INDEX "idx_transactions_status" ON "public"."financial_transactions_2026_02_11_14_10" USING "btree" ("payment_status");



CREATE INDEX "idx_transactions_type" ON "public"."financial_transactions_2026_02_11_14_10" USING "btree" ("transaction_type");



CREATE INDEX "idx_user_authorities_user_id" ON "public"."user_authorities" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_branch" ON "public"."user_profiles" USING "btree" ("branch_id");



CREATE INDEX "idx_user_profiles_email" ON "public"."user_profiles" USING "btree" ("email");



CREATE INDEX "idx_user_profiles_role" ON "public"."user_profiles" USING "btree" ("role");



CREATE INDEX "idx_users_active" ON "public"."users_2026_02_11_14_10" USING "btree" ("is_active");



CREATE INDEX "idx_users_app_role" ON "public"."users_2026_02_28_20_06" USING "btree" ("app_role");



CREATE INDEX "idx_users_branch" ON "public"."users_2026_02_28_20_06" USING "btree" ("branch_id");



CREATE INDEX "idx_users_email" ON "public"."users_2026_02_11_14_10" USING "btree" ("email");



CREATE INDEX "idx_users_region" ON "public"."users_2026_02_28_20_06" USING "btree" ("region_id");



CREATE INDEX "idx_users_role" ON "public"."users_2026_02_11_14_10" USING "btree" ("role");



CREATE INDEX "idx_users_username" ON "public"."users_2026_02_11_14_10" USING "btree" ("username");



CREATE INDEX "idx_vehicle_tracking_timestamp" ON "public"."vehicle_tracking_2026_02_19_13_00" USING "btree" ("timestamp");



CREATE INDEX "idx_vehicle_tracking_vehicle" ON "public"."vehicle_tracking_2026_02_19_13_00" USING "btree" ("vehicle_id");



CREATE INDEX "idx_vehicles_branch" ON "public"."vehicles_2026_02_28_20_06" USING "btree" ("branch_id");



CREATE INDEX "idx_vehicles_number" ON "public"."vehicles_2026_02_28_20_06" USING "btree" ("vehicle_number");



CREATE INDEX "idx_vehicles_status" ON "public"."vehicles_2026_02_18_17_00" USING "btree" ("status");



CREATE INDEX "idx_warehouses_branch" ON "public"."warehouses_2026_02_28_20_06" USING "btree" ("branch_id");



CREATE INDEX "idx_warehouses_code" ON "public"."warehouses_2026_02_28_20_06" USING "btree" ("warehouse_code");



CREATE INDEX "idx_way_records_merchant" ON "public"."way_records" USING "btree" ("merchant_id");



CREATE INDEX "idx_way_records_status" ON "public"."way_records" USING "btree" ("status");



CREATE INDEX "idx_way_records_type" ON "public"."way_records" USING "btree" ("way_type");



CREATE INDEX "merchants_name_idx" ON "public"."merchants" USING "btree" ("name");



CREATE INDEX "merchants_status_idx" ON "public"."merchants" USING "btree" ("status");



CREATE INDEX "shipment_approvals_shipment_id_idx" ON "public"."shipment_approvals" USING "btree" ("shipment_id");



CREATE INDEX "shipment_approvals_status_idx" ON "public"."shipment_approvals" USING "btree" ("status");



CREATE UNIQUE INDEX "shipments_way_id_uq" ON "public"."shipments" USING "btree" ("way_id");



CREATE OR REPLACE TRIGGER "secure_ledger_integrity" BEFORE INSERT OR UPDATE ON "public"."finance_ledger" FOR EACH ROW EXECUTE FUNCTION "public"."generate_transaction_hash"();



CREATE OR REPLACE TRIGGER "tr_audit_active_sessions" AFTER INSERT OR DELETE OR UPDATE ON "public"."active_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_addresses" AFTER INSERT OR DELETE OR UPDATE ON "public"."addresses" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_admin_users" AFTER INSERT OR DELETE OR UPDATE ON "public"."admin_users" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_air_cargo_specifications_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."air_cargo_specifications_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_approval_history" AFTER INSERT OR DELETE OR UPDATE ON "public"."approval_history" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_approval_requests" AFTER INSERT OR DELETE OR UPDATE ON "public"."approval_requests" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_approval_workflows_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."approval_workflows_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_approvals" AFTER INSERT OR DELETE OR UPDATE ON "public"."approvals" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_assignment_queue_2026_02_19_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."assignment_queue_2026_02_19_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_audit_trigger_exclusions" AFTER INSERT OR DELETE OR UPDATE ON "public"."audit_trigger_exclusions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_authority_permissions" AFTER INSERT OR DELETE OR UPDATE ON "public"."authority_permissions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_auto_approve_policies" AFTER INSERT OR DELETE OR UPDATE ON "public"."auto_approve_policies" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_bags" AFTER INSERT OR DELETE OR UPDATE ON "public"."bags" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_branch_daily_metrics" AFTER INSERT OR DELETE OR UPDATE ON "public"."branch_daily_metrics" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_branch_regions" AFTER INSERT OR DELETE OR UPDATE ON "public"."branch_regions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_broadcast_messages" AFTER INSERT OR DELETE OR UPDATE ON "public"."broadcast_messages" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_cash_vouchers" AFTER INSERT OR DELETE OR UPDATE ON "public"."cash_vouchers" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_chain_of_custody_logs" AFTER INSERT OR DELETE OR UPDATE ON "public"."chain_of_custody_logs" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_claims_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."claims_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_cod_collections_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."cod_collections_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_commissions_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."commissions_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_coverage_zones" AFTER INSERT OR DELETE OR UPDATE ON "public"."coverage_zones" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_customer_kyc" AFTER INSERT OR DELETE OR UPDATE ON "public"."customer_kyc" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_customer_segments_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."customer_segments_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_customers" AFTER INSERT OR DELETE OR UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_customers_2026_02_18_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."customers_2026_02_18_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_customers_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."customers_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_customers_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."customers_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_data_entry_automation_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."data_entry_automation_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_deliveries_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."deliveries_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_delivery_personnel_2026_02_18_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."delivery_personnel_2026_02_18_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_delivery_records_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."delivery_records_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_delivery_records_2026_02_17_18_40" AFTER INSERT OR DELETE OR UPDATE ON "public"."delivery_records_2026_02_17_18_40" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_delivery_status_history" AFTER INSERT OR DELETE OR UPDATE ON "public"."delivery_status_history" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_deliverymen" AFTER INSERT OR DELETE OR UPDATE ON "public"."deliverymen" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_demo_login_credentials_2026_02_19_14_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."demo_login_credentials_2026_02_19_14_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_active_sessions" AFTER INSERT OR DELETE OR UPDATE ON "public"."active_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_addresses" AFTER INSERT OR DELETE OR UPDATE ON "public"."addresses" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_admin_users" AFTER INSERT OR DELETE OR UPDATE ON "public"."admin_users" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_air_cargo_specifications_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."air_cargo_specifications_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_approval_history" AFTER INSERT OR DELETE OR UPDATE ON "public"."approval_history" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_approval_requests" AFTER INSERT OR DELETE OR UPDATE ON "public"."approval_requests" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_approval_workflows_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."approval_workflows_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_approvals" AFTER INSERT OR DELETE OR UPDATE ON "public"."approvals" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_assignment_queue_2026_02_19_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."assignment_queue_2026_02_19_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_authority_permissions" AFTER INSERT OR DELETE OR UPDATE ON "public"."authority_permissions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_auto_approve_policies" AFTER INSERT OR DELETE OR UPDATE ON "public"."auto_approve_policies" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_bags" AFTER INSERT OR DELETE OR UPDATE ON "public"."bags" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_branch_daily_metrics" AFTER INSERT OR DELETE OR UPDATE ON "public"."branch_daily_metrics" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_branch_regions" AFTER INSERT OR DELETE OR UPDATE ON "public"."branch_regions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_broadcast_messages" AFTER INSERT OR DELETE OR UPDATE ON "public"."broadcast_messages" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_cash_vouchers" AFTER INSERT OR DELETE OR UPDATE ON "public"."cash_vouchers" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_chain_of_custody_logs" AFTER INSERT OR DELETE OR UPDATE ON "public"."chain_of_custody_logs" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_claims_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."claims_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_cod_collections_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."cod_collections_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_commissions_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."commissions_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_coverage_zones" AFTER INSERT OR DELETE OR UPDATE ON "public"."coverage_zones" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_customer_kyc" AFTER INSERT OR DELETE OR UPDATE ON "public"."customer_kyc" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_customer_segments_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."customer_segments_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_customers" AFTER INSERT OR DELETE OR UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_customers_2026_02_18_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."customers_2026_02_18_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_customers_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."customers_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_customers_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."customers_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_data_entry_automation_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."data_entry_automation_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_deliveries_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."deliveries_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_delivery_personnel_2026_02_18_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."delivery_personnel_2026_02_18_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_delivery_records_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."delivery_records_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_delivery_records_2026_02_17_18_40" AFTER INSERT OR DELETE OR UPDATE ON "public"."delivery_records_2026_02_17_18_40" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_delivery_status_history" AFTER INSERT OR DELETE OR UPDATE ON "public"."delivery_status_history" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_deliverymen" AFTER INSERT OR DELETE OR UPDATE ON "public"."deliverymen" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_demo_login_credentials_2026_02_19_14_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."demo_login_credentials_2026_02_19_14_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_domestic_rates_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."domestic_rates_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_domestic_shipping_rates_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."domestic_shipping_rates_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_domestic_tariffs" AFTER INSERT OR DELETE OR UPDATE ON "public"."domestic_tariffs" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_electronic_signatures_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."electronic_signatures_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_electronic_signatures_2026_02_19_15_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."electronic_signatures_2026_02_19_15_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_employees" AFTER INSERT OR DELETE OR UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_feature_flags" AFTER INSERT OR DELETE OR UPDATE ON "public"."feature_flags" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_finance_deposits" AFTER INSERT OR DELETE OR UPDATE ON "public"."finance_deposits" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_finance_ledger" AFTER INSERT OR DELETE OR UPDATE ON "public"."finance_ledger" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_financial_transactions" AFTER INSERT OR DELETE OR UPDATE ON "public"."financial_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_financial_transactions_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."financial_transactions_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_fleet_assets" AFTER INSERT OR DELETE OR UPDATE ON "public"."fleet_assets" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_fleet_telemetry" AFTER INSERT OR DELETE OR UPDATE ON "public"."fleet_telemetry" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_fuel_logs" AFTER INSERT OR DELETE OR UPDATE ON "public"."fuel_logs" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_geofences_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."geofences_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_geofences_2026_02_19_15_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."geofences_2026_02_19_15_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_gps_tracking_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."gps_tracking_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_gps_tracking_advanced_2026_02_19_15_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."gps_tracking_advanced_2026_02_19_15_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_international_destinations_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."international_destinations_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_international_rates_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."international_rates_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_international_shipping_rates_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."international_shipping_rates_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_intl_tariffs" AFTER INSERT OR DELETE OR UPDATE ON "public"."intl_tariffs" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_inventory_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."inventory_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_inventory_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."inventory_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_inventory_movements_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."inventory_movements_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_invoice_items_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."invoice_items_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_invoices_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."invoices_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_journal_vouchers" AFTER INSERT OR DELETE OR UPDATE ON "public"."journal_vouchers" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_kpi_data_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."kpi_data_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_marketing_campaigns_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."marketing_campaigns_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_marketing_logs" AFTER INSERT OR DELETE OR UPDATE ON "public"."marketing_logs" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_master_audit_logs" AFTER INSERT OR DELETE OR UPDATE ON "public"."master_audit_logs" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_merchant_accounts" AFTER INSERT OR DELETE OR UPDATE ON "public"."merchant_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_merchants" AFTER INSERT OR DELETE OR UPDATE ON "public"."merchants" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_merchants_2026_02_18_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."merchants_2026_02_18_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_migration_history" AFTER INSERT OR DELETE OR UPDATE ON "public"."migration_history" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_myanmar_locations_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."myanmar_locations_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_myanmar_states_divisions_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."myanmar_states_divisions_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_notifications_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."notifications_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_operator_branch_memberships" AFTER INSERT OR DELETE OR UPDATE ON "public"."operator_branch_memberships" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_operators" AFTER INSERT OR DELETE OR UPDATE ON "public"."operators" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_parcels_2026_02_18_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."parcels_2026_02_18_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_payments_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."payments_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_permission_overrides" AFTER INSERT OR DELETE OR UPDATE ON "public"."permission_overrides" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_permissions" AFTER INSERT OR DELETE OR UPDATE ON "public"."permissions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_pickup_records_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."pickup_records_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_profiles" AFTER INSERT OR DELETE OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_profiles_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."profiles_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_qr_codes_2026_02_18_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."qr_codes_2026_02_18_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_qr_codes_advanced_2026_02_19_15_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."qr_codes_advanced_2026_02_19_15_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_qr_scan_logs_2026_02_18_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."qr_scan_logs_2026_02_18_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_rbac_roles" AFTER INSERT OR DELETE OR UPDATE ON "public"."rbac_roles" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_realtime_events_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."realtime_events_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_realtime_events_2026_02_19_15_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."realtime_events_2026_02_19_15_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_realtime_notifications_2026_02_19_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."realtime_notifications_2026_02_19_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_receipts" AFTER INSERT OR DELETE OR UPDATE ON "public"."receipts" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_regions_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."regions_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_reports_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."reports_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_rider_compliance" AFTER INSERT OR DELETE OR UPDATE ON "public"."rider_compliance" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_role_authorities" AFTER INSERT OR DELETE OR UPDATE ON "public"."role_authorities" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_role_default_permissions" AFTER INSERT OR DELETE OR UPDATE ON "public"."role_default_permissions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_role_permissions_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."role_permissions_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_roles" AFTER INSERT OR DELETE OR UPDATE ON "public"."roles" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_route_optimizations_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."route_optimizations_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_route_optimizations_2026_02_19_15_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."route_optimizations_2026_02_19_15_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_route_plans_2026_02_18_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."route_plans_2026_02_18_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_routes_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."routes_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_routes_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."routes_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_rpt_branches" AFTER INSERT OR DELETE OR UPDATE ON "public"."rpt_branches" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_security_events" AFTER INSERT OR DELETE OR UPDATE ON "public"."security_events" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_security_events_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."security_events_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_seed_users_import" AFTER INSERT OR DELETE OR UPDATE ON "public"."seed_users_import" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_shipment_approvals" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipment_approvals" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_shipment_assignment_rules_2026_02_19_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipment_assignment_rules_2026_02_19_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_shipment_events" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipment_events" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_shipment_locations" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipment_locations" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_shipment_signatures" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipment_signatures" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_shipment_status_history_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipment_status_history_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_shipment_status_history_2026_02_17_18_40" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipment_status_history_2026_02_17_18_40" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_shipment_steps" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipment_steps" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_shipment_tracking" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipment_tracking" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_shipment_tracking_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipment_tracking_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_shipment_workflow_states_2026_02_19_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipment_workflow_states_2026_02_19_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_shipments_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipments_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_shipments_2026_02_17_18_40" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipments_2026_02_17_18_40" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_shipments_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipments_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_shipments_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipments_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_shipping_calculations_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipping_calculations_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_staff_directory" AFTER INSERT OR DELETE OR UPDATE ON "public"."staff_directory" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_support_ticket_messages_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."support_ticket_messages_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_support_tickets" AFTER INSERT OR DELETE OR UPDATE ON "public"."support_tickets" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_support_tickets_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."support_tickets_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_system_settings_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."system_settings_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_tamper_tags" AFTER INSERT OR DELETE OR UPDATE ON "public"."tamper_tags" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_tamper_tags_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."tamper_tags_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_tamper_tags_2026_02_17_18_40" AFTER INSERT OR DELETE OR UPDATE ON "public"."tamper_tags_2026_02_17_18_40" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_tariffs" AFTER INSERT OR DELETE OR UPDATE ON "public"."tariffs" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_townships_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."townships_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_tracking_events" AFTER INSERT OR DELETE OR UPDATE ON "public"."tracking_events" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_tracking_events_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."tracking_events_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_transactions" AFTER INSERT OR DELETE OR UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_transactions_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."transactions_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_trusted_merchants" AFTER INSERT OR DELETE OR UPDATE ON "public"."trusted_merchants" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_user_activity_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_activity_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_user_authorities" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_authorities" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_user_branch_assignments" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_branch_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_user_credentials" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_credentials" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_user_permission_grants" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_permission_grants" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_user_permissions" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_permissions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_user_roles" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_user_scopes" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_scopes" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_user_sessions" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_user_sessions_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_sessions_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_user_sessions_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_sessions_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_users" AFTER INSERT OR DELETE OR UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_users_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."users_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_users_2026_02_17_18_40" AFTER INSERT OR DELETE OR UPDATE ON "public"."users_2026_02_17_18_40" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_users_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."users_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_vehicle_locations" AFTER INSERT OR DELETE OR UPDATE ON "public"."vehicle_locations" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_vehicle_tracking_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."vehicle_tracking_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_vehicles_2026_02_18_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."vehicles_2026_02_18_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_vehicles_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."vehicles_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_vehicles_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."vehicles_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_wallet_transactions" AFTER INSERT OR DELETE OR UPDATE ON "public"."wallet_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_warehouse_inventory" AFTER INSERT OR DELETE OR UPDATE ON "public"."warehouse_inventory" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_warehouse_scans" AFTER INSERT OR DELETE OR UPDATE ON "public"."warehouse_scans" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_warehouse_tasks" AFTER INSERT OR DELETE OR UPDATE ON "public"."warehouse_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_warehouses_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."warehouses_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_way_plan_stops" AFTER INSERT OR DELETE OR UPDATE ON "public"."way_plan_stops" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_way_plans" AFTER INSERT OR DELETE OR UPDATE ON "public"."way_plans" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_dml_way_records" AFTER INSERT OR DELETE OR UPDATE ON "public"."way_records" FOR EACH ROW EXECUTE FUNCTION "public"."audit_dml_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_domestic_rates_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."domestic_rates_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_domestic_shipping_rates_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."domestic_shipping_rates_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_domestic_tariffs" AFTER INSERT OR DELETE OR UPDATE ON "public"."domestic_tariffs" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_electronic_signatures_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."electronic_signatures_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_electronic_signatures_2026_02_19_15_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."electronic_signatures_2026_02_19_15_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_feature_flags" AFTER INSERT OR DELETE OR UPDATE ON "public"."feature_flags" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_finance_deposits" AFTER INSERT OR DELETE OR UPDATE ON "public"."finance_deposits" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_finance_ledger" AFTER INSERT OR DELETE OR UPDATE ON "public"."finance_ledger" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_financial_transactions_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."financial_transactions_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_fleet_assets" AFTER INSERT OR DELETE OR UPDATE ON "public"."fleet_assets" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_fleet_telemetry" AFTER INSERT OR DELETE OR UPDATE ON "public"."fleet_telemetry" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_fuel_logs" AFTER INSERT OR DELETE OR UPDATE ON "public"."fuel_logs" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_geofences_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."geofences_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_geofences_2026_02_19_15_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."geofences_2026_02_19_15_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_gps_tracking_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."gps_tracking_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_gps_tracking_advanced_2026_02_19_15_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."gps_tracking_advanced_2026_02_19_15_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_international_destinations_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."international_destinations_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_international_rates_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."international_rates_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_international_shipping_rates_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."international_shipping_rates_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_intl_tariffs" AFTER INSERT OR DELETE OR UPDATE ON "public"."intl_tariffs" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_inventory_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."inventory_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_inventory_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."inventory_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_inventory_movements_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."inventory_movements_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_invoice_items_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."invoice_items_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_invoices_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."invoices_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_journal_vouchers" AFTER INSERT OR DELETE OR UPDATE ON "public"."journal_vouchers" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_kpi_data_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."kpi_data_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_marketing_campaigns_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."marketing_campaigns_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_marketing_logs" AFTER INSERT OR DELETE OR UPDATE ON "public"."marketing_logs" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_master_audit_logs" AFTER INSERT OR DELETE OR UPDATE ON "public"."master_audit_logs" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_merchant_accounts" AFTER INSERT OR DELETE OR UPDATE ON "public"."merchant_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_merchants" AFTER INSERT OR DELETE OR UPDATE ON "public"."merchants" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_merchants_2026_02_18_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."merchants_2026_02_18_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_migration_history" AFTER INSERT OR DELETE OR UPDATE ON "public"."migration_history" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_myanmar_locations_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."myanmar_locations_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_myanmar_states_divisions_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."myanmar_states_divisions_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_notifications_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."notifications_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_operator_branch_memberships" AFTER INSERT OR DELETE OR UPDATE ON "public"."operator_branch_memberships" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_operators" AFTER INSERT OR DELETE OR UPDATE ON "public"."operators" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_parcels_2026_02_18_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."parcels_2026_02_18_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_payments_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."payments_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_permission_overrides" AFTER INSERT OR DELETE OR UPDATE ON "public"."permission_overrides" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_permissions" AFTER INSERT OR DELETE OR UPDATE ON "public"."permissions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_pickup_records_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."pickup_records_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_profiles" AFTER INSERT OR DELETE OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_profiles_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."profiles_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_qr_codes_2026_02_18_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."qr_codes_2026_02_18_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_qr_codes_advanced_2026_02_19_15_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."qr_codes_advanced_2026_02_19_15_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_qr_scan_logs_2026_02_18_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."qr_scan_logs_2026_02_18_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_rbac_roles" AFTER INSERT OR DELETE OR UPDATE ON "public"."rbac_roles" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_realtime_events_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."realtime_events_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_realtime_events_2026_02_19_15_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."realtime_events_2026_02_19_15_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_realtime_notifications_2026_02_19_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."realtime_notifications_2026_02_19_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_receipts" AFTER INSERT OR DELETE OR UPDATE ON "public"."receipts" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_regions_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."regions_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_reports_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."reports_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_rider_compliance" AFTER INSERT OR DELETE OR UPDATE ON "public"."rider_compliance" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_role_authorities" AFTER INSERT OR DELETE OR UPDATE ON "public"."role_authorities" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_role_default_permissions" AFTER INSERT OR DELETE OR UPDATE ON "public"."role_default_permissions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_role_permissions_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."role_permissions_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_roles" AFTER INSERT OR DELETE OR UPDATE ON "public"."roles" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_route_optimizations_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."route_optimizations_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_route_optimizations_2026_02_19_15_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."route_optimizations_2026_02_19_15_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_route_plans_2026_02_18_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."route_plans_2026_02_18_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_routes_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."routes_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_routes_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."routes_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_rpt_branches" AFTER INSERT OR DELETE OR UPDATE ON "public"."rpt_branches" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_security_events" AFTER INSERT OR DELETE OR UPDATE ON "public"."security_events" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_security_events_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."security_events_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_seed_users_import" AFTER INSERT OR DELETE OR UPDATE ON "public"."seed_users_import" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_shipment_approvals" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipment_approvals" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_shipment_assignment_rules_2026_02_19_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipment_assignment_rules_2026_02_19_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_shipment_events" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipment_events" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_shipment_locations" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipment_locations" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_shipment_signatures" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipment_signatures" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_shipment_status_history_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipment_status_history_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_shipment_status_history_2026_02_17_18_40" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipment_status_history_2026_02_17_18_40" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_shipment_steps" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipment_steps" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_shipment_tracking_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipment_tracking_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_shipment_workflow_states_2026_02_19_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipment_workflow_states_2026_02_19_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_shipments_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipments_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_shipments_2026_02_17_18_40" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipments_2026_02_17_18_40" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_shipments_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipments_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_shipments_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipments_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_shipping_calculations_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."shipping_calculations_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_staff_directory" AFTER INSERT OR DELETE OR UPDATE ON "public"."staff_directory" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_support_ticket_messages_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."support_ticket_messages_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_support_tickets" AFTER INSERT OR DELETE OR UPDATE ON "public"."support_tickets" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_support_tickets_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."support_tickets_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_system_settings_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."system_settings_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_tamper_tags" AFTER INSERT OR DELETE OR UPDATE ON "public"."tamper_tags" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_tamper_tags_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."tamper_tags_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_tamper_tags_2026_02_17_18_40" AFTER INSERT OR DELETE OR UPDATE ON "public"."tamper_tags_2026_02_17_18_40" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_tariffs" AFTER INSERT OR DELETE OR UPDATE ON "public"."tariffs" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_townships_2026_02_18_18_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."townships_2026_02_18_18_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_tracking_events" AFTER INSERT OR DELETE OR UPDATE ON "public"."tracking_events" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_tracking_events_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."tracking_events_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_transactions" AFTER INSERT OR DELETE OR UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_transactions_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."transactions_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_trusted_merchants" AFTER INSERT OR DELETE OR UPDATE ON "public"."trusted_merchants" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_user_activity_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_activity_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_user_authorities" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_authorities" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_user_branch_assignments" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_branch_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_user_credentials" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_credentials" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_user_permission_grants" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_permission_grants" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_user_permissions" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_permissions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_user_roles" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_user_scopes" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_scopes" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_user_sessions" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_user_sessions_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_sessions_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_user_sessions_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_sessions_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_users" AFTER INSERT OR DELETE OR UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_users_2026_02_11_14_10" AFTER INSERT OR DELETE OR UPDATE ON "public"."users_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_users_2026_02_17_18_40" AFTER INSERT OR DELETE OR UPDATE ON "public"."users_2026_02_17_18_40" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_users_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."users_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_vehicle_locations" AFTER INSERT OR DELETE OR UPDATE ON "public"."vehicle_locations" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_vehicle_tracking_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."vehicle_tracking_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_vehicles_2026_02_18_17_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."vehicles_2026_02_18_17_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_vehicles_2026_02_19_13_00" AFTER INSERT OR DELETE OR UPDATE ON "public"."vehicles_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_vehicles_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."vehicles_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_wallet_transactions" AFTER INSERT OR DELETE OR UPDATE ON "public"."wallet_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_warehouse_inventory" AFTER INSERT OR DELETE OR UPDATE ON "public"."warehouse_inventory" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_warehouse_scans" AFTER INSERT OR DELETE OR UPDATE ON "public"."warehouse_scans" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_warehouse_tasks" AFTER INSERT OR DELETE OR UPDATE ON "public"."warehouse_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_warehouses_2026_02_28_20_06" AFTER INSERT OR DELETE OR UPDATE ON "public"."warehouses_2026_02_28_20_06" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_way_plan_stops" AFTER INSERT OR DELETE OR UPDATE ON "public"."way_plan_stops" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_way_plans" AFTER INSERT OR DELETE OR UPDATE ON "public"."way_plans" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "tr_audit_way_records" AFTER INSERT OR DELETE OR UPDATE ON "public"."way_records" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_trigger"();



CREATE OR REPLACE TRIGGER "trg_auto_approve_on_insert" AFTER INSERT ON "public"."shipments" FOR EACH ROW EXECUTE FUNCTION "public"."auto_approve_on_insert"();



CREATE OR REPLACE TRIGGER "trg_broadcast_messages_set_updated_at" BEFORE UPDATE ON "public"."broadcast_messages" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_cash_vouchers_set_updated_at" BEFORE UPDATE ON "public"."cash_vouchers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_courier_locations_touch" BEFORE UPDATE ON "public"."courier_locations" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_deliverymen_set_updated_at" BEFORE UPDATE ON "public"."deliverymen" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_financial_lock" BEFORE UPDATE ON "public"."financial_transactions_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."lock_financial_after_approval"();



CREATE OR REPLACE TRIGGER "trg_financial_sod" BEFORE UPDATE ON "public"."financial_transactions_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_financial_self_approval"();



CREATE OR REPLACE TRIGGER "trg_generate_user_id" BEFORE INSERT ON "public"."operators" FOR EACH ROW EXECUTE FUNCTION "public"."generate_smart_user_id"();



CREATE OR REPLACE TRIGGER "trg_journal_vouchers_set_updated_at" BEFORE UPDATE ON "public"."journal_vouchers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_merchants_set_updated_at" BEFORE UPDATE ON "public"."merchants" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_no_self_role_change" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_self_role_change"();



CREATE OR REPLACE TRIGGER "trg_role_authorities_updated_at" BEFORE UPDATE ON "public"."role_authorities" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_role_default_permissions_updated_at" BEFORE UPDATE ON "public"."role_default_permissions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_seed_tracking" AFTER INSERT ON "public"."shipments" FOR EACH ROW EXECUTE FUNCTION "public"."seed_tracking_on_create"();



CREATE OR REPLACE TRIGGER "trg_user_authorities_updated_at" BEFORE UPDATE ON "public"."user_authorities" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_auto_assign_new_shipment" AFTER INSERT ON "public"."shipments_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_auto_assign_shipment_2026_02_19_17_00"();



CREATE OR REPLACE TRIGGER "trigger_sync_branches" BEFORE INSERT OR UPDATE ON "public"."operator_branch_memberships" FOR EACH ROW EXECUTE FUNCTION "public"."sync_branch_columns"();



CREATE OR REPLACE TRIGGER "update_attendance_updated_at" BEFORE UPDATE ON "public"."attendance" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_campaigns_updated_at" BEFORE UPDATE ON "public"."marketing_campaigns_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_cod_collections_updated_at" BEFORE UPDATE ON "public"."cod_collections" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_complaints_updated_at" BEFORE UPDATE ON "public"."complaints" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_customers_updated_at" BEFORE UPDATE ON "public"."customers_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_deliveries_updated_at" BEFORE UPDATE ON "public"."deliveries" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_deliveries_updated_at" BEFORE UPDATE ON "public"."deliveries_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_inventory_updated_at" BEFORE UPDATE ON "public"."inventory_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_invoices_updated_at" BEFORE UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_leave_requests_updated_at" BEFORE UPDATE ON "public"."leave_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_manifests_updated_at" BEFORE UPDATE ON "public"."manifests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_qr_codes_updated_at" BEFORE UPDATE ON "public"."qr_codes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_routes_updated_at" BEFORE UPDATE ON "public"."routes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_routes_updated_at" BEFORE UPDATE ON "public"."routes_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_settings_updated_at" BEFORE UPDATE ON "public"."system_settings_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_shipments_updated_at" BEFORE UPDATE ON "public"."shipments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_shipments_updated_at" BEFORE UPDATE ON "public"."shipments_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_shipments_updated_at" BEFORE UPDATE ON "public"."shipments_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tasks_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tickets_updated_at" BEFORE UPDATE ON "public"."support_tickets_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_transactions_updated_at" BEFORE UPDATE ON "public"."transactions_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users_2026_02_11_14_10" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_vehicles_updated_at" BEFORE UPDATE ON "public"."vehicles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_vehicles_updated_at" BEFORE UPDATE ON "public"."vehicles_2026_02_19_13_00" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_warehouses_updated_at" BEFORE UPDATE ON "public"."warehouses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."active_sessions"
    ADD CONSTRAINT "active_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."approval_requests"
    ADD CONSTRAINT "approval_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."approval_workflows_2026_02_28_20_06"
    ADD CONSTRAINT "approval_workflows_2026_02_28_20_06_assigned_approver_fkey" FOREIGN KEY ("assigned_approver") REFERENCES "public"."users_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."approval_workflows_2026_02_28_20_06"
    ADD CONSTRAINT "approval_workflows_2026_02_28_20_06_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."users_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."chain_of_custody_logs"
    ADD CONSTRAINT "chain_of_custody_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."claims_2026_02_28_20_06"
    ADD CONSTRAINT "claims_2026_02_28_20_06_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."claims_2026_02_28_20_06"
    ADD CONSTRAINT "claims_2026_02_28_20_06_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."claims_2026_02_28_20_06"
    ADD CONSTRAINT "claims_2026_02_28_20_06_investigated_by_fkey" FOREIGN KEY ("investigated_by") REFERENCES "public"."users_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."claims_2026_02_28_20_06"
    ADD CONSTRAINT "claims_2026_02_28_20_06_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."cod_collections_2026_02_28_20_06"
    ADD CONSTRAINT "cod_collections_2026_02_28_20_06_collected_by_fkey" FOREIGN KEY ("collected_by") REFERENCES "public"."users_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."cod_collections_2026_02_28_20_06"
    ADD CONSTRAINT "cod_collections_2026_02_28_20_06_remitted_by_fkey" FOREIGN KEY ("remitted_by") REFERENCES "public"."users_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."cod_collections_2026_02_28_20_06"
    ADD CONSTRAINT "cod_collections_2026_02_28_20_06_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."cod_collections"
    ADD CONSTRAINT "cod_collections_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id");



ALTER TABLE ONLY "public"."cod_collections"
    ADD CONSTRAINT "cod_collections_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id");



ALTER TABLE ONLY "public"."commissions_2026_02_11_14_10"
    ADD CONSTRAINT "commissions_2026_02_11_14_10_calculated_by_fkey" FOREIGN KEY ("calculated_by") REFERENCES "public"."users_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."commissions_2026_02_11_14_10"
    ADD CONSTRAINT "commissions_2026_02_11_14_10_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."complaint_messages"
    ADD CONSTRAINT "complaint_messages_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "public"."complaints"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."courier_locations"
    ADD CONSTRAINT "courier_locations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_kyc"
    ADD CONSTRAINT "customer_kyc_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_segments_2026_02_11_14_10"
    ADD CONSTRAINT "customer_segments_2026_02_11_14_10_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."deliveries_2026_02_19_13_00"
    ADD CONSTRAINT "deliveries_2026_02_19_13_00_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "public"."routes_2026_02_19_13_00"("id");



ALTER TABLE ONLY "public"."deliveries_2026_02_19_13_00"
    ADD CONSTRAINT "deliveries_2026_02_19_13_00_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments_2026_02_19_13_00"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_manifest_id_fkey" FOREIGN KEY ("manifest_id") REFERENCES "public"."manifests"("id");



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id");



ALTER TABLE ONLY "public"."delivery_history"
    ADD CONSTRAINT "delivery_history_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."delivery_history"
    ADD CONSTRAINT "delivery_history_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id");



ALTER TABLE ONLY "public"."delivery_personnel_2026_02_18_17_00"
    ADD CONSTRAINT "delivery_personnel_2026_02_18_17_00_current_route_id_fkey" FOREIGN KEY ("current_route_id") REFERENCES "public"."route_plans_2026_02_18_17_00"("id");



ALTER TABLE ONLY "public"."delivery_records_2026_02_11_14_10"
    ADD CONSTRAINT "delivery_records_2026_02_11_14_10_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "public"."users_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."delivery_records_2026_02_11_14_10"
    ADD CONSTRAINT "delivery_records_2026_02_11_14_10_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."delivery_records_2026_02_17_18_40"
    ADD CONSTRAINT "delivery_records_2026_02_17_18_40_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "public"."users_2026_02_17_18_40"("id");



ALTER TABLE ONLY "public"."delivery_records_2026_02_17_18_40"
    ADD CONSTRAINT "delivery_records_2026_02_17_18_40_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments_2026_02_17_18_40"("id");



ALTER TABLE ONLY "public"."domestic_tariffs"
    ADD CONSTRAINT "domestic_tariffs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."finance_deposits"
    ADD CONSTRAINT "finance_deposits_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id");



ALTER TABLE ONLY "public"."financial_transactions_2026_02_11_14_10"
    ADD CONSTRAINT "financial_transactions_2026_02_11_14_10_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."users_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."financial_transactions_2026_02_11_14_10"
    ADD CONSTRAINT "financial_transactions_2026_02_11_14_10_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."users_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."financial_transactions_2026_02_11_14_10"
    ADD CONSTRAINT "financial_transactions_2026_02_11_14_10_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."users_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."financial_transactions_2026_02_11_14_10"
    ADD CONSTRAINT "financial_transactions_2026_02_11_14_10_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."regions_2026_02_28_20_06"
    ADD CONSTRAINT "fk_regions_manager" FOREIGN KEY ("manager_id") REFERENCES "public"."users_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."users_2026_02_28_20_06"
    ADD CONSTRAINT "fk_users_region" FOREIGN KEY ("region_id") REFERENCES "public"."regions_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."fleet_assets"
    ADD CONSTRAINT "fleet_assets_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."fleet_telemetry"
    ADD CONSTRAINT "fleet_telemetry_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."fuel_logs"
    ADD CONSTRAINT "fuel_logs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."fleet_assets"("id");



ALTER TABLE ONLY "public"."gps_tracking_2026_02_18_18_00"
    ADD CONSTRAINT "gps_tracking_2026_02_18_18_00_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "public"."route_plans_2026_02_18_17_00"("id");



ALTER TABLE ONLY "public"."international_shipping_rates_2026_02_18_18_00"
    ADD CONSTRAINT "international_shipping_rates_2026_02_18_18__destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "public"."international_destinations_2026_02_18_18_00"("id");



ALTER TABLE ONLY "public"."inventory_2026_02_28_20_06"
    ADD CONSTRAINT "inventory_2026_02_28_20_06_retrieved_by_fkey" FOREIGN KEY ("retrieved_by") REFERENCES "public"."users_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."inventory_2026_02_28_20_06"
    ADD CONSTRAINT "inventory_2026_02_28_20_06_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."inventory_2026_02_28_20_06"
    ADD CONSTRAINT "inventory_2026_02_28_20_06_stored_by_fkey" FOREIGN KEY ("stored_by") REFERENCES "public"."users_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."inventory_2026_02_28_20_06"
    ADD CONSTRAINT "inventory_2026_02_28_20_06_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."inventory_movements_2026_02_19_13_00"
    ADD CONSTRAINT "inventory_movements_2026_02_19_13_00_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory_2026_02_19_13_00"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_movements_2026_02_19_13_00"
    ADD CONSTRAINT "inventory_movements_2026_02_19_13_00_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."profiles_2026_02_19_13_00"("id");



ALTER TABLE ONLY "public"."invoice_items_2026_02_28_20_06"
    ADD CONSTRAINT "invoice_items_2026_02_28_20_06_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices_2026_02_28_20_06"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_items_2026_02_28_20_06"
    ADD CONSTRAINT "invoice_items_2026_02_28_20_06_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."invoices_2026_02_28_20_06"
    ADD CONSTRAINT "invoices_2026_02_28_20_06_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."invoices_2026_02_28_20_06"
    ADD CONSTRAINT "invoices_2026_02_28_20_06_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."manifest_items"
    ADD CONSTRAINT "manifest_items_manifest_id_fkey" FOREIGN KEY ("manifest_id") REFERENCES "public"."manifests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manifest_items"
    ADD CONSTRAINT "manifest_items_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id");



ALTER TABLE ONLY "public"."manifests"
    ADD CONSTRAINT "manifests_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id");



ALTER TABLE ONLY "public"."manifests"
    ADD CONSTRAINT "manifests_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id");



ALTER TABLE ONLY "public"."marketing_campaigns_2026_02_11_14_10"
    ADD CONSTRAINT "marketing_campaigns_2026_02_11_14_10_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."master_audit_logs"
    ADD CONSTRAINT "master_audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."notifications_2026_02_19_13_00"
    ADD CONSTRAINT "notifications_2026_02_19_13_00_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles_2026_02_19_13_00"("id");



ALTER TABLE ONLY "public"."operator_branch_memberships"
    ADD CONSTRAINT "operator_branch_memberships_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."operators"
    ADD CONSTRAINT "operators_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parcels_2026_02_18_17_00"
    ADD CONSTRAINT "parcels_2026_02_18_17_00_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers_2026_02_18_17_00"("id");



ALTER TABLE ONLY "public"."parcels_2026_02_18_17_00"
    ADD CONSTRAINT "parcels_2026_02_18_17_00_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants_2026_02_18_17_00"("id");



ALTER TABLE ONLY "public"."payments_2026_02_28_20_06"
    ADD CONSTRAINT "payments_2026_02_28_20_06_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."payments_2026_02_28_20_06"
    ADD CONSTRAINT "payments_2026_02_28_20_06_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."users_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."permission_overrides"
    ADD CONSTRAINT "permission_overrides_role_code_fkey" FOREIGN KEY ("role_code") REFERENCES "public"."rbac_roles"("role_code");



ALTER TABLE ONLY "public"."permission_overrides"
    ADD CONSTRAINT "permission_overrides_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pickup_records_2026_02_11_14_10"
    ADD CONSTRAINT "pickup_records_2026_02_11_14_10_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "public"."users_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."pickup_records_2026_02_11_14_10"
    ADD CONSTRAINT "pickup_records_2026_02_11_14_10_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."profiles_2026_02_19_13_00"
    ADD CONSTRAINT "profiles_2026_02_19_13_00_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_rbac_code_fkey" FOREIGN KEY ("rbac_code") REFERENCES "public"."rbac_roles"("role_code");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_role_code_fkey" FOREIGN KEY ("role_code") REFERENCES "public"."rbac_roles"("role_code");



ALTER TABLE ONLY "public"."qr_scan_logs_2026_02_18_17_00"
    ADD CONSTRAINT "qr_scan_logs_2026_02_18_17_00_qr_code_id_fkey" FOREIGN KEY ("qr_code_id") REFERENCES "public"."qr_codes_2026_02_18_17_00"("id");



ALTER TABLE ONLY "public"."realtime_events_2026_02_18_18_00"
    ADD CONSTRAINT "realtime_events_2026_02_18_18_00_geofence_id_fkey" FOREIGN KEY ("geofence_id") REFERENCES "public"."geofences_2026_02_18_18_00"("id");



ALTER TABLE ONLY "public"."reports_2026_02_11_14_10"
    ADD CONSTRAINT "reports_2026_02_11_14_10_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."rider_compliance"
    ADD CONSTRAINT "rider_compliance_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."route_optimizations_2026_02_18_18_00"
    ADD CONSTRAINT "route_optimizations_2026_02_18_18_00_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "public"."route_plans_2026_02_18_17_00"("id");



ALTER TABLE ONLY "public"."routes_2026_02_19_13_00"
    ADD CONSTRAINT "routes_2026_02_19_13_00_assigned_driver_id_fkey" FOREIGN KEY ("assigned_driver_id") REFERENCES "public"."profiles_2026_02_19_13_00"("id");



ALTER TABLE ONLY "public"."routes_2026_02_19_13_00"
    ADD CONSTRAINT "routes_2026_02_19_13_00_assigned_vehicle_id_fkey" FOREIGN KEY ("assigned_vehicle_id") REFERENCES "public"."vehicles_2026_02_19_13_00"("id");



ALTER TABLE ONLY "public"."routes"
    ADD CONSTRAINT "routes_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id");



ALTER TABLE ONLY "public"."security_events_2026_02_11_14_10"
    ADD CONSTRAINT "security_events_2026_02_11_14_10_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."users_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."security_events_2026_02_11_14_10"
    ADD CONSTRAINT "security_events_2026_02_11_14_10_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."shipment_approvals"
    ADD CONSTRAINT "shipment_approvals_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."shipment_approvals"
    ADD CONSTRAINT "shipment_approvals_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."shipment_status_history_2026_02_11_14_10"
    ADD CONSTRAINT "shipment_status_history_2026_02_11_14_10_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments_2026_02_11_14_10"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shipment_status_history_2026_02_11_14_10"
    ADD CONSTRAINT "shipment_status_history_2026_02_11_14_10_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."shipment_status_history_2026_02_17_18_40"
    ADD CONSTRAINT "shipment_status_history_2026_02_17_18_40_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments_2026_02_17_18_40"("id");



ALTER TABLE ONLY "public"."shipment_status_history_2026_02_17_18_40"
    ADD CONSTRAINT "shipment_status_history_2026_02_17_18_40_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users_2026_02_17_18_40"("id");



ALTER TABLE ONLY "public"."shipment_steps"
    ADD CONSTRAINT "shipment_steps_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."shipment_tracking_2026_02_19_13_00"
    ADD CONSTRAINT "shipment_tracking_2026_02_19_13_00_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments_2026_02_19_13_00"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shipment_tracking_2026_02_19_13_00"
    ADD CONSTRAINT "shipment_tracking_2026_02_19_13_00_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles_2026_02_19_13_00"("id");



ALTER TABLE ONLY "public"."shipment_tracking"
    ADD CONSTRAINT "shipment_tracking_handled_by_fkey" FOREIGN KEY ("handled_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shipments_2026_02_11_14_10"
    ADD CONSTRAINT "shipments_2026_02_11_14_10_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."shipments_2026_02_11_14_10"
    ADD CONSTRAINT "shipments_2026_02_11_14_10_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."users_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."shipments_2026_02_11_14_10"
    ADD CONSTRAINT "shipments_2026_02_11_14_10_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."users_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."shipments_2026_02_11_14_10"
    ADD CONSTRAINT "shipments_2026_02_11_14_10_tamper_tag_id_fkey" FOREIGN KEY ("tamper_tag_id") REFERENCES "public"."tamper_tags_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."shipments_2026_02_17_18_40"
    ADD CONSTRAINT "shipments_2026_02_17_18_40_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users_2026_02_17_18_40"("id");



ALTER TABLE ONLY "public"."shipments_2026_02_17_18_40"
    ADD CONSTRAINT "shipments_2026_02_17_18_40_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."users_2026_02_17_18_40"("id");



ALTER TABLE ONLY "public"."shipments_2026_02_17_18_40"
    ADD CONSTRAINT "shipments_2026_02_17_18_40_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."users_2026_02_17_18_40"("id");



ALTER TABLE ONLY "public"."shipments_2026_02_17_18_40"
    ADD CONSTRAINT "shipments_2026_02_17_18_40_tamper_tag_id_fkey" FOREIGN KEY ("tamper_tag_id") REFERENCES "public"."tamper_tags_2026_02_17_18_40"("id");



ALTER TABLE ONLY "public"."shipments_2026_02_19_13_00"
    ADD CONSTRAINT "shipments_2026_02_19_13_00_assigned_rider_id_fkey" FOREIGN KEY ("assigned_rider_id") REFERENCES "public"."profiles_2026_02_19_13_00"("id");



ALTER TABLE ONLY "public"."shipments_2026_02_19_13_00"
    ADD CONSTRAINT "shipments_2026_02_19_13_00_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers_2026_02_19_13_00"("id");



ALTER TABLE ONLY "public"."shipments_2026_02_28_20_06"
    ADD CONSTRAINT "shipments_2026_02_28_20_06_assigned_driver_id_fkey" FOREIGN KEY ("assigned_driver_id") REFERENCES "public"."users_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."shipments_2026_02_28_20_06"
    ADD CONSTRAINT "shipments_2026_02_28_20_06_assigned_rider_id_fkey" FOREIGN KEY ("assigned_rider_id") REFERENCES "public"."users_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."shipments_2026_02_28_20_06"
    ADD CONSTRAINT "shipments_2026_02_28_20_06_cod_collected_by_fkey" FOREIGN KEY ("cod_collected_by") REFERENCES "public"."users_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."shipments_2026_02_28_20_06"
    ADD CONSTRAINT "shipments_2026_02_28_20_06_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."shipments"
    ADD CONSTRAINT "shipments_destination_warehouse_id_fkey" FOREIGN KEY ("destination_warehouse_id") REFERENCES "public"."warehouses"("id");



ALTER TABLE ONLY "public"."shipments"
    ADD CONSTRAINT "shipments_origin_warehouse_id_fkey" FOREIGN KEY ("origin_warehouse_id") REFERENCES "public"."warehouses"("id");



ALTER TABLE ONLY "public"."support_ticket_messages_2026_02_11_14_10"
    ADD CONSTRAINT "support_ticket_messages_2026_02_11_14_10_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."support_ticket_messages_2026_02_11_14_10"
    ADD CONSTRAINT "support_ticket_messages_2026_02_11_14_10_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets_2026_02_11_14_10"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_tickets_2026_02_11_14_10"
    ADD CONSTRAINT "support_tickets_2026_02_11_14_10_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."support_tickets_2026_02_11_14_10"
    ADD CONSTRAINT "support_tickets_2026_02_11_14_10_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."users_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."support_tickets_2026_02_11_14_10"
    ADD CONSTRAINT "support_tickets_2026_02_11_14_10_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."system_settings_2026_02_11_14_10"
    ADD CONSTRAINT "system_settings_2026_02_11_14_10_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."tamper_tags_2026_02_11_14_10"
    ADD CONSTRAINT "tamper_tags_2026_02_11_14_10_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."tamper_tags_2026_02_17_18_40"
    ADD CONSTRAINT "tamper_tags_2026_02_17_18_40_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users_2026_02_17_18_40"("id");



ALTER TABLE ONLY "public"."tamper_tags"
    ADD CONSTRAINT "tamper_tags_issued_to_fkey" FOREIGN KEY ("issued_to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tariffs"
    ADD CONSTRAINT "tariffs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."townships_2026_02_18_18_00"
    ADD CONSTRAINT "townships_2026_02_18_18_00_state_division_id_fkey" FOREIGN KEY ("state_division_id") REFERENCES "public"."myanmar_states_divisions_2026_02_18_18_00"("id");



ALTER TABLE ONLY "public"."tracking_events_2026_02_28_20_06"
    ADD CONSTRAINT "tracking_events_2026_02_28_20_06_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."tracking_events_2026_02_28_20_06"
    ADD CONSTRAINT "tracking_events_2026_02_28_20_06_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments_2026_02_28_20_06"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions_2026_02_19_13_00"
    ADD CONSTRAINT "transactions_2026_02_19_13_00_collected_by_fkey" FOREIGN KEY ("collected_by") REFERENCES "public"."profiles_2026_02_19_13_00"("id");



ALTER TABLE ONLY "public"."transactions_2026_02_19_13_00"
    ADD CONSTRAINT "transactions_2026_02_19_13_00_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers_2026_02_19_13_00"("id");



ALTER TABLE ONLY "public"."user_activity_2026_02_11_14_10"
    ADD CONSTRAINT "user_activity_2026_02_11_14_10_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_2026_02_11_14_10"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_credentials"
    ADD CONSTRAINT "user_credentials_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_permission_grants"
    ADD CONSTRAINT "user_permission_grants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_scopes"
    ADD CONSTRAINT "user_scopes_merchant_account_id_fkey" FOREIGN KEY ("merchant_account_id") REFERENCES "public"."merchant_accounts"("id");



ALTER TABLE ONLY "public"."user_sessions_2026_02_11_14_10"
    ADD CONSTRAINT "user_sessions_2026_02_11_14_10_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_2026_02_11_14_10"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_sessions_2026_02_28_20_06"
    ADD CONSTRAINT "user_sessions_2026_02_28_20_06_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_2026_02_28_20_06"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users_2026_02_11_14_10"
    ADD CONSTRAINT "users_2026_02_11_14_10_blocked_by_fkey" FOREIGN KEY ("blocked_by") REFERENCES "public"."users_2026_02_11_14_10"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_tracking_2026_02_19_13_00"
    ADD CONSTRAINT "vehicle_tracking_2026_02_19_13_00_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."profiles_2026_02_19_13_00"("id");



ALTER TABLE ONLY "public"."vehicle_tracking_2026_02_19_13_00"
    ADD CONSTRAINT "vehicle_tracking_2026_02_19_13_00_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles_2026_02_19_13_00"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicles_2026_02_18_17_00"
    ADD CONSTRAINT "vehicles_2026_02_18_17_00_current_route_id_fkey" FOREIGN KEY ("current_route_id") REFERENCES "public"."route_plans_2026_02_18_17_00"("id");



ALTER TABLE ONLY "public"."vehicles_2026_02_19_13_00"
    ADD CONSTRAINT "vehicles_2026_02_19_13_00_current_driver_id_fkey" FOREIGN KEY ("current_driver_id") REFERENCES "public"."profiles_2026_02_19_13_00"("id");



ALTER TABLE ONLY "public"."vehicles_2026_02_28_20_06"
    ADD CONSTRAINT "vehicles_2026_02_28_20_06_assigned_driver_id_fkey" FOREIGN KEY ("assigned_driver_id") REFERENCES "public"."users_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id");



ALTER TABLE ONLY "public"."wallet_transactions"
    ADD CONSTRAINT "wallet_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."warehouse_inventory"
    ADD CONSTRAINT "warehouse_inventory_scanned_by_fkey" FOREIGN KEY ("scanned_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."warehouses_2026_02_28_20_06"
    ADD CONSTRAINT "warehouses_2026_02_28_20_06_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."users_2026_02_28_20_06"("id");



ALTER TABLE ONLY "public"."way_plan_stops"
    ADD CONSTRAINT "way_plan_stops_way_plan_id_fkey" FOREIGN KEY ("way_plan_id") REFERENCES "public"."way_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."waybill_print_items"
    ADD CONSTRAINT "waybill_print_items_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."waybill_print_jobs"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage intl tariffs" ON "public"."intl_tariffs" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role_code" = ANY (ARRAY['SYS'::"text", 'ADM'::"text"])))));



CREATE POLICY "Admins can manage tariffs" ON "public"."domestic_tariffs" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role_code" = ANY (ARRAY['SYS'::"text", 'ADM'::"text"])))));



CREATE POLICY "Admins can manage users" ON "public"."users_2026_02_28_20_06" USING ((EXISTS ( SELECT 1
   FROM "public"."users_2026_02_28_20_06" "users_2026_02_28_20_06_1"
  WHERE ((("users_2026_02_28_20_06_1"."id")::"text" = ("auth"."uid"())::"text") AND (("users_2026_02_28_20_06_1"."app_role")::"text" = ANY (ARRAY[('APP_OWNER'::character varying)::"text", ('SUPER_ADMIN'::character varying)::"text", ('HR_ADMIN'::character varying)::"text"]))))));



CREATE POLICY "Admins can view logs" ON "public"."audit_logs" FOR SELECT USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role_code" = ANY (ARRAY['SYS'::"text", 'ADM'::"text"])))));



CREATE POLICY "Admins manage branches" ON "public"."branches" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['super-admin'::"public"."employee_role", 'admin'::"public"."employee_role"]))))));



CREATE POLICY "Admins only access logs" ON "public"."audit_logs" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Allow SYS admins to delete profiles" ON "public"."profiles" FOR DELETE USING ((( SELECT "profiles_1"."role"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."id" = "auth"."uid"())) = 'SYS'::"public"."app_role"));



CREATE POLICY "Allow all operations" ON "public"."air_cargo_specifications_2026_02_18_18_00" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations" ON "public"."customers_2026_02_18_17_00" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations" ON "public"."data_entry_automation_2026_02_18_18_00" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations" ON "public"."delivery_personnel_2026_02_18_17_00" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations" ON "public"."domestic_shipping_rates_2026_02_18_18_00" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations" ON "public"."electronic_signatures_2026_02_18_18_00" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations" ON "public"."electronic_signatures_2026_02_19_15_00" USING (true);



CREATE POLICY "Allow all operations" ON "public"."geofences_2026_02_18_18_00" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations" ON "public"."geofences_2026_02_19_15_00" USING (true);



CREATE POLICY "Allow all operations" ON "public"."gps_tracking_2026_02_18_18_00" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations" ON "public"."gps_tracking_advanced_2026_02_19_15_00" USING (true);



CREATE POLICY "Allow all operations" ON "public"."international_destinations_2026_02_18_18_00" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations" ON "public"."international_shipping_rates_2026_02_18_18_00" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations" ON "public"."merchants_2026_02_18_17_00" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations" ON "public"."myanmar_states_divisions_2026_02_18_18_00" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations" ON "public"."parcels_2026_02_18_17_00" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations" ON "public"."qr_codes_advanced_2026_02_19_15_00" USING (true);



CREATE POLICY "Allow all operations" ON "public"."realtime_events_2026_02_18_18_00" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations" ON "public"."realtime_events_2026_02_19_15_00" USING (true);



CREATE POLICY "Allow all operations" ON "public"."route_optimizations_2026_02_18_18_00" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations" ON "public"."route_optimizations_2026_02_19_15_00" USING (true);



CREATE POLICY "Allow all operations" ON "public"."route_plans_2026_02_18_17_00" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations" ON "public"."shipping_calculations_2026_02_18_18_00" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations" ON "public"."townships_2026_02_18_18_00" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations" ON "public"."vehicles_2026_02_18_17_00" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated full access to bags" ON "public"."bags" TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated full access to staff_directory" ON "public"."staff_directory" TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated full access to warehouse_scans" ON "public"."warehouse_scans" TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated full access to way_plan_stops" ON "public"."way_plan_stops" TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated full access to way_plans" ON "public"."way_plans" TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated insert access" ON "public"."operator_branch_memberships" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated read access" ON "public"."operator_branch_memberships" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated update access" ON "public"."operator_branch_memberships" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to view delivery records" ON "public"."delivery_records_2026_02_17_18_40" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to view shipment history" ON "public"."shipment_status_history_2026_02_17_18_40" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to view shipments" ON "public"."shipments_2026_02_17_18_40" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to view tamper tags" ON "public"."tamper_tags_2026_02_17_18_40" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to view users" ON "public"."users_2026_02_17_18_40" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow public tracking reads" ON "public"."tracking_events" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Auth users view branches" ON "public"."branches" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Auth users view permissions" ON "public"."role_permissions" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view QR codes" ON "public"."qr_codes" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view routes" ON "public"."routes" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view vehicles" ON "public"."vehicles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view warehouses" ON "public"."warehouses" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Branch isolation" ON "public"."users" FOR SELECT USING ((("role" = 'APP_OWNER'::"text") OR ("branch_id" = ("current_setting"('request.jwt.claim.branch_id'::"text", true))::"uuid")));



CREATE POLICY "Claims access based on role" ON "public"."claims_2026_02_28_20_06" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users_2026_02_28_20_06" "u"
  WHERE ((("u"."id")::"text" = ("auth"."uid"())::"text") AND ((("u"."app_role")::"text" = ANY ((ARRAY['APP_OWNER'::character varying, 'SUPER_ADMIN'::character varying, 'CUSTOMER_SERVICE'::character varying])::"text"[])) OR ("claims_2026_02_28_20_06"."assigned_to" = "u"."id") OR ("claims_2026_02_28_20_06"."investigated_by" = "u"."id"))))));



CREATE POLICY "Customers can create complaints" ON "public"."complaints" FOR INSERT WITH CHECK (("customer_id" = "auth"."uid"()));



CREATE POLICY "Drivers can create COD collections" ON "public"."cod_collections" FOR INSERT WITH CHECK (("driver_id" = "auth"."uid"()));



CREATE POLICY "Employees can create attendance" ON "public"."attendance" FOR INSERT WITH CHECK (("employee_id" = "auth"."uid"()));



CREATE POLICY "Employees can create leave requests" ON "public"."leave_requests" FOR INSERT WITH CHECK (("employee_id" = "auth"."uid"()));



CREATE POLICY "Finance data access" ON "public"."invoices_2026_02_28_20_06" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users_2026_02_28_20_06" "u"
  WHERE ((("u"."id")::"text" = ("auth"."uid"())::"text") AND (("u"."app_role")::"text" = ANY ((ARRAY['APP_OWNER'::character varying, 'SUPER_ADMIN'::character varying, 'FINANCE_USER'::character varying, 'FINANCE_STAFF'::character varying])::"text"[]))))));



CREATE POLICY "Public access for demo" ON "public"."demo_login_credentials_2026_02_19_14_00" USING (true);



CREATE POLICY "Public email lookup by Smart ID" ON "public"."operators" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Public profiles are viewable" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Super Admin Full Access" ON "public"."master_audit_logs" USING ((("auth"."jwt"() ->> 'role'::"text") = 'SUPER_ADMIN'::"text"));



CREATE POLICY "SuperAdmin Only Tariffs" ON "public"."tariffs" USING ((( SELECT "profiles"."role_code"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'SYS'::"text"));



CREATE POLICY "System can insert delivery history" ON "public"."delivery_history" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can insert QR codes" ON "public"."qr_codes_2026_02_18_17_00" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can insert QR scan logs" ON "public"."qr_scan_logs_2026_02_18_17_00" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can insert own logs" ON "public"."audit_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own QR codes" ON "public"."qr_codes_2026_02_18_17_00" FOR UPDATE USING ((("generated_by" = ("auth"."uid"())::"text") OR ("auth"."role"() = 'authenticated'::"text")));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view QR scan logs" ON "public"."qr_scan_logs_2026_02_18_17_00" FOR SELECT USING (true);



CREATE POLICY "Users can view all QR codes" ON "public"."qr_codes_2026_02_18_17_00" FOR SELECT USING (true);



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own data" ON "public"."users_2026_02_28_20_06" FOR SELECT USING (((("auth"."uid"())::"text" = ("id")::"text") OR (("app_role")::"text" = ANY ((ARRAY['APP_OWNER'::character varying, 'SUPER_ADMIN'::character varying, 'HR_ADMIN'::character varying])::"text"[]))));



CREATE POLICY "Users update own profile" ON "public"."user_profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users view own profile" ON "public"."user_profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."active_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."addresses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."air_cargo_specifications_2026_02_18_18_00" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_owner_view_sessions" ON "public"."active_sessions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'APP_OWNER'::"public"."app_role")))));



ALTER TABLE "public"."approval_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "approval_history_insert_authenticated" ON "public"."approval_history" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "approval_history_select_authenticated" ON "public"."approval_history" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."approval_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."approval_workflows_2026_02_28_20_06" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."approvals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assignment_queue_2026_02_19_17_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attendance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_dml_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_insert_only" ON "public"."audit_logs" FOR UPDATE TO "authenticated" USING (false);



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_read_own" ON "public"."audit_logs" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."audit_trigger_exclusions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_access" ON "public"."customers_2026_02_19_13_00" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "authenticated_access" ON "public"."deliveries_2026_02_19_13_00" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "authenticated_access" ON "public"."inventory_2026_02_19_13_00" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "authenticated_access" ON "public"."inventory_movements_2026_02_19_13_00" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "authenticated_access" ON "public"."notifications_2026_02_19_13_00" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "authenticated_access" ON "public"."profiles_2026_02_19_13_00" TO "service_role" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "authenticated_access" ON "public"."routes_2026_02_19_13_00" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "authenticated_access" ON "public"."shipment_tracking_2026_02_19_13_00" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "authenticated_access" ON "public"."shipments_2026_02_19_13_00" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "authenticated_access" ON "public"."transactions_2026_02_19_13_00" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "authenticated_access" ON "public"."vehicle_tracking_2026_02_19_13_00" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "authenticated_access" ON "public"."vehicles_2026_02_19_13_00" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "authenticated_manage_role_default_permissions" ON "public"."role_default_permissions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_read_role_default_permissions" ON "public"."role_default_permissions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_view_approvals" ON "public"."approvals" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_view_requests" ON "public"."approval_requests" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."authority_permissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authority_permissions_select_authenticated" ON "public"."authority_permissions" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."auto_approve_policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."branch_daily_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."branch_regions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."branches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."broadcast_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "broadcast_messages_insert_authenticated" ON "public"."broadcast_messages" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "broadcast_messages_select_authenticated" ON "public"."broadcast_messages" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "broadcast_messages_update_authenticated" ON "public"."broadcast_messages" FOR UPDATE TO "authenticated" USING (true) WITH CHECK ((COALESCE("status", ''::"text") <> ALL (ARRAY['PENDING_APPROVAL'::"text", 'APPROVED'::"text", 'REJECTED'::"text"])));



ALTER TABLE "public"."cash_vouchers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cash_vouchers_insert_authenticated" ON "public"."cash_vouchers" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "cash_vouchers_select_authenticated" ON "public"."cash_vouchers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "cash_vouchers_update_authenticated" ON "public"."cash_vouchers" FOR UPDATE TO "authenticated" USING (true) WITH CHECK ((COALESCE("status", ''::"text") <> ALL (ARRAY['PENDING_APPROVAL'::"text", 'APPROVED'::"text", 'REJECTED'::"text"])));



ALTER TABLE "public"."chain_of_custody_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claims_2026_02_28_20_06" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cod_collections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cod_collections_2026_02_28_20_06" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cod_collections_rw_fin" ON "public"."cod_collections" TO "authenticated" USING (("public"."is_admin_role"() OR "public"."is_finance_role"())) WITH CHECK (("public"."is_admin_role"() OR "public"."is_finance_role"()));



ALTER TABLE "public"."commissions_2026_02_11_14_10" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."complaint_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."complaints" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courier_locations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "courier_locations_select" ON "public"."courier_locations" FOR SELECT TO "authenticated" USING (("public"."is_admin_role"() OR "public"."has_any_role"(ARRAY['SUPERVISOR'::"text", 'OPERATIONS_ADMIN'::"text", 'STAFF'::"text", 'WAREHOUSE_MANAGER'::"text", 'SUBSTATION_MANAGER'::"text", 'BRANCH_MANAGER'::"text", 'FINANCE_STAFF'::"text"]) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "courier_locations_update_self" ON "public"."courier_locations" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin_role"())) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin_role"()));



CREATE POLICY "courier_locations_upsert_self" ON "public"."courier_locations" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin_role"()));



ALTER TABLE "public"."coverage_zones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_kyc" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_segments_2026_02_11_14_10" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers_2026_02_18_17_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers_2026_02_19_13_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers_2026_02_28_20_06" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."data_entry_automation_2026_02_18_18_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deliveries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deliveries_2026_02_19_13_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."delivery_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."delivery_personnel_2026_02_18_17_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."delivery_records_2026_02_11_14_10" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."delivery_records_2026_02_17_18_40" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."delivery_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deliverymen" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "deliverymen_insert_authenticated" ON "public"."deliverymen" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "deliverymen_select_authenticated" ON "public"."deliverymen" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "deliverymen_update_authenticated" ON "public"."deliverymen" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."demo_login_credentials_2026_02_19_14_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."domestic_rates_2026_02_19_13_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."domestic_shipping_rates_2026_02_18_18_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."domestic_tariffs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."electronic_signatures_2026_02_18_18_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."electronic_signatures_2026_02_19_15_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feature_flags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."finance_deposits" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "finance_deposits_insert_branch_mgr" ON "public"."finance_deposits" FOR INSERT TO "authenticated" WITH CHECK (("public"."has_any_role"(ARRAY['branch-manager'::"text", 'substation-manager'::"text"]) AND (EXISTS ( SELECT 1
   FROM "public"."staff_assignments" "a"
  WHERE (("a"."user_id" = "auth"."uid"()) AND ("a"."is_active" = true) AND ("a"."location_type" = 'BRANCH'::"text") AND ("a"."location_id" = "finance_deposits"."branch_id"))))));



CREATE POLICY "finance_deposits_rw_fin" ON "public"."finance_deposits" TO "authenticated" USING (("public"."is_admin_role"() OR "public"."is_finance_role"())) WITH CHECK (("public"."is_admin_role"() OR "public"."is_finance_role"()));



ALTER TABLE "public"."finance_ledger" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."financial_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."financial_transactions_2026_02_11_14_10" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fleet_assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fleet_telemetry" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fuel_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."geofences_2026_02_18_18_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."geofences_2026_02_19_15_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gps_tracking_2026_02_18_18_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gps_tracking_advanced_2026_02_19_15_00" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "hard_approvals_update" ON "public"."approvals" FOR UPDATE TO "authenticated" USING ("public"."has_any_role"(ARRAY['APP_OWNER'::"text", 'SUPER_ADMIN'::"text", 'OPERATIONS_ADMIN'::"text", 'SUPERVISOR'::"text"])) WITH CHECK ("public"."has_any_role"(ARRAY['APP_OWNER'::"text", 'SUPER_ADMIN'::"text", 'OPERATIONS_ADMIN'::"text", 'SUPERVISOR'::"text"]));



CREATE POLICY "hard_audit_dml_select" ON "public"."audit_dml_logs" FOR SELECT TO "authenticated" USING ("public"."has_any_role"(ARRAY['APP_OWNER'::"text", 'SUPER_ADMIN'::"text", 'OPERATIONS_ADMIN'::"text", 'FINANCE_USER'::"text", 'FINANCE_STAFF'::"text", 'HR_ADMIN'::"text"]));



CREATE POLICY "hard_audit_select" ON "public"."audit_logs" FOR SELECT TO "authenticated" USING ("public"."has_any_role"(ARRAY['APP_OWNER'::"text", 'SUPER_ADMIN'::"text", 'OPERATIONS_ADMIN'::"text", 'FINANCE_USER'::"text", 'FINANCE_STAFF'::"text", 'HR_ADMIN'::"text"]));



CREATE POLICY "hard_employees_hr" ON "public"."employees" TO "authenticated" USING ("public"."has_any_role"(ARRAY['APP_OWNER'::"text", 'SUPER_ADMIN'::"text", 'HR_ADMIN'::"text"])) WITH CHECK ("public"."has_any_role"(ARRAY['APP_OWNER'::"text", 'SUPER_ADMIN'::"text", 'HR_ADMIN'::"text"]));



CREATE POLICY "hard_fin_tx_finance" ON "public"."financial_transactions" TO "authenticated" USING ("public"."has_any_role"(ARRAY['APP_OWNER'::"text", 'SUPER_ADMIN'::"text", 'FINANCE_USER'::"text", 'FINANCE_STAFF'::"text"])) WITH CHECK ("public"."has_any_role"(ARRAY['APP_OWNER'::"text", 'SUPER_ADMIN'::"text", 'FINANCE_USER'::"text", 'FINANCE_STAFF'::"text"]));



CREATE POLICY "hard_support_tickets_support" ON "public"."support_tickets" TO "authenticated" USING ("public"."has_any_role"(ARRAY['APP_OWNER'::"text", 'SUPER_ADMIN'::"text", 'CUSTOMER_SERVICE'::"text"])) WITH CHECK ("public"."has_any_role"(ARRAY['APP_OWNER'::"text", 'SUPER_ADMIN'::"text", 'CUSTOMER_SERVICE'::"text"]));



ALTER TABLE "public"."international_destinations_2026_02_18_18_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."international_rates_2026_02_19_13_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."international_shipping_rates_2026_02_18_18_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."intl_tariffs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_2026_02_19_13_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_2026_02_28_20_06" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_movements_2026_02_19_13_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice_items_2026_02_28_20_06" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices_2026_02_28_20_06" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."journal_vouchers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "journal_vouchers_insert_authenticated" ON "public"."journal_vouchers" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "journal_vouchers_select_authenticated" ON "public"."journal_vouchers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "journal_vouchers_update_authenticated" ON "public"."journal_vouchers" FOR UPDATE TO "authenticated" USING (true) WITH CHECK ((COALESCE("status", ''::"text") <> ALL (ARRAY['PENDING_APPROVAL'::"text", 'APPROVED'::"text", 'REJECTED'::"text"])));



ALTER TABLE "public"."kpi_data_2026_02_11_14_10" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "kyc_insert_own" ON "public"."customer_kyc" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "kyc_read_own" ON "public"."customer_kyc" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "kyc_update_own" ON "public"."customer_kyc" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."leave_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."manifest_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."manifests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketing_campaigns_2026_02_11_14_10" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketing_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."master_audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."merchant_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."merchants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."merchants_2026_02_18_17_00" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "merchants_insert_authenticated" ON "public"."merchants" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "merchants_select_authenticated" ON "public"."merchants" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "merchants_update_authenticated" ON "public"."merchants" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."migration_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."myanmar_locations_2026_02_19_13_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."myanmar_states_divisions_2026_02_18_18_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications_2026_02_19_13_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."operator_branch_memberships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."operators" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parcels_2026_02_18_17_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments_2026_02_28_20_06" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permission_overrides" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pickup_records_2026_02_11_14_10" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles_2026_02_19_13_00" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_read_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "public_access" ON "public"."domestic_rates_2026_02_19_13_00" FOR SELECT USING (true);



CREATE POLICY "public_access" ON "public"."international_rates_2026_02_19_13_00" FOR SELECT USING (true);



CREATE POLICY "public_access" ON "public"."myanmar_locations_2026_02_19_13_00" FOR SELECT USING (true);



ALTER TABLE "public"."qr_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."qr_codes_2026_02_18_17_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."qr_codes_advanced_2026_02_19_15_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."qr_scan_logs_2026_02_18_17_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rbac_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."realtime_events_2026_02_18_18_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."realtime_events_2026_02_19_15_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."realtime_notifications_2026_02_19_17_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."receipts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."regions_2026_02_28_20_06" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reports_2026_02_11_14_10" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rider_compliance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_authorities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "role_authorities_insert_authenticated" ON "public"."role_authorities" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "role_authorities_select_authenticated" ON "public"."role_authorities" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "role_authorities_update_authenticated" ON "public"."role_authorities" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."role_default_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_permissions_2026_02_28_20_06" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."route_optimizations_2026_02_18_18_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."route_optimizations_2026_02_19_15_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."route_plans_2026_02_18_17_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."routes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."routes_2026_02_19_13_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."routes_2026_02_28_20_06" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rpt_branches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sc_events_no_delete" ON "public"."supply_chain_events" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "sc_events_no_update" ON "public"."supply_chain_events" FOR UPDATE TO "authenticated" USING (false);



CREATE POLICY "sc_events_select_by_ship_access" ON "public"."supply_chain_events" FOR SELECT TO "authenticated" USING (("public"."is_admin_role"() OR (EXISTS ( SELECT 1
   FROM "public"."shipments" "s"
  WHERE ("s"."id" = "supply_chain_events"."shipment_id")))));



ALTER TABLE "public"."security_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_events_2026_02_11_14_10" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seed_users_import" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipment_approvals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipment_assignment_rules_2026_02_19_17_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipment_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipment_locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipment_signatures" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipment_status_history_2026_02_11_14_10" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipment_status_history_2026_02_17_18_40" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipment_steps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipment_tracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipment_tracking_2026_02_19_13_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipment_workflow_states_2026_02_19_17_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipments_2026_02_11_14_10" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipments_2026_02_17_18_40" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipments_2026_02_19_13_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipments_2026_02_28_20_06" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipping_calculations_2026_02_18_18_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."staff_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "staff_assignments_admin_all" ON "public"."staff_assignments" TO "authenticated" USING (("public"."is_admin_role"() OR "public"."has_role"('hr-admin'::"text"))) WITH CHECK (("public"."is_admin_role"() OR "public"."has_role"('hr-admin'::"text")));



CREATE POLICY "staff_assignments_self_select" ON "public"."staff_assignments" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."staff_directory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."supply_chain_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_ticket_messages_2026_02_11_14_10" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_tickets_2026_02_11_14_10" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_settings_2026_02_11_14_10" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tamper_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tamper_tags_2026_02_11_14_10" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tamper_tags_2026_02_17_18_40" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tariffs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."townships_2026_02_18_18_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tracking_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tracking_events_2026_02_28_20_06" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions_2026_02_19_13_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trusted_merchants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_activity_2026_02_11_14_10" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_authorities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_authorities_insert_authenticated" ON "public"."user_authorities" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "user_authorities_select_authenticated" ON "public"."user_authorities" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "user_authorities_update_authenticated" ON "public"."user_authorities" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."user_branch_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_credentials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_permission_grants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_scopes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_sessions_2026_02_11_14_10" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_sessions_2026_02_28_20_06" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users_2026_02_11_14_10" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users_2026_02_17_18_40" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users_2026_02_28_20_06" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_tracking_2026_02_19_13_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicles_2026_02_18_17_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicles_2026_02_19_13_00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicles_2026_02_28_20_06" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallet_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."warehouse_inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."warehouse_scans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."warehouse_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."warehouses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."warehouses_2026_02_28_20_06" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."way_plan_stops" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."way_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."way_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."waybill_counters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."waybill_print_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "waybill_print_items_rw" ON "public"."waybill_print_items" TO "authenticated" USING (("public"."is_admin_role"() OR (EXISTS ( SELECT 1
   FROM "public"."waybill_print_jobs" "j"
  WHERE (("j"."id" = "waybill_print_items"."job_id") AND ("j"."requested_by" = "auth"."uid"())))))) WITH CHECK (("public"."is_admin_role"() OR (EXISTS ( SELECT 1
   FROM "public"."waybill_print_jobs" "j"
  WHERE (("j"."id" = "waybill_print_items"."job_id") AND ("j"."requested_by" = "auth"."uid"()))))));



ALTER TABLE "public"."waybill_print_jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "waybill_print_jobs_rw" ON "public"."waybill_print_jobs" TO "authenticated" USING (("public"."is_admin_role"() OR ("requested_by" = "auth"."uid"()) OR "public"."has_any_role"(ARRAY['DATA_ENTRY'::"text", 'OPERATIONS_ADMIN'::"text", 'SUPERVISOR'::"text", 'MERCHANT'::"text"]))) WITH CHECK (("public"."is_admin_role"() OR ("requested_by" = "auth"."uid"()) OR "public"."has_any_role"(ARRAY['DATA_ENTRY'::"text", 'OPERATIONS_ADMIN'::"text", 'SUPERVISOR'::"text", 'MERCHANT'::"text"])));



GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_auth_email_duplicates"() TO "anon";
GRANT ALL ON FUNCTION "public"."admin_auth_email_duplicates"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_auth_email_duplicates"() TO "service_role";



GRANT ALL ON FUNCTION "public"."api_report_audit_logs"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_user" "text", "p_module" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."api_report_audit_logs"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_user" "text", "p_module" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."api_report_audit_logs"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_user" "text", "p_module" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."api_report_branches"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_search" "text", "p_is_active" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."api_report_branches"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_search" "text", "p_is_active" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."api_report_branches"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_search" "text", "p_is_active" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."api_report_merchants"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_search" "text", "p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."api_report_merchants"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_search" "text", "p_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."api_report_merchants"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_search" "text", "p_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."api_report_overdue_ways_count"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch_id" "uuid", "p_township" "text", "p_merchant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."api_report_overdue_ways_count"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch_id" "uuid", "p_township" "text", "p_merchant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."api_report_overdue_ways_count"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch_id" "uuid", "p_township" "text", "p_merchant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."api_report_total_ways_by_town"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch_id" "uuid", "p_township" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."api_report_total_ways_by_town"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch_id" "uuid", "p_township" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."api_report_total_ways_by_town"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch_id" "uuid", "p_township" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."api_report_ways_by_merchants"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch_id" "uuid", "p_merchant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."api_report_ways_by_merchants"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch_id" "uuid", "p_merchant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."api_report_ways_by_merchants"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch_id" "uuid", "p_merchant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."api_report_ways_count"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch_id" "uuid", "p_township" "text", "p_merchant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."api_report_ways_count"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch_id" "uuid", "p_township" "text", "p_merchant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."api_report_ways_count"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch_id" "uuid", "p_township" "text", "p_merchant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."app_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."app_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."app_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_dml_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_dml_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_dml_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_log_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_log_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_log_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."authenticate_demo_user_2026_02_19_14_00"("p_email" "text", "p_password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."authenticate_demo_user_2026_02_19_14_00"("p_email" "text", "p_password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."authenticate_demo_user_2026_02_19_14_00"("p_email" "text", "p_password" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."authenticate_user_2026_02_17_18_40"("user_email" "text", "user_password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."authenticate_user_2026_02_17_18_40"("user_email" "text", "user_password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."authenticate_user_2026_02_17_18_40"("user_email" "text", "user_password" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_approve_on_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_approve_on_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_approve_on_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_assign_resources_2026_02_18_17_00"("p_parcel_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."auto_assign_resources_2026_02_18_17_00"("p_parcel_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_assign_resources_2026_02_18_17_00"("p_parcel_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_assign_shipment_2026_02_19_17_00"("p_shipment_id" "uuid", "p_shipment_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."auto_assign_shipment_2026_02_19_17_00"("p_shipment_id" "uuid", "p_shipment_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_assign_shipment_2026_02_19_17_00"("p_shipment_id" "uuid", "p_shipment_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."bulk_create_shipments_portal"("p_rows" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."bulk_create_shipments_portal"("p_rows" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bulk_create_shipments_portal"("p_rows" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_distance_km_2026_02_18_17_00"("lat1" numeric, "lon1" numeric, "lat2" numeric, "lon2" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_distance_km_2026_02_18_17_00"("lat1" numeric, "lon1" numeric, "lat2" numeric, "lon2" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_distance_km_2026_02_18_17_00"("lat1" numeric, "lon1" numeric, "lat2" numeric, "lon2" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_domestic_rate"("p_from_state" character varying, "p_to_state" character varying, "p_weight" numeric, "p_service_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_domestic_rate"("p_from_state" character varying, "p_to_state" character varying, "p_weight" numeric, "p_service_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_domestic_rate"("p_from_state" character varying, "p_to_state" character varying, "p_weight" numeric, "p_service_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_domestic_rate_2026_02_18_18_00"("p_weight_kg" numeric, "p_township_id" "uuid", "p_service_type" character varying, "p_cod_amount" numeric, "p_declared_value" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_domestic_rate_2026_02_18_18_00"("p_weight_kg" numeric, "p_township_id" "uuid", "p_service_type" character varying, "p_cod_amount" numeric, "p_declared_value" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_domestic_rate_2026_02_18_18_00"("p_weight_kg" numeric, "p_township_id" "uuid", "p_service_type" character varying, "p_cod_amount" numeric, "p_declared_value" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_merchant_payout"("way_id_input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_merchant_payout"("way_id_input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_merchant_payout"("way_id_input" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_branch"("p_branch" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_branch"("p_branch" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_branch"("p_branch" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_hierarchy"("target_branch" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_hierarchy"("target_branch" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_hierarchy"("target_branch" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_record"("p_created_by" "uuid", "p_branch_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_record"("p_created_by" "uuid", "p_branch_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_record"("p_created_by" "uuid", "p_branch_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_approve_approval"() TO "anon";
GRANT ALL ON FUNCTION "public"."can_approve_approval"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_approve_approval"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_reject_approval"() TO "anon";
GRANT ALL ON FUNCTION "public"."can_reject_approval"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_reject_approval"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_submit_approval"() TO "anon";
GRANT ALL ON FUNCTION "public"."can_submit_approval"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_submit_approval"() TO "service_role";



GRANT ALL ON FUNCTION "public"."change_user_password_2026_02_17_18_40"("user_id" "uuid", "new_password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."change_user_password_2026_02_17_18_40"("user_id" "uuid", "new_password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."change_user_password_2026_02_17_18_40"("user_id" "uuid", "new_password" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_geofence_2026_02_18_18_00"("p_lat" numeric, "p_lng" numeric, "p_geofence_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_geofence_2026_02_18_18_00"("p_lat" numeric, "p_lng" numeric, "p_geofence_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_geofence_2026_02_18_18_00"("p_lat" numeric, "p_lng" numeric, "p_geofence_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_security_clearance"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_security_clearance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_security_clearance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."city_code"("p_city" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."city_code"("p_city" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."city_code"("p_city" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."clear_must_change_password"() TO "anon";
GRANT ALL ON FUNCTION "public"."clear_must_change_password"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clear_must_change_password"() TO "service_role";



GRANT ALL ON FUNCTION "public"."col_type"("p_table" "regclass", "p_col" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."col_type"("p_table" "regclass", "p_col" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."col_type"("p_table" "regclass", "p_col" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_managed_user"("user_email" "text", "user_password" "text", "user_full_name" "text", "user_role" "text", "user_scope" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_managed_user"("user_email" "text", "user_password" "text", "user_full_name" "text", "user_role" "text", "user_scope" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_managed_user"("user_email" "text", "user_password" "text", "user_full_name" "text", "user_role" "text", "user_scope" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification"("p_recipient_id" "uuid", "p_title" character varying, "p_message" "text", "p_type" character varying, "p_category" character varying, "p_reference_type" character varying, "p_reference_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification"("p_recipient_id" "uuid", "p_title" character varying, "p_message" "text", "p_type" character varying, "p_category" character varying, "p_reference_type" character varying, "p_reference_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification"("p_recipient_id" "uuid", "p_title" character varying, "p_message" "text", "p_type" character varying, "p_category" character varying, "p_reference_type" character varying, "p_reference_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_shipment"("p_merchant_id" "uuid", "p_customer_id" "uuid", "p_sender_name" character varying, "p_sender_phone" character varying, "p_sender_address" "text", "p_sender_city" character varying, "p_sender_state" character varying, "p_receiver_name" character varying, "p_receiver_phone" character varying, "p_receiver_address" "text", "p_receiver_city" character varying, "p_receiver_state" character varying, "p_package_type" character varying, "p_weight" numeric, "p_dimensions" "jsonb", "p_declared_value" numeric, "p_contents_description" "text", "p_service_type" character varying, "p_payment_method" character varying, "p_cod_amount" numeric, "p_shipping_cost" numeric, "p_insurance_cost" numeric, "p_total_cost" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."create_shipment"("p_merchant_id" "uuid", "p_customer_id" "uuid", "p_sender_name" character varying, "p_sender_phone" character varying, "p_sender_address" "text", "p_sender_city" character varying, "p_sender_state" character varying, "p_receiver_name" character varying, "p_receiver_phone" character varying, "p_receiver_address" "text", "p_receiver_city" character varying, "p_receiver_state" character varying, "p_package_type" character varying, "p_weight" numeric, "p_dimensions" "jsonb", "p_declared_value" numeric, "p_contents_description" "text", "p_service_type" character varying, "p_payment_method" character varying, "p_cod_amount" numeric, "p_shipping_cost" numeric, "p_insurance_cost" numeric, "p_total_cost" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_shipment"("p_merchant_id" "uuid", "p_customer_id" "uuid", "p_sender_name" character varying, "p_sender_phone" character varying, "p_sender_address" "text", "p_sender_city" character varying, "p_sender_state" character varying, "p_receiver_name" character varying, "p_receiver_phone" character varying, "p_receiver_address" "text", "p_receiver_city" character varying, "p_receiver_state" character varying, "p_package_type" character varying, "p_weight" numeric, "p_dimensions" "jsonb", "p_declared_value" numeric, "p_contents_description" "text", "p_service_type" character varying, "p_payment_method" character varying, "p_cod_amount" numeric, "p_shipping_cost" numeric, "p_insurance_cost" numeric, "p_total_cost" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_shipment_data_entry"("p_receiver_name" "text", "p_receiver_phone" "text", "p_receiver_address" "text", "p_receiver_city" "text", "p_receiver_state" "text", "p_delivery_fee" numeric, "p_cod_amount" numeric, "p_pickup_branch_id" "uuid", "p_delivery_branch_id" "uuid", "p_package_description" "text", "p_package_weight" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."create_shipment_data_entry"("p_receiver_name" "text", "p_receiver_phone" "text", "p_receiver_address" "text", "p_receiver_city" "text", "p_receiver_state" "text", "p_delivery_fee" numeric, "p_cod_amount" numeric, "p_pickup_branch_id" "uuid", "p_delivery_branch_id" "uuid", "p_package_description" "text", "p_package_weight" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_shipment_data_entry"("p_receiver_name" "text", "p_receiver_phone" "text", "p_receiver_address" "text", "p_receiver_city" "text", "p_receiver_state" "text", "p_delivery_fee" numeric, "p_cod_amount" numeric, "p_pickup_branch_id" "uuid", "p_delivery_branch_id" "uuid", "p_package_description" "text", "p_package_weight" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_shipment_portal"("p_receiver_name" "text", "p_receiver_phone" "text", "p_receiver_address" "text", "p_receiver_city" "text", "p_item_price" numeric, "p_delivery_fee" numeric, "p_cod_amount" numeric, "p_sender_name" "text", "p_sender_phone" "text", "p_sender_address" "text", "p_sender_city" "text", "p_package_weight" numeric, "p_delivery_type" "text", "p_service_type" "text", "p_remarks" "text", "p_pickup_branch_id" "uuid", "p_delivery_branch_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_shipment_portal"("p_receiver_name" "text", "p_receiver_phone" "text", "p_receiver_address" "text", "p_receiver_city" "text", "p_item_price" numeric, "p_delivery_fee" numeric, "p_cod_amount" numeric, "p_sender_name" "text", "p_sender_phone" "text", "p_sender_address" "text", "p_sender_city" "text", "p_package_weight" numeric, "p_delivery_type" "text", "p_service_type" "text", "p_remarks" "text", "p_pickup_branch_id" "uuid", "p_delivery_branch_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_shipment_portal"("p_receiver_name" "text", "p_receiver_phone" "text", "p_receiver_address" "text", "p_receiver_city" "text", "p_item_price" numeric, "p_delivery_fee" numeric, "p_cod_amount" numeric, "p_sender_name" "text", "p_sender_phone" "text", "p_sender_address" "text", "p_sender_city" "text", "p_package_weight" numeric, "p_delivery_type" "text", "p_service_type" "text", "p_remarks" "text", "p_pickup_branch_id" "uuid", "p_delivery_branch_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."current_app_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_app_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_app_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_branch"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_branch"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_branch"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_branch_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_branch_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_branch_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_customer_phone"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_customer_phone"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_customer_phone"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_merchant_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_merchant_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_merchant_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_office_tag"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_office_tag"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_office_tag"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_public_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_public_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_public_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_id"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."current_user_role"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "anon";



REVOKE ALL ON FUNCTION "public"."db_role"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."db_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."db_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."db_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."debug_auth_2026_02_17_18_40"("user_email" "text", "user_password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."debug_auth_2026_02_17_18_40"("user_email" "text", "user_password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."debug_auth_2026_02_17_18_40"("user_email" "text", "user_password" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."effective_role"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."effective_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."effective_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."effective_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enable_audit_triggers_all_public_tables"() TO "anon";
GRANT ALL ON FUNCTION "public"."enable_audit_triggers_all_public_tables"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enable_audit_triggers_all_public_tables"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enum_first_label"("p_type" "regtype") TO "anon";
GRANT ALL ON FUNCTION "public"."enum_first_label"("p_type" "regtype") TO "authenticated";
GRANT ALL ON FUNCTION "public"."enum_first_label"("p_type" "regtype") TO "service_role";



GRANT ALL ON FUNCTION "public"."execute_delivery_resolution"("p_awb" character varying, "p_rider_id" "uuid", "p_resolution" character varying, "p_lat" numeric, "p_lng" numeric, "p_evidence_url" "text", "p_receiver_name" character varying, "p_ndr_reason" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."execute_delivery_resolution"("p_awb" character varying, "p_rider_id" "uuid", "p_resolution" character varying, "p_lat" numeric, "p_lng" numeric, "p_evidence_url" "text", "p_receiver_name" character varying, "p_ndr_reason" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_delivery_resolution"("p_awb" character varying, "p_rider_id" "uuid", "p_resolution" character varying, "p_lat" numeric, "p_lng" numeric, "p_evidence_url" "text", "p_receiver_name" character varying, "p_ndr_reason" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."execute_secure_pickup"("p_awb" character varying, "p_tag_id" character varying, "p_rider_id" "uuid", "p_lat" numeric, "p_lng" numeric, "p_photo_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."execute_secure_pickup"("p_awb" character varying, "p_tag_id" character varying, "p_rider_id" "uuid", "p_lat" numeric, "p_lng" numeric, "p_photo_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_secure_pickup"("p_awb" character varying, "p_tag_id" character varying, "p_rider_id" "uuid", "p_lat" numeric, "p_lng" numeric, "p_photo_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."execute_secure_pickup"("p_awb" character varying, "p_tag_id" character varying, "p_rider_id" "uuid", "p_lat" numeric, "p_lng" numeric, "p_photo_url" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."execute_secure_pickup"("p_awb" character varying, "p_tag_id" character varying, "p_rider_id" "uuid", "p_lat" numeric, "p_lng" numeric, "p_photo_url" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_secure_pickup"("p_awb" character varying, "p_tag_id" character varying, "p_rider_id" "uuid", "p_lat" numeric, "p_lng" numeric, "p_photo_url" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_audit_checksum"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_audit_checksum"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_audit_checksum"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_awb_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_awb_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_awb_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_customer_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_customer_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_customer_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_merchant_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_merchant_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_merchant_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_parcel_id_2026_02_18_17_00"("p_pickup_zone" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_parcel_id_2026_02_18_17_00"("p_pickup_zone" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_parcel_id_2026_02_18_17_00"("p_pickup_zone" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_qr_code_2026_02_18_17_00"("p_qr_data" "text", "p_qr_type" character varying, "p_shipment_id" "text", "p_generated_by" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_qr_code_2026_02_18_17_00"("p_qr_data" "text", "p_qr_type" character varying, "p_shipment_id" "text", "p_generated_by" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_qr_code_2026_02_18_17_00"("p_qr_data" "text", "p_qr_type" character varying, "p_shipment_id" "text", "p_generated_by" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_qr_code_advanced_2026_02_19_15_00"("p_qr_type" "text", "p_reference_id" "uuid", "p_reference_type" "text", "p_data" "jsonb", "p_generated_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_qr_code_advanced_2026_02_19_15_00"("p_qr_type" "text", "p_reference_id" "uuid", "p_reference_type" "text", "p_data" "jsonb", "p_generated_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_qr_code_advanced_2026_02_19_15_00"("p_qr_type" "text", "p_reference_id" "uuid", "p_reference_type" "text", "p_data" "jsonb", "p_generated_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_smart_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_smart_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_smart_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_transaction_hash"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_transaction_hash"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_transaction_hash"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_transaction_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_transaction_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_transaction_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_waybill_id"("p_org" "text", "p_dst" "text", "p_tag" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_waybill_id"("p_org" "text", "p_dst" "text", "p_tag" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_waybill_id"("p_org" "text", "p_dst" "text", "p_tag" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_waybill_id"("p_origin_city" "text", "p_dest_city" "text", "p_office_tag" "text", "p_branch_code" "text", "p_issue_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_waybill_id"("p_origin_city" "text", "p_dest_city" "text", "p_office_tag" "text", "p_branch_code" "text", "p_issue_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_waybill_id"("p_origin_city" "text", "p_dest_city" "text", "p_office_tag" "text", "p_branch_code" "text", "p_issue_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_assignment_queue_2026_02_19_17_00"("p_user_id" "uuid", "p_branch_id" "uuid", "p_queue_type" character varying, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_assignment_queue_2026_02_19_17_00"("p_user_id" "uuid", "p_branch_id" "uuid", "p_queue_type" character varying, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_assignment_queue_2026_02_19_17_00"("p_user_id" "uuid", "p_branch_id" "uuid", "p_queue_type" character varying, "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_metrics"("p_user_id" "uuid", "p_branch_id" "uuid", "p_date_from" "date", "p_date_to" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_metrics"("p_user_id" "uuid", "p_branch_id" "uuid", "p_date_from" "date", "p_date_to" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_metrics"("p_user_id" "uuid", "p_branch_id" "uuid", "p_date_from" "date", "p_date_to" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_qr_stats_2026_02_18_17_00"("p_user_id" "text", "p_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_qr_stats_2026_02_18_17_00"("p_user_id" "text", "p_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_qr_stats_2026_02_18_17_00"("p_user_id" "text", "p_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_shipment_workflow_2026_02_19_17_00"("p_shipment_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_shipment_workflow_2026_02_19_17_00"("p_shipment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_shipment_workflow_2026_02_19_17_00"("p_shipment_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_permissions"("user_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_permissions"("user_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_permissions"("user_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_waybill_print_data"("p_way_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_waybill_print_data"("p_way_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_waybill_print_data"("p_way_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_admin_user_management"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_admin_user_management"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_admin_user_management"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_auth_user_upsert"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_auth_user_upsert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_auth_user_upsert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_failed_login"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."handle_failed_login"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_failed_login"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_last_login"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_last_login"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_last_login"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_hardened"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_hardened"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_hardened"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_setup"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_setup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_setup"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_any_role"("role_names" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."has_any_role"("role_names" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_any_role"("role_names" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."has_permission"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_permission"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_permission"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_permission"("user_role" "text", "permission_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_permission"("user_role" "text", "permission_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_permission"("user_role" "text", "permission_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("role_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("role_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("role_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_app_owner"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_app_owner"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_app_owner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_app_owner"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_finance_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_finance_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_finance_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_staff"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_staff"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_staff"() TO "service_role";



GRANT ALL ON FUNCTION "public"."jwt_claim"("claim" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."jwt_claim"("claim" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."jwt_claim"("claim" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."jwt_claims"() TO "anon";
GRANT ALL ON FUNCTION "public"."jwt_claims"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."jwt_claims"() TO "service_role";



GRANT ALL ON FUNCTION "public"."jwt_custom_claims"() TO "anon";
GRANT ALL ON FUNCTION "public"."jwt_custom_claims"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."jwt_custom_claims"() TO "service_role";



GRANT ALL ON FUNCTION "public"."jwt_hook"() TO "anon";
GRANT ALL ON FUNCTION "public"."jwt_hook"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."jwt_hook"() TO "service_role";



GRANT ALL ON FUNCTION "public"."lock_financial_after_approval"() TO "anon";
GRANT ALL ON FUNCTION "public"."lock_financial_after_approval"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."lock_financial_after_approval"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_approval_history"("p_entity_type" "text", "p_entity_id" "uuid", "p_action" "text", "p_reason" "text", "p_meta" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_approval_history"("p_entity_type" "text", "p_entity_id" "uuid", "p_action" "text", "p_reason" "text", "p_meta" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_approval_history"("p_entity_type" "text", "p_entity_id" "uuid", "p_action" "text", "p_reason" "text", "p_meta" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_audit"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_audit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_audit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_audit_event"("p_user_id" "uuid", "p_action" character varying, "p_resource_type" character varying, "p_resource_id" "uuid", "p_old_values" "jsonb", "p_new_values" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_audit_event"("p_user_id" "uuid", "p_action" character varying, "p_resource_type" character varying, "p_resource_id" "uuid", "p_old_values" "jsonb", "p_new_values" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_audit_event"("p_user_id" "uuid", "p_action" character varying, "p_resource_type" character varying, "p_resource_id" "uuid", "p_old_values" "jsonb", "p_new_values" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_cross_branch"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_cross_branch"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_cross_branch"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_qr_scan_2026_02_18_17_00"("p_qr_data" "text", "p_scanned_by" "text", "p_scan_location" "jsonb", "p_device_info" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_qr_scan_2026_02_18_17_00"("p_qr_data" "text", "p_scanned_by" "text", "p_scan_location" "jsonb", "p_device_info" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_qr_scan_2026_02_18_17_00"("p_qr_data" "text", "p_scanned_by" "text", "p_scan_location" "jsonb", "p_device_info" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_shipment_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_shipment_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_shipment_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."next_waybill_seq"("p_issue_date" "date", "p_origin_code" "text", "p_office_tag" "text", "p_branch_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."next_waybill_seq"("p_issue_date" "date", "p_origin_code" "text", "p_office_tag" "text", "p_branch_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."next_waybill_seq"("p_issue_date" "date", "p_origin_code" "text", "p_office_tag" "text", "p_branch_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_financial_self_approval"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_financial_self_approval"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_financial_self_approval"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_self_role_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_self_role_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_self_role_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_gps_update_2026_02_18_18_00"("p_device_id" "text", "p_latitude" numeric, "p_longitude" numeric, "p_speed" numeric, "p_heading" numeric, "p_accuracy" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."process_gps_update_2026_02_18_18_00"("p_device_id" "text", "p_latitude" numeric, "p_longitude" numeric, "p_speed" numeric, "p_heading" numeric, "p_accuracy" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_gps_update_2026_02_18_18_00"("p_device_id" "text", "p_latitude" numeric, "p_longitude" numeric, "p_speed" numeric, "p_heading" numeric, "p_accuracy" numeric) TO "service_role";



REVOKE ALL ON FUNCTION "public"."public_track_shipment"("p_way_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."public_track_shipment"("p_way_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."public_track_shipment"("p_way_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."public_track_shipment"("p_way_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_cod_collection"("p_shipment_id" "uuid", "p_collected_by" "uuid", "p_amount" numeric, "p_payment_method" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."record_cod_collection"("p_shipment_id" "uuid", "p_collected_by" "uuid", "p_amount" numeric, "p_payment_method" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_cod_collection"("p_shipment_id" "uuid", "p_collected_by" "uuid", "p_amount" numeric, "p_payment_method" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."record_gps_location_2026_02_19_15_00"("p_device_id" "text", "p_latitude" numeric, "p_longitude" numeric, "p_vehicle_id" "uuid", "p_rider_id" "uuid", "p_shipment_id" "uuid", "p_altitude" numeric, "p_accuracy" numeric, "p_speed" numeric, "p_heading" numeric, "p_battery_level" integer, "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."record_gps_location_2026_02_19_15_00"("p_device_id" "text", "p_latitude" numeric, "p_longitude" numeric, "p_vehicle_id" "uuid", "p_rider_id" "uuid", "p_shipment_id" "uuid", "p_altitude" numeric, "p_accuracy" numeric, "p_speed" numeric, "p_heading" numeric, "p_battery_level" integer, "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_gps_location_2026_02_19_15_00"("p_device_id" "text", "p_latitude" numeric, "p_longitude" numeric, "p_vehicle_id" "uuid", "p_rider_id" "uuid", "p_shipment_id" "uuid", "p_altitude" numeric, "p_accuracy" numeric, "p_speed" numeric, "p_heading" numeric, "p_battery_level" integer, "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."request_jwt"() TO "anon";
GRANT ALL ON FUNCTION "public"."request_jwt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_jwt"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_admin_block_account"("p_user_id" "uuid", "p_block" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_admin_block_account"("p_user_id" "uuid", "p_block" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_admin_block_account"("p_user_id" "uuid", "p_block" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_admin_overdue_ways_by_merchant"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch" "text", "p_merchant" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_admin_overdue_ways_by_merchant"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch" "text", "p_merchant" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_admin_overdue_ways_by_merchant"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch" "text", "p_merchant" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_admin_pickup_ways"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch" "text", "p_rider" "text", "p_merchant" "text", "p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_admin_pickup_ways"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch" "text", "p_rider" "text", "p_merchant" "text", "p_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_admin_pickup_ways"("p_page" integer, "p_page_size" integer, "p_sort_by" "text", "p_sort_order" "text", "p_date_from" "date", "p_date_to" "date", "p_branch" "text", "p_rider" "text", "p_merchant" "text", "p_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_admin_soft_delete_account"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_admin_soft_delete_account"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_admin_soft_delete_account"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."broadcast_messages" TO "anon";
GRANT ALL ON TABLE "public"."broadcast_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."broadcast_messages" TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_approve_broadcast_message"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_approve_broadcast_message"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_approve_broadcast_message"("p_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."cash_vouchers" TO "anon";
GRANT ALL ON TABLE "public"."cash_vouchers" TO "authenticated";
GRANT ALL ON TABLE "public"."cash_vouchers" TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_approve_cash_voucher"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_approve_cash_voucher"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_approve_cash_voucher"("p_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."journal_vouchers" TO "anon";
GRANT ALL ON TABLE "public"."journal_vouchers" TO "authenticated";
GRANT ALL ON TABLE "public"."journal_vouchers" TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_approve_journal_voucher"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_approve_journal_voucher"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_approve_journal_voucher"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_archive_broadcast_message"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_archive_broadcast_message"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_archive_broadcast_message"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_archive_cash_voucher"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_archive_cash_voucher"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_archive_cash_voucher"("p_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."deliverymen" TO "anon";
GRANT ALL ON TABLE "public"."deliverymen" TO "authenticated";
GRANT ALL ON TABLE "public"."deliverymen" TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_archive_deliveryman"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_archive_deliveryman"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_archive_deliveryman"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_archive_journal_voucher"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_archive_journal_voucher"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_archive_journal_voucher"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_filter_options_branches"() TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_filter_options_branches"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_filter_options_branches"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_filter_options_deliverymen"() TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_filter_options_deliverymen"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_filter_options_deliverymen"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_filter_options_merchants"() TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_filter_options_merchants"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_filter_options_merchants"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_reject_broadcast_message"("p_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_reject_broadcast_message"("p_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_reject_broadcast_message"("p_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_reject_cash_voucher"("p_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_reject_cash_voucher"("p_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_reject_cash_voucher"("p_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_reject_journal_voucher"("p_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_reject_journal_voucher"("p_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_reject_journal_voucher"("p_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_restore_broadcast_message"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_restore_broadcast_message"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_restore_broadcast_message"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_restore_cash_voucher"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_restore_cash_voucher"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_restore_cash_voucher"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_restore_deliveryman"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_restore_deliveryman"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_restore_deliveryman"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_restore_journal_voucher"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_restore_journal_voucher"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_restore_journal_voucher"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_submit_broadcast_message"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_submit_broadcast_message"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_submit_broadcast_message"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_submit_cash_voucher"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_submit_cash_voucher"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_submit_cash_voucher"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_submit_journal_voucher"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_submit_journal_voucher"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_submit_journal_voucher"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."save_electronic_signature_2026_02_19_15_00"("p_signature_data" "text", "p_signature_type" "text", "p_reference_id" "uuid", "p_reference_type" "text", "p_signer_name" "text", "p_signer_id_number" "text", "p_signer_phone" "text", "p_signed_by" "uuid", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."save_electronic_signature_2026_02_19_15_00"("p_signature_data" "text", "p_signature_type" "text", "p_reference_id" "uuid", "p_reference_type" "text", "p_signer_name" "text", "p_signer_id_number" "text", "p_signer_phone" "text", "p_signed_by" "uuid", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_electronic_signature_2026_02_19_15_00"("p_signature_data" "text", "p_signature_type" "text", "p_reference_id" "uuid", "p_reference_type" "text", "p_signer_name" "text", "p_signer_id_number" "text", "p_signer_phone" "text", "p_signed_by" "uuid", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."sc_enforce_state_machine"("p_shipment_id" "uuid", "p_event_type" "text", "p_segment" "text", "p_meta" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."sc_enforce_state_machine"("p_shipment_id" "uuid", "p_event_type" "text", "p_segment" "text", "p_meta" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sc_enforce_state_machine"("p_shipment_id" "uuid", "p_event_type" "text", "p_segment" "text", "p_meta" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."sc_event_before_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."sc_event_before_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sc_event_before_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."scan_qr_code_2026_02_19_15_00"("p_qr_code" "text", "p_scanned_by" "uuid", "p_scan_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."scan_qr_code_2026_02_19_15_00"("p_qr_code" "text", "p_scanned_by" "uuid", "p_scan_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."scan_qr_code_2026_02_19_15_00"("p_qr_code" "text", "p_scanned_by" "uuid", "p_scan_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_tracking_on_create"() TO "anon";
GRANT ALL ON FUNCTION "public"."seed_tracking_on_create"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."seed_tracking_on_create"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_environment_from_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_environment_from_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_environment_from_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_new_user_password_policy"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_new_user_password_policy"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_new_user_password_policy"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_branch_columns"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_branch_columns"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_branch_columns"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."transition_shipment"("p_shipment_id" "uuid", "p_next_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."transition_shipment"("p_shipment_id" "uuid", "p_next_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."transition_shipment"("p_shipment_id" "uuid", "p_next_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_auto_assign_shipment_2026_02_19_17_00"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_auto_assign_shipment_2026_02_19_17_00"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_auto_assign_shipment_2026_02_19_17_00"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_inventory"("p_inventory_id" "uuid", "p_movement_type" character varying, "p_quantity" integer, "p_reference_type" character varying, "p_reference_id" "uuid", "p_performed_by" "uuid", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_inventory"("p_inventory_id" "uuid", "p_movement_type" character varying, "p_quantity" integer, "p_reference_type" character varying, "p_reference_id" "uuid", "p_performed_by" "uuid", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_inventory"("p_inventory_id" "uuid", "p_movement_type" character varying, "p_quantity" integer, "p_reference_type" character varying, "p_reference_id" "uuid", "p_performed_by" "uuid", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_shipment_status"("p_way_id" "text", "p_new_status" "text", "p_location" "text", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_shipment_status"("p_way_id" "text", "p_new_status" "text", "p_location" "text", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_shipment_status"("p_way_id" "text", "p_new_status" "text", "p_location" "text", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_shipment_status"("p_shipment_id" "uuid", "p_status" character varying, "p_location" character varying, "p_updated_by" "uuid", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_shipment_status"("p_shipment_id" "uuid", "p_status" character varying, "p_location" character varying, "p_updated_by" "uuid", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_shipment_status"("p_shipment_id" "uuid", "p_status" character varying, "p_location" character varying, "p_updated_by" "uuid", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_shipment_workflow_2026_02_19_17_00"("p_shipment_id" "uuid", "p_new_state" character varying, "p_user_id" "uuid", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_shipment_workflow_2026_02_19_17_00"("p_shipment_id" "uuid", "p_new_state" character varying, "p_user_id" "uuid", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_shipment_workflow_2026_02_19_17_00"("p_shipment_id" "uuid", "p_new_state" character varying, "p_user_id" "uuid", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_password"("password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_password"("password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_password"("password" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_shipment_transition"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_shipment_transition"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_shipment_transition"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_signature_2026_02_18_18_00"("p_signature_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_signature_2026_02_18_18_00"("p_signature_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_signature_2026_02_18_18_00"("p_signature_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."active_sessions" TO "anon";
GRANT ALL ON TABLE "public"."active_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."active_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."addresses" TO "anon";
GRANT ALL ON TABLE "public"."addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."addresses" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."air_cargo_specifications_2026_02_18_18_00" TO "anon";
GRANT ALL ON TABLE "public"."air_cargo_specifications_2026_02_18_18_00" TO "authenticated";
GRANT ALL ON TABLE "public"."air_cargo_specifications_2026_02_18_18_00" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."merchants" TO "anon";
GRANT ALL ON TABLE "public"."merchants" TO "authenticated";
GRANT ALL ON TABLE "public"."merchants" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."app_identities" TO "anon";
GRANT ALL ON TABLE "public"."app_identities" TO "authenticated";
GRANT ALL ON TABLE "public"."app_identities" TO "service_role";



GRANT ALL ON TABLE "public"."approval_history" TO "anon";
GRANT ALL ON TABLE "public"."approval_history" TO "authenticated";
GRANT ALL ON TABLE "public"."approval_history" TO "service_role";



GRANT ALL ON TABLE "public"."approval_requests" TO "anon";
GRANT ALL ON TABLE "public"."approval_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."approval_requests" TO "service_role";



GRANT ALL ON TABLE "public"."approval_workflows_2026_02_28_20_06" TO "anon";
GRANT ALL ON TABLE "public"."approval_workflows_2026_02_28_20_06" TO "authenticated";
GRANT ALL ON TABLE "public"."approval_workflows_2026_02_28_20_06" TO "service_role";



GRANT ALL ON TABLE "public"."approvals" TO "anon";
GRANT ALL ON TABLE "public"."approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."approvals" TO "service_role";



GRANT ALL ON TABLE "public"."assignment_queue_2026_02_19_17_00" TO "anon";
GRANT ALL ON TABLE "public"."assignment_queue_2026_02_19_17_00" TO "authenticated";
GRANT ALL ON TABLE "public"."assignment_queue_2026_02_19_17_00" TO "service_role";



GRANT ALL ON TABLE "public"."attendance" TO "anon";
GRANT ALL ON TABLE "public"."attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."audit_dml_logs" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."audit_dml_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_dml_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."audit_dml_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."audit_dml_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."audit_dml_logs_id_seq" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."audit_logs" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."audit_trigger_exclusions" TO "anon";
GRANT ALL ON TABLE "public"."audit_trigger_exclusions" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_trigger_exclusions" TO "service_role";



GRANT ALL ON TABLE "public"."authority_permissions" TO "anon";
GRANT ALL ON TABLE "public"."authority_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."authority_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."auto_approve_policies" TO "anon";
GRANT ALL ON TABLE "public"."auto_approve_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."auto_approve_policies" TO "service_role";



GRANT ALL ON TABLE "public"."bags" TO "anon";
GRANT ALL ON TABLE "public"."bags" TO "authenticated";
GRANT ALL ON TABLE "public"."bags" TO "service_role";



GRANT ALL ON TABLE "public"."branch_daily_metrics" TO "anon";
GRANT ALL ON TABLE "public"."branch_daily_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."branch_daily_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."branch_regions" TO "anon";
GRANT ALL ON TABLE "public"."branch_regions" TO "authenticated";
GRANT ALL ON TABLE "public"."branch_regions" TO "service_role";



GRANT ALL ON TABLE "public"."branches" TO "anon";
GRANT ALL ON TABLE "public"."branches" TO "authenticated";
GRANT ALL ON TABLE "public"."branches" TO "service_role";



GRANT ALL ON TABLE "public"."chain_of_custody_logs" TO "anon";
GRANT ALL ON TABLE "public"."chain_of_custody_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."chain_of_custody_logs" TO "service_role";



GRANT ALL ON TABLE "public"."claims_2026_02_28_20_06" TO "anon";
GRANT ALL ON TABLE "public"."claims_2026_02_28_20_06" TO "authenticated";
GRANT ALL ON TABLE "public"."claims_2026_02_28_20_06" TO "service_role";



GRANT ALL ON TABLE "public"."cod_collections" TO "anon";
GRANT ALL ON TABLE "public"."cod_collections" TO "authenticated";
GRANT ALL ON TABLE "public"."cod_collections" TO "service_role";



GRANT ALL ON TABLE "public"."cod_collections_2026_02_28_20_06" TO "anon";
GRANT ALL ON TABLE "public"."cod_collections_2026_02_28_20_06" TO "authenticated";
GRANT ALL ON TABLE "public"."cod_collections_2026_02_28_20_06" TO "service_role";



GRANT ALL ON TABLE "public"."commissions_2026_02_11_14_10" TO "anon";
GRANT ALL ON TABLE "public"."commissions_2026_02_11_14_10" TO "authenticated";
GRANT ALL ON TABLE "public"."commissions_2026_02_11_14_10" TO "service_role";



GRANT ALL ON TABLE "public"."complaint_messages" TO "anon";
GRANT ALL ON TABLE "public"."complaint_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."complaint_messages" TO "service_role";



GRANT ALL ON TABLE "public"."complaints" TO "anon";
GRANT ALL ON TABLE "public"."complaints" TO "authenticated";
GRANT ALL ON TABLE "public"."complaints" TO "service_role";



GRANT ALL ON TABLE "public"."courier_locations" TO "anon";
GRANT ALL ON TABLE "public"."courier_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."courier_locations" TO "service_role";



GRANT ALL ON TABLE "public"."coverage_zones" TO "anon";
GRANT ALL ON TABLE "public"."coverage_zones" TO "authenticated";
GRANT ALL ON TABLE "public"."coverage_zones" TO "service_role";



GRANT ALL ON TABLE "public"."customer_kyc" TO "anon";
GRANT ALL ON TABLE "public"."customer_kyc" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_kyc" TO "service_role";



GRANT ALL ON TABLE "public"."customer_segments_2026_02_11_14_10" TO "anon";
GRANT ALL ON TABLE "public"."customer_segments_2026_02_11_14_10" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_segments_2026_02_11_14_10" TO "service_role";



GRANT ALL ON TABLE "public"."customers_2026_02_18_17_00" TO "anon";
GRANT ALL ON TABLE "public"."customers_2026_02_18_17_00" TO "authenticated";
GRANT ALL ON TABLE "public"."customers_2026_02_18_17_00" TO "service_role";



GRANT ALL ON TABLE "public"."customers_2026_02_19_13_00" TO "anon";
GRANT ALL ON TABLE "public"."customers_2026_02_19_13_00" TO "authenticated";
GRANT ALL ON TABLE "public"."customers_2026_02_19_13_00" TO "service_role";



GRANT ALL ON TABLE "public"."customers_2026_02_28_20_06" TO "anon";
GRANT ALL ON TABLE "public"."customers_2026_02_28_20_06" TO "authenticated";
GRANT ALL ON TABLE "public"."customers_2026_02_28_20_06" TO "service_role";



GRANT ALL ON TABLE "public"."data_entry_automation_2026_02_18_18_00" TO "anon";
GRANT ALL ON TABLE "public"."data_entry_automation_2026_02_18_18_00" TO "authenticated";
GRANT ALL ON TABLE "public"."data_entry_automation_2026_02_18_18_00" TO "service_role";



GRANT ALL ON TABLE "public"."deliveries" TO "anon";
GRANT ALL ON TABLE "public"."deliveries" TO "authenticated";
GRANT ALL ON TABLE "public"."deliveries" TO "service_role";



GRANT ALL ON TABLE "public"."deliveries_2026_02_19_13_00" TO "anon";
GRANT ALL ON TABLE "public"."deliveries_2026_02_19_13_00" TO "authenticated";
GRANT ALL ON TABLE "public"."deliveries_2026_02_19_13_00" TO "service_role";



GRANT ALL ON TABLE "public"."delivery_history" TO "anon";
GRANT ALL ON TABLE "public"."delivery_history" TO "authenticated";
GRANT ALL ON TABLE "public"."delivery_history" TO "service_role";



GRANT ALL ON TABLE "public"."delivery_personnel_2026_02_18_17_00" TO "anon";
GRANT ALL ON TABLE "public"."delivery_personnel_2026_02_18_17_00" TO "authenticated";
GRANT ALL ON TABLE "public"."delivery_personnel_2026_02_18_17_00" TO "service_role";



GRANT ALL ON TABLE "public"."delivery_records_2026_02_11_14_10" TO "anon";
GRANT ALL ON TABLE "public"."delivery_records_2026_02_11_14_10" TO "authenticated";
GRANT ALL ON TABLE "public"."delivery_records_2026_02_11_14_10" TO "service_role";



GRANT ALL ON TABLE "public"."delivery_records_2026_02_17_18_40" TO "anon";
GRANT ALL ON TABLE "public"."delivery_records_2026_02_17_18_40" TO "authenticated";
GRANT ALL ON TABLE "public"."delivery_records_2026_02_17_18_40" TO "service_role";



GRANT ALL ON TABLE "public"."delivery_status_history" TO "anon";
GRANT ALL ON TABLE "public"."delivery_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."delivery_status_history" TO "service_role";



GRANT ALL ON TABLE "public"."demo_login_credentials_2026_02_19_14_00" TO "anon";
GRANT ALL ON TABLE "public"."demo_login_credentials_2026_02_19_14_00" TO "authenticated";
GRANT ALL ON TABLE "public"."demo_login_credentials_2026_02_19_14_00" TO "service_role";



GRANT ALL ON TABLE "public"."domestic_rates_2026_02_19_13_00" TO "anon";
GRANT ALL ON TABLE "public"."domestic_rates_2026_02_19_13_00" TO "authenticated";
GRANT ALL ON TABLE "public"."domestic_rates_2026_02_19_13_00" TO "service_role";



GRANT ALL ON TABLE "public"."domestic_shipping_rates_2026_02_18_18_00" TO "anon";
GRANT ALL ON TABLE "public"."domestic_shipping_rates_2026_02_18_18_00" TO "authenticated";
GRANT ALL ON TABLE "public"."domestic_shipping_rates_2026_02_18_18_00" TO "service_role";



GRANT ALL ON TABLE "public"."domestic_tariffs" TO "anon";
GRANT ALL ON TABLE "public"."domestic_tariffs" TO "authenticated";
GRANT ALL ON TABLE "public"."domestic_tariffs" TO "service_role";



GRANT ALL ON TABLE "public"."dup_public_users_email_v" TO "anon";
GRANT ALL ON TABLE "public"."dup_public_users_email_v" TO "authenticated";
GRANT ALL ON TABLE "public"."dup_public_users_email_v" TO "service_role";



GRANT ALL ON TABLE "public"."electronic_signatures_2026_02_18_18_00" TO "anon";
GRANT ALL ON TABLE "public"."electronic_signatures_2026_02_18_18_00" TO "authenticated";
GRANT ALL ON TABLE "public"."electronic_signatures_2026_02_18_18_00" TO "service_role";



GRANT ALL ON TABLE "public"."electronic_signatures_2026_02_19_15_00" TO "anon";
GRANT ALL ON TABLE "public"."electronic_signatures_2026_02_19_15_00" TO "authenticated";
GRANT ALL ON TABLE "public"."electronic_signatures_2026_02_19_15_00" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."feature_flags" TO "anon";
GRANT ALL ON TABLE "public"."feature_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_flags" TO "service_role";



GRANT ALL ON TABLE "public"."shipments" TO "anon";
GRANT ALL ON TABLE "public"."shipments" TO "authenticated";
GRANT ALL ON TABLE "public"."shipments" TO "service_role";



GRANT ALL ON TABLE "public"."finance_cod_pending_v" TO "anon";
GRANT ALL ON TABLE "public"."finance_cod_pending_v" TO "authenticated";
GRANT ALL ON TABLE "public"."finance_cod_pending_v" TO "service_role";



GRANT ALL ON TABLE "public"."shipment_tracking" TO "anon";
GRANT ALL ON TABLE "public"."shipment_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."shipment_tracking" TO "service_role";



GRANT ALL ON TABLE "public"."finance_cod_reconciliation_v" TO "anon";
GRANT ALL ON TABLE "public"."finance_cod_reconciliation_v" TO "authenticated";
GRANT ALL ON TABLE "public"."finance_cod_reconciliation_v" TO "service_role";



GRANT ALL ON TABLE "public"."finance_deposits" TO "anon";
GRANT ALL ON TABLE "public"."finance_deposits" TO "authenticated";
GRANT ALL ON TABLE "public"."finance_deposits" TO "service_role";



GRANT ALL ON TABLE "public"."finance_ledger" TO "anon";
GRANT ALL ON TABLE "public"."finance_ledger" TO "authenticated";
GRANT ALL ON TABLE "public"."finance_ledger" TO "service_role";



GRANT ALL ON TABLE "public"."financial_transactions" TO "anon";
GRANT ALL ON TABLE "public"."financial_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."financial_transactions_2026_02_11_14_10" TO "anon";
GRANT ALL ON TABLE "public"."financial_transactions_2026_02_11_14_10" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_transactions_2026_02_11_14_10" TO "service_role";



GRANT ALL ON TABLE "public"."fleet_assets" TO "anon";
GRANT ALL ON TABLE "public"."fleet_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."fleet_assets" TO "service_role";



GRANT ALL ON TABLE "public"."fleet_telemetry" TO "anon";
GRANT ALL ON TABLE "public"."fleet_telemetry" TO "authenticated";
GRANT ALL ON TABLE "public"."fleet_telemetry" TO "service_role";



GRANT ALL ON TABLE "public"."fuel_logs" TO "anon";
GRANT ALL ON TABLE "public"."fuel_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."fuel_logs" TO "service_role";



GRANT ALL ON TABLE "public"."geofences_2026_02_18_18_00" TO "anon";
GRANT ALL ON TABLE "public"."geofences_2026_02_18_18_00" TO "authenticated";
GRANT ALL ON TABLE "public"."geofences_2026_02_18_18_00" TO "service_role";



GRANT ALL ON TABLE "public"."geofences_2026_02_19_15_00" TO "anon";
GRANT ALL ON TABLE "public"."geofences_2026_02_19_15_00" TO "authenticated";
GRANT ALL ON TABLE "public"."geofences_2026_02_19_15_00" TO "service_role";



GRANT ALL ON TABLE "public"."gps_tracking_2026_02_18_18_00" TO "anon";
GRANT ALL ON TABLE "public"."gps_tracking_2026_02_18_18_00" TO "authenticated";
GRANT ALL ON TABLE "public"."gps_tracking_2026_02_18_18_00" TO "service_role";



GRANT ALL ON TABLE "public"."gps_tracking_advanced_2026_02_19_15_00" TO "anon";
GRANT ALL ON TABLE "public"."gps_tracking_advanced_2026_02_19_15_00" TO "authenticated";
GRANT ALL ON TABLE "public"."gps_tracking_advanced_2026_02_19_15_00" TO "service_role";



GRANT ALL ON TABLE "public"."international_destinations_2026_02_18_18_00" TO "anon";
GRANT ALL ON TABLE "public"."international_destinations_2026_02_18_18_00" TO "authenticated";
GRANT ALL ON TABLE "public"."international_destinations_2026_02_18_18_00" TO "service_role";



GRANT ALL ON TABLE "public"."international_rates_2026_02_19_13_00" TO "anon";
GRANT ALL ON TABLE "public"."international_rates_2026_02_19_13_00" TO "authenticated";
GRANT ALL ON TABLE "public"."international_rates_2026_02_19_13_00" TO "service_role";



GRANT ALL ON TABLE "public"."international_shipping_rates_2026_02_18_18_00" TO "anon";
GRANT ALL ON TABLE "public"."international_shipping_rates_2026_02_18_18_00" TO "authenticated";
GRANT ALL ON TABLE "public"."international_shipping_rates_2026_02_18_18_00" TO "service_role";



GRANT ALL ON TABLE "public"."intl_tariffs" TO "anon";
GRANT ALL ON TABLE "public"."intl_tariffs" TO "authenticated";
GRANT ALL ON TABLE "public"."intl_tariffs" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_2026_02_19_13_00" TO "anon";
GRANT ALL ON TABLE "public"."inventory_2026_02_19_13_00" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_2026_02_19_13_00" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_2026_02_28_20_06" TO "anon";
GRANT ALL ON TABLE "public"."inventory_2026_02_28_20_06" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_2026_02_28_20_06" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_movements_2026_02_19_13_00" TO "anon";
GRANT ALL ON TABLE "public"."inventory_movements_2026_02_19_13_00" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_movements_2026_02_19_13_00" TO "service_role";



GRANT ALL ON TABLE "public"."invoice_items_2026_02_28_20_06" TO "anon";
GRANT ALL ON TABLE "public"."invoice_items_2026_02_28_20_06" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_items_2026_02_28_20_06" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."invoices_2026_02_28_20_06" TO "anon";
GRANT ALL ON TABLE "public"."invoices_2026_02_28_20_06" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices_2026_02_28_20_06" TO "service_role";



GRANT ALL ON TABLE "public"."kpi_data_2026_02_11_14_10" TO "anon";
GRANT ALL ON TABLE "public"."kpi_data_2026_02_11_14_10" TO "authenticated";
GRANT ALL ON TABLE "public"."kpi_data_2026_02_11_14_10" TO "service_role";



GRANT ALL ON TABLE "public"."leave_requests" TO "anon";
GRANT ALL ON TABLE "public"."leave_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."leave_requests" TO "service_role";



GRANT ALL ON TABLE "public"."manifest_items" TO "anon";
GRANT ALL ON TABLE "public"."manifest_items" TO "authenticated";
GRANT ALL ON TABLE "public"."manifest_items" TO "service_role";



GRANT ALL ON TABLE "public"."manifests" TO "anon";
GRANT ALL ON TABLE "public"."manifests" TO "authenticated";
GRANT ALL ON TABLE "public"."manifests" TO "service_role";



GRANT ALL ON TABLE "public"."marketing_campaigns_2026_02_11_14_10" TO "anon";
GRANT ALL ON TABLE "public"."marketing_campaigns_2026_02_11_14_10" TO "authenticated";
GRANT ALL ON TABLE "public"."marketing_campaigns_2026_02_11_14_10" TO "service_role";



GRANT ALL ON TABLE "public"."marketing_logs" TO "anon";
GRANT ALL ON TABLE "public"."marketing_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."marketing_logs" TO "service_role";



GRANT ALL ON TABLE "public"."master_audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."master_audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."master_audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."merchant_accounts" TO "anon";
GRANT ALL ON TABLE "public"."merchant_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."merchant_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."merchants_2026_02_18_17_00" TO "anon";
GRANT ALL ON TABLE "public"."merchants_2026_02_18_17_00" TO "authenticated";
GRANT ALL ON TABLE "public"."merchants_2026_02_18_17_00" TO "service_role";



GRANT ALL ON TABLE "public"."migration_history" TO "anon";
GRANT ALL ON TABLE "public"."migration_history" TO "authenticated";
GRANT ALL ON TABLE "public"."migration_history" TO "service_role";



GRANT ALL ON TABLE "public"."myanmar_locations_2026_02_19_13_00" TO "anon";
GRANT ALL ON TABLE "public"."myanmar_locations_2026_02_19_13_00" TO "authenticated";
GRANT ALL ON TABLE "public"."myanmar_locations_2026_02_19_13_00" TO "service_role";



GRANT ALL ON TABLE "public"."myanmar_states_divisions_2026_02_18_18_00" TO "anon";
GRANT ALL ON TABLE "public"."myanmar_states_divisions_2026_02_18_18_00" TO "authenticated";
GRANT ALL ON TABLE "public"."myanmar_states_divisions_2026_02_18_18_00" TO "service_role";



GRANT ALL ON TABLE "public"."notifications_2026_02_19_13_00" TO "anon";
GRANT ALL ON TABLE "public"."notifications_2026_02_19_13_00" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications_2026_02_19_13_00" TO "service_role";



GRANT ALL ON TABLE "public"."operator_branch_memberships" TO "anon";
GRANT ALL ON TABLE "public"."operator_branch_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."operator_branch_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."operators" TO "anon";
GRANT ALL ON TABLE "public"."operators" TO "authenticated";
GRANT ALL ON TABLE "public"."operators" TO "service_role";



GRANT ALL ON TABLE "public"."parcels_2026_02_18_17_00" TO "anon";
GRANT ALL ON TABLE "public"."parcels_2026_02_18_17_00" TO "authenticated";
GRANT ALL ON TABLE "public"."parcels_2026_02_18_17_00" TO "service_role";



GRANT ALL ON TABLE "public"."payments_2026_02_28_20_06" TO "anon";
GRANT ALL ON TABLE "public"."payments_2026_02_28_20_06" TO "authenticated";
GRANT ALL ON TABLE "public"."payments_2026_02_28_20_06" TO "service_role";



GRANT ALL ON TABLE "public"."permission_overrides" TO "anon";
GRANT ALL ON TABLE "public"."permission_overrides" TO "authenticated";
GRANT ALL ON TABLE "public"."permission_overrides" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON TABLE "public"."pickup_records_2026_02_11_14_10" TO "anon";
GRANT ALL ON TABLE "public"."pickup_records_2026_02_11_14_10" TO "authenticated";
GRANT ALL ON TABLE "public"."pickup_records_2026_02_11_14_10" TO "service_role";



GRANT ALL ON TABLE "public"."profiles_2026_02_19_13_00" TO "anon";
GRANT ALL ON TABLE "public"."profiles_2026_02_19_13_00" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles_2026_02_19_13_00" TO "service_role";



GRANT ALL ON TABLE "public"."qr_codes" TO "anon";
GRANT ALL ON TABLE "public"."qr_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."qr_codes" TO "service_role";



GRANT ALL ON TABLE "public"."qr_codes_2026_02_18_17_00" TO "anon";
GRANT ALL ON TABLE "public"."qr_codes_2026_02_18_17_00" TO "authenticated";
GRANT ALL ON TABLE "public"."qr_codes_2026_02_18_17_00" TO "service_role";



GRANT ALL ON TABLE "public"."qr_codes_advanced_2026_02_19_15_00" TO "anon";
GRANT ALL ON TABLE "public"."qr_codes_advanced_2026_02_19_15_00" TO "authenticated";
GRANT ALL ON TABLE "public"."qr_codes_advanced_2026_02_19_15_00" TO "service_role";



GRANT ALL ON TABLE "public"."qr_scan_logs_2026_02_18_17_00" TO "anon";
GRANT ALL ON TABLE "public"."qr_scan_logs_2026_02_18_17_00" TO "authenticated";
GRANT ALL ON TABLE "public"."qr_scan_logs_2026_02_18_17_00" TO "service_role";



GRANT ALL ON TABLE "public"."rbac_roles" TO "anon";
GRANT ALL ON TABLE "public"."rbac_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."rbac_roles" TO "service_role";



GRANT ALL ON TABLE "public"."realtime_events_2026_02_18_18_00" TO "anon";
GRANT ALL ON TABLE "public"."realtime_events_2026_02_18_18_00" TO "authenticated";
GRANT ALL ON TABLE "public"."realtime_events_2026_02_18_18_00" TO "service_role";



GRANT ALL ON TABLE "public"."realtime_events_2026_02_19_15_00" TO "anon";
GRANT ALL ON TABLE "public"."realtime_events_2026_02_19_15_00" TO "authenticated";
GRANT ALL ON TABLE "public"."realtime_events_2026_02_19_15_00" TO "service_role";



GRANT ALL ON TABLE "public"."realtime_notifications_2026_02_19_17_00" TO "anon";
GRANT ALL ON TABLE "public"."realtime_notifications_2026_02_19_17_00" TO "authenticated";
GRANT ALL ON TABLE "public"."realtime_notifications_2026_02_19_17_00" TO "service_role";



GRANT ALL ON TABLE "public"."receipts" TO "anon";
GRANT ALL ON TABLE "public"."receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."receipts" TO "service_role";



GRANT ALL ON TABLE "public"."regions_2026_02_28_20_06" TO "anon";
GRANT ALL ON TABLE "public"."regions_2026_02_28_20_06" TO "authenticated";
GRANT ALL ON TABLE "public"."regions_2026_02_28_20_06" TO "service_role";



GRANT ALL ON TABLE "public"."reports_2026_02_11_14_10" TO "anon";
GRANT ALL ON TABLE "public"."reports_2026_02_11_14_10" TO "authenticated";
GRANT ALL ON TABLE "public"."reports_2026_02_11_14_10" TO "service_role";



GRANT ALL ON TABLE "public"."rider_compliance" TO "anon";
GRANT ALL ON TABLE "public"."rider_compliance" TO "authenticated";
GRANT ALL ON TABLE "public"."rider_compliance" TO "service_role";



GRANT ALL ON TABLE "public"."role_authorities" TO "anon";
GRANT ALL ON TABLE "public"."role_authorities" TO "authenticated";
GRANT ALL ON TABLE "public"."role_authorities" TO "service_role";



GRANT ALL ON TABLE "public"."role_default_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_default_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_default_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions_2026_02_28_20_06" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions_2026_02_28_20_06" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions_2026_02_28_20_06" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."route_optimizations_2026_02_18_18_00" TO "anon";
GRANT ALL ON TABLE "public"."route_optimizations_2026_02_18_18_00" TO "authenticated";
GRANT ALL ON TABLE "public"."route_optimizations_2026_02_18_18_00" TO "service_role";



GRANT ALL ON TABLE "public"."route_optimizations_2026_02_19_15_00" TO "anon";
GRANT ALL ON TABLE "public"."route_optimizations_2026_02_19_15_00" TO "authenticated";
GRANT ALL ON TABLE "public"."route_optimizations_2026_02_19_15_00" TO "service_role";



GRANT ALL ON TABLE "public"."route_plans_2026_02_18_17_00" TO "anon";
GRANT ALL ON TABLE "public"."route_plans_2026_02_18_17_00" TO "authenticated";
GRANT ALL ON TABLE "public"."route_plans_2026_02_18_17_00" TO "service_role";



GRANT ALL ON TABLE "public"."routes" TO "anon";
GRANT ALL ON TABLE "public"."routes" TO "authenticated";
GRANT ALL ON TABLE "public"."routes" TO "service_role";



GRANT ALL ON TABLE "public"."routes_2026_02_19_13_00" TO "anon";
GRANT ALL ON TABLE "public"."routes_2026_02_19_13_00" TO "authenticated";
GRANT ALL ON TABLE "public"."routes_2026_02_19_13_00" TO "service_role";



GRANT ALL ON TABLE "public"."routes_2026_02_28_20_06" TO "anon";
GRANT ALL ON TABLE "public"."routes_2026_02_28_20_06" TO "authenticated";
GRANT ALL ON TABLE "public"."routes_2026_02_28_20_06" TO "service_role";



GRANT ALL ON TABLE "public"."rpt_branches" TO "anon";
GRANT ALL ON TABLE "public"."rpt_branches" TO "authenticated";
GRANT ALL ON TABLE "public"."rpt_branches" TO "service_role";



GRANT ALL ON TABLE "public"."rpt_merchants" TO "anon";
GRANT ALL ON TABLE "public"."rpt_merchants" TO "authenticated";
GRANT ALL ON TABLE "public"."rpt_merchants" TO "service_role";



GRANT ALL ON TABLE "public"."security_events" TO "anon";
GRANT ALL ON TABLE "public"."security_events" TO "authenticated";
GRANT ALL ON TABLE "public"."security_events" TO "service_role";



GRANT ALL ON TABLE "public"."security_events_2026_02_11_14_10" TO "anon";
GRANT ALL ON TABLE "public"."security_events_2026_02_11_14_10" TO "authenticated";
GRANT ALL ON TABLE "public"."security_events_2026_02_11_14_10" TO "service_role";



GRANT ALL ON TABLE "public"."seed_users_import" TO "anon";
GRANT ALL ON TABLE "public"."seed_users_import" TO "authenticated";
GRANT ALL ON TABLE "public"."seed_users_import" TO "service_role";



GRANT ALL ON TABLE "public"."shipment_approvals" TO "anon";
GRANT ALL ON TABLE "public"."shipment_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."shipment_approvals" TO "service_role";



GRANT ALL ON TABLE "public"."shipment_assignment_rules_2026_02_19_17_00" TO "anon";
GRANT ALL ON TABLE "public"."shipment_assignment_rules_2026_02_19_17_00" TO "authenticated";
GRANT ALL ON TABLE "public"."shipment_assignment_rules_2026_02_19_17_00" TO "service_role";



GRANT ALL ON TABLE "public"."shipment_events" TO "anon";
GRANT ALL ON TABLE "public"."shipment_events" TO "authenticated";
GRANT ALL ON TABLE "public"."shipment_events" TO "service_role";



GRANT ALL ON TABLE "public"."shipment_locations" TO "anon";
GRANT ALL ON TABLE "public"."shipment_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."shipment_locations" TO "service_role";



GRANT ALL ON TABLE "public"."shipment_signatures" TO "anon";
GRANT ALL ON TABLE "public"."shipment_signatures" TO "authenticated";
GRANT ALL ON TABLE "public"."shipment_signatures" TO "service_role";



GRANT ALL ON TABLE "public"."shipment_status_history_2026_02_11_14_10" TO "anon";
GRANT ALL ON TABLE "public"."shipment_status_history_2026_02_11_14_10" TO "authenticated";
GRANT ALL ON TABLE "public"."shipment_status_history_2026_02_11_14_10" TO "service_role";



GRANT ALL ON TABLE "public"."shipment_status_history_2026_02_17_18_40" TO "anon";
GRANT ALL ON TABLE "public"."shipment_status_history_2026_02_17_18_40" TO "authenticated";
GRANT ALL ON TABLE "public"."shipment_status_history_2026_02_17_18_40" TO "service_role";



GRANT ALL ON TABLE "public"."shipment_steps" TO "anon";
GRANT ALL ON TABLE "public"."shipment_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."shipment_steps" TO "service_role";



GRANT ALL ON TABLE "public"."shipment_tracking_2026_02_19_13_00" TO "anon";
GRANT ALL ON TABLE "public"."shipment_tracking_2026_02_19_13_00" TO "authenticated";
GRANT ALL ON TABLE "public"."shipment_tracking_2026_02_19_13_00" TO "service_role";



GRANT ALL ON TABLE "public"."shipment_workflow_states_2026_02_19_17_00" TO "anon";
GRANT ALL ON TABLE "public"."shipment_workflow_states_2026_02_19_17_00" TO "authenticated";
GRANT ALL ON TABLE "public"."shipment_workflow_states_2026_02_19_17_00" TO "service_role";



GRANT ALL ON TABLE "public"."shipments_2026_02_11_14_10" TO "anon";
GRANT ALL ON TABLE "public"."shipments_2026_02_11_14_10" TO "authenticated";
GRANT ALL ON TABLE "public"."shipments_2026_02_11_14_10" TO "service_role";



GRANT ALL ON TABLE "public"."shipments_2026_02_17_18_40" TO "anon";
GRANT ALL ON TABLE "public"."shipments_2026_02_17_18_40" TO "authenticated";
GRANT ALL ON TABLE "public"."shipments_2026_02_17_18_40" TO "service_role";



GRANT ALL ON TABLE "public"."shipments_2026_02_19_13_00" TO "anon";
GRANT ALL ON TABLE "public"."shipments_2026_02_19_13_00" TO "authenticated";
GRANT ALL ON TABLE "public"."shipments_2026_02_19_13_00" TO "service_role";



GRANT ALL ON TABLE "public"."shipments_2026_02_28_20_06" TO "anon";
GRANT ALL ON TABLE "public"."shipments_2026_02_28_20_06" TO "authenticated";
GRANT ALL ON TABLE "public"."shipments_2026_02_28_20_06" TO "service_role";



GRANT ALL ON TABLE "public"."shipping_calculations_2026_02_18_18_00" TO "anon";
GRANT ALL ON TABLE "public"."shipping_calculations_2026_02_18_18_00" TO "authenticated";
GRANT ALL ON TABLE "public"."shipping_calculations_2026_02_18_18_00" TO "service_role";



GRANT ALL ON TABLE "public"."staff_assignments" TO "anon";
GRANT ALL ON TABLE "public"."staff_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."staff_directory" TO "anon";
GRANT ALL ON TABLE "public"."staff_directory" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_directory" TO "service_role";



GRANT ALL ON TABLE "public"."supply_chain_events" TO "anon";
GRANT ALL ON TABLE "public"."supply_chain_events" TO "authenticated";
GRANT ALL ON TABLE "public"."supply_chain_events" TO "service_role";



GRANT ALL ON TABLE "public"."support_ticket_messages_2026_02_11_14_10" TO "anon";
GRANT ALL ON TABLE "public"."support_ticket_messages_2026_02_11_14_10" TO "authenticated";
GRANT ALL ON TABLE "public"."support_ticket_messages_2026_02_11_14_10" TO "service_role";



GRANT ALL ON TABLE "public"."support_tickets" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."support_tickets_2026_02_11_14_10" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets_2026_02_11_14_10" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets_2026_02_11_14_10" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings_2026_02_11_14_10" TO "anon";
GRANT ALL ON TABLE "public"."system_settings_2026_02_11_14_10" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings_2026_02_11_14_10" TO "service_role";



GRANT ALL ON TABLE "public"."tamper_tags" TO "anon";
GRANT ALL ON TABLE "public"."tamper_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tamper_tags" TO "service_role";



GRANT ALL ON TABLE "public"."tamper_tags_2026_02_11_14_10" TO "anon";
GRANT ALL ON TABLE "public"."tamper_tags_2026_02_11_14_10" TO "authenticated";
GRANT ALL ON TABLE "public"."tamper_tags_2026_02_11_14_10" TO "service_role";



GRANT ALL ON TABLE "public"."tamper_tags_2026_02_17_18_40" TO "anon";
GRANT ALL ON TABLE "public"."tamper_tags_2026_02_17_18_40" TO "authenticated";
GRANT ALL ON TABLE "public"."tamper_tags_2026_02_17_18_40" TO "service_role";



GRANT ALL ON TABLE "public"."tariffs" TO "anon";
GRANT ALL ON TABLE "public"."tariffs" TO "authenticated";
GRANT ALL ON TABLE "public"."tariffs" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."townships_2026_02_18_18_00" TO "anon";
GRANT ALL ON TABLE "public"."townships_2026_02_18_18_00" TO "authenticated";
GRANT ALL ON TABLE "public"."townships_2026_02_18_18_00" TO "service_role";



GRANT ALL ON TABLE "public"."tracking_events" TO "anon";
GRANT ALL ON TABLE "public"."tracking_events" TO "authenticated";
GRANT ALL ON TABLE "public"."tracking_events" TO "service_role";



GRANT ALL ON TABLE "public"."tracking_events_2026_02_28_20_06" TO "anon";
GRANT ALL ON TABLE "public"."tracking_events_2026_02_28_20_06" TO "authenticated";
GRANT ALL ON TABLE "public"."tracking_events_2026_02_28_20_06" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."transactions_2026_02_19_13_00" TO "anon";
GRANT ALL ON TABLE "public"."transactions_2026_02_19_13_00" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions_2026_02_19_13_00" TO "service_role";



GRANT ALL ON TABLE "public"."trusted_merchants" TO "anon";
GRANT ALL ON TABLE "public"."trusted_merchants" TO "authenticated";
GRANT ALL ON TABLE "public"."trusted_merchants" TO "service_role";



GRANT ALL ON TABLE "public"."user_activity_2026_02_11_14_10" TO "anon";
GRANT ALL ON TABLE "public"."user_activity_2026_02_11_14_10" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity_2026_02_11_14_10" TO "service_role";



GRANT ALL ON TABLE "public"."user_authorities" TO "anon";
GRANT ALL ON TABLE "public"."user_authorities" TO "authenticated";
GRANT ALL ON TABLE "public"."user_authorities" TO "service_role";



GRANT ALL ON TABLE "public"."user_branch_assignments" TO "anon";
GRANT ALL ON TABLE "public"."user_branch_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."user_branch_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."user_credentials" TO "anon";
GRANT ALL ON TABLE "public"."user_credentials" TO "authenticated";
GRANT ALL ON TABLE "public"."user_credentials" TO "service_role";



GRANT ALL ON TABLE "public"."user_permission_grants" TO "anon";
GRANT ALL ON TABLE "public"."user_permission_grants" TO "authenticated";
GRANT ALL ON TABLE "public"."user_permission_grants" TO "service_role";



GRANT ALL ON TABLE "public"."user_permissions" TO "anon";
GRANT ALL ON TABLE "public"."user_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_scopes" TO "anon";
GRANT ALL ON TABLE "public"."user_scopes" TO "authenticated";
GRANT ALL ON TABLE "public"."user_scopes" TO "service_role";



GRANT ALL ON TABLE "public"."user_sessions" TO "anon";
GRANT ALL ON TABLE "public"."user_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."user_sessions_2026_02_11_14_10" TO "anon";
GRANT ALL ON TABLE "public"."user_sessions_2026_02_11_14_10" TO "authenticated";
GRANT ALL ON TABLE "public"."user_sessions_2026_02_11_14_10" TO "service_role";



GRANT ALL ON TABLE "public"."user_sessions_2026_02_28_20_06" TO "anon";
GRANT ALL ON TABLE "public"."user_sessions_2026_02_28_20_06" TO "authenticated";
GRANT ALL ON TABLE "public"."user_sessions_2026_02_28_20_06" TO "service_role";



GRANT ALL ON TABLE "public"."users_2026_02_11_14_10" TO "anon";
GRANT ALL ON TABLE "public"."users_2026_02_11_14_10" TO "authenticated";
GRANT ALL ON TABLE "public"."users_2026_02_11_14_10" TO "service_role";



GRANT ALL ON TABLE "public"."users_2026_02_17_18_40" TO "anon";
GRANT ALL ON TABLE "public"."users_2026_02_17_18_40" TO "authenticated";
GRANT ALL ON TABLE "public"."users_2026_02_17_18_40" TO "service_role";



GRANT ALL ON TABLE "public"."users_2026_02_28_20_06" TO "anon";
GRANT ALL ON TABLE "public"."users_2026_02_28_20_06" TO "authenticated";
GRANT ALL ON TABLE "public"."users_2026_02_28_20_06" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_locations" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_locations" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_tracking_2026_02_19_13_00" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_tracking_2026_02_19_13_00" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_tracking_2026_02_19_13_00" TO "service_role";



GRANT ALL ON TABLE "public"."vehicles" TO "anon";
GRANT ALL ON TABLE "public"."vehicles" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicles" TO "service_role";



GRANT ALL ON TABLE "public"."vehicles_2026_02_18_17_00" TO "anon";
GRANT ALL ON TABLE "public"."vehicles_2026_02_18_17_00" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicles_2026_02_18_17_00" TO "service_role";



GRANT ALL ON TABLE "public"."vehicles_2026_02_19_13_00" TO "anon";
GRANT ALL ON TABLE "public"."vehicles_2026_02_19_13_00" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicles_2026_02_19_13_00" TO "service_role";



GRANT ALL ON TABLE "public"."vehicles_2026_02_28_20_06" TO "anon";
GRANT ALL ON TABLE "public"."vehicles_2026_02_28_20_06" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicles_2026_02_28_20_06" TO "service_role";



GRANT ALL ON TABLE "public"."wallet_transactions" TO "anon";
GRANT ALL ON TABLE "public"."wallet_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."wallet_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."warehouse_inventory" TO "anon";
GRANT ALL ON TABLE "public"."warehouse_inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."warehouse_inventory" TO "service_role";



GRANT ALL ON TABLE "public"."warehouse_scans" TO "anon";
GRANT ALL ON TABLE "public"."warehouse_scans" TO "authenticated";
GRANT ALL ON TABLE "public"."warehouse_scans" TO "service_role";



GRANT ALL ON TABLE "public"."warehouse_tasks" TO "anon";
GRANT ALL ON TABLE "public"."warehouse_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."warehouse_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."warehouses" TO "anon";
GRANT ALL ON TABLE "public"."warehouses" TO "authenticated";
GRANT ALL ON TABLE "public"."warehouses" TO "service_role";



GRANT ALL ON TABLE "public"."warehouses_2026_02_28_20_06" TO "anon";
GRANT ALL ON TABLE "public"."warehouses_2026_02_28_20_06" TO "authenticated";
GRANT ALL ON TABLE "public"."warehouses_2026_02_28_20_06" TO "service_role";



GRANT ALL ON TABLE "public"."way_plan_stops" TO "anon";
GRANT ALL ON TABLE "public"."way_plan_stops" TO "authenticated";
GRANT ALL ON TABLE "public"."way_plan_stops" TO "service_role";



GRANT ALL ON TABLE "public"."way_plans" TO "anon";
GRANT ALL ON TABLE "public"."way_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."way_plans" TO "service_role";



GRANT ALL ON TABLE "public"."way_records" TO "anon";
GRANT ALL ON TABLE "public"."way_records" TO "authenticated";
GRANT ALL ON TABLE "public"."way_records" TO "service_role";



GRANT ALL ON TABLE "public"."waybill_counters" TO "anon";
GRANT ALL ON TABLE "public"."waybill_counters" TO "authenticated";
GRANT ALL ON TABLE "public"."waybill_counters" TO "service_role";



GRANT ALL ON TABLE "public"."waybill_print_items" TO "anon";
GRANT ALL ON TABLE "public"."waybill_print_items" TO "authenticated";
GRANT ALL ON TABLE "public"."waybill_print_items" TO "service_role";



GRANT ALL ON TABLE "public"."waybill_print_jobs" TO "anon";
GRANT ALL ON TABLE "public"."waybill_print_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."waybill_print_jobs" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







