import { DealType } from '@prisma/client';
import { applicants as demoApplicants } from '@/lib/demo-data';
import { isDemoMode, prisma } from '@/lib/prisma';
import type { DataActor } from '@/lib/data-scope';
import { applicantScope, forceAssignedAgent } from '@/lib/data-scope';

export const pipelineStages = ['LEAD','CONTACTED','QUALIFIED','MATCHED','VISIT','NEGOTIATION','CONTRACT','WON'] as const;
const requestMap: Record<string, DealType> = { فروش: 'SALE', خرید: 'SALE', اجاره: 'RENT', 'رهن و اجاره': 'MORTGAGE_RENT' };
export type ApplicantInput = { name: string; phone: string; requestType: string; budgetMin?: number; budgetMax?: number; cities?: string[]; districts?: string[]; propertyTypes?: string[]; minRooms?: number; requiredFeatures?: string[]; urgency?: number; notes?: string; agentId?: string; status?: string };

export async function listApplicants(actor?: DataActor) {
  if (isDemoMode) return demoApplicants.map(item => ({ id: String(item.id), name: item.name, phone: item.phone, requestType: item.request, budgetMin: null, budgetMax: null, cities: ['تهران'], districts: [], propertyTypes: [], minRooms: null, requiredFeatures: [], urgency: item.urgency === 'فوری' ? 4 : item.urgency === 'زیاد' ? 3 : item.urgency === 'متوسط' ? 2 : 1, status: 'LEAD', notes: null, agent: { id: `demo-agent-${item.agent}`, name: item.agent } }));
  return prisma.applicant.findMany({ where: actor ? applicantScope(actor) : undefined, include: { agent: true }, orderBy: { createdAt: 'desc' } });
}

export async function createApplicant(input: ApplicantInput, actor?: DataActor) {
  if (isDemoMode) return { id: String(Date.now()), ...input, cities: input.cities || [], districts: input.districts || [], propertyTypes: input.propertyTypes || [], requiredFeatures: input.requiredFeatures || [], urgency: input.urgency || 1, status: 'LEAD', agent: { id: input.agentId || 'demo-agent', name: 'مشاور نمایشی' } };
  const scoped = actor ? forceAssignedAgent(actor, input) : input;
  if (!scoped.agentId) throw new Error('agentId برای ثبت متقاضی الزامی است.');
  if (actor?.role === 'AGENCY_MANAGER') {
    const allowedAgent = await prisma.user.findFirst({ where: { id: scoped.agentId, agencyId: actor.agencyId ?? '__none__' }, select: { id: true } });
    if (!allowedAgent) throw new Error('FORBIDDEN');
  }
  const applicant = await prisma.applicant.create({ data: { name: scoped.name, phone: scoped.phone, requestType: requestMap[scoped.requestType] || 'SALE', budgetMin: scoped.budgetMin, budgetMax: scoped.budgetMax, cities: scoped.cities || [], districts: scoped.districts || [], propertyTypes: scoped.propertyTypes || [], minRooms: scoped.minRooms, requiredFeatures: scoped.requiredFeatures || [], urgency: scoped.urgency || 1, notes: scoped.notes, agentId: scoped.agentId, status: scoped.status || 'LEAD' }, include: { agent: true } });
  if (actor) await prisma.$transaction([
    prisma.applicantStageHistory.create({ data: { applicantId: applicant.id, fromStage: null, toStage: applicant.status, changedById: actor.id } }),
    prisma.activityLog.create({ data: { actorId: actor.id, action: 'APPLICANT_CREATED', entityType: 'APPLICANT', entityId: applicant.id, summary: `متقاضی ${applicant.name} ایجاد شد`, metadata: { stage: applicant.status } } }),
  ]);
  return applicant;
}

export async function updateApplicantStatus(id: string, status: string, actor?: DataActor) {
  if (isDemoMode) return { id, status };
  const existing = await prisma.applicant.findFirst({ where: { id, ...(actor ? applicantScope(actor) : {}) }, select: { id: true, name: true, status: true } });
  if (!existing) throw new Error('NOT_FOUND');
  if (existing.status === status) return prisma.applicant.findUnique({ where: { id }, include: { agent: true } });
  if (!actor) return prisma.applicant.update({ where: { id }, data: { status }, include: { agent: true } });
  const [, result] = await prisma.$transaction([
    prisma.applicantStageHistory.create({ data: { applicantId: id, fromStage: existing.status, toStage: status, changedById: actor.id } }),
    prisma.applicant.update({ where: { id }, data: { status }, include: { agent: true } }),
    prisma.activityLog.create({ data: { actorId: actor.id, action: 'PIPELINE_STAGE_CHANGED', entityType: 'APPLICANT', entityId: id, summary: `مرحله ${existing.name} از ${existing.status} به ${status} تغییر کرد`, metadata: { fromStage: existing.status, toStage: status } } }),
  ]);
  return result;
}
