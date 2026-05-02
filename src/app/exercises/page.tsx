'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { supabase } from '@/lib/supabase';
import { Exercise, MuscleGroup } from '@/types';
import { haptic } from '@/lib/telegram';
import { useToast } from '@/hooks/useToast';

const MUSCLES: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

function MuscleIcon({ group }: { group: string }) {
  const cls = "w-5 h-5";
  switch (group) {
    case 'Chest':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5h11M6 12h12M6.5 17.5h11" /><circle cx="12" cy="12" r="9" /></svg>;
    case 'Back':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M4 6l8 4 8-4M4 18l8-4 8 4" /></svg>;
    case 'Legs':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3h8M10 3v10l-2 8M14 3v10l2 8" /></svg>;
    case 'Shoulders':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l2-6h8l2 6h4" /><path d="M6 12v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4" /></svg>;
    case 'Arms':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h12v4H6z" /><path d="M4 8h16v4H4z" /><path d="M6 12h12v4H6z" /></svg>;
    case 'Core':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" /></svg>;
    default:
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M8 12h8M12 8v8" /></svg>;
  }
}

export default function ExercisesPage() {
  const { user } = useTelegram();
  const { showToast, Toast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filter, setFilter] = useState<MuscleGroup | 'All'>('All');
  const [search, setSearch] = useState('');
  const [showSheet, setShowSheet] = useState(false);

  // Form state
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newMuscle, setNewMuscle] = useState<MuscleGroup>('Chest');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    supabase
      .from('exercises')
      .select('*')
      .or(`(user_id.is.null,user_id.eq.${user.id})`)
      .order('muscle_group')
      .order('name')
      .then(({ data, error }) => {
        if (error) {
          console.error('[exercises load]', error);
          setLoadError('Errore caricamento: ' + error.message);
        } else {
          setExercises(data ?? []);
          setLoadError(null);
        }
        setLoading(false);
      });
  }, [user?.id]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Foto troppo grande (max 5MB)', 'error');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function resetForm() {
    setNewName('');
    setNewDescription('');
    setNewMuscle('Chest');
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function createCustom() {
    if (!newName.trim() || !user?.id) {
      showToast("Inserisci un nome per l'esercizio", 'error');
      return;
    }
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('user_id', String(user.id));
      formData.append('name', newName.trim());
      formData.append('muscle_group', newMuscle);
      if (newDescription.trim()) formData.append('description', newDescription.trim());
      if (photoFile) formData.append('photo', photoFile);

      const res = await fetch('/api/exercises', { method: 'POST', body: formData });
      const json = await res.json();

      if (!res.ok) {
        console.error('[createCustom] API error:', json);
        throw new Error(json.error ?? 'Errore server');
      }

      setExercises((prev) => [...prev, json.data]);
      resetForm();
      setShowSheet(false);
      showToast('Esercizio creato ✓', 'success');
      haptic('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[createCustom] error:', err);
      showToast('Errore: ' + msg, 'error');
      haptic('error');
    } finally {
      setCreating(false);
    }
  }

  async function deleteCustom(id: string) {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/exercises/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (!res.ok) {
        const json = await res.json();
        console.error('[deleteCustom] error:', json);
        showToast('Errore eliminazione', 'error');
        return;
      }
      setExercises((prev) => prev.filter((e) => e.id !== id));
      haptic('light');
    } catch (err) {
      console.error('[deleteCustom] error:', err);
      showToast('Errore eliminazione', 'error');
    }
  }

  const filtered = exercises.filter((e) => {
    const matchMuscle = filter === 'All' || e.muscle_group === filter;
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    return matchMuscle && matchSearch;
  });

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--bg-primary)' }}>
      <Toast />

      {/* Header */}
      <div className="px-5 pt-8 pb-5 flex items-center justify-between">
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Esercizi
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {exercises.length} disponibili
          </p>
        </div>
        <button
          onClick={() => setShowSheet(true)}
          className="btn-icon"
          style={{
            background: 'var(--accent-primary)',
            color: 'var(--text-on-accent)',
            width: 44, height: 44, fontSize: 22, fontWeight: 700,
            boxShadow: 'var(--shadow-accent)',
          }}
        >
          +
        </button>
      </div>

      <div className="px-4 space-y-4 pb-8">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: 'var(--text-secondary)' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Cerca esercizio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-11"
            style={{ borderRadius: 'var(--radius-pill)' }}
          />
        </div>

        {/* Muscle filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {(['All', ...MUSCLES] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className={`chip shrink-0 ${filter === m ? 'chip-active' : ''}`}
            >
              {m === 'All' ? 'Tutti' : m}
            </button>
          ))}
        </div>

        {/* Exercise list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{ height: 64, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center justify-between group overflow-hidden"
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  borderLeft: '3px solid var(--accent-primary)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div className="flex items-center gap-3 px-4 py-3.5 flex-1 min-w-0">
                  {/* Photo or emoji icon */}
                  <div
                    className="w-10 h-10 flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ borderRadius: 'var(--radius-sm)' }}
                  >
                    {ex.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ex.photo_url}
                        alt={ex.name}
                        className="object-cover w-full h-full"
                        style={{ width: 40, height: 40 }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: 'rgba(191,0,0,0.08)', color: 'var(--accent-primary)' }}
                      >
                        <MuscleIcon group={ex.muscle_group} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {ex.name}
                    </p>
                    {ex.description ? (
                      <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                        {ex.description}
                      </p>
                    ) : (
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {ex.muscle_group}
                        {ex.is_custom && (
                          <span
                            className="ml-2 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(191,0,0,0.12)', color: 'var(--accent-primary)' }}
                          >
                            custom
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                {ex.is_custom && (
                  <button
                    onClick={() => deleteCustom(ex.id)}
                    className="pr-4 opacity-0 group-hover:opacity-100 transition-opacity text-xl"
                    style={{ color: 'var(--danger)' }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nessun esercizio trovato</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom sheet: nuovo esercizio */}
      {showSheet && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => !creating && (resetForm(), setShowSheet(false))}
          />
          <div
            className="absolute bottom-0 left-0 right-0 animate-sheet-up overflow-y-auto max-h-[92vh]"
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
              border: '1px solid var(--border)',
              borderBottom: 'none',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--border)' }} />
            </div>

            <div className="px-5 pb-10 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-xl" style={{ color: 'var(--text-primary)' }}>
                  Nuovo Esercizio
                </h2>
                <button
                  onClick={() => !creating && (resetForm(), setShowSheet(false))}
                  className="btn-icon"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="section-label block mb-2">Titolo esercizio *</label>
                <input
                  type="text"
                  placeholder="Es. Panca Piana"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  disabled={creating}
                  className="input disabled:opacity-50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="section-label block mb-2">Descrizione</label>
                <textarea
                  placeholder="Note, tecnica, consigli..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  disabled={creating}
                  rows={3}
                  className="input disabled:opacity-50 resize-none"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                />
              </div>

              {/* Muscle group */}
              <div>
                <label className="section-label block mb-2">Gruppo muscolare</label>
                <div className="flex flex-wrap gap-2">
                  {MUSCLES.map((m) => (
                    <button
                      key={m}
                      onClick={() => setNewMuscle(m)}
                      disabled={creating}
                      className={`chip disabled:opacity-50 ${newMuscle === m ? 'chip-active' : ''}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo upload */}
              <div>
                <label className="section-label block mb-2">Foto (opzionale)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                {photoPreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreview}
                      alt="preview"
                      className="w-full object-cover rounded-2xl"
                      style={{ maxHeight: 160 }}
                    />
                    <button
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: 'rgba(0,0,0,0.55)' }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={creating}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed text-sm font-semibold disabled:opacity-50"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Carica foto
                  </button>
                )}
              </div>

              <button
                className="btn-primary w-full disabled:opacity-50"
                onClick={createCustom}
                disabled={!newName.trim() || creating}
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Creazione...
                  </span>
                ) : 'Salva Esercizio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
