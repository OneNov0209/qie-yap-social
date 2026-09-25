import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Avatar } from "@/components/avatar-img";
import { API_BASE, shortAddr } from "@/lib/posts";
import { useAuth } from "@/lib/auth-store";
import { Copy, Share2, Users, Trophy, Loader2, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/referrals")({
  head: () => ({
    meta: [
      { title: "Referrals — QIE Yap" },
      { name: "description", content: "Invite friends and grow your reputation." },
    ],
  }),
  component: ReferralsPage,
});

function ReferralsPage() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState("");

  useEffect(() => {
    if (!user) return;
    setReferralLink(`https://qie.yap.onenov.xyz/?ref=${user.address}`);

    const fetchReferrals = async () => {
      try {
        const res = await fetch(`${API_BASE}/referrals/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setReferrals(data);
        }
      } catch (err) {
        console.error("Error fetching referrals:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReferrals();
  }, [user]);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      toast.success("Referral link copied!");
    });
  };

  const shareToX = () => {
    const text = `Join me on QIE Yap — the reputation layer of QIE! 🚀 Earn QIE, build your on-chain résumé.`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`;
    window.open(url, "_blank");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-12">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Connect your wallet</h1>
          <p className="mt-2 text-muted-foreground">Please connect your QIE wallet to see your referrals.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="size-6 text-brand" />
          <h1 className="font-display text-2xl font-bold">Referrals</h1>
        </div>

        {/* Referral Link Box */}
        <div className="rounded-2xl border border-border/50 bg-card/50 p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Share2 className="size-5 text-brand" />
            <h2 className="font-semibold">Your Referral Link</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Share this link and earn <strong className="text-brand">+10 Contributor Score</strong> for every user who registers!
          </p>
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-xs font-mono break-all">
              {referralLink}
            </div>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 transition-colors"
            >
              <Copy className="size-4" />
              Copy
            </button>
          </div>
          <button
            onClick={shareToX}
            className="mt-3 flex items-center justify-center gap-2 w-full rounded-xl border border-border/50 px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            <span className="text-lg">𝕏</span>
            Share on X
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl border border-border bg-card/50 p-4 text-center">
            <Users className="mx-auto size-5 text-brand mb-1" />
            <p className="text-2xl font-bold">{referrals.length}</p>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total Referrals</p>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-4 text-center">
            <Trophy className="mx-auto size-5 text-brand mb-1" />
            <p className="text-2xl font-bold">{referrals.length * 10}</p>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Score Earned</p>
          </div>
        </div>

        {/* Referral List */}
        <h2 className="font-semibold mb-3">Your Referrals ({referrals.length})</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-brand" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <LinkIcon className="mx-auto size-10 text-muted-foreground mb-2" />
            <h3 className="font-semibold">No referrals yet</h3>
            <p className="text-sm text-muted-foreground">Share your link to start earning score!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((ref) => (
              <div key={ref.id} className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-3">
                <Avatar seed={ref.avatar_seed || ref.address} size={40} />
                <div className="flex-1">
                  <p className="font-medium">{ref.display_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground font-mono">{shortAddr(ref.address)}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(ref.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
