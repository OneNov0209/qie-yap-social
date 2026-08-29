import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { API_BASE } from "@/lib/posts";
import { ArrowLeft, Coins, Copy, ExternalLink, Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/token/$id")({
  component: TokenDetailPage,
});

interface TokenDetail {
  id: string;
  symbol: string;
  name: string;
  totalSupply: string;
  decimals?: number;
  price?: number;
}

function TokenDetailPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [token, setToken] = useState<TokenDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        // 1. Ambil data token dari GraphQL QIEDex
        const res = await fetch(`${API_BASE}/qiedex/tokens`);
        if (res.ok) {
          const data = await res.json();
          const found = data.find((t: any) => t.id === id || t.symbol === id);
          if (found) {
            setToken({
              id: found.id,
              symbol: found.symbol,
              name: found.name,
              totalSupply: found.totalSupply,
            });
          }
        }
      } catch (err) {
        console.error("Error fetching token:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchToken();
  }, [id]);

  const formatSupply = (supply: string) => {
    const num = Number(supply);
    if (num >= 1_000_000_000_000_000_000) {
      return (num / 1_000_000_000_000_000_000).toFixed(2) + " QIE";
    }
    return num.toLocaleString();
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address).then(() => toast.success("Copied!"));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-12">
        <Header />
        <div className="mx-auto max-w-4xl px-4 py-20">
          <div className="flex justify-center">
            <Loader2 className="size-8 animate-spin text-brand" />
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-12">
        <Header />
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Token not found</h1>
          <p className="mt-2 text-muted-foreground">The token you're looking for doesn't exist.</p>
          <Link to="/tokens" className="mt-6 inline-block text-brand hover:underline">← Back to Tokens</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-6">
        <button onClick={() => router.history.back()} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Back to Tokens
        </button>

        <div className="rounded-2xl border border-border/50 bg-card/50 p-6 shadow-sm">
          {/* Header Token */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-muted p-3">
                <Coins className="size-8 text-brand" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold">{token.name}</h1>
                  <span className="text-sm text-muted-foreground">({token.symbol})</span>
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">QIE-20</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <code className="text-xs font-mono text-muted-foreground break-all">{token.id}</code>
                  <button onClick={() => copyAddress(token.id)} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Copy className="size-3.5" />
                  </button>
                  <a
                    href={`https://mainnet.qie.digital/token/${token.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Statistik Token */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="text-sm font-bold">$2,441.04</p>
              <p className="text-[10px] text-emerald-500">+0.5%</p>
            </div>
            <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Max Total Supply</p>
              <p className="text-sm font-bold">{formatSupply(token.totalSupply)}</p>
            </div>
            <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Holders</p>
              <p className="text-sm font-bold">2</p>
            </div>
            <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Transfers</p>
              <p className="text-sm font-bold">3</p>
            </div>
          </div>

          {/* Tab */}
          <div className="mt-6 border-t border-border/30 pt-4">
            <div className="flex gap-4">
              <button className="text-sm font-semibold text-brand border-b-2 border-brand pb-2">Token transfers</button>
              <button className="text-sm text-muted-foreground pb-2 hover:text-foreground">Holders</button>
              <button className="text-sm text-muted-foreground pb-2 hover:text-foreground">Contract</button>
            </div>

            {/* Transfer List */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/10 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">0x193...5cf0</span>
                  <span className="text-xs text-muted-foreground">1mo ago</span>
                  <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-500">burn</span>
                </div>
                <span className="text-sm font-medium">0.0000299</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/10 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">0x193...5cf0</span>
                  <span className="text-xs text-muted-foreground">1mo ago</span>
                  <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-500">burn</span>
                </div>
                <span className="text-sm font-medium">0.0299</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/10 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">0x090...a232</span>
                  <span className="text-xs text-muted-foreground">1mo ago</span>
                  <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500">mint</span>
                </div>
                <span className="text-sm font-medium">0.02997</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
