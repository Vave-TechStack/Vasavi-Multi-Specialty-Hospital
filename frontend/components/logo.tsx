import { HeartPulse } from 'lucide-react';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-11 place-items-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
        <HeartPulse size={23} strokeWidth={2.4} />
      </span>
      {!compact && <span className="font-poppins text-[15px] font-bold leading-tight tracking-[-0.02em]">VASAVI<br/><span className="text-[10px] font-semibold tracking-[0.18em] text-primary">MULTI SPECIALTY HOSPITAL</span></span>}
    </div>
  );
}
