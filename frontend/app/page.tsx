import Image from 'next/image';
import Link from 'next/link';
import { Activity, Ambulance, ArrowRight, Award, BadgeCheck, BedDouble, Check, ChevronRight, Clock3, FlaskConical, HeartHandshake, Microscope, Phone, Pill, Play, Quote, ShieldCheck, Sparkles, Star, Stethoscope, Syringe } from 'lucide-react';
import { AppointmentForm } from '@/components/appointment-form';
import { SectionHeading } from '@/components/section-heading';
import { departments, doctors } from '@/lib/data';

const stats = [['50+','Specialist doctors'],['100+','Advanced care beds'],['25K+','Patients treated'],['24/7','Emergency response']];
const why = [
  [Award,'Experienced specialists','Care led by respected consultants across every major specialty.'],
  [Activity,'Advanced equipment','Modern imaging, diagnostics, operating theatres and critical care.'],
  [HeartHandshake,'Affordable care','Transparent treatment plans designed around your needs.'],
  [Clock3,'Always available','A responsive emergency and support team, 24 hours a day.'],
  [ShieldCheck,'Digital records','Secure, connected health records for smoother continuity of care.'],
  [Sparkles,'Faster service','Coordinated departments and shorter waiting times.'],
];
const facilities = [[BedDouble,'Intensive Care Unit'],[Pill,'24/7 Pharmacy'],[FlaskConical,'Laboratory'],[Ambulance,'Ambulance'],[Syringe,'Operation Theatre'],[Microscope,'Diagnostic Centre']];

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

      <section className="container-pad relative z-10 -mt-2 lg:-mt-8"><div className="grid overflow-hidden rounded-[1.75rem] bg-dark text-white shadow-2xl md:grid-cols-4">{stats.map(([n,l],i)=><div key={l} className={`p-7 text-center ${i ? 'border-white/10 md:border-l' : ''}`}><p className="font-poppins text-3xl font-semibold text-secondary">{n}</p><p className="mt-1 text-sm text-slate-300">{l}</p></div>)}</div></section>

      <section className="container-pad py-24"><div className="grid items-center gap-14 lg:grid-cols-2">
        <div className="relative"><Image src="https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1200&q=85" width={900} height={700} alt="Modern hospital interior" className="h-[500px] rounded-[2rem] object-cover"/><div className="glass absolute -bottom-7 -right-2 max-w-xs rounded-2xl p-5 sm:right-8"><p className="font-poppins text-lg font-semibold">Care built around you</p><p className="mt-2 text-sm leading-6 text-slate-600">Every specialty, test and treatment connected under one roof.</p></div></div>
        <div><SectionHeading eyebrow="About Vasavi" title="Clinical excellence. Human warmth." text="Vasavi Multi Specialty Hospital brings trusted specialists, advanced care pathways and thoughtful service together to help every patient feel informed and supported."/><div className="mt-8 grid gap-4 sm:grid-cols-3">{[['Our mission','Make high-quality care accessible.'],['Our vision','Set a new standard for healing.'],['Our values','Integrity, empathy and excellence.']].map(([h,p])=><div className="rounded-2xl bg-slate-50 p-5" key={h}><h3 className="font-poppins font-semibold text-primary">{h}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{p}</p></div>)}</div><Link href="/about" className="mt-8 inline-flex items-center gap-2 font-semibold text-primary">Our hospital story <ArrowRight size={16}/></Link></div>
      </div></section>

      <section className="bg-slate-50 py-24"><div className="container-pad"><SectionHeading center eyebrow="Centres of excellence" title="Specialist care for every chapter of life" text="Integrated departments that work together for quicker diagnoses, clear treatment plans and better outcomes."/><div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{departments.map(({name,icon:Icon,text})=><Link href="/services" className="card group p-6" key={name}><span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white"><Icon size={23}/></span><h3 className="mt-5 font-poppins text-lg font-semibold">{name}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p><ChevronRight className="mt-5 text-primary" size={18}/></Link>)}</div></div></section>

      <section className="container-pad py-24"><div className="grid gap-14 lg:grid-cols-[.9fr_1.1fr]"><div><SectionHeading eyebrow="Why choose us" title="Modern medicine, made more personal" text="We combine the capabilities of a leading hospital with the attention you expect from your own doctor."/><Image src="https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=900&q=85" width={700} height={450} alt="Medical team" className="mt-9 h-64 rounded-[1.75rem] object-cover"/></div><div className="grid gap-5 sm:grid-cols-2">{why.map(([Icon,title,text])=><div className="rounded-2xl border border-slate-100 p-6" key={title as string}><Icon className="text-primary" size={24}/><h3 className="mt-4 font-poppins font-semibold">{title as string}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text as string}</p></div>)}</div></div></section>

      <section className="overflow-hidden bg-primary py-24 text-white"><div className="container-pad"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><SectionHeading eyebrow="Our specialists" title="Meet the people behind your care" text="Senior clinicians, attentive listeners and committed partners in your health."/><Link href="/doctors" className="btn-secondary shrink-0">View all doctors <ArrowRight size={16}/></Link></div><div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{doctors.map(d=><div className="overflow-hidden rounded-[1.75rem] bg-white text-dark" key={d.name}><Image src={d.image} width={600} height={650} alt={d.name} className="h-64 w-full object-cover object-top"/><div className="p-5"><span className="text-xs font-semibold text-primary">{d.available}</span><h3 className="mt-2 font-poppins text-lg font-semibold">{d.name}</h3><p className="mt-1 text-sm text-slate-500">{d.role}</p><p className="mt-3 text-xs text-slate-400">{d.exp}</p></div></div>)}</div></div></section>

      <section className="container-pad py-24"><SectionHeading center eyebrow="Everything under one roof" title="Facilities designed for safer, faster care"/><div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">{facilities.map(([Icon,n])=><div className="rounded-2xl border border-slate-100 p-5 text-center shadow-sm" key={n as string}><Icon className="mx-auto text-primary" size={27}/><p className="mt-3 text-sm font-semibold">{n as string}</p></div>)}</div></section>

      <section className="bg-[#effaf8] py-24"><div className="container-pad"><SectionHeading center eyebrow="Patient stories" title="Trusted by families, every day"/><div className="mt-12 grid gap-6 lg:grid-cols-3">{[
        ['“The emergency team acted quickly and kept our family informed at every step. We felt genuinely cared for.”','Radhika S.','Cardiac care'],
        ['“Everything from consultation to physiotherapy was coordinated smoothly. I was back on my feet sooner than expected.”','Manoj K.','Orthopedics'],
        ['“Our pediatrician was patient, clear and wonderful with our daughter. The experience made a stressful day much easier.”','Priya R.','Pediatrics'],
      ].map(([q,n,r],i)=><article className={`rounded-[1.75rem] p-7 ${i===1?'bg-primary text-white':'bg-white'}`} key={n}><Quote className={i===1?'text-secondary':'text-primary'} size={30}/><div className="mt-5 flex text-amber-400">{[1,2,3,4,5].map(x=><Star key={x} size={14} fill="currentColor"/>)}</div><p className="mt-5 leading-7">{q}</p><p className="mt-6 font-poppins font-semibold">{n}</p><p className={`text-xs ${i===1?'text-teal-100':'text-slate-400'}`}>{r}</p>{i===1&&<button aria-label="Play video testimonial" className="mt-5 flex items-center gap-2 text-xs font-semibold"><span className="grid size-8 place-items-center rounded-full bg-white text-primary"><Play size={12} fill="currentColor"/></span> Play story</button>}</article>)}</div></div></section>

      <section className="container-pad py-24"><SectionHeading eyebrow="Health library" title="Useful guidance from our specialists"/><div className="mt-10 grid gap-6 md:grid-cols-3">{[
        ['https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=85','Heart health','7 everyday habits for a healthier heart'],
        ['https://images.unsplash.com/photo-1516841273335-e39b37888115?auto=format&fit=crop&w=800&q=85','Family health','Building a preventive health routine'],
        ['https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=800&q=85','Nutrition','Small nutrition changes with a big impact'],
      ].map(([img,cat,title])=><article className="group" key={title}><Image src={img} width={700} height={450} alt="" className="h-52 w-full rounded-2xl object-cover transition group-hover:scale-[1.01]"/><p className="mt-5 text-xs font-bold uppercase tracking-widest text-primary">{cat}</p><h3 className="mt-2 font-poppins text-lg font-semibold">{title}</h3><p className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-500">Read article <ArrowRight size={15}/></p></article>)}</div></section>

      <section className="container-pad pb-24"><div className="overflow-hidden rounded-[2rem] bg-dark text-white"><div className="grid lg:grid-cols-[.9fr_1.1fr]"><div className="p-8 sm:p-12 lg:p-14"><p className="eyebrow !text-secondary">Your health, your time</p><h2 className="mt-4 font-poppins text-3xl font-semibold tracking-tight sm:text-4xl">Book your appointment in minutes.</h2><p className="mt-4 max-w-lg leading-7 text-slate-300">Choose a department, doctor and preferred date. Our care coordinator will take it from there.</p><div className="mt-8 flex items-center gap-3 text-sm text-slate-300"><Phone className="text-secondary"/> Need help? +91 98765 43210</div></div><div className="bg-white p-8 text-dark sm:p-12"><AppointmentForm compact/></div></div></div></section>
    </>
  );
}
