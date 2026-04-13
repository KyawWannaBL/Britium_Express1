# Enhanced RBAC Summary

This Supabase migration replaces the old Firebase-oriented security plan.

## Replacements
- `firestore.rules` -> `supabase/migrations/20260413010000_rbac_foundation.sql`
- `enhancedFirebaseServices.ts` -> `src/lib/enhancedSupabaseServices.ts`

## Delivered
- 50+ screen codes
- 20+ API scopes
- 5 authority levels
- 5 data scopes
- audit log foundation
- approval request foundation
- role-aware auth hook
- role-aware service helpers

## Immediate next steps
- create missing domain tables if needed
- wire `useEnhancedAuth` into route guards
- move page-level checks to `hasScreenPermission`
- add RLS policies table by table
