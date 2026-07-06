import { AuditLogViewer } from './audit-log-viewer';

export const metadata = {
  title: 'Audit Log - Vasavi Hospital',
  description: 'View system audit trail for all hospital operations',
};

export default function AuditLogPage() {
  return <AuditLogViewer />;
}
