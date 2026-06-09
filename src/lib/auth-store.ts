import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { requestLoginNonce, verifyLoginSignature } from "@/lib/api/auth.functions";
import { getQieBalance, getStakedQie, badgeFor, type StakingBadge } from "@/lib/qie-chain";

export interface AuthProfile {
  id: string;
  address: string;
  username: string;
  displayName: string;
  bio: string;
  avatarSeed: string;
  isValidator: boolean;
  badge: StakingBadge;
}

interface AuthState {
  user: AuthProfile | null;
  balance: number;
  staked: number;
  connecting: boolean;
  hydrated: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
  init: () => Promise<void>;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

async function loadProfileForUser(userId: string, fallbackAddr: string): Promise<AuthProfile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!data) return null;
  const addr = (data.address as string) ?? fallbackAddr;
  const balance = await getQieBalance(addr as `0x${string}`).catch(() => 0);
  const staked = (await getStakedQie(addr).catch(() => null)) ?? 0;
  return {
    id: data.id as string,
    address: addr,
    username: data.username as string,
    displayName: data.display_name as string,
    bio: (data.bio as string) ?? "",
    avatarSeed: (data.avatar_seed as string) ?? addr,
    isValidator: !!data.is_validator,
    badge: badgeFor(staked || balance),
  };
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  balance: 0,
  staked: 0,
  connecting: false,
  hydrated: false,

  init: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const meta = (data.session.user.user_metadata ?? {}) as { wallet_address?: string };
      const profile = await loadProfileForUser(data.session.user.id, meta.wallet_address ?? "");
      const balance = profile ? await getQieBalance(profile.address as `0x${string}`).catch(() => 0) : 0;
      const staked = profile ? (await getStakedQie(profile.address).catch(() => null)) ?? 0 : 0;
      set({ user: profile, balance, staked });
    }
    set({ hydrated: true });
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") set({ user: null, balance: 0, staked: 0 });
    });
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

      const { message } = await requestLoginNonce({ data: { address } });
      const signature = (await window.ethereum.request({
        method: "personal_sign",
        params: [message, address],
      })) as string;

      const { email, hashedToken } = await verifyLoginSignature({
        data: { address, signature },
      });

      const { error } = await supabase.auth.verifyOtp({
        email,
        token: hashedToken,
        type: "magiclink",
      });
      if (error) throw error;

      await get().refresh();
    } finally {
      set({ connecting: false });
    }
  },

  disconnect: async () => {
    await supabase.auth.signOut();
    set({ user: null, balance: 0, staked: 0 });
  },

  refresh: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) return;
    const meta = (data.session.user.user_metadata ?? {}) as { wallet_address?: string };
    const profile = await loadProfileForUser(data.session.user.id, meta.wallet_address ?? "");
    if (!profile) return;
    const balance = await getQieBalance(profile.address as `0x${string}`).catch(() => 0);
    const staked = (await getStakedQie(profile.address).catch(() => null)) ?? 0;
    set({ user: { ...profile, badge: badgeFor(staked || balance) }, balance, staked });
  },
}));
