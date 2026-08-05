import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Avatar } from "@/components/avatar-img";
import { API_BASE } from "@/lib/posts";
import { cn } from "@/lib/utils";
import { ArrowLeft, Code, Heart, MessageCircle, GitFork, ExternalLink, Calendar, Loader2 } from "lucide-react";
import { scanNewContracts } from "@/lib/qie-chain";
import { formatEther } from "viem";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — QIE Yap" },
      { name: "description", content: "Discover projects built on QIE Mainnet." },
    ],
  }),
  component: ProjectsPage,
});

interface ScannedContract {
  txHash: string;
  contractAddress: string;
  from: string;
  blockNumber: bigint;
  timestamp: bigint;
}

function ProjectsPage() {
  const [contracts, setContracts] = useState<ScannedContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const loadContracts = async () => {
    setLoading(true);
    try {
      // Scan 100 blok terakhir dari QIE Mainnet
      const data = await scanNewContracts(100);
      setContracts(data);
    } catch (err) {
      console.error("Error loading contracts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const handleScanMore = async () => {
    setScanning(true);
    await loadContracts();
    setScanning(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <div className="mx-auto max-w-4xl px-6 py-6 md:px-8 lg:px-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-5" />
            </Link>
            <h1 className="font-display text-2xl font-bold">Live Contracts</h1>
          </div>
          <button
            onClick={handleScanMore}
            disabled={scanning}
            className="px-4 py-2 rounded-full bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50"
          >
            {scanning ? <Loader2 className="size-4 animate-spin" /> : "Scan New"}
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border/50 bg-card/50 p-4">
                <div className="h-6 w-48 bg-muted rounded mb-2" />
                <div className="h-4 w-full bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : contracts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <Code className="mx-auto size-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold">No contracts found</h3>
            <p className="text-sm text-muted-foreground">No new contracts deployed in the last 100 blocks.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract, index) => (
              <div
                key={contract.txHash}
                className="rounded-xl border border-border/50 bg-card/50 p-4 transition-colors hover:bg-card/80 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Code className="size-4 text-brand" />
                      <span className="font-semibold">Contract #{index + 1}</span>
                      <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                        New
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Deployed by {contract.from.slice(0, 6)}...{contract.from.slice(-4)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {new Date(Number(contract.timestamp) * 1000).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        Block #{contract.blockNumber.toString()}
                      </span>
                    </div>
                    <div className="mt-3 p-2 rounded-lg bg-muted/30 border border-border/20">
                      <p className="text-[10px] text-muted-foreground mb-0.5">Contract Address</p>
                      <code className="text-xs font-mono text-foreground/80 break-all">
                        {contract.contractAddress}
                      </code>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Link
                      to="/project/$id"
                      params={{ id: contract.txHash }}
                      className="text-sm text-brand hover:text-brand/80 font-medium"
                    >
                      View Details →
                    </Link>
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
