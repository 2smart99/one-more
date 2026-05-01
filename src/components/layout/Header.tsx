'use client';

interface HeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function Header({ title, subtitle, right }: HeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 pt-6 pb-4">
      <div>
        <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-t1">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-0.5 font-medium text-t2">{subtitle}</p>
        )}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}
