import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { API_BASE } from "@/lib/posts";
import { ArrowLeft, Coins, Copy, ExternalLink, Loader2, TrendingUp, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/token/$id")({
  component: TokenDetailPage,
});

function TokenDetailPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [token, setToken] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        // ✅ Ambil data token dari backend (Point 23)
        const res = await fetch(`${API_BASE}/explorer/token/${id}`);
        if (res.ok) {
          const data = await res.json();
          setToken(data);
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
                {token.icon_url ? (
                  <img src={token.icon_url} alt={token.name} className="size-8 rounded-full" />
                ) : (
                  <Coins className="size-8 text-brand" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold">{token.name}</h1>
                  <span className="text-sm text-muted-foreground">({token.symbol})</span>
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">QIE-20</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <code className="text-xs font-mono text-muted-foreground break-all">{token.address}</code>
                  <button onClick={() => copyAddress(token.address)} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Copy className="size-3.5" />
                  </button>
                  <a
                    href={`https://mainnet.qie.digital/token/${token.address}`}
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
              <p className="text-sm font-bold">{token.exchange_rate ? `$${token.exchange_rate.toFixed(2)}` : "N/A"}</p>
              <p className="text-[10px] text-muted-foreground">Market</p>
            </div>
            <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Max Total Supply</p>
              <p className="text-sm font-bold">{formatSupply(token.total_supply || "0")}</p>
            </div>
            <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Holders</p>
              <p className="text-sm font-bold">{token.holders ?? "N/A"}</p>
            </div>
            <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Transfers</p>
              <p className="text-sm font-bold">{token.transfers_count ?? "N/A"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
