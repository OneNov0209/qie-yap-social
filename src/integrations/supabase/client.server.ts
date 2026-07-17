import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Fungsi ini hanya dipanggil di server-side (Vercel)
export function createSupabaseAdminClient() {
  // Vercel server hanya bisa membaca process.env, BUKAN import.meta.env
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[Supabase Admin] Missing credentials - Server client unavailable');
    // JANGAN throw error, cukup return null agar tidak crash
    return null;
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

// Export dengan Proxy yang aman
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop) {
    const client = createSupabaseAdminClient();
    if (!client) return undefined; // Cegah akses jika null
    return Reflect.get(client, prop);
  },
});
