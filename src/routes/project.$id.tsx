import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Avatar } from "@/components/avatar-img";
import { API_BASE } from "@/lib/posts";
import { ArrowLeft, Heart, MessageCircle, GitFork, Code, Calendar, User, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getContractCode } from "@/lib/qie-chain";

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

function ProjectDetailPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [isViewingCode, setIsViewingCode] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [bytecode, setBytecode] = useState<string | null>(null);

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

  const handleViewCode = async () => {
    if (!project?.contract_address) return;
    setIsViewingCode(true);
    setCodeLoading(true);
    try {
      const code = await getContractCode(project.contract_address as `0x${string}`);
      if (code) {
        setBytecode(code);
      } else {
        toast.error("No code found for this contract");
      }
    } catch (err) {
      console.error("Error fetching code:", err);
      toast.error("Failed to fetch contract code");
    } finally {
      setCodeLoading(false);
    }
  };

  const closeCodeViewer = () => {
    setIsViewingCode(false);
    setBytecode(null);
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
            {/* ✅ Tombol View Code Internal */}
            <button
              onClick={handleViewCode}
              className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand transition-colors"
            >
              <Code className="size-4" />
              <span>View Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Code Viewer Modal (Internal) */}
      {isViewingCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl max-h-[80vh] bg-card rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-border/30 px-6 py-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Code className="size-5 text-brand" />
                Contract Code
              </h3>
              <button
                onClick={closeCodeViewer}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-muted/30">
              {codeLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent" />
                </div>
              ) : bytecode ? (
                <div className="space-y-4">
                  <div className="text-xs text-muted-foreground mb-2">Bytecode (Hex)</div>
                  <div className="bg-background/50 rounded-xl p-4 border border-border/30">
                    <code className="font-mono text-xs break-all whitespace-pre-wrap text-foreground/80 select-all">
                      {bytecode}
                    </code>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No bytecode found for this contract
                </div>
              )}
            </div>
            <div className="border-t border-border/30 px-6 py-4 flex justify-end">
              <button
                onClick={closeCodeViewer}
                className="px-4 py-2 bg-brand text-white rounded-full hover:bg-brand/90 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
