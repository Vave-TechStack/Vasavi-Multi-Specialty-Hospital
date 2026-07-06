'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, Baby, Bone, Brain, Cross, HeartPulse, LoaderCircle, Ribbon, Stethoscope, Calendar, User, Phone, Mail, MapPin, ShieldAlert, FileText, ClipboardList, Receipt, Landmark, Clock, ArrowLeft, FlaskConical, Pill } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';

type DepartmentRecord = {
  id: string;
  name: string;
  code?: string;
  description?: string | null;
};

type DoctorRecord = {
  id: string;
  specialization?: string | null;
  qualification?: string | null;
  experienceYears?: number | null;
  consultationFee?: number | null;
  department?: { name?: string | null } | null;
  user?: { name?: string | null; email?: string | null } | null;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function usePublicDepartments() {
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch(`${apiUrl}/public/departments`);
        if (!response.ok) {
          throw new Error('Unable to load hospital departments');
        }
        const payload = (await response.json()) as DepartmentRecord[];
        if (active) {
          setDepartments(Array.isArray(payload) ? payload : []);
          setError(null);
        }
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Unable to load hospital departments');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return { departments, loading, error };
}

export function usePublicDoctors(limit = 4) {
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch(`${apiUrl}/public/doctors?limit=${limit}`);
        if (!response.ok) {
          throw new Error('Unable to load doctors');
        }
        const payload = (await response.json()) as DoctorRecord[];
        if (active) {
          setDoctors(Array.isArray(payload) ? payload : []);
          setError(null);
        }
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Unable to load doctors');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [limit]);

  return { doctors, loading, error };
}

export function DepartmentShowcase({ compact = false }: { compact?: boolean }) {
  const { departments, loading, error } = usePublicDepartments();

  if (loading) {
    return (
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="card p-6" key={index}>
            <div className="h-12 w-12 rounded-2xl bg-slate-100" />
            <div className="mt-5 h-4 w-24 rounded bg-slate-100" />
            <div className="mt-3 h-3 w-full rounded bg-slate-100" />
            <div className="mt-2 h-3 w-3/4 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
        <div className="flex items-center gap-2"><AlertCircle size={16} /> {error}</div>
      </div>
    );
  }

  return (
    <div className={`mt-12 grid gap-5 ${compact ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
      {departments.map((department) => {
        const Icon = departmentIcon(department.name);
        return (
          <div className="card group p-6" key={department.id}>
            <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
              <Icon size={23} />
            </span>
            <h3 className="mt-5 font-poppins text-lg font-semibold">{department.name}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{department.description || 'Advanced clinical care tailored to each patient journey.'}</p>
          </div>
        );
      })}
    </div>
  );
}

export function DoctorShowcase({ limit = 4 }: { limit?: number }) {
  const { doctors, loading, error } = usePublicDoctors(limit);

  if (loading) {
    return (
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="overflow-hidden rounded-[1.75rem] bg-white text-dark" key={index}>
            <div className="h-64 w-full bg-slate-100" />
            <div className="p-5">
              <div className="h-3 w-20 rounded bg-slate-100" />
              <div className="mt-3 h-4 w-32 rounded bg-slate-100" />
              <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
        <div className="flex items-center gap-2"><AlertCircle size={16} /> {error}</div>
      </div>
    );
  }

  return (
    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {doctors.map((doctor) => {
        const name = doctor.user?.name || 'Medical Specialist';
        const department = doctor.department?.name || 'General Medicine';
        const role = doctor.specialization || department;
        const experience = doctor.experienceYears ? `${doctor.experienceYears} years experience` : 'Experienced specialist';
        const fee = doctor.consultationFee ? `₹${doctor.consultationFee.toLocaleString()} consultation fee` : 'Availability on request';
        return (
          <div className="overflow-hidden rounded-[1.75rem] bg-white text-dark" key={doctor.id}>
            <div className="h-64 w-full bg-[radial-gradient(circle_at_top,_#d1fae5,_#f8fafc)]" />
            <div className="p-5">
              <span className="text-xs font-semibold text-primary">Available today</span>
              <h3 className="mt-2 font-poppins text-lg font-semibold">{name}</h3>
              <p className="mt-1 text-sm text-slate-500">{role}</p>
              <p className="mt-3 text-xs text-slate-400">{department} • {experience}</p>
              <p className="mt-2 text-xs text-slate-500">{fee}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function departmentIcon(name: string): LucideIcon {
  const normalized = name.toLowerCase();
  if (normalized.includes('card')) return HeartPulse;
  if (normalized.includes('neu')) return Brain;
  if (normalized.includes('ortho')) return Bone;
  if (normalized.includes('pedi')) return Baby;
  if (normalized.includes('emerg')) return Cross;
  if (normalized.includes('onc')) return Ribbon;
  if (normalized.includes('medi')) return Stethoscope;
  return Activity;
}

export function HospitalData({ patientId }: { patientId: string }) {
  const [activeTab, setActiveTab] = useState<'clinical' | 'financial' | 'admissions' | 'lab' | 'medications' | 'timeline'>('clinical');
  const token = typeof window !== 'undefined' ? localStorage.getItem('vasavi-token') : '';

  const fetcher = async (url: string) => {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token || ''}` }
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  };

  const { data, error, isLoading } = useSWR(`${apiUrl}/patients/${patientId}/profile`, fetcher);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoaderCircle className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-8 text-center">
        <AlertCircle className="mx-auto text-red-500" size={48} />
        <h3 className="mt-4 font-poppins text-lg font-semibold text-slate-800">Error loading patient profile</h3>
        <p className="mt-2 text-sm text-slate-500">{error?.message || 'Patient not found'}</p>
        <Link href="/dashboard/patients" className="btn-primary mt-6 inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Patients
        </Link>
      </div>
    );
  }

  const { patient, timeline } = data;
  const birthDate = patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '—';
  const age = patient.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/patients" className="btn-secondary !p-2">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-poppins text-2xl font-bold text-slate-800">
            {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-xs font-semibold text-slate-400">Patient Profile • {patient.patientCode}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Patient Details Card */}
        <div className="card p-6 space-y-6 self-start">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary font-poppins text-lg font-bold">
              {patient.firstName[0]}{patient.lastName[0]}
            </div>
            <div>
              <h3 className="font-poppins font-semibold text-slate-800">{patient.firstName} {patient.lastName}</h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                {patient.gender}
              </span>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 text-slate-600">
              <Calendar size={16} className="text-slate-400" />
              <span>{birthDate} ({age} years old)</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Phone size={16} className="text-slate-400" />
              <span>{patient.phone}</span>
            </div>
            {patient.email && (
              <div className="flex items-center gap-3 text-slate-600">
                <Mail size={16} className="text-slate-400" />
                <span className="truncate">{patient.email}</span>
              </div>
            )}
            {patient.address && (
              <div className="flex items-start gap-3 text-slate-600">
                <MapPin size={16} className="mt-0.5 text-slate-400 shrink-0" />
                <span>{patient.address}</span>
              </div>
            )}
            {patient.bloodGroup && (
              <div className="flex items-center gap-3 text-slate-600">
                <HeartPulse size={16} className="text-slate-400" />
                <span>Blood Group: <strong className="text-slate-800">{patient.bloodGroup}</strong></span>
              </div>
            )}
          </div>

          {(patient.emergencyName || patient.emergencyPhone) && (
            <div className="rounded-2xl bg-amber-50/50 border border-amber-100 p-4 space-y-2">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                <ShieldAlert size={14} /> Emergency Contact
              </h4>
              <p className="text-sm font-semibold text-slate-700">{patient.emergencyName || 'Unnamed contact'}</p>
              <p className="text-xs text-slate-500">{patient.emergencyPhone || 'No phone number'}</p>
            </div>
          )}
        </div>

        {/* Right Column: Profile Navigation & Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex border-b border-slate-200">
            {(['clinical', 'financial', 'admissions', 'lab', 'medications', 'timeline'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-5 py-3 text-sm font-semibold capitalize transition-all ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="card p-6 min-h-[300px]">
            {activeTab === 'clinical' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-poppins font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <FileText size={18} className="text-primary" /> Upcoming & Recent Appointments
                  </h3>
                  {patient.appointments?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead>
                          <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                            <th className="pb-2">Date & Time</th>
                            <th className="pb-2">Doctor</th>
                            <th className="pb-2">Department</th>
                            <th className="pb-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {patient.appointments.map((app: any) => (
                            <tr key={app.id}>
                              <td className="py-2.5">{new Date(app.scheduledAt).toLocaleString()}</td>
                              <td className="py-2.5">{app.doctor?.user?.name || '—'}</td>
                              <td className="py-2.5">{app.department?.name || '—'}</td>
                              <td className="py-2.5">
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  app.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-600' :
                                  app.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-600'
                                }`}>
                                  {app.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p className="text-sm text-slate-400">No appointments recorded.</p>}
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h3 className="font-poppins font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <ClipboardList size={18} className="text-primary" /> Medical Records
                  </h3>
                  {patient.medicalRecords?.length > 0 ? (
                    <div className="space-y-4">
                      {patient.medicalRecords.map((rec: any) => (
                        <div key={rec.id} className="rounded-xl border border-slate-100 p-4 text-sm">
                          <div className="flex justify-between font-semibold text-slate-800">
                            <span>Diagnosis: {rec.diagnosis}</span>
                            <span className="text-xs font-normal text-slate-400">{new Date(rec.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="mt-2 text-slate-600">{rec.treatmentPlan || 'No treatment plan documented.'}</p>
                          <p className="mt-1 text-xs text-slate-400">Dr. {rec.doctor?.user?.name || '—'}</p>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-slate-400">No medical records available.</p>}
                </div>
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="space-y-4">
                <h3 className="font-poppins font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Receipt size={18} className="text-primary" /> Invoices & Billing
                </h3>
                {patient.invoices?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                          <th className="pb-2">Invoice #</th>
                          <th className="pb-2">Date</th>
                          <th className="pb-2">Amount</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {patient.invoices.map((inv: any) => (
                          <tr key={inv.id}>
                            <td className="py-2.5 font-semibold text-slate-800">{inv.invoiceNumber}</td>
                            <td className="py-2.5">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                            <td className="py-2.5">₹{Number(inv.total).toLocaleString()}</td>
                            <td className="py-2.5">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                inv.status === 'PAID' ? 'bg-green-50 text-green-600' :
                                inv.status === 'PARTIALLY_PAID' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-sm text-slate-400">No invoices generated.</p>}
              </div>
            )}

            {activeTab === 'admissions' && (
              <div className="space-y-4">
                <h3 className="font-poppins font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Landmark size={18} className="text-primary" /> Admission History
                </h3>
                {patient.admissions?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                          <th className="pb-2">Bed / Room</th>
                          <th className="pb-2">Room Type</th>
                          <th className="pb-2">Admitted</th>
                          <th className="pb-2">Discharged</th>
                          <th className="pb-2">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {patient.admissions.map((adm: any) => {
                          const admitted = new Date(adm.admittedAt);
                          const discharged = adm.dischargedAt ? new Date(adm.dischargedAt) : null;
                          const duration = discharged
                            ? Math.round((discharged.getTime() - admitted.getTime()) / (1000 * 60 * 60 * 24)) + ' days'
                            : Math.round((Date.now() - admitted.getTime()) / (1000 * 60 * 60 * 24)) + ' days (ongoing)';
                          return (
                            <tr key={adm.id}>
                              <td className="py-2.5 font-semibold text-slate-800">
                                Bed {adm.bed?.bedNumber} ({adm.bed?.room?.roomNumber})
                              </td>
                              <td className="py-2.5 text-slate-500">{adm.bed?.room?.type || '—'}</td>
                              <td className="py-2.5">{admitted.toLocaleDateString()} {admitted.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                              <td className="py-2.5">
                                {discharged ? (
                                  <span>{discharged.toLocaleDateString()}</span>
                                ) : (
                                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600">Active</span>
                                )}
                              </td>
                              <td className="py-2.5 text-xs text-slate-400">{duration}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-sm text-slate-400">No admission history found.</p>}
              </div>
            )}
            
            {activeTab === 'lab' && (
              <div className="space-y-4">
                <h3 className="font-poppins font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <FlaskConical size={18} className="text-primary" /> Lab Results
                </h3>
                {patient.labOrders?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                          <th className="pb-2">Test</th>
                          <th className="pb-2">Priority</th>
                          <th className="pb-2">Ordered</th>
                          <th className="pb-2">Completed</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {patient.labOrders.map((order: any) => (
                          <tr key={order.id}>
                            <td className="py-2.5 font-semibold text-slate-800">{order.test?.name || 'Test'}</td>
                            <td className="py-2.5">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                order.priority === 'CRITICAL' ? 'bg-red-50 text-red-600' :
                                order.priority === 'HIGH' ? 'bg-amber-50 text-amber-600' :
                                'bg-blue-50 text-blue-600'
                              }`}>{order.priority}</span>
                            </td>
                            <td className="py-2.5 text-xs">{new Date(order.orderedAt).toLocaleDateString()}</td>
                            <td className="py-2.5 text-xs">{order.completedAt ? new Date(order.completedAt).toLocaleDateString() : '—'}</td>
                            <td className="py-2.5">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                order.status === 'COMPLETED' || order.status === 'READY' ? 'bg-green-50 text-green-600' :
                                order.status === 'PROCESSING' ? 'bg-blue-50 text-blue-600' :
                                order.status === 'CRITICAL' ? 'bg-red-50 text-red-600' :
                                'bg-slate-50 text-slate-600'
                              }`}>{order.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-sm text-slate-400">No lab orders for this patient.</p>}
              </div>
            )}
            
            {activeTab === 'medications' && (
              <div className="space-y-4">
                <h3 className="font-poppins font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Pill size={18} className="text-primary" /> Medication History
                </h3>
                {patient.medicineUsages?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                          <th className="pb-2">Medicine</th>
                          <th className="pb-2">Quantity</th>
                          <th className="pb-2">Price at Use</th>
                          <th className="pb-2">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {patient.medicineUsages.map((usage: any) => (
                          <tr key={usage.id}>
                            <td className="py-2.5 font-semibold text-slate-800">{usage.medicine?.name || 'Medicine'}</td>
                            <td className="py-2.5">{usage.quantity} units</td>
                            <td className="py-2.5">₹{Number(usage.priceAtUse).toLocaleString()}</td>
                            <td className="py-2.5 font-semibold">₹{(Number(usage.priceAtUse) * usage.quantity).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-sm text-slate-400">No medications dispensed for this patient.</p>}
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <h3 className="font-poppins font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Clock size={18} className="text-primary" /> Patient Activity Timeline
                </h3>
                {timeline?.length > 0 ? (
                  <div className="relative border-l border-slate-100 pl-4 space-y-6">
                    {timeline.map((log: any) => (
                      <div key={log.id} className="relative text-sm">
                        <span className="absolute -left-[21px] top-1.5 grid size-2.5 place-items-center rounded-full bg-primary ring-4 ring-white" />
                        <div className="flex justify-between font-semibold text-slate-800">
                          <span>{log.action}</span>
                          <span className="text-xs font-normal text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="mt-1 text-slate-500 text-xs">Performed by {log.user?.name || 'System'}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-400">No logs recorded for this patient.</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
