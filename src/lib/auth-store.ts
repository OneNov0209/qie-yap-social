import { create } from 'zustand';
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

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  connecting: false,

  init: async () => {
    // Tidak perlu init, karena kita pakai connect manual
  },

  connect: async () => {
    if (!window.ethereum) throw new Error("No wallet detected");
    set({ connecting: true });

    try {
      // 1. Minta alamat wallet dari MetaMask
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address = (accounts as string[])[0];
      if (!address) throw new Error("No account");

      // 2. Kirim alamat wallet ke backend VPS untuk register/login otomatis
      const res = await fetch(`${API_BASE}/profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      if (!res.ok) throw new Error("Failed to register/login");

      // 3. Backend mengembalikan data profil (termasuk UUID id)
      const profile = await res.json();
      console.log("✅ Profil dari VPS:", profile);

      // 4. Ambil balance QIE dari blockchain
      const balance = await getQieBalance(address as `0x${string}`).catch(() => 0);

      // 5. Set user ke state React (dengan UUID yang benar)
      set({
        user: {
          id: profile.id,              // ✅ INI UUID YANG BENAR
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
}));
