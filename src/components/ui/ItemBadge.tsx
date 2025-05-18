
import React from 'react';
import { cn } from '@/lib/utils';

interface ItemBadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'blue' | 'green' | 'red';
}

export const ItemBadge: React.FC<ItemBadgeProps> = ({ 
  children, 
  className,
  variant = 'default'
}) => {
  return (
    <span 
      className={cn(
        "px-2 py-1 text-sm font-medium rounded-md inline-flex items-center",
        {
          'dark:bg-primary/20 dark:text-primary light:bg-[#1EAEDB]/20 light:text-[#1EAEDB]': 
            variant === 'default',
          'dark:border dark:border-white/20 dark:text-white light:border light:border-gray-300 light:text-gray-700': 
            variant === 'outline',
          'dark:bg-blue-500/20 dark:text-blue-400 light:bg-blue-100 light:text-blue-700': 
            variant === 'blue',
          'dark:bg-green-500/20 dark:text-green-400 light:bg-green-100 light:text-green-700': 
            variant === 'green',
          'dark:bg-red-500/20 dark:text-red-400 light:bg-red-100 light:text-red-700': 
            variant === 'red',
        },
        className
      )}
    >
      {children}
    </span>
  );
};
