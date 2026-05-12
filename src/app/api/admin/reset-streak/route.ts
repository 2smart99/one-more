import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

// POST /api/admin/reset-streak
// Body: { user_id: number, secret: string }
// Cancella tutti i workout (e i relativi sets via CASCADE) dell'utente.
// Le schede, gli esercizi e i progressi rimangono intatti.
export async function POST(req: NextRequest) {
  try {
    const { user_id, secret } = await req.json();

    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user_id) {
      return NextResponse.json({ error: 'user_id obbligatorio' }, { status: 400 });
    }

    const admin = getAdminClient();

    const { count, error } = await admin
      .from('workouts')
      .delete({ count: 'exact' })
      .eq('user_id', user_id);

    if (error) {
      console.error('[reset-streak] error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, deleted_workouts: count });
  } catch (err) {
    console.error('[reset-streak] unexpected error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
