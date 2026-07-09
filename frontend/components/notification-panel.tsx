'use client';

import { Bell, CalendarDays, CircleAlert, FlaskConical, HeartPulse, Hospital, Pill, UserPlus, X, BedDouble, LogOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { io as socketIO } from 'socket.io-client';
import useSWR, { mutate as globalMutate } from 'swr';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const fetcher = (path: string) =>
  fetch(`${apiUrl}${path}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('vasavi-token') || ''}` },
  }).then((res) => res.json());

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: 'APPOINTMENT' | 'APPOINTMENT_CANCELLED' | 'PATIENT_REGISTRATION' | 'ADMISSION' | 'DISCHARGE' | 'BED_STATUS' | 'BILLING' | 'PHARMACY_LOW_STOCK' | 'LAB_RESULT' | 'EMERGENCY' | 'FOLLOW_UP' | 'SYSTEM';
  createdAt: string;
  readAt: string | null;
};

const typeIcons: Record<string, React.ReactNode> = {
  APPOINTMENT: <CalendarDays size={14} />,
  APPOINTMENT_CANCELLED: <X size={14} />,
  PATIENT_REGISTRATION: <UserPlus size={14} />,
  ADMISSION: <Hospital size={14} />,
  DISCHARGE: <LogOut size={14} />,
  BED_STATUS: <BedDouble size={14} />,
  BILLING: <HeartPulse size={14} />,
  PHARMACY_LOW_STOCK: <Pill size={14} />,
  LAB_RESULT: <FlaskConical size={14} />,
  EMERGENCY: <CircleAlert size={14} />,
  FOLLOW_UP: <CalendarDays size={14} />,
  SYSTEM: <Bell size={14} />,
};

const typeColors: Record<string, string> = {
  APPOINTMENT: 'bg-blue-100 text-blue-600',
  APPOINTMENT_CANCELLED: 'bg-red-100 text-red-600',
  PATIENT_REGISTRATION: 'bg-purple-100 text-purple-600',
  ADMISSION: 'bg-amber-100 text-amber-600',
  DISCHARGE: 'bg-emerald-100 text-emerald-600',
  BED_STATUS: 'bg-cyan-100 text-cyan-600',
  BILLING: 'bg-emerald-100 text-emerald-600',
  PHARMACY_LOW_STOCK: 'bg-orange-100 text-orange-600',
  LAB_RESULT: 'bg-purple-100 text-purple-600',
  EMERGENCY: 'bg-red-100 text-red-600',
  FOLLOW_UP: 'bg-yellow-100 text-yellow-600',
  SYSTEM: 'bg-slate-100 text-slate-600',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { data: notifData, mutate } = useSWR('/notifications/unread', fetcher, {
    refreshInterval: 10000,
  });

  const { data: allNotifData } = useSWR(open ? '/notifications' : null, fetcher, {
    refreshInterval: 10000,
  });

  const unreadCount = notifData?.count ?? 0;
  const notifications: NotificationItem[] = allNotifData ?? [];

  // Real-time socket listener for notifications
  useEffect(() => {
    const apiBase = apiUrl.replace('/api', '') || 'http://localhost:4000';
    const socket = socketIO(apiBase, {
      auth: { token: typeof window !== 'undefined' ? localStorage.getItem('vasavi-token') || '' : '' },
    });
    socket.on('connect', () => socket.emit('join', 'authenticated'));

    // Refresh on any real-time event
    const refresh = () => { mutate(); globalMutate('/notifications'); };
    socket.on('billing:updated', refresh);
    socket.on('appointment:created', refresh);
    socket.on('patient:admitted', refresh);
    socket.on('lab:completed', refresh);
    socket.on('emergency:status-updated', refresh);
    socket.on('pharmacy:dispensed', refresh);
    // Direct notification events from backend
    socket.on('notification:new', refresh);
    socket.on('notifications:updated', refresh);
    socket.on('notification:cleared', refresh);

    return () => { socket.disconnect(); };
  }, [mutate]);

  // Close panel on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [open]);

  const markRead = async (id: string) => {
    await fetch(`${apiUrl}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${localStorage.getItem('vasavi-token') || ''}` },
    });
    mutate();
    globalMutate('/notifications/unread');
  };

  const deleteNotif = async (id: string) => {
    await fetch(`${apiUrl}/notifications/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('vasavi-token') || ''}` },
    });
    mutate();
    globalMutate('/notifications/unread');
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        aria-label="Notifications"
        onClick={() => setOpen(!open)}
        className="relative grid size-10 place-items-center rounded-full bg-slate-100 transition hover:bg-slate-200"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <h3 className="font-poppins text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
                <Bell size={24} className="text-slate-300" />
                <p className="text-sm text-slate-400">No notifications yet</p>
                <p className="text-xs text-slate-300">You&apos;ll see updates here when something happens.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`group relative border-b border-slate-50 px-5 py-3.5 transition hover:bg-slate-50 ${!n.readAt ? 'bg-primary/[0.03]' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${typeColors[n.type] || 'bg-slate-100 text-slate-500'}`}>
                      {typeIcons[n.type] || <Bell size={14} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-700">{n.title}</p>
                        <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{n.message}</p>
                      {!n.readAt && <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase text-primary">New</span>}
                    </div>
                  </div>
                  <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {!n.readAt && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                        className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary transition hover:bg-primary/20"
                        title="Mark as read"
                        aria-label="Mark as read"
                      >
                        <Bell size={10} />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                      className="grid size-6 place-items-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-red-100 hover:text-red-500"
                      title="Dismiss"
                      aria-label="Dismiss notification"
                    >
                      <X size={10} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <button
                onClick={async () => {
                  await fetch(`${apiUrl}/notifications/clear`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${localStorage.getItem('vasavi-token') || ''}` },
                  });
                  mutate();
                  globalMutate('/notifications/unread');
                }}
                className="text-xs font-medium text-slate-400 transition hover:text-red-500"
              >
                Clear all
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-primary transition hover:text-primary/80"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
