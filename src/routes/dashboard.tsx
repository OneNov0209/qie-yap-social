import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { getQieBalance, QIE_YAP_ABI, getWalletClient } from "@/lib/qie-chain";
import { ArrowLeft, Coins, TrendingUp, Users, Wallet, History, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
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

function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTipsReceived: 0,
    totalYaps: 0,
    totalFollowers: 0,
    walletBalance: 0,
    platformFeeEarned: 0,
    tipsReceivedList: [] as any[],
  });
  const [withdrawing, setWithdrawing] = useState(false);

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
      const { data: tipsReceived } = await supabase
        .from("tips")
        .select("amount, from_user_id, created_at, tx_hash")
        .eq("to_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      const tipsData = tipsReceived || [];
      const totalAmount = tipsData.reduce((sum: number, t: any) => sum + Number(t.amount), 0);

      // ✅ Hanya Dev yang bisa melihat fee
      const feeEarned = isDev ? totalAmount * 0.02 : 0;

      const [yaps, followers, balance] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", user.id),
        supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", user.id),
        getQieBalance(user.address as `0x${string}`).catch(() => 0),
      ]);

      setStats({
        totalTipsReceived: totalAmount,
        totalYaps: yaps.count || 0,
        totalFollowers: followers.count || 0,
        walletBalance: balance,
        platformFeeEarned: feeEarned,
        tipsReceivedList: tipsData.slice(0, 10),
      });
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user) return toast.error("Please connect your wallet");
    if (stats.totalTipsReceived === 0) return toast.error("No tips to withdraw");
    if (withdrawing) return;

    setWithdrawing(true);
    try {
      const contractAddress = import.meta.env.VITE_QIE_YAP_CONTRACT as `0x${string}`;
      const { walletClient } = await getWalletClient();
      
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: QIE_YAP_ABI,
        functionName: "withdrawTips",
        account: user.address as `0x${string}`,
      });
      
      toast.success(`Withdraw successful! Tx: ${hash.slice(0, 10)}...`);
      await loadDashboard();
    } catch (err: any) {
      toast.error(err.message || "Withdraw failed");
    } finally {
      setWithdrawing(false);
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
            Please connect your wallet to view your dashboard.
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
            {[1, 2, 3].map((i) => (
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
                  label="Platform Fee Earned (2%)"
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

            <div className="mb-6 rounded-xl border border-border bg-card/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Withdrawable Tips</p>
                  <p className="text-xl font-bold text-brand">{stats.totalTipsReceived.toFixed(4)} QIE</p>
                </div>
                <Button
                  onClick={handleWithdraw}
                  disabled={withdrawing || stats.totalTipsReceived === 0}
                  className="bg-brand hover:bg-brand/90"
                >
                  {withdrawing ? "Processing..." : "Withdraw All"}
                </Button>
              </div>
            </div>

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
                  {stats.tipsReceivedList.map((tip: any, index: number) => (
                    <div key={index} className="flex items-center justify-between border-b border-border/30 pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">
                          From: {tip.from_user_id ? tip.from_user_id.slice(0, 8) + '...' : 'Anonymous'}
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
