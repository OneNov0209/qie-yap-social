import { supabase } from "@/integrations/supabase/client";
import { badgeFor, type StakingBadge } from "@/lib/qie-chain";

export interface FeedProfile {
  id: string;
  address: string;
  username: string;
  displayName: string;
  bio: string;
  avatarSeed: string;
  isValidator: boolean;
  badge: StakingBadge;
}

export interface FeedPost {
  id: string;
  author: FeedProfile;
  content: string;
  createdAt: string;
  isSuperYap: boolean;
  isBoosted: boolean;
  likes: number;
  replies: number;
  liked: boolean;
  tipTotal: number;
  tips: number;
  txHash: string | null;
  onChain: boolean;
}

interface ProfileRow {
  id: string;
  address: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_seed: string;
  is_validator: boolean;
}

function mapProfile(p: ProfileRow): FeedProfile {
  return {
    id: p.id,
    address: p.address,
    username: p.username,
    displayName: p.display_name,
    bio: p.bio ?? "",
    avatarSeed: p.avatar_seed ?? p.address,
    isValidator: !!p.is_validator,
    // until per-user staking lookup runs, infer a placeholder badge
    badge: badgeFor(0),
  };
}

export async function fetchFeed(
  filter: "trending" | "latest" | "following" | "super",
  viewerId: string | null,
): Promise<FeedPost[]> {
  let query = supabase
    .from("posts")
    .select("id, content, is_super_yap, is_boosted, created_at, author:profiles!posts_author_id_fkey(*)")
    .is("reply_to", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (filter === "super") query = query.eq("is_super_yap", true);

  const { data, error } = await query;
  if (error) throw error;
  if (!data) return [];

  const ids = data.map((p) => p.id as string);
  const [likes, replyCounts, viewerLikes] = await Promise.all([
    supabase.from("likes").select("post_id").in("post_id", ids),
    supabase.from("posts").select("reply_to").in("reply_to", ids),
    viewerId
      ? supabase.from("likes").select("post_id").eq("user_id", viewerId).in("post_id", ids)
      : Promise.resolve({ data: [] as Array<{ post_id: string }> }),
  ]);

  const likeCount = new Map<string, number>();
  (likes.data ?? []).forEach((r) => likeCount.set(r.post_id, (likeCount.get(r.post_id) ?? 0) + 1));

  const replyCount = new Map<string, number>();
  (replyCounts.data ?? []).forEach((r) =>
    r.reply_to ? replyCount.set(r.reply_to, (replyCount.get(r.reply_to) ?? 0) + 1) : null,
  );

  const likedSet = new Set((viewerLikes.data ?? []).map((r) => r.post_id));

  let mapped = data
    .filter((p) => p.author)
    .map((p) => ({
      id: p.id as string,
      author: mapProfile(p.author as unknown as ProfileRow),
      content: p.content as string,
      createdAt: p.created_at as string,
      isSuperYap: !!p.is_super_yap,
      isBoosted: !!p.is_boosted,
      likes: likeCount.get(p.id as string) ?? 0,
      replies: replyCount.get(p.id as string) ?? 0,
      liked: likedSet.has(p.id as string),
      tipTotal: 0,
      tips: 0, txHash: null, onChain: false,
    }));

  if (filter === "trending") {
    mapped = [...mapped].sort((a, b) => b.likes - a.likes);
  } else if (filter === "following" && viewerId) {
    const { data: f } = await supabase.from("follows").select("following_id").eq("follower_id", viewerId);
    const set = new Set((f ?? []).map((x) => x.following_id));
    mapped = mapped.filter((p) => set.has(p.author.id));
  } else if (filter === "following" && !viewerId) {
    mapped = [];
  }

  return mapped;
}

export async function createPost(input: {
  content: string;
  isSuperYap?: boolean;
  isBoosted?: boolean;
  boostHours?: number;
  txHash?: string | null;
  contentHash?: string | null;
}) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new Error("Connect your wallet first");
  const boostExpires =
    input.isBoosted && input.boostHours
      ? new Date(Date.now() + input.boostHours * 3_600_000).toISOString()
      : null;
  const { error } = await supabase.from("posts").insert({
    author_id: userId,
    content: input.content.trim(),
    is_super_yap: !!input.isSuperYap,
    is_boosted: !!input.isBoosted,
    boost_expires_at: boostExpires,
    tx_hash: input.txHash ?? null,
    content_hash: input.contentHash ?? null,
    on_chain: !!input.txHash,
  });
  if (error) throw error;
}

export async function toggleLike(postId: string, liked: boolean) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new Error("Connect your wallet first");
  if (liked) {
    await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", userId);
  } else {
    await supabase.from("likes").insert({ post_id: postId, user_id: userId });
  }
}

export function avatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear&backgroundColor=fce7f3,fbcfe8,f9a8d4`;
}

export function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
