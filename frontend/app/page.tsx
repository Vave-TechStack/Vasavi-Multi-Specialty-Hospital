import Image from 'next/image';
import Link from 'next/link';
import { Activity, Award, BadgeCheck, Check, ChevronRight, Clock3, HeartHandshake, Phone, ShieldCheck, Sparkles, Star, Stethoscope, ArrowRight } from 'lucide-react';
import { AppointmentForm } from '@/components/appointment-form';
import { DepartmentShowcase, DoctorShowcase } from '@/components/hospital-data';
import { SectionHeading } from '@/components/section-heading';
import { HomepageStats, HomepageTestimonials, HomepageFacilities, HomepageHealthArticles } from '@/components/homepage-data';

const why = [
  [Award, 'Experienced specialists', 'Care led by respected consultants across every major specialty.'],
  [Activity, 'Advanced equipment', 'Modern imaging, diagnostics, operating theatres and critical care.'],
  [HeartHandshake, 'Affordable care', 'Transparent treatment plans designed around your needs.'],
  [Clock3, 'Always available', 'A responsive emergency and support team, 24 hours a day.'],
  [ShieldCheck, 'Digital records', 'Secure, connected health records for smoother continuity of care.'],
  [Sparkles, 'Faster service', 'Coordinated departments and shorter waiting times.'],
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-[#effaf8] pb-16 pt-12 lg:pb-24 lg:pt-20">
        <div className="absolute -right-24 -top-32 size-[500px] rounded-full bg-secondary/15 blur-3xl"/>
        <div className="container-pad relative grid items-center gap-12 lg:grid-cols-[1.02fr_.98fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-primary"><BadgeCheck size={16}/> NABH standards of care</div>
            <h1 className="display max-w-3xl">Advanced healthcare with <span className="text-primary">compassion</span> & excellence.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">World-class medical care delivered by experienced specialists, supported by modern technology and a team that listens.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/appointment" className="btn-primary">Book appointment <ArrowRight size={17}/></Link><Link href="/doctors" className="btn-secondary">Find a doctor <Stethoscope size={17}/></Link></div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-slate-600">{['Specialist-led care','Transparent pricing','24/7 emergency'].map(x=><span className="flex items-center gap-2" key={x}><span className="grid size-5 place-items-center rounded-full bg-primary text-white"><Check size={12}/></span>{x}</span>)}</div>
          </div>
          <div className="relative mx-auto w-full max-w-[620px]">
            <div className="absolute -left-10 top-16 hidden rounded-2xl bg-white p-4 shadow-soft sm:block"><p className="text-xs text-slate-500">Patient satisfaction</p><p className="mt-1 font-poppins text-2xl font-semibold">4.9<span className="text-sm text-slate-400">/5</span></p><div className="mt-1 flex text-amber-400">{[1,2,3,4,5].map(x=><Star key={x} size={12} fill="currentColor"/>)}</div></div>
            <Image priority src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=90" width={800} height={900} alt="Doctor speaking with a patient" className="h-[540px] rounded-[2.5rem] object-cover shadow-soft"/>
            <div className="glass absolute -bottom-7 right-4 flex max-w-xs items-center gap-4 rounded-2xl p-4 sm:right-8"><span className="grid size-12 shrink-0 place-items-center rounded-xl bg-red-50 text-red-500"><Phone size={22}/></span><div><p className="text-xs font-semibold uppercase tracking-wider text-red-500">Emergency line</p><p className="mt-1 font-poppins font-semibold">+91 98765 43210</p></div></div>
          </div>
        </div>
      </section>

      {/* Dynamic stats from API */}
      <HomepageStats />

      <section className="container-pad py-24"><div className="grid items-center gap-14 lg:grid-cols-2">
        <div className="relative"><Image src="https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1200&q=85" width={900} height={700} alt="Modern hospital interior" className="h-[500px] rounded-[2rem] object-cover"/><div className="glass absolute -bottom-7 -right-2 max-w-xs rounded-2xl p-5 sm:right-8"><p className="font-poppins text-lg font-semibold">Care built around you</p><p className="mt-2 text-sm leading-6 text-slate-600">Every specialty, test and treatment connected under one roof.</p></div></div>
        <div><SectionHeading eyebrow="About Vasavi" title="Clinical excellence. Human warmth." text="Vasavi Multi Specialty Hospital brings trusted specialists, advanced care pathways and thoughtful service together to help every patient feel informed and supported."/><div className="mt-8 grid gap-4 sm:grid-cols-3">{[['Our mission','Make high-quality care accessible.'],['Our vision','Set a new standard for healing.'],['Our values','Integrity, empathy and excellence.']].map(([h,p])=><div className="rounded-2xl bg-slate-50 p-5" key={h}><h3 className="font-poppins font-semibold text-primary">{h}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{p}</p></div>)}</div><Link href="/about" className="mt-8 inline-flex items-center gap-2 font-semibold text-primary">Our hospital story <ArrowRight size={16}/></Link></div>
      </div></section>

      <section className="bg-slate-50 py-24"><div className="container-pad"><SectionHeading center eyebrow="Centres of excellence" title="Specialist care for every chapter of life" text="Integrated departments that work together for quicker diagnoses, clear treatment plans and better outcomes."/><DepartmentShowcase /></div></section>

      <section className="container-pad py-24"><div className="grid gap-14 lg:grid-cols-[.9fr_1.1fr]"><div><SectionHeading eyebrow="Why choose us" title="Modern medicine, made more personal" text="We combine the capabilities of a leading hospital with the attention you expect from your own doctor."/><Image src="https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=900&q=85" width={700} height={450} alt="Medical team" className="mt-9 h-64 rounded-[1.75rem] object-cover"/></div><div className="grid gap-5 sm:grid-cols-2">{why.map(([Icon,title,text])=><div className="rounded-2xl border border-slate-100 p-6" key={title as string}><Icon className="text-primary" size={24}/><h3 className="mt-4 font-poppins font-semibold">{title as string}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text as string}</p></div>)}</div></div></section>

      <section className="overflow-hidden bg-primary py-24 text-white"><div className="container-pad"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><SectionHeading eyebrow="Our specialists" title="Meet the people behind your care" text="Senior clinicians, attentive listeners and committed partners in your health."/><Link href="/doctors" className="btn-secondary shrink-0">View all doctors <ArrowRight size={16}/></Link></div><DoctorShowcase /></div></section>

      {/* Dynamic facilities from API */}
      <HomepageFacilities />

      {/* Dynamic testimonials from API */}
      <HomepageTestimonials />

      {/* Dynamic health articles from API */}
      <HomepageHealthArticles />

      <section className="container-pad pb-24"><div className="overflow-hidden rounded-[2rem] bg-dark text-white"><div className="grid lg:grid-cols-[.9fr_1.1fr]"><div className="p-8 sm:p-12 lg:p-14"><p className="eyebrow !text-secondary">Your health, your time</p><h2 className="mt-4 font-poppins text-3xl font-semibold tracking-tight sm:text-4xl">Book your appointment in minutes.</h2><p className="mt-4 max-w-lg leading-7 text-slate-300">Choose a department, doctor and preferred date. Our care coordinator will take it from there.</p><div className="mt-8 flex items-center gap-3 text-sm text-slate-300"><Phone className="text-secondary"/> Need help? +91 98765 43210</div></div><div className="bg-white p-8 text-dark sm:p-12"><AppointmentForm compact/></div></div></div></section>
    </>
  );
}
