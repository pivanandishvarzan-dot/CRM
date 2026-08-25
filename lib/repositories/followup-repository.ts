import { FollowupType } from '@prisma/client';
import { followups as demoFollowups } from '@/lib/demo-data';
import { isDemoMode, prisma } from '@/lib/prisma';

const typeMap: Record<string, FollowupType> = {
  تماس: 'CALL',
  پیام: 'MESSAGE',
  جلسه: 'MEETING',
  بازدید: 'VISIT',
  یادآوری: 'REMINDER',
  وظیفه: 'TASK',
};

export type FollowupInput = {
  title: string;
  type: string;
  scheduledAt: string;
  priority?: number;
  completed?: boolean;
  description?: string;
  assigneeId?: string;
  ownerId?: string;
  applicantId?: string;
  propertyId?: string;
};

export async function listFollowups() {
  if (isDemoMode) {
    return demoFollowups.map((item, index) => ({
      id: String(item.id),
      title: item.title,
      type: item.type,
      scheduledAt: new Date(Date.now() + (index - 2) * 86400000).toISOString(),
      priority: item.priority === 'فوری' ? 4 : item.priority === 'زیاد' ? 3 : item.priority === 'متوسط' ? 2 : 1,
      completed: false,
      assignee: { id: `demo-agent-${index}`, name: item.agent },
      owner: null,
      applicant: null,
      property: null,
      description: null,
    }));
  }

  return prisma.followup.findMany({
    include: {
      assignee: true,
      owner: true,
      applicant: true,
      property: true,
    },
    orderBy: { scheduledAt: 'asc' },
  });
}

export async function createFollowup(input: FollowupInput) {
  if (isDemoMode) {
    return {
      id: String(Date.now()),
      title: input.title,
      type: input.type,
      scheduledAt: input.scheduledAt,
      priority: input.priority ?? 2,
      completed: input.completed ?? false,
      description: input.description ?? null,
      assignee: { id: input.assigneeId ?? 'demo-agent', name: 'مشاور نمونه' },
      owner: null,
      applicant: null,
      property: null,
    };
  }

  if (!input.assigneeId) throw new Error('assigneeId برای ثبت پیگیری الزامی است.');

  return prisma.followup.create({
    data: {
      title: input.title,
      type: typeMap[input.type] ?? 'TASK',
      scheduledAt: new Date(input.scheduledAt),
      priority: input.priority ?? 2,
      completed: input.completed ?? false,
      description: input.description,
      assigneeId: input.assigneeId,
      ownerId: input.ownerId,
      applicantId: input.applicantId,
      propertyId: input.propertyId,
    },
    include: { assignee: true, owner: true, applicant: true, property: true },
  });
}

export async function setFollowupCompleted(id: string, completed: boolean) {
  if (isDemoMode) return { id, completed };
  return prisma.followup.update({ where: { id }, data: { completed } });
}
