import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Heart, MessageCircle, Pin, Sparkles, BadgeCheck, Flame, Zap, Link as LinkIcon, Repeat, Bookmark, Trash2, Loader2, X, Download } from "lucide-react";
import { StakingBadgeChip } from "./staking-badge";
import { Avatar } from "./avatar-img";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";
import { toggleLike, toggleRepost, toggleBookmark, type FeedPost, relativeTime, shortAddr, API_BASE } from "@/lib/posts";
import { sendTip, boostPost, createSuperYap, checkWalletConnection } from "@/lib/qie-chain";
import { BROQ_TOKEN, ERC20_ABI } from "@/lib/tokens";
import { createWalletClient, custom, parseUnits, defineChain } from "viem";

// QIE Chain definition untuk walletClient
const QIE_CHAIN_FOR_WALLET = defineChain({
  id: 1990,
  name: "QIE Mainnet",
  nativeCurrency: { name: "QIE", symbol: "QIE", decimals: 18 },
  rpcUrls: { 
    default: { 
      http: [
        "https://rpc-evm.qie.onenov.xyz",
        "https://rpc2mainnet.qie.digital",
        "https://rpc3mainnet.qie.digital"
      ] 
    } 
  },
});

function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return n.toString();
}

// ✅ RENDER @MENTION sebagai link
function renderContentWithMentions(content: string) {
  if (!content) return null;
  
  // Split by @mention pattern
  const parts = content.split(/(@[a-zA-Z0-9_\.\-]+)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith('@') && part.length > 1) {
      const username = part.slice(1); // hapus @
      return (
        <Link
          key={i}
          to="/profile/$address"
          params={{ address: username }}
          onClick={(e) => e.stopPropagation()}
          className="text-brand font-semibold hover:underline transition-colors"
        >
          {part}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function PostCard({ post }: { post: FeedPost }) {
  const [liked, setLiked] = useState(post?.liked ?? false);
  const [likes, setLikes] = useState(post?.likes ?? 0);
  const [reposted, setReposted] = useState(post?.reposted ?? false);
  const [reposts, setReposts] = useState(post?.reposts ?? 0);
  const [bookmarked, setBookmarked] = useState(post?.bookmarked ?? false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // ✅ State untuk Tip Modal (QIE / BROQ)
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipToken, setTipToken] = useState<'QIE' | 'BROQ'>('QIE');
  const [tipAmount, setTipAmount] = useState('');
  const [tipSending, setTipSending] = useState(false);
  const [broqBalance, setBroqBalance] = useState<string>('0');

  // ✅ Local state untuk tips
  const [tipQie, setTipQie] = useState<number>(post?.tipTotalQie ?? 0);
  const [tipBroq, setTipBroq] = useState<number>(post?.tipTotalBroq ?? 0);

  const { user } = useAuth();

  const contractAddress = import.meta.env.VITE_QIE_YAP_CONTRACT as `0x${string}`;
  const isOwner = user?.address?.toLowerCase() === post.author?.address?.toLowerCase();

  const reposters = (post as any).reposters || [];

  // ✅ Lock body scroll saat lightbox atau tip modal open
  useEffect(() => {
    if (lightboxImage || isTipModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [lightboxImage, isTipModalOpen]);

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

  const handleOpenTipModal = async () => {
    if (!user) return toast.error("Connect your wallet to tip");
    const isConnected = await checkWalletConnection();
    if (!isConnected) {
      toast.error("Please connect your QIE Wallet first");
      return;
    }
    setTipAmount('');
    setTipToken('QIE');
    setIsTipModalOpen(true);

    try {
      const res = await fetch(`${API_BASE}/tokens/broq/balance/${user.address}`);
      if (res.ok) {
        const data = await res.json();
        setBroqBalance(data.formatted || '0');
      }
    } catch {}
  };

  const handleSendTip = async () => {
    if (!user) return;
    if (!contractAddress) return toast.error("Contract not deployed yet");

    const amount = parseFloat(tipAmount);
    if (!amount || isNaN(amount) || amount <= 0) {
      return toast.error("Enter a valid amount");
    }

    const recipientUUID = post.author?.id || post.author?.address;
    if (!recipientUUID) {
      return toast.error("Invalid recipient");
    }

    setTipSending(true);
    const toastId = toast.loading("Waiting for wallet confirmation...");

    try {
      let hash = '';

      if (tipToken === 'QIE') {
        hash = await sendTip(
          contractAddress,
          String(post.author.address) as `0x${string}`,
          tipAmount,
          `Tip for post ${post.id}`
        );
      } else {
        if (!window.ethereum) {
          throw new Error("No wallet detected");
        }

        const walletClient = createWalletClient({
          chain: QIE_CHAIN_FOR_WALLET,
          transport: custom(window.ethereum),
        });

        const [account] = await walletClient.getAddresses();
        const amountWei = parseUnits(tipAmount, 18);

        hash = await walletClient.writeContract({
          address: BROQ_TOKEN.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [post.author.address as `0x${string}`, amountWei],
          account,
        });
      }

      const backendRes = await fetch(`${API_BASE}/tips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: post.id,
          from_user_id: user.id,
          to_user_id: recipientUUID,
          amount: amount,
          tx_hash: hash,
          token_type: tipToken,
          token_address: tipToken === 'BROQ' ? BROQ_TOKEN.address : null,
        }),
      });

      if (!backendRes.ok) {
        const errText = await backendRes.text();
        throw new Error(`Backend save failed: ${errText}`);
      }

      if (tipToken === 'QIE') {
        setTipQie(prev => prev + amount);
      } else {
        setTipBroq(prev => prev + amount);
      }

      toast.dismiss(toastId);
      toast.success(`${tipToken} tip sent! Tx: ${hash.slice(0, 10)}...`);
      setIsTipModalOpen(false);
      setTipAmount('');
    } catch (error: any) {
      toast.dismiss(toastId);
      console.error("❌ Tip error:", error);
      toast.error(error.message || "Tip failed");
    } finally {
      setTipSending(false);
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

  const handleShareToX = () => {
    const url = window.location.origin + `/yap/${post.id}`;
    const text = `Check out this Yap on QIE Mainnet! 🚀`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank');
  };

  if (!post || !post.id) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 bg-card/50 p-6 text-center text-muted-foreground">
        <p className="text-sm">Post data unavailable</p>
      </div>
    );
  }

  const hasAnyTip = tipQie > 0 || tipBroq > 0;

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-shadow duration-300 hover:shadow-xl hover:border-brand-start/30",
        post.isSuperYap && "border-2 border-gold bg-gold-soft/20 shadow-gold/10",
        post.isBoosted && "border-2 border-brand-start/20",
      )}
    >
      {/* === Repost Indicator === */}
      {reposters.length > 0 && (
        <div className="absolute -top-3 left-5 inline-flex items-center gap-1.5 rounded-full bg-muted/80 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border/30 z-10">
          <Repeat className="size-3" />
          <span>
            Reposted by {reposters.map((r: any) => r.display_name || shortAddr(r.address)).join(', ')}
          </span>
        </div>
      )}

      {/* === Header === */}
      <div className="flex items-start gap-3 pt-2">
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
            {post.author?.qie_pass_verified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
                ✅ QIE Pass Verified
              </span>
            )}
            {post.author?.qie_id && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-brand">
                @{post.author.qie_id}
              </span>
            )}
            
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
          {renderContentWithMentions(post.content)}
        </div>

        {post.mediaUrl && (
          <div className="mt-3 w-full max-w-md rounded-xl overflow-hidden border border-border/50 shadow-sm">
            <img 
              src={post.mediaUrl} 
              alt="Post media" 
              className="w-full h-auto object-cover max-h-96 cursor-zoom-in" 
              onClick={() => setLightboxImage(post.mediaUrl!)}
            />
          </div>
        )}

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
          <button
            onClick={handleShareToX}
            className="p-1.5 rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-brand-start"
            title="Share on X"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* === Bottom: Premium Actions === */}
      <div className="ml-[60px] mt-1 flex flex-wrap items-center gap-2 border-t border-border/20 pt-3">
        <button
          onClick={handleOpenTipModal}
          disabled={isProcessing}
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FF0A6C] to-[#0040FF] px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-brand-start/25 transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100"
        >
          {hasAnyTip ? (
            <span className="flex items-center gap-2">
              {tipQie > 0 && (
                <span className="flex items-center gap-1">
                  💎 {tipQie < 1 ? tipQie.toFixed(4) : tipQie.toFixed(2)} QIE
                </span>
              )}
              {tipBroq > 0 && (
                <span className="flex items-center gap-1 border-l border-white/30 pl-2">
                  🪙 {tipBroq.toLocaleString('id-ID', { maximumFractionDigits: 2 })} BROQ
                </span>
              )}
            </span>
          ) : (
            <span>💎 Tip</span>
          )}
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

      {/* ✅ LIGHTBOX MODAL via Portal — anti flicker */}
      {lightboxImage && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxImage(null);
            }}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="size-6" />
          </button>

          <a
            href={lightboxImage}
            download
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 right-20 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
            aria-label="Download"
          >
            <Download className="size-6" />
          </a>

          <div
            className="max-h-[90vh] max-w-[90vw] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage}
              alt="Full view"
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl select-none"
              draggable={false}
            />
          </div>

          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/60 pointer-events-none">
            Click anywhere to close
          </p>
        </div>,
        document.body
      )}

      {/* ✅ TIP MODAL via Portal */}
      {isTipModalOpen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
          onClick={() => !tipSending && setIsTipModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Send Tip</h3>
              <button
                onClick={() => !tipSending && setIsTipModalOpen(false)}
                className="p-1 rounded-full hover:bg-muted"
                disabled={tipSending}
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Choose token
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTipToken('QIE')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-xl border-2 py-3 font-semibold transition-all",
                    tipToken === 'QIE'
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border text-muted-foreground hover:border-brand/50"
                  )}
                  disabled={tipSending}
                >
                  💰 QIE
                </button>
                <button
                  onClick={() => setTipToken('BROQ')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-xl border-2 py-3 font-semibold transition-all",
                    tipToken === 'BROQ'
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border text-muted-foreground hover:border-brand/50"
                  )}
                  disabled={tipSending}
                >
                  🪙 BROQ
                </button>
              </div>
            </div>

            {tipToken === 'BROQ' && (
              <div className="mb-3 text-xs text-muted-foreground">
                Your balance: <span className="font-semibold text-foreground">
                  {Number(broqBalance).toLocaleString('id-ID')} BROQ
                </span>
              </div>
            )}

            <div className="mb-4">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Amount ({tipToken})
              </label>
              <input
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                placeholder={tipToken === 'QIE' ? "0.1" : "1000"}
                min="0"
                step="any"
                disabled={tipSending}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-lg font-semibold outline-none focus:border-brand transition-colors"
              />
              <div className="flex gap-2 mt-2">
                {(tipToken === 'QIE' ? ['0.1', '1', '10'] : ['100', '1000', '10000']).map((v) => (
                  <button
                    key={v}
                    onClick={() => setTipAmount(v)}
                    disabled={tipSending}
                    className="text-xs px-3 py-1 rounded-full border border-border hover:border-brand hover:text-brand transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSendTip}
              disabled={tipSending || !tipAmount || parseFloat(tipAmount) <= 0}
              className="w-full rounded-xl bg-gradient-to-r from-[#FF0A6C] to-[#0040FF] py-3 font-bold text-white shadow-md transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              {tipSending ? (
                <>
                  <Loader2 className="inline size-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>Send {tipToken} Tip</>
              )}
            </button>

            <p className="text-[11px] text-muted-foreground text-center mt-3">
              {tipToken === 'QIE'
                ? '2% platform fee applies'
                : 'BROQ tip goes 100% to recipient'}
            </p>
          </div>
        </div>,
        document.body
      )}
    </article>
  );
}
