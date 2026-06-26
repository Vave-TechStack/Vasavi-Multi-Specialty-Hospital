'use client';

import { FormEvent, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, LoaderCircle } from 'lucide-react';
import { departments, doctors } from '@/lib/data';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function AppointmentForm({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setError('');
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(`${apiUrl}/public/appointment-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: form.get('patientName'),
          phone: form.get('phone'),
          department: form.get('department'),
          preferredDoctor: form.get('preferredDoctor') || undefined,
          preferredDate: form.get('preferredDate'),
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || 'Unable to submit your request');
      setStatus('sent');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit your request');
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return <div className="grid min-h-64 place-items-center text-center"><div><CheckCircle2 className="mx-auto text-primary" size={48}/><h3 className="mt-4 font-poppins text-xl font-semibold">Appointment request received</h3><p className="mt-2 text-sm text-slate-500">Our care team will confirm your visit shortly.</p></div></div>;
  }

  return (
    <form onSubmit={submit} className={`grid gap-4 ${compact ? 'md:grid-cols-2' : ''}`}>
      <input name="patientName" required minLength={2} maxLength={120} autoComplete="name" placeholder="Patient name" className="rounded-xl border-slate-200 px-4 py-3 text-sm focus:border-primary focus:ring-primary"/>
      <input name="phone" required minLength={8} maxLength={20} autoComplete="tel" type="tel" placeholder="Phone number" className="rounded-xl border-slate-200 px-4 py-3 text-sm focus:border-primary focus:ring-primary"/>
      <select name="department" required defaultValue="" className="rounded-xl border-slate-200 px-4 py-3 text-sm focus:border-primary focus:ring-primary"><option value="" disabled>Select department</option>{departments.map(d=><option key={d.name}>{d.name}</option>)}</select>
      <select name="preferredDoctor" defaultValue="" className="rounded-xl border-slate-200 px-4 py-3 text-sm focus:border-primary focus:ring-primary"><option value="">Preferred doctor</option>{doctors.map(d=><option key={d.name}>{d.name}</option>)}</select>
      <input name="preferredDate" aria-label="Preferred appointment date" required type="date" className="rounded-xl border-slate-200 px-4 py-3 text-sm focus:border-primary focus:ring-primary"/>
      <button disabled={status === 'sending'} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60">
        {status === 'sending' ? <><LoaderCircle className="animate-spin" size={16}/> Sending...</> : <>Request appointment <ArrowRight size={16}/></>}
      </button>
      {status === 'error' && <p role="alert" className="flex items-center gap-2 text-sm text-red-600 md:col-span-2"><AlertCircle size={16}/>{error}. Please call +91 98765 43210.</p>}
    </form>
  );
}
