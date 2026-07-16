import { createMiddleware } from '@tanstack/react-start'
import { supabase } from './client'

export const attachSupabaseAuth = createMiddleware({ type: 'function' }).client(
  async ({ next }) => {
    try {
      // Coba ambil session yang valid
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      
      // Jika tidak ada token, coba refresh session (mencegah expired token)
      if (!token && data.session?.refresh_token) {
        const { data: refreshData } = await supabase.auth.refreshSession();
        const newToken = refreshData.session?.access_token;
        return next({
          headers: newToken ? { Authorization: `Bearer ${newToken}` } : {},
        });
      }

      return next({
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (error) {
      console.warn('[Auth Attacher] Failed to attach auth token', error);
      return next({ headers: {} });
    }
  },
)
