import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { API_BASE } from "@/lib/posts";
import { ArrowLeft, Coins, Loader2, TrendingUp, Search, X } from "lucide-react";

export const Route = createFileRoute("/tokens")({
  component: TokensPage,
});

interface QIEDexToken {
  id: string;
  symbol: string;
  name: string;
  totalSupply: string;
  icon_url?: string;
  real_supply?: string;
  real_decimals?: number;
}

function TokensPage() {
  const router = useRouter();
  const [tokens, setTokens] = useState<QIEDexToken[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<QIEDexToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const res = await fetch(`${API_BASE}/qiedex/tokens`);
        if (res.ok) {
          const data: QIEDexToken[] = await res.json();
          
          setTokens(data);
          setFilteredTokens(data);

          const updatedTokens = await Promise.all(
            data.map(async (token) => {
              try {
                const expRes = await fetch(`https://mainnet.qie.digital/api/v2/tokens/${token.id}`);
                if (expRes.ok) {
                  const expData = await expRes.json();
                  return { 
                    ...token, 
                    real_supply: expData.total_supply,
                    real_decimals: Number(expData.decimals)
                  };
                }
              } catch (e) {
                console.error("Failed to fetch explorer data for", token.symbol, e);
              }
              return token;
            })
          );

          setTokens(updatedTokens);
          setFilteredTokens(updatedTokens);
        }
      } catch (err) {
        console.error("Error fetching tokens:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTokens();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredTokens(tokens);
    } else {
      const lower = search.toLowerCase();
      setFilteredTokens(tokens.filter(t => 
        t.symbol.toLowerCase().includes(lower) || 
        t.name.toLowerCase().includes(lower) ||
        t.id.toLowerCase().includes(lower)
      ));
    }
  }, [search, tokens]);

  const formatSupply = (supply: string | undefined, decimals: number | undefined) => {
    if (!supply) return "0";
    if (decimals === undefined) return "-";

    const raw = Number(supply);
    const dec = Number(decimals);
    const realVal = raw / Math.pow(10, dec);
    
    return realVal.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12 overflow-x-hidden">
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

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, symbol, or address..."
            className="w-full rounded-xl border border-border/50 bg-card/50 pl-9 pr-9 py-2.5 text-sm outline-none focus:border-brand transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-muted">
              <X className="size-3.5" />
            </button>
          )}
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
          ) : filteredTokens.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <Coins className="mx-auto size-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold">No tokens found</h3>
              <p className="text-sm text-muted-foreground">{search ? "Try a different search term." : "No active tokens on QIEDEX yet."}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTokens.map((token) => {
                return (
                  <div key={token.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-card/50 p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {token.icon_url ? (
                        <img src={token.icon_url} alt={token.name} className="size-10 rounded-full shrink-0" />
                      ) : (
                        <div className="rounded-full bg-muted p-2 shrink-0">
                          <Coins className="size-4 text-brand" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{token.symbol}</p>
                        <p className="text-xs text-muted-foreground truncate">{token.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {token.real_supply ? formatSupply(token.real_supply, token.real_decimals) : formatSupply(token.totalSupply, 18)}
                        </p>
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
