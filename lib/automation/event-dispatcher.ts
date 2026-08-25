import { prisma, isDemoMode } from '@/lib/prisma';
import type { DataActor } from '@/lib/data-scope';

type EventName = 'VISIT_COMPLETED' | 'APPLICANT_CREATED' | 'STAGE_CHANGED' | 'FOLLOWUP_COMPLETED';
type CRMEvent = {
  name: EventName;
  actor: DataActor;
  entityType: 'APPLICANT' | 'FOLLOWUP';
  entityId: string;
  assigneeId: string;
  href?: string;
  data: Record<string, string | number | boolean | null | undefined>;
  occurredAt?: Date;
};

type Condition = { field: string; operator: string; value: string | number | boolean };

function matchesCondition(condition: Condition, data: CRMEvent['data']) {
  const current = data[condition.field];
  const expected = condition.value;
  switch (condition.operator) {
    case 'EQ': return String(current ?? '') === String(expected);
    case 'NEQ': return String(current ?? '') !== String(expected);
    case 'GTE': return Number(current) >= Number(expected);
    case 'LTE': return Number(current) <= Number(expected);
    default: return false;
  }
}

export async function dispatchCRMEvent(event: CRMEvent) {
  if (isDemoMode || !event.actor.agencyId) return [];
  const rules = await prisma.automationRule.findMany({ where: { agencyId: event.actor.agencyId, enabled: true, custom: true } });
  const matched = rules.filter(rule => {
    const trigger = (rule.trigger ?? {}) as { event?: string; delayHours?: number };
    if (trigger.event !== event.name) return false;
    const conditions = Array.isArray(rule.conditions) ? rule.conditions as unknown as Condition[] : [];
    return conditions.every(condition => matchesCondition(condition, event.data));
  });

  const occurredAt = event.occurredAt ?? new Date();
  const results = [];
  for (const rule of matched) {
    const trigger = (rule.trigger ?? {}) as { delayHours?: number };
    const dueAt = new Date(occurredAt.getTime() + Math.max(0, Number(trigger.delayHours ?? 0)) * 3600000);
    const eventFingerprint = `${event.name}:${event.entityType}:${event.entityId}:${occurredAt.toISOString().slice(0,16)}`;
    const alertKey = `automation:${rule.id}:${eventFingerprint}`;
    const title = `اتوماسیون: ${rule.name}`;
    const message = rule.description || `Rule «${rule.name}» برای این رویداد اجرا شد.`;
    const alert = await prisma.alert.upsert({
      where: { key: alertKey },
      create: { key: alertKey, userId: event.assigneeId, type: 'AUTOMATION', severity: rule.priority, title, message, entityType: event.entityType, entityId: event.entityId, href: event.href },
      update: { severity: rule.priority, title, message, href: event.href, resolvedAt: null },
    });
    if (rule.action === 'ALERT_AND_TASK') {
      const taskMarker = `[AUTO:${rule.id}:${eventFingerprint}]`;
      const existingTask = await prisma.followup.findFirst({ where: { assigneeId: event.assigneeId, description: { contains: taskMarker } }, select: { id: true } });
      if (!existingTask) {
        await prisma.followup.create({ data: { title: rule.name, type: 'TASK', scheduledAt: dueAt, priority: rule.priority, completed: false, description: `${message}\n${taskMarker}`, assigneeId: event.assigneeId, applicantId: event.entityType === 'APPLICANT' ? event.entityId : undefined } });
      }
    }
    await prisma.activityLog.create({ data: { actorId: event.actor.id, action: 'AUTOMATION_EXECUTED', entityType: event.entityType, entityId: event.entityId, summary: `اتوماسیون ${rule.name} اجرا شد`, metadata: { ruleId: rule.id, event: event.name, action: rule.action, dueAt: dueAt.toISOString() } } });
    results.push(alert);
  }
  return results;
}
