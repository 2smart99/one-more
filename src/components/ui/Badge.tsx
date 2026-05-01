'use client';

type BadgeColor = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';

interface BadgeProps {
  label: string;
  color?: BadgeColor;
}

const colors: Record<BadgeColor, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  orange: 'bg-orange-50 text-orange-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
  gray: 'bg-gray-100 text-gray-500',
};

export function Badge({ label, color = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold tracking-wide ${colors[color]}`}>
      {label}
    </span>
  );
}
