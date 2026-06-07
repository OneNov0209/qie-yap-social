import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, MessageCircle, Pin, Sparkles, BadgeCheck } from "lucide-react";
import { type MockPost, relativeTime, shortAddr } from "@/lib/mock-data";
import { StakingBadgeChip } from "./staking-badge";
import { Avatar } from "./avatar-img";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";

function compact(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return n.toString();
}

export function PostCard({ post }: { post: MockPost }) {
  const [liked, setLiked] = useState(!!post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [pollVoted, setPollVoted] = useState<number | undefined>(post.pollVotedIndex);
  const { user } = useAuth();

  const totalVotes = post.poll?.reduce((s, o) => s + o.votes, 0) ?? 0;
  const liveTotal = totalVotes + (pollVoted !== undefined && post.pollVotedIndex === undefined ? 1 : 0);

  const toggleLike = () => {
    if (!user) return toast("Connect your wallet to like yaps");
    setLiked((v) => !v);
    setLikes((n) => n + (liked ? -1 : 1));
  };

  const handleTip = () => {
    if (!user) return toast("Connect your wallet to tip");
    toast.success(`Sent 1 QIE tip to ${post.author.displayName}`, {
      description: "Tx submitted on QIE Mainnet",
    });
  };

  const handleVote = (i: number) => {
    if (pollVoted !== undefined) return;
    if (!user) return toast("Connect your wallet to vote");
    setPollVoted(i);
    toast.success("Vote recorded");
  };

  return (
    <article
      className={cn(
        "yap-card relative p-5 transition-shadow hover:shadow-md hover:shadow-brand/5",
        post.isSuperYap && "border-2 border-gold bg-gold-soft/60 shadow-lg shadow-gold/10",
        post.isBoosted && "border-2 border-brand/25",
      )}
    >
      {post.isSuperYap && (
        <span className="absolute -top-3 right-5 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-sm">
          <Sparkles className="size-3" />
          Super Yap
        </span>
      )}
      {post.isBoosted && (
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand">
          <Pin className="size-3" />
          Promoted
        </div>
      )}

      <div className="flex gap-4">
        <Link to="/profile/$address" params={{ address: post.author.address }}>
          <Avatar seed={post.author.avatarSeed} size={48} />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <Link
              to="/profile/$address"
              params={{ address: post.author.address }}
              className="font-semibold text-foreground hover:underline underline-offset-2"
            >
              {post.author.displayName}
            </Link>
            <StakingBadgeChip badge={post.author.badge} />
            {post.author.isValidator && (
              <BadgeCheck className="size-4 text-brand" />
            )}
            <span className="font-mono text-[11px] text-muted-foreground">
              {shortAddr(post.author.address)}
            </span>
            <span className="text-xs text-muted-foreground">· {relativeTime(post.createdAt)}</span>
          </div>

          <Link
            to="/yap/$id"
            params={{ id: post.id }}
            className="mt-2 block text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap"
          >
            {post.content}
          </Link>

          {post.poll && (
            <div className="mt-4 space-y-2">
              {post.poll.map((opt, i) => {
                const showResult = pollVoted !== undefined;
                const optVotes = opt.votes + (pollVoted === i && post.pollVotedIndex === undefined ? 1 : 0);
                const pct = showResult && liveTotal > 0 ? Math.round((optVotes / liveTotal) * 100) : 0;
                const isPick = pollVoted === i;
                return (
                  <button
                    key={i}
                    onClick={() => handleVote(i)}
                    disabled={showResult}
                    className={cn(
                      "relative block h-10 w-full overflow-hidden rounded-xl border text-left transition-colors",
                      showResult
                        ? isPick ? "border-brand" : "border-border"
                        : "border-border hover:border-brand/40 hover:bg-brand-soft/30",
                    )}
                  >
                    {showResult && (
                      <div
                        className={cn("absolute inset-y-0 left-0", isPick ? "bg-brand/15" : "bg-muted")}
                        style={{ width: `${pct}%` }}
                      />
                    )}
                    <div className="relative flex h-full items-center justify-between px-4 text-sm">
                      <span className={cn("font-medium", isPick && "text-brand")}>{opt.label}</span>
                      {showResult && (
                        <span className={cn("font-mono text-xs font-bold", isPick ? "text-brand" : "text-muted-foreground")}>
                          {pct}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              <p className="text-[11px] text-muted-foreground">
                {liveTotal.toLocaleString()} votes
              </p>
            </div>
          )}

          <div className="mt-4 flex items-center gap-7 text-muted-foreground">
            <button className="group flex items-center gap-1.5 text-xs transition-colors hover:text-brand">
              <MessageCircle className="size-4" />
              <span className="font-medium">{compact(post.replies)}</span>
            </button>
            <button
              onClick={toggleLike}
              className={cn(
                "group flex items-center gap-1.5 text-xs transition-colors hover:text-brand",
                liked && "text-brand",
              )}
            >
              <Heart className={cn("size-4 transition-transform group-active:scale-90", liked && "fill-current")} />
              <span className="font-medium">{compact(likes)}</span>
            </button>
            <button
              onClick={handleTip}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-brand/30 px-3 py-1 text-xs font-semibold text-brand transition-colors hover:bg-brand hover:text-primary-foreground"
            >
              💎 {post.tipTotal > 0 ? `${post.tipTotal} QIE` : "Tip"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
