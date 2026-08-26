import { hash } from 'bcryptjs';
import { prisma, isDemoMode } from '@/lib/prisma';
import type { DataActor } from '@/lib/data-scope';

function agencyId(actor: DataActor) {
  if (actor.role === 'AGENT' || !actor.agencyId) throw new Error('FORBIDDEN');
  return actor.agencyId;
}

export async function listTeam(actor: DataActor) {
  if (isDemoMode) return [
    { id: 'demo-manager', name: 'مهدی اکبری', email: 'manager@demo.local', role: 'AGENCY_MANAGER', active: true, createdAt: new Date().toISOString(), _count: { properties: 0, applicants: 0, followups: 0, contracts: 0 } },
    { id: 'demo-agent', name: 'مشاور نمونه', email: 'agent@demo.local', role: 'AGENT', active: true, createdAt: new Date().toISOString(), _count: { properties: 3, applicants: 4, followups: 5, contracts: 1 } },
  ];
  return prisma.user.findMany({
    where: { agencyId: agencyId(actor), role: { in: ['AGENCY_MANAGER', 'AGENT'] } },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true, _count: { select: { properties: true, applicants: true, followups: true, contracts: true } } },
    orderBy: [{ active: 'desc' }, { createdAt: 'asc' }],
  });
}

export async function createTeamUser(input: { name: string; email: string; password: string; role: 'AGENCY_MANAGER'|'AGENT' }, actor: DataActor) {
  if (isDemoMode) return { id: `demo-${Date.now()}`, ...input, password: undefined, active: true, createdAt: new Date().toISOString() };
  const aid = agencyId(actor);
  if (input.password.length < 8) throw new Error('PASSWORD_TOO_SHORT');
  const passwordHash = await hash(input.password, 12);
  return prisma.user.create({ data: { name: input.name, email: input.email.toLowerCase(), passwordHash, role: input.role, agencyId: aid, active: true }, select: { id: true, name: true, email: true, role: true, active: true, createdAt: true } });
}

export async function updateTeamUser(id: string, input: { active?: boolean; role?: 'AGENCY_MANAGER'|'AGENT'; password?: string }, actor: DataActor) {
  if (isDemoMode) return { id, ...input };
  const aid = agencyId(actor);
  const target = await prisma.user.findFirst({ where: { id, agencyId: aid, role: { in: ['AGENCY_MANAGER', 'AGENT'] } }, select: { id: true, role: true } });
  if (!target) throw new Error('NOT_FOUND');
  if (id === actor.id && input.active === false) throw new Error('CANNOT_DISABLE_SELF');
  if (input.password !== undefined && input.password.length < 8) throw new Error('PASSWORD_TOO_SHORT');
  return prisma.user.update({ where: { id }, data: { ...(input.active !== undefined && { active: input.active }), ...(input.role && { role: input.role }), ...(input.password && { passwordHash: await hash(input.password, 12) }) }, select: { id: true, name: true, email: true, role: true, active: true, createdAt: true } });
}
