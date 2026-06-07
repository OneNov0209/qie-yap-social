import { create } from "zustand";
import type { MockUser } from "./mock-data";
import { MOCK_SELF } from "./mock-data";

interface AuthState {
  user: MockUser | null;
  balance: number; // QIE
  connect: (wallet: "qie" | "keplr") => void;
  disconnect: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  balance: 0,
  connect: (_wallet) => set({ user: MOCK_SELF, balance: 1_842.50 }),
  disconnect: () => set({ user: null, balance: 0 }),
}));
