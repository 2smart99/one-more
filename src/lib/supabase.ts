import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.error('Supabase config missing: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
      throw new Error('Supabase environment variables not configured. Check your .env file or Railway variables.');
    }

    _client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

// Export the client directly — no Proxy
export const supabase = getClient();

export async function setUserContext(tgId: number) {
  await getClient().rpc('set_config', {
    setting: 'app.user_id',
    value: tgId.toString(),
    is_local: true,
  });
}
