import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
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

export async function createPost(content: string): Promise<{ id: string } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("posts")
    .insert({
      content,
      author_id: user.id,
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
  const client = typeof window === 'undefined' ? supabaseAdmin : supabase;

  let query = client
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
      profiles!inner (
        id,
        address,
        display_name,
        avatar_seed,
        is_validator
      )
    `)
    .is("reply_to", null)
    .order("created_at", { ascending: false });

  if (tab === "super") {
    query = query.eq("is_super_yap", true);
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

  const { data, error } = await query.limit(50);

  if (error) {
    console.error("[FetchFeed] Error:", error);
    return [];
  }

  if (!data) return [];

  return data.map((item: any) => {
    const tipTotal = 0;
    const repliesCount = 0;

    return {
      id: item.id,
      content: item.content,
      isSuperYap: item.is_super_yap,
      isBoosted: item.is_boosted && item.boost_expires_at > new Date().toISOString(),
      createdAt: item.created_at,
      txHash: item.tx_hash,
      onChain: item.on_chain,
      tipTotal,
      likes: item.likes?.length || 0,
      liked: userLikes.has(item.id),
      replies: repliesCount,
      author: {
        address: item.profiles?.address || item.author_id || "unknown",
        displayName: item.profiles?.display_name || "Anonymous",
        avatarSeed: item.profiles?.avatar_seed || item.author_id || "0x0",
        badge: badgeFor(0),
        isValidator: item.profiles?.is_validator || false,
      },
    };
  });
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
