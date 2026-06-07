export type StakingBadge = "shrimp" | "fish" | "dolphin" | "shark" | "whale";

export interface MockUser {
  address: string;
  username: string;
  displayName: string;
  bio: string;
  avatarSeed: string;
  badge: StakingBadge;
  isValidator: boolean;
  followers: number;
  following: number;
  yaps: number;
  tipsReceived: number;
  website?: string;
  twitter?: string;
}

export interface PollOption { label: string; votes: number }

export interface MockPost {
  id: string;
  author: MockUser;
  content: string;
  createdAt: string; // ISO
  likes: number;
  replies: number;
  tips: number;        // count
  tipTotal: number;    // QIE
  liked?: boolean;
  isSuperYap?: boolean;
  isBoosted?: boolean;
  poll?: PollOption[];
  pollVotedIndex?: number;
}

export const BADGE_META: Record<StakingBadge, { emoji: string; label: string; min: number }> = {
  shrimp:  { emoji: "🦐", label: "Shrimp",  min: 0 },
  fish:    { emoji: "🐟", label: "Fish",    min: 100 },
  dolphin: { emoji: "🐬", label: "Dolphin", min: 1_000 },
  shark:   { emoji: "🦈", label: "Shark",   min: 10_000 },
  whale:   { emoji: "🐋", label: "Whale",   min: 100_000 },
};

export const shortAddr = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

const u = (
  username: string,
  displayName: string,
  badge: StakingBadge,
  isValidator: boolean,
  address: string,
  bio = "",
  followers = 0,
  yaps = 0,
  tipsReceived = 0,
): MockUser => ({
  username, displayName, badge, isValidator, address, bio,
  avatarSeed: username, followers, following: Math.floor(followers / 3),
  yaps, tipsReceived,
});

export const MOCK_USERS: MockUser[] = [
  u("alpha_qie", "AlphaNode", "whale", true, "0x109b7C2c8B5A4D11FCE8FbE26A77f0B5DCEcFa7a",
    "Validator. Liquidity provider. Yapping since genesis block.", 12_400, 318, 9_812),
  u("qieswap", "QIE Swap", "shark", true, "0x9B0DBB1f751A4ACD81B5f9f9926e8f4ddA594Ec6",
    "Native DEX of the QIE ecosystem. Swap, pool, earn.", 8_120, 142, 2_340),
  u("dave_trades", "Degen Dave", "fish", false, "0x4f6CFA218bA8f8e1B5a82C44F9c2d1129Cd31a02",
    "Charts, vibes, polls. Not financial advice.", 1_204, 612, 124),
  u("sarah_dev", "Sarah Q", "dolphin", false, "0x71C04A98AcB02C3f7bE0f50E26B7c2A3F0aD1234",
    "Solidity dev. Building consumer onchain.", 3_402, 89, 540),
  u("nova_node", "Nova Validator", "whale", true, "0xA1B2C3D4E5F6789012345678901234567890aBcD",
    "Securing QIE since day one. Delegations welcome.", 21_900, 47, 18_220),
  u("pixel_ann", "Pixel Ann", "shrimp", false, "0x88E3a8b09f2d3DCa1aaB9C8c1c2D9aE7901F2233",
    "NFT artist. Pink supremacy.", 412, 203, 38),
];

const SELF = MOCK_USERS[3]; // sarah_dev as the logged-out demo viewer
export const MOCK_SELF: MockUser = SELF;

const ago = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export const MOCK_POSTS: MockPost[] = [
  {
    id: "p1",
    author: MOCK_USERS[0],
    content: "The QIE mainnet throughput just hit a new ATH. We're sustaining 4,500 TPS with sub-second finality. The validator set is the healthiest it's ever been. 💎🙌",
    createdAt: ago(2),
    likes: 1240, replies: 42, tips: 18, tipTotal: 420,
    isSuperYap: true,
  },
  {
    id: "p2",
    author: MOCK_USERS[1],
    content: "New liquidity pools are LIVE. Earn up to 45% APR on QIE/USDC pairs for the next 48 hours. Bridge from any major L1 in under 30 seconds.",
    createdAt: ago(4),
    likes: 304, replies: 12, tips: 4, tipTotal: 12,
    isBoosted: true,
  },
  {
    id: "p3",
    author: MOCK_USERS[2],
    content: "Which feature should the QIE core team ship next? 🗳️",
    createdAt: ago(6),
    likes: 89, replies: 24, tips: 1, tipTotal: 2,
    poll: [
      { label: "Mobile wallet app", votes: 912 },
      { label: "NFT marketplace", votes: 280 },
      { label: "Bridge expansion", votes: 210 },
    ],
  },
  {
    id: "p4",
    author: MOCK_USERS[3],
    content: "Just deployed my first smart contract on QIE. The developer experience is genuinely smoother than every other EVM L1 I've shipped on. Docs are 10/10. 🛠️✨",
    createdAt: ago(8),
    likes: 142, replies: 9, tips: 7, tipTotal: 31, liked: true,
  },
  {
    id: "p5",
    author: MOCK_USERS[4],
    content: "Delegations open. Commission 5%. Uptime 99.98% over the last 90 days. If you're staking, stake with infrastructure that cares.",
    createdAt: ago(12),
    likes: 521, replies: 31, tips: 22, tipTotal: 188,
  },
  {
    id: "p6",
    author: MOCK_USERS[5],
    content: "Drop 1 of my QIE-native pixel collection mints next Friday. 10 QIE each. Tip-gated whitelist for top yappers this week. 💖",
    createdAt: ago(20),
    likes: 78, replies: 5, tips: 3, tipTotal: 8,
  },
];

export const avatarUrl = (seed: string, size = 96) =>
  `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear&backgroundColor=fce7f3,fbcfe8,f9a8d4`;

export function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export interface MockNotification {
  id: string;
  type: "follow" | "like" | "reply" | "tip";
  from: MockUser;
  postPreview?: string;
  amount?: number;
  createdAt: string;
  read: boolean;
}

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  { id: "n1", type: "tip", from: MOCK_USERS[0], amount: 50, postPreview: "Just deployed my first smart contract...", createdAt: ago(0.2), read: false },
  { id: "n2", type: "like", from: MOCK_USERS[1], postPreview: "Just deployed my first smart contract...", createdAt: ago(1), read: false },
  { id: "n3", type: "follow", from: MOCK_USERS[4], createdAt: ago(3), read: false },
  { id: "n4", type: "reply", from: MOCK_USERS[2], postPreview: "ngmi without QIE", createdAt: ago(9), read: true },
  { id: "n5", type: "like", from: MOCK_USERS[5], postPreview: "Just deployed...", createdAt: ago(26), read: true },
];
