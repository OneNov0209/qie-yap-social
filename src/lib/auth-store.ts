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
          throw new Error('QIE Wallet tidak terdeteksi. Harap install ekstensi QIE Wallet.');
        }
        set({ connecting: true });

        try {
          // 1. Ambil alamat wallet
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const address = (accounts as string[])[0];
          if (!address) throw new Error('Tidak ada akun yang ditemukan di QIE Wallet.');

          // 2. Ambil referral code dari URL (jika ada)
          const referredBy = getReferredBy();

          // 3. Cek apakah user sudah terdaftar (tanpa perlu signature)
          const checkRes = await fetch(`${API_BASE}/profiles/${address}`);
          const isExistingUser = checkRes.ok;

          let profile: any;

          if (isExistingUser) {
            // ✅ User sudah ada — langsung login (tidak perlu signature)
            profile = await checkRes.json();
            console.log("✅ Existing user logged in:", address.slice(0, 10) + "...");
          } else {
            // ✅ User baru — WAJIB tanda tangan wallet
            console.log("🆕 New user detected, requesting signature...");

            const message = generateRegisterMessage(address);

            // Minta user tanda tangan pesan
            let signature: string;
            try {
              signature = await window.ethereum.request({
                method: 'personal_sign',
                params: [message, address],
              }) as string;
            } catch (signError: any) {
              // User menolak tanda tangan
              if (signError?.code === 4001) {
                throw new Error('Tanda tangan dibutuhkan untuk registrasi. Silakan setujui tanda tangan di wallet Anda.');
              }
              throw new Error('Gagal menandatangani pesan: ' + (signError.message || 'Unknown error'));
            }

            if (!signature) {
              throw new Error('Tanda tangan tidak valid.');
            }

            console.log("✍️ Signature obtained, registering...");

            // Kirim ke backend dengan signature
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
              throw new Error(data.error || `Gagal register: ${res.status}`);
            }

            profile = await res.json();
            console.log("✅ Registration successful:", profile.id);
          }

          // 4. Bersihkan URL setelah login/register berhasil
          if (referredBy) {
            clearReferralFromUrl();
          }

          // 5. Ambil balance on-chain
          const balance = await getQieBalance(address as `0x${string}`).catch(() => 0);

          const displayName = profile.display_name || `${address.slice(0, 6)}…${address.slice(-4)}`;
          const username = profile.username || address.slice(0, 8);

          const userData: User = {
            id: profile.id,
            address: profile.address ?? address,
            username: username,
            displayName: displayName,
            bio: profile.bio ?? '',
            avatarSeed: profile.avatar_seed ?? address,
            badge: 'shrimp',
            isValidator: Boolean(profile.is_validator),
            balance,
          };

          console.log("✅ User data saved:", userData);
          set({ user: userData, connecting: false });
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
