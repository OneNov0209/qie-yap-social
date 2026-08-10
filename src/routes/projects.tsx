import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Avatar } from "@/components/avatar-img";
import { API_BASE } from "@/lib/posts";
import { cn } from "@/lib/utils";
import { ArrowLeft, Code, Heart, MessageCircle, GitFork, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — QIE Yap" },
      { name: "description", content: "Discover projects built on QIE Mainnet." },
    ],
  }),
  component: ProjectsPage,
});

interface Project {
  id: string | null;
  name: string;
  description: string;
  contract_address: string;
  tx_hash: string;
  status: string;
  created_at: string;
  author: {
    id: string;
    display_name: string;
    avatar_seed: string;
  } | null;
  likes: number;
  comments: number;
  forks: number;
  isScanned?: boolean;
}

function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/projects?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Error loading projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    const interval = setInterval(loadProjects, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please connect your wallet first");
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    setPublishing(true);
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_id: user.id,
          name: formData.get('name'),
          description: formData.get('description'),
          contract_address: formData.get('contract_address'),
          status: 'active'
        })
      });
      if (res.ok) {
        toast.success("Project published successfully!");
        setShowPublishModal(false);
        loadProjects();
      } else {
        toast.error("Failed to publish project");
      }
    } catch (err) {
      toast.error("Error publishing project");
    } finally {
      setPublishing(false);
    }
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
            <h1 className="font-display text-2xl font-bold">Projects</h1>
          </div>
          <button
            onClick={() => setShowPublishModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors"
          >
            <Plus className="size-4" />
            Publish Project
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
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <Code className="mx-auto size-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold">No projects yet</h3>
            <p className="text-sm text-muted-foreground">Be the first to deploy or publish a project on QIE Mainnet!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.tx_hash || project.id}
                className="rounded-xl border border-border/50 bg-card/50 p-4 transition-colors hover:bg-card/80 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar 
                      seed={project.author?.avatar_seed || "default"} 
                      size={40} 
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{project.name}</h3>
                        <span className={cn(
                          "text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full",
                          project.status === 'active' ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground"
                        )}>
                          {project.status}
                        </span>
                        {project.isScanned && (
                          <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            Auto-detected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        by {project.author?.display_name || 'Unknown'} · {new Date(project.created_at).toLocaleDateString()}
                      </p>
                      {project.description && (
                        <p className="text-sm text-foreground/80 mt-2 line-clamp-2">{project.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="size-3" /> {Number(project.likes) || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="size-3" /> {Number(project.comments) || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitFork className="size-3" /> {Number(project.forks) || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Link
                      to="/project/$id"
                      params={{ id: project.tx_hash || project.id }}
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

      {/* Publish Project Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 border border-border shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Publish New Project</h2>
            <form onSubmit={handlePublish} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Project Name *</label>
                <input
                  name="name"
                  required
                  className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-sm"
                  placeholder="e.g. My QIE dApp"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Contract Address *</label>
                <input
                  name="contract_address"
                  required
                  className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-sm font-mono"
                  placeholder="0x..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-sm resize-none"
                  placeholder="Brief description of your project..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="px-4 py-2 rounded-full border border-border/50 text-sm font-medium hover:bg-muted/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="px-4 py-2 rounded-full bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50"
                >
                  {publishing ? "Publishing..." : "Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
