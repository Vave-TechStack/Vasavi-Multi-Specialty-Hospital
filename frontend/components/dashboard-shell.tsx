'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Ambulance, BarChart3, BedDouble, Bell, CalendarDays, FlaskConical, LayoutDashboard, LogOut, Menu, Moon, Package, Search, Settings, Stethoscope, Sun, Users, UserRoundCog, WalletCards, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Logo } from './logo';
import { NotificationBell } from './notification-panel';
import { useTheme } from './theme-provider';
import type { LucideIcon } from 'lucide-react';

export const modules: [string, string, LucideIcon][] = [
  ['Overview','/dashboard',LayoutDashboard],['Patients','/dashboard/patients',Users],['Appointments','/dashboard/appointments',CalendarDays],['Requests','/dashboard/requests',Bell],['Doctors','/dashboard/doctors',Stethoscope],['Billing','/dashboard/billing',WalletCards],['Pharmacy','/dashboard/pharmacy',Package],['Laboratory','/dashboard/laboratory',FlaskConical],['Staff & HR','/dashboard/staff',UserRoundCog],['Ward & beds','/dashboard/wards',BedDouble],['Emergency','/dashboard/emergency',Ambulance],['Reports','/dashboard/reports',BarChart3],  ['Settings','/dashboard/settings',Settings],
  ['Audit Log','/dashboard/audit-log',Search],
];

function tokenExpiry(token: string) {
  const encoded = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
  if (!encoded) return 0;
  const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=');
  return (JSON.parse(atob(padded)) as { exp?: number }).exp ?? 0;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const fetcher = (path: string) => fetch(`${apiUrl}${path}`, { headers: { Authorization: `Bearer ${localStorage.getItem('vasavi-token') || ''}` } }).then((res) => res.json());

type SearchResult = {
  type: string;
  label: string;
  detail: string;
  href: string;
};

function getUserInitials(): string {
  if (typeof window === 'undefined') return 'AR';
  try {
    const raw = localStorage.getItem('vasavi-user');
    if (!raw) return 'AR';
    const user = JSON.parse(raw) as { name?: string };
    if (!user.name) return 'AR';
    const parts = user.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  } catch {
    return 'AR';
  }
}

export function DashboardShell({children}:{children:React.ReactNode}) {
  const [open,setOpen]=useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [userInitials, setUserInitials] = useState('AR');
  const pathname=usePathname();
  const router=useRouter();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setUserInitials(getUserInitials());
  }, []);

  // Debounce search input to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: searchResults, isValidating: searchLoading } = useSWR<SearchResult[]>(
    debouncedSearch.trim().length >= 2 ? `/search?q=${encodeURIComponent(debouncedSearch.trim())}` : null,
    fetcher,
    { keepPreviousData: true }
  );

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

  function openResult(href: string) {
    setSearchTerm('');
    setDebouncedSearch('');
    router.push(href);
  }

  return <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
    {/* Mobile overlay */}
    {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-dark px-4 py-5 text-slate-300 transition-transform lg:translate-x-0 ${open?'translate-x-0':'-translate-x-full'}`}><div className="flex items-center justify-between px-2 text-white"><Logo/><button aria-label="Close navigation" className="lg:hidden" onClick={()=>setOpen(false)}><X/></button></div><nav className="hide-scrollbar mt-8 grid max-h-[calc(100vh-120px)] gap-1 overflow-y-auto">{modules.map(([label,href,Icon])=><Link onClick={()=>setOpen(false)} key={href as string} href={href as string} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${pathname===href?'bg-primary text-white':'hover:bg-white/5 hover:text-white'}`}><Icon size={18}/>{label as string}</Link>)}</nav><div className="absolute bottom-6 left-0 right-0 px-4"><button onClick={toggleTheme} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}{theme === 'dark' ? 'Light mode' : 'Dark mode'}</button></div></aside>
    <div className="lg:pl-72">
      <header className="sticky top-0 z-40 flex h-[76px] items-center gap-4 border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-white)' }}>
        <button aria-label="Open navigation" className="lg:hidden" onClick={()=>setOpen(true)}><Menu/></button>
        <div className="relative hidden max-w-md flex-1 sm:block">
          <Search className="absolute left-3 top-2.5" size={17} style={{ color: 'var(--text-muted)' }}/>
          <input aria-label="Search hospital records" placeholder="Search patients, doctors, invoices..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full rounded-full border-0 py-2 pl-10 text-sm focus:ring-primary" style={{ backgroundColor: 'var(--skeleton-bg)', color: 'var(--text-primary)' }}/>
          {debouncedSearch.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-12 overflow-hidden rounded-2xl border shadow-soft" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-white)' }}>
              <div className="max-h-96 overflow-y-auto p-2">
                {searchLoading ? (
                  <p className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Searching...</p>
                ) : searchResults && searchResults.length > 0 ? searchResults.map((result, index) => (
                  <button key={`${result.type}-${result.label}-${index}`} type="button" onClick={() => openResult(result.href)} className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition" style={{ color: 'var(--text-primary)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase text-primary">{result.type}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{result.label}</span>
                      <span className="block truncate text-xs" style={{ color: 'var(--text-muted)' }}>{result.detail}</span>
                    </span>
                  </button>
                )) : <p className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No matching records.</p>}
              </div>
            </div>
          )}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <NotificationBell />
          <button onClick={toggleTheme} className="grid size-10 place-items-center rounded-full transition" style={{ backgroundColor: 'var(--skeleton-bg)', color: 'var(--text-secondary)' }} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link href="/dashboard/appointments?new=true" className="hidden rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white sm:inline-flex">New appointment</Link>
          <div className="grid size-10 place-items-center rounded-full bg-secondary font-poppins text-xs font-bold text-dark" title={userInitials}>{userInitials}</div>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-600 dark:text-slate-400 dark:hover:border-red-400 dark:hover:bg-red-950 dark:hover:text-red-400" aria-label="Logout">
            <LogOut size={16}/>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>
      <main className="p-5 sm:p-8">{children}</main>
    </div>
  </div>
}
