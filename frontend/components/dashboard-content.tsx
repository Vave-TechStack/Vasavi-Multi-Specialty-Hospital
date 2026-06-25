'use client';

import { ArrowDownRight, ArrowUpRight, CalendarDays, ChevronRight, CircleDollarSign, Download, Edit2, MoreHorizontal, Plus, Search, Stethoscope, Trash2, Users } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';

const chart=[{d:'Mon',v:38},{d:'Tue',v:52},{d:'Wed',v:48},{d:'Thu',v:71},{d:'Fri',v:62},{d:'Sat',v:84},{d:'Sun',v:76}];
const appointments=[['09:00','Saanvi Rao','Dr. Ananya Rao','Cardiology','Confirmed'],['09:30','Kiran Kumar','Dr. Arjun Mehta','Neurology','Waiting'],['10:15','Fatima Begum','Dr. Meera Iyer','Orthopedics','In consultation'],['11:00','Rohan Das','Dr. Vikram Shah','Pediatrics','Confirmed']];
const overviewStats: { icon: LucideIcon; label: string; value: string; detail: string; up: boolean }[] = [
  { icon: CircleDollarSign, label: 'Today’s revenue', value: '₹4,82,650', detail: '12.5%', up: true },
  { icon: CalendarDays, label: 'Appointments', value: '128', detail: '8.2%', up: true },
  { icon: Users, label: 'Active patients', value: '1,847', detail: '3.1%', up: true },
  { icon: Stethoscope, label: 'Doctors on duty', value: '42', detail: '2 off duty', up: false },
];

export function Overview(){
  const { data: dbStats } = useSWR('/dashboard', fetcher, { refreshInterval: 5000 });
  const { data: appointmentsList } = useSWR('/appointments', fetcher, { refreshInterval: 5000 });

  const activePatients = dbStats?.patients?.toLocaleString() || '1,847';
  const totalDocs = dbStats?.doctors?.toLocaleString() || '42';
  const todayApps = dbStats?.appointments?.toLocaleString() || '128';

  const stats = [
    { icon: CircleDollarSign, label: 'Today’s revenue', value: '₹4,82,650', detail: '12.5%', up: true },
    { icon: CalendarDays, label: 'Appointments', value: todayApps, detail: '8.2%', up: true },
    { icon: Users, label: 'Active patients', value: activePatients, detail: '3.1%', up: true },
    { icon: Stethoscope, label: 'Doctors on duty', value: totalDocs, detail: '2 off duty', up: false },
  ];

  let displayAppointments = appointments;
  if (appointmentsList && Array.isArray(appointmentsList)) {
    displayAppointments = appointmentsList.map((a: any) => {
      const timeStr = a.scheduledAt ? new Date(a.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00';
      return [
        timeStr,
        a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : 'Patient',
        a.doctor?.user?.name || 'Doctor',
        a.department?.name || 'General',
        a.status || 'Confirmed'
      ];
    });
  }

  return <><PageTitle title="Good morning, Admin" text="Here’s what is happening across Vasavi today."/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({icon:Icon,label,value,detail,up})=><div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" key={label}><div className="flex justify-between"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon size={19}/></span><span className={`flex items-center gap-1 text-xs font-semibold ${up?'text-emerald-600':'text-slate-400'}`}>{up?<ArrowUpRight size={14}/>:<ArrowDownRight size={14}/>} {detail}</span></div><p className="mt-5 text-xs font-medium text-slate-400">{label}</p><p className="mt-1 font-poppins text-2xl font-semibold">{value}</p></div>)}</div>
  <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_.6fr]"><div className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-poppins font-semibold">Patient flow</h2><p className="mt-1 text-xs text-slate-400">Visits over the last 7 days</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">+14.2% this week</span></div><div className="mt-5 h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chart}><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#14b8a6" stopOpacity={.35}/><stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/><XAxis dataKey="d" axisLine={false} tickLine={false} fontSize={11}/><YAxis axisLine={false} tickLine={false} fontSize={11}/><Tooltip/><Area type="monotone" dataKey="v" stroke="#0f766e" strokeWidth={3} fill="url(#fill)"/></AreaChart></ResponsiveContainer></div></div><div className="rounded-2xl bg-dark p-6 text-white shadow-sm"><h2 className="font-poppins font-semibold">Live operations</h2><p className="mt-1 text-xs text-slate-400">Updated just now</p><div className="mt-6 grid gap-4">{[['Emergency queue','6','2 critical'],['Beds available','34','8 ICU'],['Lab results pending','19','4 urgent'],['Ambulances active','3','ETA 8 min']].map(([a,b,c],i)=><div className="flex items-center gap-3" key={a}><span className={`size-2 rounded-full ${i===0?'bg-red-400':'bg-secondary'}`}/><div className="flex-1"><p className="text-sm">{a}</p><p className="text-[10px] text-slate-500">{c}</p></div><p className="font-poppins text-xl font-semibold">{b}</p></div>)}</div></div></div>
  <div className="mt-6"><TableCard title="Today’s appointments" rows={displayAppointments}/></div></>
}



