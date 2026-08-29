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
  const [activeTab, setActiveTab] = useState<"transfers" | "holders" | "contract">("transfers");

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
            <div className="flex gap-4 border-b border-border/30">
              <button
                onClick={() => setActiveTab("transfers")}
                className={cn(
                  "text-sm font-semibold pb-3",
                  activeTab === "transfers" ? "text-brand border-b-2 border-brand" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Token transfers
              </button>
              <button
                onClick={() => setActiveTab("holders")}
                className={cn(
                  "text-sm font-semibold pb-3",
                  activeTab === "holders" ? "text-brand border-b-2 border-brand" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Holders
              </button>
              <button
                onClick={() => setActiveTab("contract")}
                className={cn(
                  "text-sm font-semibold pb-3",
                  activeTab === "contract" ? "text-brand border-b-2 border-brand" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Contract
              </button>
            </div>

            {/* Tab Content: Transfers */}
            {activeTab === "transfers" && (
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
            )}

            {/* Tab Content: Holders */}
            {activeTab === "holders" && (
              <div className="mt-4">
                <div className="rounded-xl border border-border/30 bg-muted/10 p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="pb-2">Address</th>
                        <th className="pb-2 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border/20">
                        <td className="py-2 font-mono">0x193...5cf0</td>
                        <td className="py-2 text-right">0.0000299</td>
                      </tr>
                      <tr className="border-t border-border/20">
                        <td className="py-2 font-mono">0x090...a232</td>
                        <td className="py-2 text-right">0.02997</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab Content: Contract */}
            {activeTab === "contract" && (
              <div className="mt-4">
                <div className="rounded-xl border border-border/30 bg-muted/10 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-emerald-500">Contract Source Code Verified</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Contract name</p>
                      <p className="font-medium">WrappedNative</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Compiler version</p>
                      <p className="font-medium">v0.8.20+commit.a1b79de6</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">EVM Version</p>
                      <p className="font-medium">Paris</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">License</p>
                      <p className="font-medium">MIT</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Optimization enabled</p>
                      <p className="font-medium">true</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Optimization runs</p>
                      <p className="font-medium">200</p>
                    </div>
                  </div>

                  {/* Constructor Arguments */}
                  <div className="mt-4">
                    <p className="text-sm font-semibold mb-2">Constructor Arguments</p>
                    <div className="rounded-lg bg-background/50 p-3 font-mono text-xs">
                      <p>0x0000000000000000000000000000000000000000000000000000000000000000</p>
                      <p>0x0000000000000000000000000000000000000000000000000000000000000000</p>
                      <p>0000000000000000000000000000000000000000000000000000000000000000</p>
                      <p>0000000000000000000000000000000000000000000000000000000000000000</p>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Arg [0] name (string): Wrapped ETH
                      Arg [1] symbol (string): WETH
                    </p>
                  </div>

                  {/* Contract Source Code */}
                  <div className="mt-4">
                    <p className="text-sm font-semibold mb-2">Contract Source Code (Solidity)</p>
                    <div className="rounded-lg bg-background/50 p-3 font-mono text-xs overflow-x-auto">
                      <pre>{`// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WrappedNative is ERC20, Ownable {
    constructor() ERC20("Wrapped ETH", "WETH") {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}`}</pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
