import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminClient();
    const { user_id, exercise_id, weight, reps, sets } = await req.json();

    if (!user_id || !exercise_id || weight === undefined) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('exercise_progress')
      .insert({ user_id, exercise_id, weight, reps: reps ?? null, sets: sets ?? null })
      .select()
      .single();

    if (error) {
      console.error('[progress POST] error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[progress POST] unexpected error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET: get progress history for an exercise
export async function GET(req: NextRequest) {
  try {
    const admin = getAdminClient();
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id');
    const exercise_id = searchParams.get('exercise_id');

    if (!user_id || !exercise_id) {
      return NextResponse.json({ error: 'user_id e exercise_id richiesti' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('exercise_progress')
      .select('*')
      .eq('user_id', user_id)
      .eq('exercise_id', exercise_id)
      .order('logged_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
