import { DealType, Prisma, PropertyStatus } from '@prisma/client';
import { properties as demoProperties } from '@/lib/demo-data';
import { isDemoMode, prisma } from '@/lib/prisma';
import type { Property } from '@/lib/types';

const dealMap: Record<string, DealType> = {
  فروش: 'SALE',
  اجاره: 'RENT',
  'رهن و اجاره': 'MORTGAGE_RENT',
};

const dealLabel: Record<DealType, string> = {
  SALE: 'فروش',
  RENT: 'اجاره',
  MORTGAGE_RENT: 'رهن و اجاره',
};

const statusMap: Record<string, PropertyStatus> = {
  فعال: 'ACTIVE',
  ویژه: 'ACTIVE',
  'در مذاکره': 'NEGOTIATING',
  'فروخته شد': 'SOLD',
  'اجاره داده شد': 'RENTED',
  آرشیو: 'ARCHIVED',
};

const statusLabel: Record<PropertyStatus, string> = {
  DRAFT: 'پیش‌نویس',
  ACTIVE: 'فعال',
  NEGOTIATING: 'در مذاکره',
  SOLD: 'فروخته شد',
  RENTED: 'اجاره داده شد',
  ARCHIVED: 'آرشیو',
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

type DbProperty = Prisma.PropertyGetPayload<{ include: { owner: true; agent: true } }>;

function toUiProperty(item: DbProperty): Property {
  return {
    id: item.id,
    title: item.title,
    code: item.code,
    type: item.type,
    deal: dealLabel[item.dealType],
    area: item.area,
    rooms: item.rooms,
    district: item.district,
    city: item.city,
    price: Number(item.price),
    status: statusLabel[item.status],
    owner: item.owner.name,
    agent: item.agent.name,
    image: item.images[0] || demoProperties[0].image,
    created: new Intl.DateTimeFormat('fa-IR-u-ca-persian').format(item.createdAt),
    floor: item.floor ?? 0,
    age: item.age ?? 0,
    features: item.features,
  };
}

export async function listProperties(): Promise<Property[]> {
  if (isDemoMode) return demoProperties;

  const items = await prisma.property.findMany({
    include: { owner: true, agent: true },
    orderBy: { createdAt: 'desc' },
  });
  return items.map(toUiProperty);
}

export async function getProperty(id: string): Promise<Property | null> {
  if (isDemoMode) {
    return demoProperties.find((item) => String(item.id) === id) ?? null;
  }

  const item = await prisma.property.findUnique({
    where: { id },
    include: { owner: true, agent: true },
  });
  return item ? toUiProperty(item) : null;
}

export async function createProperty(input: PropertyInput): Promise<Property> {
  if (isDemoMode) {
    return {
      ...demoProperties[0],
      ...input,
      id: Date.now(),
      code: input.code || `MLK-${Date.now()}`,
      status: input.status || 'فعال',
      owner: 'مالک ثبت‌نشده',
      agent: 'مشاور ثبت‌نشده',
      image: input.image || demoProperties[0].image,
      features: input.features || [],
      created: new Intl.DateTimeFormat('fa-IR-u-ca-persian').format(new Date()),
      floor: input.floor ?? 0,
      age: input.age ?? 0,
    };
  }

  if (!input.ownerId || !input.agentId) {
    throw new Error('ownerId و agentId برای ثبت پایدار ملک الزامی هستند.');
  }

  const item = await prisma.property.create({
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
  return toUiProperty(item);
}

export async function updateProperty(id: string, input: Partial<PropertyInput>): Promise<Property | null> {
  if (isDemoMode) {
    const current = demoProperties.find((item) => String(item.id) === id);
    return current ? ({ ...current, ...input } as Property) : null;
  }

  const item = await prisma.property.update({
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
  return toUiProperty(item);
}

export async function deleteProperty(id: string) {
  if (isDemoMode) return { id };
  return prisma.property.delete({ where: { id } });
}
