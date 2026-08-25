import { owners as demoOwners } from '@/lib/demo-data';
import { isDemoMode, prisma } from '@/lib/prisma';

export type OwnerInput = {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
};

export async function listOwners() {
  if (isDemoMode) {
    return demoOwners.map((owner) => ({
      id: String(owner.id),
      name: owner.name,
      phone: owner.phone,
      email: null,
      address: null,
      notes: owner.note,
      propertiesCount: 0,
    }));
  }

  const owners = await prisma.owner.findMany({
    include: { _count: { select: { properties: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return owners.map((owner) => ({
    id: owner.id,
    name: owner.name,
    phone: owner.phone,
    email: owner.email,
    address: owner.address,
    notes: owner.notes,
    propertiesCount: owner._count.properties,
  }));
}

export async function createOwner(input: OwnerInput) {
  if (isDemoMode) {
    return {
      id: String(Date.now()),
      ...input,
      propertiesCount: 0,
    };
  }

  return prisma.owner.create({ data: input });
}
