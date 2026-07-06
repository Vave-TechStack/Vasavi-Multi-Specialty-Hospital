import { HospitalData } from '@/components/hospital-data';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HospitalData patientId={id} />;
}
