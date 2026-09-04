import { auth } from '@/auth';
import { hasPermission, type Permission } from './permissions';

export async function requirePermission(permission: Permission) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session?.user || !role || !hasPermission(role, permission)) {
    throw new Error('دسترسی غیرمجاز');
  }

  return session.user;
}
