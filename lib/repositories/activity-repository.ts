import { isDemoMode, prisma } from '@/lib/prisma';
import type { DataActor } from '@/lib/data-scope';
import { applicantScope } from '@/lib/data-scope';

export async function getApplicantTimeline(id: string, actor: DataActor) {
  if (isDemoMode) return [];
  const applicant = await prisma.applicant.findFirst({ where: { id, ...applicantScope(actor) }, select: { id: true } });
  if (!applicant) throw new Error('NOT_FOUND');
  return prisma.applicantStageHistory.findMany({ where: { applicantId: id }, include: { changedBy: { select: { id: true, name: true } } }, orderBy: { changedAt: 'desc' } });
}

export async function getRecentActivities(actor: DataActor, take = 50) {
  if (isDemoMode) return [];
  const allowedApplicantIds = await prisma.applicant.findMany({ where: applicantScope(actor), select: { id: true } });
  const ids = allowedApplicantIds.map(x => x.id);
  return prisma.activityLog.findMany({ where: actor.role === 'SYSTEM_ADMIN' ? undefined : { OR: [{ actorId: actor.id }, { entityType: 'APPLICANT', entityId: { in: ids } }] }, include: { actor: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: 'desc' }, take: Math.min(Math.max(take, 1), 100) });
}

export async function getPipelineHistoryMetrics(actor: DataActor, from?: Date, to?: Date) {
  if (isDemoMode) return { transitions: [], averageDaysByStage: [] };
  const applicants = await prisma.applicant.findMany({ where: applicantScope(actor), select: { id: true } });
  const ids = applicants.map(x => x.id);
  const history = await prisma.applicantStageHistory.findMany({ where: { applicantId: { in: ids }, ...(from || to ? { changedAt: { gte: from, lte: to } } : {}) }, orderBy: [{ applicantId: 'asc' }, { changedAt: 'asc' }] });
  const transitionMap = new Map<string, number>();
  const durationMap = new Map<string, { totalMs: number; count: number }>();
  const previous = new Map<string, typeof history[number]>();
  for (const item of history) {
    if (item.fromStage) {
      const key = `${item.fromStage}->${item.toStage}`;
      transitionMap.set(key, (transitionMap.get(key) || 0) + 1);
    }
    const prev = previous.get(item.applicantId);
    if (prev && item.fromStage === prev.toStage) {
      const row = durationMap.get(prev.toStage) || { totalMs: 0, count: 0 };
      row.totalMs += item.changedAt.getTime() - prev.changedAt.getTime(); row.count += 1; durationMap.set(prev.toStage, row);
    }
    previous.set(item.applicantId, item);
  }
  return {
    transitions: Array.from(transitionMap, ([transition, count]) => ({ transition, count })),
    averageDaysByStage: Array.from(durationMap, ([stage, row]) => ({ stage, days: Math.round((row.totalMs / row.count / 86400000) * 10) / 10 })),
  };
}
