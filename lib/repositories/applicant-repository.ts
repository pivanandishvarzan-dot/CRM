import { DealType } from '@prisma/client';
import { applicants as demoApplicants } from '@/lib/demo-data';
import { isDemoMode, prisma } from '@/lib/prisma';

const requestMap: Record<string, DealType> = {
  فروش: 'SALE',
  خرید: 'SALE',
  اجاره: 'RENT',
  'رهن و اجاره': 'MORTGAGE_RENT',
};

export const pipelineStages = [
  'LEAD',
  'CONTACTED',
  'QUALIFIED',
  'MATCHING',
  'VISIT',
  'NEGOTIATION',
  'CONTRACT',
  'WON',
] as const;

export type PipelineStage = (typeof pipelineStages)[number];

export type ApplicantInput = {
  name: string;
  phone: string;
  requestType: string;
  budgetMin?: number;
  budgetMax?: number;
  cities?: string[];
  districts?: string[];
  propertyTypes?: string[];
  minRooms?: number;
  requiredFeatures?: string[];
  urgency?: number;
  notes?: string;
  agentId?: string;
};

export async function listApplicants() {
  if (isDemoMode) {
    const demoStages: PipelineStage[] = ['LEAD', 'CONTACTED', 'QUALIFIED', 'MATCHING', 'VISIT', 'NEGOTIATION'];
    return demoApplicants.map((item, index) => ({
      id: String(item.id),
      name: item.name,
      phone: item.phone,
      requestType: item.request,
      budgetMin: null,
      budgetMax: null,
      cities: ['تهران'],
      districts: [],
      propertyTypes: [],
      minRooms: null,
      requiredFeatures: [],
      urgency: item.urgency === 'فوری' ? 4 : item.urgency === 'زیاد' ? 3 : item.urgency === 'متوسط' ? 2 : 1,
      status: demoStages[index % demoStages.length],
      notes: null,
      agent: { id: `demo-agent-${item.agent}`, name: item.agent },
    }));
  }

  return prisma.applicant.findMany({
    include: { agent: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createApplicant(input: ApplicantInput) {
  if (isDemoMode) {
    return {
      id: String(Date.now()),
      ...input,
      cities: input.cities || [],
      districts: input.districts || [],
      propertyTypes: input.propertyTypes || [],
      requiredFeatures: input.requiredFeatures || [],
      urgency: input.urgency || 1,
      status: 'LEAD',
      agent: { id: input.agentId || 'demo-agent', name: 'مشاور نمایشی' },
    };
  }

  if (!input.agentId) throw new Error('agentId برای ثبت متقاضی الزامی است.');

  return prisma.applicant.create({
    data: {
      name: input.name,
      phone: input.phone,
      requestType: requestMap[input.requestType] || 'SALE',
      budgetMin: input.budgetMin,
      budgetMax: input.budgetMax,
      cities: input.cities || [],
      districts: input.districts || [],
      propertyTypes: input.propertyTypes || [],
      minRooms: input.minRooms,
      requiredFeatures: input.requiredFeatures || [],
      urgency: input.urgency || 1,
      notes: input.notes,
      status: 'LEAD',
      agentId: input.agentId,
    },
    include: { agent: true },
  });
}

export async function updateApplicantStatus(id: string, status: PipelineStage) {
  if (!pipelineStages.includes(status)) throw new Error('مرحله Pipeline معتبر نیست.');
  if (isDemoMode) return { id, status };
  return prisma.applicant.update({
    where: { id },
    data: { status },
    include: { agent: true },
  });
}
