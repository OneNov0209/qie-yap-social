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

  return posts.map((p: any) => ({
    ...p,
    author: p.author || {
      address: p.author_address || p.author_id || "unknown",
      displayName: p.author_display_name || p.display_name || "Anonymous",
      avatarSeed: p.author_avatar_seed || p.avatar_seed || "default",
      badge: p.author_badge || "shrimp",
      isValidator: p.author_is_validator || false,
    },
    createdAt: p.created_at || new Date().toISOString(),
  }));
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
