import { contracts as demoContracts } from '@/lib/demo-data';
import { isDemoMode, prisma } from '@/lib/prisma';
import type { DataActor } from '@/lib/data-scope';
import { contractScope, forceAssignedAgent } from '@/lib/data-scope';

export type ContractInput = { number?: string; type: string; amount: number; commission: number; contractDate: string; status?: string; notes?: string; propertyId?: string; applicantId?: string; agentId?: string };

export async function listContracts(actor?: DataActor) {
  if (isDemoMode) return demoContracts.map((c, i) => ({ ...c, id: String(c.id), number: String(c.id), amountValue: Number(String(c.amount).replace(/[^\d.]/g, '')) || 0, commissionValue: Number(String(c.commission).replace(/[^\d.]/g, '')) || 0, property: { id: String(i + 1), title: c.property }, applicant: { id: String(i + 1), name: c.party }, agent: { id: `demo-agent-${i + 1}`, name: ['سارا احمدی','امیر رضایی','نگار محمدی','علی نادری'][i % 4] }, contractDate: c.date }));
  return prisma.contract.findMany({ where: actor ? contractScope(actor) : undefined, include: { property: true, applicant: true, agent: true }, orderBy: { contractDate: 'desc' } });
}

export async function createContract(input: ContractInput, actor?: DataActor) {
  if (isDemoMode) return { id: `demo-${Date.now()}`, number: input.number || `Q-${Date.now()}`, ...input };
  const scoped = actor ? forceAssignedAgent(actor, input) : input;
  if (!scoped.propertyId || !scoped.applicantId || !scoped.agentId) throw new Error('ملک، متقاضی و مشاور برای قرارداد الزامی هستند.');
  if (actor?.role === 'AGENCY_MANAGER') {
    const allowed = await prisma.user.findFirst({ where: { id: scoped.agentId, agencyId: actor.agencyId ?? '__none__' }, select: { id: true } });
    if (!allowed) throw new Error('FORBIDDEN');
  }
  const property = await prisma.property.findFirst({ where: { id: scoped.propertyId, ...(actor ? contractScope(actor).agentId ? { agentId: scoped.agentId } : {} : {}) }, select: { id: true } });
  const applicant = await prisma.applicant.findFirst({ where: { id: scoped.applicantId, agentId: scoped.agentId }, select: { id: true } });
  if (!property || !applicant) throw new Error('FORBIDDEN');
  return prisma.contract.create({ data: { number: scoped.number || `Q-${Date.now()}`, type: scoped.type, amount: scoped.amount, commission: scoped.commission, contractDate: new Date(scoped.contractDate), status: scoped.status || 'DRAFT', notes: scoped.notes, propertyId: scoped.propertyId, applicantId: scoped.applicantId, agentId: scoped.agentId }, include: { property: true, applicant: true, agent: true } });
}
