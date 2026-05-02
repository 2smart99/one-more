import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

// DELETE: delete a workout and all its sets (cascade)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminClient();
    const { user_id } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: 'user_id richiesto' }, { status: 400 });
    }

    // Verify ownership before deleting
    const { data: workout, error: fetchErr } = await admin
      .from('workouts')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user_id)
      .single();

    if (fetchErr || !workout) {
      return NextResponse.json({ error: 'Allenamento non trovato' }, { status: 404 });
    }

    // Delete workout (cascade deletes workout_sets via FK)
    const { error } = await admin
      .from('workouts')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user_id);

    if (error) {
      console.error('[workouts DELETE] error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[workouts DELETE] unexpected error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}