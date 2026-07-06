'use client';

import { Download, Filter, Search } from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';
import { PageTitle, TableCard } from '@/components/dashboard-content';
import { Spinner } from '@/components/spinner';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const fetcher = (path: string) =>
  fetch(`${apiUrl}${path}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('vasavi-token') || ''}` },
  }).then((res) => res.json());

export function AuditLogViewer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const params = new URLSearchParams();
  if (searchTerm) params.set('search', searchTerm);
  if (entityFilter) params.set('entity', entityFilter);
  if (actionFilter) params.set('action', actionFilter);
  params.set('page', String(page));
  params.set('limit', String(pageSize));

  const { data, error, isLoading } = useSWR(`/audit-logs?${params.toString()}`, fetcher, {
    refreshInterval: 30000,
  });

  const items = data?.items ?? [];
  const pagination = data?.pagination ?? { total: 0, page: 1, totalPages: 1 };

  const rows = items.map((log: any) => [
    new Date(log.createdAt).toLocaleString(),
    log.user?.name || 'System',
    log.action,
    log.entity,
    log.entityId?.slice(0, 8) || '—',
  ]);

  const exportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Timestamp,User,Action,Entity,Entity ID', ...rows.map((r: string[]) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', 'audit_log_export.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (error) {
    return (
      <div className="text-red-500">
        Failed to load audit logs. Make sure you have admin permissions.
      </div>
    );
  }

  return (
    <>
      <PageTitle title="Audit Log" text="Complete system activity trail for compliance and monitoring." />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          <input
            placeholder="Search audit logs..."
            className="w-full rounded-xl border-slate-200 bg-white py-2.5 pl-10 text-sm"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none text-slate-600"
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
        >
          <option value="">All entities</option>
          <option value="Patient">Patient</option>
          <option value="Appointment">Appointment</option>
          <option value="AppointmentRequest">Appointment Request</option>
          <option value="Doctor">Doctor</option>
          <option value="Invoice">Invoice</option>
          <option value="Medicine">Medicine</option>
          <option value="LabOrder">Lab Order</option>
          <option value="Staff">Staff</option>
          <option value="User">User</option>
          <option value="Bed">Bed</option>
          <option value="Admission">Admission</option>
          <option value="EmergencyCase">Emergency Case</option>
          <option value="DoctorSchedule">Doctor Schedule</option>
        </select>
        <select
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none text-slate-600"
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
        >
          <option value="">All actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="APPROVE">APPROVE</option>
          <option value="REJECT">REJECT</option>
          <option value="RESCHEDULE">RESCHEDULE</option>
        </select>
        <button className="btn-secondary !px-4 !py-2.5" onClick={exportCsv}>
          <Download size={15} /> Export
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <TableCard title="Activity Log" rows={rows} />
      )}

      <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm sm:flex-row">
        <span>
          Page {pagination.page} of {pagination.totalPages} ({pagination.total} total events)
        </span>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary !px-3 !py-2"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="min-w-16 text-center text-xs font-semibold text-slate-400">
            {page} / {pagination.totalPages}
          </span>
          <button
            className="btn-secondary !px-3 !py-2"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
