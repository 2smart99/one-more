'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  accent?: boolean;
}

export function Card({ children, className = '', onClick, accent = false }: CardProps) {
  const base = accent
    ? 'bg-accent text-accent-fg'
    : 'bg-surface border border-border';

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-5 ${base} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
