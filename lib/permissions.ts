export type Role = 'ADMIN' | 'AGENCY_MANAGER' | 'AGENT' | string;

export type Permission =
  | 'MANAGE_USERS'
  | 'MANAGE_SETTINGS'
  | 'VIEW_REPORTS'
  | 'MANAGE_ALL_PROPERTIES'
  | 'MANAGE_OWN_PROPERTIES'
  | 'MANAGE_ALL_FOLLOWUPS'
  | 'MANAGE_OWN_FOLLOWUPS';

const permissions: Record<string, Permission[]> = {
  ADMIN: [
    'MANAGE_USERS',
    'MANAGE_SETTINGS',
    'VIEW_REPORTS',
    'MANAGE_ALL_PROPERTIES',
    'MANAGE_ALL_FOLLOWUPS'
  ],
  AGENCY_MANAGER: [
    'VIEW_REPORTS',
    'MANAGE_ALL_PROPERTIES',
    'MANAGE_ALL_FOLLOWUPS'
  ],
  AGENT: [
    'MANAGE_OWN_PROPERTIES',
    'MANAGE_OWN_FOLLOWUPS'
  ]
};

export function hasPermission(role: Role | undefined, permission: Permission) {
  if (!role) return false;
  return permissions[role]?.includes(permission) ?? false;
}

export function canAccessRole(role: Role | undefined, allowed: Role[]) {
  return !!role && allowed.includes(role);
}
