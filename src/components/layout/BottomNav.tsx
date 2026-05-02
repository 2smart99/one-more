'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  {
    href: '/',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.5' : '2'} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/routines',
    label: 'Schede',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.5' : '2'} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="15" y2="17" />
      </svg>
    ),
  },
  {
    href: '/exercises',
    label: 'Esercizi',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.5' : '2'} strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'Progressi',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.5' : '2'} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2">
      <div
        className="flex items-center h-16 px-2 max-w-lg mx-auto"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-pill)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        }}
      >
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-all"
            >
              {active ? (
                <span
                  className="flex flex-col items-center gap-1"
                  style={{
                    background: 'var(--accent-primary)',
                    color: 'var(--text-on-accent)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '6px 16px',
                  }}
                >
                  {icon(true)}
                  <span className="text-[10px] font-bold tracking-wide leading-none">{label}</span>
                </span>
              ) : (
                <span
                  className="flex flex-col items-center gap-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {icon(false)}
                  <span className="text-[10px] font-semibold tracking-wide leading-none">{label}</span>
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
