import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

// PATCH: update default_sets, default_reps, default_weight or sort_order
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminClient();
    const body = await req.json();

    const { error } = await admin
      .from('routine_exercises')
      .update(body)
      .eq('id', params.id);

    if (error) {
      console.error('[routine-exercises PATCH] error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[routine-exercises PATCH] unexpected error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE: remove exercise from routine
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminClient();

    const { error } = await admin
      .from('routine_exercises')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('[routine-exercises DELETE] error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[routine-exercises DELETE] unexpected error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
