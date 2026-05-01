'use client';

import { ActiveSet, SetType } from '@/types';
import { NumberInput } from '@/components/ui/NumberInput';
import { haptic } from '@/lib/telegram';

const SET_TYPES: { value: SetType; label: string; active: string; inactive: string }[] = [
  { value: 'Normal', label: 'N', active: 'bg-accent text-accent-fg', inactive: 'bg-surface-2 text-t2' },
  { value: 'Warmup', label: 'W', active: 'bg-warning text-white', inactive: 'bg-surface-2 text-t2' },
  { value: 'Drop', label: 'D', active: 'bg-accent text-accent-fg', inactive: 'bg-surface-2 text-t2' },
  { value: 'Failure', label: 'F', active: 'bg-danger text-white', inactive: 'bg-surface-2 text-t2' },
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
      <div className="flex flex-col items-center gap-1 w-8 shrink-0">
        <span className="text-[11px] font-bold text-t2">{set.set_number}</span>
        <button
          onClick={cycleType}
          className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all ${
            set.set_type === 'Normal' ? typeInfo.inactive : typeInfo.active
          }`}
        >
          {typeInfo.label}
        </button>
      </div>

      <div className="flex-1">
        {prevSet && (
          <p className="text-[9px] text-t2 text-center mb-0.5 font-medium">prev: {prevSet.weight}kg</p>
        )}
        <NumberInput value={set.weight} onChange={onUpdateWeight} step={2.5} suffix="kg" size="sm" />
      </div>

      <div className="flex-1">
        {prevSet && (
          <p className="text-[9px] text-t2 text-center mb-0.5 font-medium">prev: {prevSet.reps}rep</p>
        )}
        <NumberInput value={set.reps} onChange={onUpdateReps} step={1} suffix="rep" size="sm" />
      </div>

      <button
        onClick={() => { onComplete(); haptic('medium'); }}
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold transition-all active:scale-90 shrink-0 border ${
          set.completed
            ? 'bg-success text-white border-success'
            : 'bg-surface-2 border-border text-t2'
        }`}
      >
        v
      </button>

      <button
        onClick={() => { onRemove(); haptic('light'); }}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-t2 hover:bg-danger/10 hover:text-danger transition-all shrink-0 text-sm"
      >
        x
      </button>
    </div>
  );
}
