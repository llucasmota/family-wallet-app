import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const badgeVariants = cva(
  'inline-flex items-center px-2.5 py-0.5 rounded-m3-full text-xs font-semibold tracking-wide transition-colors',
  {
    variants: {
      variant: {
        paid: 'bg-primary-container text-primary-on-container',
        pending: 'bg-surface-container-highest text-on-surface-variant',
        error: 'bg-error-container text-error-on-container',
        mint: 'bg-primary-container/80 text-primary-on-container border border-primary/20',
        outline: 'border border-outline text-on-surface-variant',
      },
    },
    defaultVariants: {
      variant: 'pending',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge: React.FC<BadgeProps> = ({ className, variant, ...props }) => {
  return (
    <span className={twMerge(clsx(badgeVariants({ variant, className })))} {...props} />
  );
};
