'use client';

type BadgeColor = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';

interface BadgeProps {
  label: string;
  color?: BadgeColor;
  icon?: string;
}

const colors: Record<BadgeColor, string> = {
  blue: 'bg-accent/15 text-accent-dark',
  green: 'bg-success/15 text-green-600',
  orange: 'bg-warning/15 text-orange-600',
  red: 'bg-danger/15 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
  gray: 'bg-gray-100 text-text-secondary',
};

export function Badge({ label, color = 'gray', icon }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-pill px-3 py-1 text-xs font-semibold ${colors[color]}`}>
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
}
