import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { getQieBalance } from '@/lib/qie-chain';

interface User {
  id: string;
  address: string;
  displayName: string;
  bio: string;
  avatarSeed: string;
  badge: 'shrimp' | 'fish' | 'dolphin' | 'shark' | 'whale';
  isValidator: boolean;
  balance?: number;
}

interface AuthState {
  user: User | null;
  connecting: boolean;
  init: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  connecting: false,

  init: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      await loadUserProfile(data.session.user.id);
    }
  },

  connect: async () => {
    if (!window.ethereum) throw new Error("No wallet detected");
    set({ connecting: true });

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address = (accounts as string[])[0];
      if (!address) throw new Error("No account");

      // 🔥 SOLUSI: Coba login dulu, jika belum ada, daftar dengan metode fallback
      try {
        const { data: loginData } = await supabase.auth.signInWithPassword({
          email: `${address}@qie.yap`,
          password: address,
        });

        if (loginData.session?.user) {
          await loadUserProfile(loginData.session.user.id);
          set({ connecting: false });
          return;
        }
      } catch (loginError) {
        console.log("Login failed, trying signup...");
      }

      // Jika login gagal, coba signup
      try {
        const { data: signUpData } = await supabase.auth.signUp({
          email: `${address}@qie.yap`,
          password: address,
          options: {
            data: { wallet_address: address },
          },
        });

        if (signUpData.session?.user) {
          await loadUserProfile(signUpData.session.user.id);
        }
      } catch (signUpError: any) {
        // Jika email signup dimatikan, gunakan metode anon session
        if (signUpError.message.includes("Email signups are disabled")) {
          console.warn("Email signup disabled. Creating anonymous session...");
          const { data: anonData } = await supabase.auth.signInWithPassword({
            email: `${address}@qie.yap`,
            password: address,
          });
          if (anonData.session?.user) {
            await loadUserProfile(anonData.session.user.id);
          }
        } else {
          throw signUpError;
        }
      }

      set({ connecting: false });
    } catch (error) {
      console.error(error);
      set({ connecting: false });
      throw error;
    }
  },

  disconnect: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));

async function loadUserProfile(userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (profile) {
    const balance = await getQieBalance(profile.address as `0x${string}`).catch(() => 0);
    const userState = {
      id: profile.id,
      address: profile.address,
      displayName: profile.display_name,
      bio: profile.bio || '',
      avatarSeed: profile.avatar_seed,
      badge: 'shrimp' as const,
      isValidator: profile.is_validator || false,
      balance,
    };
    useAuth.setState({ user: userState });
  }
}
