import { DealType, PropertyStatus } from '@prisma/client';
import { properties as demoProperties } from '@/lib/demo-data';
import { isDemoMode, prisma } from '@/lib/prisma';

const dealMap: Record<string, DealType> = {
  فروش: 'SALE',
  اجاره: 'RENT',
  'رهن و اجاره': 'MORTGAGE_RENT',
};

const statusMap: Record<string, PropertyStatus> = {
  فعال: 'ACTIVE',
  'در مذاکره': 'NEGOTIATING',
  'فروخته شد': 'SOLD',
  اجاره: 'RENTED',
  آرشیو: 'ARCHIVED',
  ویژه: 'ACTIVE',
};

export type PropertyInput = {
  code?: string;
  title: string;
  type: string;
  deal: string;
  status?: string;
  city: string;
  district: string;
  address?: string;
  price: number;
  area: number;
  rooms: number;
  floor?: number;
  age?: number;
  features?: string[];
  image?: string;
  ownerId?: string;
  agentId?: string;
};

export async function listProperties() {
  if (isDemoMode) return demoProperties;

  return prisma.property.findMany({
    include: { owner: true, agent: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProperty(id: string) {
  if (isDemoMode) {
    const numericId = Number(id);
    return demoProperties.find((item) => item.id === numericId) ?? null;
  }

  return prisma.property.findUnique({
    where: { id },
    include: {
      owner: true,
      agent: true,
      followups: { orderBy: { scheduledAt: 'desc' } },
    },
  });
}

export async function createProperty(input: PropertyInput) {
  if (isDemoMode) {
    return {
      ...demoProperties[0],
      ...input,
      id: Date.now(),
      code: input.code || `MLK-${Date.now()}`,
      status: input.status || 'فعال',
      image: input.image || demoProperties[0].image,
      features: input.features || [],
    };
  }

  if (!input.ownerId || !input.agentId) {
    throw new Error('ownerId و agentId برای ثبت پایدار ملک الزامی هستند.');
  }

  return prisma.property.create({
    data: {
      code: input.code || `MLK-${Date.now()}`,
      title: input.title,
      type: input.type,
      dealType: dealMap[input.deal] || 'SALE',
      status: statusMap[input.status || 'فعال'] || 'ACTIVE',
      city: input.city,
      district: input.district,
      address: input.address,
      price: input.price,
      area: input.area,
      rooms: input.rooms,
      floor: input.floor,
      age: input.age,
      features: input.features || [],
      images: input.image ? [input.image] : [],
      ownerId: input.ownerId,
      agentId: input.agentId,
    },
    include: { owner: true, agent: true },
  });
}

export async function updateProperty(id: string, input: Partial<PropertyInput>) {
  if (isDemoMode) {
    const current = demoProperties.find((item) => item.id === Number(id));
    return current ? { ...current, ...input } : null;
  }

  return prisma.property.update({
    where: { id },
    data: {
      ...(input.code !== undefined && { code: input.code }),
      ...(input.title !== undefined && { title: input.title }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.deal !== undefined && { dealType: dealMap[input.deal] || 'SALE' }),
      ...(input.status !== undefined && { status: statusMap[input.status] || 'ACTIVE' }),
      ...(input.city !== undefined && { city: input.city }),
      ...(input.district !== undefined && { district: input.district }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.area !== undefined && { area: input.area }),
      ...(input.rooms !== undefined && { rooms: input.rooms }),
      ...(input.floor !== undefined && { floor: input.floor }),
      ...(input.age !== undefined && { age: input.age }),
      ...(input.features !== undefined && { features: input.features }),
      ...(input.image !== undefined && { images: input.image ? [input.image] : [] }),
      ...(input.ownerId !== undefined && { ownerId: input.ownerId }),
      ...(input.agentId !== undefined && { agentId: input.agentId }),
    },
    include: { owner: true, agent: true },
  });
}

export async function deleteProperty(id: string) {
  if (isDemoMode) return { id };
  return prisma.property.delete({ where: { id } });
}
