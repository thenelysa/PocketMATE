import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-gradient-to-r from-[#078D88] to-[#19C4B6] text-white border-transparent',
    secondary: 'bg-[#DFF5F2] text-[#078D88] border-transparent',
    destructive: 'bg-[#FEE2E2] text-[#DC2626] border-transparent',
    outline: 'border border-[#D5ECEB] text-[#4B5D7A]',
    success: 'bg-[#DFF5F2] text-[#078D88] border-transparent',
    warning: 'bg-[#FEF3C7] text-[#D97706] border-transparent',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
