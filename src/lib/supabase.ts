import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase env vars missing. Cloud sync will be disabled. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local'
  );
}

/**
 * Supabase client. Returns null if credentials are missing so the rest of the
 * app can gracefully degrade to local-only mode.
 */
export const supabase = url && key
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'moar-auth',
      },
    })
  : null;

export const isCloudEnabled = supabase !== null;
