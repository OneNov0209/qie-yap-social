import { useState, useEffect, useRef } from "react";
import { Sparkles, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "./avatar-img";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createPost } from "@/lib/posts";

const MAX = 280;

export function Composer({ onPosted }: { onPosted?: () => void }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [superYap, setSuperYap] = useState(false);
  const [boostHours, setBoostHours] = useState<0 | 1 | 6 | 24>(0);
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "n" && !e.metaKey && !e.ctrlKey &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        document.activeElement?.tagName !== "INPUT"
      ) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = async () => {
    if (!user) return toast("Connect your wallet to yap");
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await createPost({
        content: text.trim(),
        isSuperYap: superYap,
        isBoosted: boostHours > 0,
        boostHours,
      });
      const desc: string[] = [];
      if (superYap) desc.push("Super Yap");
      if (boostHours) desc.push(`Boost ${boostHours}h`);
      toast.success("Yap posted!", { description: desc.join(" · ") || "Visible to the QIE feed" });
      setText("");
      setSuperYap(false);
      setBoostHours(0);
      onPosted?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to post");
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = MAX - text.length;
  const boostCost = boostHours === 1 ? 50 : boostHours === 6 ? 200 : boostHours === 24 ? 500 : 0;

  return (
    <div className="mb-6 yap-card p-4">
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

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1 text-xs">
                <Sparkles className={cn("size-3.5", superYap ? "text-gold" : "text-muted-foreground")} />
                <span className={cn("font-bold uppercase tracking-wider", superYap ? "text-gold" : "text-muted-foreground")}>
                  Super
                </span>
                <Switch checked={superYap} onCheckedChange={setSuperYap} className="data-[state=checked]:bg-gold" />
              </label>

              <div className="inline-flex items-center gap-1 rounded-full border border-border p-0.5 text-[11px]">
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
                  ≈ {(superYap ? 10 : 0) + boostCost} QIE
                </span>
              )}
              <Button
                onClick={submit}
                disabled={!text.trim() || remaining < 0 || submitting || !user}
                className="rounded-full bg-brand px-6 font-bold text-primary-foreground hover:bg-brand/90 disabled:opacity-40"
              >
                {submitting ? "Yapping…" : "Yap"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
