import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-600/20',
  inactive: 'bg-gray-500/10 text-gray-600 ring-1 ring-inset ring-gray-600/20',
  banned: 'bg-red-500/10 text-red-600 ring-1 ring-inset ring-red-600/20',
  pending: 'bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-600/20',
  resolved: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-600/20',
  dismissed: 'bg-gray-500/10 text-gray-600 ring-1 ring-inset ring-gray-600/20',
  warning: 'bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-600/20',
  critical: 'bg-red-500/10 text-red-600 ring-1 ring-inset ring-red-600/20',
  info: 'bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-600/20',
  published: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-600/20',
  draft: 'bg-gray-500/10 text-gray-600 ring-1 ring-inset ring-gray-600/20',
  scheduled: 'bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-600/20',
  admin: 'bg-violet-500/10 text-violet-600 ring-1 ring-inset ring-violet-600/20',
  moderator: 'bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-600/20',
  user: 'bg-gray-500/10 text-gray-600 ring-1 ring-inset ring-gray-600/20',
  super_admin: 'bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-600/20',
  flagged: 'bg-red-500/10 text-red-600 ring-1 ring-inset ring-red-600/20',
  clean: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-600/20',
  removed: 'bg-gray-500/10 text-gray-600 ring-1 ring-inset ring-gray-600/20',
  create: 'bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-600/20',
  update: 'bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-600/20',
  delete: 'bg-red-500/10 text-red-600 ring-1 ring-inset ring-red-600/20',
};

const statusDot: Record<string, string> = {
  active: 'bg-emerald-500',
  inactive: 'bg-gray-400',
  banned: 'bg-red-500',
  pending: 'bg-amber-500',
  resolved: 'bg-emerald-500',
  dismissed: 'bg-gray-400',
  online: 'bg-emerald-500',
  offline: 'bg-gray-400',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, className, showDot }: StatusBadgeProps) {
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  return (
    <Badge
      variant="outline"
      className={cn(
        'border-0 font-medium px-2.5 py-0.5',
        statusStyles[status] ?? 'bg-gray-500/10 text-gray-600',
        className,
      )}
    >
      {showDot && (
        <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', statusDot[status] ?? 'bg-gray-400')} />
      )}
      {label}
    </Badge>
  );
}
