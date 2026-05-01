import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function setUserContext(tgId: number) {
  await supabase.rpc('set_config', {
    setting: 'app.user_id',
    value: tgId.toString(),
    is_local: true,
  });
}
