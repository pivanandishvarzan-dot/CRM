import { notFound } from 'next/navigation';
import PropertyDetail from '@/components/property-detail';
import { getProperty } from '@/lib/repositories/property-repository';
import { requireUser } from '@/lib/authz';

export default async function Page({ params }: { params: { id: string } }) {
  const actor = await requireUser();
  const property = await getProperty(params.id, actor);
  if (!property) notFound();
  return <PropertyDetail initialProperty={property} />;
}
