import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-white/20 bg-white/10 text-white',
        secondary: 'border-white/10 bg-white/5 text-white/80',
        success: 'border-emerald-400/30 bg-emerald-400/15 text-emerald-200',
        destructive: 'border-red-400/30 bg-red-400/15 text-red-200',
        warning: 'border-yellow-400/30 bg-yellow-400/15 text-yellow-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = ({ className, variant, ...props }: BadgeProps) => {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
};

export { Badge, badgeVariants };


