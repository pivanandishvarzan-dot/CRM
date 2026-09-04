import { auth } from '@/auth';
import { hasPermission, type Permission } from '@/lib/permissions';

export async function requirePermission(permission: Permission) {
  const session = await auth();
  const role = session?.user?.role;

  if (!session?.user || !role || !hasPermission(role, permission)) {
    throw new Error('FORBIDDEN');
  }

  return session;
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
