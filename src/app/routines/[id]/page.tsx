'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { supabase } from '@/lib/supabase';
import { Exercise, MuscleGroup, Routine, RoutineExercise, MUSCLE_LABELS } from '@/types';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { NumberInput } from '@/components/ui/NumberInput';
import { haptic } from '@/lib/telegram';

const MUSCLES: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
const MUSCLE_COLORS: Record<string, 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray'> = {
  Chest: 'blue', Back: 'green', Legs: 'orange', Shoulders: 'purple', Arms: 'red', Core: 'gray',
};

type RoutineExWithExercise = RoutineExercise & { exercise: Exercise };
type PickerTab = 'browse' | 'create';

export default function RoutineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useTelegram();
  const router = useRouter();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [routineExercises, setRoutineExercises] = useState<RoutineExWithExercise[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showSheet, setShowSheet] = useState(false);
  const [pickerTab, setPickerTab] = useState<PickerTab>('browse');
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | 'All'>('All');
  const [searchEx, setSearchEx] = useState('');

  // Inline create-exercise form state
  const [newExName, setNewExName] = useState('');
  const [newExDesc, setNewExDesc] = useState('');
  const [newExMuscle, setNewExMuscle] = useState<MuscleGroup>('Chest');
  const [newExReps, setNewExReps] = useState(10);
  const [newExSets, setNewExSets] = useState(3);
  const [newExWeight, setNewExWeight] = useState(0);
  const [newExPhoto, setNewExPhoto] = useState<File | null>(null);
  const [newExPhotoPreview, setNewExPhotoPreview] = useState<string | null>(null);
  const [creatingEx, setCreatingEx] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const newExFileRef = useRef<HTMLInputElement>(null);

  // Progress debounce
  const progressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id || !user?.id) return;
    setLoadError(null);
    Promise.all([
      Promise.resolve(supabase.from('routines').select('*').eq('id', id).single()),
      Promise.resolve(supabase.from('routine_exercises').select('*, exercise:exercises(*)').eq('routine_id', id).order('sort_order')),
      Promise.resolve(supabase.from('exercises').select('*').or(`user_id.is.null,user_id.eq.${user.id}`).order('name')),
    ]).then(([routineRes, reRes, exRes]) => {
      if (routineRes.error) {
        console.error('[routine load] routines:', routineRes.error);
        setLoadError(`Errore caricamento scheda: ${routineRes.error.message}`);
      }
      if (reRes.error) console.error('[routine load] routine_exercises:', reRes.error);
      if (exRes.error) console.error('[routine load] exercises:', exRes.error);

      setRoutine(routineRes.data);
      setRoutineExercises((reRes.data ?? []) as RoutineExWithExercise[]);
      setAllExercises(exRes.data ?? []);
    }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[routine load] unexpected error:', err);
      setLoadError(`Errore caricamento scheda: ${msg}`);
    });
  }, [id, user?.id]);

  // ─── Progress logging ───────────────────────────────────────────────────────
  const logWeightProgress = useCallback(
    (exercise_id: string, weight: number, reps: number, sets: number) => {
      if (!user?.id || weight <= 0) return;
      if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
      progressTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, exercise_id, weight, reps, sets }),
          });
          if (!res.ok) {
            const json = await res.json();
            console.error('[logWeightProgress]', json);
          }
        } catch (err) {
          console.error('[logWeightProgress] network error:', err);
        }
      }, 800);
    },
    [user?.id]
  );

  // ─── Add exercise from list ─────────────────────────────────────────────────
  async function addExerciseToRoutine(exercise: Exercise) {
    const nextOrder = routineExercises.length;
    try {
      const res = await fetch('/api/routine-exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routine_id: id, exercise_id: exercise.id, sort_order: nextOrder }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error('[addExercise] API error:', json);
        return;
      }
      setRoutineExercises((prev) => [...prev, json.data as RoutineExWithExercise]);
      haptic('medium');
    } catch (err) {
      console.error('[addExercise] network error:', err);
    }
    setShowSheet(false);
  }

  // ─── Create new exercise and add to routine ─────────────────────────────────
  async function createAndAddExercise() {
    if (!newExName.trim() || !user?.id) return;
    setCreatingEx(true);
    setCreateError(null);
    try {
      // 1. Create exercise
      const formData = new FormData();
      formData.append('user_id', String(user.id));
      formData.append('name', newExName.trim());
      formData.append('muscle_group', newExMuscle);
      if (newExDesc.trim()) formData.append('description', newExDesc.trim());
      if (newExPhoto) formData.append('photo', newExPhoto);

      const exRes = await fetch('/api/exercises', { method: 'POST', body: formData });
      const exJson = await exRes.json();
      if (!exRes.ok) {
        console.error('[createAndAdd] create exercise error:', exJson);
        throw new Error(exJson.error ?? 'Errore creazione esercizio');
      }
      const newExercise = exJson.data as Exercise;

      // 2. Add to routine with chosen defaults
      const nextOrder = routineExercises.length;
      const reRes = await fetch('/api/routine-exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routine_id: id,
          exercise_id: newExercise.id,
          sort_order: nextOrder,
          default_sets: newExSets,
          default_reps: newExReps,
          default_weight: newExWeight,
        }),
      });
      const reJson = await reRes.json();
      if (!reRes.ok) {
        console.error('[createAndAdd] add to routine error:', reJson);
        throw new Error(reJson.error ?? 'Errore aggiunta alla scheda');
      }

      setRoutineExercises((prev) => [...prev, reJson.data as RoutineExWithExercise]);
      setAllExercises((prev) => [...prev, newExercise]);

      // Reset form
      setNewExName(''); setNewExDesc(''); setNewExMuscle('Chest');
      setNewExReps(10); setNewExSets(3); setNewExWeight(0);
      setNewExPhoto(null); setNewExPhotoPreview(null);
      if (newExFileRef.current) newExFileRef.current.value = '';
      setPickerTab('browse');
      setShowSheet(false);
      haptic('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[createAndAdd]', err);
      setCreateError(msg);
    } finally {
      setCreatingEx(false);
    }
  }

  // ─── Remove exercise ────────────────────────────────────────────────────────
  async function removeExercise(reId: string) {
    try {
      const res = await fetch(`/api/routine-exercises/${reId}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        console.error('[removeExercise]', json);
        return;
      }
      setRoutineExercises((prev) => prev.filter((re) => re.id !== reId));
      haptic('light');
    } catch (err) {
      console.error('[removeExercise] network error:', err);
    }
  }

  // ─── Update defaults ────────────────────────────────────────────────────────
  async function updateDefaults(
    re: RoutineExWithExercise,
    field: 'default_sets' | 'default_reps' | 'default_weight',
    value: number
  ) {
    setRoutineExercises((prev) =>
      prev.map((r) => r.id === re.id ? { ...r, [field]: value } : r)
    );
    try {
      const res = await fetch(`/api/routine-exercises/${re.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        const json = await res.json();
        console.error('[updateDefaults]', json);
      }
    } catch (err) {
      console.error('[updateDefaults] network error:', err);
    }
    if (field === 'default_weight') {
      const cur = routineExercises.find((r) => r.id === re.id);
      logWeightProgress(re.exercise_id, value, cur?.default_reps ?? re.default_reps, cur?.default_sets ?? re.default_sets);
    }
  }

  // ─── Reorder ────────────────────────────────────────────────────────────────
  async function moveExercise(reId: string, direction: 'up' | 'down') {
    const idx = routineExercises.findIndex((re) => re.id === reId);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= routineExercises.length) return;
    const newList = [...routineExercises];
    [newList[idx], newList[newIdx]] = [newList[newIdx], newList[idx]];
    setRoutineExercises(newList);
    try {
      await Promise.all(
        newList.map((re, i) =>
          fetch(`/api/routine-exercises/${re.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sort_order: i }),
          })
        )
      );
    } catch (err) {
      console.error('[moveExercise]', err);
    }
    haptic('light');
  }

  // ─── Render: loading ────────────────────────────────────────────────────────
  if (!routine && !loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" style={{ background: 'var(--bg-primary)' }}>
        <p className="text-sm text-center" style={{ color: 'var(--danger)' }}>{loadError}</p>
        <button className="btn-secondary" onClick={() => router.back()}>Torna indietro</button>
      </div>
    );
  }

  const activeIds = new Set(routineExercises.map((re) => re.exercise_id));
  const filteredAll = allExercises.filter((e) => {
    const notAdded = !activeIds.has(e.id);
    const matchMuscle = filterMuscle === 'All' || e.muscle_group === filterMuscle;
    const matchSearch = e.name.toLowerCase().includes(searchEx.toLowerCase());
    return notAdded && matchMuscle && matchSearch;
  });

  return (
    <div className="min-h-screen pb-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="px-4 space-y-4">
        <Header
          title={routine!.title}
          subtitle={`${routineExercises.length} esercizi`}
          right={
            <button onClick={() => router.back()} className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Indietro
            </button>
          }
        />

        {routineExercises.length === 0 && (
          <div
            className="rounded-2xl border-2 border-dashed p-8 text-center"
            style={{ border: '2px dashed var(--border)', background: 'var(--bg-secondary)' }}
          >
            <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Nessun esercizio</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Aggiungi il primo esercizio a questa scheda
            </p>
          </div>
        )}

        <div className="space-y-3">
          {routineExercises.map((re, i) => (
            <Card key={re.id}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] font-semibold mb-0.5" style={{ color: 'var(--text-secondary)' }}>#{i + 1}</p>
                  <p className="font-extrabold text-base" style={{ color: 'var(--text-primary)' }}>{re.exercise.name}</p>
                  {re.exercise.description && (
                    <p className="text-xs mt-0.5 max-w-[200px] truncate" style={{ color: 'var(--text-secondary)' }}>
                      {re.exercise.description}
                    </p>
                  )}
                  <Badge label={MUSCLE_LABELS[re.exercise.muscle_group] ?? re.exercise.muscle_group} color={MUSCLE_COLORS[re.exercise.muscle_group] ?? 'gray'} />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveExercise(re.id, 'up')} disabled={i === 0}
                    className="w-7 h-7 flex items-center justify-center rounded-lg disabled:opacity-30"
                    style={{ color: 'var(--text-secondary)' }}>↑</button>
                  <button onClick={() => moveExercise(re.id, 'down')} disabled={i === routineExercises.length - 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg disabled:opacity-30"
                    style={{ color: 'var(--text-secondary)' }}>↓</button>
                  <button onClick={() => removeExercise(re.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg"
                    style={{ color: 'var(--danger)', opacity: 0.5 }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}>×</button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  Valori di partenza
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Serie</p>
                    <NumberInput value={re.default_sets} onChange={(v) => updateDefaults(re, 'default_sets', v)} step={1} min={1} max={10} size="sm" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Ripetizioni</p>
                    <NumberInput value={re.default_reps} onChange={(v) => updateDefaults(re, 'default_reps', v)} step={1} min={1} max={50} size="sm" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Peso</p>
                    <NumberInput value={re.default_weight} onChange={(v) => updateDefaults(re, 'default_weight', v)} step={2.5} suffix="kg" size="sm" />
                  </div>
                </div>
                {re.default_weight > 0 && (
                  <p className="text-[10px] text-center" style={{ color: 'var(--accent-primary)' }}>
                    Il peso viene salvato nei progressi
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>

        <Button fullWidth variant="secondary" onClick={() => { setPickerTab('browse'); setShowSheet(true); }}>
          + Aggiungi Esercizio
        </Button>
        <Button fullWidth size="lg" onClick={() => router.push(`/workout?routine=${id}`)}>
          Inizia con questa scheda
        </Button>
      </div>

      {/* ─── Exercise picker sheet ─── */}
      {showSheet && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={() => !creatingEx && setShowSheet(false)} />
          <div
            className="absolute bottom-0 left-0 right-0 flex flex-col animate-sheet-up"
            style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', maxHeight: '90vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--border)' }} />
            </div>

            {/* Header + close */}
            <div className="px-5 pt-1 pb-3 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                Aggiungi Esercizio
              </h2>
              <button onClick={() => !creatingEx && setShowSheet(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-lg"
                style={{ color: 'var(--text-secondary)' }}>×</button>
            </div>

            {/* Tabs */}
            <div className="px-5 pb-3 shrink-0">
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                {(['browse', 'create'] as PickerTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setPickerTab(tab)}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      background: pickerTab === tab ? 'var(--bg-secondary)' : 'transparent',
                      color: pickerTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                      boxShadow: pickerTab === tab ? 'var(--shadow-card)' : 'none',
                    }}
                  >
                    {tab === 'browse' ? 'Sfoglia lista' : 'Crea nuovo'}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Tab: Sfoglia ── */}
            {pickerTab === 'browse' && (
              <>
                <div className="px-5 pb-3 shrink-0">
                  <input
                    type="text" placeholder="Cerca..."
                    value={searchEx} onChange={(e) => setSearchEx(e.target.value)}
                    className="input mb-3" style={{ borderRadius: 'var(--radius-md)' }}
                  />
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {(['All', ...MUSCLES] as const).map((m) => (
                      <button key={m} onClick={() => setFilterMuscle(m)}
                        className={`chip shrink-0 ${filterMuscle === m ? 'chip-active' : ''}`}>
                        {m === 'All' ? 'Tutti' : MUSCLE_LABELS[m] ?? m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-2">
                  {filteredAll.map((ex) => (
                    <button key={ex.id} onClick={() => addExerciseToRoutine(ex)}
                      className="w-full flex items-center justify-between rounded-2xl px-4 py-3 text-left active:scale-[0.98] transition-all"
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{ex.name}</p>
                        {ex.description && (
                          <p className="text-xs truncate max-w-[220px]" style={{ color: 'var(--text-secondary)' }}>{ex.description}</p>
                        )}
                        <Badge label={ex.muscle_group} color={MUSCLE_COLORS[ex.muscle_group] ?? 'gray'} />
                      </div>
                      <span className="text-lg font-bold" style={{ color: 'var(--accent-primary)' }}>+</span>
                    </button>
                  ))}
                  {filteredAll.length === 0 && (
                    <p className="text-center text-sm py-8" style={{ color: 'var(--text-secondary)' }}>
                      Nessun esercizio disponibile
                    </p>
                  )}
                </div>
              </>
            )}

            {/* ── Tab: Crea nuovo ── */}
            {pickerTab === 'create' && (
              <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-4">

                {createError && (
                  <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: 'rgba(211,47,47,0.1)', color: 'var(--danger)' }}>
                    {createError}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="section-label block mb-2">Nome esercizio *</label>
                  <input type="text" placeholder="Es. Panca Piana"
                    value={newExName} onChange={(e) => setNewExName(e.target.value)}
                    disabled={creatingEx} autoFocus className="input disabled:opacity-50" />
                </div>

                {/* Description */}
                <div>
                  <label className="section-label block mb-2">Descrizione</label>
                  <textarea placeholder="Tecnica, note..."
                    value={newExDesc} onChange={(e) => setNewExDesc(e.target.value)}
                    disabled={creatingEx} rows={2}
                    className="input disabled:opacity-50 resize-none" style={{ borderRadius: 'var(--radius-sm)' }} />
                </div>

                {/* Muscle group */}
                <div>
                  <label className="section-label block mb-2">Gruppo muscolare</label>
                  <div className="flex flex-wrap gap-2">
                    {MUSCLES.map((m) => (
                      <button key={m} onClick={() => setNewExMuscle(m)} disabled={creatingEx}
                        className={`chip disabled:opacity-50 ${newExMuscle === m ? 'chip-active' : ''}`}>{m}</button>
                    ))}
                  </div>
                </div>

                {/* Defaults: sets / reps / weight */}
                <div>
                  <label className="section-label block mb-2">Valori per questa scheda</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Serie</p>
                      <NumberInput value={newExSets} onChange={setNewExSets} step={1} min={1} max={10} size="sm" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Rip.</p>
                      <NumberInput value={newExReps} onChange={setNewExReps} step={1} min={1} max={50} size="sm" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Peso</p>
                      <NumberInput value={newExWeight} onChange={setNewExWeight} step={2.5} suffix="kg" size="sm" />
                    </div>
                  </div>
                </div>

                {/* Photo */}
                <div>
                  <label className="section-label block mb-2">Foto (opzionale)</label>
                  <input ref={newExFileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > 5 * 1024 * 1024) { setCreateError('Foto troppo grande (max 5MB)'); return; }
                      setNewExPhoto(f);
                      setNewExPhotoPreview(URL.createObjectURL(f));
                    }} />
                  {newExPhotoPreview ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={newExPhotoPreview} alt="preview" className="w-full object-cover rounded-2xl" style={{ maxHeight: 120 }} />
                      <button
                        onClick={() => { setNewExPhoto(null); setNewExPhotoPreview(null); if (newExFileRef.current) newExFileRef.current.value = ''; }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ background: 'rgba(0,0,0,0.55)' }}>×</button>
                    </div>
                  ) : (
                    <button onClick={() => newExFileRef.current?.click()} disabled={creatingEx}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed text-sm font-semibold disabled:opacity-50"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Carica foto
                    </button>
                  )}
                </div>

                <button
                  className="btn-primary w-full disabled:opacity-50"
                  onClick={createAndAddExercise}
                  disabled={!newExName.trim() || creatingEx}
                >
                  {creatingEx ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Salvataggio...
                    </span>
                  ) : 'Crea e aggiungi alla scheda'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
