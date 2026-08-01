export const API_BASE =
  import.meta.env.VITE_API_BASE || "https://api.yap.onenov.xyz/api";

export type StakingBadgeName = "shrimp" | "fish" | "dolphin" | "shark" | "whale";

export interface FeedProfile {
  id: string;
  address: string;
  username?: string;
  displayName: string;
  bio?: string;
  avatarSeed: string;
  badge: StakingBadgeName;
  isValidator: boolean;
}

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
  tips?: number;
  likes: number;
  liked: boolean;
  replies: number;
  reposts: number;
  reposted: boolean;
  bookmarked: boolean;
  author: FeedProfile;
}

async function postJson(path: string, body: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${path} failed: ${res.status} ${text}`);
  }
  return res.status === 204 ? null : res.json().catch(() => null);
}

/** Normalise anything the backend sends into an ISO string the UI can parse. */
export function normalizeDate(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (typeof value === "number") {
    // seconds vs milliseconds
    const ms = value < 1e12 ? value * 1000 : value;
    return new Date(ms).toISOString();
  }
  if (typeof value !== "string") return new Date().toISOString();

  let s = value.trim();
  if (!s) return new Date().toISOString();

  // "2026-07-31 10:22:33" (MySQL/Postgres style) -> ISO, treated as UTC
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) s = s.replace(" ", "T");
  // No timezone marker at all -> assume UTC
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) s = `${s}Z`;

  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function mapAuthor(p: any): FeedProfile {
  const a = p?.author ?? {};
  return {
    id: a.id ?? p?.author_id ?? "unknown",
    address: a.address ?? p?.author_address ?? "unknown",
    username: a.username ?? p?.author_username,
    displayName:
      a.displayName ?? a.display_name ?? p?.author_display_name ?? "Anonymous",
    bio: a.bio ?? "",
    avatarSeed:
      a.avatarSeed ??
      a.avatar_seed ??
      p?.author_avatar_seed ??
      a.address ??
      p?.author_address ??
      "default",
    badge: (a.badge ?? p?.author_badge ?? "shrimp") as StakingBadgeName,
    isValidator: Boolean(a.isValidator ?? a.is_validator ?? p?.author_is_validator),
  };
}

export function mapPost(p: any): FeedPost {
  return {
    id: String(p.id),
    content: p.content ?? "",
    mediaUrl: p.mediaUrl ?? p.media_url ?? null,
    isSuperYap: Boolean(p.isSuperYap ?? p.is_super_yap),
    isBoosted: Boolean(p.isBoosted ?? p.is_boosted),
    createdAt: normalizeDate(p.createdAt ?? p.created_at),
    txHash: p.txHash ?? p.tx_hash ?? null,
    onChain: Boolean(p.onChain ?? p.on_chain),
    tipTotal: Number(p.tipTotal ?? p.tip_total ?? 0),
    tips: Number(p.tips ?? 0),
    likes: Number(p.likes ?? p.like_count ?? 0),
    liked: Boolean(p.liked),
    replies: Number(p.replies ?? p.reply_count ?? 0),
    reposts: Number(p.reposts ?? p.repost_count ?? 0),
    reposted: Boolean(p.reposted),
    bookmarked: Boolean(p.bookmarked),
    author: mapAuthor(p),
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
  return postJson("/posts", {
    author_id: authorId,
    content: postData.content,
    media_url: postData.mediaUrl ?? null,
    is_super_yap: !!postData.isSuperYap,
    is_boosted: !!postData.isBoosted,
    tx_hash: postData.txHash ?? null,
    content_hash: postData.contentHash ?? null,
    on_chain: !!postData.onChain,
    reply_to: postData.replyToId ?? null,
    original_post_id: postData.originalPostId ?? null,
    boost_expires_at:
      postData.boostHours && postData.boostHours > 0
        ? new Date(Date.now() + postData.boostHours * 3600 * 1000).toISOString()
        : null,
  });
}

export async function toggleLike(postId: string, userId: string): Promise<void> {
  await postJson("/likes", { post_id: postId, user_id: userId });
}

export async function toggleRepost(postId: string, userId: string): Promise<void> {
  await postJson("/reposts", { post_id: postId, user_id: userId });
}

export async function toggleBookmark(postId: string, userId: string): Promise<void> {
  await postJson("/bookmarks", { post_id: postId, user_id: userId });
}

export async function fetchReplies(
  parentId: string,
  userId: string | null
): Promise<FeedPost[]> {
  const url = `${API_BASE}/replies?parent_id=${encodeURIComponent(parentId)}${
    userId ? `&user_id=${encodeURIComponent(userId)}` : ""
  }`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data.map(mapPost) : [];
}

export async function fetchFeed(
  tab: string,
  userId: string | null
): Promise<FeedPost[]> {
  const url = `${API_BASE}/feed?tab=${encodeURIComponent(tab)}&limit=20${
    userId ? `&user_id=${encodeURIComponent(userId)}` : ""
  }`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  const list = Array.isArray(data) ? data : (data?.posts ?? []);
  return list.map(mapPost);
}

export function relativeTime(dateString: string): string {
  const date = new Date(normalizeDate(dateString));
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
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
