import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminClient();
    const { user_id } = await req.json();

    const { error } = await admin
      .from('routines')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user_id);

    if (error) {
      console.error('[routines DELETE] error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[routines DELETE] unexpected error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
