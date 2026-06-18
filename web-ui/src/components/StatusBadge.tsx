// Maps challenge/outline status strings to a styled inline badge.
// Uses --status-* tokens from App.css, not raw Tailwind palette colors.
import { cn } from '@/lib/utils';

type Status = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'PENDING' | 'DONE' | 'PROCESSING' | 'DID_NOT_MEET';

const STATUS_MAP: Record<Status, { label: string; className: string }> = {
  ACTIVE:       { label: 'Active',        className: 'bg-[hsl(var(--status-active)/0.15)] text-[hsl(var(--status-active))]' },
  PAUSED:       { label: 'Paused',        className: 'bg-[hsl(var(--status-paused)/0.15)] text-[hsl(var(--status-paused))]' },
  COMPLETED:    { label: 'Completed',     className: 'bg-[hsl(var(--status-completed)/0.15)] text-[hsl(var(--status-completed))]' },
  CANCELLED:    { label: 'Cancelled',     className: 'bg-[hsl(var(--status-cancelled)/0.15)] text-[hsl(var(--status-cancelled))]' },
  PENDING:      { label: 'Pending',       className: 'bg-[hsl(var(--status-pending)/0.15)] text-[hsl(var(--status-pending))]' },
  DONE:         { label: 'Done',          className: 'bg-[hsl(var(--status-completed)/0.15)] text-[hsl(var(--status-completed))]' },
  PROCESSING:   { label: 'Processing',    className: 'bg-[hsl(var(--status-paused)/0.15)] text-[hsl(var(--status-paused))]' },
  DID_NOT_MEET: { label: 'Did not meet',  className: 'bg-[hsl(var(--status-cancelled)/0.15)] text-[hsl(var(--status-cancelled))]' },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = STATUS_MAP[status as Status] ?? { label: status, className: 'bg-muted text-muted-foreground' };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', config.className, className)}>
      {config.label}
    </span>
  );
}
