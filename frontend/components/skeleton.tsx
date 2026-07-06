'use client';

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm animate-pulse">
      <div className="flex justify-between">
        <div className="size-10 rounded-xl bg-slate-100" />
        <div className="h-3 w-16 rounded-full bg-slate-100" />
      </div>
      <div className="mt-5 h-3 w-24 rounded-full bg-slate-100" />
      <div className="mt-1 h-7 w-16 rounded-lg bg-slate-100" />
      <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm animate-pulse">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div className="h-5 w-40 rounded-lg bg-slate-100" />
        <div className="size-5 rounded-full bg-slate-100" />
      </div>
      <div className="divide-y divide-slate-50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="h-4 flex-1 rounded bg-slate-100" />
            <div className="h-4 flex-1 rounded bg-slate-100" />
            <div className="h-4 hidden flex-1 rounded bg-slate-100 md:block" />
            <div className="h-4 hidden flex-1 rounded bg-slate-100 lg:block" />
            <div className="h-6 w-20 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageTitleSkeleton() {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end animate-pulse">
      <div>
        <div className="h-8 w-64 rounded-lg bg-slate-100" />
        <div className="mt-1 h-4 w-80 rounded bg-slate-100" />
      </div>
      <div className="h-10 w-32 rounded-full bg-slate-100" />
    </div>
  );
}

export function ModulePageSkeleton() {
  return (
    <>
      <PageTitleSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="my-6 flex gap-3">
        <div className="h-11 flex-1 max-w-md rounded-xl bg-white border border-slate-200 animate-pulse" />
        <div className="h-11 w-24 rounded-xl bg-white border border-slate-200 animate-pulse" />
      </div>
      <TableSkeleton />
    </>
  );
}
