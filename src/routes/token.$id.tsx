import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { API_BASE } from "@/lib/posts";
import { ArrowLeft, Coins, Copy, ExternalLink, Loader2, TrendingUp, CheckCircle2, Code2, FileJson, FileCode, Braces } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/token/$id")({
  component: TokenDetailPage,
});

function TokenDetailPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [token, setToken] = useState<any>(null);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [holders, setHolders] = useState<any[]>([]);
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"transfers" | "holders" | "contract">("transfers");
  const [contractTab, setContractTab] = useState<"code" | "abi" | "bytecode">("code");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tokenRes, transfersRes, holdersRes, contractRes] = await Promise.all([
          fetch(`${API_BASE}/explorer/token/${id}`),
          fetch(`${API_BASE}/explorer/token/${id}/transfers`),
          fetch(`${API_BASE}/explorer/token/${id}/holders`),
          fetch(`${API_BASE}/explorer/smart-contract/${id}`),
        ]);
        
        const tokenData = await tokenRes.json();
        const transfersData = await transfersRes.json();
        const holdersData = await holdersRes.json();
        const contractData = await contractRes.json();
        
        setToken(tokenData);
        setTransfers(transfersData.items || []);
        setHolders(holdersData.items || []);
        setContract(contractData);
      } catch (err) {
        console.error("Error fetching token:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const formatSupply = (supply: string) => {
    const num = Number(supply);
    if (num >= 1_000_000_000_000_000_000) {
      return (num / 1_000_000_000_000_000_000).toFixed(2) + " QIE";
    }
    return num.toLocaleString();
  };

  const formatValue = (value: string) => {
    const num = Number(value);
    if (num >= 1_000_000_000_000_000_000) {
      return (num / 1_000_000_000_000_000_000).toFixed(4);
    }
    return num.toFixed(4);
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address).then(() => toast.success("Copied!"));
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied!"));
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
              <div className="mt-4">
                {transfers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No transfers yet</p>
                ) : (
                  <div className="space-y-2">
                    {transfers.map((transfer: any, index: number) => (
                      <div key={index} className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/10 p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">{transfer.from?.hash?.slice(0, 6)}...{transfer.from?.hash?.slice(-4)}</span>
                          <span className="text-xs text-muted-foreground">→</span>
                          <span className="text-sm font-mono">{transfer.to?.hash?.slice(0, 6)}...{transfer.to?.hash?.slice(-4)}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatValue(transfer.total?.value || "0")}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(transfer.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab Content: Holders */}
            {activeTab === "holders" && (
              <div className="mt-4">
                {holders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No holders yet</p>
                ) : (
                  <div className="rounded-xl border border-border/30 bg-muted/10 p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="pb-2">Address</th>
                          <th className="pb-2 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holders.map((holder: any, index: number) => (
                          <tr key={index} className="border-t border-border/20">
                            <td className="py-2 font-mono">{holder.address?.hash?.slice(0, 6)}...{holder.address?.hash?.slice(-4)}</td>
                            <td className="py-2 text-right">{formatValue(holder.value || "0")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab Content: Contract */}
            {activeTab === "contract" && (
              <div className="mt-4">
                {contract ? (
                  <div className="rounded-xl border border-border/30 bg-muted/10 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      <span className="text-sm font-semibold text-emerald-500">Contract Source Code Verified</span>
                    </div>

                    {/* Contract Metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Contract name</p>
                        <p className="font-medium">{contract.name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Compiler version</p>
                        <p className="font-medium">{contract.compiler_version || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">EVM Version</p>
                        <p className="font-medium">{contract.evm_version || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">License</p>
                        <p className="font-medium">{contract.license_type || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Optimization enabled</p>
                        <p className="font-medium">{contract.optimization_enabled ? "true" : "false"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Optimization runs</p>
                        <p className="font-medium">{contract.optimization_runs ?? "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Verified at</p>
                        <p className="font-medium">{contract.verified_at ? new Date(contract.verified_at).toLocaleString() : "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Contract file path</p>
                        <p className="font-medium">{contract.file_path || "N/A"}</p>
                      </div>
                    </div>

                    {/* Sub-Tab: Code, ABI, ByteCode */}
                    <div className="mt-6 flex gap-3 border-b border-border/30 pb-2">
                      <button
                        onClick={() => setContractTab("code")}
                        className={cn(
                          "flex items-center gap-1.5 text-sm font-medium",
                          contractTab === "code" ? "text-brand" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Code2 className="size-4" />
                        Code
                      </button>
                      <button
                        onClick={() => setContractTab("abi")}
                        className={cn(
                          "flex items-center gap-1.5 text-sm font-medium",
                          contractTab === "abi" ? "text-brand" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <FileJson className="size-4" />
                        ABI
                      </button>
                      <button
                        onClick={() => setContractTab("bytecode")}
                        className={cn(
                          "flex items-center gap-1.5 text-sm font-medium",
                          contractTab === "bytecode" ? "text-brand" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <FileCode className="size-4" />
                        ByteCode
                      </button>
                    </div>

                    {/* Content: Code */}
                    {contractTab === "code" && (
                      <div className="mt-4">
                        {contract.source_code ? (
                          <div className="rounded-lg bg-background/50 p-3 font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                            <pre>{contract.source_code}</pre>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Contract source code not available</p>
                        )}
                      </div>
                    )}

                    {/* Content: ABI */}
                    {contractTab === "abi" && (
                      <div className="mt-4">
                        {contract.abi ? (
                          <div className="rounded-lg bg-background/50 p-3 font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                            <pre>{JSON.stringify(contract.abi, null, 2)}</pre>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">ABI not available</p>
                        )}
                      </div>
                    )}

                    {/* Content: ByteCode */}
                    {contractTab === "bytecode" && (
                      <div className="mt-4">
                        {contract.bytecode ? (
                          <div className="rounded-lg bg-background/50 p-3 font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                            <pre>{contract.bytecode}</pre>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">ByteCode not available</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Contract source code not available</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
