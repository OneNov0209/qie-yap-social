import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getQieBalance } from '@/lib/qie-chain';

const API_BASE = import.meta.env.VITE_API_BASE || "http://api.yap.onenov.xyz/api";

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

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      connecting: false,

      init: async () => {
      },

      connect: async () => {
        if (!window.ethereum) throw new Error("No wallet detected");
        set({ connecting: true });

        try {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          const address = (accounts as string[])[0];
          if (!address) throw new Error("No account");

          const res = await fetch(`${API_BASE}/profiles`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address }),
          });

          if (!res.ok) throw new Error("Failed to register/login");

          const profile = await res.json();
          const balance = await getQieBalance(address as `0x${string}`).catch(() => 0);

          set({
            user: {
              id: profile.id,
              address: profile.address,
              displayName: profile.display_name,
              bio: profile.bio || '',
              avatarSeed: profile.avatar_seed,
              badge: 'shrimp',
              isValidator: profile.is_validator || false,
              balance,
            },
            connecting: false,
          });

        } catch (error) {
          console.error("Connect error:", error);
          set({ connecting: false });
          throw error;
        }
      },

      disconnect: async () => {
        set({ user: null });
      },
    }),
    {
      name: 'qie-auth-storage',
    }
  )
);
