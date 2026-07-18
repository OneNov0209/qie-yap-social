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
    isSuperYap: boolean;
    isBoosted: boolean;
    boostHours: number;
    txHash?: string | null;
    contentHash?: string | null;
  },
  authorId: string
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      content: postData.content,
      author_id: authorId,
      is_super_yap: postData.isSuperYap,
      is_boosted: postData.isBoosted,
      boost_expires_at: postData.boostHours > 0 
        ? new Date(Date.now() + postData.boostHours * 60 * 60 * 1000).toISOString() 
        : null,
      tx_hash: postData.txHash || null,
      content_hash: postData.contentHash || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create post:", error);
    throw error;
  }
  return data;
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
      author_id
    `)
    .is("reply_to", null)
    .order("created_at", { ascending: false });

  if (tab === "super") {
    query = query.eq("is_super_yap", true);
  }

  const { data: posts, error: postsError } = await query.limit(50);

  if (postsError) {
    console.error("[FetchFeed] Error fetching posts:", postsError);
    return [];
  }

  if (!posts || posts.length === 0) return [];

  const authorIds = posts.map((p: any) => p.author_id).filter(Boolean);

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, address, display_name, avatar_seed, is_validator")
    .in("id", authorIds);

  if (profilesError) {
    console.error("[FetchFeed] Error fetching profiles:", profilesError);
  }

  const profileMap: Record<string, any> = {};
  if (profiles) {
    profiles.forEach((p: any) => {
      profileMap[p.id] = p;
    });
  }

  let userLikes: Set<string> = new Set();
  if (userId) {
    const { data: likesData } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", userId);
    if (likesData) {
      userLikes = new Set(likesData.map((l) => l.post_id));
    }
  }

  // Ambil jumlah likes, replies, dan tips untuk setiap postingan
  const postIds = posts.map((p: any) => p.id);
  const [likesCounts, repliesCounts, tipsCounts] = await Promise.all([
    supabase.from("likes").select("post_id", { count: "exact", head: true }).in("post_id", postIds),
    supabase.from("posts").select("reply_to", { count: "exact", head: true }).in("reply_to", postIds),
    supabase.from("tips").select("post_id", { count: "exact", head: true }).in("post_id", postIds),
  ]);

  const postInteractions: Record<string, number> = {};
  posts.forEach((p: any) => {
    const likes = likesCounts.count || 0;
    const replies = repliesCounts.count || 0;
    const tips = tipsCounts.count || 0;
    postInteractions[p.id] = likes + replies + tips;
  });

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
      likes: 0,
      liked: userLikes.has(item.id),
      replies: 0,
      author: {
        address: profile.address || item.author_id || "unknown",
        displayName: profile.display_name || "Anonymous",
        avatarSeed: profile.avatar_seed || item.author_id || "0x0",
        badge: badgeFor(0),
        isValidator: profile.is_validator || false,
      },
    };
  });

  // ✅ FITUR TRENDING: Urutkan berdasarkan interaksi tertinggi
  if (tab === "trending") {
    result.sort((a, b) => {
      const scoreA = postInteractions[a.id] || 0;
      const scoreB = postInteractions[b.id] || 0;
      return scoreB - scoreA;
    });
  }

  return result;
}

export async function toggleLike(postId: string, currentlyLiked: boolean): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (currentlyLiked) {
    await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", user.id);
  } else {
    await supabase.from("likes").insert({ post_id: postId, user_id: user.id });
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