const moduleData: Record<string, { title: string; text: string; action: string; stats: string[][]; rows: string[][] }> = {
 patients:{title:'Patient management',text:'Manage records, documents, history and insurance.',action:'Add patient',stats:[['Total patients','25,842'],['New this month','684'],['Inpatients','128'],['Discharged today','19']],rows:[['VH-20481','Aarav Sharma','34 years','Cardiology','Active'],['VH-20480','Mary Joseph','52 years','Neurology','Admitted'],['VH-20479','Ishaan Patel','8 years','Pediatrics','Follow-up'],['VH-20478','Noor Khan','41 years','Orthopedics','Active']]},
 appointments:{title:'Appointments',text:'Schedule, reschedule and track every consultation.',action:'Book appointment',stats:[['Today','128'],['Waiting','18'],['Completed','84'],['Cancelled','7']],rows:appointments},
 doctors:{title:'Doctor management',text:'Profiles, schedules, availability and performance.',action:'Add doctor',stats:[['Total doctors','56'],['On duty','42'],['In consultation','17'],['On leave','4']],rows:[['Dr. Ananya Rao','Cardiology','09:00–17:00','18 patients','Available'],['Dr. Arjun Mehta','Neurology','10:00–18:00','14 patients','In consultation'],['Dr. Meera Iyer','Orthopedics','08:00–16:00','21 patients','Available']]},
 billing:{title:'Billing & payments',text:'Invoices, insurance claims and revenue tracking.',action:'Create invoice',stats:[['Today’s revenue','₹4.82L'],['Pending','₹1.16L'],['Insurance claims','38'],['Paid invoices','106']],rows:[['INV-10482','Saanvi Rao','Consultation','₹1,500','Paid'],['INV-10481','Kiran Kumar','Diagnostics','₹8,400','Pending'],['INV-10480','Fatima Begum','Surgery','₹1,24,000','Insurance']]},
 pharmacy:{title:'Pharmacy inventory',text:'Monitor medicine stock, expiry and purchase orders.',action:'Add medicine',stats:[['Medicines','2,418'],['Low stock','23'],['Expiring soon','16'],['Today’s sales','₹82,430']],rows:[['MED-0294','Atorvastatin 10mg','480 units','Nov 2027','In stock'],['MED-0293','Amoxicillin 500mg','32 units','Jan 2027','Low stock'],['MED-0292','Metformin 500mg','760 units','Aug 2028','In stock']]},
 laboratory:{title:'Laboratory',text:'Orders, samples, reports and critical results.',action:'New test order',stats:[['Tests today','186'],['Results ready','124'],['Pending','58'],['Critical','4']],rows:[['LAB-5821','Saanvi Rao','Lipid profile','Dr. Ananya Rao','Ready'],['LAB-5820','Kiran Kumar','MRI Brain','Dr. Arjun Mehta','Processing'],['LAB-5819','Fatima Begum','CBC','Dr. Meera Iyer','Critical']]},
 staff:{title:'Staff & HR',text:'Attendance, leave, payroll and performance.',action:'Add staff',stats:[['Total staff','348'],['Present today','319'],['On leave','21'],['Open positions','8']],rows:[['EMP-284','Nisha Reddy','Head Nurse','ICU','Present'],['EMP-283','Rahul Dev','Lab Technician','Laboratory','Present'],['EMP-282','Sara Ali','Receptionist','Front office','On leave']]},
 wards:{title:'Ward & bed management',text:'Real-time bed allocation and discharge planning.',action:'Allocate bed',stats:[['Total beds','160'],['Occupied','126'],['Available','34'],['Discharges today','19']],rows:[['ICU-08','ICU','Saanvi Rao','Dr. Ananya Rao','Occupied'],['GEN-112','General ward','—','—','Available'],['PVT-24','Private room','Mary Joseph','Dr. Arjun Mehta','Occupied']]},
 emergency:{title:'Emergency command',text:'Critical cases, ambulance tracking and rapid response.',action:'Register case',stats:[['Active cases','18'],['Critical','4'],['Ambulances active','3'],['Avg. response','8 min']],rows:[['ER-9042','Ravi Kumar','Chest pain','Dr. Ananya Rao','Critical'],['ER-9041','Divya Singh','Trauma','Dr. Meera Iyer','Stabilized'],['AMB-03','Inbound ambulance','ETA 8 min','Team A','Active']]},
 reports:{title:'Reports & analytics',text:'Operational, clinical and financial insights.',action:'Export report',stats:[['Revenue growth','12.5%'],['Patient growth','8.2%'],['Bed occupancy','78.8%'],['Collection rate','94.2%']],rows:[['Monthly revenue report','Finance','June 2026','PDF / Excel','Ready'],['Patient outcomes','Clinical','Q2 2026','PDF','Ready'],['Doctor performance','Operations','June 2026','Excel','Processing']]},
 settings:{title:'Hospital settings',text:'Branches, roles, permissions, users and audit logs.',action:'Add user',stats:[['Active users','186'],['Roles','8'],['Branches','1'],['Audit events today','248']],rows:[['Admin role','Full platform access','12 users','Updated today','Active'],['Doctor role','Clinical access','56 users','Updated 2 days ago','Active'],['Reception role','Front desk access','18 users','Updated last week','Active']]},
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
  onDeleteClick
}:{
  title:string; 
  rows:string[][]; 
  onStatusClick?:(row:string[])=>void;
  onEditClick?:(row:string[])=>void;
  onDeleteClick?:(row:string[])=>void;
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
            {rows.map((r,i)=>(
              <tr className="border-b border-slate-50 last:border-0" key={i}>
                {r.slice(0,5).map((c,j)=>(
                  <td className={`px-5 py-4 ${j===0?'font-semibold text-dark':'text-slate-500'}`} key={j}>
                    {j===4 ?
                      <button onClick={()=>onStatusClick && onStatusClick(r)} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${onStatusClick?'cursor-pointer hover:opacity-80':''} ${c==='Admitted'?'bg-amber-100 text-amber-700':c==='Discharged'?'bg-slate-100 text-slate-600':'bg-primary/10 text-primary'}`}>{c}</button>
                    : c}
                  </td>
                ))}
                <td className="px-5 py-4 text-right flex justify-end items-center gap-3">
                  {onEditClick && (
                    <button onClick={() => onEditClick(r)} className="text-slate-400 hover:text-primary transition" title="Edit" aria-label="Edit record">
                      <Edit2 size={15} />
                    </button>
                  )}
                  {onDeleteClick && (
                    <button onClick={() => onDeleteClick(r)} className="text-slate-400 hover:text-red-600 transition" title="Delete" aria-label="Delete record">
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
  const d = { ...moduleData[module] || moduleData.patients };
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{ type: 'admit' | 'discharge', patientId: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  
  // Dynamic fetches
  const { data: stats } = useSWR(`/${module === 'settings' ? 'settings' : module}/stats`, fetcher, { refreshInterval: 5000 });
  const { data: listData, mutate } = useSWR(`/${module === 'settings' ? 'settings' : module}`, fetcher, { refreshInterval: 5000 });
  const { data: beds } = useSWR(isPatients && actionModal?.type === 'admit' ? '/beds/available' : null, fetcher);

  // Dropdown list requirements
  const needDepts = ['appointments', 'doctors'].includes(module);
  const needDocs = ['appointments'].includes(module);
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

  if (listData && Array.isArray(listData)) {
    displayRows = listData.map((item: any) => {
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
    
    const url = isEdit 
      ? `${apiUrl}/${module === 'settings' ? 'settings' : module}/${editingItem.id}` 
      : `${apiUrl}/${module === 'settings' ? 'settings' : module}`;
    const method = isEdit ? 'PUT' : 'POST';

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
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingItem(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const executeDelete = async () => {
    if (!deletingItemId) return;
    try {
      const res = await fetch(`${apiUrl}/${module === 'settings' ? 'settings' : module}/${deletingItemId}`, {
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
      setShowDeleteModal(false);
      setDeletingItemId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const executeAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!actionModal) return;
    
    const formData = new FormData(e.currentTarget);
    const payload = actionModal.type === 'admit' ? { bedId: formData.get('bedId') } : {};

    try {
      const res = await fetch(`${apiUrl}/patients/${actionModal.patientId}/${actionModal.type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('vasavi-token') || ''}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(()=>({}));
        throw new Error(errData.message || `Failed to ${actionModal.type} patient`);
      }
      await mutate();
      setActionModal(null);
    } catch (err) { alert(err instanceof Error ? err.message : String(err)); }
  };

  const handleStatusClick = (row: string[]) => {
    if (!isPatients) return;
    const status = row[4];
    const patientId = row[5];
    if (status === 'Active' || status === 'Discharged') {
      setActionModal({ type: 'admit', patientId });
    } else if (status === 'Admitted') {
      setActionModal({ type: 'discharge', patientId });
    }
  };

  const handleEditClick = (row: string[]) => {
    const id = row[5];
    const item = listData?.find((x: any) => x.id === id);
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
            <label className="block text-xs font-semibold text-slate-600">Select Patient
              <select name="patientId" defaultValue={item?.patientId || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required>
                <option value="">Choose patient...</option>
                {patientsList?.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientCode})</option>
                ))}
              </select>
            </label>
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
            <label className="block text-xs font-semibold text-slate-600">Notes
              <textarea name="notes" defaultValue={item?.notes || ''} className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" rows={3}></textarea>
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
              <div className="h-full rounded-full bg-primary" style={{ width: `${55 + i * 10}%` }} />
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
        rows={filteredRows} 
        onStatusClick={isPatients ? handleStatusClick : undefined}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
      />
      
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
