export function SectionHeading({ eyebrow, title, text, center = false }: { eyebrow: string; title: string; text?: string; center?: boolean }) {
  return <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}><p className="eyebrow">{eyebrow}</p><h2 className="section-title mt-3">{title}</h2>{text && <p className="mt-4 leading-7 text-slate-600">{text}</p>}</div>;
}
