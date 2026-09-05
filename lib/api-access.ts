import { auth } from '@/auth';
import { hasPermission, type AppRole, type Permission } from '@/lib/permissions';

export class ApiAccessError extends Error {
  constructor(public status: 401 | 403, message: string) {
    super(message);
    this.name = 'ApiAccessError';
  }
}

export async function requireApiPermission(permission: Permission) {
  const session = await auth();
  if (!session?.user) throw new ApiAccessError(401, 'نیاز به ورود دارید');

  const role = session.user.role as AppRole | undefined;
  if (!role || !hasPermission(role, permission)) throw new ApiAccessError(403, 'دسترسی غیرمجاز');

  return session;
}

export function apiAccessStatus(error: unknown, fallback = 500) {
  return error instanceof ApiAccessError ? error.status : fallback;
}

export async function getCurrentApiUser() {
  const session = await auth();
  return session?.user ?? null;
}
