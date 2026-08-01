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

export async function createPost(
  postData: {
    content: string;
    mediaUrl?: string;
    isSuperYap?: boolean;
    isBoosted?: boolean;
    boostHours?: number;
    txHash?: string | null;
    contentHash?: string | null;
    replyToId?: string | null;
    originalPostId?: string | null;
    onChain?: boolean;
  },
  authorId: string
): Promise<{ id: string } | null> {
  const payload = {
    author_id: authorId,
    content: postData.content,
    media_url: postData.mediaUrl,
    is_super_yap: postData.isSuperYap,
    is_boosted: postData.isBoosted,
    tx_hash: postData.txHash,
    content_hash: postData.contentHash,
    on_chain: postData.onChain,
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
  return res.json();
}

export async function fetchFeed(tab: string, userId: string | null): Promise<FeedPost[]> {
  const url = `${API_BASE}/feed?tab=${tab}&limit=10${userId ? `&user_id=${userId}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  
  const posts = await res.json();

  return posts.map((p: any) => {
    const authorData = p.author || {};
    const address = authorData.address || p.author_address || p.author_id || "unknown";
    const displayName = authorData.display_name || authorData.displayName || p.author_display_name || p.author_name || "Anonymous";
    const avatarSeed = authorData.avatar_seed || authorData.avatarSeed || p.author_avatar_seed || "default";
    const isValidator = authorData.is_validator || authorData.isValidator || p.author_is_validator || false;

    return {
      id: p.id,
      content: p.content,
      mediaUrl: p.media_url || p.mediaUrl || null,
      isSuperYap: p.is_super_yap || p.isSuperYap || false,
      isBoosted: p.is_boosted || p.isBoosted || false,
      createdAt: p.created_at || p.createdAt || new Date().toISOString(),
      txHash: p.tx_hash || p.txHash || null,
      onChain: p.on_chain || p.onChain || false,
      tipTotal: p.tip_total || p.tipTotal || 0,
      likes: p.likes || 0,
      liked: p.liked || false,
      replies: p.replies || p.reply_count || 0,
      reposts: p.reposts || 0,
      reposted: p.reposted || false,
      bookmarked: p.bookmarked || false,
      author: {
        address,
        displayName,
        avatarSeed,
        badge: "shrimp",
        isValidator,
      },
    };
  });
}

export function relativeTime(dateString: string): string {
  const date = new Date(dateString + 'Z');
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
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
