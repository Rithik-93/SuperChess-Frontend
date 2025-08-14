import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  viewportClassName?: string;
}

export const ScrollArea = ({ className, viewportClassName, children, ...props }: ScrollAreaProps) => {
  return (
    <div className={cn('relative overflow-hidden', className)} {...props}>
      <div className={cn('h-full w-full overflow-auto pr-2', viewportClassName)}>{children}</div>
    </div>
  );
};


