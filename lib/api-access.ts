import { auth } from '@/auth';
import { isDemoMode } from '@/lib/data-mode';
import { hasPermission, type AppRole, type Permission } from '@/lib/permissions';

export class ApiAccessError extends Error {
  constructor(public status: 401 | 403, message: string) {
    super(message);
    this.name = 'ApiAccessError';
  }
}

const demoSession = {
  user: {
    id: 'demo-manager',
    name: 'مدیر آژانس',
    email: 'manager@demo.local',
    role: 'AGENCY_MANAGER' as AppRole,
  },
};

export async function requireApiPermission(permission: Permission) {
  if (isDemoMode()) return demoSession;

  const session = await auth();
  if (!session?.user) throw new ApiAccessError(401, 'نیاز به ورود دارید');

  const role = session.user.role as AppRole | undefined;
  if (!role || !hasPermission(role, permission)) throw new ApiAccessError(403, 'دسترسی غیرمجاز');

  return session;
}

export async function requireAnyApiPermission(permissions: Permission[]) {
  if (isDemoMode()) return demoSession;

  const session = await auth();
  if (!session?.user) throw new ApiAccessError(401, 'نیاز به ورود دارید');

  const role = session.user.role as AppRole | undefined;
  if (!role || !permissions.some(permission => hasPermission(role, permission))) {
    throw new ApiAccessError(403, 'دسترسی غیرمجاز');
  }

  return session;
}

export function apiAccessStatus(error: unknown, fallback = 500) {
  return error instanceof ApiAccessError ? error.status : fallback;
}

export function apiAccessMessage(error: unknown, fallback: string) {
  return error instanceof ApiAccessError ? error.message : fallback;
}

export async function getCurrentApiUser() {
  if (isDemoMode()) return demoSession.user;
  const session = await auth();
  return session?.user ?? null;
}
