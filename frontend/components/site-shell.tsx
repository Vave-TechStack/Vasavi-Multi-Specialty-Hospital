'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowRight, Clock3, Facebook, Instagram, Linkedin, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { Logo } from './logo';
import { AppointmentModal } from '@/components/appointment-modal';

const links = [['Home','/'],['About','/about'],['Services','/services'],['Doctors','/doctors'],['Testimonials','/testimonials'],['Contact','/contact']];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const pathname = usePathname();
  if (pathname.startsWith('/dashboard') || pathname === '/login') return null;
  return (
    <>
      <div className="hidden bg-dark py-2 text-xs text-slate-300 md:block">
        <div className="container-pad flex items-center justify-between">
          <div className="flex gap-6"><span className="flex gap-2"><MapPin size={14}/> Hyderabad, Telangana</span><span className="flex gap-2"><Clock3 size={14}/> Open 24 hours, every day</span></div>
          <a href="tel:+919876543210" className="flex items-center gap-2 font-semibold text-white"><Phone size={14}/> Emergency: +91 98765 43210</a>
        </div>
      </div>
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
        <div className="container-pad flex h-[78px] items-center justify-between">
          <Link href="/"><Logo /></Link>
          <nav className="hidden items-center gap-7 lg:flex">
            {links.map(([label, href]) => <Link className="text-sm font-medium text-slate-600 transition hover:text-primary" href={href} key={href}>{label}</Link>)}
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <Link href="/login" className="px-3 text-sm font-semibold text-slate-600">Login</Link>
            <button onClick={() => setShowModal(true)} className="btn-primary !px-5 !py-3">Book Appointment <ArrowRight size={16}/></button>
          </div>
          <button aria-label="Open menu" className="rounded-xl border border-slate-200 p-2.5 sm:hidden" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
        </div>
        {open && <nav className="container-pad flex flex-col gap-1 border-t border-slate-100 py-4 sm:hidden">{links.map(([label, href]) => <Link onClick={()=>setOpen(false)} className="rounded-xl px-4 py-3 font-medium hover:bg-slate-50" href={href} key={href}>{label}</Link>)}<button onClick={() => setShowModal(true)} className="btn-primary mt-2">Book Appointment</button></nav>}
      </header>{showModal && <AppointmentModal onClose={() => setShowModal(false)} />}
    </>
  );
}

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith('/dashboard') || pathname === '/login') return null;
  return (
    <footer className="bg-dark pt-16 text-slate-300">
      <div className="container-pad grid gap-10 pb-12 md:grid-cols-2 lg:grid-cols-4">
        <div><Logo/><p className="mt-5 max-w-sm text-sm leading-7">Trusted multi-specialty care that combines modern medicine with thoughtful, human attention.</p><div className="mt-5 flex gap-3">{[Facebook,Instagram,Linkedin].map((Icon,i)=><span key={i} className="grid size-9 place-items-center rounded-full bg-white/10"><Icon size={16}/></span>)}</div></div>
        <div><h3 className="mb-5 font-poppins font-semibold text-white">Quick links</h3><div className="grid gap-3 text-sm">{links.slice(1).map(([l,h])=><Link href={h} key={h}>{l}</Link>)}</div></div>
        <div><h3 className="mb-5 font-poppins font-semibold text-white">Centres of excellence</h3><div className="grid gap-3 text-sm"><span>Cardiac sciences</span><span>Neurosciences</span><span>Orthopedics</span><span>Women & child care</span><span>24/7 Emergency</span></div></div>
        <div><h3 className="mb-5 font-poppins font-semibold text-white">Stay informed</h3><p className="text-sm leading-6">Practical health guidance from our clinical team.</p><a href="mailto:care@vasavihospital.com?subject=Health updates" className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">Request health updates <ArrowRight size={16}/></a><p className="mt-5 flex gap-2 text-sm"><Mail size={16}/> care@vasavihospital.com</p></div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-400">© 2026 Vasavi Multi Specialty Hospital. All rights reserved.</div>
    </footer>
  );
}
