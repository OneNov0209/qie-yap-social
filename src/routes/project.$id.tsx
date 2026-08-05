import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Avatar } from "@/components/avatar-img";
import { API_BASE } from "@/lib/posts";
import { ArrowLeft, Heart, MessageCircle, GitFork, Code, Calendar, User, X, CheckCircle2, ExternalLink, Copy, FileCode } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { qiePublicClient, QIE_CHAIN } from "@/lib/qie-chain";
import { formatEther } from "viem";

export const Route = createFileRoute("/project/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Project — QIE Yap` },
      { name: "description", content: `View project details on QIE Yap.` },
    ],
  }),
  component: ProjectDetailPage,
});

interface Project {
  id: string;
  name: string;
  description: string;
  contract_address: string;
  repo_url: string;
  status: string;
  tx_hash: string;
  created_at: string;
  author: {
    id: string;
    display_name: string;
    avatar_seed: string;
  };
  likes: number;
  comments: number;
}

// Komponen Transaction Detail Viewer (Internal)
function TransactionDetailViewer({ 
  txHash, 
  contractAddress, 
  onClose 
}: { 
  txHash: string; 
  contractAddress: string; 
  onClose: () => void;
}) {
  const [txData, setTxData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<any>(null);

  useEffect(() => {
    const fetchTx = async () => {
      try {
        // Ambil data transaksi dari RPC
        const tx = await qiePublicClient.getTransaction({ hash: txHash as `0x${string}` });
        const receipt = await qiePublicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
        setTxData(tx);
        setReceipt(receipt);
      } catch (err) {
        console.error("Error fetching transaction:", err);
        toast.error("Failed to load transaction details");
      } finally {
        setLoading(false);
      }
    };
    fetchTx();
  }, [txHash]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!txData || !receipt) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Transaction data not found
      </div>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard!");
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Transaction */}
      <div className="flex items-center justify-between border-b border-border/30 pb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Code className="size-5 text-brand" />
          Transaction Details
        </h3>
        <button
          onClick={onClose}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Status & Value */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border/30 bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Value</p>
          <p className="text-sm font-medium">{formatEther(txData.value)} QIE</p>
        </div>
        <div className="rounded-xl border border-border/30 bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Tx Fee</p>
          <p className="text-sm font-medium">{formatEther(receipt.gasUsed * txData.gasPrice)} QIE</p>
        </div>
        <div className="rounded-xl border border-border/30 bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Block</p>
          <p className="text-sm font-medium">#{receipt.blockNumber.toString()}</p>
        </div>
        <div className="rounded-xl border border-border/30 bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Status</p>
          <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-500">
            <CheckCircle2 className="size-4" />
            {receipt.status === '0x1' ? 'Success' : 'Failed'}
          </div>
        </div>
      </div>

      {/* Transaction Hash */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Transaction Hash</p>
        <div className="flex items-center gap-2 bg-muted/30 rounded-xl p-3 border border-border/30">
          <code className="text-xs font-mono break-all flex-1">{txHash}</code>
          <button
            onClick={() => copyToClipboard(txHash)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Copy className="size-4" />
          </button>
        </div>
      </div>

      {/* From & To */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">From</p>
          <div className="flex items-center gap-2 bg-muted/30 rounded-xl p-3 border border-border/30">
            <code className="text-xs font-mono break-all">{txData.from}</code>
            <button
              onClick={() => copyToClipboard(txData.from)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Copy className="size-4" />
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">To</p>
          <div className="flex items-center gap-2 bg-muted/30 rounded-xl p-3 border border-border/30">
            <code className="text-xs font-mono break-all">
              {txData.to || 'Contract Creation'}
            </code>
            {txData.to && (
              <button
                onClick={() => copyToClipboard(txData.to)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Copy className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gas Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Gas Price</p>
          <p className="text-sm font-medium">{formatEther(txData.gasPrice)} QIE</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Gas Limit</p>
          <p className="text-sm font-medium">{txData.gas.toString()}</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Gas Used</p>
          <p className="text-sm font-medium">{receipt.gasUsed.toString()}</p>
        </div>
      </div>

      {/* Input Data (Bytecode) */}
      {txData.input && txData.input !== '0x' && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Input Data (Contract Code)</p>
          <div className="bg-background/50 rounded-xl p-4 border border-border/30 max-h-48 overflow-y-auto">
            <code className="font-mono text-[10px] break-all whitespace-pre-wrap text-foreground/80 select-all">
              {txData.input}
            </code>
          </div>
        </div>
      )}

      {/* Contract Created */}
      {contractAddress && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Contract Created</p>
          <div className="flex items-center gap-2 bg-muted/30 rounded-xl p-3 border border-border/30">
            <code className="text-xs font-mono break-all">{contractAddress}</code>
            <button
              onClick={() => copyToClipboard(contractAddress)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Copy className="size-4" />
            </button>
            <a
              href={`https://mainnet.qie.digital/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ExternalLink className="size-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Page Component
function ProjectDetailPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [isViewingTx, setIsViewingTx] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const res = await fetch(`${API_BASE}/projects/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProject(data);
        }
      } catch (err) {
        console.error("Error loading project:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [id]);

  const toggleLike = async () => {
    if (!project) return;
    setLiked(!liked);
    toast.success(liked ? "Unliked" : "Liked!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-12">
        <Header />
        <div className="mx-auto max-w-4xl px-6 py-6 md:px-8 lg:px-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted/50 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-12">
        <Header />
        <div className="mx-auto max-w-4xl px-6 py-6 md:px-8 lg:px-10 text-center">
          <h2 className="text-xl font-semibold">Project not found</h2>
          <p className="text-muted-foreground mt-2">The project you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <div className="mx-auto max-w-4xl px-6 py-6 md:px-8 lg:px-10">
        <button
          onClick={() => router.history.back()}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Projects
        </button>

        <div className="rounded-2xl border border-border/50 bg-card/50 p-6 shadow-sm">
          {/* Header Project */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar seed={project.author?.avatar_seed} size={56} />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-2xl font-bold">{project.name}</h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                    {project.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <User className="size-3.5" />
                    {project.author?.display_name || 'Unknown'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Deskripsi */}
          {project.description && (
            <div className="mt-6">
              <p className="text-foreground/80 leading-relaxed">{project.description}</p>
            </div>
          )}

          {/* Contract Address */}
          {project.contract_address && (
            <div className="mt-4 p-3 rounded-xl bg-muted/50 border border-border/30">
              <p className="text-xs text-muted-foreground mb-1">Contract Address</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-foreground/80">
                  {project.contract_address}
                </code>
                <CheckCircle2 className="size-4 text-emerald-500" />
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="mt-6 flex items-center gap-4 pt-4 border-t border-border/30">
            <button
              onClick={toggleLike}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand transition-colors"
            >
              <Heart className={cn("size-4", liked && "fill-current text-brand")} />
              <span>{liked ? project.likes + 1 : project.likes || 0}</span>
            </button>
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand transition-colors">
              <MessageCircle className="size-4" />
              <span>{project.comments || 0}</span>
            </button>
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand transition-colors">
              <GitFork className="size-4" />
              <span>Fork</span>
            </button>
            <button
              onClick={() => setIsViewingTx(true)}
              className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand transition-colors"
            >
              <FileCode className="size-4" />
              <span>View Transaction</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {isViewingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl max-h-[80vh] bg-card rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto p-6">
              <TransactionDetailViewer 
                txHash={project.tx_hash} 
                contractAddress={project.contract_address}
                onClose={() => setIsViewingTx(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
