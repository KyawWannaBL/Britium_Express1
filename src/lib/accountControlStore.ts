import { create } from 'zustand';

// --- Constants ---
export const DEFAULT_ROLES = [
  { id: 'super_admin', label: 'Super Admin' },
  { id: 'admin', label: 'Administrator' },
  { id: 'manager', label: 'Manager' },
  { id: 'supervisor', label: 'Supervisor' },
  { id: 'rider', label: 'Rider' }
];

export const PERMISSIONS = [
  { id: 'all', label: 'Full Access' },
  { id: 'create_delivery', label: 'Create Delivery' },
  { id: 'manage_riders', label: 'Manage Riders' },
  { id: 'view_reports', label: 'View Reports' },
  { id: 'edit_settings', label: 'Edit Settings' }
];

export const STORAGE_KEY = 'britium_admin_config_v1';

// --- Store ---
interface AccountState {
  userRole: string;
  permissions: string[];
  setRole: (role: string) => void;
  setPermissions: (perms: string[]) => void;
}

export const useAccountControlStore = create<AccountState>((set) => ({
  userRole: 'guest',
  permissions: [],
  setRole: (role) => set({ userRole: role }),
  setPermissions: (perms) => set({ permissions: perms }),
}));

// --- Exported Functions for Settings.tsx & CreateDelivery.tsx ---
export const can = (p: string, perms: string[] = []) => perms.includes(p) || perms.includes('all');
export const activeGrantsFor = async (uid: string) => [];
export const approveAuthorityRequest = async (id: string) => ({ success: true });
export const rejectAuthorityRequest = async (id: string) => ({ success: true });
export const requestAuthorityChange = async (uid: string, r: string) => ({ success: true });
export const revokeDirect = async (uid: string, p: string) => ({ success: true });
export const grantDirect = (u: string, p: string) => {};
export const canApplyAuthorityDirect = (role: string) => role?.toLowerCase() === 'super_admin';
export const canRequestAuthorityChange = (role: string) => true;
export const roleIsPrivileged = (role: string) => ['admin', 'super_admin'].includes(role?.toLowerCase());
export const csvParse = (csv: string) => [];
export const csvStringify = (data: any[]) => "";
export const getAccountByEmail = async (e: string) => null;
export const defaultPortalPermissionsForRole = (r: string) => [];
export const ensureAtLeastOneSuperAdminActive = async () => true;
export const bootstrapSignedInUser = async () => ({ success: true });
export const saveStore = async () => ({ success: true });
export const loadStore = () => {};
export const isEmailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export const nowIso = () => new Date().toISOString();
export const pushAudit = (a: string) => {};
export const uuid = () => crypto.randomUUID();
export const safeLower = (v: string) => v?.toLowerCase()?.trim() || "";
