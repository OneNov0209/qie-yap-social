import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-store";
import { getQieBalance } from "@/lib/qie-chain";
import { API_BASE } from "@/lib/posts";
import { ArrowLeft, Coins, TrendingUp, Users, Wallet, History, Percent, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BROQ_TOKEN } from "@/lib/tokens";

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

interface RecentTip {
  id: string;
  amount: number;
  token_type: 'QIE' | 'BROQ';
  tx_hash: string | null;
  created_at: string;
  from_user: {
    id: string;
    address: string;
    display_name: string;
    avatar_seed: string;
  } | null;
}

interface DashboardStats {
  qie: { total_received: number; count: number };
  broq: { total_received: number; count: number };
  posts: { total: number };
  followers: number;
  following: number;
  recent_tips: RecentTip[];
}

function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const isDev = user?.address?.toLowerCase() === DEV_WALLET.toLowerCase();

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // ✅ Stats dari backend (QIE + BROQ + posts + followers)
      const res = await fetch(`${API_BASE}/dashboard/${user.id}`);
      if (!res.ok) throw new Error(`Dashboard API error: ${res.status}`);
      const data = await res.json();
      setStats(data);

      // ✅ Wallet balance on-chain
      const balance = await getQieBalance(user.address as `0x${string}`).catch(() => 0);
      setWalletBalance(balance);
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

  // Hitung fee hanya dari tips QIE (BROQ tidak ada fee)
  const qieTotal = stats?.qie.total_received || 0;
  const platformFeeEarned = isDev ? qieTotal * 0.02 : 0;

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
            {/* === TIPS RECEIVED === */}
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Tips Received
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatCard
                icon={<Coins className="size-6 text-brand" />}
                label="QIE Tips"
                value={`${qieTotal.toFixed(4)} QIE`}
                sub={`${stats?.qie.count || 0} tips`}
              />
              <StatCard
                icon={<Coins className="size-6 text-purple-500" />}
                label="BROQ Tips"
                value={`${(stats?.broq.total_received || 0).toLocaleString('id-ID')} BROQ`}
                sub={`${stats?.broq.count || 0} tips`}
              />
            </div>

            {/* === DEV FEE (hanya untuk dev wallet) === */}
            {isDev && (
              <>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Platform Earnings
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <StatCard
                    icon={<Percent className="size-6 text-gold" />}
                    label="Platform Fee (2% QIE)"
                    value={`${platformFeeEarned.toFixed(4)} QIE`}
                    sub="Only from QIE tips"
                  />
                  <StatCard
                    icon={<Wallet className="size-6 text-brand" />}
                    label="Wallet Balance"
                    value={`${walletBalance.toFixed(4)} QIE`}
                    sub="On-chain balance"
                  />
                </div>
              </>
            )}

            {/* === ACTIVITY === */}
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Activity
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <StatCard
                icon={<TrendingUp className="size-5 text-brand" />}
                label="Yaps"
                value={`${stats?.posts.total || 0}`}
              />
              <StatCard
                icon={<Users className="size-5 text-brand" />}
                label="Followers"
                value={`${stats?.followers || 0}`}
              />
              <StatCard
                icon={<Users className="size-5 text-brand" />}
                label="Following"
                value={`${stats?.following || 0}`}
              />
            </div>

            {/* === RECENT TIPS === */}
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <div className="flex items-center gap-2 mb-4">
                <History className="size-5 text-muted-foreground" />
                <h3 className="font-semibold">Recent Tips Received</h3>
              </div>
              {!stats?.recent_tips || stats.recent_tips.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tips received yet. Start yapping and sharing!
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.recent_tips.map((tip) => (
                    <div
                      key={tip.id}
                      className="flex items-center justify-between border-b border-border/30 pb-2 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-gradient-to-br from-brand to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                          {tip.from_user?.display_name?.slice(0, 2).toUpperCase() || '??'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {tip.from_user?.display_name || 'Anonymous'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tip.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${tip.token_type === 'BROQ' ? 'text-purple-500' : 'text-brand'}`}>
                          +{Number(tip.amount).toLocaleString('id-ID', { maximumFractionDigits: 4 })} {tip.token_type}
                        </p>
                      </div>
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

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="mt-2 text-xl font-bold">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
