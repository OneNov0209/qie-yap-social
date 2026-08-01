import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getQieBalance } from '@/lib/qie-chain';

// Gunakan API_BASE dari environment variable
const API_BASE = import.meta.env.VITE_API_BASE || "https://api.yap.onenov.xyz/api";

export interface User {
  id: string;
  address: string;
  username?: string;
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
  connect: () => Promise<void>;
  disconnect: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      connecting: false,

      connect: async () => {
        if (typeof window === 'undefined' || !window.ethereum) {
          throw new Error('No wallet detected');
        }
        set({ connecting: true });

        try {
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts',
          });
          const address = (accounts as string[])[0];
          if (!address) throw new Error('No account');

          const res = await fetch(`${API_BASE}/profiles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address }),
          });

          if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`Failed to register/login: ${res.status} ${text}`);
          }

          const profile = await res.json();
          const balance = await getQieBalance(address as `0x${string}`).catch(() => 0);

          set({
            user: {
              id: profile.id,
              address: profile.address ?? address,
              username: profile.username,
              displayName: profile.display_name ?? profile.displayName ?? `${address.slice(0, 6)}…${address.slice(-4)}`,
              bio: profile.bio ?? '',
              avatarSeed: profile.avatar_seed ?? profile.avatarSeed ?? address,
              badge: 'shrimp',
              isValidator: Boolean(profile.is_validator ?? profile.isValidator),
              balance,
            },
            connecting: false,
          });
        } catch (error) {
          console.error('Connect error:', error);
          set({ connecting: false });
          throw error;
        }
      },

      disconnect: () => set({ user: null }),

      updateProfile: (updates) => {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, ...updates } });
      },
    }),
    {
      name: 'qie-auth-storage',
    }
  )
);
