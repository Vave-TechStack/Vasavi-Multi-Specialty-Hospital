'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Ambulance, BarChart3, BedDouble, Bell, CalendarDays, FlaskConical, LayoutDashboard, LogOut, Menu, Package, Search, Settings, Stethoscope, Users, UserRoundCog, WalletCards, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Logo } from './logo';
import type { LucideIcon } from 'lucide-react';

export const modules: [string, string, LucideIcon][] = [
  ['Overview','/dashboard',LayoutDashboard],['Patients','/dashboard/patients',Users],['Appointments','/dashboard/appointments',CalendarDays],['Doctors','/dashboard/doctors',Stethoscope],['Billing','/dashboard/billing',WalletCards],['Pharmacy','/dashboard/pharmacy',Package],['Laboratory','/dashboard/laboratory',FlaskConical],['Staff & HR','/dashboard/staff',UserRoundCog],['Ward & beds','/dashboard/wards',BedDouble],['Emergency','/dashboard/emergency',Ambulance],['Reports','/dashboard/reports',BarChart3],['Settings','/dashboard/settings',Settings],
];

function tokenExpiry(token: string) {
  const encoded = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
  if (!encoded) return 0;
  const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=');
  return (JSON.parse(atob(padded)) as { exp?: number }).exp ?? 0;
}

export function DashboardShell({children}:{children:React.ReactNode}) {
  const [open,setOpen]=useState(false);
  const pathname=usePathname();
  const router=useRouter();

  useEffect(() => {
    const token = localStorage.getItem('vasavi-token');
    try {
      // Allow up to 24 hours of clock skew to prevent immediate logouts due to desynchronized system clocks
      const skewToleranceMs = 24 * 60 * 60 * 1000;
      if (!token || !localStorage.getItem('vasavi-user') || (tokenExpiry(token) * 1000) + skewToleranceMs <= Date.now()) throw new Error('Expired session');
    } catch {
      localStorage.removeItem('vasavi-user');
      localStorage.removeItem('vasavi-token');
      router.replace('/login');
    }
  }, [router]);

  function logout() {
    localStorage.removeItem('vasavi-user');
    localStorage.removeItem('vasavi-token');
    router.replace('/login');
  }

  return <div className="min-h-screen bg-[#f5f8f8]">
    <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-dark px-4 py-5 text-slate-300 transition-transform lg:translate-x-0 ${open?'translate-x-0':'-translate-x-full'}`}><div className="flex items-center justify-between px-2 text-white"><Logo/><button aria-label="Close navigation" className="lg:hidden" onClick={()=>setOpen(false)}><X/></button></div><nav className="hide-scrollbar mt-8 grid max-h-[calc(100vh-120px)] gap-1 overflow-y-auto">{modules.map(([label,href,Icon])=><Link onClick={()=>setOpen(false)} key={href as string} href={href as string} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${pathname===href?'bg-primary text-white':'hover:bg-white/5 hover:text-white'}`}><Icon size={18}/>{label as string}</Link>)}</nav></aside>
    <div className="lg:pl-72"><header className="sticky top-0 z-40 flex h-[76px] items-center gap-4 border-b border-slate-200/70 bg-white/90 px-5 backdrop-blur-xl sm:px-8"><button aria-label="Open navigation" className="lg:hidden" onClick={()=>setOpen(true)}><Menu/></button><div className="relative hidden max-w-md flex-1 sm:block"><Search className="absolute left-3 top-2.5 text-slate-400" size={17}/><input aria-label="Search hospital records" placeholder="Search patients, doctors, invoices..." className="w-full rounded-full border-0 bg-slate-100 py-2 pl-10 text-sm focus:ring-primary"/></div><div className="ml-auto flex items-center gap-3"><button aria-label="Notifications" className="relative grid size-10 place-items-center rounded-full bg-slate-100"><Bell size={18}/><span className="absolute right-1 top-1 size-2 rounded-full bg-red-500"/></button><Link href="/dashboard/appointments?new=true" className="hidden rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white sm:inline-flex">New appointment</Link><div className="grid size-10 place-items-center rounded-full bg-secondary font-poppins text-xs font-bold text-dark">AR</div><button onClick={logout} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600" aria-label="Logout"><LogOut size={16}/><span className="hidden sm:inline">Logout</span></button></div></header><main className="p-5 sm:p-8">{children}</main></div>
  </div>
}
