import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { Header } from "@/components/header";
import { PostCard } from "@/components/post-card";
import { Avatar } from "@/components/avatar-img";
import { Button } from "@/components/ui/button";
import { StakingBadgeChip } from "@/components/staking-badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { relativeTime, shortAddr, type FeedPost, type FeedProfile } from "@/lib/posts";
import { badgeFor } from "@/lib/qie-chain";
import { toast } from "sonner";

export const Route = createFileRoute("/yap/$id")({
  head: () => ({ meta: [{ title: "Yap — QIE Yap" }] }),
  errorComponent: () => <div className="p-8 text-center text-muted-foreground">Failed to load yap.</div>,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Yap not found</h1>
        <Link to="/" className="mt-6 inline-block text-brand hover:underline">← Back to feed</Link>
      </div>
    </div>
  ),
  component: YapDetail,
});

interface ReplyRow {
  id: string;
  content: string;
  created_at: string;
  author: { id: string; address: string; display_name: string; avatar_seed: string; username: string; is_validator: boolean; bio: string };
}

function YapDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [replies, setReplies] = useState<ReplyRow[]>([]);
  const [replyText, setReplyText] = useState("");
  const [missing, setMissing] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("posts")
      .select("id, content, is_super_yap, is_boosted, created_at, author:profiles!posts_author_id_fkey(*)")
      .eq("id", id).maybeSingle();
    if (!data || !data.author) { setMissing(true); return; }
    const a = data.author as unknown as ReplyRow["author"] & { is_validator: boolean };
    const author: FeedProfile = {
      id: a.id, address: a.address, username: a.username, displayName: a.display_name,
      bio: a.bio ?? "", avatarSeed: a.avatar_seed ?? a.address, isValidator: !!a.is_validator, badge: badgeFor(0),
    };
    const [likes, replyRows, viewerLike] = await Promise.all([
      supabase.from("likes").select("user_id", { count: "exact", head: true }).eq("post_id", id),
      supabase.from("posts").select("id, content, created_at, author:profiles!posts_author_id_fkey(*)").eq("reply_to", id).order("created_at", { ascending: false }),
      user ? supabase.from("likes").select("post_id").eq("post_id", id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    setPost({
      id: data.id as string, author, content: data.content as string, createdAt: data.created_at as string,
      isSuperYap: !!data.is_super_yap, isBoosted: !!data.is_boosted,
      likes: likes.count ?? 0, replies: (replyRows.data ?? []).length, liked: !!viewerLike.data,
      tipTotal: 0, tips: 0,
    });
    setReplies((replyRows.data ?? []) as unknown as ReplyRow[]);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id, user?.id]);

  const submitReply = async () => {
    if (!user) return toast("Connect your wallet to reply");
    if (!replyText.trim()) return;
    const { error } = await supabase.from("posts").insert({
      author_id: user.id, content: replyText.trim(), reply_to: id,
    });
    if (error) return toast.error(error.message);
    setReplyText("");
    toast.success("Reply posted");
    load();
  };

  if (missing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Yap not found</h1>
          <Link to="/" className="mt-6 inline-block text-brand hover:underline">← Back to feed</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Link to="/" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">← Back to feed</Link>
        {post && <PostCard post={post} />}

        <div className="mt-6 yap-card p-4">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value.slice(0, 280))}
            placeholder={user ? "Yap your reply…" : "Connect your wallet to reply"}
            disabled={!user}
            rows={2}
            className="w-full resize-none border-none bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <div className="flex justify-end">
            <Button onClick={submitReply} disabled={!user || !replyText.trim()}
              className="rounded-full bg-brand text-primary-foreground hover:bg-brand/90 disabled:opacity-40">
              Reply
            </Button>
          </div>
        </div>

        <h3 className="mt-8 mb-3 px-1 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {replies.length} {replies.length === 1 ? "reply" : "replies"}
        </h3>

        <div className="space-y-3">
          {replies.map((r) => (
            <div key={r.id} className="yap-card p-4">
              <div className="flex gap-3">
                <Avatar seed={r.author.avatar_seed ?? r.author.address} size={40} />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-sm">
                    <span className="font-semibold">{r.author.display_name}</span>
                    <StakingBadgeChip badge="shrimp" />
                    {r.author.is_validator && <BadgeCheck className="size-3.5 text-brand" />}
                    <span className="font-mono text-[11px] text-muted-foreground">{shortAddr(r.author.address)}</span>
                    <span className="text-xs text-muted-foreground">· {relativeTime(r.created_at)}</span>
                  </div>
                  <p className="mt-1 text-[15px] text-foreground/90 whitespace-pre-wrap">{r.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
