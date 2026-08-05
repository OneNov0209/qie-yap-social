import { useState, useEffect, useRef } from "react";
import { Sparkles, Rocket, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "./avatar-img";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createPost, API_BASE, uploadToIPFS } from "@/lib/posts";
import { submitYapOnChain, YAP_CONTRACT, hashContent } from "@/lib/yap-onchain";

const MAX = 2500;

interface ComposerProps {
  onPosted?: () => void;
  replyToId?: string | null;
  onCancelReply?: () => void;
}

export function Composer({ onPosted, replyToId, onCancelReply }: ComposerProps) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [superYap, setSuperYap] = useState(false);
  const [boostHours, setBoostHours] = useState<0 | 1 | 6 | 24>(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  
  const [linkPreview, setLinkPreview] = useState<{
    title: string;
    description: string;
    image: string | null;
    siteName: string;
    url: string;
  } | null>(null);
  const [fetchingPreview, setFetchingPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyToId) ref.current?.focus();
  }, [replyToId]);

  const extractUrl = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
  };

  useEffect(() => {
    const url = extractUrl(text);
    if (url && !linkPreview) {
      setFetchingPreview(true);
      fetch(`${API_BASE}/link-preview?url=${encodeURIComponent(url)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setLinkPreview(data);
          } else if (data.fallback) {
            setLinkPreview(data.fallback);
          } else {
            setLinkPreview({
              title: new URL(url).hostname,
              description: 'Preview not available',
              image: null,
              siteName: new URL(url).hostname,
              url: url
            });
          }
        })
        .catch(() => {
          setLinkPreview({
            title: new URL(url).hostname,
            description: 'Preview not available',
            image: null,
            siteName: new URL(url).hostname,
            url: url
          });
        })
        .finally(() => setFetchingPreview(false));
    } else if (!url) {
      setLinkPreview(null);
    }
  }, [text]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5MB)");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadToIPFS(file);
      if (url) {
        setMediaUrl(url);
        toast.success("Image uploaded successfully!");
      } else {
        toast.error("Upload failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!user) return toast("Connect your wallet to yap");
    if (!text.trim() && !mediaUrl) return toast("Write something or upload an image");
    setSubmitting(true);
    try {
      let txHash: string | null = null;
      let cHash: string | null = null;
      
      // ✅ WAJIB ON-CHAIN: Selalu panggil submitYapOnChain
      try {
        toast("Sign the on-chain yap in your wallet…");
        const r = await submitYapOnChain(user.address as `0x${string}`, text.trim());
        txHash = r.txHash;
        cHash = r.contentHash;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "On-chain transaction failed");
        throw new Error("On-chain transaction required for all posts");
      }
      
      const newPost = await createPost(
        {
          content: text.trim(),
          mediaUrl: mediaUrl || undefined,
          linkPreview: linkPreview || undefined,
          isSuperYap: superYap,
          isBoosted: boostHours > 0,
          boostHours,
          txHash,
          contentHash: cHash,
          replyToId,
        },
        user.id
      );

      if (replyToId && newPost) {
        try {
          await fetch(`${API_BASE}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              post_id: replyToId,
              author_id: user.id,
              content: text.trim(),
            }),
          });
        } catch (err) {
          console.warn("Comment save failed:", err);
        }
      }

      const desc: string[] = [];
      if (txHash) desc.push("On-chain ✓");
      if (superYap) desc.push("Super Yap");
      if (boostHours) desc.push(`Boost ${boostHours}h`);
      if (mediaUrl) desc.push("📷 Image");
      toast.success("Yap posted!", { description: desc.join(" · ") || "Visible to the QIE feed" });
      setText("");
      setMediaUrl(null);
      setLinkPreview(null);
      setSuperYap(false);
      setBoostHours(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onCancelReply?.();
      onPosted?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to post");
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = MAX - text.length;

  return (
    <div className="mb-6 yap-card p-4 border-l-4 border-brand-start/50">
      {replyToId && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Replying to a Yap</span>
          <button onClick={onCancelReply} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
      )}
      <div className="flex gap-4">
        <Avatar seed={user?.avatarSeed ?? "guest"} size={48} />
        <div className="w-full">
          <textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            placeholder={user ? "What's happening on QIE?" : "Connect your wallet to start yapping..."}
            disabled={!user || submitting || uploading}
            className="w-full resize-none border-none bg-transparent p-0 text-lg outline-none placeholder:text-muted-foreground disabled:opacity-70"
            rows={4}
          />

          {mediaUrl && (
            <div className="relative mt-2 w-full max-w-sm rounded-xl overflow-hidden border border-border/50">
              <img src={mediaUrl} alt="Uploaded" className="w-full h-auto object-cover max-h-64" />
              <button
                onClick={() => setMediaUrl(null)}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {fetchingPreview && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
              <Loader2 className="size-4 animate-spin" />
              Fetching link preview...
            </div>
          )}
          {linkPreview && !fetchingPreview && (
            <div className="mt-3 rounded-xl overflow-hidden border border-border/50 bg-card/80 cursor-pointer hover:border-brand-start/50 transition-colors">
              <a href={linkPreview.url} target="_blank" rel="noopener noreferrer" className="flex flex-col sm:flex-row">
                {linkPreview.image && (
                  <div className="sm:w-1/3 h-32 sm:h-auto bg-muted">
                    <img src={linkPreview.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 p-3">
                  <p className="text-xs font-bold text-brand-start mb-0.5">{linkPreview.siteName}</p>
                  <p className="font-semibold text-sm line-clamp-2">{linkPreview.title}</p>
                  {linkPreview.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{linkPreview.description}</p>
                  )}
                </div>
              </a>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting || uploading}
                className="flex items-center gap-1.5 rounded-full border border-border/40 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ImageIcon className="size-3.5" />
                )}
                {uploading ? "Uploading..." : "Image"}
              </button>

              <label className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs">
                <Sparkles className={cn("size-3.5", superYap ? "text-gold" : "text-muted-foreground")} />
                <span className={cn("font-bold uppercase tracking-wider", superYap ? "text-gold" : "text-muted-foreground")}>
                  Super
                </span>
                <Switch checked={superYap} onCheckedChange={setSuperYap} className="data-[state=checked]:bg-gold" />
              </label>

              <div className="inline-flex items-center gap-1 rounded-full border border-white/10 p-0.5 text-[11px]">
                <Rocket className="ml-1.5 size-3.5 text-muted-foreground" />
                {([0, 1, 6, 24] as const).map((h) => (
                  <button
                    key={h}
                    onClick={() => setBoostHours(h)}
                    className={cn(
                      "rounded-full px-2 py-0.5 font-semibold transition-colors",
                      boostHours === h ? "bg-brand text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {h === 0 ? "Off" : `${h}h`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "font-mono text-xs",
                  remaining < 0 ? "text-destructive" : remaining < 20 ? "text-gold" : "text-muted-foreground",
                )}
              >
                {remaining}
              </span>
              {(superYap || boostHours > 0) && (
                <span className="hidden sm:inline font-mono text-[11px] text-muted-foreground">
                  ✦ Premium Yap
                </span>
              )}
              {/* ✅ Tombol Yap dengan Font Display & Shadow Lebih Glow */}
              <button
                onClick={submit}
                disabled={(!text.trim() && !mediaUrl) || remaining < 0 || submitting || !user}
                className="btn-futuristic font-display text-base tracking-wide shadow-lg shadow-brand-start/25 hover:shadow-brand-start/50"
              >
                {submitting ? "Yapping…" : "Yap"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
