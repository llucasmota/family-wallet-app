import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cardVariants = cva(
  'rounded-m3-lg transition-all duration-300 ease-out transform-gpu',
  {
    variants: {
      variant: {
        elevated:
          // Light Mode: Clean subtle shadow and soft lift
          'bg-surface-container-low text-on-surface border border-outline-variant/20 shadow-m3-1 hover:shadow-m3-2 hover:-translate-y-0.5 ' +
          // Dark Mode: Rich slate surface + Neon Ambient Underglow on hover
          'dark:bg-[#1A1F1D] dark:text-[#DFE4DF] dark:border-none ' +
          'dark:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.6),0_4px_12px_-2px_rgba(0,0,0,0.4)] ' +
          'dark:hover:-translate-y-1 ' +
          'dark:hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8),0_8px_25px_rgba(46,125,94,0.3),0_0_20px_rgba(52,211,153,0.18)] ' +
          'dark:hover:ring-1 dark:hover:ring-emerald-400/20',

        filled:
          'bg-surface-container text-on-surface border-none ' +
          'dark:bg-[#161B19] dark:text-[#DFE4DF] hover:-translate-y-0.5 ' +
          'dark:hover:shadow-[0_12px_25px_-5px_rgba(46,125,94,0.2)]',

        outlined:
          'bg-surface text-on-surface border border-outline-variant/40 shadow-none ' +
          'dark:bg-[#141816] dark:border-white/[0.06] dark:text-[#DFE4DF] hover:-translate-y-0.5 ' +
          'dark:hover:border-emerald-400/30 dark:hover:shadow-[0_8px_20px_rgba(46,125,94,0.2)]',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'elevated',
      padding: 'md',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(clsx(cardVariants({ variant, padding, className })))}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
