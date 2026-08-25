import ApplicantDetail from '@/components/applicant-detail';

export default function Page({ params }: { params: { id: string } }) {
  return <ApplicantDetail id={params.id} />;
}
