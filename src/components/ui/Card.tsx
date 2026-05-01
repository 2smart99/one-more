'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  glass?: boolean;
  onClick?: () => void;
  accent?: boolean;
}

export function Card({ children, className = '', glass = false, onClick, accent = false }: CardProps) {
  const base = glass
    ? 'glass-panel'
    : accent
    ? 'bg-accent text-white'
    : 'bg-surface border border-border';

  return (
    <div
      onClick={onClick}
      className={`rounded-card shadow-card p-5 ${base} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
