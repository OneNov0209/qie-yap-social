import { supabase } from "@/integrations/supabase/client";
import { badgeFor } from "@/lib/qie-chain";

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
    originalPostId?: string | null; // Untuk Repost
  },
  authorId: string
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      content: postData.content,
      author_id: authorId,
      is_super_yap: postData.isSuperYap || false,
      is_boosted: postData.isBoosted || false,
      boost_expires_at: postData.boostHours && postData.boostHours > 0 
        ? new Date(Date.now() + postData.boostHours * 60 * 60 * 1000).toISOString() 
        : null,
      tx_hash: postData.txHash || null,
      content_hash: postData.contentHash || null,
      reply_to: postData.replyToId || null,
      original_post_id: postData.originalPostId || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create post:", error);
    throw error;
  }
  return data;
}

export async function toggleRepost(postId: string, userId: string): Promise<void> {
  // Cek apakah user sudah melakukan repost
  const { data: existing } = await supabase
    .from("reposts")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("reposts").delete().eq("post_id", postId).eq("user_id", userId);
  } else {
    await supabase.from("reposts").insert({ post_id: postId, user_id: userId });
  }
}

export async function toggleBookmark(postId: string, userId: string): Promise<void> {
  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("bookmarks").delete().eq("post_id", postId).eq("user_id", userId);
  } else {
    await supabase.from("bookmarks").insert({ post_id: postId, user_id: userId });
  }
}

export async function fetchReplies(parentId: string, userId: string | null): Promise<FeedPost[]> {
  const query = supabase
    .from("posts")
    .select(`
      id,
      content,
      is_super_yap,
      is_boosted,
      boost_expires_at,
      created_at,
      tx_hash,
      on_chain,
      reply_to,
      author_id,
      original_post_id,
      likes:likes(count),
      reposts:reposts(count),
      replies:posts!reply_to(count)
    `)
    .eq("reply_to", parentId)
    .order("created_at", { ascending: false });

  const { data: posts, error: postsError } = await query.limit(50);
  if (postsError) return [];

  if (!posts || posts.length === 0) return [];

  const authorIds = posts.map((p: any) => p.author_id).filter(Boolean);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, address, display_name, avatar_seed, is_validator")
    .in("id", authorIds);

  const profileMap: Record<string, any> = {};
  if (profiles) profiles.forEach((p: any) => profileMap[p.id] = p);

  let userLikes = new Set();
  let userReposts = new Set();
  let userBookmarks = new Set();
  if (userId) {
    const [likes, reposts, bookmarks] = await Promise.all([
      supabase.from("likes").select("post_id").eq("user_id", userId),
      supabase.from("reposts").select("post_id").eq("user_id", userId),
      supabase.from("bookmarks").select("post_id").eq("user_id", userId),
    ]);
    if (likes.data) userLikes = new Set(likes.data.map((l) => l.post_id));
    if (reposts.data) userReposts = new Set(reposts.data.map((r) => r.post_id));
    if (bookmarks.data) userBookmarks = new Set(bookmarks.data.map((b) => b.post_id));
  }

  return posts.map((item: any) => {
    const profile = profileMap[item.author_id] || {};
    return {
      id: item.id,
      content: item.content,
      isSuperYap: item.is_super_yap,
      isBoosted: item.is_boosted && item.boost_expires_at > new Date().toISOString(),
      createdAt: item.created_at,
      txHash: item.tx_hash,
      onChain: item.on_chain,
      tipTotal: 0,
      likes: item.likes?.[0]?.count || 0,
      liked: userLikes.has(item.id),
      replies: item.replies?.[0]?.count || 0,
      reposts: item.reposts?.[0]?.count || 0,
      reposted: userReposts.has(item.id),
      bookmarked: userBookmarks.has(item.id),
      author: {
        address: profile.address || item.author_id || "unknown",
        displayName: profile.display_name || "Anonymous",
        avatarSeed: profile.avatar_seed || item.author_id || "0x0",
        badge: badgeFor(0),
        isValidator: profile.is_validator || false,
      },
    };
  });
}

export async function fetchFeed(tab: string, userId: string | null): Promise<FeedPost[]> {
  let query = supabase
    .from("posts")
    .select(`
      id,
      content,
      is_super_yap,
      is_boosted,
      boost_expires_at,
      created_at,
      tx_hash,
      on_chain,
      reply_to,
      author_id,
      original_post_id,
      likes:likes(count),
      reposts:reposts(count),
      replies:posts!reply_to(count)
    `)
    .is("reply_to", null)
    .order("created_at", { ascending: false });

  if (tab === "super") {
    query = query.eq("is_super_yap", true);
  }

  const { data: posts, error: postsError } = await query.limit(50);
  if (postsError) return [];
  if (!posts || posts.length === 0) return [];

  const authorIds = posts.map((p: any) => p.author_id).filter(Boolean);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, address, display_name, avatar_seed, is_validator")
    .in("id", authorIds);

  const profileMap: Record<string, any> = {};
  if (profiles) profiles.forEach((p: any) => profileMap[p.id] = p);

  let userLikes = new Set();
  let userReposts = new Set();
  let userBookmarks = new Set();
  if (userId) {
    const [likes, reposts, bookmarks] = await Promise.all([
      supabase.from("likes").select("post_id").eq("user_id", userId),
      supabase.from("reposts").select("post_id").eq("user_id", userId),
      supabase.from("bookmarks").select("post_id").eq("user_id", userId),
    ]);
    if (likes.data) userLikes = new Set(likes.data.map((l) => l.post_id));
    if (reposts.data) userReposts = new Set(reposts.data.map((r) => r.post_id));
    if (bookmarks.data) userBookmarks = new Set(bookmarks.data.map((b) => b.post_id));
  }

  let result = posts.map((item: any) => {
    const profile = profileMap[item.author_id] || {};
    return {
      id: item.id,
      content: item.content,
      isSuperYap: item.is_super_yap,
      isBoosted: item.is_boosted && item.boost_expires_at > new Date().toISOString(),
      createdAt: item.created_at,
      txHash: item.tx_hash,
      onChain: item.on_chain,
      tipTotal: 0,
      likes: item.likes?.[0]?.count || 0,
      liked: userLikes.has(item.id),
      replies: item.replies?.[0]?.count || 0,
      reposts: item.reposts?.[0]?.count || 0,
      reposted: userReposts.has(item.id),
      bookmarked: userBookmarks.has(item.id),
      author: {
        address: profile.address || item.author_id || "unknown",
        displayName: profile.display_name || "Anonymous",
        avatarSeed: profile.avatar_seed || item.author_id || "0x0",
        badge: badgeFor(0),
        isValidator: profile.is_validator || false,
      },
    };
  });

  if (tab === "trending") {
    result.sort((a, b) => (b.likes + b.replies + b.reposts) - (a.likes + a.replies + a.reposts));
  }

  return result;
}

export async function toggleLike(postId: string, userId: string): Promise<void> {
  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", userId);
  } else {
    await supabase.from("likes").insert({ post_id: postId, user_id: userId });
  }
}

export function relativeTime(dateString: string): string {
  const date = new Date(dateString);
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
