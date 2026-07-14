import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      {icon && <div className="mb-4 text-text-muted/40">{icon}</div>}
      <h3 className="text-base font-medium text-text mb-1">{title}</h3>
      {description && <p className="text-sm text-text-muted mb-6">{description}</p>}
      {action}
    </div>
  );
}
