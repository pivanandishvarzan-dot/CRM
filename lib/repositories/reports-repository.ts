import { isDemoMode, prisma } from '@/lib/prisma';
import type { DataActor } from '@/lib/data-scope';
import { applicantScope, contractScope, followupScope, propertyScope } from '@/lib/data-scope';

const STAGES = ['LEAD','CONTACTED','QUALIFIED','MATCHED','VISIT','NEGOTIATION','CONTRACT','WON'] as const;

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export async function getAdvancedReports(actor: DataActor, from?: Date, to?: Date) {
  if (isDemoMode) {
    const funnel = STAGES.map((stage, i) => ({ stage, count: Math.max(0, 16 - i * 2), conversionFromPrevious: i === 0 ? 100 : Math.max(10, 100 - i * 8) }));
    return {
      range: { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null },
      kpis: { avgDaysToContract: 12, staleProperties: 4, totalValue: 248.5, totalCommission: 2.48 },
      funnel,
      monthly: [
        { month: '2026-04', value: 18, commission: .18, contracts: 2 },
        { month: '2026-05', value: 24, commission: .24, contracts: 3 },
        { month: '2026-06', value: 31, commission: .31, contracts: 4 },
        { month: '2026-07', value: 27, commission: .27, contracts: 3 },
        { month: '2026-08', value: 42, commission: .42, contracts: 5 },
      ],
      agents: [{ name: 'مشاور نمونه', applicants: 12, contracts: 4, conversionRate: 33, value: 42, commission: .42 }],
      staleProperties: [],
    };
  }

  const dateFilter = from || to ? { gte: from, lte: to } : undefined;
  const [applicants, contracts, properties, followups] = await Promise.all([
    prisma.applicant.findMany({ where: { ...applicantScope(actor), ...(dateFilter && { createdAt: dateFilter }) }, include: { agent: true } }),
    prisma.contract.findMany({ where: { ...contractScope(actor), ...(dateFilter && { contractDate: dateFilter }) }, include: { agent: true, applicant: true } }),
    prisma.property.findMany({ where: { ...propertyScope(actor), ...(dateFilter && { createdAt: dateFilter }) }, include: { agent: true, followups: { orderBy: { scheduledAt: 'desc' }, take: 1 } } }),
    prisma.followup.findMany({ where: { ...followupScope(actor), ...(dateFilter && { createdAt: dateFilter }) }, select: { propertyId: true, scheduledAt: true } }),
  ]);

  const funnel = STAGES.map((stage, index) => {
    const count = applicants.filter(a => a.status === stage).length;
    const prev = index === 0 ? count : applicants.filter(a => a.status === STAGES[index - 1]).length;
    return { stage, count, conversionFromPrevious: index === 0 ? 100 : prev ? Math.round((count / prev) * 100) : 0 };
  });

  const monthlyMap = new Map<string, { month: string; value: number; commission: number; contracts: number }>();
  for (const contract of contracts) {
    const key = monthKey(contract.contractDate);
    const row = monthlyMap.get(key) || { month: key, value: 0, commission: 0, contracts: 0 };
    row.value += Number(contract.amount); row.commission += Number(contract.commission); row.contracts += 1;
    monthlyMap.set(key, row);
  }

  const agentMap = new Map<string, { name: string; applicants: number; contracts: number; value: number; commission: number }>();
  for (const applicant of applicants) {
    const row = agentMap.get(applicant.agentId) || { name: applicant.agent.name, applicants: 0, contracts: 0, value: 0, commission: 0 };
    row.applicants += 1; agentMap.set(applicant.agentId, row);
  }
  for (const contract of contracts) {
    const row = agentMap.get(contract.agentId) || { name: contract.agent.name, applicants: 0, contracts: 0, value: 0, commission: 0 };
    row.contracts += 1; row.value += Number(contract.amount); row.commission += Number(contract.commission); agentMap.set(contract.agentId, row);
  }

  const now = new Date();
  const staleProperties = properties.filter(p => {
    const last = p.followups[0]?.scheduledAt ?? p.createdAt;
    return now.getTime() - last.getTime() > 1000 * 60 * 60 * 24 * 14;
  }).map(p => ({ id: p.id, title: p.title, code: p.code, agent: p.agent.name, lastActivityAt: p.followups[0]?.scheduledAt ?? p.createdAt }));

  const completedContracts = contracts.filter(c => ['COMPLETED','SIGNED','WON','تکمیل شده','امضا شده'].includes(c.status));
  const avgDaysToContract = completedContracts.length ? Math.round(completedContracts.reduce((sum, c) => sum + Math.max(0, (c.contractDate.getTime() - c.applicant.createdAt.getTime()) / 86400000), 0) / completedContracts.length) : 0;

  return {
    range: { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null },
    kpis: {
      avgDaysToContract,
      staleProperties: staleProperties.length,
      totalValue: contracts.reduce((s, c) => s + Number(c.amount), 0),
      totalCommission: contracts.reduce((s, c) => s + Number(c.commission), 0),
    },
    funnel,
    monthly: Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month)),
    agents: Array.from(agentMap.values()).map(x => ({ ...x, conversionRate: x.applicants ? Math.round((x.contracts / x.applicants) * 100) : 0 })).sort((a,b) => b.value - a.value),
    staleProperties,
  };
}
