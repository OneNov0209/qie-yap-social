import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getQieBalance } from '@/lib/qie-chain';
import { getReferredBy, clearReferralFromUrl, generateRegisterMessage } from '@/lib/posts';

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
  connectStep: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  updateProfile: (updates: Partial<User>) => void;
  signMessage: (args: { message: string }) => Promise<string>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      connecting: false,
      connectStep: null,

      connect: async () => {
        if (typeof window === 'undefined' || !window.ethereum) {
          throw new Error('QIE Wallet extension not detected. Please install QIE Wallet or use a supported browser.');
        }
        set({ connecting: true, connectStep: 'Connecting wallet...' });

        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const address = (accounts as string[])[0];
          if (!address) throw new Error('No accounts found in QIE Wallet.');

          set({ connectStep: 'Checking profile...' });

          const referredBy = getReferredBy();

          const checkRes = await fetch(`${API_BASE}/profiles/${address}`);
          const isExistingUser = checkRes.ok;

          let profile: any;

          if (isExistingUser) {
            profile = await checkRes.json();
            console.log("✅ Existing user:", address.slice(0, 10) + "...");
          } else {
            console.log("🆕 New user, requesting signature...");
            set({ connectStep: 'Please sign in your wallet...' });

            const message = generateRegisterMessage(address);

            let signature: string;
            try {
              signature = await window.ethereum.request({
                method: 'personal_sign',
                params: [message, address],
              }) as string;
            } catch (signError: any) {
              if (signError?.code === 4001) {
                throw new Error('Signature required for registration. Please approve the signature in your wallet.');
              }
              throw new Error('Failed to sign message: ' + (signError.message || 'Unknown error'));
            }

            if (!signature) throw new Error('Invalid signature.');

            set({ connectStep: 'Registering...' });

            const res = await fetch(`${API_BASE}/profiles`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                address,
                referred_by: referredBy || null,
                signature,
                message,
              }),
            });

            if (!res.ok) {
              const data = await res.json().catch(() => ({ error: 'Unknown error' }));
              throw new Error(data.error || `Registration failed: ${res.status}`);
            }

            profile = await res.json();
            console.log("✅ Registered:", profile.id);
          }

          if (referredBy) clearReferralFromUrl();

          const displayName = profile.display_name || `${address.slice(0, 6)}…${address.slice(-4)}`;
          const username = profile.username || address.slice(0, 8);

          const userData: User = {
            id: profile.id,
            address: profile.address ?? address,
            username,
            displayName,
            bio: profile.bio ?? '',
            avatarSeed: profile.avatar_seed ?? address,
            badge: 'shrimp',
            isValidator: Boolean(profile.is_validator),
            balance: 0,
          };

          set({ user: userData, connecting: false, connectStep: null });
          console.log("✅ User logged in");

          getQieBalance(address as `0x${string}`)
            .then((balance) => {
              const current = get().user;
              if (current && current.address === address) {
                set({ user: { ...current, balance } });
              }
            })
            .catch(() => { /* ignore */ });

        } catch (error) {
          console.error('Connect error:', error);
          set({ connecting: false, connectStep: null });
          throw error;
        }
      },

      disconnect: () => set({ user: null, connecting: false, connectStep: null }),

      updateProfile: (updates) => {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, ...updates } });
      },

      // ✅ Tambahan fungsi baru untuk meminta signature dompet
      signMessage: async ({ message }) => {
        if (typeof window === 'undefined' || !window.ethereum) {
          throw new Error('QIE Wallet not detected.');
        }
        const currentUser = get().user;
        if (!currentUser) {
          throw new Error('Please connect your wallet first.');
        }
        try {
          const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, currentUser.address],
          }) as string;
          return signature;
        } catch (err: any) {
          if (err?.code === 4001) {
            throw new Error('Signature rejected by user.');
          }
          throw new Error('Failed to sign message.');
        }
      },
    }),
    {
      name: 'qie-auth-storage',
    }
  )
);
