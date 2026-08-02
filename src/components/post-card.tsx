import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, MessageCircle, Pin, Sparkles, BadgeCheck, Flame, Zap, Link as LinkIcon, Repeat, Bookmark, Trash2, Loader2 } from "lucide-react";
import { StakingBadgeChip } from "./staking-badge";
import { Avatar } from "./avatar-img";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";
import { toggleLike, toggleRepost, toggleBookmark, type FeedPost, relativeTime, shortAddr, API_BASE } from "@/lib/posts";
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
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();

  const contractAddress = import.meta.env.VITE_QIE_YAP_CONTRACT as `0x${string}`;
  const isOwner = user?.address?.toLowerCase() === post.author?.address?.toLowerCase();

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

  const handleDelete = async () => {
    if (!isOwner) return;
    if (!confirm("Are you sure you want to delete this Yap? This action cannot be undone.")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/posts/${post.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user?.id }),
      });
      if (!res.ok) throw new Error("Failed to delete post");
      toast.success("Yap deleted successfully!");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete post");
    } finally {
      setIsDeleting(false);
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
        BigInt(0),
        BigInt(hours)
      );
      toast.dismiss();
      toast.success(`Post boosted for ${hours}h! Tx: ${hash.slice(0, 10)}...`);
      
      window.location.reload();
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
      <div className="rounded-2xl border border-dashed border-border/50 bg-card/50 p-6 text-center text-muted-foreground">
        <p className="text-sm">Post data unavailable</p>
      </div>
    );
  }

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-brand-start/20",
        post.isSuperYap && "border-2 border-gold bg-gold-soft/20 shadow-gold/10",
        post.isBoosted && "border-2 border-brand-start/20",
      )}
    >
      {/* === Header: Avatar & Identity === */}
      <div className="flex items-start gap-3">
        <Link to="/profile/$address" params={{ address: post.author?.address || "" }}>
          <Avatar seed={post.author?.avatarSeed || "default"} size={48} className="ring-2 ring-border/50" />
        </Link>
        
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <Link
              to="/profile/$address"
              params={{ address: post.author?.address || "" }}
              className="text-base font-bold text-foreground hover:underline underline-offset-2"
            >
              {post.author?.displayName || "Unknown"}
            </Link>
            
            <StakingBadgeChip badge={post.author?.badge || "shrimp"} />
            {post.author?.isValidator && <BadgeCheck className="size-4 text-brand-start fill-current" />}
            
            <span className="text-sm text-muted-foreground">· {relativeTime(post.createdAt)}</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
            <span>@{post.author?.username || shortAddr(post.author?.address || "")}</span>
            <span>· {shortAddr(post.author?.address || "")}</span>
            {post.txHash && (
              <span className="inline-flex items-center gap-1 text-brand-start">
                <LinkIcon className="size-3" /> On-Chain
              </span>
            )}
            {post.isBoosted && (
              <span className="inline-flex items-center gap-1 text-brand-start font-medium">
                <Pin className="size-3.5" /> Promoted
              </span>
            )}
          </div>
        </div>

        {/* Tombol Delete (Hanya untuk pemilik post) */}
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
            title="Delete this Yap"
          >
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </button>
        )}

        {/* Badge Super Yap (Pojok Kanan Atas) */}
        {post.isSuperYap && (
          <span className="flex items-center gap-1.5 rounded-full bg-gold/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            <Sparkles className="size-3" />
            Super
          </span>
        )}
      </div>

      {/* === Content === */}
      <div className="ml-[60px] -mt-1">
        <div className="block text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap hover:text-foreground transition-colors">
          {post.content}
        </div>

        {/* Tampilkan Gambar jika ada */}
        {post.mediaUrl && (
          <div className="mt-3 w-full max-w-md rounded-xl overflow-hidden border border-border/50 shadow-sm">
            <img 
              src={post.mediaUrl} 
              alt="Post media" 
              className="w-full h-auto object-cover max-h-96 hover:scale-[1.01] transition-transform" 
            />
          </div>
        )}

        {/* Link Preview Card */}
        {post.linkPreview && (
          <div className="mt-3 rounded-xl overflow-hidden border border-border/50 bg-card/80 hover:border-brand-start/50 transition-colors">
            <a href={post.linkPreview.url} target="_blank" rel="noopener noreferrer" className="block">
              <div className="flex flex-col sm:flex-row">
                {post.linkPreview.image && (
                  <div className="sm:w-1/3 h-32 sm:h-auto bg-muted">
                    <img src={post.linkPreview.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 p-3">
                  <p className="text-xs font-bold text-brand-start mb-0.5">{post.linkPreview.siteName}</p>
                  <p className="font-semibold text-sm line-clamp-2">{post.linkPreview.title}</p>
                  {post.linkPreview.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.linkPreview.description}</p>
                  )}
                </div>
              </div>
            </a>
          </div>
        )}
      </div>

      {/* === Action Bar === */}
      <div className="ml-[60px] mt-2 flex items-center justify-between border-t border-border/40 pt-3">
        <div className="flex items-center gap-6">
          <button
            onClick={onToggleLike}
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-brand-start group",
              liked ? "text-brand-start" : "text-muted-foreground"
            )}
          >
            <Heart className={cn("size-5 transition-transform group-hover:scale-110", liked && "fill-current")} />
            <span>{compact(likes)}</span>
          </button>

          <Link to="/yap/$id" params={{ id: post.id }} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-start group">
            <MessageCircle className="size-5 group-hover:scale-110 transition-transform" />
            <span>{compact(post.replies || 0)}</span>
          </Link>

          <button
            onClick={onToggleRepost}
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-brand-start group",
              reposted ? "text-brand-start" : "text-muted-foreground"
            )}
          >
            <Repeat className={cn("size-5 transition-transform group-hover:scale-110", reposted && "fill-current")} />
            <span>{compact(reposts)}</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleBookmark}
            className={cn(
              "p-1.5 rounded-full transition-colors hover:bg-muted",
              bookmarked ? "text-brand-start" : "text-muted-foreground"
            )}
          >
            <Bookmark className={cn("size-5", bookmarked && "fill-current")} />
          </button>
          <button
            onClick={handleCopyLink}
            className="p-1.5 rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-brand-start"
          >
            <LinkIcon className="size-5" />
          </button>
        </div>
      </div>

      {/* === Bottom: Premium Actions === */}
      <div className="ml-[60px] mt-1 flex flex-wrap items-center gap-2 border-t border-border/20 pt-3">
        <button
          onClick={handleTip}
          disabled={isProcessing}
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FF0A6C] to-[#0040FF] px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-brand-start/25 transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100"
        >
          💎 {post.tipTotal > 0 ? `${post.tipTotal} QIE` : "Tip"}
        </button>

        {isOwner && (
          <button
            onClick={handleSuperYap}
            disabled={isProcessing}
            className="flex items-center gap-1.5 rounded-full border border-gold/40 px-4 py-1.5 text-xs font-semibold text-gold transition-all hover:bg-gold hover:text-white hover:shadow-md disabled:opacity-50"
          >
            <Flame className="size-3.5" />
            Super Yap
          </button>
        )}

        <button
          onClick={handleBoost}
          disabled={isProcessing}
          className="flex items-center gap-1.5 rounded-full border border-brand-start/20 px-4 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-brand-start hover:bg-brand-start/5 hover:text-brand-start disabled:opacity-50"
        >
          <Zap className="size-3.5" />
          Boost
        </button>
      </div>
    </article>
  );
}
