import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Avatar } from "@/components/avatar-img";
import { StakingBadgeChip } from "@/components/staking-badge";
import { shortAddr, API_BASE } from "@/lib/posts";
import { cn } from "@/lib/utils";
import { Crown, Medal, TrendingUp, TrendingDown, Minus, Coins, MessageSquare, Users, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — QIE Yap" },
      { name: "description", content: "Top Yappers on QIE Mainnet." },
    ],
  }),
  component: LeaderboardPage,
});

interface LeaderboardEntry {
  id: string;
  address: string;
  displayName: string;
  username: string;
  avatarSeed: string;
  badge: string;
  totalTipsReceived: number;
  totalQieReceived: number;
  totalBroqReceived: number;
  yapCount: number;
  followerCount: number;
  isValidator: boolean;
  trend?: "up" | "down" | "same";
}

function LeaderboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"all" | "week">("all");

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/leaderboard?timeframe=${timeframe}&limit=50`);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Leaderboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [timeframe]);

  const RankIcon = ({ index }: { index: number }) => {
    if (index === 0) return <Crown className="size-6 text-gold drop-shadow-md" />;
    if (index === 1) return <Medal className="size-6 text-muted-foreground" />;
    if (index === 2) return <Medal className="size-6 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground/40">#{index + 1}</span>;
  };

  const Trend = ({ trend }: { trend?: "up" | "down" | "same" }) => {
    if (trend === "up") return <TrendingUp className="size-4 text-emerald-500" />;
    if (trend === "down") return <TrendingDown className="size-4 text-red-500" />;
    return <Minus className="size-4 text-muted-foreground/40" />;
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.history.back()} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="size-5" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold">Leaderboard</h1>
              <p className="text-sm text-muted-foreground">Top creators on QIE Mainnet</p>
            </div>
          </div>
          <div className="flex gap-1 rounded-full bg-muted p-1">
            <button
              onClick={() => setTimeframe("all")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                timeframe === "all" ? "bg-brand text-white shadow-md" : "text-muted-foreground hover:text-foreground"
              )}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeframe("week")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                timeframe === "week" ? "bg-brand text-white shadow-md" : "text-muted-foreground hover:text-foreground"
              )}
            >
              This Week
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border/50 bg-card/50 p-4">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-muted" />
                    <div className="h-3 w-20 rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-brand-soft text-2xl">🏆</div>
            <h3 className="font-display text-lg font-semibold">No data yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start yapping and tipping to see the leaderboard!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user, index) => (
              <Link
                key={user.id}
                to="/profile/$address"
                params={{ address: user.address }}
                className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-card/50 p-4 transition-all hover:bg-card/80 hover:scale-[1.005] hover:shadow-md"
              >
                <div className="flex w-10 justify-center">
                  <RankIcon index={index} />
                </div>

                <Avatar seed={user.avatarSeed} size={44} className="ring-2 ring-background" />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold truncate text-foreground group-hover:text-brand-start transition-colors">
                      {user.displayName}
                    </span>
                    <StakingBadgeChip badge={user.badge as any} />
                    {user.isValidator && (
                      <span className="px-1.5 py-0.5 rounded-full bg-brand/10 text-[9px] font-bold uppercase tracking-wider text-brand border border-brand/20">
                        Validator
                      </span>
                    )}
                    <Trend trend={user.trend || "same"} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                    <span>@{user.username}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="size-3" />
                      {user.yapCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-3" />
                      {user.followerCount}
                    </span>
                  </div>
                </div>

                {/* ✅ 2 KOLOM: QIE + BROQ */}
                <div className="text-right flex flex-col gap-1">
                  <div className="flex items-center justify-end gap-1 text-sm font-bold text-brand">
                    <Coins className="size-4" />
                    {(user.totalQieReceived || user.totalTipsReceived || 0).toFixed(4)} QIE
                  </div>
                  {(user.totalBroqReceived || 0) > 0 && (
                    <div className="flex items-center justify-end gap-1 text-xs font-bold text-purple-500">
                      <Coins className="size-3" />
                      {(user.totalBroqReceived || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} BROQ
                    </div>
                  )}
                  <div className="text-[10px] text-muted-foreground">Tips Received</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
