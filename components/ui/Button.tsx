'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

const variantStyles = {
  primary: 'bg-teal-700 text-white hover:bg-teal-800 shadow-sm',
  secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, isLoading = false, variant = 'primary', className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
