import { createClient } from '@supabase/supabase-js';

export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');

  // Validate URL format
  try {
    new URL(url);
  } catch {
    throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL: "${url}". Must be a valid URL.`);
  }

  // Use service role key when available (bypasses RLS), otherwise fall back to
  // anon key — works after migration.sql has been run (permissive policies + GRANTs)
  const key = serviceKey || anonKey;
  if (!key) throw new Error('Missing Supabase API key (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)');

  if (!serviceKey) {
    console.warn('[supabase-admin] SUPABASE_SERVICE_ROLE_KEY not set — falling back to anon key. Run database/migration.sql to ensure permissive RLS policies are in place.');
  }

  return createClient(url, key, { auth: { persistSession: false } });
}
