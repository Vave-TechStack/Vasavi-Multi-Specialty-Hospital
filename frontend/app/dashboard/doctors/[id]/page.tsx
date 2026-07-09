import { DoctorProfile } from '@/components/doctor-profile';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DoctorProfile doctorId={id} />;
}
