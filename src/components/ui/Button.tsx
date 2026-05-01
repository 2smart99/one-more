'use client';

import { ReactNode, ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg hover:opacity-90 active:opacity-80',
  secondary: 'bg-surface-2 text-t1 border border-border hover:opacity-80',
  ghost: 'text-t2 hover:bg-surface-2',
  danger: 'bg-danger/10 text-danger hover:bg-danger/20',
  dark: 'bg-t1 text-bg hover:opacity-80',
};

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-3 text-sm',
  lg: 'px-6 py-4 text-base',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        rounded-xl font-semibold transition-all duration-150 active:scale-[0.97]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {children}
        </span>
      ) : children}
    </button>
  );
}
