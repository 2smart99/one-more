'use client';

import { ActiveSet, SetType } from '@/types';
import { NumberInput } from '@/components/ui/NumberInput';
import { haptic } from '@/lib/telegram';

const SET_TYPES: { value: SetType; label: string; color: string }[] = [
  { value: 'Normal', label: 'N', color: 'bg-gray-100 text-text-secondary' },
  { value: 'Warmup', label: 'W', color: 'bg-orange-100 text-orange-500' },
  { value: 'Drop', label: 'D', color: 'bg-purple-100 text-purple-500' },
  { value: 'Failure', label: 'F', color: 'bg-red-100 text-red-500' },
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

export function SetRow({
  set,
  prevSet,
  onUpdateWeight,
  onUpdateReps,
  onUpdateType,
  onComplete,
  onRemove,
}: SetRowProps) {
  const typeInfo = SET_TYPES.find((t) => t.value === set.set_type) ?? SET_TYPES[0];

  function cycleType() {
    const idx = SET_TYPES.findIndex((t) => t.value === set.set_type);
    const next = SET_TYPES[(idx + 1) % SET_TYPES.length];
    onUpdateType(next.value);
    haptic('light');
  }

  return (
    <div
      className={`flex items-center gap-2 py-2 px-1 rounded-2xl transition-colors ${
        set.completed ? 'bg-success/10' : ''
      }`}
    >
      {/* Set number + type */}
      <div className="flex flex-col items-center gap-1 w-8 shrink-0">
        <span className="text-xs font-bold text-text-secondary">{set.set_number}</span>
        <button
          onClick={cycleType}
          className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${typeInfo.color}`}
        >
          {typeInfo.label}
        </button>
      </div>

      {/* Weight input */}
      <div className="flex-1">
        {prevSet && (
          <p className="text-[9px] text-text-secondary text-center mb-0.5 opacity-60">
            prev: {prevSet.weight}kg
          </p>
        )}
        <NumberInput
          value={set.weight}
          onChange={onUpdateWeight}
          step={2.5}
          suffix="kg"
          size="sm"
        />
      </div>

      {/* Reps input */}
      <div className="flex-1">
        {prevSet && (
          <p className="text-[9px] text-text-secondary text-center mb-0.5 opacity-60">
            prev: {prevSet.reps}rep
          </p>
        )}
        <NumberInput
          value={set.reps}
          onChange={onUpdateReps}
          step={1}
          suffix="rep"
          size="sm"
        />
      </div>

      {/* Complete button */}
      <button
        onClick={() => { onComplete(); haptic('medium'); }}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-soft transition-all active:scale-90 shrink-0 ${
          set.completed
            ? 'bg-success text-white shadow-[0_4px_12px_rgba(104,211,145,0.4)]'
            : 'bg-surface text-text-secondary'
        }`}
      >
        ✓
      </button>

      {/* Remove */}
      <button
        onClick={() => { onRemove(); haptic('light'); }}
        className="w-8 h-8 rounded-full flex items-center justify-center text-danger/60 hover:bg-danger/10 transition-all shrink-0"
      >
        ×
      </button>
    </div>
  );
}
