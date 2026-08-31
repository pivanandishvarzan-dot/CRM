import { properties as demoProperties } from '@/lib/demo-data';
import { isDemoMode } from '@/lib/data-mode';
import { prisma } from '@/lib/prisma';

export type PropertyListItem = {
  id: string;
  title: string;
  code: string;
  type: string;
  deal: string;
  area: number;
  rooms: number;
  district: string;
  city: string;
  price: number;
  status: string;
  owner: string;
  ownerPhone?: string;
  agent: string;
  image: string;
  created: string;
  floor: number;
  age: number;
  features: string[];
  address?: string;
};

export type CreatePropertyInput = {
  title: string;
  type: string;
  deal: 'فروش' | 'اجاره' | 'رهن و اجاره';
  city: string;
  district: string;
  price: number;
  area: number;
  rooms?: number;
  floor?: number;
  age?: number;
  ownerName?: string;
  agentName?: string;
};

const demoStore: PropertyListItem[] = demoProperties.map((item) => ({
  ...item,
  id: String(item.id),
}));

const dealLabels = {
  SALE: 'فروش',
  RENT: 'اجاره',
  MORTGAGE_RENT: 'رهن و اجاره',
} as const;

const dealValues = {
  فروش: 'SALE',
  اجاره: 'RENT',
  'رهن و اجاره': 'MORTGAGE_RENT',
} as const;

const statusLabels = {
  DRAFT: 'پیش‌نویس',
  ACTIVE: 'فعال',
  NEGOTIATING: 'در مذاکره',
  SOLD: 'فروخته شد',
  RENTED: 'اجاره داده شد',
  ARCHIVED: 'بایگانی',
} as const;

function mapRow(item: Awaited<ReturnType<typeof prisma.property.findFirst>> & any): PropertyListItem {
  return {
    id: item.id,
    title: item.title,
    code: item.code,
    type: item.type,
    deal: dealLabels[item.dealType as keyof typeof dealLabels],
    area: item.area,
    rooms: item.rooms,
    district: item.district,
    city: item.city,
    price: Number(item.price) / 1_000_000_000,
    status: statusLabels[item.status as keyof typeof statusLabels],
    owner: item.owner?.name ?? '',
    ownerPhone: item.owner?.phone ?? '',
    agent: item.agent?.name ?? '',
    image: item.images?.[0] ?? '',
    created: new Intl.DateTimeFormat('fa-IR').format(item.createdAt),
    floor: item.floor ?? 0,
    age: item.age ?? 0,
    features: item.features ?? [],
    address: item.address ?? '',
  };
}

export async function listProperties(): Promise<PropertyListItem[]> {
  if (isDemoMode()) return [...demoStore];

  const rows = await prisma.property.findMany({
    include: { owner: true, agent: true },
    orderBy: { createdAt: 'desc' },
  });

  return rows.map(mapRow);
}

export async function getProperty(id: string): Promise<PropertyListItem | null> {
  if (isDemoMode()) return demoStore.find((item) => item.id === id) ?? null;
  const row = await prisma.property.findUnique({where:{id},include:{owner:true,agent:true}});
  return row ? mapRow(row) : null;
}

export async function createProperty(input: CreatePropertyInput): Promise<PropertyListItem> {
  if (isDemoMode()) {
    const created: PropertyListItem = {
      id: `demo-${Date.now()}`,
      title: input.title,
      code: `MLK-${String(Date.now()).slice(-5)}`,
      type: input.type,
      deal: input.deal,
      area: input.area,
      rooms: input.rooms ?? 0,
      district: input.district,
      city: input.city,
      price: input.price,
      status: 'فعال',
      owner: input.ownerName || 'مالک جدید',
      agent: input.agentName || 'مشاور جاری',
      image: '',
      created: new Intl.DateTimeFormat('fa-IR').format(new Date()),
      floor: input.floor ?? 0,
      age: input.age ?? 0,
      features: [],
    };
    demoStore.unshift(created);
    return created;
  }

  const ownerName = input.ownerName?.trim() || 'مالک جدید';
  const agentName = input.agentName?.trim() || 'مشاور جاری';

  let owner = await prisma.owner.findFirst({ where: { name: ownerName } });
  if (!owner) {
    owner = await prisma.owner.create({ data: { name: ownerName, phone: '' } });
  }

  let agent = await prisma.user.findFirst({ where: { name: agentName } });
  if (!agent) {
    agent = await prisma.user.create({
      data: {
        name: agentName,
        email: `agent-${Date.now()}@crm.local`,
        role: 'AGENT',
      },
    });
  }

  const row = await prisma.property.create({
    data: {
      code: `MLK-${Date.now()}`,
      title: input.title,
      type: input.type,
      dealType: dealValues[input.deal],
      status: 'ACTIVE',
      city: input.city,
      district: input.district,
      price: input.price * 1_000_000_000,
      area: input.area,
      rooms: input.rooms ?? 0,
      floor: input.floor ?? null,
      age: input.age ?? null,
      ownerId: owner.id,
      agentId: agent.id,
      features: [],
      images: [],
    },
    include: { owner: true, agent: true },
  });

  return mapRow(row);
}

export async function deleteProperty(id: string): Promise<void> {
  if (isDemoMode()) {
    const index = demoStore.findIndex((item) => item.id === id);
    if (index >= 0) demoStore.splice(index, 1);
    return;
  }

  await prisma.property.delete({ where: { id } });
}
