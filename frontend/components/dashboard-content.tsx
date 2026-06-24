'use client';

import { ArrowDownRight, ArrowUpRight, CalendarDays, ChevronRight, CircleDollarSign, Download, MoreHorizontal, Plus, Search, Stethoscope, Users } from 'lucide-react';
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
 return <><PageTitle title="Good morning, Admin" text="Here’s what is happening across Vasavi today."/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{overviewStats.map(({icon:Icon,label,value,detail,up})=><div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" key={label}><div className="flex justify-between"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon size={19}/></span><span className={`flex items-center gap-1 text-xs font-semibold ${up?'text-emerald-600':'text-slate-400'}`}>{up?<ArrowUpRight size={14}/>:<ArrowDownRight size={14}/>} {detail}</span></div><p className="mt-5 text-xs font-medium text-slate-400">{label}</p><p className="mt-1 font-poppins text-2xl font-semibold">{value}</p></div>)}</div>
 <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_.6fr]"><div className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-poppins font-semibold">Patient flow</h2><p className="mt-1 text-xs text-slate-400">Visits over the last 7 days</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">+14.2% this week</span></div><div className="mt-5 h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chart}><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#14b8a6" stopOpacity={.35}/><stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/><XAxis dataKey="d" axisLine={false} tickLine={false} fontSize={11}/><YAxis axisLine={false} tickLine={false} fontSize={11}/><Tooltip/><Area type="monotone" dataKey="v" stroke="#0f766e" strokeWidth={3} fill="url(#fill)"/></AreaChart></ResponsiveContainer></div></div><div className="rounded-2xl bg-dark p-6 text-white shadow-sm"><h2 className="font-poppins font-semibold">Live operations</h2><p className="mt-1 text-xs text-slate-400">Updated just now</p><div className="mt-6 grid gap-4">{[['Emergency queue','6','2 critical'],['Beds available','34','8 ICU'],['Lab results pending','19','4 urgent'],['Ambulances active','3','ETA 8 min']].map(([a,b,c],i)=><div className="flex items-center gap-3" key={a}><span className={`size-2 rounded-full ${i===0?'bg-red-400':'bg-secondary'}`}/><div className="flex-1"><p className="text-sm">{a}</p><p className="text-[10px] text-slate-500">{c}</p></div><p className="font-poppins text-xl font-semibold">{b}</p></div>)}</div></div></div>
 <div className="mt-6"><TableCard title="Today’s appointments" rows={appointments}/></div></>
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

export function TableCard({title, rows, onStatusClick}:{title:string; rows:string[][]; onStatusClick?:(row:string[])=>void}){
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <h2 className="font-poppins font-semibold">{title}</h2>
        <button><MoreHorizontal size={18}/></button>
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
                <td className="px-5 py-4 text-right"><ChevronRight size={16}/></td>
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
  const [actionModal, setActionModal] = useState<{ type: 'admit' | 'discharge', patientId: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  
  const { data: stats } = useSWR(isPatients ? '/patients/stats' : null, fetcher, { refreshInterval: 5000 });
  const { data: patients, mutate: mutatePatients } = useSWR(isPatients ? '/patients' : null, fetcher, { refreshInterval: 5000 });
  const { data: beds } = useSWR(isPatients && actionModal?.type === 'admit' ? '/beds/available' : null, fetcher);

  // Apply real-time stats
  if (isPatients && stats) {
    d.stats = [
      ['Total patients', stats.totalPatients.toLocaleString()],
      ['New this month', stats.newThisMonth.toLocaleString()],
      ['Inpatients', stats.inpatients.toLocaleString()],
      ['Discharged today', stats.dischargedToday.toLocaleString()]
    ];
  }

  // Map API patients to rows
  let displayRows = d.rows;
  interface Patient {
    id: string;
    patientCode?: string | null;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender?: string | null;
    admissions?: {
      admittedAt: string;
      dischargedAt?: string | null;
    }[];
  }
  if (isPatients && patients && Array.isArray(patients)) {
    displayRows = patients.map((p: Patient) => {
      let status = 'Active';
      let admittedDateStr = '';
      const activeAdmission = p.admissions?.[0];
      if (activeAdmission) {
        if (!activeAdmission.dischargedAt) {
          status = 'Admitted';
        } else {
          status = 'Discharged';
        }
        admittedDateStr = activeAdmission.admittedAt.split('T')[0];
      }

      return [
        p.patientCode || 'NEW',
        `${p.firstName} ${p.lastName}`,
        `${new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()} years`,
        p.gender || 'General',
        status,
        p.id, // hidden data
        admittedDateStr // hidden data for date filtering
      ];
    });
  }

  // Filter based on searchTerm and filterDate
  const filteredRows = displayRows.filter(row => {
    const matchesSearch = row.slice(0, 5).some(cell => String(cell).toLowerCase().includes(searchTerm.toLowerCase()));
    if (!isPatients || !filterDate) return matchesSearch;
    
    // date filtering: check if the patient's admission date matches filterDate
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

  const handleAddPatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData);
    try {
      const res = await fetch(`${apiUrl}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('vasavi-token') || ''}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to add patient');
      await mutatePatients();
      setShowAddModal(false);
    } catch (err) { alert(err instanceof Error ? err.message : String(err)); }
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
      await mutatePatients();
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

  return (
    <>
      <PageTitle 
        title={d.title} 
        text={d.text} 
        action={d.action} 
        onAction={() => isPatients ? setShowAddModal(true) : null}
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
      <TableCard title={`Recent ${d.title.toLowerCase()}`} rows={filteredRows} onStatusClick={isPatients ? handleStatusClick : undefined} />
      
      {isPatients && showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-soft">
            <h2 className="font-poppins text-xl font-semibold mb-5">Add New Patient</h2>
            <form onSubmit={handleAddPatient} className="space-y-4">
              <label className="block text-xs font-semibold text-slate-600">First Name
                <input name="firstName" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
              </label>
              <label className="block text-xs font-semibold text-slate-600">Last Name
                <input name="lastName" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
              </label>
              <label className="block text-xs font-semibold text-slate-600">Phone
                <input name="phone" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
              </label>
              <label className="block text-xs font-semibold text-slate-600">Date of Birth
                <input name="dateOfBirth" type="date" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required />
              </label>
              <label className="block text-xs font-semibold text-slate-600">Gender
                <select name="gender" className="mt-1.5 w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm" required>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" className="btn-secondary !px-4" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary !px-6">Save Patient</button>
              </div>
            </form>
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
