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
  agent: string;
  image: string;
  created: string;
  floor: number;
  age: number;
  features: string[];
};

const dealLabels = {
  SALE: 'فروش',
  RENT: 'اجاره',
  MORTGAGE_RENT: 'رهن و اجاره',
} as const;

const statusLabels = {
  DRAFT: 'پیش‌نویس',
  ACTIVE: 'فعال',
  NEGOTIATING: 'در مذاکره',
  SOLD: 'فروخته شد',
  RENTED: 'اجاره داده شد',
  ARCHIVED: 'بایگانی',
} as const;

export async function listProperties(): Promise<PropertyListItem[]> {
  if (isDemoMode()) {
    return demoProperties.map((item) => ({ ...item, id: String(item.id) }));
  }

  const rows = await prisma.property.findMany({
    include: { owner: true, agent: true },
    orderBy: { createdAt: 'desc' },
  });

  return rows.map((item) => ({
    id: item.id,
    title: item.title,
    code: item.code,
    type: item.type,
    deal: dealLabels[item.dealType],
    area: item.area,
    rooms: item.rooms,
    district: item.district,
    city: item.city,
    price: Number(item.price) / 1_000_000_000,
    status: statusLabels[item.status],
    owner: item.owner.name,
    agent: item.agent.name,
    image: item.images[0] ?? '',
    created: new Intl.DateTimeFormat('fa-IR').format(item.createdAt),
    floor: item.floor ?? 0,
    age: item.age ?? 0,
    features: item.features,
  }));
}
