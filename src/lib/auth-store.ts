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
    // Cek session aktif dari Supabase
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .maybeSingle();

      if (profile) {
        const balance = await getQieBalance(profile.address as `0x${string}`).catch(() => 0);
        set({
          user: {
            id: profile.id,
            address: profile.address,
            displayName: profile.display_name,
            bio: profile.bio || '',
            avatarSeed: profile.avatar_seed,
            badge: 'shrimp',
            isValidator: profile.is_validator,
            balance,
          },
        });
      }
    }
  },

  connect: async () => {
    if (!window.ethereum) throw new Error("No wallet detected");
    set({ connecting: true });

    try {
      // 1. Minta akun
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address = (accounts as string[])[0];
      if (!address) throw new Error("No account");

      // 2. Cek profil
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('address', address)
        .maybeSingle();

      if (error) throw error;

      let userProfile = profile;
      if (!userProfile) {
        // 3. Buat profil baru
        const newProfile = {
          address,
          display_name: address.slice(0, 6) + '...',
          username: address.slice(0, 6) + '...',
          avatar_seed: address,
          is_validator: false,
        };

        const { data: inserted } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        userProfile = inserted;
      }

      const balance = await getQieBalance(address as `0x${string}`).catch(() => 0);

      set({
        user: {
          id: userProfile.id,
          address: userProfile.address,
          displayName: userProfile.display_name,
          bio: userProfile.bio || '',
          avatarSeed: userProfile.avatar_seed,
          badge: 'shrimp',
          isValidator: userProfile.is_validator,
          balance,
        },
        connecting: false,
      });
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
