import { auth } from '@/auth';

export type CRMRole = 'SYSTEM_ADMIN' | 'AGENCY_MANAGER' | 'AGENT';

export const permissions = {
  manageAgency: ['SYSTEM_ADMIN', 'AGENCY_MANAGER'],
  viewReports: ['SYSTEM_ADMIN', 'AGENCY_MANAGER'],
  manageContracts: ['SYSTEM_ADMIN', 'AGENCY_MANAGER', 'AGENT'],
  manageCRM: ['SYSTEM_ADMIN', 'AGENCY_MANAGER', 'AGENT'],
} satisfies Record<string, CRMRole[]>;

export async function currentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function requireRole(allowed: CRMRole[]) {
  const user = await requireUser();
  if (!allowed.includes(user.role)) throw new Error('FORBIDDEN');
  return user;
}

export function can(role: CRMRole | undefined, allowed: CRMRole[]) {
  return Boolean(role && allowed.includes(role));
}
