import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Avatar } from "@/components/avatar-img";
import { StakingBadgeChip } from "@/components/staking-badge";
import { supabase } from "@/integrations/supabase/client";
import { shortAddr } from "@/lib/posts";
import { cn } from "@/lib/utils";
import { Crown, Medal, User, ArrowUp, ArrowDown } from "lucide-react";

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
  yapCount: number;
  followerCount: number;
}

function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"all" | "week">("all");

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        // Ambil semua profil
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, address, display_name, username, avatar_seed, is_validator");

        if (!profiles) return;

        // Ambil statistik untuk setiap user
        const leaderboard = await Promise.all(
          profiles.map(async (p) => {
            const [tipsReceived, yaps, followers] = await Promise.all([
              supabase
                .from("tips")
                .select("amount", { count: "exact", head: true })
                .eq("to_user_id", p.id),
              supabase
                .from("posts")
                .select("id", { count: "exact", head: true })
                .eq("author_id", p.id)
                .is("reply_to", null),
              supabase
                .from("follows")
                .select("follower_id", { count: "exact", head: true })
                .eq("following_id", p.id),
            ]);

            return {
              id: p.id,
              address: p.address,
              displayName: p.display_name,
              username: p.username,
              avatarSeed: p.avatar_seed,
              badge: "shrimp",
              totalTipsReceived: tipsReceived.count || 0,
              yapCount: yaps.count || 0,
              followerCount: followers.count || 0,
            };
          })
        );

        // Urutkan berdasarkan total tip diterima (descending)
        leaderboard.sort((a, b) => b.totalTipsReceived - a.totalTipsReceived);
        setUsers(leaderboard.slice(0, 50));
      } catch (err) {
        console.error("Leaderboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [timeframe]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold">Leaderboard</h1>
          <div className="flex gap-2 rounded-full bg-muted p-1">
            <button
              onClick={() => setTimeframe("all")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                timeframe === "all" ? "bg-brand text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeframe("week")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                timeframe === "week" ? "bg-brand text-white" : "text-muted-foreground hover:text-foreground"
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
            <h3 className="font-display text-lg font-semibold">No yappers yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start yapping and tipping to climb the ranks!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user, index) => (
              <Link
                key={user.id}
                to="/profile/$address"
                params={{ address: user.address }}
                className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 p-4 transition-colors hover:bg-card/80"
              >
                <div className="flex w-8 items-center justify-center text-lg font-bold">
                  {index === 0 ? (
                    <Crown className="size-6 text-gold" />
                  ) : index === 1 ? (
                    <Medal className="size-6 text-muted-foreground" />
                  ) : index === 2 ? (
                    <Medal className="size-6 text-amber-600" />
                  ) : (
                    <span className="text-sm text-muted-foreground">#{index + 1}</span>
                  )}
                </div>
                <Avatar seed={user.avatarSeed} size={40} className="ring-1 ring-border" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{user.displayName}</span>
                    <StakingBadgeChip badge={user.badge as any} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>@{user.username}</span>
                    <span>· {user.yapCount} Yaps</span>
                    <span>· {user.followerCount} Followers</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-brand">{user.totalTipsReceived} QIE</div>
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
