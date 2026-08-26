import { isDemoMode, prisma } from '@/lib/prisma';
import type { DataActor } from '@/lib/data-scope';
import { applicantScope } from '@/lib/data-scope';

export async function getApplicantTimeline(id: string, actor: DataActor) {
  if (isDemoMode) return [];
  const applicant = await prisma.applicant.findFirst({ where: { id, ...applicantScope(actor) }, select: { id: true } });
  if (!applicant) throw new Error('NOT_FOUND');
  return prisma.applicantStageHistory.findMany({ where: { applicantId: id }, include: { changedBy: { select: { id: true, name: true } } }, orderBy: { changedAt: 'desc' } });
}

async function activityScope(actor: DataActor) {
  if (actor.role === 'SYSTEM_ADMIN') return {};
  if (actor.role === 'AGENT') return { actorId: actor.id };
  const users = await prisma.user.findMany({ where: { agencyId: actor.agencyId ?? '__none__' }, select: { id: true } });
  return { actorId: { in: users.map(user => user.id) } };
}

export async function getRecentActivities(actor: DataActor, take = 50, options?: { action?: string; entityType?: string; actorId?: string; query?: string }) {
  if (isDemoMode) return [];
  const scope = await activityScope(actor);
  const where: any = { ...scope };
  if (options?.action) where.action = options.action;
  if (options?.entityType) where.entityType = options.entityType;
  if (options?.actorId && actor.role !== 'AGENT') {
    const allowed = await prisma.user.findFirst({ where: { id: options.actorId, ...(actor.role === 'AGENCY_MANAGER' ? { agencyId: actor.agencyId ?? '__none__' } : {}) }, select: { id: true } });
    if (allowed) where.actorId = allowed.id;
  }
  if (options?.query?.trim()) where.summary = { contains: options.query.trim(), mode: 'insensitive' };
  return prisma.activityLog.findMany({ where, include: { actor: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: 'desc' }, take: Math.min(Math.max(take, 1), 200) });
}

export async function getActivityActors(actor: DataActor) {
  if (isDemoMode) return [];
  if (actor.role === 'AGENT') return [{ id: actor.id, name: 'من' }];
  return prisma.user.findMany({ where: actor.role === 'SYSTEM_ADMIN' ? {} : { agencyId: actor.agencyId ?? '__none__' }, select: { id: true, name: true, role: true }, orderBy: { name: 'asc' } });
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
    if (item.fromStage) { const key = `${item.fromStage}->${item.toStage}`; transitionMap.set(key, (transitionMap.get(key) || 0) + 1); }
    const prev = previous.get(item.applicantId);
    if (prev && item.fromStage === prev.toStage) { const row = durationMap.get(prev.toStage) || { totalMs: 0, count: 0 }; row.totalMs += item.changedAt.getTime() - prev.changedAt.getTime(); row.count += 1; durationMap.set(prev.toStage, row); }
    previous.set(item.applicantId, item);
  }
  return { transitions: Array.from(transitionMap, ([transition, count]) => ({ transition, count })), averageDaysByStage: Array.from(durationMap, ([stage, row]) => ({ stage, days: Math.round((row.totalMs / row.count / 86400000) * 10) / 10 })) };
}
