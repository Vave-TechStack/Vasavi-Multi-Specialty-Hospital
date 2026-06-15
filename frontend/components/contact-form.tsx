'use client';

import { FormEvent, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, LoaderCircle } from 'lucide-react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${apiUrl}/public/contact-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || 'Unable to send message');
      setStatus('sent');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to send message');
      setStatus('error');
    }
  }

  if (status === 'sent') return <div className="card grid min-h-72 place-items-center p-7 text-center"><div><CheckCircle2 className="mx-auto text-primary" size={42}/><h2 className="mt-4 font-poppins text-xl font-semibold">Message received</h2><p className="mt-2 text-sm text-slate-500">Our care team will respond shortly.</p></div></div>;

  return <form onSubmit={submit} className="card grid gap-4 p-7 sm:grid-cols-2">
    <input name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder="Your name" className="rounded-xl border-slate-200"/>
    <input name="email" required type="email" autoComplete="email" placeholder="Email address" className="rounded-xl border-slate-200"/>
    <input name="phone" maxLength={20} autoComplete="tel" placeholder="Phone number" className="rounded-xl border-slate-200"/>
    <select name="subject" required className="rounded-xl border-slate-200"><option>General enquiry</option><option>Appointment</option><option>Medical records</option></select>
    <textarea name="message" required minLength={10} maxLength={3000} placeholder="How can we help?" rows={5} className="rounded-xl border-slate-200 sm:col-span-2"/>
    {status === 'error' && <p role="alert" className="flex items-center gap-2 text-sm text-red-600 sm:col-span-2"><AlertCircle size={16}/>{error}. Please call +91 98765 43210.</p>}
    <button disabled={status === 'sending'} className="btn-primary sm:col-span-2 disabled:opacity-60">{status === 'sending' ? <><LoaderCircle className="animate-spin" size={16}/> Sending...</> : <>Send message <ArrowRight size={16}/></>}</button>
  </form>;
}
