import { prisma, isDemoMode } from '@/lib/prisma';

type AutomationPayload = {
  ruleId: string;
  ruleName: string;
  action: string;
  priority: number;
  message: string;
  assigneeId: string;
  entityType: 'APPLICANT' | 'FOLLOWUP';
  entityId: string;
  href?: string;
  actorId: string;
  eventName: string;
  eventFingerprint: string;
};

export async function enqueueAutomationJob(input: { key: string; agencyId: string; runAt: Date; payload: AutomationPayload }) {
  if (isDemoMode) return { id: `demo-${input.key}`, status: 'PENDING', runAt: input.runAt };
  return prisma.automationJob.upsert({
    where: { key: input.key },
    create: { key: input.key, agencyId: input.agencyId, type: 'AUTOMATION_RULE', payload: input.payload, runAt: input.runAt },
    update: {},
  });
}

async function executeAutomationPayload(payload: AutomationPayload) {
  const alertKey = `automation:${payload.ruleId}:${payload.eventFingerprint}`;
  await prisma.alert.upsert({
    where: { key: alertKey },
    create: { key: alertKey, userId: payload.assigneeId, type: 'AUTOMATION', severity: payload.priority, title: `اتوماسیون: ${payload.ruleName}`, message: payload.message, entityType: payload.entityType, entityId: payload.entityId, href: payload.href },
    update: { severity: payload.priority, message: payload.message, href: payload.href, resolvedAt: null },
  });
  if (payload.action === 'ALERT_AND_TASK') {
    const marker = `[AUTO:${payload.ruleId}:${payload.eventFingerprint}]`;
    const exists = await prisma.followup.findFirst({ where: { assigneeId: payload.assigneeId, description: { contains: marker } }, select: { id: true } });
    if (!exists) await prisma.followup.create({ data: { title: payload.ruleName, type: 'TASK', scheduledAt: new Date(), priority: payload.priority, description: `${payload.message}\n${marker}`, assigneeId: payload.assigneeId, applicantId: payload.entityType === 'APPLICANT' ? payload.entityId : undefined } });
  }
  await prisma.activityLog.create({ data: { actorId: payload.actorId, action: 'AUTOMATION_EXECUTED', entityType: payload.entityType, entityId: payload.entityId, summary: `اتوماسیون ${payload.ruleName} اجرا شد`, metadata: { ruleId: payload.ruleId, event: payload.eventName } } });
}

export async function runDueAutomationJobs(limit = 25) {
  if (isDemoMode) return { processed: 0, completed: 0, failed: 0 };
  const now = new Date();
  const jobs = await prisma.automationJob.findMany({ where: { status: 'PENDING', runAt: { lte: now } }, orderBy: { runAt: 'asc' }, take: Math.min(Math.max(limit, 1), 100) });
  let completed = 0, failed = 0;
  for (const job of jobs) {
    const locked = await prisma.automationJob.updateMany({ where: { id: job.id, status: 'PENDING' }, data: { status: 'RUNNING', lockedAt: now, attempts: { increment: 1 } } });
    if (!locked.count) continue;
    try {
      await executeAutomationPayload(job.payload as unknown as AutomationPayload);
      await prisma.automationJob.update({ where: { id: job.id }, data: { status: 'COMPLETED', completedAt: new Date(), lastError: null } });
      completed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 1000) : 'Unknown job error';
      const attempts = job.attempts + 1;
      const exhausted = attempts >= job.maxAttempts;
      const retryAt = new Date(Date.now() + Math.min(60, 2 ** attempts * 5) * 60000);
      await prisma.automationJob.update({ where: { id: job.id }, data: { status: exhausted ? 'FAILED' : 'PENDING', lastError: message, runAt: exhausted ? job.runAt : retryAt, lockedAt: null } });
      failed += 1;
    }
  }
  return { processed: completed + failed, completed, failed };
}
