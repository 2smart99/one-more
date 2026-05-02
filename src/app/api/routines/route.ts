import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminClient();
    const { user_id, title, day_of_week } = await req.json();

    if (!user_id || !title?.trim()) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 });
    }

    await admin.from('users').upsert({ tg_id: user_id });

    const { data, error } = await admin
      .from('routines')
      .insert({ user_id, title: title.trim(), day_of_week: day_of_week ?? null })
      .select()
      .single();

    if (error) {
      console.error('[routines POST] insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[routines POST] unexpected error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
