'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, LoaderCircle, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/logo';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const accounts = [
  ['Admin', 'admin@vasavihospital.com'],
  ['Doctor', 'doctor@vasavihospital.com'],
  ['Reception', 'reception@vasavihospital.com'],
  ['Accounts', 'accounts@vasavihospital.com'],
];

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState(accounts[0][1]);
  const [password, setPassword] = useState('Admin@123');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || 'Unable to sign in');
      localStorage.setItem('vasavi-user', JSON.stringify(body.user));
      localStorage.setItem('vasavi-token', body.token);
      router.replace('/dashboard');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  }

  return <main className="grid min-h-screen bg-[#effaf8] lg:grid-cols-[.9fr_1.1fr]">
    <section className="hidden bg-dark p-14 text-white lg:flex lg:flex-col lg:justify-between"><Logo/><div><p className="eyebrow !text-secondary">Vasavi CareOS</p><h1 className="mt-5 max-w-xl font-poppins text-5xl font-semibold leading-tight tracking-[-0.04em]">One calm place to run exceptional care.</h1><p className="mt-5 max-w-lg leading-7 text-slate-300">Appointments, patients, clinical operations and revenue, connected in real time.</p></div><p className="text-xs text-slate-500">Secure role-based hospital operations platform</p></section>
    <section className="flex items-center justify-center p-5 sm:p-10"><div className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-soft sm:p-10"><Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={16}/> Back to website</Link><h2 className="font-poppins text-3xl font-semibold tracking-tight">Welcome back</h2><p className="mt-2 text-sm text-slate-500">Sign in to your hospital workspace.</p><form onSubmit={login} className="mt-8 grid gap-4"><label className="text-xs font-semibold text-slate-600">Email address<input required value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" className="mt-2 w-full rounded-xl border-slate-200 px-4 py-3 text-sm"/></label><label className="relative text-xs font-semibold text-slate-600">Password<input required value={password} onChange={e=>setPassword(e.target.value)} type={show?'text':'password'} autoComplete="current-password" className="mt-2 w-full rounded-xl border-slate-200 px-4 py-3 text-sm"/><button type="button" onClick={()=>setShow(!show)} aria-label="Show password" className="absolute bottom-3 right-3 text-slate-400">{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></label>{error&&<p role="alert" className="flex items-center gap-2 text-sm font-medium text-red-600"><AlertCircle size={16}/>{error}</p>}<button disabled={loading} className="btn-primary mt-2 disabled:opacity-60">{loading?<><LoaderCircle className="animate-spin" size={16}/> Signing in...</>:<>Sign in securely <ArrowRight size={16}/></>}</button></form><div className="mt-7 border-t border-slate-100 pt-6"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Demo accounts · password Admin@123</p><div className="mt-3 grid grid-cols-2 gap-2">{accounts.map(([role,mail])=><button key={mail} onClick={()=>setEmail(mail)} className="rounded-xl bg-slate-50 px-3 py-2 text-left text-xs"><span className="block font-semibold text-slate-700">{role}</span><span className="text-[10px] text-slate-400">{mail.split('@')[0]}</span></button>)}</div></div><p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400"><ShieldCheck size={14}/> Protected with role-based access</p></div></section>
  </main>;
}
