export type AppRole = 'SYSTEM_ADMIN' | 'AGENCY_MANAGER' | 'AGENT';

export type Permission =
  | 'MANAGE_USERS'
  | 'MANAGE_SETTINGS'
  | 'VIEW_REPORTS'
  | 'MANAGE_CONTRACTS'
  | 'MANAGE_ALL_PROPERTIES'
  | 'MANAGE_OWN_PROPERTIES'
  | 'MANAGE_ALL_FOLLOWUPS'
  | 'MANAGE_OWN_FOLLOWUPS';

const permissions: Record<AppRole, Permission[]> = {
  SYSTEM_ADMIN: [
    'MANAGE_USERS',
    'MANAGE_SETTINGS',
    'VIEW_REPORTS',
    'MANAGE_CONTRACTS',
    'MANAGE_ALL_PROPERTIES',
    'MANAGE_ALL_FOLLOWUPS'
  ],
  AGENCY_MANAGER: [
    'MANAGE_USERS',
    'MANAGE_SETTINGS',
    'VIEW_REPORTS',
    'MANAGE_CONTRACTS',
    'MANAGE_ALL_PROPERTIES',
    'MANAGE_ALL_FOLLOWUPS'
  ],
  AGENT: [
    'MANAGE_OWN_PROPERTIES',
    'MANAGE_OWN_FOLLOWUPS'
  ]
};

export function hasPermission(role: AppRole | undefined, permission: Permission) {
  if (!role) return false;
  return permissions[role]?.includes(permission) ?? false;
}

export function canAccessRole(role: AppRole | undefined, allowed: AppRole[]) {
  return !!role && allowed.includes(role);
}
