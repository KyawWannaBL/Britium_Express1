# Britium Express RBAC (Supabase Edition)

This project uses a Supabase-native RBAC foundation.

## Core files
- `src/lib/rbac.ts`
- `src/lib/enhancedSupabaseServices.ts`
- `src/hooks/useEnhancedAuth.tsx`
- `supabase/migrations/20260413010000_rbac_foundation.sql`

## Role hierarchy
- L0: external users
- L1: operational staff
- L2: supervisory staff
- L3: management
- L4: department heads
- L5: audit and system

## Data scopes
- S1 self
- S2 team
- S3 branch / hub
- S4 region
- S5 enterprise-wide

## High-priority rollout
1. Apply the Supabase migration
2. Backfill `profiles.role` and `profiles.role_code`
3. Update protected routes to use `useEnhancedAuth`
4. Wrap all data mutations in `enhancedSupabaseServices`
5. Add audit dashboard and approval screens
