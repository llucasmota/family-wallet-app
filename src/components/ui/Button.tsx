import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        filled:
          'bg-primary text-primary-foreground hover:brightness-105 shadow-m3-1 hover:shadow-m3-2',
        tonal:
          'bg-primary-container text-primary-on-container hover:brightness-95',
        outlined:
          'border border-outline text-primary hover:bg-primary-container/20',
        text: 'text-primary hover:bg-primary-container/20',
        destructive:
          'bg-error text-error-foreground hover:brightness-105 shadow-m3-1',
      },
      size: {
        sm: 'h-9 px-3 text-xs rounded-m3-sm gap-1.5',
        md: 'h-11 px-5 text-sm rounded-m3-md gap-2',
        lg: 'h-13 px-6 text-base rounded-m3-lg gap-2.5',
        icon: 'h-10 w-10 rounded-m3-full p-2',
      },
    },
    defaultVariants: {
      variant: 'filled',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={twMerge(clsx(buttonVariants({ variant, size, className })))}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
