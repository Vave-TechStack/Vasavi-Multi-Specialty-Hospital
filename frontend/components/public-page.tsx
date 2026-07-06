'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowRight, Award, BadgeCheck, CheckCircle2, Mail, MapPin, Phone, Star } from 'lucide-react';
import { ContactForm } from './contact-form';
import { SectionHeading } from './section-heading';
import { DepartmentShowcase, DoctorShowcase } from '@/components/hospital-data';

export function PageHero({ eyebrow, title, text, image }: { eyebrow: string; title: string; text: string; image: string }) {
  return <section className="bg-[#effaf8] py-16 lg:py-20"><div className="container-pad grid items-center gap-10 lg:grid-cols-2"><div><p className="eyebrow">{eyebrow}</p><h1 className="display mt-4">{title}</h1><p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">{text}</p></div><Image src={image} width={900} height={550} alt="" className="h-72 w-full rounded-[2rem] object-cover lg:h-80"/></div></section>;
}

export function AboutContent() {
  const values = [['Mission','Make excellent care accessible and dependable.'],['Vision',"Be the region's most trusted health partner."],['Integrity','Do what is right, clearly and consistently.'],['Compassion','Care for the person, not only the condition.']];
  return <><PageHero eyebrow="About us" title="A hospital with a clear purpose." text="To make advanced healthcare more accessible, more coordinated and more human for every family we serve." image="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=85"/><section className="container-pad py-20"><div className="grid gap-12 lg:grid-cols-2"><SectionHeading eyebrow="Our story" title="Built for better care, from the first conversation to recovery." text="Vasavi began with a simple belief: clinical excellence matters most when patients feel heard. Today, multidisciplinary teams work together across diagnosis, treatment and rehabilitation, supported by modern infrastructure and clear communication."/><div className="grid gap-4 sm:grid-cols-2">{values.map(([a,b])=><div className="rounded-2xl bg-slate-50 p-6" key={a}><CheckCircle2 className="text-primary"/><h3 className="mt-4 font-poppins font-semibold">{a}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{b}</p></div>)}</div></div></section><section className="bg-dark py-20 text-white"><div className="container-pad"><SectionHeading eyebrow="Recognition" title="Standards you can trust"/><div className="mt-10 grid gap-5 md:grid-cols-3">{[['NABH','Quality standards'],['ISO 9001','Certified systems'],['25K+','Patients served']].map(([a,b])=><div className="rounded-2xl border border-white/10 bg-white/5 p-7" key={a}><Award className="text-secondary"/><p className="mt-5 font-poppins text-2xl font-semibold">{a}</p><p className="mt-1 text-sm text-slate-400">{b}</p></div>)}</div></div></section></>;
}

export function ServicesContent() {
  return <><PageHero eyebrow="Medical services" title="Specialist teams, connected around you." text="Explore comprehensive medical, surgical, diagnostic and emergency care delivered through our centres of excellence." image="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=85"/><section className="container-pad py-20"><DepartmentShowcase compact /></section></>;
}

export function DoctorsContent() {
  return <><PageHero eyebrow="Our doctors" title="Specialists who listen first." text="Find the right consultant, view their expertise and request a convenient appointment." image="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=85"/><section className="container-pad py-20"><DoctorShowcase limit={8} /></section></>;
}

export function TestimonialsContent() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    fetch(apiUrl + '/public/testimonials')
      .then(r => r.json())
      .then(data => { setList(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => {
        setList([]);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="container-pad py-20 text-center text-slate-500">Loading patient stories...</div>;

  return (
    <>
      <PageHero eyebrow="Patient stories" title="Care people remember." text="Real experiences from patients and families who trusted Vasavi with their care." image="https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=1200&q=85" />
      <section className="container-pad py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map((t, i) => (
            <article className="card p-7" key={i}>
              <div className="flex text-amber-400">{[1,2,3,4,5].map(x => <Star key={x} size={15} fill="currentColor" />)}</div>
              <p className="mt-5 leading-7 text-slate-600">&ldquo;{t.text}&rdquo;</p>
              <p className="mt-6 font-poppins font-semibold">{t.name}</p>
              <p className="text-xs text-slate-400">{t.department || t.dept || ""}</p>
              <p className="mt-1 text-xs text-slate-400 italic">Written by: {t.name}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

export function ContactContent() {
  return <><PageHero eyebrow="Contact us" title="We're here when you need us." text="Reach our care team for appointments, directions, medical records, or urgent support." image="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=85"/><section className="container-pad py-20"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div className="grid gap-4">{[[Phone,'Call us','+91 98765 43210'],[Mail,'Email us','care@vasavihospital.com'],[MapPin,'Visit us','Banjara Hills, Hyderabad, Telangana']].map(([Icon,a,b])=><div className="rounded-2xl bg-slate-50 p-6" key={a as string}><Icon className="text-primary"/><p className="mt-4 font-poppins font-semibold">{a as string}</p><p className="mt-1 text-sm text-slate-500">{b as string}</p></div>)}</div><ContactForm/></div><div className="mt-12 grid h-80 place-items-center rounded-[2rem] bg-slate-200 text-center text-slate-500"><div><MapPin className="mx-auto mb-3 text-primary" size={30}/><p className="font-semibold">Vasavi Multi Specialty Hospital</p><p className="mt-1 text-sm">Banjara Hills, Hyderabad</p></div></div></section></>;
}
