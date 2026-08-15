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
    <Card variant={variant} className={twMerge(clsx('flex flex-col justify-between', className))}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          {title}
        </span>
        {icon && <div className="text-primary">{icon}</div>}
      </div>

      <div className="my-3">
        <div className="text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
          {typeof value === 'number'
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
            : value}
        </div>
        {subtitle && <p className="text-xs text-on-surface-variant mt-1">{subtitle}</p>}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5 pt-2 border-t border-outline-variant/20 dark:border-white/[0.06] text-xs">
          {trend === 'up' && (
            <span className="inline-flex items-center gap-0.5 text-error font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              {trendLabel || 'Alta'}
            </span>
          )}
          {trend === 'down' && (
            <span className="inline-flex items-center gap-0.5 text-primary font-medium">
              <TrendingDown className="h-3.5 w-3.5" />
              {trendLabel || 'Redução'}
            </span>
          )}
          {trend === 'stable' && (
            <span className="inline-flex items-center gap-0.5 text-on-surface-variant font-medium">
              <Minus className="h-3.5 w-3.5" />
              {trendLabel || 'Estável'}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
