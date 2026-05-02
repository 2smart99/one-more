import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminClient();
    const formData = await req.formData();

    const user_id    = Number(formData.get('user_id'));
    const name       = String(formData.get('name') ?? '').trim();
    const muscle     = String(formData.get('muscle_group') ?? '').trim();
    const description = (formData.get('description') as string | null)?.trim() || null;
    const photoFile  = formData.get('photo') as File | null;

    if (!user_id || !name || !muscle) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 });
    }

    // Ensure user exists
    await admin.from('users').upsert({ tg_id: user_id });

    // Upload photo if provided
    let photo_url: string | null = null;
    if (photoFile && photoFile.size > 0) {
      const ext  = photoFile.name.split('.').pop() ?? 'jpg';
      const path = `${user_id}/${Date.now()}.${ext}`;
      const bytes = await photoFile.arrayBuffer();
      const { error: storageErr } = await admin.storage
        .from('exercise-photos')
        .upload(path, bytes, { contentType: photoFile.type, upsert: false });

      if (storageErr) {
        console.error('[exercises POST] storage upload error:', storageErr);
        // Don't fail — just skip photo
      } else {
        const { data: pub } = admin.storage.from('exercise-photos').getPublicUrl(path);
        photo_url = pub.publicUrl;
      }
    }

    const { data, error } = await admin
      .from('exercises')
      .insert({ user_id, name, muscle_group: muscle, description, photo_url, is_custom: true })
      .select()
      .single();

    if (error) {
      console.error('[exercises POST] insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[exercises POST] unexpected error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
