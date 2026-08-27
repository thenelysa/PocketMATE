import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-gradient-to-r from-[#078D88] to-[#19C4B6] text-white hover:opacity-90 border-0': variant === 'default',
            'bg-[#DC2626] text-white hover:bg-[#DC2626]/90': variant === 'destructive',
            'border border-[#078D88] bg-[#F7F8F5] text-[#078D88] hover:bg-[#F1FAFA]': variant === 'outline',
            'bg-[#DFF5F2] text-[#078D88] hover:bg-[#DFF5F2]/80': variant === 'secondary',
            'hover:bg-[#F1FAFA] text-[#4B5D7A] hover:text-[#071936]': variant === 'ghost',
            'text-[#078D88] underline-offset-4 hover:underline': variant === 'link',
          },
          {
            'h-10 px-4 py-2': size === 'default',
            'h-9 rounded-md px-3': size === 'sm',
            'h-11 rounded-md px-8': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
