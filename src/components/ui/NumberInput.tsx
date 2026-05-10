'use client';

import { useState } from 'react';

interface NumberInputProps {
  value: number;
  onChange: (val: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  size?: 'sm' | 'md';
}

function formatValue(value: number) {
  if (value % 1 === 0) return String(value);
  if (value % 0.5 === 0) return value.toFixed(1);
  return value.toFixed(2);
}

export function NumberInput({ value, onChange, step = 1, min = 0, max = 9999, suffix, size = 'md' }: NumberInputProps) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState('');
  const textSize = size === 'sm' ? 'text-base' : 'text-xl';

  function startEdit() {
    setRaw(formatValue(value));
    setEditing(true);
  }

  function commitEdit() {
    const parsed = parseFloat(raw.replace(',', '.'));
    if (!isNaN(parsed)) {
      onChange(Math.min(max, Math.max(min, +parsed.toFixed(2))));
    }
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-1 bg-surface-2 rounded-xl px-2 py-1.5 border border-border">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-t2 hover:bg-surface transition-all active:scale-90 font-bold text-base"
      >
        -
      </button>

      <div className="flex items-baseline gap-0.5 min-w-[3rem] justify-center">
        {editing ? (
          <input
            type="number"
            inputMode="decimal"
            value={raw}
            autoFocus
            onChange={(e) => setRaw(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); }}
            className={`${textSize} font-bold text-t1 leading-none bg-transparent outline-none w-16 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          />
        ) : (
          <span
            onClick={startEdit}
            className={`${textSize} font-bold text-t1 leading-none cursor-text select-none`}
          >
            {formatValue(value)}
          </span>
        )}
        {suffix && <span className="text-xs text-t2 font-medium">{suffix}</span>}
      </div>

      <button
        type="button"
        onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-accent hover:bg-surface transition-all active:scale-90 font-bold text-base"
      >
        +
      </button>
    </div>
  );
}
