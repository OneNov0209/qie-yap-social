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
    qie_id?: string;
    qie_pass_verified?: boolean;
  };
  linkPreview?: {
    title: string;
    description: string;
    image: string | null;
    siteName: string;
    url: string;
  } | null;
}

export function mapPost(item: any): FeedPost {
  const authorData = item.author || {};
  const address = authorData.address || item.author_address || item.author_id || "unknown";
  const displayName = authorData.display_name || authorData.displayName || item.author_display_name || item.author_name || "Anonymous";
  const avatarSeed = authorData.avatar_seed || authorData.avatarSeed || item.author_avatar_seed || "default";
  const isValidator = Boolean(authorData.is_validator || authorData.isValidator || item.author_is_validator || false);
  const qie_id = authorData.qie_id || null;
  const qie_pass_verified = Boolean(authorData.qie_pass_verified || false);

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
      qie_id,
      qie_pass_verified,
    },
    linkPreview: item.link_preview || item.linkPreview || null,
  };
}

export async function createPost(
  postData: {
    content: string;
    mediaUrl?: string;
    linkPreview?: {
      title: string;
      description: string;
      image: string | null;
      siteName: string;
      url: string;
    } | null;
    isSuperYap?: boolean;
    isBoosted?: boolean;
    boostHours?: number;
    txHash?: string | null;
    contentHash?: string | null;
    replyToId?: string | null;
    originalPostId?: string | null;
  },
  authorId: string
): Promise<{ id: string } | null> {
  const payload = {
    author_id: authorId,
    content: postData.content,
    media_url: postData.mediaUrl,
    link_preview: postData.linkPreview,
    is_super_yap: postData.isSuperYap,
    is_boosted: postData.isBoosted,
    tx_hash: postData.txHash,
    content_hash: postData.contentHash,
    on_chain: true,
    reply_to: postData.replyToId,
    original_post_id: postData.originalPostId,
    boost_expires_at: postData.boostHours && postData.boostHours > 0 
      ? new Date(Date.now() + postData.boostHours * 60 * 60 * 1000).toISOString() 
      : null,
  };

  const res = await fetch(`${API_BASE}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error("Backend error:", errorText);
    throw new Error(`Failed to create post: ${res.status} - ${errorText}`);
  }
  
  return res.json();
}

export async function toggleLike(postId: string, userId: string): Promise<void> {
  await fetch(`${API_BASE}/likes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ post_id: postId, user_id: userId }),
  });
}

export async function toggleRepost(postId: string, userId: string): Promise<void> {
  await fetch(`${API_BASE}/reposts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ post_id: postId, user_id: userId }),
  });
}

export async function toggleBookmark(postId: string, userId: string): Promise<void> {
  await fetch(`${API_BASE}/bookmarks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ post_id: postId, user_id: userId }),
  });
}

export async function toggleFollow(followingId: string, userId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/follows`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ following_id: followingId, follower_id: userId }),
  });
  const data = await res.json();
  return data.following;
}

export async function fetchReplies(parentId: string, userId: string | null): Promise<FeedPost[]> {
  const url = `${API_BASE}/replies?parent_id=${parentId}${userId ? `&user_id=${userId}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.map(mapPost);
}

export async function fetchFeed(tab: string, userId: string | null, offset: number = 0): Promise<FeedPost[]> {
  const url = `${API_BASE}/feed?tab=${tab}&limit=10&offset=${offset}${userId ? `&user_id=${userId}` : ""}`;
  console.log("🔍 Fetching feed from:", url);
  const res = await fetch(url);
  if (!res.ok) return [];
  const posts = await res.json();
  return posts.map(mapPost);
}

export function relativeTime(dateString: string): string {
  if (!dateString) return "Just now";
  let date: Date;
  try {
    date = new Date(dateString);
    if (isNaN(date.getTime())) {
      date = new Date(dateString + 'Z');
    }
  } catch {
    return "Just now";
  }
  if (isNaN(date.getTime())) {
    return "Just now";
  }
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 0) return "Just now";
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function shortAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export async function uploadToIPFS(file: File): Promise<string | null> {
  const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
  if (!PINATA_JWT) {
    console.error("Pinata JWT not found in env");
    return null;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });

    const data = await res.json();
    if (data.IpfsHash) {
      return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
    }
    return null;
  } catch (error) {
    console.error("Upload to IPFS failed:", error);
    return null;
  }
}
