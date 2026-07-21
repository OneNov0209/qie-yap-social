// ✅ BASE URL API VPS (sudah HTTPS & domain)
const API_BASE = import.meta.env.VITE_API_BASE || "https://api.yap.onenov.xyz/api";

export interface FeedPost {
  id: string;
  content: string;
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
  const res = await fetch(`${API_BASE}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...postData, author_id: authorId }),
  });
  if (!res.ok) throw new Error("Failed to create post");
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
  return res.json();
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

export function avatarUrl(seed: string): string {
  if (!seed) return "";
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`;
}
