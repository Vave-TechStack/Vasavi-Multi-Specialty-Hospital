'use client';

import {
  CalendarDays, Stethoscope, Award, GraduationCap, IndianRupee,
  IdCard, Mail, Activity, CheckCircle2, XCircle, Calendar,
  ArrowLeft, LoaderCircle, AlertCircle, Edit2, Plus, Trash2,
} from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const fetcher = (path: string) =>
  fetch(`${apiUrl}${path}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('vasavi-token') || ''}` },
  }).then((res) => res.json());

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function DoctorProfile({ doctorId }: { doctorId: string }) {
  const router = useRouter();
  const { data: doctor, error, isLoading, mutate } = useSWR(`/doctors/${doctorId}`, fetcher, { refreshInterval: 10000 });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedules, setEditingSchedules] = useState<any[]>([]);

  const handleEditScheduleClick = () => {
    setEditingSchedules(doctor?.schedules?.length > 0 ? doctor.schedules : [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true }
    ]);
    setShowScheduleModal(true);
  };

  const handleSaveSchedules = async () => {
    try {
      const res = await fetch(`${apiUrl}/doctors/${doctorId}/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('vasavi-token') || ''}`,
        },
        body: JSON.stringify({ schedules: editingSchedules })
      });
      if (!res.ok) throw new Error('Failed to save schedules');
      await mutate();
      setShowScheduleModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoaderCircle className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="card p-8 text-center">
        <AlertCircle className="mx-auto text-red-500" size={48} />
        <h3 className="mt-4 font-poppins text-lg font-semibold text-slate-800">Error loading doctor profile</h3>
        <p className="mt-2 text-sm text-slate-500">{error?.message || 'Doctor not found'}</p>
        <Link href="/dashboard/doctors" className="btn-primary mt-6 inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Doctors
        </Link>
      </div>
    );
  }

  const name = doctor.user?.name || 'Doctor';
  const email = doctor.user?.email || '—';
  const department = doctor.department?.name || 'General';
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
  const schedules = doctor.schedules || [];
  const appointments = doctor.appointments || [];
  const stats = doctor.stats || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/dashboard/doctors')} className="btn-secondary !p-2" aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-poppins text-2xl font-bold text-slate-800">{name}</h1>
          <p className="text-xs font-semibold text-slate-400">
            {department} • {doctor.specialization}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Info card */}
        <div className="card p-6 space-y-6 self-start">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
            <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary font-poppins text-xl font-bold">
              {initials}
            </div>
            <div>
              <h3 className="font-poppins text-lg font-semibold text-slate-800">Dr. {name}</h3>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {doctor.specialization || department}
              </span>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 text-slate-600">
              <GraduationCap size={16} className="text-slate-400 shrink-0" />
              <span>{doctor.qualification || 'MBBS'}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Award size={16} className="text-slate-400 shrink-0" />
              <span>{doctor.experienceYears || 0} years experience</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <IndianRupee size={16} className="text-slate-400 shrink-0" />
              <span>₹{Number(doctor.consultationFee || 0).toLocaleString()} consultation fee</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <IdCard size={16} className="text-slate-400 shrink-0" />
              <span>License: {doctor.licenseNumber || '—'}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Mail size={16} className="text-slate-400 shrink-0" />
              <span className="truncate">{email}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Stethoscope size={16} className="text-slate-400 shrink-0" />
              <span>{department}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 relative group">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Calendar size={14} /> Schedule
              </h4>
              <button onClick={handleEditScheduleClick} className="btn-secondary !p-1.5 opacity-0 group-hover:opacity-100 transition" aria-label="Edit Schedule">
                <Edit2 size={14} />
              </button>
            </div>
            {schedules.length > 0 ? (
              <div className="space-y-2">
                {schedules.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{DAY_NAMES[s.dayOfWeek]}</span>
                    {s.isAvailable ? (
                      <span className="text-emerald-600 font-semibold">
                        {s.startTime} - {s.endTime}
                      </span>
                    ) : (
                      <span className="text-slate-400">Unavailable</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No schedule configured</p>
            )}
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-emerald-700">
              {doctor.user?.status === 'ACTIVE' ? 'Active' : doctor.user?.status || 'Active'}
            </span>
          </div>
        </div>

        {/* Right column: Stats + Appointments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon={Activity} label="Total appointments" value={stats.totalAppointments ?? 0} color="bg-blue-100 text-blue-600" />
            <StatCard icon={CheckCircle2} label="Completed" value={stats.completedAppointments ?? 0} color="bg-emerald-100 text-emerald-600" />
            <StatCard icon={XCircle} label="Cancelled" value={stats.cancelledAppointments ?? 0} color="bg-red-100 text-red-600" />
            <StatCard icon={CalendarDays} label="Today" value={stats.todayAppointments ?? 0} color="bg-amber-100 text-amber-600" />
          </div>

          {/* Completion Rate Bar */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-poppins text-sm font-semibold text-slate-700">Completion rate</h4>
              <span className="text-sm font-bold text-primary">{stats.completionRate ?? 0}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${Math.min(100, stats.completionRate ?? 0)}%` }}
              />
            </div>
          </div>

          {/* Recent Appointments */}
          <div className="card p-6">
            <h3 className="font-poppins font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <CalendarDays size={16} className="text-primary" /> Recent appointments
            </h3>
            {appointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <th className="pb-3 pr-4">Patient</th>
                      <th className="pb-3 pr-4">Date & Time</th>
                      <th className="pb-3 pr-4">Reason</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {appointments.map((appt: any) => (
                      <tr key={appt.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 pr-4 font-medium text-slate-700">
                          {appt.patient ? `${appt.patient.firstName} ${appt.patient.lastName}` : '—'}
                        </td>
                        <td className="py-3 pr-4 text-slate-500">
                          {appt.scheduledAt
                            ? new Date(appt.scheduledAt).toLocaleDateString() + ' ' +
                              new Date(appt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                        <td className="py-3 pr-4 text-slate-500 max-w-[160px] truncate">
                          {appt.reason || '—'}
                        </td>
                        <td className="py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            appt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                            appt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                            appt.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                            appt.status === 'IN_CONSULTATION' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {appt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <CalendarDays size={24} className="text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">No appointments recorded</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 font-poppins text-lg font-semibold flex items-center gap-2">
              <Calendar size={20} className="text-primary" /> Edit Weekly Schedule
            </h2>
            <div className="space-y-4">
              {DAY_NAMES.map((dayName, dayIndex) => {
                const existing = editingSchedules.find(s => s.dayOfWeek === dayIndex);
                return (
                  <div key={dayIndex} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="w-32 font-semibold text-sm text-slate-700">{dayName}</div>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input 
                        type="checkbox" 
                        checked={existing?.isAvailable ?? false} 
                        onChange={(e) => {
                          const newScheds = [...editingSchedules];
                          const idx = newScheds.findIndex(s => s.dayOfWeek === dayIndex);
                          if (idx >= 0) newScheds[idx].isAvailable = e.target.checked;
                          else newScheds.push({ dayOfWeek: dayIndex, startTime: '09:00', endTime: '17:00', isAvailable: e.target.checked });
                          setEditingSchedules(newScheds);
                        }}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      Available
                    </label>
                    <input 
                      type="time" 
                      value={existing?.startTime || '09:00'} 
                      disabled={!existing?.isAvailable}
                      onChange={(e) => {
                        const newScheds = [...editingSchedules];
                        const idx = newScheds.findIndex(s => s.dayOfWeek === dayIndex);
                        if (idx >= 0) newScheds[idx].startTime = e.target.value;
                        setEditingSchedules(newScheds);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-50"
                    />
                    <span className="text-slate-400">to</span>
                    <input 
                      type="time" 
                      value={existing?.endTime || '17:00'} 
                      disabled={!existing?.isAvailable}
                      onChange={(e) => {
                        const newScheds = [...editingSchedules];
                        const idx = newScheds.findIndex(s => s.dayOfWeek === dayIndex);
                        if (idx >= 0) newScheds[idx].endTime = e.target.value;
                        setEditingSchedules(newScheds);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-50"
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button onClick={() => setShowScheduleModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSaveSchedules} className="btn-primary">Save Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm text-center">
      <div className={`mx-auto grid size-10 place-items-center rounded-xl ${color} mb-3`}>
        <Icon size={18} />
      </div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="font-poppins text-xl font-bold text-slate-800">{value}</p>
    </div>
  );
}
