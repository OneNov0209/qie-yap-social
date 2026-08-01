import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getQieBalance } from '@/lib/qie-chain';
import { API_BASE } from '@/lib/posts';

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
  setUser: (patch: Partial<User>) => void;
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

          // ✅ Pastikan address disimpan sebelum fetch
          const walletAddress = address;

          const res = await fetch(`${API_BASE}/profiles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: walletAddress }),
          });

          if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`Failed to register/login: ${res.status} ${text}`);
          }

          const profile = await res.json();
          const balance = await getQieBalance(walletAddress as `0x${string}`).catch(() => 0);

          const displayName = 
            profile.display_name || 
            profile.displayName || 
            `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;

          const avatarSeed = 
            profile.avatar_seed || 
            profile.avatarSeed || 
            walletAddress;

          set({
            user: {
              id: profile.id,
              address: walletAddress,
              username: profile.username,
              displayName: displayName,
              bio: profile.bio ?? '',
              avatarSeed: avatarSeed,
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

      setUser: (patch) => {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, ...patch } });
      },
    }),
    {
      name: 'qie-auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
