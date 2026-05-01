'use client';

interface HeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  dark?: boolean;
}

export function Header({ title, subtitle, right, dark = false }: HeaderProps) {
  return (
    <div className={`flex items-center justify-between px-5 pt-6 pb-4 ${dark ? 'text-white' : ''}`}>
      <div>
        <h1 className={`text-2xl font-extrabold leading-tight tracking-tight ${dark ? 'text-white' : 'text-text-primary'}`}>
          {title}
        </h1>
        {subtitle && (
          <p className={`text-sm mt-0.5 font-medium ${dark ? 'text-blue-200' : 'text-text-secondary'}`}>
            {subtitle}
          </p>
        )}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}
