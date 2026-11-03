import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getQieBalance } from '@/lib/qie-chain';
import { getReferredBy, clearReferralFromUrl, generateRegisterMessage } from '@/lib/posts';

const API_BASE = import.meta.env.VITE_API_BASE || "https://api.yap.onenov.xyz/api";

const WALLETCONNECT_PROJECT_ID = "7f5230a2da0f45798f150d028660356f";

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


let wcProvider: any = null;

async function getProvider() {
  
  if (typeof window !== 'undefined' && window.ethereum) {
    return window.ethereum;
  }

  
  if (!wcProvider) {
    const { EthereumProvider } = await import('@walletconnect/ethereum-provider');
    
    wcProvider = await EthereumProvider.init({
      projectId: WALLETCONNECT_PROJECT_ID,
      chains: [1990], 
      optionalChains: [1990],
      showQrModal: true,
      metadata: {
        name: 'QIE Yap',
        description: 'The on-chain reputation layer for QIE',
        url: 'https://qie.yap.onenov.xyz',
        icons: ['https://raw.githubusercontent.com/OneNov0209/logo/refs/heads/main/qie-logo.png'],
      },
      rpcMap: {
        1990: 'https://rpc2mainnet.qie.digital',
      },
    });
  }

  return wcProvider;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      connecting: false,
      connectStep: null,

      connect: async () => {
        set({ connecting: true, connectStep: 'Connecting wallet...' });

        try {
          
          const provider = await getProvider();
          
          if (!provider) {
            throw new Error('No wallet available. Please install QIE Wallet or use a mobile wallet.');
          }

          
          if (provider !== window.ethereum) {
            set({ connectStep: 'Scan QR code with your wallet...' });
            await provider.connect();
          }

          set({ connectStep: 'Requesting accounts...' });
          const accounts = await provider.request({ method: 'eth_requestAccounts' });
          const address = (accounts as string[])[0];
          
          if (!address) {
            throw new Error('No accounts found in wallet.');
          }

          set({ connectStep: 'Checking profile...' });

          const referredBy = getReferredBy();
          const checkRes = await fetch(`${API_BASE}/profiles/${address}`);
          const isExistingUser = checkRes.ok;

          let profile: any;

          if (isExistingUser) {
            profile = await checkRes.json();
          } else {
            set({ connectStep: 'Please sign in your wallet...' });

            const message = generateRegisterMessage(address);

            let signature: string;
            try {
              signature = await provider.request({
                method: 'personal_sign',
                params: [message, address],
              }) as string;
            } catch (signError: any) {
              if (signError?.code === 4001) {
                throw new Error('Signature rejected. Please approve the signature to register.');
              }
              throw new Error('Failed to sign message. Please try again.');
            }

            if (!signature) {
              throw new Error('Invalid signature.');
            }

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
              const data = await res.json().catch(() => ({ error: 'Registration failed' }));
              throw new Error(data.error || `Registration failed: ${res.status}`);
            }

            profile = await res.json();
          }

          if (referredBy) {
            clearReferralFromUrl();
          }

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

          getQieBalance(address as `0x${string}`)
            .then((balance) => {
              const current = get().user;
              if (current && current.address === address) {
                set({ user: { ...current, balance } });
              }
            })
            .catch(() => {});

        } catch (error: any) {
          set({ connecting: false, connectStep: null });
          
          const message = error?.message || 'Failed to connect wallet.';
          throw new Error(message);
        }
      },

      disconnect: async () => {
        // Disconnect WalletConnect
        if (wcProvider && wcProvider.session) {
          try {
            await wcProvider.disconnect();
          } catch (e) {
            console.warn("WalletConnect disconnect error:", e);
          }
          wcProvider = null;
        }
        set({ user: null, connecting: false, connectStep: null });
      },

      updateProfile: (updates) => {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, ...updates } });
      },

      signMessage: async ({ message }) => {
        const currentUser = get().user;
        if (!currentUser) {
          throw new Error('Please connect your wallet first.');
        }

        const provider = await getProvider();
        if (!provider) {
          throw new Error('No wallet connected.');
        }

        try {
          const signature = await provider.request({
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
