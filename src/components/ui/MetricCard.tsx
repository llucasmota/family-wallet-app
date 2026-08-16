import React from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendLabel?: string;
  icon?: React.ReactNode;
  variant?: 'elevated' | 'filled' | 'outlined';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  variant = 'elevated',
  className,
}) => {
  return (
    <Card variant={variant} className={twMerge(clsx('flex flex-col justify-between p-3.5 sm:p-5', className))}>
      <div className="flex items-start justify-between gap-1">
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-on-surface-variant line-clamp-1">
          {title}
        </span>
        {icon && <div className="text-primary shrink-0 scale-90 sm:scale-100">{icon}</div>}
      </div>

      <div className="my-1.5 sm:my-3">
        <div className="text-base font-bold tracking-tight text-on-surface sm:text-2xl truncate">
          {typeof value === 'number'
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
            : value}
        </div>
        {subtitle && <p className="text-[10px] sm:text-xs text-on-surface-variant mt-0.5 sm:mt-1 truncate">{subtitle}</p>}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5 pt-1.5 sm:pt-2 border-t border-outline-variant/20 dark:border-white/[0.06] text-[10px] sm:text-xs">
          {trend === 'up' && (
            <span className="inline-flex items-center gap-0.5 text-error font-medium truncate">
              <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              <span className="truncate">{trendLabel || 'Alta'}</span>
            </span>
          )}
          {trend === 'down' && (
            <span className="inline-flex items-center gap-0.5 text-primary font-medium truncate">
              <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              <span className="truncate">{trendLabel || 'Redução'}</span>
            </span>
          )}
          {trend === 'stable' && (
            <span className="inline-flex items-center gap-0.5 text-on-surface-variant font-medium truncate">
              <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              <span className="truncate">{trendLabel || 'Estável'}</span>
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
