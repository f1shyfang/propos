import { getDealStatusLabel } from '@/lib/deal-utils';

export function DealStatusBadge({ status }: { status: string }) {
  return (
    <span className="pg-badge pg-badge-blue" style={{ fontSize: 10 }}>
      {getDealStatusLabel(status)}
    </span>
  );
}
