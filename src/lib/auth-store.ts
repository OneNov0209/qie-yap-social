import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  hydrated: boolean;
  connecting: boolean;
  init: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  refreshProfile: () => Promise<void>; 
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  hydrated: false,
  connecting: false,

  init: async () => {
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
          hydrated: true,
        });
      }
    } else {
      set({ hydrated: true });
    }
  },

  connect: async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("No EVM wallet detected. Install MetaMask or the QIE wallet extension.");
    }
    set({ connecting: true });
    try {
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const address = accounts[0];
      if (!address) throw new Error("No account returned by wallet");

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('address', address)
        .maybeSingle();

      if (error) throw error;

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

  // --- FUNGSI BARU: Refresh Profile setelah diedit ---
  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, bio, avatar_seed')
      .eq('id', user.id)
      .single();

    if (profile) {
      set({
        user: {
          ...user,
          displayName: profile.display_name,
          bio: profile.bio || '',
          avatarSeed: profile.avatar_seed,
        }
      });
    }
  },
}));
