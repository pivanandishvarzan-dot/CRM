import { DealType, Prisma, PropertyStatus } from '@prisma/client';
import { properties as demoProperties } from '@/lib/demo-data';
import { isDemoMode, prisma } from '@/lib/prisma';
import type { Property } from '@/lib/types';
import type { DataActor } from '@/lib/data-scope';
import { forceAssignedAgent, propertyScope } from '@/lib/data-scope';

const dealMap: Record<string, DealType> = { فروش: 'SALE', اجاره: 'RENT', 'رهن و اجاره': 'MORTGAGE_RENT', SALE:'SALE', RENT:'RENT', MORTGAGE_RENT:'MORTGAGE_RENT' };
const dealLabel: Record<DealType, string> = { SALE: 'فروش', RENT: 'اجاره', MORTGAGE_RENT: 'رهن و اجاره' };
const statusMap: Record<string, PropertyStatus> = { فعال: 'ACTIVE', ویژه: 'ACTIVE', 'در مذاکره': 'NEGOTIATING', 'فروخته شد': 'SOLD', 'اجاره داده شد': 'RENTED', آرشیو: 'ARCHIVED', پیش‌نویس:'DRAFT', DRAFT:'DRAFT', ACTIVE:'ACTIVE', NEGOTIATING:'NEGOTIATING', SOLD:'SOLD', RENTED:'RENTED', ARCHIVED:'ARCHIVED' };
const statusLabel: Record<PropertyStatus, string> = { DRAFT: 'پیش‌نویس', ACTIVE: 'فعال', NEGOTIATING: 'در مذاکره', SOLD: 'فروخته شد', RENTED: 'اجاره داده شد', ARCHIVED: 'آرشیو' };

export type PropertyInput = { code?: string; title: string; type: string; deal: string; status?: string; city: string; district: string; address?: string; price: number; area: number; rooms: number; floor?: number; age?: number; features?: string[]; image?: string; ownerId?: string; agentId?: string };
type DbProperty = Prisma.PropertyGetPayload<{ include: { owner: true; agent: true } }>;

function toUiProperty(item: DbProperty): Property {
  return { id: item.id, title: item.title, code: item.code, type: item.type, deal: dealLabel[item.dealType], area: item.area, rooms: item.rooms, district: item.district, city: item.city, price: Number(item.price), status: statusLabel[item.status], owner: item.owner.name, agent: item.agent.name, image: item.images[0] || demoProperties[0].image, created: new Intl.DateTimeFormat('fa-IR-u-ca-persian').format(item.createdAt), floor: item.floor ?? 0, age: item.age ?? 0, features: item.features };
}

export async function listProperties(actor?: DataActor): Promise<Property[]> {
  if (isDemoMode) return demoProperties;
  const items = await prisma.property.findMany({ where: actor ? propertyScope(actor) : undefined, include: { owner: true, agent: true }, orderBy: { createdAt: 'desc' } });
  return items.map(toUiProperty);
}

export async function getProperty(id: string, actor?: DataActor): Promise<Property | null> {
  if (isDemoMode) return demoProperties.find(item => String(item.id) === id) ?? null;
  const item = await prisma.property.findFirst({ where: { id, ...(actor ? propertyScope(actor) : {}) }, include: { owner: true, agent: true } });
  return item ? toUiProperty(item) : null;
}

export async function createProperty(input: PropertyInput, actor?: DataActor): Promise<Property> {
  if (isDemoMode) return { ...demoProperties[0], ...input, id: Date.now(), code: input.code || `MLK-${Date.now()}`, status: input.status || 'فعال', owner: 'مالک ثبت‌نشده', agent: 'مشاور ثبت‌نشده', image: input.image || demoProperties[0].image, features: input.features || [], created: new Intl.DateTimeFormat('fa-IR-u-ca-persian').format(new Date()), floor: input.floor ?? 0, age: input.age ?? 0 };
  const scoped = actor ? forceAssignedAgent(actor, input) : input;
  if (!scoped.ownerId || !scoped.agentId) throw new Error('ownerId و agentId برای ثبت پایدار ملک الزامی هستند.');
  if (actor?.role === 'AGENCY_MANAGER') {
    const allowedAgent = await prisma.user.findFirst({ where: { id: scoped.agentId, agencyId: actor.agencyId ?? '__none__' }, select: { id: true } });
    if (!allowedAgent) throw new Error('FORBIDDEN');
  }
  const item = await prisma.property.create({ data: { code: scoped.code || `MLK-${Date.now()}`, title: scoped.title, type: scoped.type, dealType: dealMap[scoped.deal] || 'SALE', status: statusMap[scoped.status || 'فعال'] || 'ACTIVE', city: scoped.city, district: scoped.district, address: scoped.address, price: scoped.price, area: scoped.area, rooms: scoped.rooms, floor: scoped.floor, age: scoped.age, features: scoped.features || [], images: scoped.image ? [scoped.image] : [], ownerId: scoped.ownerId, agentId: scoped.agentId }, include: { owner: true, agent: true } });
  return toUiProperty(item);
}

export async function updateProperty(id: string, input: Partial<PropertyInput>, actor?: DataActor): Promise<Property | null> {
  if (isDemoMode) { const current = demoProperties.find(item => String(item.id) === id); return current ? ({ ...current, ...input } as Property) : null; }
  const existing = await prisma.property.findFirst({ where: { id, ...(actor ? propertyScope(actor) : {}) }, select: { id: true } });
  if (!existing) return null;
  const scoped = actor ? forceAssignedAgent(actor, input) : input;
  const item = await prisma.property.update({ where: { id }, data: { ...(scoped.code !== undefined && { code: scoped.code }), ...(scoped.title !== undefined && { title: scoped.title }), ...(scoped.type !== undefined && { type: scoped.type }), ...(scoped.deal !== undefined && { dealType: dealMap[scoped.deal] || 'SALE' }), ...(scoped.status !== undefined && { status: statusMap[scoped.status] || 'ACTIVE' }), ...(scoped.city !== undefined && { city: scoped.city }), ...(scoped.district !== undefined && { district: scoped.district }), ...(scoped.address !== undefined && { address: scoped.address }), ...(scoped.price !== undefined && { price: scoped.price }), ...(scoped.area !== undefined && { area: scoped.area }), ...(scoped.rooms !== undefined && { rooms: scoped.rooms }), ...(scoped.floor !== undefined && { floor: scoped.floor }), ...(scoped.age !== undefined && { age: scoped.age }), ...(scoped.features !== undefined && { features: scoped.features }), ...(scoped.image !== undefined && { images: scoped.image ? [scoped.image] : [] }), ...(scoped.ownerId !== undefined && { ownerId: scoped.ownerId }), ...(scoped.agentId !== undefined && { agentId: scoped.agentId }) }, include: { owner: true, agent: true } });
  return toUiProperty(item);
}

export async function deleteProperty(id: string, actor?: DataActor) {
  if (isDemoMode) return { id };
  const existing = await prisma.property.findFirst({ where: { id, ...(actor ? propertyScope(actor) : {}) }, select: { id: true } });
  if (!existing) throw new Error('NOT_FOUND');
  return prisma.property.delete({ where: { id } });
}
