'use client';

type BadgeColor = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray' | 'accent';

interface BadgeProps {
  label: string;
  color?: BadgeColor;
}

const colors: Record<BadgeColor, string> = {
  accent: 'bg-accent-light text-accent',
  blue: 'bg-accent-light text-accent',
  green: 'bg-success/10 text-success',
  orange: 'bg-warning/10 text-warning',
  red: 'bg-danger/10 text-danger',
  purple: 'bg-accent-light text-accent',
  gray: 'bg-surface-2 text-t2',
};

export function Badge({ label, color = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold tracking-wide ${colors[color]}`}>
      {label}
    </span>
  );
}
