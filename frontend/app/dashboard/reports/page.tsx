'use client';

import { ArrowDown, ArrowUp, BarChart3, BedDouble, Building2, CalendarDays, Download, DollarSign, FileText, FlaskConical, TrendingUp, Users } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useSWR from 'swr';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const fetcher = (path: string) => fetch(`${apiUrl}${path}`, { headers: { Authorization: `Bearer ${localStorage.getItem('vasavi-token') || ''}` } }).then((res) => res.json());

const COLORS = ['#14b8a6', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function ReportsPage() {
  const { data: stats } = useSWR('/reports/stats', fetcher, { refreshInterval: 30000 });
  const { data: revenueData } = useSWR('/reports/revenue', fetcher, { refreshInterval: 30000 });
  const { data: departmentData } = useSWR('/reports/department', fetcher, { refreshInterval: 30000 });
  const departmentList = Array.isArray(departmentData) ? departmentData : [];
  const { data: reportList } = useSWR('/reports', fetcher, { refreshInterval: 60000 });

  const revenueList = Array.isArray(revenueData) ? revenueData : [];
  const totalRevenue = revenueList.reduce((sum: number, m: any) => sum + (m.revenue || 0), 0) || 0;
  const totalPatients = revenueList.reduce((sum: number, m: any) => sum + (m.patients || 0), 0) || 0;
  const totalAppointments = revenueList.reduce((sum: number, m: any) => sum + (m.appointments || 0), 0) || 0;

  const kpiCards = [
    { icon: TrendingUp, label: 'Revenue growth', value: stats?.revenueGrowth || '0%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: Users, label: 'Patient growth', value: stats?.patientGrowth || '0%', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: BedDouble, label: 'Bed occupancy', value: stats?.bedOccupancy || '0%', color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: DollarSign, label: 'Collection rate', value: stats?.collectionRate || '0%', color: 'text-primary', bg: 'bg-primary/10' },
  ];

  const exportReport = () => {
    if (!Array.isArray(revenueData) || revenueData.length === 0) return;
    const csv = 'Month,Revenue,Patients,Appointments\n' + revenueData.map((r: any) => `${r.month},${r.revenue},${r.patients},${r.appointments}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vasavi_revenue_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-poppins text-2xl font-semibold tracking-tight sm:text-3xl">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Operational, clinical and financial insights at a glance.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportReport} className="btn-secondary !px-4 !py-2.5">
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map(({ icon: Icon, label, value, color, bg }) => (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" key={label}>
            <div className="flex items-center justify-between">
              <span className={`grid size-10 place-items-center rounded-xl ${bg} ${color}`}>
                <Icon size={19} />
              </span>
              <span className={`flex items-center gap-1 text-xs font-semibold ${value.startsWith('-') ? 'text-red-600' : 'text-emerald-600'}`}>
                {value.startsWith('-') ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                {value}
              </span>
            </div>
            <p className="mt-5 text-xs font-medium text-slate-400">{label}</p>
            <p className="mt-1 font-poppins text-2xl font-semibold">{value}</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, parseInt(value))}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Revenue Trend Chart */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-poppins font-semibold flex items-center gap-2">
                <DollarSign size={18} className="text-primary" /> Revenue Trend
              </h2>
              <p className="mt-1 text-xs text-slate-400">Monthly revenue (last 12 months)</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
              ₹{totalRevenue.toLocaleString()}
            </span>
          </div>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueList}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={11} />
                <YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={3} fill="url(#revFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Performance */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-poppins font-semibold flex items-center gap-2">
                <Building2 size={18} className="text-primary" /> Department Performance
              </h2>
              <p className="mt-1 text-xs text-slate-400">Completed appointments by department</p>
            </div>
          </div>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentList} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} fontSize={11} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} width={100} />
                <Tooltip />
                <Bar dataKey="appointments" fill="#14b8a6" radius={[0, 6, 6, 0]} barSize={18}>
                  {departmentList.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Patient & Appointments Trend */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-poppins font-semibold flex items-center gap-2">
                <CalendarDays size={18} className="text-primary" /> Patient & Appointment Flow
              </h2>
              <p className="mt-1 text-xs text-slate-400">Monthly patient registrations and appointments</p>
            </div>
          </div>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueList}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={11} />
                <YAxis axisLine={false} tickLine={false} fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="patients" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="New Patients" barSize={12} />
                <Bar dataKey="appointments" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Appointments" barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Available Reports List */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="font-poppins font-semibold flex items-center gap-2">
              <FileText size={18} className="text-primary" /> Available Reports
            </h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              {reportList?.length || 0} reports
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {!reportList && (
              <div className="flex items-center justify-center py-10 text-sm text-slate-400">
                Loading reports...
              </div>
            )}
            {reportList?.map((report: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 p-4 transition hover:border-primary/20 hover:bg-primary/[0.02]">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 grid size-8 place-items-center rounded-lg text-xs font-bold ${
                    report.category === 'Finance' ? 'bg-emerald-50 text-emerald-600' :
                    report.category === 'Clinical' ? 'bg-blue-50 text-blue-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {report.category === 'Finance' ? <DollarSign size={15} /> :
                     report.category === 'Clinical' ? <FlaskConical size={15} /> : <BarChart3 size={15} />}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{report.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{report.category} · {report.period}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-600">{report.status}</span>
                  <button className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:border-primary/30 hover:text-primary transition" title="Download">
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
