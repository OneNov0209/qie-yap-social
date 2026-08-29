import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { API_BASE } from "@/lib/posts";
import { ArrowLeft, Coins, Loader2, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/tokens")({
  component: TokensPage,
});

interface QIEDexToken {
  id: string;
  symbol: string;
  name: string;
  totalSupply: string;
  icon_url?: string;
}

function TokensPage() {
  const router = useRouter();
  const [tokens, setTokens] = useState<QIEDexToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const res = await fetch(`${API_BASE}/qiedex/tokens`);
        if (res.ok) {
          const data = await res.json();
          setTokens(data);
        }
      } catch (err) {
        console.error("Error fetching tokens:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTokens();
  }, []);

  const formatSupply = (supply: string) => {
    const num = Number(supply);
    if (num >= 1_000_000_000_000_000_000) {
      return (num / 1_000_000_000_000_000_000).toFixed(2) + " QIE";
    }
    return num.toLocaleString();
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
            <h1 className="font-display text-2xl font-bold">QIEDex Tokens</h1>
            <p className="text-xs text-muted-foreground">Explore tokens on QIEDex</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="size-5 text-brand" />
            <h2 className="font-semibold text-sm">Token List</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="size-8 animate-spin text-brand" />
            </div>
          ) : tokens.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <Coins className="mx-auto size-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold">No tokens found</h3>
              <p className="text-sm text-muted-foreground">Try refreshing the page</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tokens.map((token) => (
                <div key={token.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-card/50 p-3">
                  <div className="flex items-center gap-3">
                    {token.icon_url ? (
                      <img src={token.icon_url} alt={token.name} className="size-10 rounded-full" />
                    ) : (
                      <div className="rounded-full bg-muted p-2">
                        <Coins className="size-4 text-brand" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold">{token.symbol}</p>
                      <p className="text-xs text-muted-foreground">{token.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatSupply(token.totalSupply)}</p>
                      <p className="text-[10px] text-muted-foreground">Supply</p>
                    </div>
                    <Link
                      to="/token/$id"
                      params={{ id: token.id }}
                      className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand hover:bg-brand/20 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
