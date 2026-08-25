import { FollowupType } from '@prisma/client';
import { followups as demoFollowups } from '@/lib/demo-data';
import { isDemoMode, prisma } from '@/lib/prisma';
import type { DataActor } from '@/lib/data-scope';
import { followupScope, forceAssignee } from '@/lib/data-scope';

const typeMap: Record<string, FollowupType> = { تماس: 'CALL', پیام: 'MESSAGE', جلسه: 'MEETING', بازدید: 'VISIT', یادآوری: 'REMINDER', وظیفه: 'TASK' };
export type FollowupInput = { title: string; type: string; scheduledAt: string; priority?: number; completed?: boolean; description?: string; assigneeId?: string; ownerId?: string; applicantId?: string; propertyId?: string };

export async function listFollowups(actor?: DataActor) {
  if (isDemoMode) return demoFollowups.map((item, index) => ({ id: String(item.id), title: item.title, type: item.type, scheduledAt: new Date(Date.now() + (index - 2) * 86400000).toISOString(), priority: item.priority === 'فوری' ? 4 : item.priority === 'زیاد' ? 3 : item.priority === 'متوسط' ? 2 : 1, completed: false, assignee: { id: `demo-agent-${index}`, name: item.agent }, owner: null, applicant: null, property: null, description: null }));
  return prisma.followup.findMany({ where: actor ? followupScope(actor) : undefined, include: { assignee: true, owner: true, applicant: true, property: true }, orderBy: { scheduledAt: 'asc' } });
}

export async function createFollowup(input: FollowupInput, actor?: DataActor) {
  if (isDemoMode) return { id: String(Date.now()), title: input.title, type: input.type, scheduledAt: input.scheduledAt, priority: input.priority ?? 2, completed: input.completed ?? false, description: input.description ?? null, assignee: { id: input.assigneeId ?? 'demo-agent', name: 'مشاور نمونه' }, owner: null, applicant: null, property: null };
  const scoped = actor ? forceAssignee(actor, input) : input;
  if (!scoped.assigneeId) throw new Error('assigneeId برای ثبت پیگیری الزامی است.');
  if (actor?.role === 'AGENCY_MANAGER') {
    const allowed = await prisma.user.findFirst({ where: { id: scoped.assigneeId, agencyId: actor.agencyId ?? '__none__' }, select: { id: true } });
    if (!allowed) throw new Error('FORBIDDEN');
  }
  return prisma.followup.create({ data: { title: scoped.title, type: typeMap[scoped.type] ?? 'TASK', scheduledAt: new Date(scoped.scheduledAt), priority: scoped.priority ?? 2, completed: scoped.completed ?? false, description: scoped.description, assigneeId: scoped.assigneeId, ownerId: scoped.ownerId, applicantId: scoped.applicantId, propertyId: scoped.propertyId }, include: { assignee: true, owner: true, applicant: true, property: true } });
}

export async function setFollowupCompleted(id: string, completed: boolean, actor?: DataActor) {
  if (isDemoMode) return { id, completed };
  const existing = await prisma.followup.findFirst({ where: { id, ...(actor ? followupScope(actor) : {}) }, select: { id: true } });
  if (!existing) throw new Error('NOT_FOUND');
  return prisma.followup.update({ where: { id }, data: { completed } });
}
