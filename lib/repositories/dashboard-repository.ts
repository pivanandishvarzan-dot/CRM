import { isDemoMode, prisma } from '@/lib/prisma';
import { agents, applicants, contracts, followups, properties } from '@/lib/demo-data';

const PIPELINE = ['LEAD','CONTACTED','QUALIFIED','MATCHED','VISIT','NEGOTIATION','CONTRACT','WON'];

function demoData() {
  const pipelineCounts = PIPELINE.map((stage, index) => ({
    stage,
    count: Math.max(0, applicants.length - index),
  }));
  return {
    kpis: {
      properties: properties.length,
      activeProperties: properties.filter(x => x.status === 'فعال').length,
      applicants: applicants.length,
      urgentApplicants: applicants.filter(x => x.urgency === 'فوری').length,
      todayFollowups: followups.filter(x => x.time.includes('امروز')).length,
      overdueFollowups: followups.filter(x => x.priority === 'عقب‌افتاده').length,
      visits: followups.filter(x => x.type === 'بازدید').length,
      negotiations: properties.filter(x => x.status === 'در مذاکره').length,
      contracts: contracts.length,
      completedContracts: contracts.filter(x => x.status === 'تکمیل شده').length,
      totalContractValue: contracts.reduce((sum, c) => sum + Number(String(c.amount).replace(/[^0-9.]/g, '')), 0),
      totalCommission: contracts.reduce((sum, c) => sum + Number(String(c.commission).replace(/[^0-9.]/g, '')), 0),
      conversionRate: applicants.length ? Math.round((contracts.length / applicants.length) * 100) : 0,
    },
    pipeline: pipelineCounts,
    recentProperties: properties.slice(0, 5),
    urgentFollowups: followups.slice(0, 5).map(x => ({ id: String(x.id), title: x.title, scheduledAt: new Date().toISOString(), priority: x.priority === 'فوری' ? 4 : 2, assignee: { name: x.agent } })),
    agents: agents.map(x => ({ name: x.name, contracts: x.deals, value: Number(x.value), commission: 0, conversionRate: x.rate })),
  };
}

export async function getDashboardAnalytics() {
  if (isDemoMode) return demoData();

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
  const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999);

  const [
    propertyRows,
    applicantRows,
    followupRows,
    contractRows,
    recentProperties,
  ] = await Promise.all([
    prisma.property.findMany({ select: { status: true } }),
    prisma.applicant.findMany({ select: { status: true, urgency: true, agentId: true, agent: { select: { name: true } } } }),
    prisma.followup.findMany({
      select: { id: true, type: true, completed: true, scheduledAt: true, priority: true, title: true, assignee: { select: { name: true } } },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.contract.findMany({
      include: { agent: { select: { id: true, name: true } } },
      orderBy: { contractDate: 'desc' },
    }),
    prisma.property.findMany({
      take: 5,
      include: { owner: true, agent: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const pipeline = PIPELINE.map(stage => ({ stage, count: applicantRows.filter(x => x.status === stage).length }));
  const todayFollowups = followupRows.filter(x => x.scheduledAt >= todayStart && x.scheduledAt <= todayEnd);
  const overdueFollowups = followupRows.filter(x => !x.completed && x.scheduledAt < todayStart);
  const urgentFollowups = followupRows.filter(x => !x.completed && (x.priority >= 3 || x.scheduledAt < todayStart)).slice(0, 5);
  const completedContracts = contractRows.filter(x => ['COMPLETED','SIGNED','WON','تکمیل شده','امضا شده'].includes(x.status));
  const totalContractValue = contractRows.reduce((sum, x) => sum + Number(x.amount), 0);
  const totalCommission = contractRows.reduce((sum, x) => sum + Number(x.commission), 0);

  const agentMap = new Map<string, { name: string; contracts: number; value: number; commission: number; applicants: number }>();
  for (const applicant of applicantRows) {
    const current = agentMap.get(applicant.agentId) || { name: applicant.agent.name, contracts: 0, value: 0, commission: 0, applicants: 0 };
    current.applicants += 1;
    agentMap.set(applicant.agentId, current);
  }
  for (const contract of contractRows) {
    const current = agentMap.get(contract.agentId) || { name: contract.agent.name, contracts: 0, value: 0, commission: 0, applicants: 0 };
    current.contracts += 1;
    current.value += Number(contract.amount);
    current.commission += Number(contract.commission);
    agentMap.set(contract.agentId, current);
  }

  return {
    kpis: {
      properties: propertyRows.length,
      activeProperties: propertyRows.filter(x => x.status === 'ACTIVE').length,
      applicants: applicantRows.length,
      urgentApplicants: applicantRows.filter(x => x.urgency >= 4).length,
      todayFollowups: todayFollowups.length,
      overdueFollowups: overdueFollowups.length,
      visits: followupRows.filter(x => x.type === 'VISIT').length,
      negotiations: applicantRows.filter(x => x.status === 'NEGOTIATION').length,
      contracts: contractRows.length,
      completedContracts: completedContracts.length,
      totalContractValue,
      totalCommission,
      conversionRate: applicantRows.length ? Math.round((completedContracts.length / applicantRows.length) * 100) : 0,
    },
    pipeline,
    recentProperties,
    urgentFollowups,
    agents: Array.from(agentMap.values()).map(x => ({
      ...x,
      conversionRate: x.applicants ? Math.round((x.contracts / x.applicants) * 100) : 0,
    })).sort((a,b) => b.value - a.value),
  };
}
