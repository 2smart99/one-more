'use client';

import { ActiveSet, SetType } from '@/types';
import { NumberInput } from '@/components/ui/NumberInput';
import { haptic } from '@/lib/telegram';

// F = Fallimento (cedimento), D = Drop set, N = Normale, Ris = Riscaldamento
const SET_TYPES: { value: SetType; label: string; tooltip: string; active: string; inactive: string }[] = [
  { value: 'Normal',  label: 'N',   tooltip: 'Normale',        active: 'bg-surface-2 text-t1 border border-border', inactive: 'bg-surface-2 text-t2 border border-border' },
  { value: 'Warmup',  label: 'Ris', tooltip: 'Riscaldamento',  active: 'bg-warning text-white border-transparent',  inactive: 'bg-surface-2 text-t2 border border-border' },
  { value: 'Drop',    label: 'D',   tooltip: 'Drop set',       active: 'bg-accent text-accent-fg border-transparent', inactive: 'bg-surface-2 text-t2 border border-border' },
  { value: 'Failure', label: 'F',   tooltip: 'A cedimento',    active: 'bg-danger text-white border-transparent',   inactive: 'bg-surface-2 text-t2 border border-border' },
];

interface SetRowProps {
  set: ActiveSet;
  exerciseId: string;
  prevSet?: { weight: number; reps: number } | null;
  onUpdateWeight: (val: number) => void;
  onUpdateReps: (val: number) => void;
  onUpdateType: (val: SetType) => void;
  onComplete: () => void;
  onRemove: () => void;
}

export function SetRow({ set, prevSet, onUpdateWeight, onUpdateReps, onUpdateType, onComplete, onRemove }: SetRowProps) {
  const typeInfo = SET_TYPES.find((t) => t.value === set.set_type) ?? SET_TYPES[0];

  function cycleType() {
    const idx = SET_TYPES.findIndex((t) => t.value === set.set_type);
    onUpdateType(SET_TYPES[(idx + 1) % SET_TYPES.length].value);
    haptic('light');
  }

  return (
    <div className={`flex items-center gap-2 py-2 px-2 rounded-xl transition-colors ${set.completed ? 'bg-success/10' : ''}`}>
      {/* Set number + type badge */}
      <div className="flex flex-col items-center gap-1 w-9 shrink-0">
        <span className="text-[11px] font-bold text-t2">{set.set_number}</span>
        <button
          onClick={cycleType}
          title={`${typeInfo.tooltip} — tocca per cambiare tipo`}
          className={`w-8 h-7 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all ${
            set.set_type === 'Normal' ? typeInfo.inactive : typeInfo.active
          }`}
        >
          {typeInfo.label}
        </button>
      </div>

      {/* Weight */}
      <div className="flex-1">
        {prevSet && (
          <p className="text-[9px] text-t2 text-center mb-0.5 font-medium">prec: {prevSet.weight}kg</p>
        )}
        <NumberInput value={set.weight} onChange={onUpdateWeight} step={2.5} suffix="kg" size="sm" />
      </div>

      {/* Reps */}
      <div className="flex-1">
        {prevSet && (
          <p className="text-[9px] text-t2 text-center mb-0.5 font-medium">prec: {prevSet.reps}rep</p>
        )}
        <NumberInput value={set.reps} onChange={onUpdateReps} step={1} suffix="rep" size="sm" />
      </div>

      {/* Complete checkmark */}
      <button
        onClick={() => { onComplete(); haptic('medium'); }}
        title="Segna serie completata"
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 shrink-0 border ${
          set.completed
            ? 'bg-success text-white border-success'
            : 'bg-surface-2 border-border text-t2'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>

      {/* Remove */}
      <button
        onClick={() => { onRemove(); haptic('light'); }}
        title="Rimuovi serie"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-t2 hover:bg-danger/10 hover:text-danger transition-all shrink-0"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
