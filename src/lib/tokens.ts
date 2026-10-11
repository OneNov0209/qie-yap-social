// ============================================
// TOKEN CONSTANTS
// ============================================

export const QIE_TOKEN = {
  symbol: 'QIE',
  name: 'QIE',
  address: null as string | null,
  decimals: 18,
  type: 'native' as const,
  icon: '💰',
};

export const BROQ_TOKEN = {
  symbol: 'BROQ',
  name: 'Broke Billionaire',
  address: '0xF0F1de70BED05ADC4aa2eaeD6a25c34AAeCA58d5',
  decimals: 18,
  type: 'erc20' as const,
  icon: '🪙',
};

export const SUPPORTED_TIP_TOKENS = [QIE_TOKEN, BROQ_TOKEN];

export type TipToken = typeof QIE_TOKEN | typeof BROQ_TOKEN;

// Minimal ERC-20 ABI untuk balance & transfer
export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ABI QieYap contract (untuk tip QIE)
export const QIE_YAP_CONTRACT = '0x2A433A09e0Ce2766affb89E7748bdc3c29044D0a';

export const QIE_YAP_ABI = [
  {
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'message', type: 'string' },
    ],
    name: 'tip',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;
