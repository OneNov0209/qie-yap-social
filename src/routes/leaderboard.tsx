import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy, BadgeCheck } from "lucide-react";
import { Header } from "@/components/header";
import { Avatar } from "@/components/avatar-img";
import { StakingBadgeChip } from "@/components/staking-badge";
import { supabase } from "@/integrations/supabase/client";
import { shortAddr } from "@/lib/posts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — QIE Yap" },
      { name: "description", content: "Top yappers on the QIE blockchain ecosystem." },
    ],
  }),
  component: LeaderboardPage,
});

interface Row {
  id: string;
  address: string;
  display_name: string;
  username: string;
  avatar_seed: string;
  is_validator: boolean;
  yap_count: number;
}

function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").limit(100);
      const { data: posts } = await supabase.from("posts").select("author_id").is("reply_to", null);
      if (!active) return;
      const counts = new Map<string, number>();
      (posts ?? []).forEach((p) => counts.set(p.author_id as string, (counts.get(p.author_id as string) ?? 0) + 1));
      const merged: Row[] = (profiles ?? []).map((p) => ({
        id: p.id as string,
        address: p.address as string,
        display_name: p.display_name as string,
        username: p.username as string,
        avatar_seed: (p.avatar_seed as string) ?? (p.address as string),
        is_validator: !!p.is_validator,
        yap_count: counts.get(p.id as string) ?? 0,
      })).sort((a, b) => b.yap_count - a.yap_count);
      setRows(merged);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

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

        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="yap-card p-12 text-center text-muted-foreground">
            No yappers yet. Be the first to sign in.
          </div>
        ) : (
          <ol className="yap-card divide-y divide-border overflow-hidden p-0">
            {rows.map((u, i) => (
              <li key={u.id}>
                <Link to="/profile/$address" params={{ address: u.address }}
                  className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-brand-soft/40">
                  <span className={cn(
                    "w-8 text-center font-display text-lg font-bold",
                    i === 0 ? "text-gold text-2xl" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-600" : "text-muted-foreground",
                  )}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <Avatar seed={u.avatar_seed} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold">{u.display_name}</span>
                      {u.is_validator && <BadgeCheck className="size-4 text-brand" />}
                      <StakingBadgeChip badge="shrimp" />
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground">{shortAddr(u.address)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold text-foreground">{u.yap_count}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">yaps</div>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
