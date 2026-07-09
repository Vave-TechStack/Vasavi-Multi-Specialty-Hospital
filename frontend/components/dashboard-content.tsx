'use client';
import { ArrowDownRight, ArrowUpRight, Building2, CalendarDays, ChevronRight, CircleDollarSign, Clock, Download, Edit2, FlaskConical, Hospital, MoreHorizontal, Plus, Search, Stethoscope, Trash2, Users, UserPlus, Activity, AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { LucideIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { Spinner } from '@/components/spinner';
import { ModulePageSkeleton, StatCardSkeleton, TableSkeleton, PageTitleSkeleton } from '@/components/skeleton';
import { WardOccupancyCards } from '@/components/ward-occupancy';
import { useToast } from '@/components/toast-provider';

import { io as socketIO } from 'socket.io-client';
import { useRouter } from 'next/navigation';

function getGreeting(): string {
  if (typeof window === 'undefined') return 'Good morning';
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getUserName(): string {
  if (typeof window === 'undefined') return 'Admin';
  try {
    const raw = localStorage.getItem('vasavi-user');
    if (!raw) return 'Admin';
    const user = JSON.parse(raw) as { name?: string };
    return user.name || 'Admin';
  } catch {
    return 'Admin';
  }
}

const emptyChart: { d: string; v: number }[] = [];

export function Overview(){
  const router = useRouter();
  const { data: dbStats, error: dbError } = useSWR('/dashboard', fetcher, { refreshInterval: 5000 });
  const { data: appointmentsList, error: appointmentsError } = useSWR('/appointments', fetcher, { refreshInterval: 5000 });
  const { data: chartData, error: chartError } = useSWR('/dashboard/chart', fetcher, { refreshInterval: 5000 });

  const [greeting] = useState(getGreeting);
  const [userName] = useState(getUserName);

  if (dbError || appointmentsError || chartError) {
    return <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-sm">
      <div className="grid size-14 place-items-center rounded-full bg-red-100 mb-4">
        <ArrowDownRight size={24} className="text-red-500" />
      </div>
      <h3 className="font-poppins text-lg font-semibold mb-1">Failed to load dashboard data</h3>
      <p className="text-sm text-slate-500 mb-4">There was a problem connecting to the server. Refreshing in a few seconds...</p>
      <button onClick={() => window.location.reload()} className="btn-primary !px-6">Refresh page</button>
    </div>;
  }
  if (!dbStats || !appointmentsList || !chartData) {
    return <ModulePageSkeleton />;
  }

  const activePatients = dbStats?.patients?.toLocaleString() || '0';
  const totalDocs = dbStats?.doctors?.toLocaleString() || '0';
  const todayApps = dbStats?.appointments?.toLocaleString() || '0';

  const stats = [
    { icon: CircleDollarSign, label: 'Today\'s revenue', value: `₹${Number(dbStats?.todayRevenue ?? 0).toLocaleString()}`, detail: 'Live', up: true, pct: 85 },
    { icon: CalendarDays, label: 'Appointments', value: todayApps, detail: 'Live', up: true, pct: Math.min(100, Math.round((Number(dbStats?.appointments ?? 0) / 50) * 100)) },
    { icon: Users, label: 'Active patients', value: activePatients, detail: 'Live', up: true, pct: Math.min(100, Math.round((Number(dbStats?.patients ?? 0) / 200) * 100)) },
    { icon: Stethoscope, label: 'Doctors on duty', value: totalDocs, detail: 'Live', up: true, pct: Math.min(100, Math.round((Number(dbStats?.doctors ?? 0) / 30) * 100)) },
  ];

  let displayAppointments: string[][] = [];
  if (appointmentsList && Array.isArray(appointmentsList)) {
    displayAppointments = appointmentsList.map((a: any) => {
      const timeStr = a.scheduledAt ? new Date(a.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00';
      return [
        timeStr,
        a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : 'Patient',
        a.doctor?.user?.name || 'Unassigned doctor',
        a.department?.name || 'No department',
        a.status || 'SCHEDULED'
      ];
    });
  }

  const liveOpsData = [
    ['Emergency queue', (dbStats?.liveOps?.emergencyQueue ?? 0).toString(), 'Active cases'],
    ['Beds available', (dbStats?.liveOps?.bedsAvailable ?? 0).toString(), 'Ready to allocate'],
    ['Lab results pending', (dbStats?.liveOps?.labPending ?? 0).toString(), 'Processing'],
  ];

  return <>
    <PageTitle title={`${greeting}, ${userName}`} text="Here\'s what is happening across Vasavi today." onAction={() => router.push('/dashboard/appointments?new=true')}/>
      {/* Ward Occupancy Section */}
      <div className="mb-8">
        <WardOccupancyCards />
      </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({icon:Icon,label,value,detail,up,pct})=>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" key={label}>
          <div className="flex justify-between">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon size={19}/></span>
            <span className={`flex items-center gap-1 text-xs font-semibold ${up?'text-emerald-600':'text-slate-400'}`}>{up?<ArrowUpRight size={14}/>:<ArrowDownRight size={14}/>} {detail}</span>
          </div>
          <p className="mt-5 text-xs font-medium text-slate-400">{label}</p>
          <p className="mt-1 font-poppins text-2xl font-semibold">{value}</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_.6fr]">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-poppins font-semibold">Patient flow</h2>
            <p className="mt-1 text-xs text-slate-400">Visits over the last 7 days</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">Live analytics</span>
        </div>
        <div className="mt-5 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData && chartData.length > 0 ? chartData : emptyChart}>
              <defs>
                <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={.35}/>
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
              <XAxis dataKey="d" axisLine={false} tickLine={false} fontSize={11}/>
              <YAxis axisLine={false} tickLine={false} fontSize={11}/>
              <Tooltip/>
              <Area type="monotone" dataKey="v" stroke="#0f766e" strokeWidth={3} fill="url(#fill)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-2xl bg-dark p-6 text-white shadow-sm">
        <h2 className="font-poppins font-semibold">Live operations</h2>
        <p className="mt-1 text-xs text-slate-400">Updated from hospital data</p>
        <div className="mt-6 grid gap-4">
          {liveOpsData.map(([a,b,c],i)=>
            <div className="flex items-center gap-3" key={a}>
              <span className={`size-2 rounded-full ${i===0?'bg-red-400':'bg-secondary'}`}/>
              <div className="flex-1">
                <p className="text-sm">{a}</p>
                <p className="text-[10px] text-slate-500">{c}</p>
              </div>
              <p className="font-poppins text-xl font-semibold">{b}</p>
            </div>
          )}
        </div>
      </div>
    </div>
    <div className="mt-6">
      {displayAppointments.length > 0 ? (
        <TableCard title="Today's appointments" rows={displayAppointments}/>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm">
          <CalendarDays size={32} className="text-slate-300 mb-3" />
          <h3 className="font-poppins text-base font-semibold mb-1">No appointments today</h3>
          <p className="text-sm text-slate-500">When patients book appointments, they&apos;ll appear here.</p>
        </div>
      )}
    </div>
  </>
}



const moduleData: Record<string, { title: string; text: string; action: string; stats: string[][]; rows: string[][] }> = {
 patients:{title:'Patient management',text:'Manage records, documents, history and insurance.',action:'Add patient',stats:[['Total patients','0'],['New this month','0'],['Inpatients','0'],['Discharged today','0']],rows:[]},
 appointments:{title:'Appointments',text:'Schedule, reschedule and track every consultation.',action:'Book appointment',stats:[['Today','0'],['Waiting','0'],['Completed','0'],['Cancelled','0']],rows:[]},
 requests:{title:'Appointment requests',text:'Review, update and manage incoming patient appointment requests.',action:'Create request',stats:[['Total requests','0'],['New','0'],['Confirmed','0'],['Rejected','0']],rows:[]},
 doctors:{title:'Doctor management',text:'Profiles, schedules, availability and performance.',action:'Add doctor',stats:[['Total doctors','0'],['On duty','0'],['In consultation','0'],['On leave','0']],rows:[]},
 billing:{title:'Billing & payments',text:'Invoices, insurance claims and revenue tracking.',action:'Create invoice',stats:[['Today’s revenue','₹0'],['Pending','₹0'],['Insurance claims','0'],['Paid invoices','0']],rows:[]},
 pharmacy:{title:'Pharmacy inventory',text:'Monitor medicine stock, expiry and purchase orders.',action:'Add medicine',stats:[['Medicines','0'],['Low stock','0'],['Expiring soon','0'],['Today’s sales','₹0']],rows:[]},
 laboratory:{title:'Laboratory',text:'Orders, samples, reports and critical results.',action:'New test order',stats:[['Tests today','0'],['Results ready','0'],['Pending','0'],['Critical','0']],rows:[]},
 staff:{title:'Staff & HR',text:'Attendance, leave, payroll and performance.',action:'Add staff',stats:[['Total staff','0'],['Present today','0'],['On leave','0'],['Open positions','0']],rows:[]},
 wards:{title:'Ward & bed management',text:'Real-time bed allocation and discharge planning.',action:'Allocate bed',stats:[['Total beds','0'],['Occupied','0'],['Available','0'],['Discharges today','0']],rows:[]},
 emergency:{title:'Emergency command',text:'Critical cases, ambulance tracking and rapid response.',action:'Register case',stats:[['Active cases','0'],['Critical','0'],['Ambulances active','0'],['Avg. response','N/A']],rows:[]},
 reports:{title:'Reports & analytics',text:'Operational, clinical and financial insights.',action:'Export report',stats:[['Revenue growth','0%'],['Patient growth','0%'],['Bed occupancy','0%'],['Collection rate','0%']],rows:[]},
 settings:{title:'Hospital settings',text:'Branches, roles, permissions, users and audit logs.',action:'Add user',stats:[['Active users','0'],['Roles','0'],['Branches','0'],['Audit events today','0']],rows:[]},
};

export function PageTitle({title, text, action='Add new', onAction}:{title:string; text:string; action?:string; onAction?:()=>void}){
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="font-poppins text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{text}</p>
      </div>
      <button className="btn-primary !px-4 !py-2.5" onClick={onAction}>
        <Plus size={16}/>
        {action}
      </button>
    </div>
  );
}

export function TableCard({
  title, 
  rows, 
  onStatusClick,
  onEditClick,
  onDeleteClick,
  onRowClick
}:{
  title:string; 
  rows:string[][]; 
  onStatusClick?:(row:string[])=>void;
  onEditClick?:(row:string[])=>void;
  onDeleteClick?:(row:string[])=>void;
  onRowClick?:(row:string[])=>void;
}){
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <h2 className="font-poppins font-semibold">{title}</h2>
        <button aria-label="More options"><MoreHorizontal size={18}/></button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="px-5 py-10 text-center text-sm text-slate-400" colSpan={6}>
                  No records found.
                </td>
              </tr>
            )}
            {rows.map((r,i)=>(
              <tr className={`border-b border-slate-50 last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''}`} key={i} onClick={() => { if (onRowClick) onRowClick(r); }}>
                {r.slice(0,5).map((c,j)=>(
                  <td className={`px-5 py-4 ${j===0?'font-semibold text-dark':'text-slate-500'}`} key={j}>
                    {j===4 ?
                      <button onClick={(event)=>{ event.stopPropagation(); if (onStatusClick) onStatusClick(r); }} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${onStatusClick?'cursor-pointer hover:opacity-80':''} ${c==='Admitted'?'bg-amber-100 text-amber-700':c==='Discharged'?'bg-slate-100 text-slate-600':c==='ORDERED'?'bg-blue-100 text-blue-700':c==='SAMPLE_COLLECTED'?'bg-violet-100 text-violet-700':c==='PROCESSING'?'bg-amber-100 text-amber-700':c==='REPORT_UPLOADED'?'bg-cyan-100 text-cyan-700':c==='RESULTS_READY'?'bg-green-100 text-green-700':c==='VERIFIED'?'bg-teal-100 text-teal-700':c==='APPROVED'?'bg-emerald-100 text-emerald-700':c==='DELIVERED'?'bg-indigo-100 text-indigo-700':c==='CRITICAL'?'bg-red-100 text-red-700':c==='CANCELLED'?'bg-slate-100 text-slate-500':'bg-primary/10 text-primary'}`}>{c}</button>
                    : c}
                  </td>
                ))}
                <td className="px-5 py-4 text-right flex justify-end items-center gap-3">
                  {onEditClick && (
                    <button onClick={(event) => { event.stopPropagation(); onEditClick(r); }} className="text-slate-400 hover:text-primary transition" title="Edit" aria-label="Edit record">
                      <Edit2 size={15} />
                    </button>
                  )}
                  {onDeleteClick && (
                    <button onClick={(event) => { event.stopPropagation(); onDeleteClick(r); }} className="text-slate-400 hover:text-red-600 transition" title="Delete" aria-label="Delete record">
                      <Trash2 size={15} />
                    </button>
                  )}
                  <ChevronRight size={16} className="text-slate-300"/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const fetcher = (path: string) => fetch(`${apiUrl}${path}`, { headers: { Authorization: `Bearer ${localStorage.getItem('vasavi-token') || ''}` } }).then((res) => res.json());

export function ModulePage({ module }: { module: string }) {
  const isPatients = module === 'patients';
  const { addToast } = useToast();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{ type: 'admit' | 'discharge', patientId: string } | null>(null);
  const [approvalRequest, setApprovalRequest] = useState<any>(null);
  const [labActionModal, setLabActionModal] = useState<{ action: 'collect' | 'process' | 'verify' | 'approve' | 'assign-tech' | 'upload-report' | 'deliver'; orderId: string; order?: any } | null>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Auto-open modal if '?new=true' is in the URL query string
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('new') === 'true') {
        setShowAddModal(true);
        // Clean up URL parameter to prevent opening on refresh
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [module]);

  useEffect(() => {
    setPage(1);
  }, [module, searchTerm, filterDate]);
  
  // Dynamic fetches
  const { data: stats, mutate: mutateStats } = useSWR(`/${module === 'settings' ? 'settings' : module}/stats`, fetcher, { refreshInterval: 5000 });
  const { data: listData, mutate } = useSWR(`/${module === 'settings' ? 'settings' : module}`, fetcher, { refreshInterval: 5000 });

  const loading = !stats || !listData;

  // Build module data, overriding hard‑coded billing info with live data
  const defaultData = moduleData[module] || moduleData.patients;
  let dynamicRows = defaultData.rows;
  let dynamicStats = defaultData.stats;

  // Extract items array from paginated response {items, pagination} or plain array
  const dataRows: any[] = listData
    ? Array.isArray(listData)
      ? listData
      : (listData as any)?.items ?? []
    : [];

  // For any module, replace static rows with live data when available
  if (module !== 'billing' && dataRows.length > 0) {
    dynamicRows = dataRows.map((item: any) => {
      const values = Object.values(item);
      // Take first five fields and convert to strings
      return values.slice(0, 5).map((v) => (v !== undefined ? String(v) : ''));
    });
  }

  if (module === 'billing') {
    // Transform invoice list into table rows
    if (dataRows.length > 0) {
      dynamicRows = dataRows.map((inv: any) => [
        inv.invoiceNumber ?? '',
        `${inv.patient?.firstName ?? ''} ${inv.patient?.lastName ?? ''}`.trim(),
        inv.items?.[0]?.description ?? '',
        `₹${Number(inv.total).toLocaleString()}`,
        inv.status ?? ''
      ]);
    }
    // Map stats response to expected shape
    if (stats) {
      dynamicStats = [
        ['Today’s revenue', stats.todayRevenue ?? '₹0'],
        ['Pending', stats.pending ?? '₹0'],
        ['Insurance claims', stats.insurance?.toString() ?? '0'],
        ['Paid invoices', stats.paid?.toString() ?? '0']
      ];
    }
  }

  const d = {
    title: defaultData.title,
    text: defaultData.text,
    action: defaultData.action,
    stats: dynamicStats,
    rows: dynamicRows
  };

  const { data: beds } = useSWR(isPatients && actionModal?.type === 'admit' ? '/beds/available' : null, fetcher);

    // Real-time socket listener for all modules
  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';
    const socket = socketIO(apiBase, {
      auth: { token: typeof window !== 'undefined' ? localStorage.getItem('vasavi-token') || '' : '' },
    });
    socket.on('connect', () => socket.emit('join', 'authenticated'));

    // Global events: refresh everything
    const refreshAll = () => { mutate(); mutateStats(); globalMutate('/notifications/unread') };
    const refreshMutate = () => { mutate(); globalMutate('/notifications/unread') };

    socket.on('billing:updated', refreshAll);
    socket.on('appointment:created', refreshAll);
    socket.on('appointment:updated', refreshMutate);
    socket.on('patient:created', refreshAll);
    socket.on('patient:admitted', refreshAll);
    socket.on('patient:discharged', refreshAll);
    socket.on('patient:transferred', refreshAll);
    socket.on('pharmacy:dispensed', refreshAll);
    socket.on('lab:completed', refreshAll);
    socket.on('lab:created', refreshAll);
    socket.on('lab:updated', refreshMutate);
    socket.on('lab:deleted', refreshMutate);
    socket.on('lab:collected', refreshAll);
    socket.on('lab:verified', refreshAll);
    socket.on('lab:approved', refreshAll);
    socket.on('lab:report-uploaded', refreshAll);
    socket.on('lab:technician-assigned', refreshAll);
    socket.on('lab:delivered', refreshAll);
    socket.on('staff:attendance', refreshMutate);
    socket.on('bed:status-updated', refreshAll);
    socket.on('emergency:status-updated', refreshAll);
    socket.on('emergency:assigned', refreshAll);
    socket.on('appointment-request:created', refreshAll);
    socket.on('appointment-request:updated', refreshMutate);
    socket.on('appointment-request:deleted', refreshMutate);
    socket.on('wards:updated', refreshAll);
    socket.on('admission:updated', refreshAll);
    socket.on('invoice:updated', refreshMutate);

    return () => { socket.disconnect(); };
  }, [mutate, mutateStats]);

  // Dropdown list requirements
  const needDepts = ['appointments', 'doctors', 'requests'].includes(module);
  const needDocs = ['appointments', 'requests'].includes(module);
  const needPats = ['appointments', 'billing', 'laboratory'].includes(module);
  const needTests = ['laboratory'].includes(module);
  const needRoles = ['settings'].includes(module);

  const { data: departments } = useSWR(needDepts ? '/departments' : null, fetcher);
  const { data: doctorsList } = useSWR(needDocs ? '/doctors-list' : null, fetcher);
  const { data: patientsList } = useSWR(needPats ? '/patients-list' : null, fetcher);
  const { data: labtests } = useSWR(needTests ? '/labtests' : null, fetcher);
  const { data: roles } = useSWR(needRoles ? '/roles' : null, fetcher);

  // Apply real-time stats
  if (stats) {
    if (module === 'patients') {
      d.stats = [
        ['Total patients', stats.totalPatients?.toLocaleString() || '0'],
        ['New this month', stats.newThisMonth?.toLocaleString() || '0'],
        ['Inpatients', stats.inpatients?.toLocaleString() || '0'],
        ['Discharged today', stats.dischargedToday?.toLocaleString() || '0']
      ];
    } else if (module === 'appointments') {
      d.stats = [
        ['Today', stats.today?.toLocaleString() || '0'],
        ['Waiting', stats.waiting?.toLocaleString() || '0'],
        ['Completed', stats.completed?.toLocaleString() || '0'],
        ['Cancelled', stats.cancelled?.toLocaleString() || '0']
      ];
    } else if (module === 'requests') {
      d.stats = [
        ['Total requests', stats.totalRequests?.toLocaleString() || '0'],
        ['New', stats.new?.toLocaleString() || '0'],
        ['Confirmed', stats.confirmed?.toLocaleString() || '0'],
        ['Rejected', stats.rejected?.toLocaleString() || '0']
      ];
    } else if (module === 'doctors') {
      d.stats = [
        ['Total doctors', stats.totalDoctors?.toLocaleString() || '0'],
        ['On duty', stats.onDuty?.toLocaleString() || '0'],
        ['In consultation', stats.inConsultation?.toLocaleString() || '0'],
        ['On leave', stats.onLeave?.toLocaleString() || '0']
      ];
    } else if (module === 'billing') {
      d.stats = [
        ['Today’s revenue', stats.todayRevenue || '₹0'],
        ['Pending', stats.pending || '₹0'],
        ['Insurance claims', stats.insurance?.toLocaleString() || '0'],
        ['Paid invoices', stats.paid?.toLocaleString() || '0']
      ];
    } else if (module === 'pharmacy') {
      d.stats = [
        ['Medicines', stats.medicines?.toLocaleString() || '0'],
        ['Low stock', stats.lowStock?.toLocaleString() || '0'],
        ['Expiring soon', stats.expiringSoon?.toLocaleString() || '0'],
        ['Today’s sales', stats.sales || '₹0']
      ];
    } else if (module === 'laboratory') {
      d.stats = [
        ['Tests today', stats.testsToday?.toLocaleString() || '0'],
        ['Results ready', stats.resultsReady?.toLocaleString() || '0'],
        ['Pending', stats.pending?.toLocaleString() || '0'],
        ['Critical', stats.critical?.toLocaleString() || '0']
      ];
    } else if (module === 'staff') {
      d.stats = [
        ['Total staff', stats.totalStaff?.toLocaleString() || '0'],
        ['Present today', stats.presentToday?.toLocaleString() || '0'],
        ['On leave', stats.onLeave?.toLocaleString() || '0'],
        ['Open positions', stats.openPositions?.toLocaleString() || '0']
      ];
    } else if (module === 'wards') {
      d.stats = [
        ['Total beds', stats.totalBeds?.toLocaleString() || '0'],
        ['Occupied', stats.occupied?.toLocaleString() || '0'],
        ['Available', stats.available?.toLocaleString() || '0'],
        ['Discharges today', stats.dischargesToday?.toLocaleString() || '0']
      ];
    } else if (module === 'emergency') {
      d.stats = [
        ['Active cases', stats.activeCases?.toLocaleString() || '0'],
        ['Critical', stats.critical?.toLocaleString() || '0'],
        ['Ambulances active', stats.ambulancesActive?.toLocaleString() || '0'],
        ['Avg. response', stats.avgResponse || '—']
      ];
    } else if (module === 'settings') {
      d.stats = [
        ['Active users', stats.activeUsers?.toLocaleString() || '0'],
        ['Roles', stats.roles?.toLocaleString() || '0'],
        ['Branches', stats.branches?.toLocaleString() || '0'],
        ['Audit events today', stats.auditEventsToday?.toLocaleString() || '0']
      ];
    }
  }

  // Map API data to display rows
  let displayRows = d.rows;

  // Extract items whether API returns array or paginated {items, pagination}
  const listItems: any[] = listData
    ? Array.isArray(listData)
      ? listData
      : (listData as any)?.items ?? []
    : [];

  if (listItems.length > 0) {
    displayRows = listItems.map((item: any) => {
      let r: string[] = [];
      switch (module) {
        case 'patients': {
          let status = 'Active';
          let admittedDateStr = '';
          const activeAdmission = item.admissions?.[0];
          if (activeAdmission) {
            status = activeAdmission.dischargedAt ? 'Discharged' : 'Admitted';
            admittedDateStr = activeAdmission.admittedAt.split('T')[0];
          }
          r = [
            item.patientCode || 'VH-NEW',
            `${item.firstName} ${item.lastName}`,
            item.dateOfBirth ? `${new Date().getFullYear() - new Date(item.dateOfBirth).getFullYear()} years` : '—',
            item.gender || 'General',
            status,
            item.id,
            admittedDateStr
          ];
          break;
        }
        case 'appointments': {
          const formattedDate = item.scheduledAt 
            ? new Date(item.scheduledAt).toLocaleDateString() + ' ' + new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '—';
          r = [
            formattedDate,
            item.patient ? `${item.patient.firstName} ${item.patient.lastName}` : 'Unknown Patient',
            item.doctor?.user?.name || 'Unknown Doctor',
            item.department?.name || 'General',
            item.status || 'SCHEDULED',
            item.id
          ];
          break;
        }
        case 'requests': {
          const formattedDate = item.preferredDate 
            ? new Date(item.preferredDate).toLocaleDateString()
            : '—';
          r = [
            formattedDate,
            item.patientName || 'Unknown Patient',
            item.phone || '—',
            item.department?.name || 'General',
            item.status || 'NEW',
            item.id
          ];
          break;
        }
        case 'doctors': {
          r = [
            item.user?.name || 'Dr. Unknown',
            item.department?.name || item.specialization || 'General',
            item.qualification || 'MBBS',
            `${item.experienceYears || 0} years exp`,
            item.user?.status || 'Active',
            item.id
          ];
          break;
        }
        case 'billing': {
          r = [
            item.invoiceNumber || 'INV-TEMP',
            item.patient ? `${item.patient.firstName} ${item.patient.lastName}` : 'General Patient',
            item.items?.[0]?.description || 'Medical Services',
            `₹${Number(item.total).toLocaleString()}`,
            item.status || 'ISSUED',
            item.id
          ];
          break;
        }
        case 'pharmacy': {
          const qty = item.inventory?.reduce((sum: number, inv: any) => sum + inv.quantity, 0) ?? 0;
          const expiryStr = item.inventory?.[0]?.expiryDate 
            ? new Date(item.inventory[0].expiryDate).toLocaleDateString([], { month: 'short', year: 'numeric' })
            : '—';
          r = [
            item.sku || 'MED-NEW',
            item.name,
            `${qty} units`,
            expiryStr,
            qty > 20 ? 'In stock' : 'Low stock',
            item.id
          ];
          break;
        }
        case 'laboratory': {
          r = [
            `LAB-${item.id.slice(0, 4).toUpperCase()}`,
            item.patient ? `${item.patient.firstName} ${item.patient.lastName}` : 'Patient',
            item.test?.name || 'Lab Test',
            item.priority || 'NORMAL',
            item.status || 'ORDERED',
            item.id
          ];
          break;
        }
        case 'staff': {
          r = [
            item.employeeCode || 'EMP-NEW',
            item.user?.name || 'Staff Member',
            item.designation || 'Specialist',
            'Main Branch',
            item.user?.status || 'Active',
            item.id
          ];
          break;
        }
        case 'wards': {
          const occupant = item.admissions?.[0]?.patient;
          r = [
            item.room?.roomNumber ? `${item.room.roomNumber} - Bed ${item.bedNumber}` : `Bed ${item.bedNumber}`,
            item.room?.type || 'Ward',
            occupant ? `${occupant.firstName} ${occupant.lastName}` : '—',
            item.status === 'OCCUPIED' ? 'Admitted' : '—',
            item.status || 'AVAILABLE',
            item.id
          ];
          break;
        }
        case 'emergency': {
          r = [
            item.caseNumber || 'ER-NEW',
            item.patientName || 'Emergency Patient',
            item.phone || '—',
            item.priority || 'HIGH',
            item.status || 'ACTIVE',
            item.id
          ];
          break;
        }
        case 'settings': {
          r = [
            item.name || 'User',
            item.email || '—',
            item.role?.name || 'User',
            item.branch?.name || 'Main Branch',
            item.status || 'ACTIVE',
            item.id
          ];
          break;
        }
        default: {
          r = [item.id, 'Record', '—', '—', 'Active', item.id];
        }
      }
      return r;
    });
  }

  // Filter based on searchTerm and filterDate
  const filteredRows = displayRows.filter(row => {
    const matchesSearch = row.slice(0, 5).some(cell => String(cell).toLowerCase().includes(searchTerm.toLowerCase()));
    if (!isPatients || !filterDate) return matchesSearch;
    const admitDate = row[6];
    return matchesSearch && admitDate === filterDate;
  });
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + filteredRows.map(e => e.slice(0, 5).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${d.title.toLowerCase()}_export.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>, isEdit: boolean) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData);

    // NEW PATIENT FLOW: check if creating appointment with new patient
    if (module === 'appointments' && !isEdit) {
      const chk = document.getElementById('newPatientChk') as HTMLInputElement;
      if (chk && chk.checked) {
        const withPatientPayload = {
          patient: {
            firstName: payload.newFirstName,
            lastName: payload.newLastName,
            phone: payload.newPhone,
            email: payload.newEmail || undefined,
            dateOfBirth: payload.newAge ? new Date(new Date().getFullYear() - Number(payload.newAge), 0, 1) : new Date(payload.newDob as string),
            gender: payload.newGender,
          },
          appointment: {
            departmentId: payload.departmentId,
            doctorId: payload.doctorId,
            scheduledAt: new Date(payload.scheduledAt as string),
            reason: payload.reason || undefined,
            notes: payload.notes || undefined,
            amount: payload.amount ? Number(payload.amount) : undefined,
            paymentStatus: payload.paymentStatus || undefined,
          },
        };

        const res = await fetch(apiUrl + '/appointments/with-patient', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + (localStorage.getItem('vasavi-token') || ''),
          },
          body: JSON.stringify(withPatientPayload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to create appointment with new patient');
        }

        await mutate();
        addToast('success', 'Appointment Created', 'New patient registered and appointment booked successfully.');
        setShowAddModal(false);
        return;
      }
    }
    
    const url = isEdit 
      ? `${apiUrl}/${module === 'settings' ? 'settings' : module}/${editingItem.id}` 
      : `${apiUrl}/${module === 'settings' ? 'settings' : module}`;
    const method = isEdit ? 'PUT' : 'POST';

    // Optimistic: close modal immediately
    addToast('info', isEdit ? 'Saving...' : 'Creating...', `${module} record is being ${isEdit ? 'updated' : 'created'}.`);
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingItem(null);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('vasavi-token') || ''}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${isEdit ? 'update' : 'create'} record`);
      }
      await mutate();
      addToast('success', isEdit ? 'Record Updated' : 'Record Created', `${module} record was ${isEdit ? 'updated' : 'created'} successfully.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      addToast('error', 'Operation Failed', msg);
    }
  };

  const executeDelete = async () => {
    if (!deletingItemId) return;
    
    // Optimistic: close modal and remove row immediately
    const deletedId = deletingItemId;
    addToast('info', 'Deleting...', `${module} record is being deleted.`);
    setShowDeleteModal(false);
    setDeletingItemId(null);

    try {
      const res = await fetch(`${apiUrl}/${module === 'settings' ? 'settings' : module}/${deletedId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('vasavi-token') || ''}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete record');
      }
      await mutate();
      addToast('success', 'Record Deleted', `${module} record was deleted successfully.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      addToast('error', 'Operation Failed', msg);
    }
  };

  const executeAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!actionModal) return;
    
    const actionType = actionModal.type;
    const patientId = actionModal.patientId;
    const formData = new FormData(e.currentTarget);
    
    // Optimistic: close modal immediately
    addToast('info', 'Processing...', `${actionType === 'admit' ? 'Admitting' : 'Discharging'} patient.`);
    setActionModal(null);
    
    const payload = actionType === 'admit' ? { bedId: formData.get('bedId') } : {};

    try {
      const res = await fetch(`${apiUrl}/patients/${patientId}/${actionType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('vasavi-token') || ''}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(()=>({}));
        throw new Error(errData.message || `Failed to ${actionType} patient`);
      }
      await mutate();
      addToast('success', `Patient ${actionType === 'admit' ? 'Admitted' : 'Discharged'}`, `Patient was ${actionType === 'admit' ? 'admitted to' : 'discharged from'} the hospital.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      addToast('error', 'Action Failed', msg);
    }
  };

  const handleStatusClick = (row: string[]) => {
    if (module === 'requests') {
      const items = Array.isArray(listData) ? listData : (listData as any)?.items ?? [];
      const request = items.find((item: any) => item.id === row[5]);
      if (request?.status === 'NEW' || request?.status === 'RESCHEDULED') {
        setApprovalRequest(request);
      }
      return;
    }

    if (module === 'laboratory') {
      const items = Array.isArray(listData) ? listData : (listData as any)?.items ?? [];
      const order = items.find((item: any) => item.id === row[5]);
      if (!order) return;
      const status = order.status;
      if (status === 'ORDERED') {
        setLabActionModal({ action: 'collect', orderId: order.id, order });
      } else if (status === 'SAMPLE_COLLECTED') {
        setLabActionModal({ action: 'process', orderId: order.id, order });
      } else if (status === 'PROCESSING' || status === 'REPORT_UPLOADED') {
        setLabActionModal({ action: 'upload-report', orderId: order.id, order });
      } else if (status === 'RESULTS_READY') {
        setLabActionModal({ action: 'verify', orderId: order.id, order });
      } else if (status === 'VERIFIED') {
        setLabActionModal({ action: 'approve', orderId: order.id, order });
      } else if (status === 'APPROVED') {
        setLabActionModal({ action: 'deliver', orderId: order.id, order });
      } else if (status === 'PROCESSING' || status === 'SAMPLE_COLLECTED') {
        setLabActionModal({ action: 'assign-tech', orderId: order.id, order });
      }
      return;
    }

    if (!isPatients) return;
    const status = row[4];
    const patientId = row[5];
    if (status === 'Active' || status === 'Discharged') {
      setActionModal({ type: 'admit', patientId });
    } else if (status === 'Admitted') {
      setActionModal({ type: 'discharge', patientId });
    }
  };

  const handleRowClick = (row: string[]) => {
    if (module === 'patients' && row[5]) {
      window.location.href = `/dashboard/patients/${row[5]}`;
    }
    if (module === 'wards' && row[5]) {
      window.location.href = `/dashboard/wards/${row[5]}`;
    }
  };

  const handleEditClick = (row: string[]) => {
    const id = row[5];
    const items = Array.isArray(listData) ? listData : (listData as any)?.items ?? [];
    const item = items.find((x: any) => x.id === id);
    if (item) {
      setEditingItem(item);
      setShowEditModal(true);
    }
  };

  const handleDeleteClick = (row: string[]) => {
    const id = row[5];
    setDeletingItemId(id);
    setShowDeleteModal(true);
  };

  const approveRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!approvalRequest) return;

    const requestId = approvalRequest.id;
    const patientName = approvalRequest.patientName;
    const payload = Object.fromEntries(new FormData(event.currentTarget));

    // Optimistic: close modal immediately
    addToast('info', 'Approving...', `Processing appointment for ${patientName}.`);
    setApprovalRequest(null);

    try {
      const res = await fetch(`${apiUrl}/requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('vasavi-token') || ''}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to approve appointment request');
      }
      await mutate();
      await mutateStats();
      addToast('success', 'Request Approved', `${patientName}'s appointment was approved and booked.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      addToast('error', 'Approval Failed', msg);
    }
  };

  const renderFormFields = (item?: any) => {
    switch (module) {
      case 'patients':
        return (
          <>
            <label className="block text-xs font-semibold text-slate-600">First Name
              <input name="firstName" defaultValue={item?.firstName || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Last Name
              <input name="lastName" defaultValue={item?.lastName || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Phone
              <input name="phone" defaultValue={item?.phone || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Date of Birth
              <input name="dateOfBirth" type="date" defaultValue={item?.dateOfBirth ? new Date(item.dateOfBirth).toISOString().split('T')[0] : ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Gender
              <select name="gender" defaultValue={item?.gender || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>
          </>
        );
      case 'appointments':
        return (
          <>
            <div className="flex items-center gap-2 mb-2"><input type="checkbox" id="newPatientChk" checked={isNewPatient} onChange={(e) => setIsNewPatient(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" /><label htmlFor="newPatientChk" className="text-xs font-semibold text-slate-600 cursor-pointer select-none">Create new patient</label></div>
            <label className="block text-xs font-semibold text-slate-600">Select Patient
              <select name="patientId" defaultValue={item?.patientId || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required>
                <option value="">Choose patient...</option>
                {patientsList?.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientCode})</option>
                ))}
              </select>
            </label>
            <div id="newPatientFields" className={isNewPatient ? 'space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4' : 'hidden space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4'}><p className="text-xs font-bold text-primary">New Patient Details</p><div className="grid grid-cols-2 gap-3"><label className="block text-xs font-semibold text-slate-600">First Name<input name="newFirstName" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" placeholder="First name" /></label><label className="block text-xs font-semibold text-slate-600">Last Name<input name="newLastName" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" placeholder="Last name" /></label></div><div className="grid grid-cols-2 gap-3"><label className="block text-xs font-semibold text-slate-600">Phone<input name="newPhone" type="tel" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" placeholder="+91 98765 43210" /></label><label className="block text-xs font-semibold text-slate-600">Email (optional)<input name="newEmail" type="email" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" placeholder="patient@example.com" /></label></div><div className="grid grid-cols-2 gap-3"><label className="block text-xs font-semibold text-slate-600">Date of Birth<input name="newDob" type="date" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" /></label><label className="block text-xs font-semibold text-slate-600">Gender<select name="newGender" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm"><option value="">Select gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></label></div></div><div className="col-span-2"><label className="block text-xs font-semibold text-slate-600">Address<textarea name="newAddress" rows={2} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" placeholder="Street, city, pincode..."></textarea></label></div>
            <label className="block text-xs font-semibold text-slate-600">Select Doctor
              <select name="doctorId" defaultValue={item?.doctorId || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required>
                <option value="">Choose doctor...</option>
                {doctorsList?.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.user?.name} - {d.specialization}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">Select Department
              <select name="departmentId" defaultValue={item?.departmentId || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required>
                <option value="">Choose department...</option>
                {departments?.map((dep: any) => (
                  <option key={dep.id} value={dep.id}>{dep.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">Scheduled Date & Time
              <input name="scheduledAt" type="datetime-local" defaultValue={item?.scheduledAt ? new Date(new Date(item.scheduledAt).getTime() - new Date(item.scheduledAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Reason / Disease Recovery
              <input name="reason" defaultValue={item?.reason || ''} placeholder="e.g. Fever, Back pain, Follow-up..." className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-slate-600">Consultation Amount (₹)
                <input name="amount" type="number" min="0" defaultValue={item?.amount || ''} placeholder="0" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" />
              </label>
              <label className="block text-xs font-semibold text-slate-600">Payment Status
                <select name="paymentStatus" defaultValue={item?.paymentStatus || 'PENDING'} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm">
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                </select>
              </label>
            </div>
            <label className="block text-xs font-semibold text-slate-600">Notes
              <textarea name="notes" defaultValue={item?.notes || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" rows={2}></textarea>
            </label>
          </>
        );
      case 'requests':
        return (
          <>
            <label className="block text-xs font-semibold text-slate-600">Patient Name
              <input name="patientName" defaultValue={item?.patientName || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Phone
              <input name="phone" defaultValue={item?.phone || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Select Department
              <select name="departmentId" defaultValue={item?.departmentId || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm">
                <option value="">Choose department...</option>
                {departments?.map((dep: any) => (
                  <option key={dep.id} value={dep.id}>{dep.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">Preferred Doctor
              <input name="preferredDoctor" defaultValue={item?.preferredDoctor || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Preferred Date
              <input name="preferredDate" type="date" defaultValue={item?.preferredDate ? new Date(item.preferredDate).toISOString().split('T')[0] : ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Status
              <select name="status" defaultValue={item?.status || 'NEW'} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required>
                <option value="NEW">NEW</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="RESCHEDULED">RESCHEDULED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </label>
          </>
        );
      case 'doctors':
        return (
          <>
            <label className="block text-xs font-semibold text-slate-600">Name
              <input name="name" defaultValue={item?.user?.name || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Email
              <input name="email" type="email" defaultValue={item?.user?.email || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Department
              <select name="departmentId" defaultValue={item?.departmentId || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required>
                <option value="">Choose department...</option>
                {departments?.map((dep: any) => (
                  <option key={dep.id} value={dep.id}>{dep.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">Qualification
              <input name="qualification" defaultValue={item?.qualification || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Specialization
              <input name="specialization" defaultValue={item?.specialization || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Experience (Years)
              <input name="experienceYears" type="number" defaultValue={item?.experienceYears || 0} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Consultation Fee (₹)
              <input name="consultationFee" type="number" defaultValue={item?.consultationFee || 500} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">License Number
              <input name="licenseNumber" defaultValue={item?.licenseNumber || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
          </>
        );
      case 'billing':
        return (
          <>
            <label className="block text-xs font-semibold text-slate-600">Select Patient
              <select name="patientId" defaultValue={item?.patientId || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required>
                <option value="">Choose patient...</option>
                {patientsList?.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientCode})</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">Status
              <select name="status" defaultValue={item?.status || 'ISSUED'} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required>
                <option value="DRAFT">DRAFT</option>
                <option value="ISSUED">ISSUED</option>
                <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                <option value="PAID">PAID</option>
                <option value="OVERDUE">OVERDUE</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">Description
              <input name="description" defaultValue={item?.items?.[0]?.description || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Total Amount (₹)
              <input name="amount" type="number" defaultValue={item?.total || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
          </>
        );
      case 'pharmacy':
        return (
          <>
            <label className="block text-xs font-semibold text-slate-600">Medicine Name
              <input name="name" defaultValue={item?.name || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Generic Name
              <input name="genericName" defaultValue={item?.genericName || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" />
            </label>
            <label className="block text-xs font-semibold text-slate-600">SKU
              <input name="sku" defaultValue={item?.sku || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Quantity (Units)
              <input name="quantity" type="number" defaultValue={item?.inventory?.[0]?.quantity || 100} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Unit Price (₹)
              <input name="unitPrice" type="number" defaultValue={item?.unitPrice || 0} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
          </>
        );
      case 'laboratory':
        return (
          <>
            <label className="block text-xs font-semibold text-slate-600">Select Patient
              <select name="patientId" defaultValue={item?.patientId || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required>
                <option value="">Choose patient...</option>
                {patientsList?.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientCode})</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">Select Test
              <select name="testId" defaultValue={item?.testId || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required>
                <option value="">Choose test...</option>
                {labtests?.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name} (₹{t.price})</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">Priority
              <select name="priority" defaultValue={item?.priority || 'NORMAL'} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required>
                <option value="LOW">LOW</option>
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">Status
              <input name="status" defaultValue={item?.status || 'ORDERED'} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
          </>
        );
      case 'staff':
        return (
          <>
            <label className="block text-xs font-semibold text-slate-600">Name
              <input name="name" defaultValue={item?.user?.name || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Email
              <input name="email" type="email" defaultValue={item?.user?.email || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Designation
              <input name="designation" defaultValue={item?.designation || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Employee Code
              <input name="employeeCode" defaultValue={item?.employeeCode || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
          </>
        );
      case 'wards':
        return (
          <>
            <label className="block text-xs font-semibold text-slate-600">Room Number
              <input name="roomNumber" defaultValue={item?.room?.roomNumber || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Room Type
              <input name="roomType" defaultValue={item?.room?.type || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Bed Number
              <input name="bedNumber" defaultValue={item?.bedNumber || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Status
              <select name="status" defaultValue={item?.status || 'AVAILABLE'} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="OCCUPIED">OCCUPIED</option>
                <option value="RESERVED">RESERVED</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </label>
          </>
        );
      case 'emergency':
        return (
          <>
            <label className="block text-xs font-semibold text-slate-600">Patient Name
              <input name="patientName" defaultValue={item?.patientName || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Phone
              <input name="phone" defaultValue={item?.phone || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Priority
              <select name="priority" defaultValue={item?.priority || 'HIGH'} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required>
                <option value="LOW">LOW</option>
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">Status
              <input name="status" defaultValue={item?.status || 'ACTIVE'} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Details / Emergency Doctor
              <input name="details" defaultValue={item?.details || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" />
            </label>
          </>
        );
      case 'settings':
        return (
          <>
            <label className="block text-xs font-semibold text-slate-600">Full Name
              <input name="name" defaultValue={item?.name || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Email
              <input name="email" type="email" defaultValue={item?.email || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
            </label>
            <label className="block text-xs font-semibold text-slate-600">Role
              <select name="roleId" defaultValue={item?.roleId || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required>
                <option value="">Select role...</option>
                {roles?.map((r: any) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">Status
              <select name="status" defaultValue={item?.status || 'ACTIVE'} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </label>
          </>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <ModulePageSkeleton />;
  }

  return (
    <>
      <PageTitle 
        title={d.title} 
        text={d.text} 
        action={d.action} 
        onAction={() => setShowAddModal(true)}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {d.stats.map(([a, b], i) => (
          <div className="rounded-2xl bg-white p-5 shadow-sm" key={a}>
            <p className="text-xs font-medium text-slate-400">{a}</p>
            <p className="mt-2 font-poppins text-2xl font-semibold">{b}</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(8, 50 + i * 12))}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="my-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          <input 
            placeholder={`Search ${d.title.toLowerCase()}...`} 
            className="w-full rounded-xl border-slate-200 bg-white py-2.5 pl-10 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {isPatients && (
          <input 
            type="date"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none text-slate-600"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        )}
        <button className="btn-secondary !px-4 !py-2.5" onClick={exportCsv}>
          <Download size={15} /> Export
        </button>
      </div>
      <TableCard 
        title={`Recent ${d.title.toLowerCase()}`} 
        rows={paginatedRows} 
        onStatusClick={isPatients || module === 'requests' || module === 'laboratory' ? handleStatusClick : undefined}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        onRowClick={module === 'patients' || module === 'wards' ? handleRowClick : undefined}
      />
      <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm sm:flex-row">
        <span>
          Showing {filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          -{Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length}
        </span>
        <div className="flex items-center gap-2">
          <button className="btn-secondary !px-3 !py-2" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
            Previous
          </button>
          <span className="min-w-16 text-center text-xs font-semibold text-slate-400">
            {currentPage} / {totalPages}
          </span>
          <button className="btn-secondary !px-3 !py-2" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
            Next
          </button>
        </div>
      </div>
      
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-soft max-h-[85vh] overflow-y-auto">
            <h2 className="font-poppins text-xl font-semibold mb-5">Add New {module.charAt(0).toUpperCase() + module.slice(1)}</h2>
            <form onSubmit={(e) => handleFormSubmit(e, false)} className="space-y-4">
              {renderFormFields()}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" className="btn-secondary !px-4" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary !px-6">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-soft max-h-[85vh] overflow-y-auto">
            <h2 className="font-poppins text-xl font-semibold mb-5">Edit {module.charAt(0).toUpperCase() + module.slice(1)}</h2>
            <form onSubmit={(e) => handleFormSubmit(e, true)} className="space-y-4">
              {renderFormFields(editingItem)}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" className="btn-secondary !px-4" onClick={() => { setShowEditModal(false); setEditingItem(null); }}>Cancel</button>
                <button type="submit" className="btn-primary !px-6">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <div className="bg-white rounded-2xl p-7 w-full max-w-sm shadow-soft">
            <h2 className="font-poppins text-xl font-semibold mb-2">Delete {module.charAt(0).toUpperCase() + module.slice(1)}</h2>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this record? This action cannot be undone.</p>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button type="button" className="btn-secondary !px-4" onClick={() => { setShowDeleteModal(false); setDeletingItemId(null); }}>Cancel</button>
              <button type="button" className="btn-primary !px-6 bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700 text-white" onClick={executeDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {approvalRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-soft">
            <h2 className="font-poppins text-xl font-semibold mb-2">Approve Appointment Request</h2>
            <p className="text-sm text-slate-500 mb-6">
              Assign a doctor and confirmed consultation time for {approvalRequest.patientName}.
            </p>
            <form onSubmit={approveRequest} className="space-y-4">
              <label className="block text-xs font-semibold text-slate-600">
                Doctor
                <select name="doctorId" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required>
                  <option value="">Choose doctor...</option>
                  {doctorsList
                    ?.filter((doctor: any) => doctor.departmentId === approvalRequest.departmentId)
                    .map((doctor: any) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.user?.name} - {doctor.specialization}
                      </option>
                    ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Confirmed Date & Time
                <input
                  name="scheduledAt"
                  type="datetime-local"
                  defaultValue={
                    approvalRequest.preferredDate
                      ? new Date(new Date(approvalRequest.preferredDate).getTime() - new Date(approvalRequest.preferredDate).getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                      : ''
                  }
                  className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm"
                  required
                />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Notes
                <textarea name="notes" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" rows={3} />
              </label>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" className="btn-secondary !px-4" onClick={() => setApprovalRequest(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary !px-6">
                  Approve & Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {labActionModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-soft">
            {labActionModal.action === 'collect' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-blue-100 text-blue-600">
                    <FlaskConical size={20} />
                  </span>
                  <div>
                    <h2 className="font-poppins text-xl font-semibold">Collect Sample</h2>
                    <p className="text-sm text-slate-500">Record sample collection details</p>
                  </div>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const formData = new FormData(form);
                  const payload = {
                    sampleId: formData.get('sampleId'),
                    sampleType: formData.get('sampleType'),
                    collectedBy: formData.get('collectedBy'),
                  };
                  addToast('info', 'Collecting sample...', '');
                  setLabActionModal(null);
                  try {
                    const res = await fetch(apiUrl + '/laboratory/' + labActionModal.orderId + '/collect', {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + (localStorage.getItem('vasavi-token') || ''),
                      },
                      body: JSON.stringify(payload),
                    });
                    if (!res.ok) {
                      const errData = await res.json().catch(() => ({}));
                      throw new Error(errData.message || 'Failed to collect sample');
                    }
                    await mutate();
                    addToast('success', 'Sample Collected', 'Sample has been collected and recorded.');
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    addToast('error', 'Collection Failed', msg);
                  }
                }} className="space-y-4">
                  <label className="block text-xs font-semibold text-slate-600">
                    Sample ID / Barcode
                    <input name="sampleId" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" placeholder="e.g. SMP-001" required />
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">
                    Sample Type
                    <select name="sampleType" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required>
                      <option value="">Select type...</option>
                      <option value="Blood">Blood</option>
                      <option value="Urine">Urine</option>
                      <option value="Stool">Stool</option>
                      <option value="Sputum">Sputum</option>
                      <option value="Tissue">Tissue (Biopsy)</option>
                      <option value="Swab">Swab</option>
                      <option value="CSF">CSF</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">
                    Collected By
                    <input name="collectedBy" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" placeholder="Technician name" required />
                  </label>
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button type="button" className="btn-secondary !px-4" onClick={() => setLabActionModal(null)}>Cancel</button>
                    <button type="submit" className="btn-primary !px-6">Confirm Collection</button>
                  </div>
                </form>
              </>
            )}
            {labActionModal.action === 'process' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-600">
                    <Activity size={20} />
                  </span>
                  <div>
                    <h2 className="font-poppins text-xl font-semibold">Start Processing</h2>
                    <p className="text-sm text-slate-500">Begin lab processing for collected sample</p>
                  </div>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  addToast('info', 'Starting processing...', '');
                  setLabActionModal(null);
                  try {
                    const res = await fetch(apiUrl + '/laboratory/' + labActionModal.orderId + '/status', {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + (localStorage.getItem('vasavi-token') || ''),
                      },
                      body: JSON.stringify({ status: 'PROCESSING' }),
                    });
                    if (!res.ok) {
                      const errData = await res.json().catch(() => ({}));
                      throw new Error(errData.message || 'Failed to start processing');
                    }
                    await mutate();
                    addToast('success', 'Processing Started', 'Sample is now being processed.');
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    addToast('error', 'Action Failed', msg);
                  }
                }} className="space-y-4">
                  <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
                    <p className="font-semibold mb-1">Advance to Processing?</p>
                    <p>This marks the sample as being processed in the lab. Continue to submit results once testing is complete.</p>
                  </div>
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button type="button" className="btn-secondary !px-4" onClick={() => setLabActionModal(null)}>Cancel</button>
                    <button type="submit" className="btn-primary !px-6 bg-amber-600 hover:bg-amber-700 border-amber-600">Start Processing</button>
                  </div>
                </form>
              </>
            )}
            {labActionModal.action === 'verify' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-600">
                    <CheckCircle2 size={20} />
                  </span>
                  <div>
                    <h2 className="font-poppins text-xl font-semibold">Verify Results</h2>
                    <p className="text-sm text-slate-500">Confirm that test results are accurate</p>
                  </div>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  addToast('info', 'Verifying...', '');
                  setLabActionModal(null);
                  try {
                    const res = await fetch(apiUrl + '/laboratory/' + labActionModal.orderId + '/verify', {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + (localStorage.getItem('vasavi-token') || ''),
                      },
                      body: JSON.stringify({}),
                    });
                    if (!res.ok) {
                      const errData = await res.json().catch(() => ({}));
                      throw new Error(errData.message || 'Failed to verify results');
                    }
                    await mutate();
                    addToast('success', 'Results Verified', 'Test results have been verified.');
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    addToast('error', 'Verification Failed', msg);
                  }
                }} className="space-y-4">
                  <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
                    <p className="font-semibold mb-1">Are you sure you want to verify these results?</p>
                    <p>This confirms that all test values have been checked and are accurate.</p>
                  </div>
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button type="button" className="btn-secondary !px-4" onClick={() => setLabActionModal(null)}>Cancel</button>
                    <button type="submit" className="btn-primary !px-6 bg-amber-600 hover:bg-amber-700 border-amber-600">Verify Results</button>
                  </div>
                </form>
              </>
            )}
            {labActionModal.action === 'approve' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-600">
                    <CheckCircle2 size={20} />
                  </span>
                  <div>
                    <h2 className="font-poppins text-xl font-semibold">Approve Report</h2>
                    <p className="text-sm text-slate-500">Final approval to publish the lab report</p>
                  </div>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  addToast('info', 'Approving...', '');
                  setLabActionModal(null);
                  try {
                    const res = await fetch(apiUrl + '/laboratory/' + labActionModal.orderId + '/approve', {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + (localStorage.getItem('vasavi-token') || ''),
                      },
                      body: JSON.stringify({}),
                    });
                    if (!res.ok) {
                      const errData = await res.json().catch(() => ({}));
                      throw new Error(errData.message || 'Failed to approve report');
                    }
                    await mutate();
                    addToast('success', 'Report Approved', 'Lab report has been approved and published.');
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    addToast('error', 'Approval Failed', msg);
                  }
                }} className="space-y-4">
                  <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
                    <p className="font-semibold mb-1">Final approval step</p>
                    <p>This will mark the report as <strong>Approved</strong> and make it available for patient records and billing.</p>
                  </div>
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button type="button" className="btn-secondary !px-4" onClick={() => setLabActionModal(null)}>Cancel</button>
                    <button type="submit" className="btn-primary !px-6 bg-emerald-600 hover:bg-emerald-700 border-emerald-600">Approve & Publish</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {labActionModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-soft">
            {labActionModal.action === 'collect' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-blue-100 text-blue-600">
                    <FlaskConical size={20} />
                  </span>
                  <div>
                    <h2 className="font-poppins text-xl font-semibold">Collect Sample</h2>
                    <p className="text-sm text-slate-500">Record sample collection details</p>
                  </div>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const formData = new FormData(form);
                  const payload = {
                    sampleId: formData.get('sampleId'),
                    sampleType: formData.get('sampleType'),
                    collectedBy: formData.get('collectedBy'),
                  };
                  addToast('info', 'Collecting sample...', '');
                  setLabActionModal(null);
                  try {
                    const res = await fetch(apiUrl + '/laboratory/' + labActionModal.orderId + '/collect', {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + (localStorage.getItem('vasavi-token') || ''),
                      },
                      body: JSON.stringify(payload),
                    });
                    if (!res.ok) {
                      const errData = await res.json().catch(() => ({}));
                      throw new Error(errData.message || 'Failed to collect sample');
                    }
                    await mutate();
                    addToast('success', 'Sample Collected', 'Sample has been collected and recorded.');
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    addToast('error', 'Collection Failed', msg);
                  }
                }} className="space-y-4">
                  <label className="block text-xs font-semibold text-slate-600">
                    Sample ID / Barcode
                    <input name="sampleId" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" placeholder="e.g. SMP-001" required />
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">
                    Sample Type
                    <select name="sampleType" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required>
                      <option value="">Select type...</option>
                      <option value="Blood">Blood</option>
                      <option value="Urine">Urine</option>
                      <option value="Stool">Stool</option>
                      <option value="Sputum">Sputum</option>
                      <option value="Tissue">Tissue (Biopsy)</option>
                      <option value="Swab">Swab</option>
                      <option value="CSF">CSF</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">
                    Collected By
                    <input name="collectedBy" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" placeholder="Technician name" required />
                  </label>
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button type="button" className="btn-secondary !px-4" onClick={() => setLabActionModal(null)}>Cancel</button>
                    <button type="submit" className="btn-primary !px-6">Confirm Collection</button>
                  </div>
                </form>
              </>
            )}
            {labActionModal.action === 'process' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-600">
                    <Activity size={20} />
                  </span>
                  <div>
                    <h2 className="font-poppins text-xl font-semibold">Start Processing</h2>
                    <p className="text-sm text-slate-500">Begin lab processing for collected sample</p>
                  </div>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  addToast('info', 'Starting processing...', '');
                  setLabActionModal(null);
                  try {
                    const res = await fetch(apiUrl + '/laboratory/' + labActionModal.orderId + '/status', {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + (localStorage.getItem('vasavi-token') || ''),
                      },
                      body: JSON.stringify({ status: 'PROCESSING' }),
                    });
                    if (!res.ok) {
                      const errData = await res.json().catch(() => ({}));
                      throw new Error(errData.message || 'Failed to start processing');
                    }
                    await mutate();
                    addToast('success', 'Processing Started', 'Sample is now being processed.');
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    addToast('error', 'Action Failed', msg);
                  }
                }} className="space-y-4">
                  <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
                    <p className="font-semibold mb-1">Advance to Processing?</p>
                    <p>This marks the sample as being processed in the lab. Continue to submit results once testing is complete.</p>
                  </div>
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button type="button" className="btn-secondary !px-4" onClick={() => setLabActionModal(null)}>Cancel</button>
                    <button type="submit" className="btn-primary !px-6 bg-amber-600 hover:bg-amber-700 border-amber-600">Start Processing</button>
                  </div>
                </form>
              </>
            )}
            {labActionModal.action === 'verify' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-600">
                    <CheckCircle2 size={20} />
                  </span>
                  <div>
                    <h2 className="font-poppins text-xl font-semibold">Verify Results</h2>
                    <p className="text-sm text-slate-500">Confirm that test results are accurate</p>
                  </div>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  addToast('info', 'Verifying...', '');
                  setLabActionModal(null);
                  try {
                    const res = await fetch(apiUrl + '/laboratory/' + labActionModal.orderId + '/verify', {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + (localStorage.getItem('vasavi-token') || ''),
                      },
                      body: JSON.stringify({}),
                    });
                    if (!res.ok) {
                      const errData = await res.json().catch(() => ({}));
                      throw new Error(errData.message || 'Failed to verify results');
                    }
                    await mutate();
                    addToast('success', 'Results Verified', 'Test results have been verified.');
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    addToast('error', 'Verification Failed', msg);
                  }
                }} className="space-y-4">
                  <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
                    <p className="font-semibold mb-1">Are you sure you want to verify these results?</p>
                    <p>This confirms that all test values have been checked and are accurate.</p>
                  </div>
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button type="button" className="btn-secondary !px-4" onClick={() => setLabActionModal(null)}>Cancel</button>
                    <button type="submit" className="btn-primary !px-6 bg-amber-600 hover:bg-amber-700 border-amber-600">Verify Results</button>
                  </div>
                </form>
              </>
            )}
            {labActionModal.action === 'approve' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-600">
                    <CheckCircle2 size={20} />
                  </span>
                  <div>
                    <h2 className="font-poppins text-xl font-semibold">Approve Report</h2>
                    <p className="text-sm text-slate-500">Final approval to publish the lab report</p>
                  </div>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  addToast('info', 'Approving...', '');
                  setLabActionModal(null);
                  try {
                    const res = await fetch(apiUrl + '/laboratory/' + labActionModal.orderId + '/approve', {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + (localStorage.getItem('vasavi-token') || ''),
                      },
                      body: JSON.stringify({}),
                    });
                    if (!res.ok) {
                      const errData = await res.json().catch(() => ({}));
                      throw new Error(errData.message || 'Failed to approve report');
                    }
                    await mutate();
                    addToast('success', 'Report Approved', 'Lab report has been approved and published.');
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    addToast('error', 'Approval Failed', msg);
                  }
                }} className="space-y-4">
                  <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
                    <p className="font-semibold mb-1">Final approval step</p>
                    <p>This will mark the report as <strong>Approved</strong> and make it available for patient records and billing.</p>
                  </div>
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button type="button" className="btn-secondary !px-4" onClick={() => setLabActionModal(null)}>Cancel</button>
                    <button type="submit" className="btn-primary !px-6 bg-emerald-600 hover:bg-emerald-700 border-emerald-600">Approve & Publish</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {labActionModal && labActionModal.action === 'deliver' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-soft">
            <>
              <div className="flex items-center gap-3 mb-4">
                <span className="grid size-10 place-items-center rounded-xl bg-indigo-100 text-indigo-600">
                  <CheckCircle2 size={20} />
                </span>
                <div>
                  <h2 className="font-poppins text-xl font-semibold">Deliver Report</h2>
                  <p className="text-sm text-slate-500">Mark report as delivered to patient</p>
                </div>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                addToast('info', 'Delivering...', '');
                setLabActionModal(null);
                try {
                  const res = await fetch(apiUrl + '/laboratory/' + labActionModal.orderId + '/deliver', {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: 'Bearer ' + (localStorage.getItem('vasavi-token') || ''),
                    },
                    body: JSON.stringify({ deliveredBy: getUserName() }),
                  });
                  if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.message || 'Failed to deliver report');
                  }
                  await mutate();
                  addToast('success', 'Report Delivered', 'Lab report has been marked as delivered.');
                } catch (err) {
                  const msg = err instanceof Error ? err.message : String(err);
                  addToast('error', 'Delivery Failed', msg);
                }
              }} className="space-y-4">
                <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-700">
                  <p className="font-semibold mb-1">Confirm delivery</p>
                  <p>This marks the lab report as <strong>Delivered</strong> to the patient or requesting doctor.</p>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                  <button type="button" className="btn-secondary !px-4" onClick={() => setLabActionModal(null)}>Cancel</button>
                  <button type="submit" className="btn-primary !px-6 bg-indigo-600 hover:bg-indigo-700 border-indigo-600">Confirm Delivery</button>
                </div>
              </form>
            </>
          </div>
        </div>
      )}

      {labActionModal && labActionModal.action === 'assign-tech' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-soft">
            <>
              <div className="flex items-center gap-3 mb-4">
                <span className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-600">
                  <Users size={20} />
                </span>
                <div>
                  <h2 className="font-poppins text-xl font-semibold">Assign Technician</h2>
                  <p className="text-sm text-slate-500">Assign a lab technician to this order</p>
                </div>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                const payload = {
                  technicianName: formData.get('technicianName'),
                  technicianId: formData.get('technicianId') || undefined,
                };
                addToast('info', 'Assigning technician...', '');
                setLabActionModal(null);
                try {
                  const res = await fetch(apiUrl + '/laboratory/' + labActionModal.orderId + '/assign-technician', {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: 'Bearer ' + (localStorage.getItem('vasavi-token') || ''),
                    },
                    body: JSON.stringify(payload),
                  });
                  if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.message || 'Failed to assign technician');
                  }
                  await mutate();
                  addToast('success', 'Technician Assigned', 'Lab technician has been assigned to this order.');
                } catch (err) {
                  const msg = err instanceof Error ? err.message : String(err);
                  addToast('error', 'Assignment Failed', msg);
                }
              }} className="space-y-4">
                <label className="block text-xs font-semibold text-slate-600">
                  Technician Name
                  <input name="technicianName" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" placeholder="e.g. Rajesh Kumar" required />
                </label>
                <label className="block text-xs font-semibold text-slate-600">
                  Technician ID (optional)
                  <input name="technicianId" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" placeholder="e.g. T-101" />
                </label>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                  <button type="button" className="btn-secondary !px-4" onClick={() => setLabActionModal(null)}>Cancel</button>
                  <button type="submit" className="btn-primary !px-6">Assign</button>
                </div>
              </form>
            </>
          </div>
        </div>
      )}

      {labActionModal && labActionModal.action === 'upload-report' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-soft">
            <>
              <div className="flex items-center gap-3 mb-4">
                <span className="grid size-10 place-items-center rounded-xl bg-cyan-100 text-cyan-600">
                  <Upload size={20} />
                </span>
                <div>
                  <h2 className="font-poppins text-xl font-semibold">Upload Report</h2>
                  <p className="text-sm text-slate-500">Upload lab report file (PDF, image, or document)</p>
                </div>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
                const file = fileInput?.files?.[0];
                if (!file) {
                  addToast('error', 'No File', 'Please select a file to upload.');
                  return;
                }
                addToast('info', 'Uploading report...', '');
                setLabActionModal(null);
                try {
                  const formData = new FormData();
                  formData.append('report', file);
                  const res = await fetch(apiUrl + '/laboratory/' + labActionModal.orderId + '/upload-report', {
                    method: 'POST',
                    headers: {
                      Authorization: 'Bearer ' + (localStorage.getItem('vasavi-token') || ''),
                    },
                    body: formData,
                  });
                  if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.message || 'Failed to upload report');
                  }
                  await mutate();
                  addToast('success', 'Report Uploaded', 'Lab report has been uploaded successfully.');
                } catch (err) {
                  const msg = err instanceof Error ? err.message : String(err);
                  addToast('error', 'Upload Failed', msg);
                }
              }} className="space-y-4">
                <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center">
                  <Upload size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500 mb-1">Drop file here or click to browse</p>
                  <p className="text-xs text-slate-400">PDF, PNG, JPG, DOC, XLS — Max 10MB</p>
                  <input type="file" name="report" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" className="mt-3 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" required />
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                  <button type="button" className="btn-secondary !px-4" onClick={() => setLabActionModal(null)}>Cancel</button>
                  <button type="submit" className="btn-primary !px-6">Upload</button>
                </div>
              </form>
            </>
          </div>
        </div>
      )}

      {isPatients && actionModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <div className="bg-white rounded-2xl p-7 w-full max-w-sm shadow-soft">
            <h2 className="font-poppins text-xl font-semibold mb-2">
              {actionModal.type === 'admit' ? 'Admit Patient' : 'Discharge Patient'}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {actionModal.type === 'admit' 
                ? 'Select a bed to admit this patient.' 
                : 'Are you sure you want to discharge this patient?'}
            </p>
            <form onSubmit={executeAction} className="space-y-4">
              {actionModal.type === 'admit' && (
                <label className="block text-xs font-semibold text-slate-600">Select Available Bed
                  <select name="bedId" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required>
                    <option value="">Choose a bed...</option>
                    {beds?.map((b: { id: string; bedNumber: string; room: { roomNumber: string } }) => (
                      <option key={b.id} value={b.id}>{b.room.roomNumber} - Bed {b.bedNumber}</option>
                    ))}
                  </select>
                </label>
              )}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" className="btn-secondary !px-4" onClick={() => setActionModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary !px-6">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
