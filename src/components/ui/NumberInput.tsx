'use client';

interface NumberInputProps {
  value: number;
  onChange: (val: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  size?: 'sm' | 'md';
}

export function NumberInput({ value, onChange, step = 1, min = 0, max = 9999, suffix, size = 'md' }: NumberInputProps) {
  const textSize = size === 'sm' ? 'text-base' : 'text-xl';

  return (
    <div className="flex items-center gap-1 bg-background rounded-xl px-2 py-1.5 border border-border">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:bg-white hover:shadow-card transition-all active:scale-90 font-bold text-base"
      >
        −
      </button>
      <div className="flex items-baseline gap-0.5 min-w-[3rem] justify-center">
        <span className={`${textSize} font-bold text-text-primary leading-none`}>
          {value % 1 === 0 ? value : value.toFixed(1)}
        </span>
        {suffix && <span className="text-xs text-text-muted font-medium">{suffix}</span>}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-accent hover:bg-white hover:shadow-card transition-all active:scale-90 font-bold text-base"
      >
        +
      </button>
    </div>
  );
}
