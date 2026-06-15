import { AppointmentForm } from '@/components/appointment-form';
import { PageHero } from '@/components/public-page';

export const metadata = { title: 'Book an Appointment' };

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Appointments"
        title="Let's find the right care for you."
        text="Request a convenient time with one of our specialists. Our team will call to confirm."
        image="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=85"
      />
      <section className="container-pad py-20">
        <div className="mx-auto max-w-3xl card p-8 sm:p-10">
          <h2 className="font-poppins text-2xl font-semibold">Appointment details</h2>
          <p className="mb-7 mt-2 text-sm text-slate-500">
            For emergencies, call +91 98765 43210 immediately.
          </p>
          <AppointmentForm compact />
        </div>
      </section>
    </>
  );
}
