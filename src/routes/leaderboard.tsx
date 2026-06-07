import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Trophy, BadgeCheck } from "lucide-react";
import { Header } from "@/components/header";
import { Avatar } from "@/components/avatar-img";
import { StakingBadgeChip } from "@/components/staking-badge";
import { MOCK_USERS, shortAddr } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — QIE Yap" },
      { name: "description", content: "Top yappers, stakers, and earners on the QIE blockchain ecosystem." },
    ],
  }),
  component: LeaderboardPage,
});

type Metric = "yaps" | "stakers" | "earners";
type Period = "weekly" | "monthly" | "all";

function LeaderboardPage() {
  const [metric, setMetric] = useState<Metric>("yaps");
  const [period, setPeriod] = useState<Period>("weekly");

  const factor = period === "weekly" ? 0.15 : period === "monthly" ? 0.55 : 1;

  const ranked = useMemo(() => {
    const arr = [...MOCK_USERS];
    arr.sort((a, b) => {
      if (metric === "yaps") return b.yaps - a.yaps;
      if (metric === "stakers") {
        const order = ["shrimp", "fish", "dolphin", "shark", "whale"];
        return order.indexOf(b.badge) - order.indexOf(a.badge) || b.followers - a.followers;
      }
      return b.tipsReceived - a.tipsReceived;
    });
    return arr;
  }, [metric]);

  const value = (u: typeof MOCK_USERS[0]) => {
    if (metric === "yaps") return `${Math.round(u.yaps * factor).toLocaleString()} yaps`;
    if (metric === "stakers") return `${Math.round(u.followers * 12 * factor).toLocaleString()} QIE`;
    return `${Math.round(u.tipsReceived * factor).toLocaleString()} QIE`;
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-brand to-pink-400 text-primary-foreground shadow-lg shadow-brand/30">
            <Trophy className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">QIE Yap Leaderboard</h1>
            <p className="text-sm text-muted-foreground">The most active yappers in the ecosystem.</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-border bg-card p-0.5">
            {(["yaps", "stakers", "earners"] as Metric[]).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors",
                  metric === m ? "bg-brand text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                Top {m}
              </button>
            ))}
          </div>
          <div className="ml-auto flex rounded-full border border-border bg-card p-0.5">
            {(["weekly", "monthly", "all"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                  period === p ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p === "all" ? "All-time" : p}
              </button>
            ))}
          </div>
        </div>

        <ol className="yap-card divide-y divide-border overflow-hidden p-0">
          {ranked.map((u, i) => (
            <li key={u.address}>
              <Link
                to="/profile/$address"
                params={{ address: u.address }}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-brand-soft/40"
              >
                <span
                  className={cn(
                    "w-8 text-center font-display text-lg font-bold",
                    i === 0 && "text-2xl",
                    i === 0 ? "text-gold" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-600" : "text-muted-foreground",
                  )}
                >
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </span>
                <Avatar seed={u.avatarSeed} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold">{u.displayName}</span>
                    {u.isValidator && <BadgeCheck className="size-4 text-brand" />}
                    <StakingBadgeChip badge={u.badge} />
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {shortAddr(u.address)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-foreground">{value(u)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{period}</div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
