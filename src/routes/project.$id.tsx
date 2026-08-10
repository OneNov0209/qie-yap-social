import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Avatar } from "@/components/avatar-img";
import { API_BASE } from "@/lib/posts";
import { ArrowLeft, Heart, MessageCircle, GitFork, Code, Calendar, User, X, CheckCircle2, ExternalLink, Copy, FileCode, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-store";

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
  likes_count: number;
  forks_count: number;
  isScanned?: boolean;
}

function ProjectDetailPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [forked, setForked] = useState(false);
  const [forksCount, setForksCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isViewingTx, setIsViewingTx] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadProject = async () => {
    try {
      // Ambil data project
      const res = await fetch(`${API_BASE}/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        setLikeCount(Number(data.likes_count) || 0);
        setForksCount(Number(data.forks_count) || 0);
      }
      
      // Ambil komentar
      const commentsRes = await fetch(`${API_BASE}/projects/${id}/comments`);
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData);
      }
    } catch (err) {
      console.error("Error loading project:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  const toggleLike = async () => {
    if (!user) return toast.error("Connect your wallet to like");
    if (!project) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);
    try {
      const res = await fetch(`${API_BASE}/projects/${project.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (!res.ok) throw new Error("Like failed");
      const data = await res.json();
      // Ambil count terbaru dari respons agar sinkron
      const newCount = data.count !== undefined ? data.count : likeCount;
      setLikeCount(newCount);
      toast.success(data.action === 'liked' ? "Liked!" : "Unliked");
    } catch (err) {
      setLiked(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
      toast.error("Failed to update like");
    }
  };

  const toggleFork = async () => {
    if (!user) return toast.error("Connect your wallet to fork");
    if (!project) return;
    const wasForked = forked;
    setForked(!wasForked);
    setForksCount(prev => wasForked ? prev - 1 : prev + 1);
    try {
      const res = await fetch(`${API_BASE}/projects/${project.id}/fork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (!res.ok) throw new Error("Fork failed");
      const data = await res.json();
      if (data.action === 'forked' && data.project) {
        toast.success(`Forked! New project created: ${data.project.name}`);
        // Redirect ke project baru
        router.navigate({ to: "/project/$id", params: { id: data.project.tx_hash || data.project.id } });
      } else {
        const newCount = data.count !== undefined ? data.count : forksCount;
        setForksCount(newCount);
        toast.success(data.action === 'forked' ? "Forked!" : "Unforked");
      }
    } catch (err) {
      setForked(wasForked);
      setForksCount(prev => wasForked ? prev + 1 : prev - 1);
      toast.error("Failed to update fork");
    }
  };

  const submitComment = async () => {
    if (!user) return toast.error("Connect your wallet to comment");
    if (!project || !newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`${API_BASE}/projects/${project.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          content: newComment.trim(),
        }),
      });
      if (!res.ok) throw new Error("Comment failed");
      const data = await res.json();
      setComments(prev => [data, ...prev]);
      setNewComment("");
      toast.success("Comment posted!");
    } catch (err) {
      toast.error("Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
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
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar seed={project.author?.avatar_seed} size={56} />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-2xl font-bold">{project.name}</h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                    {project.status}
                  </span>
                  {project.isScanned && (
                    <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      Auto-detected
                    </span>
                  )}
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

          {project.description && (
            <div className="mt-6">
              <p className="text-foreground/80 leading-relaxed">{project.description}</p>
            </div>
          )}

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
              <span>{likeCount}</span>
            </button>
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand transition-colors">
              <MessageCircle className="size-4" />
              <span>{comments.length}</span>
            </button>
            <button
              onClick={toggleFork}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand transition-colors"
            >
              <GitFork className={cn("size-4", forked && "text-brand")} />
              <span>{forksCount}</span>
            </button>

            {/* ✅ PERBAIKAN: Cegah klik jika tx_hash null */}
            <button
              onClick={() => setIsViewingTx(true)}
              disabled={!project.tx_hash || project.tx_hash === 'null' || project.tx_hash === ''}
              className={cn(
                "ml-auto flex items-center gap-1.5 text-sm transition-colors",
                (!project.tx_hash || project.tx_hash === 'null' || project.tx_hash === '')
                  ? "text-muted-foreground/50 cursor-not-allowed"
                  : "text-muted-foreground hover:text-brand"
              )}
            >
              <FileCode className="size-4" />
              <span>
                {(!project.tx_hash || project.tx_hash === 'null' || project.tx_hash === '') 
                  ? "No Tx Hash" 
                  : "View Transaction"}
              </span>
            </button>
          </div>
        </div>

        {/* Comment Section */}
        <div className="mt-8">
          <h3 className="font-semibold mb-4">Comments ({comments.length})</h3>
          {user && (
            <div className="flex gap-2 mb-6">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && submitComment()}
              />
              <button
                onClick={submitComment}
                disabled={submittingComment || !newComment.trim()}
                className="px-4 py-2 rounded-full bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50"
              >
                {submittingComment ? <Loader2 className="size-4 animate-spin" /> : "Post"}
              </button>
            </div>
          )}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-3 rounded-xl border border-border/30 bg-muted/10">
                  <Avatar seed={comment.author?.avatar_seed || "default"} size={32} />
                  <div>
                    <p className="text-sm font-medium">{comment.author?.display_name || 'Unknown'}</p>
                    <p className="text-sm text-foreground/80">{comment.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal - Mengambil data dari Backend (API) */}
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

// ============================================
// KOMPONEN TRANSACTION DETAIL VIEWER (MEMANGGIL API)
// ============================================
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

  useEffect(() => {
    const fetchTx = async () => {
      try {
        // Panggil endpoint baru di Backend
        const res = await fetch(`${API_BASE}/tx/${txHash}`);
        if (!res.ok) throw new Error("Failed to fetch transaction data");
        const data = await res.json();
        setTxData(data);
      } catch (err) {
        console.error("Error fetching transaction:", err);
        toast.error("Failed to load transaction details");
      } finally {
        setLoading(false);
      }
    };
    fetchTx();
  }, [txHash]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied!"));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!txData) {
    return <div className="text-center text-muted-foreground py-8">Transaction data not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/30 pb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Code className="size-5 text-brand" />
          Transaction Details
        </h3>
        <button onClick={onClose} className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <X className="size-5" />
        </button>
      </div>

      {/* Grid Data Utama */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border/30 bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Value</p>
          <p className="text-sm font-medium">{txData.value ? (Number(txData.value) / 1e18).toFixed(4) : '0'} QIE</p>
        </div>
        <div className="rounded-xl border border-border/30 bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Tx Fee</p>
          <p className="text-sm font-medium">
            {txData.gasUsed && txData.gasPrice 
              ? (Number(txData.gasUsed) * Number(txData.gasPrice) / 1e18).toFixed(6) 
              : 'N/A'} QIE
          </p>
        </div>
        <div className="rounded-xl border border-border/30 bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Block</p>
          <p className="text-sm font-medium">#{txData.blockNumber || 'Pending'}</p>
        </div>
        <div className="rounded-xl border border-border/30 bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Status</p>
          <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-500">
            <CheckCircle2 className="size-4" />
            {txData.status || 'Success'}
          </div>
        </div>
      </div>

      {/* Tx Hash */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Transaction Hash</p>
        <div className="flex items-center gap-2 bg-muted/30 rounded-xl p-3 border border-border/30">
          <code className="text-xs font-mono break-all flex-1">{txHash}</code>
          <button onClick={() => copyToClipboard(txHash)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Copy className="size-4" />
          </button>
        </div>
      </div>

      {/* From / To */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">From</p>
          <div className="flex items-center gap-2 bg-muted/30 rounded-xl p-3 border border-border/30">
            <code className="text-xs font-mono break-all">{txData.from}</code>
            <button onClick={() => copyToClipboard(txData.from)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
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
          </div>
        </div>
      </div>

      {/* Gas Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Gas Price</p>
          <p className="text-sm font-medium">{txData.gasPrice ? (Number(txData.gasPrice) / 1e18).toFixed(6) : 'N/A'} QIE</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Gas Limit</p>
          <p className="text-sm font-medium">{txData.gasLimit || 'N/A'}</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Gas Used</p>
          <p className="text-sm font-medium">{txData.gasUsed || 'N/A'}</p>
        </div>
      </div>

      {/* Input Data / Contract Code - PERBAIKAN TAG DILAKUKAN DI SINI */}
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

      {/* Contract Address (jika ada) */}
      {contractAddress && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Contract Created</p>
          <div className="flex items-center gap-2 bg-muted/30 rounded-xl p-3 border border-border/30">
            <code className="text-xs font-mono break-all">{contractAddress}</code>
            <button onClick={() => copyToClipboard(contractAddress)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
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
