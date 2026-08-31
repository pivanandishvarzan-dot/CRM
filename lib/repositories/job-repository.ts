import { prisma, isDemoMode } from '@/lib/prisma';
import type { DataActor } from '@/lib/data-scope';

function requireAgency(actor: DataActor) {
  if (actor.role === 'AGENT' || !actor.agencyId) throw new Error('FORBIDDEN');
  return actor.agencyId;
}

export async function listAutomationJobs(actor: DataActor, status?: string) {
  if (isDemoMode) return [];
  const agencyId = requireAgency(actor);
  return prisma.automationJob.findMany({
    where: { agencyId, ...(status ? { status } : {}) },
    orderBy: [{ runAt: 'desc' }, { createdAt: 'desc' }],
    take: 100,
  });
}

export async function retryAutomationJob(id: string, actor: DataActor) {
  if (isDemoMode) return { id, status: 'PENDING', runAt: new Date() };
  const agencyId = requireAgency(actor);
  const job = await prisma.automationJob.findFirst({ where: { id, agencyId }, select: { id: true, status: true } });
  if (!job) throw new Error('NOT_FOUND');
  if (!['FAILED', 'COMPLETED'].includes(job.status)) throw new Error('INVALID_JOB_STATE');
  return prisma.automationJob.update({
    where: { id },
    data: { status: 'PENDING', runAt: new Date(), completedAt: null, lockedAt: null, lastError: null, attempts: 0 },
  });
}
