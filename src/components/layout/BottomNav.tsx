'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/workout', label: 'Workout', icon: '💪' },
  { href: '/history', label: 'Progress', icon: '📈' },
  { href: '/exercises', label: 'Esercizi', icon: '📋' },
  { href: '/routines', label: 'Schede', icon: '🗓' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/80 backdrop-blur-glass border-t border-white/60 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="flex items-stretch h-16 max-w-lg mx-auto">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all ${
                active ? 'text-accent' : 'text-text-secondary'
              }`}
            >
              <span className={`text-xl transition-transform ${active ? 'scale-110' : ''}`}>{icon}</span>
              <span className={`text-[10px] font-semibold ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
