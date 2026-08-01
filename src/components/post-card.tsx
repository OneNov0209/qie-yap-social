import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, MessageCircle, Pin, Sparkles, BadgeCheck, Flame, Zap, Link as LinkIcon, Repeat, Bookmark } from "lucide-react";
import { StakingBadgeChip } from "./staking-badge";
import { Avatar } from "./avatar-img";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";
import { toggleLike, toggleRepost, toggleBookmark, type FeedPost, relativeTime, shortAddr } from "@/lib/posts";
import { sendTip, boostPost, createSuperYap } from "@/lib/qie-chain";

function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return n.toString();
}

export function PostCard({ post }: { post: FeedPost }) {
  const [liked, setLiked] = useState(post?.liked ?? false);
  const [likes, setLikes] = useState(post?.likes ?? 0);
  const [reposted, setReposted] = useState(post?.reposted ?? false);
  const [reposts, setReposts] = useState(post?.reposts ?? 0);
  const [bookmarked, setBookmarked] = useState(post?.bookmarked ?? false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  const contractAddress = import.meta.env.VITE_QIE_YAP_CONTRACT as `0x${string}`;

  const onToggleLike = async () => {
    if (!user) return toast("Connect your wallet to like yaps");
    if (isProcessing) return;
    setIsProcessing(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes((n) => n + (wasLiked ? -1 : 1));
    try {
      await toggleLike(post.id, user.id);
    } catch (error: any) {
      console.error("Like error:", error);
      setLiked(wasLiked);
      setLikes((n) => n + (wasLiked ? 1 : -1));
      toast.error("Couldn't update like");
    } finally {
      setIsProcessing(false);
    }
  };

  const onToggleRepost = async () => {
    if (!user) return toast("Connect your wallet to repost");
    if (isProcessing) return;
    setIsProcessing(true);
    const wasReposted = reposted;
    setReposted(!wasReposted);
    setReposts((n) => n + (wasReposted ? -1 : 1));
    try {
      await toggleRepost(post.id, user.id);
    } catch (error: any) {
      console.error("Repost error:", error);
      setReposted(wasReposted);
      setReposts((n) => n + (wasReposted ? 1 : -1));
      toast.error("Couldn't update repost");
    } finally {
      setIsProcessing(false);
    }
  };

  const onToggleBookmark = async () => {
    if (!user) return toast("Connect your wallet to bookmark");
    if (isProcessing) return;
    setIsProcessing(true);
    const wasBookmarked = bookmarked;
    setBookmarked(!wasBookmarked);
    try {
      await toggleBookmark(post.id, user.id);
    } catch (error: any) {
      console.error("Bookmark error:", error);
      setBookmarked(wasBookmarked);
      toast.error("Couldn't update bookmark");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTip = async () => {
    if (!user) return toast.error("Connect your wallet to tip");
    if (!contractAddress) return toast.error("Contract not deployed yet");
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      const amount = prompt("Enter tip amount in QIE (e.g. 0.1):", "0.1");
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        toast.error("Invalid amount");
        setIsProcessing(false);
        return;
      }
      
      const hash = await sendTip(
        contractAddress,
        String(post.author.address) as `0x${string}`,
        amount,
        `Tip for post ${post.id}`
      );
      
      toast.success(`Tip sent! Tx: ${hash.slice(0, 10)}...`);
      setIsProcessing(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Tip failed");
      setIsProcessing(false);
    }
  };

  const handleBoost = async () => {
    if (!user) return toast.error("Connect your wallet to boost");
    if (!contractAddress) return toast.error("Contract not deployed yet");
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      const hours = prompt("Boost duration (1-72 hours):", "24");
      if (!hours || isNaN(parseInt(hours)) || parseInt(hours) < 1 || parseInt(hours) > 72) {
        toast.error("Duration must be 1-72 hours");
        setIsProcessing(false);
        return;
      }
      
      const hash = await boostPost(
        contractAddress,
        BigInt(post.id || "0"),
        BigInt(hours)
      );
      
      toast.success(`Post boosted for ${hours}h! Tx: ${hash.slice(0, 10)}...`);
      setIsProcessing(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Boost failed");
      setIsProcessing(false);
    }
  };

  const handleSuperYap = async () => {
    if (!user) return toast.error("Connect your wallet to create Super Yap");
    if (!contractAddress) return toast.error("Contract not deployed yet");
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      const hash = await createSuperYap(contractAddress);
      toast.success(`Super Yap created! Tx: ${hash.slice(0, 10)}...`);
      setIsProcessing(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Super Yap failed");
      setIsProcessing(false);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.origin + `/yap/${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  };

  if (!post || !post.id) {
    return (
      <div className="yap-card p-5 border border-dashed border-border/50 bg-card/50 text-center text-muted-foreground">
        <p className="text-sm">Post data unavailable</p>
      </div>
    );
  }

  return (
    <article
      className={cn(
        "yap-card relative p-5",
        post.isSuperYap && "border-2 border-gold bg-gold-soft/60 shadow-lg shadow-gold/20",
        post.isBoosted && "border-2 border-brand/40",
      )}
    >
      {post.isSuperYap && (
        <span className="absolute -top-3 right-5 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-sm">
          <Sparkles className="size-3" />
          Super Yap
        </span>
      )}
      {post.txHash && (
        <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-brand/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-brand shadow-sm border border-brand/30">
          <LinkIcon className="size-3" />
          On-Chain
        </span>
      )}

      {post.isBoosted && (
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand">
          <Pin className="size-3" />
          Promoted
        </div>
      )}

      <div className="flex gap-4">
        <Link to="/profile/$address" params={{ address: post.author?.address || "" }}>
          <Avatar seed={post.author?.avatarSeed || "default"} size={48} />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <Link
              to="/profile/$address"
              params={{ address: post.author?.address || "" }}
              className="font-semibold text-foreground hover:underline underline-offset-2"
            >
              {post.author?.displayName || "Unknown"}
            </Link>
            <StakingBadgeChip badge={post.author?.badge || "shrimp"} />
            {post.author?.isValidator && <BadgeCheck className="size-4 text-brand" />}
            
            {post.onChain && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand border border-brand/30">
                ⚡ On-Chain
              </span>
            )}
            
            <span className="font-mono text-[11px] text-muted-foreground">
              {shortAddr(post.author?.address || "")}
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

          <div className="mt-4 flex flex-wrap items-center gap-4 text-muted-foreground">
            <Link to="/yap/$id" params={{ id: post.id }} className="group flex items-center gap-1.5 text-xs transition-colors hover:text-brand">
              <MessageCircle className="size-4" />
              <span className="font-medium">{compact(post.replies || 0)}</span>
            </Link>
            
            <button
              onClick={onToggleRepost}
              className={cn(
                "group flex items-center gap-1.5 text-xs transition-colors hover:text-brand",
                reposted && "text-brand",
              )}
            >
              <Repeat className={cn("size-4 transition-transform group-active:scale-90", reposted && "fill-current")} />
              <span className="font-medium">{compact(reposts || 0)}</span>
            </button>

            <button
              onClick={onToggleLike}
              className={cn(
                "group flex items-center gap-1.5 text-xs transition-colors hover:text-brand",
                liked && "text-brand",
              )}
            >
              <Heart className={cn("size-4 transition-transform group-active:scale-90", liked && "fill-current")} />
              <span className="font-medium">{compact(likes || 0)}</span>
            </button>

            <button
              onClick={onToggleBookmark}
              className={cn(
                "group ml-auto flex items-center gap-1.5 text-xs transition-colors hover:text-brand",
                bookmarked && "text-brand",
              )}
            >
              <Bookmark className={cn("size-4 transition-transform group-active:scale-90", bookmarked && "fill-current")} />
            </button>

            <button
              onClick={handleCopyLink}
              className="group flex items-center gap-1.5 text-xs transition-colors hover:text-brand"
            >
              <LinkIcon className="size-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-white/10">
            <button
              onClick={handleTip}
              disabled={isProcessing}
              className="btn-futuristic px-4 py-1.5 text-xs"
            >
              💎 {post.tipTotal > 0 ? `${post.tipTotal} QIE` : "Tip"}
            </button>

            {user?.address === post.author?.address && (
              <button
                onClick={handleSuperYap}
                disabled={isProcessing}
                className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1 text-xs font-semibold text-gold transition-colors hover:bg-gold hover:text-white disabled:opacity-50"
              >
                <Flame className="size-3" />
                Super Yap
              </button>
            )}

            <button
              onClick={handleBoost}
              disabled={isProcessing}
              className="inline-flex items-center gap-1 rounded-full border border-brand/20 px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-brand/10 hover:text-brand disabled:opacity-50"
            >
              <Zap className="size-3" />
              Boost
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
