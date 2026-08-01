export const API_BASE = import.meta.env.VITE_API_BASE || "https://api.yap.onenov.xyz/api";

export interface FeedPost {
  id: string;
  content: string;
  mediaUrl?: string | null;
  isSuperYap: boolean;
  isBoosted: boolean;
  createdAt: string;
  txHash?: string | null;
  onChain?: boolean;
  tipTotal: number;
  likes: number;
  liked: boolean;
  replies: number;
  reposts: number;
  reposted: boolean;
  bookmarked: boolean;
  author: {
    address: string;
    displayName: string;
    avatarSeed: string;
    badge: "shrimp" | "fish" | "dolphin" | "shark" | "whale";
    isValidator: boolean;
  };
}

export function mapPost(item: any): FeedPost {
  const authorData = item.author || {};
  const address = authorData.address || item.author_address || item.author_id || "unknown";
  const displayName = authorData.display_name || authorData.displayName || item.author_display_name || item.author_name || "Anonymous";
  const avatarSeed = authorData.avatar_seed || authorData.avatarSeed || item.author_avatar_seed || "default";
  const isValidator = Boolean(authorData.is_validator || authorData.isValidator || item.author_is_validator || false);

  let badge: "shrimp" | "fish" | "dolphin" | "shark" | "whale" = "shrimp";
  const addrHash = address.length > 10 ? parseInt(address.slice(2, 6), 16) : 0;
  if (addrHash > 0xFFFF) badge = "whale";
  else if (addrHash > 0x0FFF) badge = "shark";
  else if (addrHash > 0x0FF) badge = "dolphin";
  else if (addrHash > 0x0F) badge = "fish";

  return {
    id: item.id,
    content: item.content,
    mediaUrl: item.media_url || item.mediaUrl || null,
    isSuperYap: Boolean(item.is_super_yap || item.isSuperYap || false),
    isBoosted: Boolean(item.is_boosted || item.isBoosted || false),
    createdAt: item.created_at || item.createdAt || new Date().toISOString(),
    txHash: item.tx_hash || item.txHash || null,
    onChain: Boolean(item.on_chain || item.onChain || false),
    tipTotal: Number(item.tip_total || item.tipTotal || 0),
    likes: Number(item.likes || 0),
    liked: Boolean(item.liked || false),
    replies: Number(item.replies || item.reply_count || 0),
    reposts: Number(item.reposts || 0),
    reposted: Boolean(item.reposted || false),
    bookmarked: Boolean(item.bookmarked || false),
    author: {
      address,
      displayName,
      avatarSeed,
      badge,
      isValidator,
    },
  };
}
