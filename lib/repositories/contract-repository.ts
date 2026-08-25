import { contracts as demoContracts } from '@/lib/demo-data';
import { isDemoMode, prisma } from '@/lib/prisma';

export type ContractInput = {
  number?: string;
  type: string;
  amount: number;
  commission: number;
  contractDate: string;
  status?: string;
  notes?: string;
  propertyId?: string;
  applicantId?: string;
  agentId?: string;
};

export async function listContracts() {
  if (isDemoMode) return demoContracts.map((c, i) => ({ ...c, id: String(c.id), number: String(c.id), amountValue: Number(String(c.amount).replace(/[^\d.]/g, '')) || 0, commissionValue: Number(String(c.commission).replace(/[^\d.]/g, '')) || 0, property: { id: String(i + 1), title: c.property }, applicant: { id: String(i + 1), name: c.party }, agent: { id: `demo-agent-${i + 1}`, name: ['سارا احمدی','امیر رضایی','نگار محمدی','علی نادری'][i % 4] }, contractDate: c.date }));
  return prisma.contract.findMany({ include: { property: true, applicant: true, agent: true }, orderBy: { contractDate: 'desc' } });
}

export async function createContract(input: ContractInput) {
  if (isDemoMode) return { id: `demo-${Date.now()}`, number: input.number || `Q-${Date.now()}`, ...input };
  if (!input.propertyId || !input.applicantId || !input.agentId) throw new Error('ملک، متقاضی و مشاور برای قرارداد الزامی هستند.');
  return prisma.contract.create({ data: { number: input.number || `Q-${Date.now()}`, type: input.type, amount: input.amount, commission: input.commission, contractDate: new Date(input.contractDate), status: input.status || 'DRAFT', notes: input.notes, propertyId: input.propertyId, applicantId: input.applicantId, agentId: input.agentId }, include: { property: true, applicant: true, agent: true } });
}
