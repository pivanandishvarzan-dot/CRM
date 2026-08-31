import { isDemoMode, prisma } from '@/lib/prisma';
import type { DataActor } from '@/lib/data-scope';
import { applicantScope, contractScope, propertyScope } from '@/lib/data-scope';

export type GlobalSearchResult = {
  id: string;
  type: 'PROPERTY' | 'OWNER' | 'APPLICANT' | 'CONTRACT';
  title: string;
  subtitle: string;
  href: string;
};

export async function globalSearch(query: string, actor: DataActor): Promise<GlobalSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  if (isDemoMode) return [];

  const [properties, owners, applicants, contracts] = await Promise.all([
    prisma.property.findMany({
      where: { AND: [propertyScope(actor), { OR: [
        { title: { contains: q, mode: 'insensitive' } }, { code: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } }, { district: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } }, { owner: { name: { contains: q, mode: 'insensitive' } } },
      ] }] }, select: { id: true, title: true, code: true, district: true, city: true }, take: 6,
    }),
    prisma.owner.findMany({
      where: { AND: [
        actor.role === 'SYSTEM_ADMIN' ? {} : { properties: { some: propertyScope(actor) } },
        { OR: [{ name: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }, { email: { contains: q, mode: 'insensitive' } }] },
      ] }, select: { id: true, name: true, phone: true }, take: 5,
    }),
    prisma.applicant.findMany({
      where: { AND: [applicantScope(actor), { OR: [
        { name: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }, { email: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
      ] }] }, select: { id: true, name: true, phone: true, status: true }, take: 6,
    }),
    prisma.contract.findMany({
      where: { AND: [contractScope(actor), { OR: [
        { number: { contains: q, mode: 'insensitive' } }, { type: { contains: q, mode: 'insensitive' } },
        { property: { title: { contains: q, mode: 'insensitive' } } }, { applicant: { name: { contains: q, mode: 'insensitive' } } },
      ] }] }, include: { property: { select: { title: true } }, applicant: { select: { name: true } } }, take: 5,
    }),
  ]);

  return [
    ...properties.map(x => ({ id: x.id, type: 'PROPERTY' as const, title: x.title, subtitle: `${x.code} · ${x.city}، ${x.district}`, href: `/properties/${x.id}` })),
    ...owners.map(x => ({ id: x.id, type: 'OWNER' as const, title: x.name, subtitle: `مالک · ${x.phone}`, href: `/owners?search=${encodeURIComponent(x.name)}` })),
    ...applicants.map(x => ({ id: x.id, type: 'APPLICANT' as const, title: x.name, subtitle: `متقاضی · ${x.phone}`, href: `/applicants/${x.id}` })),
    ...contracts.map(x => ({ id: x.id, type: 'CONTRACT' as const, title: `قرارداد ${x.number}`, subtitle: `${x.property.title} · ${x.applicant.name}`, href: `/contracts?search=${encodeURIComponent(x.number)}` })),
  ].slice(0, 20);
}
