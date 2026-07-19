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

      // ✅ Ubah format email agar valid untuk Supabase
      const safeEmail = `wallet_${address.toLowerCase()}@qie.yap`;

      // 1. Coba login dulu
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: safeEmail,
        password: address,
      });

      if (loginData.session?.user) {
        await loadUserProfile(loginData.session.user.id);
        set({ connecting: false });
        return;
      }

      // 2. Jika login gagal, coba signup
      if (loginError && loginError.message.includes("Invalid login credentials")) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: safeEmail,
          password: address,
          options: {
            data: { wallet_address: address },
          },
        });

        if (signUpData.session?.user) {
          // Buat profil di tabel profiles
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: signUpData.session.user.id,
              address: address,
              display_name: address.slice(0, 6) + '...',
              username: address.slice(0, 6) + '...',
              avatar_seed: address,
              is_validator: false,
            });

          if (profileError) {
            console.error("Profile creation error:", profileError);
            // Jika gagal, load dari session
            await loadUserProfile(signUpData.session.user.id);
          } else {
            await loadUserProfile(signUpData.session.user.id);
          }
        } else if (signUpError) {
          throw signUpError;
        }
      }

      set({ connecting: false });
    } catch (error) {
      console.error("Connect error:", error);
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
  } else {
    console.warn("Profile not found for user:", userId);
  }
}
