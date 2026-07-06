'use client';

import { BedDouble, Building2, Clock, Users, ArrowUpRight, ArrowDownRight, LoaderCircle } from 'lucide-react';
import useSWR from 'swr';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const fetcher = (path: string) => fetch(`${apiUrl}${path}`, {
  headers: { Authorization: `Bearer ${localStorage.getItem('vasavi-token') || ''}` }
}).then((res) => res.json());

const STATUS_COLORS = ['#14b8a6', '#f59e0b', '#ef4444', '#3b82f6'];

export function WardOccupancyCards() {
  const { data, error, isLoading } = useSWR('/wards/occupancy', fetcher, { refreshInterval: 10000 });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-white p-5 shadow-sm animate-pulse">
            <div className="size-10 rounded-xl bg-slate-100" />
            <div className="mt-5 h-3 w-24 rounded-full bg-slate-100" />
            <div className="mt-1 h-7 w-16 rounded-lg bg-slate-100" />
            <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
        Failed to load ward occupancy data. Make sure you have admin permissions.
      </div>
    );
  }

  const occupancyPct = data.occupancyRate || 0;

  const cards = [
    {
      icon: BedDouble,
      label: 'Total Beds',
      value: data.totalBeds?.toLocaleString() || '0',
      detail: 'Hospital capacity',
      pct: 100,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: Users,
      label: 'Occupied Beds',
      value: data.occupiedBeds?.toLocaleString() || '0',
      detail: `${occupancyPct}% occupancy`,
      pct: occupancyPct,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      icon: BedDouble,
      label: 'Available Beds',
      value: data.availableBeds?.toLocaleString() || '0',
      detail: 'Ready to allocate',
      pct: data.totalBeds > 0 ? ((data.availableBeds / data.totalBeds) * 100) : 0,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      icon: Building2,
      label: 'Ward Types',
      value: data.byType?.length?.toLocaleString() || '0',
      detail: 'Different room types',
      pct: 100,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
  ];

  const chartData = data.byType?.map((item: any) => ({
    name: item.type,
    Occupied: item.occupied || 0,
    Available: item.available || 0,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ icon: Icon, label, value, detail, pct, color, bg }) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className={`grid size-10 place-items-center rounded-xl ${bg} ${color}`}>
                <Icon size={19} />
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <ArrowUpRight size={14} /> Live
              </span>
            </div>
            <p className="mt-5 text-xs font-medium text-slate-400">{label}</p>
            <p className="mt-1 font-poppins text-2xl font-semibold">{value}</p>
            <p className="text-xs text-slate-400 mt-1">{detail}</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Occupancy by Room Type Chart */}
      {chartData.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-poppins font-semibold text-slate-800 flex items-center gap-2">
                <Building2 size={18} className="text-primary" /> Occupancy by Ward Type
              </h3>
              <p className="mt-1 text-xs text-slate-400">Real-time bed allocation across all ward types</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {occupancyPct}% occupied
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} />
                <YAxis axisLine={false} tickLine={false} fontSize={11} />
                <Tooltip />
                <Bar dataKey="Occupied" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} name="Occupied" />
                <Bar dataKey="Available" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={24} name="Available" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Room and Bed Detail List */}
      {data.rooms && data.rooms.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="font-poppins font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BedDouble size={18} className="text-primary" /> Bed Allocation by Room
          </h3>
          <div className="space-y-4">
            {data.rooms.map((room: any) => {
              const occupiedBeds = room.beds.filter((b: any) => b.status === 'OCCUPIED').length;
              const totalBedsInRoom = room.beds.length;
              const roomOccupancyPct = totalBedsInRoom > 0 ? Math.round((occupiedBeds / totalBedsInRoom) * 100) : 0;
              return (
                <div key={room.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-sm text-slate-700">
                        {room.roomNumber} <span className="text-xs font-normal text-slate-400">· {room.type}</span>
                      </h4>
                      <p className="text-xs text-slate-400">₹{room.dailyRate?.toLocaleString()}/day · {occupiedBeds}/{totalBedsInRoom} beds occupied</p>
                    </div>
                    <span className={`text-xs font-semibold ${
                      roomOccupancyPct >= 80 ? 'text-red-500' : roomOccupancyPct >= 50 ? 'text-amber-500' : 'text-emerald-500'
                    }`}>
                      {roomOccupancyPct}%
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {room.beds.map((bed: any) => (
                      <a
                        key={bed.id}
                        href={`/dashboard/wards/${bed.id}`}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition hover:scale-105 ${
                          bed.status === 'AVAILABLE' ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100' :
                          bed.status === 'OCCUPIED' ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100' :
                          bed.status === 'MAINTENANCE' ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' :
                          'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                        title={bed.currentPatient ? `${bed.currentPatient.firstName} ${bed.currentPatient.lastName}` : 'Available'}
                      >
                        <BedDouble size={10} />
                        {bed.bedNumber}
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
