import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Twitter, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-store";
import { startTwitterOAuth, getMyTwitterLink } from "@/lib/api/twitter.functions";
import { toast } from "sonner";

export function RegisterXButton() {
  const { user } = useAuth();
  const start = useServerFn(startTwitterOAuth);
  const getLink = useServerFn(getMyTwitterLink);
  const [link, setLink] = useState<{ twitter_username: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { setLink(null); return; }
    getLink().then((l) => setLink(l as { twitter_username: string } | null)).catch(() => {});
  }, [user, getLink]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const ok = p.get("twitter_linked");
    const err = p.get("twitter_error");
    if (ok) {
      toast.success(`X linked: @${ok}`);
      setLink({ twitter_username: ok });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (err) {
      toast.error(decodeURIComponent(err));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  if (!user) return null;

  if (link) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
        <Check className="size-3" /> @{link.twitter_username}
      </span>
    );
  }

  const connect = async () => {
    setLoading(true);
    try {
      const { url } = await start({
        data: { walletAddress: user.address, origin: window.location.origin },
      });
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start X auth");
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={connect}
      disabled={loading}
      size="sm"
      variant="outline"
      className="rounded-full border-brand/30 text-brand hover:bg-brand-soft"
    >
      <Twitter className="mr-1 size-3.5" />
      {loading ? "Redirecting…" : "Connect X"}
    </Button>
  );
}
