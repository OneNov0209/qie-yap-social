import { useState, useEffect, useRef } from "react";
import { Sparkles, Rocket, Link2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "./avatar-img";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createPost, API_BASE } from "@/lib/posts";
import { submitYapOnChain, YAP_CONTRACT, hashContent } from "@/lib/yap-onchain";

const MAX = 280;

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
  const [onChain, setOnChain] = useState<boolean>(!!YAP_CONTRACT);
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyToId) ref.current?.focus();
  }, [replyToId]);

  const submit = async () => {
    if (!user) return toast("Connect your wallet to yap");
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      let txHash: string | null = null;
      let cHash: string | null = null;
      if (onChain && YAP_CONTRACT) {
        try {
          toast("Sign the on-chain yap in your wallet…");
          const r = await submitYapOnChain(user.address as `0x${string}`, text.trim());
          txHash = r.txHash;
          cHash = r.contentHash;
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "On-chain yap failed — posting off-chain");
          cHash = hashContent(text.trim());
        }
      } else {
        cHash = hashContent(text.trim());
      }
      
      // ✅ 1. Simpan post ke tabel posts
      const newPost = await createPost(
        {
          content: text.trim(),
          isSuperYap: superYap,
          isBoosted: boostHours > 0,
          boostHours,
          txHash,
          contentHash: cHash,
          replyToId,
          onChain: onChain,
        },
        user.id
      );

      // ✅ 2. Jika ini reply/comment, simpan juga ke tabel comments (agar muncul di Admin Panel)
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
          console.warn("Comment save to comments table failed:", err);
          // Tidak perlu toast error, karena post utama sudah tersimpan
        }
      }

      const desc: string[] = [];
      if (txHash) desc.push("On-chain ✓");
      if (superYap) desc.push("Super Yap");
      if (boostHours) desc.push(`Boost ${boostHours}h`);
      toast.success("Yap posted!", { description: desc.join(" · ") || "Visible to the QIE feed" });
      setText("");
      setSuperYap(false);
      setBoostHours(0);
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
    <div className="mb-6 yap-card p-4 border-l-4 border-brand/50">
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
            disabled={!user || submitting}
            className="w-full resize-none border-none bg-transparent p-0 text-lg outline-none placeholder:text-muted-foreground disabled:opacity-70"
            rows={3}
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <div className="flex flex-wrap items-center gap-3">
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

              {YAP_CONTRACT && (
                <label className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs">
                  <Link2 className={cn("size-3.5", onChain ? "text-brand" : "text-muted-foreground")} />
                  <span className={cn("font-bold uppercase tracking-wider", onChain ? "text-brand" : "text-muted-foreground")}>
                    On-chain
                  </span>
                  <Switch checked={onChain} onCheckedChange={setOnChain} className="data-[state=checked]:bg-brand" />
                </label>
              )}
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
              <button
                onClick={submit}
                disabled={!text.trim() || remaining < 0 || submitting || !user}
                className="btn-futuristic"
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
