import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Avatar } from "@/components/avatar-img";
import { API_BASE } from "@/lib/posts";
import { cn } from "@/lib/utils";
import { ArrowLeft, Code, Star, Heart, MessageCircle, GitFork, ExternalLink } from "lucide-react";

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
  id: string;
  name: string;
  description: string;
  contract_address: string;
  repo_url: string;
  status: string;
  author: {
    id: string;
    display_name: string;
    avatar_seed: string;
  };
  likes: number;
  comments: number;
  created_at: string;
}

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetch(`${API_BASE}/projects`);
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
    loadProjects();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <div className="mx-auto max-w-4xl px-6 py-6 md:px-8 lg:px-10">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="font-display text-2xl font-bold">Projects</h1>
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
            <p className="text-sm text-muted-foreground">Be the first to deploy a project on QIE Mainnet!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                to="/project/$id"
                params={{ id: project.id }}
                className="block rounded-xl border border-border/50 bg-card/50 p-4 transition-colors hover:bg-card/80 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar seed={project.author?.avatar_seed} size={40} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{project.name}</h3>
                        <span className={cn(
                          "text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full",
                          project.status === 'active' ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground"
                        )}>
                          {project.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        by {project.author?.display_name || 'Unknown'} · {new Date(project.created_at).toLocaleDateString()}
                      </p>
                      {project.description && (
                        <p className="text-sm text-foreground/80 mt-2 line-clamp-2">{project.description}</p>
                      )}
                      {project.contract_address && (
                        <p className="text-xs font-mono text-muted-foreground mt-1">
                          {project.contract_address.slice(0, 10)}...{project.contract_address.slice(-6)}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="size-3" /> {project.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="size-3" /> {project.comments || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {project.repo_url && (
                      <a
                        href={project.repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
