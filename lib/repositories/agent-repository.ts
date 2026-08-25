import { Role, type Prisma } from '@prisma/client';
import { agents as demoAgents } from '@/lib/demo-data';
import { isDemoMode, prisma } from '@/lib/prisma';
import type { DataActor } from '@/lib/data-scope';

export async function listAgents(actor?: DataActor) {
  if (isDemoMode) {
    if (actor?.role === 'AGENT') return [{ id: actor.id, name: 'مشاور نمونه', email: null, role: 'AGENT' }];
    return demoAgents.map((agent, index) => ({ id: String(index + 1), name: agent.name, email: null, role: index === 0 ? 'AGENCY_MANAGER' : 'AGENT' }));
  }

  const allowedRoles: Role[] = [Role.AGENCY_MANAGER, Role.AGENT];
  const where: Prisma.UserWhereInput = actor?.role === 'AGENT'
    ? { id: actor.id }
    : actor?.role === 'AGENCY_MANAGER'
      ? { agencyId: actor.agencyId ?? '__none__', role: { in: allowedRoles } }
      : { role: { in: allowedRoles } };

  return prisma.user.findMany({ where, select: { id: true, name: true, email: true, role: true }, orderBy: { name: 'asc' } });
}
