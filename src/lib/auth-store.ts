import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { getQieBalance } from '@/lib/qie-chain';

interface User {
  id: string;
  address: string;
  displayName: string;
  avatarSeed: string;
  badge: 'shrimp' | 'fish' | 'dolphin' | 'shark' | 'whale';
  isValidator: boolean;
  balance?: number;
}

interface AuthState {
  user: User | null;
  hydrated: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  hydrated: false,
  connecting: false,

  connect: async () => {
    // Cek ketersediaan wallet
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("No EVM wallet detected. Install MetaMask or the QIE wallet extension.");
    }
    set({ connecting: true });
    try {
      // Minta akun
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const address = accounts[0];
      if (!address) throw new Error("No account returned by wallet");

      // 1. Cek apakah user sudah ada di database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('address', address)
        .maybeSingle();

      if (error) throw error;

      // 2. Jika user belum ada, buat profil baru
      let userProfile = profile;
      if (!userProfile) {
        const newProfile = {
          address: address,
          display_name: address.slice(0, 6) + '...' + address.slice(-4),
          username: address.slice(0, 6) + '...' + address.slice(-4),
          avatar_seed: address,
          is_validator: false,
        };

        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (insertError) throw insertError;
        userProfile = inserted;
      }

      // 3. Set user ke state
      const balance = await getQieBalance(address as `0x${string}`).catch(() => 0);
      set({
        user: {
          id: userProfile.id,
          address: userProfile.address,
          displayName: userProfile.display_name,
          avatarSeed: userProfile.avatar_seed,
          badge: 'shrimp',
          isValidator: userProfile.is_validator,
          balance,
        },
        hydrated: true,
        connecting: false,
      });
    } catch (error) {
      console.error('Connect error:', error);
      set({ connecting: false });
      throw error;
    }
  },

  disconnect: async () => {
    await supabase.auth.signOut();
    set({ user: null, hydrated: true });
  },

  refreshBalance: async () => {
    const { user } = get();
    if (!user) return;
    const balance = await getQieBalance(user.address as `0x${string}`).catch(() => 0);
    set({ user: { ...user, balance } });
  },
}));
