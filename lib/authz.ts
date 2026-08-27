import { auth } from '@/auth';
import { prisma, isDemoMode } from '@/lib/prisma';

export type CRMRole = 'SYSTEM_ADMIN' | 'AGENCY_MANAGER' | 'AGENT';

export const permissions = {
  manageAgency: ['SYSTEM_ADMIN', 'AGENCY_MANAGER'],
  viewReports: ['SYSTEM_ADMIN', 'AGENCY_MANAGER'],
  manageContracts: ['SYSTEM_ADMIN', 'AGENCY_MANAGER', 'AGENT'],
  manageCRM: ['SYSTEM_ADMIN', 'AGENCY_MANAGER', 'AGENT'],
} satisfies Record<string, CRMRole[]>;

export async function currentUser() {
  const session = await auth();
  const user = session?.user ?? null;
  if (!user || isDemoMode) return user;
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { active: true, sessionVersion: true, role: true, agencyId: true },
  });
  if (!dbUser?.active) return null;
  if ((user.sessionVersion ?? 1) !== dbUser.sessionVersion) return null;
  return { ...user, role: dbUser.role, agencyId: dbUser.agencyId, sessionVersion: dbUser.sessionVersion };
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error('UNAUTHORIZED');
  if (!user.agencyId) throw new Error('FORBIDDEN');
  return { ...user, agencyId: user.agencyId };
}

export async function requireRole(allowed: CRMRole[]) {
  const user = await requireUser();
  if (!allowed.includes(user.role)) throw new Error('FORBIDDEN');
  return user;
}

export async function requireManager() {
  return requireRole(['SYSTEM_ADMIN', 'AGENCY_MANAGER']);
}

export function can(role: CRMRole | undefined, allowed: CRMRole[]) {
  return Boolean(role && allowed.includes(role));
}
