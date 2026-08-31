import type { Prisma } from '@prisma/client';
import type { CRMRole } from '@/lib/authz';

export type DataActor = {
  id: string;
  role: CRMRole;
  agencyId: string;
};

export function propertyScope(actor: DataActor): Prisma.PropertyWhereInput {
  if (actor.role === 'SYSTEM_ADMIN') return {};
  if (actor.role === 'AGENCY_MANAGER') return { agent: { agencyId: actor.agencyId } };
  return { agentId: actor.id };
}

export function applicantScope(actor: DataActor): Prisma.ApplicantWhereInput {
  if (actor.role === 'SYSTEM_ADMIN') return {};
  if (actor.role === 'AGENCY_MANAGER') return { agent: { agencyId: actor.agencyId } };
  return { agentId: actor.id };
}

export function followupScope(actor: DataActor): Prisma.FollowupWhereInput {
  if (actor.role === 'SYSTEM_ADMIN') return {};
  if (actor.role === 'AGENCY_MANAGER') return { assignee: { agencyId: actor.agencyId } };
  return { assigneeId: actor.id };
}

export function contractScope(actor: DataActor): Prisma.ContractWhereInput {
  if (actor.role === 'SYSTEM_ADMIN') return {};
  if (actor.role === 'AGENCY_MANAGER') return { agent: { agencyId: actor.agencyId } };
  return { agentId: actor.id };
}

export function forceAssignedAgent<T extends { agentId?: string }>(actor: DataActor, input: T): T {
  if (actor.role === 'AGENT') return { ...input, agentId: actor.id };
  return input;
}

export function forceAssignee<T extends { assigneeId?: string }>(actor: DataActor, input: T): T {
  if (actor.role === 'AGENT') return { ...input, assigneeId: actor.id };
  return input;
}
