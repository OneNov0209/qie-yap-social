import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function createSupabaseAdminClient() {
  // Kita pakai VITE_SUPABASE_URL yang sudah pasti benar
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  // Kunci service_role untuk akses server
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[Supabase Admin] Missing credentials');
    return null; // Kembalikan null agar tidak crash
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

// Hanya export jika kunci ada (untuk mencegah error 403 di frontend)
export const supabaseAdmin = (() => {
  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
})();
