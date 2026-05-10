'use client';

type BadgeColor = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray' | 'accent';

interface BadgeProps {
  label: string;
  color?: BadgeColor;
}

const textColors: Record<BadgeColor, string> = {
  accent: 'text-accent',
  blue: 'text-accent',
  green: 'text-success',
  orange: 'text-warning',
  red: 'text-danger',
  purple: 'text-accent',
  gray: 'text-t2',
};

export function Badge({ label, color = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center bg-accent-light rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${textColors[color]}`}>
      {label}
    </span>
  );
}
