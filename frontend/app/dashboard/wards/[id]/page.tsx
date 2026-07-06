'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, BedDouble, Calendar, Clock, CreditCard, FlaskConical, HeartPulse, Hospital, LoaderCircle, MapPin, User, FileText, AlertCircle, Pill, Activity, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { useParams } from 'next/navigation';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const fetcher = (path: string) => fetch(`${apiUrl}${path}`, {
  headers: { Authorization: `Bearer ${localStorage.getItem('vasavi-token') || ''}` }
}).then((res) => res.json());

function statusColor(status: string) {
  switch (status) {
    case 'AVAILABLE': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    case 'OCCUPIED': return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'RESERVED': return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'MAINTENANCE': return 'bg-red-50 text-red-600 border-red-200';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

function BedStatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColor(status)}`}>
      {status}
    </span>
  );
}

export default function BedDetailPage() {
  const params = useParams();
  const bedId = params?.id as string;

  const { data, error, isLoading } = useSWR(
    bedId ? `/beds/${bedId}/details` : null,
    fetcher,
    { refreshInterval: 10000 }
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <LoaderCircle className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-8 text-center">
        <AlertCircle className="mx-auto text-red-500" size={48} />
        <h3 className="mt-4 font-poppins text-lg font-semibold text-slate-800">Error loading bed details</h3>
        <p className="mt-2 text-sm text-slate-500">{error?.message || 'Bed not found'}</p>
        <Link href="/dashboard/wards" className="btn-primary mt-6 inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Wards
        </Link>
      </div>
    );
  }

  const { bed, roomTypeStats } = data;
  const currentAdmission = bed.admissions?.find((a: any) => !a.dischargedAt);
  const currentPatient = currentAdmission?.patient;
  const pastAdmissions = bed.admissions?.filter((a: any) => a.dischargedAt) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/wards" className="btn-secondary !p-2">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <BedDouble size={24} />
          </span>
          <div>
            <h1 className="font-poppins text-2xl font-bold text-slate-800">
              {bed.room?.roomNumber} - Bed {bed.bedNumber}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <BedStatusBadge status={bed.status} />
              <span className="text-xs text-slate-400">{bed.room?.type} Ward</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Bed & Room Info */}
        <div className="card p-6 space-y-5 self-start">
          <h3 className="font-poppins font-semibold text-slate-800 flex items-center gap-2">
            <Hospital size={18} className="text-primary" /> Room Information
          </h3>
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 text-slate-600">
              <MapPin size={16} className="text-slate-400" />
              <span>Room <strong>{bed.room?.roomNumber}</strong> — {bed.room?.type}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <BedDouble size={16} className="text-slate-400" />
              <span>Bed <strong>{bed.bedNumber}</strong></span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <HeartPulse size={16} className="text-slate-400" />
              <span>Status: <BedStatusBadge status={bed.status} /></span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <CreditCard size={16} className="text-slate-400" />
              <span>Daily rate: <strong>₹{Number(bed.room?.dailyRate || 0).toLocaleString()}</strong></span>
            </div>
          </div>

          {/* Room Type Stats */}
          {roomTypeStats && roomTypeStats.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Ward Occupancy</h4>
              <div className="space-y-2">
                {roomTypeStats.map((stat: any) => (
                  <div key={stat.status} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 capitalize">{stat.status.toLowerCase()}</span>
                    <span className="font-semibold text-slate-700">{stat._count.id} beds</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Current Patient & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Patient Card */}
          <div className="card p-6">
            <h3 className="font-poppins font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <User size={18} className="text-primary" /> 
              {currentPatient ? 'Currently Admitted Patient' : 'No Patient Assigned'}
            </h3>
            
            {currentPatient ? (
              <div className="space-y-5">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary font-poppins text-xl font-bold">
                    {currentPatient.firstName?.[0]}{currentPatient.lastName?.[0]}
                  </div>
                  <div>
                    <Link href={`/dashboard/patients/${currentPatient.id}`} className="font-poppins text-lg font-semibold text-slate-800 hover:text-primary transition">
                      {currentPatient.firstName} {currentPatient.lastName}
                    </Link>
                    <p className="text-xs text-slate-400">{currentPatient.patientCode}</p>
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600 mt-1 inline-block">
                      Admitted
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar size={14} className="text-slate-400" />
                    <span>Admitted: {new Date(currentAdmission.admittedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock size={14} className="text-slate-400" />
                    <span>{new Date(currentAdmission.admittedAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <User size={14} className="text-slate-400" />
                    <span>{currentPatient.gender}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <HeartPulse size={14} className="text-slate-400" />
                    <span>DOB: {currentPatient.dateOfBirth ? new Date(currentPatient.dateOfBirth).toLocaleDateString() : '—'}</span>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex gap-3 pt-2">
                  <Link href={`/dashboard/patients/${currentPatient.id}`} className="btn-primary !px-4 !py-2 text-xs">
                    <User size={14} /> View Full Profile
                  </Link>
                </div>

                {/* Recent Appointments for current patient */}
                {currentPatient.appointments?.length > 0 && (
                  <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1">
                      <Calendar size={12} /> Recent Appointments
                    </h4>
                    <div className="space-y-2">
                      {currentPatient.appointments.slice(0, 3).map((appt: any) => (
                        <div key={appt.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5 text-sm">
                          <div>
                            <span className="font-semibold text-slate-700">{appt.doctor?.user?.name || 'Doctor'}</span>
                            <span className="text-slate-400 text-xs ml-2">{appt.department?.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">{new Date(appt.scheduledAt).toLocaleDateString()}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              appt.status === 'COMPLETED' ? 'bg-green-50 text-green-600' :
                              appt.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'
                            }`}>{appt.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Invoices */}
                {currentPatient.invoices?.length > 0 && (
                  <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1">
                      <CreditCard size={12} /> Billing
                    </h4>
                    <div className="space-y-2">
                      {currentPatient.invoices.slice(0, 3).map((inv: any) => (
                        <div key={inv.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5 text-sm">
                          <span className="font-semibold text-slate-700">{inv.invoiceNumber}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-600">₹{Number(inv.total).toLocaleString()}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              inv.status === 'PAID' ? 'bg-green-50 text-green-600' :
                              inv.status === 'ISSUED' || inv.status === 'PARTIALLY_PAID' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                            }`}>{inv.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <User size={40} className="text-slate-200" />
                <p className="text-sm text-slate-400">This bed is currently vacant.</p>
                <p className="text-xs text-slate-300">Assign a patient from the patients module.</p>
              </div>
            )}
          </div>

          {/* Admission History */}
          <div className="card p-6">
            <h3 className="font-poppins font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-primary" /> Admission History
            </h3>
            {bed.admissions?.length > 0 ? (
              <div className="space-y-3">
                {bed.admissions.map((adm: any) => (
                  <div key={adm.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 text-sm transition hover:border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary font-semibold text-xs">
                        {adm.patient?.firstName?.[0]}{adm.patient?.lastName?.[0]}
                      </div>
                      <div>
                        <Link href={`/dashboard/patients/${adm.patientId}`} className="font-semibold text-slate-700 hover:text-primary transition">
                          {adm.patient?.firstName} {adm.patient?.lastName}
                        </Link>
                        <p className="text-xs text-slate-400">{adm.patient?.patientCode}</p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <p>Admitted: {new Date(adm.admittedAt).toLocaleDateString()}</p>
                      {adm.dischargedAt ? (
                        <p className="text-emerald-600 font-semibold">Discharged: {new Date(adm.dischargedAt).toLocaleDateString()}</p>
                      ) : (
                        <p className="text-amber-600 font-semibold">Currently admitted</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-6 text-center">No admission history for this bed.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
