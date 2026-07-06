'use client';

import { useEffect, useState } from 'react';
import { Activity, AlertCircle, BedDouble, FlaskConical, LoaderCircle, Microscope, Pill, Star, ArrowRight, Ambulance, Syringe, Quote } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

type HomepageData = {
  stats: { value: string; label: string }[];
  facilities: { name: string; icon: string }[];
  testimonials: { quote: string; name: string; dept: string; rating: number }[];
  healthArticles: { image: string; category: string; title: string }[];
};

const facilityIcons: Record<string, React.ReactNode> = {
  bed: <BedDouble size={27} />,
  pill: <Pill size={27} />,
  flask: <FlaskConical size={27} />,
  ambulance: <Ambulance size={27} />,
  syringe: <Syringe size={27} />,
  microscope: <Microscope size={27} />,
};

export function HomepageStats() {
  const [data, setData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/public/homepage`)
      .then(r => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="container-pad relative z-10 -mt-2 lg:-mt-8">
        <div className="grid overflow-hidden rounded-[1.75rem] bg-dark text-white shadow-2xl md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-7 text-center">
              <div className="mx-auto h-8 w-24 animate-pulse rounded bg-white/20" />
              <div className="mx-auto mt-2 h-4 w-20 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="container-pad relative z-10 -mt-2 lg:-mt-8">
      <div className="grid overflow-hidden rounded-[1.75rem] bg-dark text-white shadow-2xl md:grid-cols-4">
        {data.stats.map((s, i) => (
          <div key={s.label} className={`p-7 text-center ${i ? 'border-white/10 md:border-l' : ''}`}>
            <p className="font-poppins text-3xl font-semibold text-secondary">{s.value}</p>
            <p className="mt-1 text-sm text-slate-300">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomepageTestimonials() {
  const [data, setData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/public/homepage`)
      .then(r => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="bg-[#effaf8] py-24">
        <div className="container-pad">
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 animate-pulse rounded-[1.75rem] bg-white/60" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!data || !data.testimonials.length) return null;

  return (
    <section className="bg-[#effaf8] py-24">
      <div className="container-pad">
        <div className="text-center">
          <p className="eyebrow">Patient stories</p>
          <h2 className="mt-3 font-poppins text-3xl font-semibold tracking-tight sm:text-4xl">Trusted by families, every day</h2>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {data.testimonials.slice(0, 3).map((t, i) => (
            <article key={i} className={`rounded-[1.75rem] p-7 ${i === 1 ? 'bg-primary text-white' : 'bg-white'}`}>
              <Quote size={30} className={i === 1 ? 'text-secondary' : 'text-primary'} />
              <div className="mt-5 flex text-amber-400">
                {[1, 2, 3, 4, 5].map(x => <Star key={x} size={14} fill="currentColor" />)}
              </div>
              <p className="mt-5 leading-7">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-6 font-poppins font-semibold">{t.name}</p>
              <p className={`text-xs ${i === 1 ? 'text-teal-100' : 'text-slate-400'}`}>{t.dept}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomepageFacilities() {
  const [data, setData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/public/homepage`)
      .then(r => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="container-pad py-24">
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="container-pad py-24">
      <div className="text-center">
        <p className="eyebrow">Everything under one roof</p>
        <h2 className="mt-3 font-poppins text-3xl font-semibold tracking-tight sm:text-4xl">Facilities designed for safer, faster care</h2>
      </div>
      <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {data.facilities.map((f) => (
          <div key={f.name} className="rounded-2xl border border-slate-100 p-5 text-center shadow-sm">
            <span className="mx-auto inline-block text-primary">{facilityIcons[f.icon] || <Activity size={27} />}</span>
            <p className="mt-3 text-sm font-semibold">{f.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomepageHealthArticles() {
  const [data, setData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/public/homepage`)
      .then(r => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="container-pad py-24">
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="container-pad py-24">
      <p className="eyebrow">Health library</p>
      <h2 className="mt-3 font-poppins text-3xl font-semibold tracking-tight sm:text-4xl">Useful guidance from our specialists</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {data.healthArticles.map((a) => (
          <article key={a.title} className="group">
            <Image src={a.image} width={700} height={450} alt="" className="h-52 w-full rounded-2xl object-cover transition group-hover:scale-[1.01]" />
            <p className="mt-5 text-xs font-bold uppercase tracking-widest text-primary">{a.category}</p>
            <h3 className="mt-2 font-poppins text-lg font-semibold">{a.title}</h3>
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-500">Read article <ArrowRight size={15} /></p>
          </article>
        ))}
      </div>
    </section>
  );
}
