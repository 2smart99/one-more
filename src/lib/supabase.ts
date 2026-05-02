import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      const msg = 'Supabase config missing: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set';
      console.error(msg);
      throw new Error(msg);
    }

    // Validate URL format to catch build-time placeholder values
    try {
      new URL(url);
    } catch {
      console.error('Invalid NEXT_PUBLIC_SUPABASE_URL:', url);
      throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL: "${url}". Must be a valid URL like https://xxxxx.supabase.co`);
    }

    _client = createClient(url, key);
  }
  return _client;
}

// Lazy proxy: the client is only created when first used (never at import time)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: string | symbol) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export async function setUserContext(tgId: number) {
  await getClient().rpc('set_config', {
    setting: 'app.user_id',
    value: tgId.toString(),
    is_local: true,
  });
}
