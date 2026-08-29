import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { shortAddr, API_BASE, fetchFeed, relativeTime } from "@/lib/posts";
import { ArrowLeft, Coins, Sparkles, Zap, ExternalLink, MessageCircle, Loader2, Hash, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/explorer")({
  head: () => ({
    meta: [
      { title: "Explorer — QIE Yap" },
      { name: "description", content: "Explore on-chain activity on QIE Mainnet." },
    ],
  }),
  component: ExplorerPage,
});

interface ExplorerTx {
  id: string;
  type: "tip" | "yap" | "super_yap" | "boost";
  from_user_id: string;
  to_user_id?: string;
  amount?: number;
  tx_hash: string | null;
  created_at: string;
  content?: string;
  author_display_name?: string;
  recipient_display_name?: string;
}

function ExplorerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [txs, setTxs] = useState<ExplorerTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "tip" | "super_yap" | "boost" | "yap">("all");
  const [stats, setStats] = useState({
    totalTips: 0,
    totalSuperYaps: 0,
    totalBoosts: 0,
    totalYaps: 0,
    totalQIE: 0,
  });

  useEffect(() => {
    loadExplorer();
  }, []);

  const loadExplorer = async () => {
    setLoading(true);
    try {
      const posts = await fetchFeed("latest", user?.id || null);
      
      let tips: any[] = [];
      try {
        const tipsRes = await fetch(`${API_BASE}/tips?limit=100`);
        if (tipsRes.ok) {
          tips = await tipsRes.json();
        }
      } catch (err) {
        console.warn("Tips endpoint not available, skipping...");
      }

      const tipTxs: ExplorerTx[] = tips.map((t: any) => ({
        id: t.id,
        type: "tip",
        from_user_id: t.from_user_id,
        to_user_id: t.to_user_id,
        amount: Number(t.amount),
        tx_hash: t.tx_hash || null,
        created_at: t.created_at,
      }));

      const yapTxs: ExplorerTx[] = posts
        .filter((p) => p.onChain && !p.isSuperYap && !p.isBoosted)
        .map((p) => ({
          id: p.id,
          type: "yap",
          from_user_id: p.author.address,
          tx_hash: p.txHash || null,
          created_at: p.createdAt,
          content: p.content,
          author_display_name: p.author.displayName,
        }));

      const superYapTxs: ExplorerTx[] = posts
        .filter((p) => p.isSuperYap && p.txHash)
        .map((p) => ({
          id: p.id,
          type: "super_yap",
          from_user_id: p.author.address,
          tx_hash: p.txHash || null,
          created_at: p.createdAt,
          content: p.content,
          author_display_name: p.author.displayName,
        }));

      const boostTxs: ExplorerTx[] = posts
        .filter((p) => p.isBoosted && p.txHash)
        .map((p) => ({
          id: p.id,
          type: "boost",
          from_user_id: p.author.address,
          tx_hash: p.txHash || null,
          created_at: p.createdAt,
          content: p.content,
          author_display_name: p.author.displayName,
        }));

      const allTxs = [...tipTxs, ...yapTxs, ...superYapTxs, ...boostTxs];
      allTxs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const totalTips = tipTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalSuperYaps = superYapTxs.length;
      const totalBoosts = boostTxs.length;
      const totalYaps = yapTxs.length;

      setTxs(allTxs.slice(0, 50));
      setStats({
        totalTips,
        totalSuperYaps,
        totalBoosts,
        totalYaps,
        totalQIE: totalTips,
      });
    } catch (err) {
      console.error("Explorer error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTxs = filter === "all" ? txs : txs.filter((tx) => tx.type === filter);

  const getTxMeta = (type: string) => {
    switch (type) {
      case "tip":
        return { icon: Coins, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Tip" };
      case "yap":
        return { icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-500/10", label: "Yap" };
      case "super_yap":
        return { icon: Sparkles, color: "text-amber-500", bg: "bg-amber-500/10", label: "Super Yap" };
      case "boost":
        return { icon: Zap, color: "text-purple-500", bg: "bg-purple-500/10", label: "Boost" };
      default:
        return { icon: Hash, color: "text-gray-500", bg: "bg-gray-500/10", label: "Transaction" };
    }
  };

  const formatTime = (dateString: string) => {
    return relativeTime(dateString);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.history.back()} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold">On-Chain Explorer</h1>
            <p className="text-xs text-muted-foreground">QIE Mainnet · Real-time on-chain activity</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard 
            icon={<Coins className="size-4 text-emerald-500" />}
            label="Total Tips"
            value={`${stats.totalTips.toFixed(4)} QIE`}
            sub="Total QIE tipped"
          />
          <StatCard 
            icon={<MessageCircle className="size-4 text-blue-500" />}
            label="On-Chain Yaps"
            value={stats.totalYaps.toString()}
            sub="Yaps recorded"
          />
          <StatCard 
            icon={<Sparkles className="size-4 text-amber-500" />}
            label="Super Yaps"
            value={stats.totalSuperYaps.toString()}
            sub="Premium Yaps"
          />
          <StatCard 
            icon={<Zap className="size-4 text-purple-500" />}
            label="Boosts"
            value={stats.totalBoosts.toString()}
            sub="Promoted posts"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { value: "all", label: "All Activity" },
            { value: "tip", label: "Tips" },
            { value: "yap", label: "Yaps" },
            { value: "super_yap", label: "Super Yaps" },
            { value: "boost", label: "Boosts" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200",
                filter === f.value 
                  ? "bg-foreground text-background shadow-sm" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border/50 bg-card/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-muted" />
                    <div className="space-y-2">
                      <div className="h-4 w-48 rounded bg-muted" />
                      <div className="h-3 w-24 rounded bg-muted" />
                    </div>
                  </div>
                  <div className="h-4 w-20 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTxs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-muted text-2xl">🔍</div>
            <h3 className="font-display text-lg font-semibold">No transactions found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first to make an on-chain transaction on QIE Mainnet!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTxs.map((tx, index) => {
              const meta = getTxMeta(tx.type);
              const Icon = meta.icon;
              
              return (
                <div 
                  key={`${tx.id}-${index}`} 
                  className="group rounded-xl border border-border/50 bg-card/50 p-4 transition-all hover:bg-card/80 hover:border-border"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={cn("rounded-full p-2 shrink-0", meta.bg)}>
                        <Icon className={cn("size-4", meta.color)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("text-xs font-semibold uppercase tracking-wider", meta.color)}>
                            {meta.label}
                          </span>
                          {tx.tx_hash && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                              <Hash className="size-2.5" />
                              {tx.tx_hash.slice(0, 6)}...{tx.tx_hash.slice(-4)}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm font-medium mt-0.5 truncate">
                          {tx.type === "tip" 
                            ? `💎 ${tx.from_user_id ? shortAddr(tx.from_user_id) : 'Unknown'} → ${tx.to_user_id ? shortAddr(tx.to_user_id) : 'Unknown'}`
                            : `✍️ ${tx.author_display_name || shortAddr(tx.from_user_id)}`
                          }
                        </p>
                        
                        {tx.content && (
                          <p className="text-xs text-muted-foreground truncate max-w-md mt-0.5">
                            "{tx.content.slice(0, 60)}..."
                          </p>
                        )}
                        
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatTime(tx.created_at)}
                          </span>
                          {tx.amount && tx.amount > 0 && (
                            <span className="flex items-center gap-1 text-emerald-500 font-medium">
                              <Coins className="size-3" />
                              +{tx.amount.toFixed(4)} QIE
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {tx.tx_hash && (
                        <a
                          href={`https://mainnet.qie.digital/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                          title="View on QIE Explorer"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-4 text-center hover:bg-card/80 transition-colors">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-sm font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
      <p className="text-[9px] text-muted-foreground/60 mt-0.5">{sub}</p>
    </div>
  );
}
