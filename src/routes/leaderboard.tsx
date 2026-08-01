import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Header } from "@/components/header";
import { Avatar } from "@/components/avatar-img";
import { StakingBadgeChip } from "@/components/staking-badge";
import { shortAddr, API_BASE } from "@/lib/posts";
import { cn } from "@/lib/utils";
import { Crown, Medal, User, ArrowUp, ArrowDown, Loader2 } from "lucide-react";

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
  isValidator: boolean;
}

function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"all" | "week">("all");

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        // 1. Ambil semua profil dari VPS
        let profiles: any[] = [];
        try {
          const res = await fetch(`${API_BASE}/profiles?limit=100`);
          if (res.ok) {
            profiles = await res.json();
          }
        } catch (err) {
          console.warn("Failed to fetch profiles");
        }

        if (!profiles.length) {
          setUsers([]);
          setLoading(false);
          return;
        }

        // 2. Ambil semua tips dari VPS (untuk menghitung total per user)
        let allTips: any[] = [];
        try {
          const res = await fetch(`${API_BASE}/tips?limit=500`);
          if (res.ok) {
            allTips = await res.json();
          }
        } catch (err) {
          console.warn("Failed to fetch tips");
        }

        // 3. Ambil semua postingan dari VPS (untuk menghitung yaps per user)
        let allPosts: any[] = [];
        try {
          const res = await fetch(`${API_BASE}/feed?limit=200`);
          if (res.ok) {
            allPosts = await res.json();
          }
        } catch (err) {
          console.warn("Failed to fetch posts");
        }

        // 4. Ambil semua follows dari VPS (untuk menghitung followers per user)
        let allFollows: any[] = [];
        try {
          const res = await fetch(`${API_BASE}/follows?limit=500`);
          if (res.ok) {
            allFollows = await res.json();
          }
        } catch (err) {
          console.warn("Failed to fetch follows");
        }

        // 5. Proses data: hitung statistik per user
        const userStats: Record<string, any> = {};

        // Inisialisasi semua profil
        profiles.forEach((p: any) => {
          userStats[p.id] = {
            id: p.id,
            address: p.address,
            displayName: p.display_name || p.address.slice(0, 8),
            username: p.username || p.address.slice(0, 8),
            avatarSeed: p.avatar_seed || p.address,
            badge: "shrimp",
            isValidator: Boolean(p.is_validator),
            totalTipsReceived: 0,
            yapCount: 0,
            followerCount: 0,
          };
        });

        // Hitung total tips yang diterima per user
        allTips.forEach((tip: any) => {
          const toUserId = tip.to_user_id;
          if (userStats[toUserId]) {
            userStats[toUserId].totalTipsReceived += Number(tip.amount || 0);
          }
        });

        // Hitung jumlah yaps per user (hanya post utama, bukan reply)
        allPosts.forEach((post: any) => {
          // Ambil author_id dari field author (object) atau author_id langsung
          let authorId = post.author_id;
          if (post.author && post.author.id) {
            authorId = post.author.id;
          }
          // Jika post adalah reply, jangan dihitung
          if (post.reply_to) return;
          
          if (userStats[authorId]) {
            userStats[authorId].yapCount += 1;
          }
        });

        // Hitung jumlah followers per user
        allFollows.forEach((follow: any) => {
          const followingId = follow.following_id;
          if (userStats[followingId]) {
            userStats[followingId].followerCount += 1;
          }
        });

        // 6. Konversi ke array dan urutkan berdasarkan totalTipsReceived
        let leaderboard = Object.values(userStats) as LeaderboardEntry[];
        
        // Filter hanya yang punya tips atau yaps (supaya tidak muncul user kosong)
        leaderboard = leaderboard.filter(
          (u) => u.totalTipsReceived > 0 || u.yapCount > 0
        );

        // Urutkan descending berdasarkan totalTipsReceived
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
                    {user.isValidator && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
                        Validator
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>@{user.username}</span>
                    <span>· {user.yapCount} Yaps</span>
                    <span>· {user.followerCount} Followers</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-brand">{user.totalTipsReceived.toFixed(4)} QIE</div>
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
