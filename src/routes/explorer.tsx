import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { supabase } from "@/integrations/supabase/client";
import { shortAddr } from "@/lib/posts";
import { ArrowLeft, Coins, Sparkles, Zap, ExternalLink, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/explorer")({
  head: () => ({
    meta: [
      { title: "Explorer — QIE Yap" },
      { name: "description", content: "Explore on-chain activity on QIE Mainnet." },
    ],
  }),
  component: ExplorerPage,
});

function ExplorerPage() {
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "tip" | "super_yap" | "boost">("all");
  const [stats, setStats] = useState({
    totalTips: 0,
    totalSuperYaps: 0,
    totalBoosts: 0,
    totalQIE: 0,
  });

  useEffect(() => {
    loadExplorer();
  }, []);

  const loadExplorer = async () => {
    setLoading(true);
    try {
      // Ambil semua tips
      const { data: tips, error: tipsError } = await supabase
        .from("tips")
        .select("id, amount, from_user_id, to_user_id, tx_hash, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      // Ambil semua super yap (tx_hash tidak null)
      const { data: superYaps, error: superError } = await supabase
        .from("posts")
        .select("id, author_id, tx_hash, created_at")
        .eq("is_super_yap", true)
        .not("tx_hash", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);

      // Ambil semua boost (tx_hash tidak null)
      const { data: boosts, error: boostError } = await supabase
        .from("posts")
        .select("id, author_id, tx_hash, created_at")
        .eq("is_boosted", true)
        .not("tx_hash", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);

      // Gabungkan semua transaksi
      const allTxs = [
        ...(tips || []).map((t: any) => ({ ...t, type: "tip" })),
        ...(superYaps || []).map((t: any) => ({ ...t, type: "super_yap", from_user_id: t.author_id, amount: 0 })),
        ...(boosts || []).map((t: any) => ({ ...t, type: "boost", from_user_id: t.author_id, amount: 0 })),
      ];

      // Urutkan berdasarkan waktu (terbaru di atas)
      allTxs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Hitung statistik
      const totalTips = (tips || []).reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      const totalSuperYaps = (superYaps || []).length;
      const totalBoosts = (boosts || []).length;

      setTxs(allTxs.slice(0, 50));
      setStats({
        totalTips,
        totalSuperYaps,
        totalBoosts,
        totalQIE: totalTips,
      });
    } catch (err) {
      console.error("Explorer error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTxs = filter === "all" ? txs : txs.filter((tx) => tx.type === filter);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="font-display text-2xl font-bold">On-Chain Explorer</h1>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard 
            icon={<Coins className="size-5 text-brand" />}
            label="Tips"
            value={`${stats.totalTips.toFixed(4)} QIE`}
          />
          <StatCard 
            icon={<Sparkles className="size-5 text-gold" />}
            label="Super Yaps"
            value={`${stats.totalSuperYaps}`}
          />
          <StatCard 
            icon={<Zap className="size-5 text-brand" />}
            label="Boosts"
            value={`${stats.totalBoosts}`}
          />
        </div>

        <div className="flex gap-2 mb-6">
          {["all", "tip", "super_yap", "boost"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                filter === f 
                  ? "bg-brand text-white" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {f === "all" ? "All" : f === "super_yap" ? "Super Yap" : f.charAt(0).toUpperCase() + f.slice(1)}s
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border/50 bg-card/50 p-4">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="mt-2 h-3 w-20 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : filteredTxs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-muted text-2xl">🔍</div>
            <h3 className="font-display text-lg font-semibold">No transactions found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first to make an on-chain transaction!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTxs.map((tx, index) => (
              <div key={index} className="rounded-xl border border-border/50 bg-card/50 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "rounded-full p-1.5",
                      tx.type === "tip" ? "bg-brand/20" : 
                      tx.type === "super_yap" ? "bg-gold/20" : "bg-blue-500/20"
                    )}>
                      {tx.type === "tip" ? (
                        <Coins className="size-4 text-brand" />
                      ) : tx.type === "super_yap" ? (
                        <Sparkles className="size-4 text-gold" />
                      ) : (
                        <Zap className="size-4 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {tx.type === "tip" 
                          ? `Tip from ${shortAddr(tx.from_user_id)} → ${shortAddr(tx.to_user_id)}`
                          : tx.type === "super_yap"
                          ? `Super Yap by ${shortAddr(tx.from_user_id)}`
                          : `Boost by ${shortAddr(tx.from_user_id)}`
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()} · {new Date(tx.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {tx.amount > 0 && (
                      <span className="text-sm font-bold text-brand">+{tx.amount} QIE</span>
                    )}
                    {tx.tx_hash && (
                      <a
                        href={`https://qie.explorer.onenov.xyz/tx/${tx.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
