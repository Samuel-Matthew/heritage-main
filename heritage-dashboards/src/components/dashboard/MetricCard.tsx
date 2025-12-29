import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  className?: string;
}

export function MetricCard({ title, value, change, icon: Icon, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-2xl p-6 shadow-card border border-border/50 animate-fade-in',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-xl font-heading font-bold text-foreground">{value}</p>
          {change !== undefined && (
            <p
              className={cn(
                'text-sm font-medium flex items-center gap-1',
                change >= 0 ? 'text-success' : 'text-destructive'
              )}
            >
              <span>{change >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(change)}% from last month</span>
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl gradient-orange flex items-center justify-center">
          <Icon className="h-6 w-6 text-secondary-foreground" />
        </div>
      </div>
    </div>
  );
}
