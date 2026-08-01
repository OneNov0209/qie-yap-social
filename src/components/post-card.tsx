import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, MessageCircle, Pin, Sparkles, BadgeCheck, Flame, Zap, Link as LinkIcon, Repeat, Bookmark, MoreHorizontal } from "lucide-react";
import { StakingBadgeChip } from "./staking-badge";
import { Avatar } from "./avatar-img";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";
import { toggleLike, toggleRepost, toggleBookmark, type FeedPost, relativeTime, shortAddr } from "@/lib/posts";
import { sendTip, boostPost, createSuperYap, checkWalletConnection } from "@/lib/qie-chain";

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

    const isConnected = await checkWalletConnection();
    if (!isConnected) {
      toast.error("Please connect your QIE Wallet first");
      return;
    }

    const amount = window.prompt("Enter tip amount in QIE (e.g. 0.1):", "0.1");
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error("Invalid amount");
      return;
    }
    
    setIsProcessing(true);
    try {
      toast.loading("Waiting for wallet confirmation...");
      const hash = await sendTip(
        contractAddress,
        String(post.author.address) as `0x${string}`,
        amount,
        `Tip for post ${post.id}`
      );
      toast.dismiss();
      toast.success(`Tip sent! Tx: ${hash.slice(0, 10)}...`);
    } catch (error: any) {
      toast.dismiss();
      console.error("❌ Tip error:", error);
      if (error.message?.includes("insufficient funds")) {
        toast.error("Insufficient QIE balance");
      } else if (error.message?.includes("user rejected")) {
        toast.error("Transaction rejected by user");
      } else {
        toast.error(error.message || "Tip failed");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBoost = async () => {
    if (!user) return toast.error("Connect your wallet to boost");
    if (!contractAddress) return toast.error("Contract not deployed yet");
    if (isProcessing) return;

    const isConnected = await checkWalletConnection();
    if (!isConnected) {
      toast.error("Please connect your QIE Wallet first");
      return;
    }

    const hours = window.prompt("Boost duration (1-72 hours):", "24");
    if (!hours || isNaN(parseInt(hours)) || parseInt(hours) < 1 || parseInt(hours) > 72) {
      toast.error("Duration must be 1-72 hours");
      return;
    }

    setIsProcessing(true);
    try {
      toast.loading("Waiting for wallet confirmation...");
      const hash = await boostPost(
        contractAddress,
        BigInt(post.id || "0"),
        BigInt(hours)
      );
      toast.dismiss();
      toast.success(`Post boosted for ${hours}h! Tx: ${hash.slice(0, 10)}...`);
    } catch (error: any) {
      toast.dismiss();
      console.error("❌ Boost error:", error);
      toast.error(error.message || "Boost failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuperYap = async () => {
    if (!user) return toast.error("Connect your wallet to create Super Yap");
    if (!contractAddress) return toast.error("Contract not deployed yet");
    if (isProcessing) return;

    const isConnected = await checkWalletConnection();
    if (!isConnected) {
      toast.error("Please connect your QIE Wallet first");
      return;
    }

    setIsProcessing(true);
    try {
      toast.loading("Waiting for wallet confirmation...");
      const hash = await createSuperYap(contractAddress);
      toast.dismiss();
      toast.success(`Super Yap created! Tx: ${hash.slice(0, 10)}...`);
    } catch (error: any) {
      toast.dismiss();
      console.error("❌ SuperYap error:", error);
      toast.error(error.message || "Super Yap failed");
    } finally {
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
        "yap-card group p-5",
        post.isSuperYap && "border-2 border-gold bg-gold-soft/60 shadow-lg shadow-gold/20",
        post.isBoosted && "border-2 border-brand-start/40",
      )}
    >
      {/* Status Badges */}
      <div className="absolute -top-3 left-5 right-5 flex justify-between pointer-events-none">
        {post.txHash && (
          <span className="inline-flex items-center gap-1 rounded-full bg-background/80 backdrop-blur-sm px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-brand-start shadow-sm border border-border/50">
            <LinkIcon className="size-3" />
            On-Chain
          </span>
        )}
        {post.isSuperYap && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
            <Sparkles className="size-3" />
            Super Yap
          </span>
        )}
      </div>

      {post.isBoosted && (
        <div className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-start">
          <Pin className="size-3.5" />
          Promoted
        </div>
      )}

      <div className="flex gap-4">
        <Link to="/profile/$address" params={{ address: post.author?.address || "" }}>
          <Avatar seed={post.author?.avatarSeed || "default"} size={48} />
        </Link>

        <div className="min-w-0 flex-1">
          {/* Header User */}
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <Link
              to="/profile/$address"
              params={{ address: post.author?.address || "" }}
              className="font-semibold text-foreground hover:text-brand-start transition-colors underline-offset-2 hover:underline"
            >
              {post.author?.displayName || "Unknown"}
            </Link>
            <StakingBadgeChip badge={post.author?.badge || "shrimp"} />
            {post.author?.isValidator && <BadgeCheck className="size-4 text-brand-start fill-current" />}
            
            {post.onChain && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-start/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-start border border-brand-start/20">
                ⚡ On-Chain
              </span>
            )}
            
            <span className="font-mono text-[11px] text-muted-foreground">
              {shortAddr(post.author?.address || "")}
            </span>
            <span className="text-xs text-muted-foreground">· {relativeTime(post.createdAt)}</span>
          </div>

          {/* Konten Postingan */}
          <Link
            to="/yap/$id"
            params={{ id: post.id }}
            className="mt-2 block text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap"
          >
            {post.content}
          </Link>

          {/* Action Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-muted-foreground">
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/yap/$id" params={{ id: post.id }} className="group flex items-center gap-1.5 text-xs transition-colors hover:text-brand-start">
                <MessageCircle className="size-4 group-hover:scale-110 transition-transform" />
                <span className="font-medium">{compact(post.replies || 0)}</span>
              </Link>
              
              <button
                onClick={onToggleRepost}
                className={cn(
                  "group flex items-center gap-1.5 text-xs transition-colors hover:text-brand-start",
                  reposted && "text-brand-start",
                )}
              >
                <Repeat className={cn("size-4 transition-transform group-active:scale-90", reposted && "fill-current")} />
                <span className="font-medium">{compact(reposts || 0)}</span>
              </button>

              <button
                onClick={onToggleLike}
                className={cn(
                  "group flex items-center gap-1.5 text-xs transition-colors hover:text-brand-start",
                  liked && "text-brand-start",
                )}
              >
                <Heart className={cn("size-4 transition-transform group-active:scale-90", liked && "fill-current")} />
                <span className="font-medium">{compact(likes || 0)}</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onToggleBookmark}
                className={cn(
                  "group flex items-center justify-center size-8 rounded-full transition-colors hover:bg-muted",
                  bookmarked && "text-brand-start",
                )}
              >
                <Bookmark className={cn("size-4 transition-transform group-active:scale-90", bookmarked && "fill-current")} />
              </button>

              <button
                onClick={handleCopyLink}
                className="group flex items-center justify-center size-8 rounded-full transition-colors hover:bg-muted"
              >
                <LinkIcon className="size-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons (Tip, SuperYap, Boost) */}
          <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-border/30">
            <button
              onClick={handleTip}
              disabled={isProcessing}
              className="btn-futuristic px-4 py-1.5 text-xs gap-1.5"
            >
              💎 {post.tipTotal > 0 ? `${post.tipTotal} QIE` : "Tip"}
            </button>

            {user?.address === post.author?.address && (
              <button
                onClick={handleSuperYap}
                disabled={isProcessing}
                className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1.5 text-xs font-semibold text-gold transition-all hover:bg-gold hover:text-white hover:shadow-lg disabled:opacity-50"
              >
                <Flame className="size-3" />
                Super Yap
              </button>
            )}

            <button
              onClick={handleBoost}
              disabled={isProcessing}
              className="inline-flex items-center gap-1 rounded-full border border-brand-start/20 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-brand-start/10 hover:text-brand-start disabled:opacity-50"
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
