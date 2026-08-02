import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-store";
import { getQieBalance } from "@/lib/qie-chain";
import { API_BASE, fetchFeed } from "@/lib/posts";
import { ArrowLeft, Coins, TrendingUp, Users, Wallet, History, Percent, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ✅ BACA ALAMAT DEVELOPER DARI .ENV
const DEV_WALLET = import.meta.env.VITE_DEV_WALLET || "";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — QIE Yap" },
      { name: "description", content: "Your QIE Yap earnings and analytics." },
    ],
  }),
  component: DashboardPage,
});

interface TipRecord {
  id: string;
  amount: number;
  from_user_id: string;
  to_user_id: string;
  tx_hash: string | null;
  created_at: string;
}

function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTipsReceived: 0,
    totalYaps: 0,
    totalFollowers: 0,
    walletBalance: 0,
    platformFeeEarned: 0,
    tipsReceivedList: [] as TipRecord[],
  });

  // ✅ Cek apakah user yang login adalah Developer (dari .env)
  const isDev = user?.address?.toLowerCase() === DEV_WALLET.toLowerCase();

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // ✅ 1. Ambil data tips yang diterima user dari endpoint
      let tipsData: TipRecord[] = [];
      try {
        const tipsRes = await fetch(`${API_BASE}/tips/user/${user.id}?limit=50`);
        if (tipsRes.ok) {
          tipsData = await tipsRes.json();
          console.log("📦 Tips data from VPS:", tipsData);
        } else {
          console.warn("Tips endpoint returned status:", tipsRes.status);
        }
      } catch (err) {
        console.warn("Failed to fetch tips from VPS:", err);
      }

      // Hitung total amount
      const totalAmount = tipsData.reduce((sum, t) => sum + Number(t.amount), 0);
      const feeEarned = isDev ? totalAmount * 0.02 : 0;

      // ✅ 2. Ambil jumlah Yaps user (dari feed yang difilter)
      const allPosts = await fetchFeed("latest", user.id);
      const userYaps = allPosts.filter((p) => p.author.address === user.address);

      // ✅ 3. Balance on-chain
      const balance = await getQieBalance(user.address as `0x${string}`).catch(() => 0);

      // ✅ 4. Hitung followers (dari VPS)
      let followersCount = 0;
      try {
        const followsRes = await fetch(`${API_BASE}/follows?following_id=${user.id}&count=followers`);
        if (followsRes.ok) {
          const data = await followsRes.json();
          followersCount = data.count || 0;
        }
      } catch (err) {
        console.warn("Failed to fetch followers count");
      }

      setStats({
        totalTipsReceived: totalAmount,
        totalYaps: userYaps.length,
        totalFollowers: followersCount,
        walletBalance: balance,
        platformFeeEarned: feeEarned,
        tipsReceivedList: tipsData.slice(0, 10),
      });
    } catch (err) {
      console.error("Dashboard error:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-12">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-12 text-center">
          <Wallet className="mx-auto size-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Connect your wallet</h2>
          <p className="mt-2 text-muted-foreground">
            Please connect your QIE Wallet to view your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border/50 bg-card/50 p-6">
                <div className="h-8 w-32 rounded bg-muted" />
                <div className="mt-2 h-4 w-full rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatCard 
                icon={<Coins className="size-6 text-brand" />}
                label="Tips Received"
                value={`${stats.totalTipsReceived.toFixed(4)} QIE`}
              />
              {isDev && (
                <StatCard 
                  icon={<Percent className="size-6 text-gold" />}
                  label="Platform Fee (2%)"
                  value={`${stats.platformFeeEarned.toFixed(4)} QIE`}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatCard 
                icon={<TrendingUp className="size-6 text-brand" />}
                label="Total Yaps"
                value={`${stats.totalYaps}`}
              />
              <StatCard 
                icon={<Wallet className="size-6 text-brand" />}
                label="Wallet Balance"
                value={`${stats.walletBalance.toFixed(4)} QIE`}
              />
            </div>

            {/* ✅ TOMBOL WITHDRAW DIHAPUS KARENA TIPS LANGSUNG MASUK WALLET */}
            <div className="mb-6 rounded-xl border border-border bg-card/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Total Tips Received</p>
                  <p className="text-xl font-bold text-brand">{stats.totalTipsReceived.toFixed(4)} QIE</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  ✅ Tips are automatically credited to your wallet
                </div>
              </div>
            </div>

            {/* Recent Tips History */}
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <div className="flex items-center gap-2 mb-4">
                <History className="size-5 text-muted-foreground" />
                <h3 className="font-semibold">Recent Tips Received</h3>
              </div>
              {stats.tipsReceivedList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tips received yet. Start yapping and sharing!
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.tipsReceivedList.map((tip: TipRecord, index: number) => (
                    <div key={index} className="flex items-center justify-between border-b border-border/30 pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">
                          From: {tip.from_user_id ? `${tip.from_user_id.slice(0, 8)}...` : 'Anonymous'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tip.created_at).toLocaleDateString()} · {tip.tx_hash?.slice(0, 10)}...
                        </p>
                      </div>
                      <p className="text-sm font-bold text-brand">+{tip.amount} QIE</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}
