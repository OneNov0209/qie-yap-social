import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { getQieBalance, qiePublicClient, QIE_YAP_ABI, getWalletClient } from "@/lib/qie-chain";
import { ArrowLeft, Coins, TrendingUp, Users, Wallet, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatEther, parseEther } from "viem";

// Import Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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
    tipsReceivedList: [] as any[],
    weeklyTips: [] as number[],
    weeklyLabels: [] as string[],
  });
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [tipsReceived, yaps, followers, balance] = await Promise.all([
        supabase.from("tips").select("amount, from_user_id, created_at, tx_hash").eq("to_user_id", user.id).order("created_at", { ascending: false }).limit(50),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", user.id),
        supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", user.id),
        getQieBalance(user.address as `0x${string}`).catch(() => 0),
      ]);

      const tipsData = tipsReceived.data || [];
      const totalAmount = tipsData.reduce((sum: number, t: any) => sum + Number(t.amount), 0);

      // Hitung data mingguan untuk Line Chart
      const weeklyData: Record<string, number> = {};
      tipsData.forEach((tip: any) => {
        const date = new Date(tip.created_at);
        const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + (date.getDay() || 7) - 1) / 7)}`;
        weeklyData[weekKey] = (weeklyData[weekKey] || 0) + Number(tip.amount);
      });

      const sortedWeeks = Object.keys(weeklyData).sort();
      const weeklyTips = sortedWeeks.map((w) => weeklyData[w]);
      const weeklyLabels = sortedWeeks.map((w) => `Week ${w.split('-W')[1]}`);

      setStats({
        totalTipsReceived: totalAmount,
        totalYaps: yaps.count || 0,
        totalFollowers: followers.count || 0,
        walletBalance: balance,
        tipsReceivedList: tipsData.slice(0, 10),
        weeklyTips,
        weeklyLabels: weeklyLabels.length > 0 ? weeklyLabels : ['No data yet'],
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
      const walletClient = await getWalletClient();
      
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

  // Data untuk Line Chart
  const lineChartData = {
    labels: stats.weeklyLabels,
    datasets: [
      {
        label: 'Tips Received (QIE)',
        data: stats.weeklyTips,
        borderColor: 'rgb(236, 72, 153)', // Warna pink brand
        backgroundColor: 'rgba(236, 72, 153, 0.2)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(236, 72, 153)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(156, 163, 175)',
          font: { size: 11 },
        },
      },
      title: {
        display: true,
        text: 'Weekly Tips Trend',
        color: 'rgb(229, 231, 235)',
        font: { size: 14, weight: 'bold' },
      },
    },
    scales: {
      y: {
        ticks: { color: 'rgb(156, 163, 175)' },
        grid: { color: 'rgba(156, 163, 175, 0.1)' },
      },
      x: {
        ticks: { color: 'rgb(156, 163, 175)' },
        grid: { color: 'rgba(156, 163, 175, 0.1)' },
      },
    },
  };

  // Data untuk Pie / Donut Chart
  const pieChartData = {
    labels: ['Tips Received', 'Super Yaps', 'Boosts'],
    datasets: [
      {
        label: 'Earnings Distribution',
        data: [
          stats.totalTipsReceived || 0,
          stats.totalYaps > 0 ? 5 : 0, // Simulasi: Super Yaps = 5 QIE
          stats.totalYaps > 0 ? 3 : 0, // Simulasi: Boosts = 3 QIE
        ],
        backgroundColor: [
          'rgba(236, 72, 153, 0.8)',  // Pink
          'rgba(234, 179, 8, 0.8)',   // Gold
          'rgba(59, 130, 246, 0.8)',  // Blue
        ],
        borderColor: [
          'rgb(236, 72, 153)',
          'rgb(234, 179, 8)',
          'rgb(59, 130, 246)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: 'rgb(156, 163, 175)',
          font: { size: 11 },
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'Earnings Distribution',
        color: 'rgb(229, 231, 235)',
        font: { size: 14, weight: 'bold' },
      },
    },
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
            {/* Statistik Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatCard 
                icon={<Coins className="size-6 text-brand" />}
                label="Tips Received"
                value={`${stats.totalTipsReceived.toFixed(4)} QIE`}
              />
              <StatCard 
                icon={<TrendingUp className="size-6 text-brand" />}
                label="Total Yaps"
                value={`${stats.totalYaps}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatCard 
                icon={<Users className="size-6 text-brand" />}
                label="Followers"
                value={`${stats.totalFollowers}`}
              />
              <StatCard 
                icon={<Wallet className="size-6 text-brand" />}
                label="Wallet Balance"
                value={`${stats.walletBalance.toFixed(4)} QIE`}
              />
            </div>

            {/* Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="rounded-xl border border-border bg-card/50 p-4">
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
              <div className="rounded-xl border border-border bg-card/50 p-4">
                <Pie data={pieChartData} options={pieChartOptions} />
              </div>
            </div>

            {/* Tombol Withdraw */}
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

            {/* Riwayat Transaksi */}
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
