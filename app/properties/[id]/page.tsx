import PropertyDetail from '@/components/property-detail';

export default function Page({ params }: { params: { id: string } }) {
  return <PropertyDetail propertyId={Number(params.id)} />;
}
