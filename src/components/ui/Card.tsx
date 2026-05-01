'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  glass?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', glass = false, onClick }: CardProps) {
  const base = glass
    ? 'bg-white/65 backdrop-blur-glass border border-white/40'
    : 'bg-surface';

  return (
    <div
      onClick={onClick}
      className={`rounded-card shadow-soft p-6 ${base} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
