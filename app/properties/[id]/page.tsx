import { notFound } from 'next/navigation';
import PropertyDetail from '@/components/property-detail';
import { getProperty } from '@/lib/repositories/property-repository';

export default async function Page({ params }: { params: { id: string } }) {
  const property = await getProperty(params.id);
  if (!property) notFound();
  return <PropertyDetail initialProperty={property} />;
}
