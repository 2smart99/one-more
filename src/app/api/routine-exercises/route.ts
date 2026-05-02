import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

// POST: add an exercise to a routine
export async function POST(req: NextRequest) {
  try {
    const admin = getAdminClient();
    const { routine_id, exercise_id, sort_order } = await req.json();

    if (!routine_id || !exercise_id) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('routine_exercises')
      .insert({ routine_id, exercise_id, sort_order: sort_order ?? 0 })
      .select('*, exercise:exercises(*)')
      .single();

    if (error) {
      console.error('[routine-exercises POST] error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[routine-exercises POST] unexpected error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
